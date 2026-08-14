# GitHub Actions

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

Plataforma de CI/CD integrada en GitHub que permite automatizar workflows: tests, lint, build, deploy, etc. Se ejecuta en response a eventos (push, PR, etc.).

---

## ¿Por qué aprenderlo?

- Estándar absoluto en la industria (casi todos los repos lo usan)
- Gratis para repos públicos
- Integra directamente con el repositorio
- Automatiza tareas repetitivas
- Esencial para trabajo en equipo
- Muy solicitado en ofertas laborales

---

## ¿Cuándo implementarlo?

Ahora. Es una de las primeras cosas que se deberían configurar:
- Para que cada push ejecute tests automáticamente
- Para que cada PR valide que no se rompió nada
- Para automatizar el deploy a producción

---

## Prerrequisitos

- Git y GitHub (✅ ya se usa)
- Proyecto con tests configurados

---

## Casos de uso en Jarvis

- Ejecutar lint en cada push
- Ejecutar tests unitarios en cada PR
- Ejecutar tests E2E en cada PR
- Build automático
- Deploy automático a producción
- Notificaciones de fallos

---

## Dependencias

- Repositorio en GitHub
- Proyecto con scripts de test/lint/build

---

## Coste

✅ Gratuito para repos públicos (2,000 minutos/mes)

---

## Desarrollo local

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm lint
      - run: pnpm test
      - run: pnpm build
```

---

## Cuenta necesaria

No (ya tienes GitHub).

---

## Demanda en ofertas laborales

⭐⭐⭐⭐⭐ Muy alta (casi obligatorio)

---

## Objetivo de aprendizaje

- Crear workflows básicos (CI)
- Configurar matrix builds (múltiples versiones de Node)
- Usar secrets para variables sensibles
- Deploy automático
- Cachear dependencias para builds más rápidos
- Conditional workflows

---

## Recursos oficiales

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub Actions Marketplace](https://github.com/marketplace?type=actions)
- [Actions Tutorial](https://docs.github.com/en/actions/quickstart)

---

## Estado en Jarvis

❌ No implementado
