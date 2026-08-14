# TanStack Query

## Estado

🔴 Pendiente

---

## Prioridad

⭐⭐⭐⭐⭐

---

## Nivel actual

Nada

---

## Nivel objetivo

Intermedio

---

## Complejidad

Media

---

## Tiempo estimado

1-2 semanas

---

## ¿Qué es?

Biblioteca para managing de estado del servidor (server state) en React. Maneja caching, refetching, optimistic updates, loading states, etc. Antes se llamaba React Query.

---

## ¿Por qué aprenderlo?

- Estándar absoluto para apps React con backend
- Muy solicitado en ofertas laborales
- Elimina boilerplate de fetching (useEffect + useState + loading + error)
- Caching automático mejora UX
- Optimistic updates para mejor percepción de velocidad
- DevTools para debugging

---

## ¿Cuándo implementarlo?

Ahora. Actualmente el frontend hace fetch directo con axios. TanStack Query simplificaría:
- Cada llamada a la API
- Loading y error states
- Refetch automático de datos
- Caching de datos frecuentes

---

## Prerrequisitos

- React hooks (useState, useEffect)
- Axios (ya implementado)
- Conceptos de caching

---

## Casos de uso en Jarvis

- Fetching de recetas
- Fetching de perfil de usuario
- Crear/actualizar recetas
- Planificación de comidas
- Cualquier llamada GET que necesite caching

---

## Dependencias

- React 19 (✅ ya instalado)
- Axios (✅ ya instalado)

---

## Coste

✅ Gratuito, 100% client-side

---

## Desarrollo local

```bash
pnpm add @tanstack/react-query
```

---

## Cuenta necesaria

No

---

## Demanda en ofertas laborales

⭐⭐⭐⭐⭐ Muy alta (el más popular para data fetching en React)

---

## Objetivo de aprendizaje

- Configurar QueryClient Provider
- useQuery para fetching de datos
- useMutation para crear/actualizar
- Query invalidation y refetch
- Optimistic updates
- Loading, error, y success states
- DevTools para debugging

---

## Recursos oficiales

- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [TanStack Query GitHub](https://github.com/TanStack/query)

---

## Estado en Jarvis

❌ No implementado
