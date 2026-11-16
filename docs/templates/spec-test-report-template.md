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

## Próximos pasos

- [ ] Revisar cada fallo y clasificarlo con el dueño del proyecto.
- [ ] Arreglar el código, la spec o el test según corresponda.
- [ ] Volver a correr y actualizar este reporte.
