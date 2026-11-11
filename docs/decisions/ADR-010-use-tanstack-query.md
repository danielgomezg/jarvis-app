# ADR-010: Uso de TanStack Query

## Estado

Aceptado

---

## Fecha

2026-11-04

---

## Contexto

El frontend necesita consumir la API de NestJS para operaciones de lectura y
escritura (perfil, y más adelante recetas, despensa y planificador). Con el
patrón anterior (`useState` + `useEffect` + Axios) cada llamada obligaba a
gestionar a mano:

- estado de carga, error y éxito
- cuándo volver a pedir los datos
- sincronizar la caché después de una escritura
- evitar peticiones duplicadas al montar o al cambiar de pestaña

Esto genera boilerplate repetido y errores sutiles (p. ej. datos viejos tras un
`PATCH`). Se necesita una solución de **server state** que no se confunda con el
estado global de UI (que ya cubre Zustand).

---

## Decisión

Se decidió usar **TanStack Query v5** (`@tanstack/react-query`) para el estado
del servidor en el frontend.

### Cómo se integra

1. **`QueryProvider`** (`providers/QueryProvider.tsx`) crea un único
   `QueryClient` por árbol (vía `useState`) con:
   - `staleTime: 5 min` — los datos se consideran frescos y no se re-piden de más
   - `refetchOnWindowFocus: false` — sin refetch automático al cambiar de pestaña
2. **Lecturas** con `useQuery` (ej. `useGetProfile` con `queryKey: ["profile"]`).
3. **Escrituras** con `useMutation` (ej. `useUpdateProfile`) y, en `onSuccess`,
   `queryClient.invalidateQueries({ queryKey: ["profile"] })` para refrescar.
4. **DevTools** (`@tanstack/react-query-devtools`) solo en desarrollo.

### Separación de responsabilidades

| Estado | Herramienta |
|--------|-------------|
| Datos del servidor (perfil, recetas...) | TanStack Query |
| Estado global de UI / sesión (usuario) | Zustand |
| Estado local de un componente | `useState` / React Hook Form |

---

## Consecuencias

### Ventajas

- **Menos boilerplate**: desaparecen `useEffect` + `useState` para cada fetch.
- **Caché automática**: navegar entre pantallas no vuelve a pedir datos frescos.
- **Consistencia**: invalidar `["profile"]` tras un `PATCH` evita datos viejos.
- **Estados listos**: `isPending`, `isError`, `isSuccess`, `isPaused`, etc.
- **Escalable**: las mismas primitivas sirven para recetas, despensa y planner.
- **Estándar de la industria**: muy demandado en ofertas laborales.
- **Optimistic updates** disponibles para mejorar la percepción de velocidad.

### Desventajas

- **Curva de aprendizaje**: conceptos de caché, `staleTime`, invalidación y
  claves de query.
- **Nueva dependencia**: agrega peso al bundle (mitigable con tree-shaking).
- **No reemplaza a Zustand**: sigue habiendo dos fuentes de estado que hay que
  mantener separadas correctamente.
- **DevTools en desarrollo**: hay que recordar no exponerlas en producción.

---

## Alternativas consideradas

- **`useState` + `useEffect` + Axios (patrón anterior)**: cero dependencias, pero
  mucho boilerplate, sin caché y con riesgo de datos viejos. Rechazado por
  mantenibilidad.
- **SWR**: muy similar y más liviano, pero con menos herramientas para mutaciones
  complejas e invalidación; TanStack Query tiene un ecosistema más completo.
- **Redux Toolkit + RTK Query**: potente, pero introduce Redux completo y mucho
  boilerplate para el tamaño actual del proyecto.
- **Zustand para todo (incluido server state)**: mezcla estado de UI con estado
  del servidor, sin caché ni invalidación automática. No es su propósito.
- **Apollo Client**: pensado para GraphQL; el backend es REST.

---

## Related ADRs

- ADR-005: Uso de Next.js — App Router y providers de cliente
- ADR-006: Uso de Zustand — estado global de UI/sesión, complementario a TanStack Query
- ADR-009: Proxy + Cookies HttpOnly + Middleware Refresh — `apiPrivate` es la capa HTTP que consumen los hooks

---

## Referencias

- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [TanStack Query GitHub](https://github.com/TanStack/query)
- [Roadmap: TanStack Query](../roadmap/frontend/tanstack-query.md)
- [Arquitectura del perfil](../architecture/profile.md)
