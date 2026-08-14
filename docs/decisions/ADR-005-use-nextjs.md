# ADR-005: Uso de Next.js

## Estado

Aceptado

---

## Fecha

2026-07-20

---

## Contexto

Se necesita un framework frontend para Jarvis que:
- Soporte Server-Side Rendering (SSR) y Static Generation (SSG)
- Tenga API routes para manejar cookies HttpOnly de forma segura
- Soporte TypeScript nativamente
- Tenga buena integración con Tailwind CSS
- Sea escalable y con buena documentación
- Tenga alta demanda laboral

---

## Decisión

Se decidió usar **Next.js 16** con App Router como framework frontend.

---

## Consecuencias

### Ventajas

- **App Router**: Rutas basadas en archivos con layouts anidados y route groups
- **API Routes**: Permiten crear endpoints proxy para manejar cookies HttpOnly server-side (seguro)
- **SSR/SSG**: Optimización de rendimiento y SEO
- **TypeScript nativo**: Sin configuración adicional
- **Middleware**: Protección de rutas en el edge
- **Integración**: Ecosistema completo (Vercel, Tailwind, shadcn)
- **Comunidad**: Framework más popular de React, alta demanda laboral

### Desventajas

- **Complejidad**: Más complejo que Create React App o Vite
- **Overhead**: Para apps simples, puede ser demasiado
- **Vendor lock-in**: Mejor experiencia en Vercel (aunque funciona en otros hostings)
- **Versión 16 muy nueva**: Puede tener bugs o breaking changes

---

## Alternativas consideradas

- **Vite + React**: Más simple y rápido de configurar, pero sin SSR/API routes nativas. Necesitarías un servidor separado para manejar cookies.
- **Remix**: Similar a Next.js, pero menos popular y con menor ecosistema.
- **Nuxt.js**: Vue en vez de React. Menor demanda laboral que React/Next.js.
- **SvelteKit**: Más moderno y rápido, pero menor ecosistema y menos empresas lo usan.
- **Astro**: Mejor para content sites, no tan bueno para apps con auth compleja.

---

## Referencias

- [Next.js Documentation](https://nextjs.org/docs)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Next.js GitHub](https://github.com/vercel/next.js)
