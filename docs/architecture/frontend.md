# Frontend Architecture

## Estado

Activo

---

## Última actualización

2026-11-04

---

## Objetivo

Documentar la arquitectura del frontend de Jarvis, incluyendo estructura de componentes, flujo de autenticación y decisiones técnicas.

---

## Contexto

El frontend es una aplicación Next.js que consume la API de NestJS. Maneja la autenticación mediante cookies HttpOnly y usa Zustand para el estado del usuario.

---

## Componentes involucrados

- **Framework**: Next.js 16 (App Router)
- **UI**: React 19 + Tailwind CSS v4 + shadcn/ui v4
- **Estado de UI/sesión**: Zustand v5
- **Estado del servidor**: TanStack Query v5
- **Formularios**: React Hook Form v7 + Zod v4
- **HTTP**: Axios (dual instance pattern)
- **Componentes**: Radix UI primitives

---

## Stack Tecnológico

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| Next.js | 16.2.7 | Framework React con App Router |
| React | 19.2.4 | UI library |
| Tailwind CSS | 4.x | Utility-first CSS |
| shadcn/ui | 4.11.0 | Component system (Radix Nova) |
| Zustand | 5.0.14 | State management (UI/sesión) |
| TanStack Query | 5.x | Server state, caché y mutaciones |
| React Hook Form | 7.79.0 | Form management |
| Zod | 4.4.3 | Schema validation |
| Axios | 1.18.0 | HTTP client |
| Radix UI | 1.5.0 | Headless primitives |

---

## Estructura de Directorios

```
frontend-jarvis/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Route group: páginas públicas
│   ├── (private)/          # Route group: páginas autenticadas
│   └── api/                # API routes (proxy al backend)
├── components/             # Componentes reutilizables
│   ├── ui/                 # shadcn/ui primitives
│   ├── card/               # Card components
│   ├── forms/              # Form components
│   ├── navbar/             # Navigation
│   └── status/             # Loading/Error states
├── hooks/                  # Custom hooks
│   ├── auth/               # Auth-specific hooks
│   └── profile/            # useGetProfile, useUpdateProfile
├── services/               # API services
│   ├── auth/               # AuthService
│   └── profile/            # ProfileService
├── providers/              # React providers (QueryProvider)
├── store/                  # Zustand stores
├── types/                  # TypeScript types
│   ├── auth/
│   └── profile/
├── data/                   # Static data (fields, configs)
│   ├── auth/
│   └── profile/
├── schemas/                # Zod validation schemas
│   ├── auth/
│   └── profile/
├── lib/                    # Utilities (api client, cn())
└── middleware.ts           # Route protection
```

---

## Flujo de Autenticación

### Arquitectura Dual de Axios

```
┌─────────────────────────────────────────────────────────┐
│                      Frontend                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────┐    ┌─────────────┐                    │
│  │    api       │    │   nextApi   │                    │
│  │ (directo)    │    │  (proxy)    │                    │
│  └──────┬──────┘    └──────┬──────┘                    │
│         │                  │                            │
│         │                  │                            │
└─────────┼──────────────────┼────────────────────────────┘
          │                  │
          │                  │
          ▼                  ▼
┌─────────────────┐  ┌─────────────────┐
│   NestJS API    │  │  Next.js API    │
│  (localhost:    │  │  Routes         │
│   3001)         │  │  /api/auth/*    │
└─────────────────┘  └─────────────────┘
```

### Por qué dual?

- **`api`** (directo): Para register, resend, verify → No necesitan manejar cookies
- **`nextApi`** (proxy): Para login, logout → Necesitan setear/limpiar HttpOnly cookies en el servidor

### Flujo de Login

