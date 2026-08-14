# ADR-009: Proxy + Cookies HttpOnly + Middleware Refresh

## Estado

Aceptado

---

## Fecha

2026-08-13

---

## Contexto

El backend emite un `accessToken` (JWT, 15 min) y un `refreshToken` (opaco, 7 días, hasheado en DB). El problema: **dónde almacenar los tokens en el frontend**.

- Guardar el accessToken en `localStorage`/`sessionStorage` lo expone a XSS (cualquier script inyectado puede leerlo)
- El `refreshToken` **no debe ser accesible desde JavaScript** jamás, porque permite renovar la sesión indefinidamente

Además, en una SPA con Next.js App Router, el refresh no puede depender solo del interceptor de axios del browser: el **middleware de Next.js** también necesita saber si el usuario está autenticado (protección de rutas) y refrescar la sesión en cada navegación.

Se necesita una arquitectura que:
- Mantenga ambos tokens fuera del alcance de JavaScript
- Permita que el middleware (server-side) verifique/renueve la sesión
- Siga el modelo de rotación y detección de robo del backend (ADR-002)

---

## Decisión

Se decidió usar **cookies HttpOnly + API routes proxy + refresh desde middleware**.

### Componentes

1. **Cookie `refreshToken`** — la setea el backend (NestJS) directamente: `httpOnly: true`, `sameSite: 'lax'` en dev / `'none'` en prod, `path: '/'`, 7 días. El browser nunca la lee desde JS.
2. **Cookie `access-token`** — la setea Next.js en las API routes proxy (`app/api/auth/*`), también `httpOnly: true`. El accessToken viaja en el body JSON del backend; el proxy lo toma y lo convierte en cookie. Así el token de cada request tampoco está en JS.
3. **API routes proxy** (`app/api/auth/login`, `/refresh`, `/logout`) — mismo origen que el frontend, reenvían al backend (`NEXT_PUBLIC_NESTJS_API_URL`) y propagan las cookies. Evitan CORS y exponer las URLs/secretos del backend.
4. **Middleware de Next.js** (`middleware.ts`) — si el usuario pide una ruta privada sin `access-token`:
   - Si existe `refreshToken` → hace `fetch` interno a `/api/auth/refresh` → si OK, `NextResponse.next()` (continúa); si falla, redirect a `/login`
   - Si no existe `refreshToken` → redirect a `/login`
5. **Interceptor de axios** — cubre la expiración *durante* la sesión: cuando una API responde 401, refresca y reintenta la request. El store de Zustand actualiza el usuario.

### Flujo de login (proxy)

```
Browser → POST /api/auth/login (Next) → POST /api/v1/auth/login (NestJS)
NestJS: { accessToken, ... } + Set-Cookie: refreshToken
Next:   set access-token cookie (httpOnly) + propaga Set-Cookie refreshToken al browser
```

---

## Consecuencias

### Ventajas

- **Seguridad**: Ambos tokens son HttpOnly; un XSS no puede robarlos desde JavaScript
- **Sin CORS**: El browser solo habla con el mismo origen; el proxy interno maneja el cross-origin
- **Refresh en navegación**: El middleware renueva la sesión aunque el usuario navegue directamente (URL, F5) sin pasar por el interceptor
- **Un solo mecanismo de sesión**: Middleware e interceptor consumen el mismo `/api/auth/refresh`

### Desventajas

- **Complejidad**: Dos fuentes de cookie (`refreshToken` del backend, `access-token` de Next) y dos puntos de refresh (middleware + interceptor) que deben mantenerse sincronizados
- **Doble refresh en la misma página**: Si el middleware refresca y luego un request del browser recibe 401, el interceptor podría refrescar otra vez (rotación de tokens → el segundo puede quedar invalidado). Mitigación: el middleware solo actúa cuando no hay `access-token`, y el interceptor solo ante 401.
- **Riesgo conocido (a verificar)**: En el código fuente de Next.js 16 (`next-server.js`, `runMiddleware`) la respuesta del `fetch` interno del middleware se procesa por separado de la respuesta final que recibe el browser; las `Set-Cookie` del fetch interno no se reenvían automáticamente. El refresh desde el middleware actualmente depende de este comportamiento, que se debe confirmar en el browser (DevTools → Application → Cookies tras una recarga con token vencido) antes de asumir que persiste en recargas sucesivas.
- **`secure: true` solo en producción**: En desarrollo la cookie viaja sin HTTPS (localhost), correcto; en producción requiere TLS.

---

## Alternativas consideradas

- **Toda la sesión en localStorage + Authorization header**: Más simple, pero ambos tokens expuestos a XSS. Rechazado por seguridad.
- **Single cookie de sesión (backend-session)**: Más simple, pero va contra ADR-002 (JWT stateless) y agrega estado en servidor.
- **Refresh 100% en el interceptor del browser**: No cubre el caso de navegación directa/F5 donde el middleware debe decidir si deja pasar la página.
- **Auth.js (NextAuth) / NextAuth v5**: Maneja sesiones JWT/database con cookies, pero es otro framework con su propio modelo de sesión y no aprovecha el backend NestJS como única fuente de verdad.

---

## Related ADRs

- ADR-002: Uso de JWT — define el par access/refresh que esta arquitectura custodia
- ADR-005: Uso de Next.js — el middleware y las API routes son features de App Router
- ADR-008: Social OAuth — el callback OAuth setea la cookie `refreshToken` y redirige a `/oauth-success`, donde aplica este mismo modelo

---

## Referencias

- [Next.js: Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Next.js: Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Next.js: Reading and writing cookies](https://nextjs.org/docs/app/api-reference/functions/cookies)
- [OWASP: Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
