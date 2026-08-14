# Docker

## Estado

🔴 Pendiente

---

## Prioridad

⭐⭐⭐⭐⭐

---

## Nivel actual

Básico

---

## Nivel objetivo

Intermedio

---

## Complejidad

Media

---

## Tiempo estimado

1 semana

---

## ¿Qué es?

Plataforma de containerización que permite empaquetar aplicaciones con todas sus dependencias en contenedores portables. Docker Compose permite orquestar múltiples contenedores.

---

## ¿Por qué aprenderlo?

- Estándar absoluto en la industria (casi todas las ofertas lo piden)
- Reproducibilidad: "funciona en mi máquina" → "funciona en cualquier máquina"
- Facilita CI/CD y despliegues
- Base para Kubernetes
- Desarrollo local con múltiples servicios (DB, Redis, etc.)

---

## ¿Cuándo implementarlo?

Ahora mismo. Es una de las primeras cosas que se deberían implementar:
- Para tener el entorno de desarrollo estandarizado
- Para facilitar el despliegue a producción
- Para preparar el terreno para CI/CD

---

## Prerrequisitos

- Conceptos básicos de redes (puertos, IPs)
- Línea de comandos básica

---

## Casos de uso en Jarvis

- Containerizar NestJS backend
- Containerizar Next.js frontend
- PostgreSQL como servicio
- Redis como servicio (cuando se implemente)
- Desarrollo local con docker-compose up
- Despliegue a producción (Render, Railway, AWS)

---

## Dependencias

- Ninguna (se puede usar independientemente)

---

## Coste

✅ Docker Desktop free para uso personal/educativo

---

## Desarrollo local

```bash
# Instalar Docker Desktop
# Luego:
docker-compose up -d
```

---

## Cuenta necesaria

No. Docker funciona 100% local.

---

## Demanda en ofertas laborales

⭐⭐⭐⭐⭐ Muy alta (casi obligatorio)

---

## Objetivo de aprendizaje

- Crear Dockerfiles para NestJS y Next.js
- Usar Docker Compose para desarrollo local
- Multi-stage builds para optimizar imágenes
- volumes para persistir datos
- networks para comunicación entre contenedores
- Variables de entorno y secrets

---

## Recursos oficiales

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)
- [Dockerfile Best Practices](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)

---

## Estado en Jarvis

❌ No implementado