```
1. Usuario envía form → useLogin hook
2. useLogin → AuthService.login() → nextApi.post('/api/auth/login')
3. Next.js API route proxea a NestJS /auth/login
4. NestJS retorna { user, accessToken, refreshToken }
5. Next.js API route:
   → Setea 'access-token' como HttpOnly cookie (15 min)
   → Propaga 'refreshToken' cookie de NestJS
   → Retorna solo { email, userName, firstName, lastName }
6. useLogin retorna user data → Zustand store → Redirect a /
```

### Flujo de Logout

```
1. Usuario hace clic en logout → useLogout hook
2. useLogout → AuthService.logout() → nextApi.post('/api/auth/logout')
3. Next.js API route:
   → Lee refreshToken de cookie
   → Llama a NestJS /auth/logout para revocar sesión
   → Elimina ambas cookies (access-token, refreshToken)
4. Zustand store → clearUser() → Redirect a /login
```

---

## Páginas Implementadas

| Ruta | Página | Auth | Descripción |
|------|--------|------|-------------|
| `/login` | LoginPage | No | Formulario email+password, social login stubs |
| `/register` | RegisterPage | No | Formulario 6 campos, social login stubs |
| `/confirmation` | ConfirmationPage | No | "Revisa tu email" con countdown para reenviar |
| `/resend-verification` | ResendVerificationPage | No | Formulario email para reenviar verificación |
| `/verificated` | VerificatedPage | No | Verificación exitosa con animación |
| `/` | HomePage | Sí | Saludo + fecha actual |
| `/profile` | ProfilePage | Sí | Ver/editar perfil y preferencias de chef |
| `/recipe` | - | - | No implementado (placeholder en navbar) |
| `/pantry` | - | - | No implementado (placeholder en navbar) |
| `/planner` | - | - | No implementado (placeholder en navbar) |

---

## Componentes Principales

### Componentes Custom

| Componente | Archivo | Descripción |
|------------|---------|-------------|
| `ButtonCustom` | `components/ButtonCustom.tsx` | Botón con tema naranja por defecto |
| `ImageCustom` | `components/ImageCustom.tsx` | Imagen centrada con next/image |
| `CardCustom` | `components/card/CardCustom.tsx` | Card container (max-w-sm) |
| `CardHeaderProfile` | `components/card/profile/CardHeaderProfile.tsx` | Cabecera del perfil con avatar y acciones |
| `CardPreferences` | `components/card/profile/CardPreferences.tsx` | Porciones por defecto + preferencias dietéticas |
| `CardAllergens` | `components/card/profile/CardAllergens.tsx` | Advertencias de alérgenos |
| `CardDeleteUser` | `components/card/profile/CardDeleteUser.tsx` | Zona de peligro (sin lógica todavía) |
| `FieldProfile` | `components/forms/profile/FieldProfile.tsx` | Input/Select/Calendar del perfil |
| `CalendarField` | `components/forms/profile/CalendarField.tsx` | Selector de fecha |
| `ChipInput` | `components/forms/profile/ChipInput.tsx` | Chips con sugerencias y anti-duplicados |
| `FormField` | `components/forms/FormField.tsx` | Campo de form con label, error, toggle password |
| `Navbar` | `components/navbar/navbar.tsx` | Navegación principal con logo, links, dropdown |
| `LoadingViewCustom` | `components/status/LoadingViewCustom.tsx` | Spinner de carga |
| `ErrorViewCustom` | `components/status/ErrorViewCustom.tsx` | Card de error con acciones |

### shadcn/ui Primitives

- Button, Card, Avatar, DropdownMenu, Input, Label, Field, NavigationMenu, Separator

---

## State Management (Zustand)

```typescript
// store/auth.store.ts
interface User {
  email: string;
  userName: string;
  firstName?: string;
  lastName?: string;
}

interface AuthState {
  user: User | null;
  setUser: (user: User) => void;
  clearUser: () => void;
}
```

- Persistido en localStorage (`"auth-storage"`)
- Solo almacena datos del usuario, NO tokens
- Tokens viven en HttpOnly cookies (seguro)

---

## Server State (TanStack Query)

