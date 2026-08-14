# Jarvis - AI Cooking Assistant (Backend)

NestJS v11 + TypeScript + Prisma + PostgreSQL backend for an AI-powered cooking assistant SaaS.

## Project Structure

- `backend-jarvis/` - NestJS application
  - `src/` - Source code
    - `main.ts` - Entry point
    - `app.module.ts` - Root module
    - `modules/` - Feature modules (auth, etc.)
    - `prisma/` - Prisma service (global singleton)
  - `prisma/` - Schema & migrations
  - `test/` - E2E tests

## Commands

Run from `backend-jarvis/`:

- `pnpm run build` - Compile TS to dist/
- `pnpm run start:dev` - Dev server with watch mode
- `pnpm run lint` - ESLint + Prettier fix
- `pnpm run test` - Unit tests (jest)
- `pnpm run test:e2e` - E2E tests
- `pnpm run format` - Prettier format

## Database (PostgreSQL via Neon)

Models: Plan, User, AuthCredential, UserSession, Profile
Profile has chef-specific fields: defaultServings, dietaryPreferences[], allergenWarnings[]

## Conventions

- NestJS modular: `src/modules/<feature>/` with `.module.ts`, `.controller.ts`, `.service.ts`, `.spec.ts`
- Snake_case DB columns, camelCase TS properties
- Single quotes, trailing commas, no semicolons (Prettier)
- pnpm package manager
- `.env` at root (Proyecto_Jarvis_V2/) and backend-local (backend-jarvis/.env)
