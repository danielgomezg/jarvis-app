# Jarvis — AI Cooking Assistant

Asistente culinario impulsado por IA que ayuda a crear recetas y planificaciones semanales de comida según los objetivos del usuario.

> **Proyecto educativo**: El objetivo es aprender tecnologías profesionales utilizadas en empresas reales, no terminar rápido.

---

## Stack Tecnológico

### Backend

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| NestJS | 11 | Framework backend |
| TypeScript | 5.7 | Type safety |
| Prisma | 7 | ORM |
| PostgreSQL | - | Base de datos (Neon) |
| Passport + JWT | - | Autenticación |
| passport-google-oauth20 | - | OAuth con Google |
| passport-github2 | - | OAuth con GitHub |
| bcrypt | 6 | Hashing de passwords |
| SendGrid | 8 | Envío de emails |
| @nestjs/throttler | 6 | Rate limiting |
| Swagger | 11 | Documentación de API |

### Frontend

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| Next.js | 16 | Framework frontend (App Router) |
| React | 19 | UI library |
| Tailwind CSS | 4 | Estilos |
| shadcn/ui | 4 | Componentes UI (Radix Nova) |
| Zustand | 5 | State management |
| React Hook Form | 7 | Formularios |
| Zod | 4 | Validación de schemas |
| Axios | 1.18 | HTTP client |

---

## Estructura del Proyecto

```
Proyecto-Jarvis-Evolve/
├── backend-jarvis/          # NestJS API
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/        # Autenticación (login, register, logout, refresh, verify, OAuth)
│   │   │   ├── profile/     # Perfil de usuario
│   │   │   └── mail/        # Envío de emails (SendGrid)
│   │   └── prisma/          # Prisma service (global singleton)
│   ├── prisma/
│   │   ├── schema.prisma    # Schema de BD (5 modelos)
│   │   └── seed.ts          # Seed data (planes free/pro)
│   └── test/                # E2E tests
│
├── frontend-jarvis/         # Next.js App
│   ├── app/
│   │   ├── (auth)/          # Páginas públicas (login, register, verify)
│   │   ├── (private)/       # Páginas protegidas (dashboard)
│   │   └── api/auth/        # API routes proxy (manejo de cookies)
│   ├── components/          # Componentes reutilizables
│   ├── hooks/auth/          # Custom hooks de auth
│   ├── services/auth/       # AuthService (llamadas a API)
│   ├── store/               # Zustand stores
│   ├── schemas/             # Zod validation schemas
│   └── middleware.ts        # Protección de rutas
│
└── docs/                    # Documentación del proyecto
    ├── architecture/        # Documentación técnica
    ├── decisions/           # ADRs (Architecture Decision Records)
    ├── planing/             # Planning por etapas
    ├── roadmap/             # Tecnologías a aprender
    └── templates/           # Templates para documentación
```

---

## Base de Datos

5 modelos principales (PostgreSQL via Neon):

- **Plan** — Planes de usuario (free, pro)
- **User** — Usuarios con email, username, estado de verificación
- **AuthCredential** — Credenciales (LOCAL para email/password, GOOGLE y GITHUB para OAuth)
- **UserSession** — Sesiones activas con refresh tokens hasheados
- **Profile** — Perfil de usuario con campos de chef (preferencias dietéticas, alérgenos, porciones)

---

## Autenticación

Sistema dual de tokens:

- **Access token**: JWT de 15 minutos (payload: authId, email, profileId)
- **Refresh token**: Token opaco de 7 días (hasheado con bcrypt en DB)

Features:
- Registro con verificación de email (SendGrid)
- Login social con Google y GitHub (OAuth 2.0)
- Rotación de tokens en cada refresh
- Detección de robo de tokens (revoca todas las sesiones)
- Rate limiting por endpoint
- Cookies HttpOnly + API routes proxy + middleware refresh

---

## Cómo Correr

### Prerrequisitos

- Node.js 18+
- pnpm
- PostgreSQL (local o Neon)

### Backend

```bash
cd backend-jarvis
pnpm install
cp ../.env.exampleBackV1 .env  # Configurar variables de entorno
pnpm run prisma:generate
pnpm run prisma:migrate
pnpm run start:dev
# API: http://localhost:3001
# Swagger: http://localhost:3001/docs
```

### Frontend

```bash
cd frontend-jarvis
pnpm install
cp .env.example .env  # Configurar variables de entorno
pnpm run dev
# App: http://localhost:3000
```

---

## Variables de Entorno

### Backend (.env)

```env
DATABASE_URL="postgresql://..."
JWT_SECRET="tu-jwt-secret"
JWT_REFRESH_SECRET="tu-refresh-secret"
SENDGRID_API_KEY="tu-api-key"
SENDGRID_FROM_EMAIL="tu-email"
SENDGRID_FROM_NAME="Jarvis"
FRONTEND_URL="http://localhost:3000"
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

---

## Estado Actual

### Completado ✅

- [x] Backend: Auth completo (register, login, logout, refresh, verify email)
- [x] Backend: Social OAuth (Google + GitHub)
- [x] Backend: Profile básico (GET profile/me)
- [x] Backend: Mail service (SendGrid)
- [x] Backend: Rate limiting global
- [x] Backend: Swagger documentado
- [x] Frontend: Páginas de auth (login, register, confirmation, verify, oauth-success)
- [x] Frontend: Middleware de protección de rutas
- [x] Frontend: API proxy para manejo seguro de cookies
- [x] Frontend: Zustand store para estado de usuario
- [x] Frontend: Formularios con React Hook Form + Zod
- [x] Documentación: Architecture docs, ADRs, Planning, Roadmap

### Pendiente 🔄

- [ ] Auth con Twitter/X
- [ ] Testing (unit + E2E)
- [ ] Docker + Docker Compose
- [ ] CI/CD con GitHub Actions
- [ ] Páginas de Recetas, Despensa, Planificador
- [ ] Integración con APIs de recetas
- [ ] Deployment a producción

---

## Documentación

| Archivo | Descripción |
|---------|-------------|
| `docs/AI_CONTEXT.md` | Instrucciones para IA |
| `docs/PROJECT_GOALS.md` | Objetivos del proyecto |
| `docs/PROJECT_ENGINEERING_GUIDE.md` | Flujo de trabajo |
| `docs/architecture/authentication.md` | Cómo funciona la autenticación |
| `docs/architecture/frontend.md` | Arquitectura del frontend |
| `docs/decisions/ADR-001-use-nestjs.md` | Por qué NestJS |
| `docs/decisions/ADR-002-use-jwt.md` | Por qué JWT |
| `docs/decisions/ADR-003-use-postgresql.md` | Por qué PostgreSQL |
| `docs/decisions/ADR-004-use-sendgrid.md` | Por qué SendGrid |
| `docs/decisions/ADR-005-use-nextjs.md` | Por qué Next.js |
| `docs/decisions/ADR-006-use-zustand.md` | Por qué Zustand |
| `docs/decisions/ADR-007-use-shadcn.md` | Por qué shadcn/ui |
| `docs/decisions/ADR-008-social-oauth.md` | Por qué OAuth social (Google + GitHub) |
| `docs/decisions/ADR-009-cookie-auth-proxy-middleware.md` | Por qué proxy + cookies HttpOnly + middleware refresh |
| `docs/planing/stage-01-auth.md` | Planning de la etapa de auth |
| `docs/planing/stage-01b-google-oauth.md` | Planning del OAuth social |
| `docs/roadmap/notes.md` | Tecnologías a aprender |

---

## Licencia

Proyecto educativo. No está licenciado para producción.
