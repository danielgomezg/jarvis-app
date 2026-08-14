# ADR-003: Uso de PostgreSQL

## Estado

Aceptado

---

## Fecha

2026-05-14

---

## Contexto

Se necesita una base de datos para Jarvis que:
- Soporte relaciones complejas (users, profiles, sessions, recipes, etc.)
- Maneje arrays y tipos personalizados
- Sea robusta y probada en producción
- Tenga buena integración con Prisma
- Tenga opciones gratuitas para desarrollo

---

## Decisión

Se decidió usar **PostgreSQL** como base de datos principal, alojada en **Neon** (free tier).

---

## Consecuencias

### Ventajas

- **ACID compliant**: Transacciones seguras y consistencia de datos
- **Tipos avanzados**: Soporte para arrays (`text[]`), JSON, enums, etc.
- **Integridad referencial**: Foreign keys, CHECK constraints, triggers
- **Prisma integration**: Prisma tiene soporte excelente para PostgreSQL
- **Escalable**: Puede crecer de un proyecto pequeño a uno empresarial
- **Comunidad**: Es la DB relacional más popular en empresas
- **Neon free tier**: 512 MB存储, 24/7 compute, ideal para desarrollo

### Desventajas

- **Complejidad**: Más compleja que SQLite o MongoDB para casos simples
- **Memoria**: Requiere más recursos que alternativas ligeras
- **Configuración**: Requiere tuning para producción (connection pooling, etc.)

---

## Alternativas consideradas

- **SQLite**: Más simple, sin servidor, pero no escalable y sin soporte para arrays nativos.
- **MongoDB**: Flexible para documentos JSON, pero sin relaciones ACID y menos maduro para casos de uso relacional.
- **MySQL**: Similar a PostgreSQL, pero con menos tipos avanzados y sin arrays nativos.
- **PlanetScale**: MySQL managed, sin foreign keys (diferente filosofía), free tier limitado.
- **Supabase**: PostgreSQL managed con features extra (Auth, Realtime), pero más caro que Neon.

---

## Referencias

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Neon](https://neon.tech/)
- [Prisma PostgreSQL Guide](https://www.prisma.io/docs/orm/overview/databases/postgresql)
