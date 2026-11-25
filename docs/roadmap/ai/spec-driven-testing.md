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

🟢 Fases 1, 2 y 3 completadas (piloto del perfil) — siguiente: repetir el piloto en la etapa 03

## Última actualización

2026-11-25

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

## Flujo de trabajo (manual)

La orquestación es manual: cada paso lo inicia una persona. Lo único automatizado
es la ejecución de la suite y la publicación de su resultado.

| Paso | Quién | Qué hace |
|---|---|---|
| 1. Planificación | Dueño + asistente (DeepSeek V4.1 Flash Free) | Alcance, decisiones y pendientes de la etapa. |
| 2. Spec | Dueño + asistente | Se escribe desde historias de usuario y criterios de aceptación. **Antes del código.** |
| 3. Aprobación | Dueño | La spec queda aprobada y versionada. |
| 4. Implementación | Dueño | Escribe el código; el asistente resuelve dudas y recomienda librerías. |
| 5. Tests | Tester aislado (GLM-5.3-Flash Free) | Recibe solo la spec. No lee `src/`. Escribe los tests de aceptación. |
| 6. Ejecución | CI | Corre `test` y `test:spec`; publica el resumen en el PR. |
| 7. Triaje | Dueño + asistente | Cada fallo: bug del código, spec ambigua, test equivocado o entorno. |
| 8. Corrección | Dueño | Arregla el código o la spec según el triaje. |
| 9. Cierre | Asistente | Reporte, métricas y actualización del plan. |

Reglas que no cambian: el tester no ve la implementación, no modifica tests para
que pasen y reporta las diferencias. Sin triaje humano, su reporte no se toma
como verdad (en el piloto, 1 de cada 5 fallos clasificados era falso y 24 tests
pasaban por el motivo equivocado).

**Por qué la spec va antes del código**: si se escribe después, describe lo que el
código hace y el tester hereda sus supuestos. En el piloto, los 110 unitarios
pasaban y validaban el comportamiento equivocado.

### Detalle de cada paso

1. **Planificación**: se define qué entra y qué no. Los pendientes van a
   `docs/roadmap/pendientes.md`.
2. **Spec**: solo comportamiento (entradas, salidas, errores, límites, efectos).
   Sin nombres de funciones ni archivos.
3. **Aprobación**: sin spec aprobada no se abre la sesión del tester.
4. **Implementación**: es la única fase donde se lee el código a fondo.
5. **Tests**: sesión nueva, otro modelo, solo la spec y cómo correr los tests.
6. **Ejecución**: local y CI. Si el CI falla, el resumen queda en el PR.
7. **Triaje**: `bug` → arreglar código · `spec` → aclarar spec · `test` →
   descartar o corregir el test · `entorno` → arreglar configuración.
8. **Corrección**: se repite hasta estabilizar. Cada corrección vuelve a correr
   la suite.
9. **Cierre**: reporte en `docs/reports/`, métricas con la plantilla y estado
   del plan actualizado.

---

## Plan de aprendizaje por fases

### Fase 1 — Manual ✅

Completada con el piloto de la etapa 02. Resultados en
[`docs/reports/stage-02-profile-spec-tests.md`](../../reports/stage-02-profile-spec-tests.md).

### Fase 2 — Medir ✅

Completada el 2026-11-25. Lo que quedó documentado:

- **Métricas**: 57 tests, 10 bugs reales, 24 falsos verdes (42 %), 4 ambigüedades
  y 1 reporte descartado. El tiempo no se midió en el piloto.
- **Criterio de repetición**: 3 o más bugs reales, falsos verdes por debajo del
  25 % y 2 sesiones o menos de trabajo efectivo.
- **Plantilla de medición**: sección **Métricas** en
  [`docs/templates/spec-test-report-template.md`](../../templates/spec-test-report-template.md),
  con registro de horas por fase.

Decisión: repetir una vez en la etapa 03, midiendo el tiempo antes de invertir en
automatizar.

### Fase 3 — Automatizar lo repetitivo ✅

Completada el 2026-11-25. Todo en `.github/workflows/ci.yml`, job `quality`:

- La suite corre con `--json --outputFile=spec-results.json`.
- Un paso con `actions/github-script` publica o actualiza **un comentario en el PR**
  con el total y los tests que fallaron. Si el PR viene de un fork, el comentario
  falla por permisos y el CI sigue.
- Un paso final devuelve el **rojo** cuando la suite falló, para que el check
  bloquee el merge.
- Se agregó `permissions: pull-requests: write` al job.
- **No** se agregó filtro por rutas: la suite corre dentro del job del backend,
  que ya instala dependencias y compila; el ahorro sería de segundos.

Lo único que queda fuera del workflow es marcar el check como **requerido** en la
protección de rama del repositorio (Settings → Branches). Eso es configuración de
GitHub, no código, y está anotado en `docs/roadmap/pendientes.md`.

Lo que no se automatiza, por diseño: el triaje y la clasificación de fallos.

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

- [x] Encontrar al menos **un bug real** o **una ambigüedad real** en la spec.
      Resultado: 10 bugs reales y 4 reglas de la spec que estaban ambiguas.
- [x] El tiempo invertido es razonable frente al valor obtenido.
      Resultado: 1 sesión de tester, 1 de triaje y 1 de corrección.
- [x] El proceso se puede repetir en otra etapa sin empezar de cero.
      Resultado: el flujo quedó documentado en este archivo y en la plantilla
      de reporte.
- [x] La spec queda versionada y actualizada.
      Resultado: [`docs/specs/stage-02-profile.md`](../../specs/stage-02-profile.md).

### Resultado del piloto

- Informe: [`docs/reports/stage-02-profile-spec-tests.md`](../../reports/stage-02-profile-spec-tests.md)
- Tester: GLM-5.3-Flash Free (familia distinta a la del código).
- 57 tests de aceptación escritos solo desde la spec, **57 en verde** al cerrar.
- 10 bugs encontrados; 2 de ellos (B4 y B8) estaban ocultos por el principal (B1).
- 24 tests del tester pasaban por el motivo equivocado: el triaje humano los detectó.
- 1 bug reportado por el tester fue **descartado** (era un defecto del mock).

---

## Referencias

- [`docs/planing/stage-02-profile.md`](../../planing/stage-02-profile.md)
- [`docs/roadmap/pendientes.md`](../pendientes.md)
- [`docs/roadmap/notes.md`](../notes.md)
- [LangGraph](https://langchain-ai.github.io/langgraph/)
- [CrewAI](https://docs.crewai.com/)
- [n8n](https://docs.n8n.io/)
- [GitHub Spec Kit](https://github.com/github/spec-kit)
