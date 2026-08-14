# Autenticación

## Estado

Activo

---

## Última actualización

2026-08-13

---

## Objetivo

Implementar un sistema seguro de autenticación que permita a los usuarios registrarse, verificar su email, iniciar y cerrar sesión con manejo de tokens y protección contra robo de sesiones.

---

## Contexto

Jarvis es un SaaS que maneja información personal del usuario (preferencias dietéticas, alergias, etc.). La autenticación es la base de seguridad del sistema. Se necesita un sistema que:
- Sea seguro (tokens hasheados, rotación, detección de robo)
- Escale bien (sin estado en el servidor, solo DB para sesiones)
- Soporte múltiples proveedores (LOCAL + GOOGLE + GITHUB)
- Cumpla con buenas prácticas de la industria

---

## Componentes involucrados

- **Backend**: NestJS con Passport + JWT (local y OAuth)
- **Base de datos**: PostgreSQL (Neon) con Prisma
- **Email**: SendGrid para verificación
- **Frontend**: Next.js con API routes proxy, middleware y cookies HttpOnly

---

## Flujo de Registro

```
1. Usuario envía POST /auth/register
   → { firstName, lastName, userName, email, password }

2. AuthService valida el DTO
   → class-validator verifica formato y longitud mínima

3. Se hashea el password con bcrypt (10 rounds)

4. Se crea en DB (transacción):
   → User (isVerified: false, isActive: false)
   → Profile (campos vacíos)
   → AuthCredential (provider: "LOCAL", passwordHash)

5. Se genera token de verificación (32 bytes random hex)

6. Se envía email de verificación via SendGrid
   → Link: {FRONTEND_URL}/verificated?token={token}

7. Se retorna { user, accessToken, refreshToken }
```

---

## Flujo de Verificación de Email

```
1. Usuario hace clic en link del email
   → GET /auth/verify-email?token={token}

2. AuthService busca AuthCredential por verificationToken

3. Si token es válido y no expiró:
   → User.isVerified = true
   → User.isActive = true
   → User.verificationToken = null
   → User.verificationTokenExpiresAt = null

4. Si token es inválido o expiró:
   → Retorna error 400
```

---

## Flujo de Login

```
1. Usuario envía POST /auth/login
   → { email, password }

2. AuthService busca User por email

3. Se verifica password con bcrypt.compare()

4. Si es válido:
   → Se genera accessToken (15 min, firmado con JWT_SECRET)
   → Se genera refreshToken (7 días, firmado con JWT_REFRESH_SECRET)
   → Se hashea refreshToken con bcrypt
   → Se crea UserSession en DB con el hash
   → Se setea refreshToken en httpOnly cookie
   → Se retorna { user, accessToken }

5. Si es inválido:
   → Retorna error 401
```

---

## Flujo de Refresh Token

```
1. Frontend envía POST /auth/refresh
   → Cookie contiene refreshToken

2. AuthService lee el token de la cookie

3. Se busca UserSession por userId + isRevoked: false

4. Se verifica el token con bcrypt.compare()

5. Si es válido:
   → Se revoca la sesión actual (isRevoked: true)
   → Se genera nuevo par de tokens
   → Se crea nueva UserSession con el nuevo hash
   → Se setea nueva cookie
   → Se retorna nuevos tokens

6. Si no coincide ninguna sesión:
   → ALERTA: Posible robo de token
   → Se revocan TODAS las sesiones del usuario
   → Se retorna error 401
```

---

## Flujo de Logout

```
1. Usuario envía POST /auth/logout
   → Header: Authorization: Bearer {accessToken}

2. Se obtiene userId del token JWT

3. Se busca UserSession activa del usuario

4. Se marca como revocada (isRevoked: true, revokedAt: now)

5. Se limpia la cookie del refresh token

6. Se retorna { message: "Sesión cerrada" }
```

---

## Flujo de OAuth (Google / GitHub)

```
1. Usuario hace clic en "Continuar con Google" (o GitHub)
   → GET /auth/google (público, usa GoogleAuthGuard)

2. Passport redirige al usuario a la consent screen del proveedor

3. Usuario autoriza → el proveedor redirige a /auth/google/callback?code=...

4. La strategy (passport-google-oauth20 / passport-github2) valida el code
   y devuelve el perfil (email, nombre, avatar, id del proveedor)

5. AuthService.validateOAuthUser() decide:
   - Email no existe → crea User + Profile + AuthCredential (isVerified: true)
   - Email existe + credencial del proveedor → login directo
   - Email existe sin credencial → crea AuthCredential (vincula el proveedor)

6. AuthService.loginOauth() genera tokens y setea cookie refreshToken

7. Redirect a {FRONTEND_URL}/oauth-success
   → el frontend lee el usuario (store de Zustand) y navega al home
```

