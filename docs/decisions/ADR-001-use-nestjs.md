# ADR-001: Uso de NestJS

## Estado

Aceptado

---

## Fecha

2026-05-14

---

## Contexto

Se necesita un framework backend para Jarvis que:
- Soporte TypeScript nativamente
- Sea escalable y mantenible
- Tenga buena documentación y comunidad
- Siga principios de arquitectura limpia
- Soporte inyección de dependencias
- Facilite la creación de APIs REST

---

## Decisión

Se decidió usar **NestJS 11** como framework backend.

---

## Consecuencias

### Ventajas

- TypeScript nativo, sin configuración adicional
- Arquitectura basada en módulos (similar a Angular)
- Inyección de dependencias nativa
- Guards, Interceptors, Pipes, Decorators para cross-cutting concerns
- Swagger integrado para documentación de API
- Gran ecosistema de paquetes oficiales (@nestjs/jwt, @nestjs/passport, etc.)
- Comunidad activa y buena documentación
- Similar a lo que se usa en empresas reales (alta demanda laboral)

### Desventajas

- Curva de aprendizaje inicial (conceptos como módulos, providers, guards)
- Más verboso que Express/Fastify para casos simples
- Overhead de decoradores y metadata reflection

---

## Alternativas consideradas

- **Express**: Más simple y directo, pero carece de estructura opinionada. Sería más difícil de mantener a medida que el proyecto crezca.
- **Fastify**: Más rápido que Express, pero mismo problema de falta de estructura.
- **AdonisJS**: Similar a NestJS pero con menos comunidad y ecosistema.
- **tRPC**: Más simple para full-stack TypeScript, pero menos flexible para APIs públicas.
- **Hono**: Más moderno y rápido, pero menor ecosistema y menos empresas lo usan en producción.

---

## Referencias

- [NestJS Documentation](https://docs.nestjs.com/)
- [NestJS GitHub](https://github.com/nestjs/nest)
