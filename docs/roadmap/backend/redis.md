# Redis

## Estado

🔴 Pendiente

---

## Prioridad

⭐⭐⭐⭐⭐

---

## Nivel actual

Nada

---

## Nivel objetivo

Intermedio

---

## Complejidad

Media

---

## Tiempo estimado

2 semanas

---

## ¿Qué es?

Almacenamiento en memoria (in-memory) que se usa como cache, session store, message broker y rate limiter. Es extremadamente rápido porque guarda datos en RAM en vez de disco.

---

## ¿Por qué aprenderlo?

- Muy solicitado en ofertas laborales ( Backend, DevOps)
- Necesario para rate limiting en producción (el actual @nestjs/throttler no escala a múltiples instancias)
- Cache de sesiones y datos frecuentes
- Cola de mensajes para tareas en segundo plano
- Estándar en la industria para apps escalables

---

## ¿Cuándo implementarlo?

Después de:
- Auth completo (ya está)
- Testing básico
- Primer despliegue

Se implementa cuando:
- El rate limiting con @nestjs/throttler se quede corto
- Necesitemos cache de queries frecuentes
- Queramos sesiones compartidas entre múltiples instancias

---

## Prerrequisitos

- NestJS (ya implementado)
- Conceptos básicos de caché y expired keys

---

## Casos de uso en Jarvis

- Rate limiting distribuido (más robusto que @nestjs/throttler)
- Cache de recetas populares
- Cache de perfil de usuario
- Cola de envío de emails
- Sesiones de usuario (alternativa a DB)
- Lock distribuido para evitar race conditions

---

## Dependencias

- NestJS
- PostgreSQL (para datos persistentes, Redis es solo cache)

---

## Coste

✅ Redis Cloud free tier: 30 MB, suficiente para desarrollo

---

## Desarrollo local

```bash
docker run -d --name redis -p 6379:6379 redis:alpine
```

---

## Cuenta necesaria

No para desarrollo. Sí para producción (Redis Cloud free tier).

---

## Demanda en ofertas laborales

⭐⭐⭐⭐⭐ Muy alta

---

## Objetivo de aprendizaje

- Conectar NestJS con Redis
- Implementar rate limiting con Redis
- Implementar caching de queries
- Usar Redis como session store
- Entender pub/sub para mensajes

---

## Recursos oficiales

- [Redis Documentation](https://redis.io/docs/)
- [Redis University](https://university.redis.com/)
- [NestJS Redis](https://docs.nestjs.com/techniques/caching)

---

## Estado en Jarvis

❌ No implementado
