# ADR-007: Uso de shadcn/ui

## Estado

Aceptado

---

## Fecha

2026-07-20

---

## Contexto

Se necesita un sistema de componentes UI para Jarvis que:
- Sea accesible (WCAG compliant)
- Tenga buen diseño por defecto
- Sea personalizable (temas, colores)
- Use componentes headless (Radix UI)
- Integre bien con Tailwind CSS
- Tenga buena documentación y comunidad
- No dependa de un paquete npm (código copiado al proyecto)

---

## Decisión

Se decidió usar **shadcn/ui v4** con Radix Nova como sistema de componentes.

---

## Consecuencias

### Ventajas

- **Código propio**: Los componentes se copian al proyecto, no se importan de npm. Control total.
- **Radix UI**: Componentes headless accesibles por defecto
- **Tailwind CSS**: Estilos utility-first, fácil de personalizar
- **TypeScript**: Excelente soporte de tipos
- **Diseño moderno**: Estilo limpio y profesional
- **Comunidad**: Muy popular en 2024-2026, muchos ejemplos
- **Flexibilidad**: Puedes modificar cualquier componente sin dependencias

### Desventajas

- **Mantenimiento**: Al copiar el código, tú eres responsable de mantenerlo
- **Actualizaciones**: No hay actualizaciones automáticas como con librerías npm
- **Curva de aprendizaje**: Necesitas entender Tailwind y Radix para personalizar
- **Bundle size**: Más grande que componentes minimalistas

---

## Alternativas consideradas

- **MUI (Material UI)**: Más completo y con más componentes, pero más pesado y harder de personalizar. Estilo Material Design (menos moderno).
- **Chakra UI**: Más fácil de usar, pero menos flexible y con peor rendimiento.
- **Ant Design**: Muy completo para enterprise, pero pesado y con estilo propio.
- **Headless UI + Tailwind**: Similar a shadcn pero sin los componentes pre-construidos. Más trabajo manual.
- **Radix Primitives + Tailwind**: shadcn usa Radix internamente, pero tendrías que construir todo desde cero.

---

## Referencias

- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [shadcn/ui GitHub](https://github.com/shadcn-ui/ui)
- [Radix UI](https://www.radix-ui.com/)
