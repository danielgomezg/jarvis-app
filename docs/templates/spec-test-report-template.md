# Reporte — Spec-driven testing

## Metadatos

- **Fecha**:
- **Spec**: [`docs/specs/stage-02-profile.md`](../specs/stage-02-profile.md) — aprobada el 2026-11-16
- **Rama / commit**:
- **Modelo / proveedor**:
- **Sesión**:
- **Entorno**: Jest + Supertest · Prisma mockeado

## Resumen

| Total | Pasaron | Fallaron | Bloqueados |
|---|---|---|---|
| 0 | 0 | 0 | 0 |

## Casos

| ID | Sección de la spec | Escenario | Esperado | Obtenido | Estado | Clasificación |
|---|---|---|---|---|---|---|
| T01 | GET /profile/me | Token válido con perfil | `200` | `200` | ✅ | — |
| T02 | GET /profile/me | Sin token | `401` | `401` | ✅ | — |

**Estados:** ✅ pasó · ❌ falló · ⚠️ bloqueado

**Clasificación de fallos:**

- `bug` — el código no cumple la spec.
- `spec` — la spec es ambigua o contradictoria.
- `test` — el test está mal escrito.
- `entorno` — falta configuración, datos o dependencia.

## Fallos encontrados

### F01 — (título corto)

- **Caso**:
- **Esperado**:
- **Obtenido**:
- **Evidencia** (comando o salida):
- **Clasificación**:
- **Acción propuesta**:

## Ambigüedades de la spec

| # | Dónde | Duda | Propuesta |
|---|---|---|---|
| 1 |  |  |  |

## Tests descartados

| Test | Motivo |
|---|---|
|  |  |

## Declaración del tester

- [ ] Escribí los tests solo desde la spec.
- [ ] No leí la implementación del perfil.
- [ ] No modifiqué tests para que pasaran.
- [ ] Reporté las diferencias en lugar de acomodarlas.

## Métricas

Se completan al cerrar. Sin horas registradas no hay decisión: la fase de
medición depende de estos datos.

### Registro de horas

| Fase | Inicio | Fin | Horas |
|---|---|---|---|
| Escritura de tests (tester) |  |  |  |
| Triaje de fallos |  |  |  |
| Corrección de código |  |  |  |
| Entorno y CI |  |  |  |
| Documentación |  |  |  |
| **Total** |  |  |  |

### Resultados

| Métrica | Valor |
|---|---|
| Tests escritos |  |
| Bugs reales confirmados |  |
| Bugs por test |  |
| Bugs que los unitarios no veían |  |
| Ambigüedades de la spec |  |
| Falsos verdes (tests que pasaban por el motivo equivocado) |  |
| Tasa de falsos verdes |  |
| Reportes del tester descartados |  |

### Decisión

Se repite el proceso si:

- [ ] 3 o más bugs reales confirmados en el triaje.
- [ ] Falsos verdes por debajo del 25 % de los tests escritos.
- [ ] Trabajo efectivo de 2 sesiones o menos hasta dejar la suite en verde.

Se descarta o se replantea si:

- [ ] 2 bugs reales o menos con más de 2 sesiones invertidas.
- [ ] Más del 50 % de los fallos reportados son falsos verdes.
- [ ] La suite no queda autocontenida en una sesión.

**Decisión final**: (repetir / descartar / replantear) — motivo:

## Próximos pasos

- [ ] Revisar cada fallo y clasificarlo con el dueño del proyecto.
- [ ] Arreglar el código, la spec o el test según corresponda.
- [ ] Volver a correr y actualizar este reporte.
