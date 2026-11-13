# Stage 02 — Perfil de usuario y preferencias

## Estado

✅ Etapa cerrada — Backend, frontend y tests completados. Los pendientes menores quedaron en [`docs/roadmap/pendientes.md`](../roadmap/pendientes.md).

---

## Última actualización

2026-11-13

---

## Prioridad

Alta

---

## Objetivo

Permitir que el usuario autenticado consulte y actualice su perfil, incluyendo
datos personales y los campos específicos de Chef Jarvis (porciones por defecto,
preferencias dietéticas y advertencias de alérgenos).

---

## Estimación de tiempo

1-2 semanas

---

## Requisitos previos

- Stage 01 — Autenticación completado (JWT, guard global, cookies HttpOnly)
- Stage 01-B — Social OAuth completado (crea Profile en el registro)
- Modelo `Profile` en Prisma con relación 1:1 con `User`
- Frontend con Axios dual y Zustand configurados
- TanStack Query instalado (ver ADR-010)

---

## Historias de usuario

- Como usuario autenticado, quiero ver mi perfil para conocer los datos que tengo guardados
- Como usuario autenticado, quiero editar mis datos personales (nombre, apellido, teléfono, género, fecha de nacimiento) para mantenerlos actualizados
- Como usuario, quiero definir mis porciones por defecto para que Jarvis escale las recetas a mi medida
- Como usuario, quiero registrar mis preferencias dietéticas para que Jarvis las tenga en cuenta
- Como usuario, quiero registrar mis advertencias de alérgenos para evitar sugerencias peligrosas
- Como usuario, quiero cambiar mi nombre de usuario y saber si ya está ocupado

---

## Flujo

### Obtener perfil

```
1. Usuario entra a /profile (ruta privada)
2. useGetProfile() → ProfileService.me() → GET /api/v1/profile/me
3. El JWT viaja en la cookie access-token (el proxy de Next la añade)
4. Backend valida con JwtAuthGuard global y devuelve el perfil (select fijo)
5. useGetProfile adapta birthDate (zona horaria) y expone profile/loading/error
6. La página rellena el formulario con reset() cuando llega el perfil
```

### Actualizar perfil

```
1. Usuario pulsa "Editar perfil" → editing = true
2. Modifica campos (inputs, select de género, calendario, chips de preferencias/alérgenos)
3. Pulsa "Guardar" → React Hook Form valida con profileSchema (Zod)
4. handleSaveProfile construye el UpdateProfilePayload (birthDate → "YYYY-MM-DD")
5. useUpdateProfile().mutate() → ProfileService.updateProfile() → PATCH /api/v1/profile/me
6. Backend actualiza User.userName y Profile en una transacción
7. onSuccess invalida la query ["profile"] y actualiza el userName en Zustand
8. Se muestra un toast y se sale del modo edición
```

---

## Tareas

### Backend

- [x] Crear `ProfileModule`, `ProfileController` y `ProfileService`
- [x] Endpoint `GET /profile/me` con `select` fijo (sin datos sensibles)
- [x] Endpoint `PATCH /profile/me` con transacción User + Profile
- [x] Crear `UpdateProfileDto` con class-validator (mensajes en español)
- [x] Manejo de errores: 400 (DTO vacío), 404 (sin perfil), 409 (userName duplicado), 500
- [x] Rate limiting en `GET /profile/me`
- [x] Documentar endpoints en Swagger
- [x] Tests unitarios: controller, service y DTO

### Frontend

- [x] Página `/profile` en el route group privado
- [x] `ProfileService` (me / updateProfile) usando el Axios privado
- [x] Hooks `useGetProfile` (useQuery) y `useUpdateProfile` (useMutation + invalidación)
- [x] `QueryProvider` con QueryClient (staleTime 5 min, sin refetch por foco)
- [x] Schema Zod `profileSchema` y tipo `ProfileFormData`
- [x] Tipos `Profile` y `UpdateProfilePayload`
- [x] Componentes: `CardHeaderProfile`, `CardPreferences`, `CardAllergens`, `CardDeleteUser`
- [x] Formularios: `FieldProfile`, `CalendarField`, `ChipInput`
- [x] Formulario con React Hook Form + `standardSchemaResolver`
- [x] Chips con sugerencias, normalización y límite de 25 (default del backend)
- [x] Toasts de éxito/error con Sonner
- [x] Sincronizar `userName` con el store de Zustand tras guardar
- [x] Tests de componentes/hooks (Fase 2 — ver sección Testing)

### Pendiente / fuera de alcance de este stage

Los pendientes de este stage se movieron al backlog del proyecto para no duplicar información:
[`docs/roadmap/pendientes.md`](../roadmap/pendientes.md) → sección **Etapa 02 — Perfil**.

---

## Testing

### Backend — completado

| Archivo | Qué cubre |
|---------|-----------|
| `profile.controller.spec.ts` | El controller delega `authId` y DTO al service |
| `profile.service.spec.ts` | getProfile (éxito, userId vacío, sin perfil, HttpException, error DB) y updateProfile (transacción, birthDate→Date, solo userName, P2002→409, errores) |
| `dto/updated-profile.dto.spec.ts` | Reglas de validación del DTO (campos, arrays, límites de 25, unicidad) |