---

## Sesión en el frontend (cookies HttpOnly + proxy + middleware)

### Almacenamiento de tokens

- **`refreshToken`**: cookie HttpOnly seteada por el backend (NestJS), 7 días
- **`access-token`**: cookie HttpOnly seteada por Next.js en las API routes proxy (`app/api/auth/login`, `/refresh`), 15 min

Ambas cookies son inaccesibles desde JavaScript (protección XSS).

### API routes proxy

El browser nunca habla directo con el backend. Las rutas `app/api/auth/*` reenvían a `NEXT_PUBLIC_NESTJS_API_URL` y propagan las cookies:

```
Browser → POST /api/auth/login (Next) → POST /api/v1/auth/login (NestJS)
NestJS: { accessToken, ... } + Set-Cookie: refreshToken
Next:   set access-token (httpOnly) + propaga Set-Cookie refreshToken al browser
```

### Middleware de Next.js

`middleware.ts` protege rutas privadas y refresca la sesión en navegación directa:

```
1. Request a ruta privada sin access-token
2. Si existe refreshToken:
   → fetch interno a /api/auth/refresh
   → OK → NextResponse.next() (continúa a la página)
   → Falla → redirect a /login
3. Si no existe refreshToken → redirect a /login
```

### Interceptor de axios

Cubre la expiración *durante* la sesión: ante un 401 en una API, refresca y reintenta. El store de Zustand se mantiene sincronizado con el usuario.

### Nota sobre el refresh desde middleware

Ver ADR-009. El refresh del middleware reenvía las cookies al browser a través de la API route proxy. El comportamiento de propagación en recargas sucesivas debe verificarse en el browser (DevTools → Application → Cookies) antes de asumir que es confiable sin el interceptor.

---

## Seguridad

### Tokens
- **Access token**: 15 min, payload `{ authId, email, profileId? }`, firmado con `JWT_SECRET`
- **Refresh token**: 7 días, opaco/aleatorio, guardado como bcrypt hash en DB
- **Rotación**: Cada refresh genera nuevos tokens y revoca los anteriores
- **Detección de robo**: Si el token no coincide, se revocan todas las sesiones del usuario

### Rate Limiting
| Endpoint | Límite |
|----------|--------|
| Register | 3/min |
| Verify email | 5/min |
| Login | 100/min |
| Refresh | 15/min (corto), 30/hora (largo) |
| Resend verification | 3/min (corto), 5/hora (largo) |

### Cookies
- `httpOnly: true` — No accesible desde JavaScript
- `secure: true` — Solo se envía por HTTPS (en producción; en dev `false` para localhost)
- `sameSite: 'lax'` — Protección contra CSRF (dev); `'none'` en producción
- La cookie `refreshToken` la setea NestJS; la cookie `access-token` la setea Next.js vía proxy

### Guard Global
- `JwtAuthGuard` registrado como `APP_GUARD` global
- Todas las rutas requieren JWT por defecto
- Rutas públicas usan decorator `@Public()`

---

## Decisiones importantes

- [ADR-001: Uso de NestJS](../decisions/ADR-001-use-nestjs.md)
- [ADR-002: Uso de JWT](../decisions/ADR-002-use-jwt.md)
- [ADR-003: Uso de PostgreSQL](../decisions/ADR-003-use-postgresql.md)
- [ADR-004: Uso de SendGrid](../decisions/ADR-004-use-sendgrid.md)
- [ADR-008: Social OAuth (Google + GitHub)](../decisions/ADR-008-social-oauth.md)
- [ADR-009: Proxy + cookies HttpOnly + middleware refresh](../decisions/ADR-009-cookie-auth-proxy-middleware.md)

---

## Riesgos

- SendGrid free tier: 100 emails/día
- Neon free tier: límite de conexiones simultáneas
- Cookies httpOnly pueden tener problemas con CORS en desarrollo

---

## Mejoras futuras

- [ ] OAuth con Twitter/X
- [ ] Two-Factor Authentication (2FA)
- [ ] Rate limiting con Redis (para escalar a múltiples instancias)
- [ ] Logs de auditoría de login
