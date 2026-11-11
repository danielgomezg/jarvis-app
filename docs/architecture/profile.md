# Perfil de usuario (Profile)

## Estado

Activo

---

## Última actualización

2026-11-04

---

## Objetivo

Documentar cómo el usuario autenticado consulta y actualiza su perfil, tanto en
el backend (endpoints, validación, transacción) como en el frontend (hooks,
servicio y componentes), y por qué está diseñado así.

---

## Contexto

El modelo `Profile` es 1:1 con `User` y se crea junto con la cuenta (registro
local u OAuth). Separa los datos personales y los campos de Chef Jarvis del
modelo de autenticación (`User`, `AuthCredential`, `UserSession`).

Los campos específicos de chef viven en `Profile` porque son datos de negocio
del dominio culinario, no de identidad:

- `defaultServings` — base para el escalado de recetas
- `dietaryPreferences[]` — preferencias dietéticas (array nativo de Postgres)
- `allergenWarnings[]` — advertencias de alérgenos (array nativo de Postgres)

El `userName` vive en `User`, no en `Profile`, y por eso la actualización toca
dos tablas en una transacción.

---

## Componentes involucrados

- **Backend**: `src/modules/profile/` (controller, service, DTO)
- **Frontend**: `app/(private)/profile/`, `hooks/profile/`, `services/profile/`,
  `schemas/profile/`, `types/profile/`, `components/**/profile/`
- **Base de datos**: modelos `User` y `Profile` (Prisma / PostgreSQL)

---

## Modelo de datos

```
User (users)
  id, email, userName (unique), planId, isActive, isVerified, ...
  profile Profile?

Profile (profiles)
  id, userId (unique, 1:1)
  firstName, lastName, avatarUrl, gender, phone, birthDate
  createdAt, updatedAt
  defaultServings (Int, default 1)
  dietaryPreferences (String[])
  allergenWarnings   (String[])
```

`userId` es `@unique` en `Profile`, lo que garantiza la relación 1:1. Ambos
modelos usan `onDelete: Cascade` en la relación.

---

## API (Backend)

Prefijo global: `/api/v1`. Todos los endpoints requieren JWT (el `JwtAuthGuard`
es global; no hay `@Public()`).

### `GET /api/v1/profile/me`

Devuelve el perfil del usuario autenticado.

- **Auth**: JWT (cookie `access-token` vía proxy, o `Authorization: Bearer`)
- **Rate limit**: `@Throttle` 10000 req / 60 s (sobre el límite global)
- **Respuesta 200**: perfil con `select` fijo:
  `firstName, lastName, avatarUrl, gender, phone, birthDate, createdAt, defaultServings, dietaryPreferences, allergenWarnings`
- **Errores**:
  - `404` — `ID de usuario no proporcionado` o `Perfil no encontrado`
  - `401` — token inválido o ausente
  - `500` — error inesperado de base de datos

El `select` es explícito para no devolver nunca campos sensibles ni internos.

### `PATCH /api/v1/profile/me`

Actualiza datos personales (`User.userName` + campos de `Profile`).

- **Body**: `UpdateProfileDto`
- **Respuesta 200**: el perfil actualizado (mismo `select` que el GET)
- **Errores**:
  - `400` — DTO vacío (`Datos de actualización no proporcionados`) o validación
  - `401` — token inválido o ausente
  - `404` — `ID de usuario no proporcionado` / perfil inexistente
  - `409` — `El nombre de usuario ya está en uso.` (Prisma `P2002`)
  - `500` — error inesperado

### Endpoints previstos (no implementados)

`PATCH /profile/me/dietary` y `PATCH /profile/me/allergens` están comentados en
el controller. Hoy los arrays se actualizan a través del PATCH general.

---

## DTO: `UpdateProfileDto`

Validado por `class-validator`; el `ValidationPipe` global usa
`whitelist: true` y `forbidNonWhitelisted: true` (rechaza propiedades extra).

| Campo | Tipo | Reglas |
|-------|------|--------|
| `userName` | string | **Obligatorio**, 2–50 caracteres |
| `firstName` | string \| null | Opcional, 2–100 |
| `lastName` | string \| null | Opcional, 2–100 |
| `phone` | string \| null | Opcional, `@IsPhoneNumber` (formato internacional) |
| `gender` | string \| null | Opcional, 2–20 |
| `birthDate` | string \| null | Opcional, `@IsDateString` (ej. `1990-01-01`) |
| `defaultServings` | number | Opcional, entero, mín. 1 |
| `dietaryPreferences` | string[] | Opcional, máx. 25, únicos, cada uno 2–50 |
| `allergenWarnings` | string[] | Opcional, máx. 25, únicos, cada uno 2–50 |

Los mensajes de error están en español y se muestran en el frontend.

---

## Lógica del servicio

### `getProfile(userId)`

1. Valida que `userId` no esté vacío (`NotFoundException`).
2. `prisma.profile.findUnique({ where: { userId }, select })`.
3. Si no existe, lanza `NotFoundException('Perfil no encontrado')`.
4. Cualquier `HttpException` se relanza tal cual; el resto → `InternalServerErrorException`.

### `updateProfile(userId, dto)`

