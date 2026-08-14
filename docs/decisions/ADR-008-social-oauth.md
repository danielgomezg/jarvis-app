# ADR-008: Social OAuth (Google + GitHub)

## Estado

Aceptado

---

## Fecha

2026-08-13

---

## Contexto

Jarvis necesita reducir la fricción del registro/login. El registro manual con email + password (Stage 01) ya funciona, pero exige llenar formularios y verificar email. Se quiere permitir a los usuarios:

- Crear cuenta e iniciar sesión con su cuenta de Google o GitHub en un clic
- Vincular un proveedor social a una cuenta ya existente (email/password)
- Mantener una única identidad de usuario independientemente del proveedor usado

El modelo de datos ya contempla `AuthCredential` con un campo `provider`, diseñado para soportar múltiples métodos de login sobre una misma entidad `User`.

---

## Decisión

Se decidió implementar **OAuth 2.0 (Authorization Code Flow)** nativo con Passport para dos proveedores: **Google** y **GitHub**.

### Cómo funciona

- Endpoints públicos: `GET /auth/google`, `GET /auth/google/callback`, `GET /auth/github`, `GET /auth/github/callback`
- Cada proveedor usa su strategy de Passport (`passport-google-oauth20`, `passport-github2`)
- El callback intercambia el `code` por un perfil del proveedor (email, nombre, avatar, id)
- El backend identifica/crea al usuario **por email** y lo vincula al proveedor en `AuthCredential`
- Después del login social se genera el mismo par de tokens JWT que en el login local y se setea la cookie `refreshToken`
- El frontend redirige al usuario a `/oauth-success`

### Estrategia de vinculación (`validateOAuthUser`)

1. Si el email **no existe** → se crea `User` + `Profile` + `AuthCredential` (usuario queda `isVerified: true`, `isActive: true`, sin password)
2. Si el email **existe** y ya tiene credencial del proveedor → login directo
3. Si el email **existe** pero no tiene credencial del proveedor → se crea la `AuthCredential` vinculando el proveedor a la cuenta existente (esto implementa el "vincular cuenta", también marca verificado si no lo estaba)

---

## Consecuencias

### Ventajas

- **Menos fricción**: El usuario entra con un clic, sin formularios ni verificación de email
- **Seguridad delegada**: La validación de contraseñas/sesión del proveedor la maneja Google/GitHub
- **Un solo usuario, múltiples proveedores**: El modelo `AuthCredential` permite que una cuenta tenga credencial LOCAL + GOOGLE + GITHUB simultáneamente
- **Estándar**: OAuth 2.0 es el estándar de la industria

### Desventajas

- **Dependencia del proveedor**: Si Google/GitHub cambian su API o caen, el login social se rompe
- **Email como clave de vinculación**: Si un usuario usa emails distintos en distintos proveedores, termina con dos cuentas separadas. Si un tercero controla el email, existe riesgo de account takeover (mitigado parcialmente porque el login del proveedor requiere el password de ese proveedor)
- **Cuentas sin email**: GitHub puede devolver email vacío si el usuario tiene el email privado y no otorga el scope → se rechaza el login
- **Complejidad de configuración**: Credenciales por proveedor en Google Cloud Console y GitHub OAuth Apps, con URLs de callback explícitas

---

## Alternativas consideradas

- **Auth0 / Clerk / Supabase Auth (servicio externo)**: Mucho más rápido de implementar y gestiona proveedores/sesiones, pero agrega una dependencia de pago, vendor lock-in y no nos enseña el flujo real de OAuth (el proyecto es educativo).
- **Magic Links como único método social**: Sin contraseñas, pero no reemplaza el deseo de "login con Google/GitHub" y agrega dependencia de email delivery.
- **Solo un proveedor (Google)**: Menor cobertura; se decidió incluir GitHub porque los usuarios de GitHub también son objetivo y valida que la arquitectura es multi-proveedor.
- **JWT del proveedor sin verificación de email**: Más simple, pero peligroso (permite spoofing). Se rechazó: siempre se valida email con el scope adecuado.

---

## Related ADRs

- ADR-002: Uso de JWT — el login social emite el mismo par de tokens JWT del sistema dual
- ADR-009: Proxy + cookies HttpOnly + middleware refresh — el acceso al callback setea la cookie de sesión

---

## Referencias

- [Passport Google OAuth20](https://www.passportjs.org/packages/passport-google-oauth20/)
- [Passport GitHub2](https://www.passportjs.org/packages/passport-github2/)
- [Google OAuth 2.0 (Authorization Code)](https://developers.google.com/identity/protocols/oauth2/web-server)
- [GitHub OAuth Apps](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps)
