# ADR-002: Uso de JWT

## Estado

Aceptado

---

## Fecha

2026-05-14

---

## Contexto

Se necesita un mecanismo de autenticación para Jarvis que:
- Sea stateless (sin estado en el servidor para cada request)
- Escale horizontalmente
- Funcione con múltiples clientes (web, móvil)
- Sea estándar en la industria
- Soporte refresh tokens de forma segura

---

## Decisión

Se decidió usar **JWT (JSON Web Tokens)** con un sistema dual:
- **Access token**: JWT de 15 minutos con payload `{ authId, email, profileId? }`
- **Refresh token**: Token opaco de 7 días, hasheado con bcrypt y guardado en DB

---

## Consecuencias

### Ventajas

- **Stateless**: No se necesita sesión en el servidor para validar access tokens
- **Escalable**: Funciona con múltiples instancias sin共享 estado
- **Estándar**: Ampliamente usado en la industria, alta demanda laboral
- **Flexible**: El payload puede contener cualquier claim necesario
- **Integración**: Passport.js tiene soporte nativo para JWT

### Desventajas

- **No se pueden revocar fácilmente**: El access token es válido hasta que expire
- **Payload descifrable**: Cualquiera puede leer el payload (no contiene secrets)
- **Tamaño**: Los JWT pueden ser más grandes que session IDs tradicionales
- **Complejidad**: Manejar dos tipos de tokens增加了 complejidad

---

## Alternativas consideradas

- **Session-based auth (cookies + server sessions)**: Más simple de revocar, pero requiere almacenamiento de sesión en servidor, no escala bien horizontalmente sin shared session store.
- **OAuth 2.0 sin JWT**: Usar tokens opacos para todo. Más seguro (tokens no descifrables), pero más complejo de implementar y menos común.
- **PASETO**: Más seguro que JWT, pero menos adoptado y con menos ecosistema.
- **Magic Links**: Sin password, pero mala UX para apps con múltiples dispositivos.

---

## Referencias

- [JWT.io](https://jwt.io/)
- [RFC 7519 - JSON Web Token](https://tools.ietf.org/html/rfc7519)
- [NestJS Authentication](https://docs.nestjs.com/security/authentication)