Separado del estado de UI: Zustand guarda la sesión; TanStack Query gestiona
los datos que vienen del backend.

- **`QueryProvider`** (`providers/QueryProvider.tsx`) crea un único `QueryClient`
  con `staleTime: 5 min` y `refetchOnWindowFocus: false`.
- **Lecturas**: `useQuery` con claves como `["profile"]`.
- **Escrituras**: `useMutation` + `invalidateQueries` en `onSuccess`.
- **DevTools** solo en desarrollo.

Ejemplo actual (perfil):

```
useGetProfile()    → useQuery(["profile"]) → ProfileService.me()
useUpdateProfile() → useMutation(...)       → ProfileService.updateProfile()
                     onSuccess: invalidateQueries(["profile"])
```

Ver [Arquitectura del perfil](./profile.md) y
[ADR-010](../decisions/ADR-010-use-tanstack-query.md).

---

## Testing

- **Backend**: Jest con Prisma mockeado (ver `stage-02-profile.md`).
- **Frontend**: ✅ **Vitest 5 + React Testing Library** sobre `jsdom`, con
  `@testing-library/jest-dom` y `@testing-library/user-event`. Configuración en
  `vitest.config.mts` y `vitest.setup.ts`. Cobertura actual del flujo de perfil:
  schema Zod, `ChipInput`, hooks (`useGetProfile`, `useUpdateProfile`),
  `ProfileService` y la página `/profile` (46 tests).

  ```bash
  pnpm test        # watch
  pnpm test:run    # una pasada
  pnpm test:cov    # cobertura (v8)
  ```

---

## Middleware (Route Protection)

```typescript
// middleware.ts
- Lee cookie 'access-token'
- Sin token + ruta privada → Redirect /login
- Con token + ruta pública → Redirect /
```

**Rutas públicas**: `/login`, `/register`, `/verify-email`, `/verificated`

---

## Validación de Formularios (Zod)

| Schema | Campos | Reglas |
|--------|--------|--------|
| `registerSchema` | userName, firstName, lastName, email, password, confirmPassword | userName 4-64, names 2-64, password min 8, passwords match |
| `loginSchema` | email, password | email válido, password min 8 |
| `resendVerificationSchema` | email | email válido |
| `profileSchema` | userName, firstName, lastName, phone, birthDate, gender, defaultServings, dietaryPreferences, allergenWarnings | userName 4-64, names 2-64, phone E.164, defaultServings 1-1000, arrays máx. 25 (normaliza a minúsculas) |

Mensajes de error en español.

---

## Decisiones Importantes

- [ADR-005: Uso de Next.js](../decisions/ADR-005-use-nextjs.md)
- [ADR-006: Uso de Zustand](../decisions/ADR-006-use-zustand.md)
- [ADR-007: Uso de shadcn/ui](../decisions/ADR-007-use-shadcn.md)
- [ADR-009: Proxy + Cookies HttpOnly + Middleware Refresh](../decisions/ADR-009-cookie-auth-proxy-middleware.md)
- [ADR-010: Uso de TanStack Query](../decisions/ADR-010-use-tanstack-query.md)

---

## Riesgos

- Next.js 16 es muy reciente (2026), puede tener bugs o breaking changes
- Zod v4 es nuevo, puede tener diferencias con documentación existente
- El middleware solo verifica existencia de cookie, no valida el token
- La cobertura de tests del frontend se limita por ahora al flujo de perfil

---

## Mejoras Futuras

- [ ] Implementar páginas de Recetas, Despensa, Planificador
- [x] Implementar OAuth (Google, GitHub) — ver ADR-008
- [x] Página de perfil con TanStack Query — ver `profile.md`
- [ ] OAuth con Twitter/X
- [ ] Agregar refresh automático de access token
- [ ] Implementar loading states global
- [x] Tests de frontend con Vitest + React Testing Library (Fase 2)
- [ ] Tests E2E con Playwright
