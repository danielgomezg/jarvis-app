# Stage 01 — Autenticación

## Estado

Completada

---

## Prioridad

Alta

---

## Objetivo

Implementar un sistema completo de autenticación con registro, login, verificación de email, refresh de tokens y cierre de sesión.

---

## Estimación de tiempo

2 semanas

---

## Requisitos previos

- PostgreSQL configurado (Neon)
- NestJS 11 instalado y funcionando
- Prisma 7 como ORM

---

## Historias de usuario

- Como usuario, quiero registrarme con email y password para crear una cuenta
- Como usuario, quiero verificar mi email para activar mi cuenta
- Como usuario, quiero iniciar sesión para acceder a la app
- Como usuario, quiero cerrar sesión para salir de forma segura
- Como usuario, quiero que mi sesión se mantenga activa sin tener que loguearme constantemente

---

## Tareas

### Backend
- [x] Instalar dependencias (JWT, Passport, bcrypt, class-validator)
- [x] Configurar ConfigModule con variables de entorno
- [x] Crear DTOs (register, login, refresh, resendVerification)
- [x] Implementar JWT Strategy con Passport
- [x] Implementar JWT Guard global con decorator @Public()
- [x] Implementar AuthService (register, login, logout, refresh, verify, resend)
- [x] Implementar AuthController con 6 endpoints
- [x] Configurar AuthModule con imports de Mail y Passport
- [x] Implementar MailModule con SendGrid
- [x] Configurar rate limiting por endpoint
- [x] Configurar refresh tokens en httpOnly cookies
- [x] Implementar rotación de tokens y detección de robo

### Frontend
- [x] Crear API client con interceptores (dual Axios: api + nextApi)
- [x] Crear Auth Store con Zustand (persistido en localStorage)
- [x] Página de Registro (6 campos, Zod validation)
- [x] Página de Login (email+password, social stubs)
- [x] Página de Confirmación (countdown para reenviar)
- [x] Página de Reenviar Verificación
- [x] Página de Verificación Exitosa (con animación)
- [x] Layout protegido con Navbar
- [x] Middleware de autenticación (cookie-based)
- [x] API routes proxy para login/logout (HttpOnly cookies)
- [x] Componentes reutilizables (Button, Card, FormField, Navbar, Loading, Error)
- [x] Formularios con React Hook Form + Zod

---

## Criterios de aceptación

- [ ] Registro crea User + Profile + AuthCredential
- [ ] Email de verificación se envía al registrarse
- [ ] Login retorna accessToken y setea refreshToken en cookie
- [ ] Refresh token rota en cada llamada
- [ ] Si un refresh token es robado, se revocan todas las sesiones del usuario
- [ ] Logout revoca la sesión y limpia la cookie
- [ ] Rate limiting aplicado a todos los endpoints públicos
- [ ] Swagger documenta todos los endpoints

---

## Tecnologías

### Backend
- NestJS 11
- Prisma 7
- PostgreSQL (Neon)
- Passport + JWT
- bcrypt
- class-validator + class-transformer
- @nestjs/throttler
- SendGrid

### Frontend
- Next.js 16 (App Router)
- React 19
- Tailwind CSS v4
- shadcn/ui v4 (Radix Nova)
- Zustand v5
- React Hook Form v7
- Zod v4
- Axios

---

## Riesgos

- SendGrid tiene límite de 100 emails/día en free tier
- Neon tiene límite de conexiones en free tier
- Refresh tokens en cookies pueden tener problemas con CORS

---

## Resultado esperado

Sistema de autenticación completo, seguro y listo para usar. Preparado para soportar OAuth (Google) en el futuro.

---

## Próxima etapa

Stage 02 — Perfil de usuario y preferencias
