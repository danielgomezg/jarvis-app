# ADR-006: Uso de Zustand

## Estado

Aceptado

---

## Fecha

2026-07-20

---

## Contexto

Se necesita una solución de state management para Jarvis que:
- Sea simple y con poca boilerplate
- No requiera providers ni wrappers
- Soporte persistencia en localStorage
- Funcione bien con Next.js y React 19
- Tenga buen rendimiento (re-renders mínimos)
- Sea fácil de aprender

---

## Decisión

Se decidió usar **Zustand v5** como solución de state management.

---

## Consecuencias

### Ventajas

- **Sin boilerplate**: No necesita providers, contexts, ni wrappers
- **API simple**: `create()` + hooks personalizados
- **Persistencia nativa**: Middleware `persist` para localStorage
- **Selectores**: Evita re-renders innecesarios
- **TypeScript**: Excelente soporte de tipos
- **Rendimiento**: Solo re-renderiza cuando cambia el estado seleccionado
- **Bundle size**: Muy pequeño (~1KB)

### Desventajas

- **Menor ecosistema**: Menos plugins y herramientas que Redux
- **Menos popular**: Más difícil encontrar tutoriales y ejemplos
- **DevTools**: Menos potentes que Redux DevTools
- **Patrones**: Menos patrones establecidos para arquitecturas complejas

---

## Alternativas consideradas

- **Redux Toolkit**: Más popular y con mejor ecosistema, pero más boilerplate (slices, reducers, actions). Overkill para el estado actual de Jarvis.
- **Context API + useReducer**: Nativo de React, pero causa re-renders innecesarios y no tiene persistencia nativa.
- **Jotai**: Más flexible para átomos, pero menos intuitivo para estado global.
- **Recoil**: Similar a Jotai, pero menos mantenimiento.
- **MobX**: Más potente para objetos complejos, pero más complejo de aprender.

---

## Referencias

- [Zustand Documentation](https://zustand-demo.pmnd.rs/)
- [Zustand GitHub](https://github.com/pmndrs/zustand)
- [Zustand vs Redux](https://docs.pmnd.rs/zustand/faq/how-zustand-differs-from-redux)
