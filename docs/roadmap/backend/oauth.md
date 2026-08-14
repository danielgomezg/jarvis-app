# OAuth

## Estado

✅ Completado (Google + GitHub implementados)

---

## Prioridad

⭐⭐⭐⭐

---

## Nivel actual

Intermedio (Google + GitHub implementados y funcionando)

---

## Nivel objetivo

Intermedio

---

## Complejidad

Alta

---

## Tiempo estimado

1-2 semanas

---

## ¿Qué es?

Protocolo de autorización que permite a usuarios autenticarse con cuentas de terceros (Google, GitHub, Twitter, etc.) sin crear credenciales nuevas. El usuario autoriza a la app a acceder a su información básica.

---

## ¿Por qué aprenderlo?

- Estándar en apps modernas (casi todas ofrecen "Continuar con Google")
- Muy solicitado en ofertas laborales
- Mejora la UX (sin crear cuenta nueva)
- Ya tenemos la estructura preparada (AuthCredential con provider)

---

## ¿Cuándo implementarlo?

Implementado. Ver:

- `docs/planing/stage-01b-google-oauth.md` (planning completado)
- `docs/decisions/ADR-008-social-oauth.md` (decisión de diseño)

Pendiente a futuro: Twitter/X y login con password desde cuenta social.

---

## Prerrequisitos

- Auth local implementado (✅ ya está)
- NestJS + Passport (✅ ya está)
- understanding de JWT y refresh tokens

---

## Casos de uso en Jarvis

- Login con Google (prioridad)
- Login con Twitter/X (futuro)
- Vincular cuenta existente con OAuth
- Obtener avatar del usuario desde el proveedor

---

## Dependencias

- @nestjs/passport (✅ ya instalado)
- passport-google-oauth20
- passport-twitter (futuro)

---

## Coste

✅ Gratuito (Google y Twitter no cobran por OAuth)

---

## Desarrollo local

- Crear proyecto en Google Cloud Console
- Configurar OAuth 2.0 credentials
- Usar ngrok o localhost para callbacks

---

## Cuenta necesaria

Sí, cuenta de Google Cloud Console (gratuita).

---

## Demanda en ofertas laborales

⭐⭐⭐⭐ Alta

---

## Objetivo de aprendizaje

- [x] Implementar Google OAuth con Passport
- [x] Implementar GitHub OAuth con Passport
- [x] Manejar el flujo OAuth completo (redirect → callback → token)
- [x] Crear o vincular usuario existente
- [x] Manejar errores comunes (usuario cancela, email no disponible)
- [ ] Entender la diferencia entre OAuth y OpenID Connect

---

## Recursos oficiales

- [Passport Google OAuth20](https://github.com/jaredhanson/passport-google-oauth20)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [NestJS Authentication](https://docs.nestjs.com/security/authentication)

---

## Estado en Jarvis

✅ Completado. Google y GitHub implementados (strategies, guards, endpoints `/auth/{google|github}` y callbacks, vinculación por email). Próximo: Twitter/X.
