# Stage 01-B — Social OAuth (Google + GitHub)

## Estado

Completada

---

## Última actualización

2026-08-13

---

## Prioridad

Alta

---

## Objetivo

Implementar autenticación con proveedores sociales (Google y GitHub) para que los usuarios puedan:
- Iniciar sesión con su cuenta de Google o GitHub (sin crear cuenta previa)
- Vincular una cuenta existente con un proveedor social
- En el futuro, crear password para login normal desde cuenta social

---

## Estimación de tiempo

2-3 días

---

## Requisitos previos

- Auth local completado (✅)
- Cuenta de Google Cloud Console (✅)
- Cuenta de GitHub OAuth App (✅)
- NestJS + Passport funcionando (✅)

---

## Historias de usuario

- Como usuario nuevo, quiero iniciar sesión con Google o GitHub para crear cuenta sin llenar formularios
- Como usuario existente, quiero vincular mi cuenta con un proveedor social para tener login rápido
- Como usuario de Google, quiero crear un password para poder iniciar sesión sin Google

---

## Flujo de usuario

### 1. Login/Registro social (usuario nuevo)
```
1. Usuario hace clic en "Continuar con Google" o "Continuar con GitHub"
2. Redirect a la consent screen del proveedor
3. Usuario autoriza
4. Proveedor redirige a /auth/{google|github}/callback con code
5. Backend intercambia code por tokens
6. Backend obtiene email, nombre, avatar del proveedor
7. Backend crea User + Profile + AuthCredential (provider: "GOOGLE" | "GITHUB")
8. Backend genera tokens JWT y setea la cookie refreshToken
9. Redirect a /oauth-success (frontend)
```

### 2. Login social (usuario existente con proveedor vinculado)
```
1. Usuario hace clic en "Continuar con Google"
2. Redirect a Google → autoriza
3. Backend busca AuthCredential por email + provider
4. Backend encuentra usuario existente
5. Backend genera tokens y setea cookie
6. Redirect a /oauth-success
```

### 3. Vincular proveedor social a cuenta existente
```
1. Usuario logueado con email/password va a Settings
2. Hace clic en "Vincular cuenta de Google"
3. Redirect a Google → autoriza
4. Backend verifica que el email del proveedor coincide con el usuario actual
5. Backend crea AuthCredential (provider, userId: actual)
6. Confirmación de vinculación exitosa
```

---

## Tareas

### Backend
- [x] Instalar passport-google-oauth20 y @types
- [x] Instalar passport-github2 y @types
- [x] Crear GoogleStrategy (passport strategy)
- [x] Crear GithubStrategy (passport strategy)
- [x] Crear GoogleAuthGuard y GithubAuthGuard
- [x] Crear config de OAuth (google-oauth.config.ts, github-oauth.config.ts)
- [x] Crear endpoint GET /auth/google (redirect a Google)
- [x] Crear endpoint GET /auth/google/callback (procesar respuesta)
- [x] Crear endpoint GET /auth/github (redirect a GitHub)
- [x] Crear endpoint GET /auth/github/callback (procesar respuesta)
- [x] Modificar AuthService para manejar OAuth users (validateOAuthUser, loginOauth, registerOAuth)
- [x] Agregar variables de entorno (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GITHUB_CALLBACK_URL)
- [x] Actualizar AuthModule con imports necesarios

### Frontend
- [x] Actualizar botón de Google para ser funcional
- [x] Actualizar botón de GitHub para ser funcional
- [x] Crear hook useSocialLogin (o similar)
- [x] Actualizar social-networks.tsx con URLs de backend
- [x] Crear página /oauth-success para manejar redirect del proveedor

---

## Criterios de aceptación

- [x] Login social crea usuario nuevo si no existe
- [x] Login social funciona si usuario ya tiene cuenta vinculada
- [x] Vincular proveedor a cuenta existente funciona
- [x] Tokens se setean correctamente en cookies
- [x] Rate limiting aplicado a endpoints de OAuth
- [x] Manejo de errores (usuario cancela, email no disponible, etc.)

---

## Variables de entorno necesarias

### Backend (.env)
```env
GOOGLE_CLIENT_ID="tu-client-id"
GOOGLE_CLIENT_SECRET="tu-client-secret"
GOOGLE_CALLBACK_URL="http://localhost:3001/api/v1/auth/google/callback"
GITHUB_CLIENT_ID="tu-client-id"
GITHUB_CLIENT_SECRET="tu-client-secret"
GITHUB_CALLBACK_URL="http://localhost:3001/api/v1/auth/github/callback"
```

### Frontend (.env)
```env
NEXT_PUBLIC_NESTJS_API_URL="http://localhost:3001/api/v1"
```

Las URLs de OAuth se construyen dinámicamente: `{NEXT_PUBLIC_NESTJS_API_URL}/auth/google` y `{NEXT_PUBLIC_NESTJS_API_URL}/auth/github` (ver `app/(auth)/login/page.tsx`).

---

## Tecnologías

- passport-google-oauth20
- passport-github2
- @nestjs/passport (ya instalado)
- Google Cloud Console (OAuth 2.0 credentials)
- GitHub OAuth Apps (credentials)

---

## Riesgos

- Google puede tardar en aprobar la app si se publica
- En desarrollo, las cuentas de usuario deben ser agregadas manualmente en Google Cloud Console
- GitHub requiere que el usuario permita el acceso al email (scope user:email) o el email llega vacío
- El scope de Google debe incluir email y profile
- Si el email del proveedor no existe (cuentas privadas), no se puede crear el usuario → se rechaza

---

## Resultado esperado

Los usuarios pueden iniciar sesión o registrarse con Google y GitHub de forma fluida. La estructura de DB soporta múltiples proveedores y vinculación de cuentas.

---

## Próxima etapa

Stage 02 — Perfil de usuario y preferencias