Prisma está mockeado; los tests corren sin base de datos.

### Frontend — completado (Fase 2)

Implementado con **Vitest 5 + Vite 8 + React Testing Library** sobre `jsdom`
(ver `docs/architecture/frontend.md` y `docs/roadmap/notes.md`).

| Archivo | Qué cubre |
|---------|-----------|
| `schemas/profile/profile-schema.test.ts` | Casos válidos e inválidos del schema Zod: userName, phone (normalización), birthDate, defaultServings, límites y normalización a minúsculas de los arrays |
| `components/forms/profile/ChipInput.test.tsx` | Modo lectura, agregar con Enter/botón, mínimo 2 caracteres, duplicados, límite de 25 con toast y eliminación |
| `hooks/profile/useGetProfile.test.tsx` | Carga → éxito, conversión de `birthDate` a `Date` con ajuste de zona horaria, errores de Axios y de conexión |
| `hooks/profile/useUpdateProfile.test.tsx` | Estado idle, mutación exitosa + invalidación de `["profile"]`, errores de Axios y de conexión |
| `services/profile/profile.service.test.ts` | `GET /profile/me` y `PATCH /profile/me`, passthrough de la respuesta y propagación de errores |
| `app/(private)/profile/page.test.tsx` | Render del perfil, carga, error, modo edición, cancelar, payload correcto, toast de éxito/error y sincronización de `userName` |

Configuración: `vitest.config.mts` (`jsdom`, `resolve.tsconfigPaths`, cobertura v8)
y `vitest.setup.ts` (jest-dom, `cleanup` y polyfills de `matchMedia`,
`ResizeObserver`, `IntersectionObserver` y `scrollTo`).

```bash
pnpm test        # modo watch
pnpm test:run    # una sola pasada
pnpm test:cov    # con cobertura
```

> Durante la Fase 2 los tests detectaron que los botones "Editar perfil",
> "Cancelar" y el de avatar no tenían `type="button"` y enviaban el formulario:
> se corrigió en `CardHeaderProfile.tsx`.


---

## Criterios de aceptación

- [x] `GET /profile/me` devuelve el perfil del usuario autenticado sin datos sensibles
- [x] `GET /profile/me` responde 404 si el perfil no existe y 401 sin token
- [x] `PATCH /profile/me` actualiza User y Profile de forma atómica (transacción)
- [x] Cambiar a un `userName` ocupado responde 409
- [x] Un DTO vacío responde 400
- [x] `birthDate` se valida como fecha y se guarda como `DateTime` a medianoche UTC
- [x] El frontend muestra el perfil, permite editar y guardar
- [x] Tras guardar, la caché de la query se invalida y el userName se sincroniza
- [x] Los errores del backend se muestran al usuario
- [x] Tests de frontend (Fase 2)

---

## Tecnologías

### Backend
- NestJS 11
- Prisma 7 (transacciones interactivas)
- class-validator + class-transformer
- @nestjs/throttler
- Swagger
- Jest (unit tests)

### Frontend
- Next.js 16 (App Router)
- React 19
- TanStack Query v5
- React Hook Form v7 + Zod v4
- Zustand v5
- shadcn/ui + Radix UI
- date-fns
- Sonner (toasts)
- Axios

### Testing frontend (Fase 2)
- Vitest
- React Testing Library
- @testing-library/jest-dom
- @testing-library/user-event
- jsdom
- MSW (mock de API)

---

## Riesgos

- El desfase de zona horaria en `birthDate` requiere ajuste en `useGetProfile`; un cambio de formato en el backend lo rompería.
- `ArrayUnique` del backend distingue mayúsculas/tildes; la normalización es responsabilidad del frontend (`normalize` en `ChipInput`).
- El servicio de backend escribe `birthDate: null` cuando no se envía la fecha (comportamiento actual documentado en los tests).
- La cobertura de frontend se limita al flujo de perfil; una regresión fuera de él pasaría desapercibida.
- La página no maneja un estado de error de red con reintento explícito.

---

## Resultado esperado

El usuario puede ver y actualizar su perfil completo (datos personales y campos de
chef) desde `/profile`, con validación en cliente y servidor, manejo de conflictos
de `userName` y feedback visual. Tanto el backend como el frontend están cubiertos
por tests automatizados (Jest y Vitest + React Testing Library respectivamente).

---

## Documentación relacionada

- [Arquitectura del perfil](../architecture/profile.md)
- [Arquitectura del frontend](../architecture/frontend.md)
- [ADR-010: Uso de TanStack Query](../decisions/ADR-010-use-tanstack-query.md)
- [Stage 01 — Autenticación](./stage-01-auth.md)
- [Stage 01-B — Social OAuth](./stage-01b-google-oauth.md)
- [Roadmap: TanStack Query](../roadmap/frontend/tanstack-query.md)

---

## Próxima etapa

Stage 03 — Recetas (por definir)
