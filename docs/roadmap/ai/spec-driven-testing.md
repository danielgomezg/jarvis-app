# Spec-driven testing con agentes

## Objetivo

Aprender a escribir tests desde una **especificación de comportamiento** (sin mirar el código) usando un agente distinto al que escribió el código, para reducir los puntos ciegos compartidos entre implementación y tests. El piloto se hace con la etapa 02 (perfil).

## Contexto

Cuando la misma IA escribe el código y los tests, ambos parten de los mismos supuestos: si un supuesto está mal, el test también lo está y pasa igual. En este proyecto el código lo escribió el humano, pero el plan y gran parte de los tests los generó la IA, así que la independencia es parcial.

La práctica profesional equivalente tiene varios nombres: **black-box testing**, **acceptance testing**, **ATDD** y **BDD**. La variante con IA es usar **otro modelo con contexto aislado** como tester independiente.

## Dependencias

- [`docs/planing/stage-02-profile.md`](../../planing/stage-02-profile.md) — criterios de aceptación del piloto.
- [`docs/roadmap/pendientes.md`](../pendientes.md) — E2E de Playwright, que complementa este proceso.
- [`docs/roadmap/notes.md`](../notes.md) — conceptos de agentes y testing.
- OpenCode — sesiones y subagentes.
- GitHub Actions — CI actual.

## Estado

🟡 En aprendizaje — Fase 1 (manual)

## Última actualización

2026-11-13

## Prioridad

⭐⭐⭐⭐

## Nivel actual

Nada

## Nivel objetivo

Básico

## Complejidad

Media

## Tiempo estimado

2 a 3 semanas (piloto de una etapa)

---

## ¿Qué es?

Escribir primero **qué se espera que haga** el sistema, sin código ni detalles internos. Después, un agente que **no vio la implementación** escribe tests basados solo en esa especificación. Si el código no cumple, los tests fallan.

La pieza clave no es la IA: es la **spec**. Si es vaga, el tester adivina y el proceso da una falsa sensación de seguridad.

---

## ¿Por qué hacerlo?

- **Independencia**: el tester no hereda los supuestos del código.
- **Spec viva**: la especificación queda en git y sirve como documentación.
- **Detecta ambigüedades**: el primer intento suele revelar requisitos que nadie definió.
- **Complementa** los tests unitarios actuales, no los reemplaza.

---

## Reglas del piloto

1. **La spec no sale del código.** Se escribe desde las historias de usuario y los criterios de aceptación, y la aprueba el dueño del proyecto.
2. **El tester no ve la implementación.** Contexto aislado, preferentemente otro modelo o proveedor.
3. **El tester no modifica tests para que pasen.** Si un test falla, reporta la diferencia entre la spec y el resultado.
4. **Cada fallo se triaja**: bug del código, spec ambigua o test equivocado.
5. **La spec se versiona** y se actualiza cuando el comportamiento cambia a propósito.

---

## Flujo manual (piloto)

```
1. Crear docs/specs/stage-02-profile.md
   Solo comportamiento: entradas, salidas, errores, límites y efectos.
   Sin nombres de funciones, archivos ni detalles internos.

2. Revisar y aprobar la spec (dueño del proyecto).

3. Abrir otra sesión con otro modelo/proveedor.
   Pasarle SOLO la spec y cómo se corren los tests.

4. El agente escribe los tests de aceptación desde la spec.

5. Correr los tests contra el código real.

6. Triaje de cada fallo:
     ¿bug del código?   → arreglar el código
     ¿spec ambigua?     → arreglar la spec
     ¿test equivocado?  → descartar el test
     ¿pasa y no debería? → falta un caso en la spec

7. Repetir hasta estabilizar. Guardar spec y tests en git.
```

---

## Plan de aprendizaje por fases

### Fase 1 — Manual (actual)

Hacer el flujo completo a mano con una sola etapa. Sin herramientas nuevas.

### Fase 2 — Medir

Documentar qué encontró el piloto: bugs reales, ambigüedades, falsos positivos y tiempo invertido. Decidir si vale la pena repetirlo.

### Fase 3 — Automatizar lo repetitivo

Usar **GitHub Actions** para lo que ya es mecánico: correr tests, comentar en el PR, bloquear el merge. No automatizar el juicio.

### Fase 4 — Evaluar orquestación

Solo si las fases anteriores muestran valor. Comparar opciones antes de adoptar una.

---

## Dónde funciona mejor

| Nivel | ¿Spec-driven? |
|---|---|
| API / HTTP | ✅ Ideal |
| Integración con base real | ✅ Muy bueno |
| E2E (Playwright) | ✅ Excelente |
| Unitarios de funciones internas | 🟡 Difícil: necesitan conocer la firma |

---

## Herramientas para la Fase 4 (evaluación futura)

| Herramienta | Rol | Licencia |
|---|---|---|
| **LangGraph** | Orquestación con estado, aprobaciones humanas y auditoría (Python y TypeScript) | Open source (MIT) |
| **CrewAI** | Prototipos rápidos con equipos de roles (Python) | Open source (MIT) |
| **AutoGen / Microsoft Agent Framework** | Conversación entre agentes, ecosistema Microsoft | Open source (MIT) |
| **OpenAI Agents SDK** | Empezar rápido, ligero (Python y TypeScript) | Open source (MIT) |
| **Mastra** | Orquestación nativa en TypeScript | Open source (MIT) |
| **n8n** | Integraciones, webhooks y aprobaciones visuales. No es el “cerebro” | Fair-code (gratis autohospedado) |

Regla práctica: **n8n son las manos, LangGraph es el cerebro**. Los frameworks son gratis; lo que se paga es el modelo de IA y las plataformas opcionales.

---

## Criterios de éxito del piloto

- [ ] Encontrar al menos **un bug real** o **una ambigüedad real** en la spec.
- [ ] El tiempo invertido es razonable frente al valor obtenido.
- [ ] El proceso se puede repetir en otra etapa sin empezar de cero.
- [ ] La spec queda versionada y actualizada.

---

## Referencias

- [`docs/planing/stage-02-profile.md`](../../planing/stage-02-profile.md)
- [`docs/roadmap/pendientes.md`](../pendientes.md)
- [`docs/roadmap/notes.md`](../notes.md)
- [LangGraph](https://langchain-ai.github.io/langgraph/)
- [CrewAI](https://docs.crewai.com/)
- [n8n](https://docs.n8n.io/)
- [GitHub Spec Kit](https://github.com/github/spec-kit)