1. Valida `userId` y que el DTO no esté vacío.
2. Separa `userName` del resto (`profileData`).
3. Convierte `birthDate` (string `YYYY-MM-DD`) a `Date` a medianoche UTC; si no
   viene, escribe `null`.
4. En una **transacción interactiva**:
   1. `tx.user.update` con `userName` (lo más probable que falle por `unique`).
   2. Si hay campos de perfil, `tx.profile.update`; si solo cambió `userName`,
      hace `findUnique` y devuelve el perfil sin tocarlo.
5. Manejo de errores: `P2002` → `ConflictException('El nombre de usuario ya está en uso.')`;
   otras `HttpException` se relanzan; el resto → `500`.

**Por qué la transacción**: `userName` está en `User` y el resto en `Profile`.
Si una de las dos escrituras falla, no queremos dejar el perfil a medias.

**Por qué se actualiza `User` primero**: el conflicto de `userName` es el fallo
más probable; hacerlo primero evita trabajo innecesario y devuelve el 409 pronto.

---

## Frontend

### Capa de datos

```
ProfilePage
  ├── useGetProfile()      → useQuery(["profile"], fetchProfile)
  └── useUpdateProfile()  → useMutation(fetchUpdatedProfile, onSuccess: invalidate ["profile"])

fetchProfile / fetchUpdatedProfile
  └── ProfileService.me() / .updateProfile()
        └── apiPrivate (Axios) → GET/PATCH /profile/me
```

- `ProfileService` usa la instancia privada de Axios (`apiPrivate`), que añade el
  token y maneja el refresh (ver [ADR-009](../decisions/ADR-009-cookie-auth-proxy-middleware.md)).
- Los errores de Axios se convierten en `Error` con el `message` del backend.
- `useGetProfile` ajusta `birthDate` con `date-fns` para neutralizar el desfase
  de zona horaria.
- `useUpdateProfile` invalida la query `["profile"]` al terminar, de modo que el
  perfil se vuelve a pedir y la UI queda consistente.

### Página `/profile`

- Ruta privada (`app/(private)/profile/page.tsx`).
- Estado de edición local (`editing`); el formulario se rellena con `reset()`
  cuando llega el perfil.
- Validación con `profileSchema` (Zod) vía `standardSchemaResolver`.
- `handleSaveProfile` construye `UpdateProfilePayload` (fecha → `YYYY-MM-DD`),
  ejecuta la mutación y, en éxito, sincroniza `userName` con el store de Zustand.
- Loading y error se renderizan antes del formulario.

### Componentes

| Componente | Función |
|------------|---------|
| `CardHeaderProfile` | Banner, avatar, nombre, botones Editar/Cancelar/Guardar |
| `CardPreferences` | Porciones por defecto (stepper 1–1000) + preferencias dietéticas |
| `CardAllergens` | Advertencias de alérgenos |
| `CardDeleteUser` | Zona de peligro (botones sin lógica todavía) |
| `FieldProfile` | Input / Select / Calendar según `formatInput` |
| `CalendarField` | Selector de fecha (no permite fechas futuras) |
| `ChipInput` | Chips con sugerencias, normalización (sin tildes), anti-duplicados, máx. 25 |

### Validación (Zod)

`profileSchema` replica las reglas del backend y **normaliza a minúsculas** los
arrays. `ChipInput.normalize` elimina tildes/diéresis y espacios para comparar
duplicados, algo que el backend (`ArrayUnique`) no hace por sí solo.

---

## Tecnologías utilizadas

- NestJS 11 + class-validator + class-transformer
- Prisma 7 (transacción interactiva)
- PostgreSQL (arrays nativos `text[]`)
- Next.js 16 + React 19
- TanStack Query v5
- React Hook Form v7 + Zod v4
- Zustand v5
- date-fns
- Sonner

---

## Dependencias

- Stage 01 — Autenticación (guard global, cookies HttpOnly)
- Stage 01-B — OAuth (crea `Profile` en el registro social)
- ADR-009 — Proxy + cookies + middleware
- ADR-010 — TanStack Query

---

## Decisiones importantes

- [ADR-010: Uso de TanStack Query](../decisions/ADR-010-use-tanstack-query.md)
- [ADR-009: Proxy + Cookies HttpOnly + Middleware Refresh](../decisions/ADR-009-cookie-auth-proxy-middleware.md)
- [ADR-003: Uso de PostgreSQL](../decisions/ADR-003-use-postgresql.md) — arrays nativos para preferencias/alérgenos

---

## Riesgos

- El ajuste de zona horaria en `birthDate` es frágil ante cambios de formato.
- La actualización de arrays reemplaza el contenido completo (no hay endpoints
  incrementales todavía).
- `birthDate` se escribe `null` cuando no se envía, lo que puede borrar una fecha
  si el cliente no la manda.
- La zona de peligro (eliminar cuenta / cerrar sesión) no tiene lógica.
- El frontend no tiene tests todavía.

---

## Mejoras futuras

- [ ] Subida de avatar (S3/Cloudinary) y validación de imagen
- [ ] Endpoints `me/dietary` y `me/allergens` para actualizaciones incrementales
- [ ] Eliminar cuenta y cerrar sesión desde la zona de peligro
- [ ] Tests de frontend (Vitest + React Testing Library) — Fase 2
- [ ] Manejo de error con reintento y skeletons de carga
- [ ] Optimistic updates en la mutación de perfil
