# Plan de Implementación — Autenticación (Auth)

## Objetivo

Implementar registro, inicio de sesión, refresh token, cierre de sesión y perfil de usuario autenticado. Backend primero (NestJS), luego frontend (Next.js).

---

## Fase 1: Backend (NestJS)

### Estructura final del módulo auth

```
src/modules/auth/
  auth.module.ts
  auth.controller.ts
  auth.controller.spec.ts
  auth.service.ts
  auth.service.spec.ts
  dto/
    register.dto.ts
    login.dto.ts
    refresh.dto.ts
  strategies/
    jwt.strategy.ts
  guards/
    jwt-auth.guard.ts
```

### Paso 1 — Instalar dependencias

```bash
cd backend-jarvis
pnpm add @nestjs/jwt @nestjs/passport @nestjs/config passport passport-jwt bcrypt
pnpm add -D @types/passport-jwt @types/bcrypt
```

### Paso 2 — Configurar `@nestjs/config`

Agregar `ConfigModule.forRoot()` en `app.module.ts` apuntando al `.env` raíz:

```ts
ConfigModule.forRoot({
  envFilePath: '../.env',
  isGlobal: true,
})
```

Esto expone `JWT_SECRET`, `JWT_REFRESH_SECRET`, `DATABASE_URL`, etc. en toda la app.

### Paso 3 — DTOs (`dto/`)

| Archivo | Campos |
|---------|--------|
| `register.dto.ts` | `email: string`, `password: string`, `confirmPassword: string` |
| `login.dto.ts` | `email: string`, `password: string` |
| `refresh.dto.ts` | `refreshToken: string` |

Usar `class-validator` + `@nestjs/mapped-types` para validación (instalar `class-validator` y `class-transformer`).

### Paso 4 — JWT Strategy (`strategies/jwt.strategy.ts`)

- Extiende `PassportStrategy(Strategy)`
- Lee `JWT_SECRET` del entorno
- Extrae y valida el token del header `Authorization: Bearer <token>`
- `validate()` devuelve el payload (userId, email) para adjuntarlo a `req.user`

### Paso 5 — JWT Guard (`guards/jwt-auth.guard.ts`)

- Extiende `AuthGuard('jwt')` de Passport
- Decorador `@UseGuards(JwtAuthGuard)` para proteger rutas

### Paso 6 — AuthService

| Método | Descripción |
|--------|-------------|
| `register(dto)` | Crea User + AuthCredential + Profile vacío. Hashea password con bcrypt. |
| `login(dto)` | Valida credenciales. Genera accessToken (15 min) + refreshToken (7 días). Crea UserSession con refreshToken hasheado. |
| `refresh(dto)` | Busca UserSession por refreshToken hash. Si es válida y no expiró, genera nuevos tokens y rota la sesión. |
| `logout(dto)` | Revoca la UserSession (isRevoked = true). |
| `me(userId)` | Devuelve User + Profile del usuario autenticado. |

**Lógica de tokens:**

- **Access token** (JWT): 15 min, payload `{ userId, email }`, firmado con `JWT_SECRET`
- **Refresh token** (opaco/aleatorio): 7 días, se guarda el hash en `UserSession`, se devuelve el token plano

### Paso 7 — AuthController

| Endpoint | Método | Body | Auth | Respuesta |
|----------|--------|------|------|-----------|
| `/auth/register` | POST | `RegisterDto` | No | `{ user, accessToken, refreshToken }` |
| `/auth/login` | POST | `LoginDto` | No | `{ user, accessToken, refreshToken }` |
| `/auth/refresh` | POST | `RefreshDto` | No | `{ accessToken, refreshToken }` |
| `/auth/logout` | POST | `RefreshDto` | Sí | `{ message: "Sesión cerrada" }` |
| `/auth/me` | GET | - | Sí | `{ user, profile }` |

### Paso 8 — Actualizar AuthModule

Registrar:

- `PassportModule`
- `JwtModule.registerAsync()` (inyecta ConfigService para `secret` y `signOptions.expiresIn`)
- JwtStrategy como provider
- AuthService como provider
- AuthController como controller

### Paso 9 — Tests

- **Unitarios**: AuthService (mockear PrismaService + JwtService), AuthController (mockear AuthService)
- **E2E**: Flujo completo register → login → refresh → me → logout

### Paso 10 — Validación

```bash
pnpm run build
pnpm run lint
pnpm run test
pnpm run test:e2e
```

---

## Fase 2: Frontend (Next.js)

### Estructura propuesta

```
frontend-jarvis/
  src/
    app/
      login/page.tsx
      register/page.tsx
      dashboard/layout.tsx     ← layout protegido
      dashboard/page.tsx
    lib/
      api.ts                   ← cliente HTTP con interceptors
    context/
      auth-context.tsx         ← AuthProvider + useAuth hook
    middleware.ts              ← redirige a /login si no hay token
  .env.local                   ← NEXT_PUBLIC_API_URL
  package.json
```

### Paso 1 — Inicializar proyecto

```bash
cd Proyecto_Jarvis_V2
npx create-next-app@latest frontend-jarvis --typescript --app --tailwind
```

### Paso 2 — API Client (`lib/api.ts`)

- Fetch/axios wrapper con base URL apuntando a `http://localhost:3000`
- Interceptor para adjuntar `Authorization: Bearer <token>` desde localStorage/sessionStorage
- Interceptor de respuesta: si da 401, intentar refresh automático

### Paso 3 — Auth Context (`context/auth-context.tsx`)

- `AuthProvider` que expone: `user`, `login()`, `register()`, `logout()`, `isAuthenticated`
- Al montar, intenta recuperar sesión desde refresh token guardado en localStorage
- Maneja el refresh automático cuando el access token expira

### Paso 4 — Página Register (`app/register/page.tsx`)

- Formulario: email, password, confirmar password
- Consume `POST /auth/register`
- En caso de éxito, redirige a `/login` con mensaje de confirmación

### Paso 5 — Página Login (`app/login/page.tsx`)

- Formulario: email, password
- Consume `POST /auth/login`
- Guarda tokens en localStorage
- Redirige a `/dashboard`

### Paso 6 — Layout protegido (`app/dashboard/layout.tsx`)

- Verifica `isAuthenticated` del AuthContext
- Si no hay sesión, redirige a `/login`

### Paso 7 — Middleware (`middleware.ts`)

- Next.js Middleware que intercepta rutas protegidas
- Verifica existencia de token en cookies/localStorage
- Redirige a `/login` si no hay sesión

---

## Checklist resumen

### Backend

- [ ] Instalar dependencias
- [ ] Configurar ConfigModule
- [ ] Crear DTOs
- [ ] Crear JWT Strategy
- [ ] Crear JWT Guard
- [ ] Implementar AuthService
- [ ] Implementar AuthController
- [ ] Actualizar AuthModule
- [ ] Escribir tests
- [ ] Build + lint pasando

### Frontend

- [ ] Inicializar Next.js
- [ ] Crear API Client
- [ ] Crear Auth Context
- [ ] Página Register
- [ ] Página Login
- [ ] Layout protegido
- [ ] Middleware
