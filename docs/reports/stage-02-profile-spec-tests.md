# Reporte — Spec-driven testing

## Metadatos

- **Fecha**: 2026-11-16
- **Spec**: [`docs/specs/stage-02-profile.md`](../specs/stage-02-profile.md) — aprobada el 2026-11-16
- **Rama / commit**: `test/spec-profile`
- **Modelo / proveedor**: GLM-5.3-Flash Free (opencode) — agente tester independiente
- **Sesión**: Piloto de spec-driven testing, backend-jarvis
- **Entorno**: Jest + Supertest · Prisma mockeado (almacenamiento en memoria con `jest.fn()`)

## Resumen

| Total | Pasaron | Fallaron | Bloqueados |
|---|---|---|---|
| 55 | 35 | 20 | 0 |

Comando: `pnpm run test:spec` (config: `test/jest-spec.json`).
Salida de Jest: `Tests: 20 failed, 35 passed, 55 total`.

Los tests existentes no se vieron afectados: `pnpm run test` → 104/104 pasaron;
`pnpm run lint` → 0 errores (2 warnings preexistentes en otros archivos).

## Casos

| ID | Sección de la spec | Escenario | Esperado | Obtenido | Estado | Clasificación |
|---|---|---|---|---|---|---|
| T01 | GET /profile/me | Token válido con perfil | `200` con `userName` + campos del perfil | `200`, pero sin `userName` | ❌ | bug |
| T02 | GET /profile/me | Sin datos sensibles | Sin password/tokens | Cumple | ✅ | — |
| T03 | GET /profile/me | Sin token | `401` | `401` | ✅ | — |
| T04 | GET /profile/me | Token inválido | `401` | `401` | ✅ | — |
| T05 | GET /profile/me | Token expirado | `401` | `401` | ✅ | — |
| T06 | GET /profile/me | Usuario sin perfil | `404` | `404` | ✅ | — |
| T07 | GET /profile/me | Solo el perfil del usuario del token | `userName` del token | `userName` ausente en la respuesta | ❌ | bug |
| T08 | GET /profile/me | Solo lectura (no modifica storage) | Sin cambios | Sin cambios | ✅ | — |
| T09 | PATCH | Actualización válida (todos los campos) | `200` con perfil actualizado | `400` | ❌ | bug |
| T10 | PATCH | Persistencia de la actualización | Storage actualizado | `400`, no se guarda | ❌ | bug |
| T11 | PATCH | Cuerpo vacío `{}` | `400` | `400` | ✅ | — |
| T12 | PATCH | Sin token | `401` | `401` | ✅ | — |
| T13 | PATCH | Token inválido | `401` | `401` | ✅ | — |
| T14 | PATCH | Usuario del token sin perfil | `404` | `400` | ❌ | bug |
| T15 | PATCH | Parcial: un campo no borra los demás | `200`, resto intacto | `400` | ❌ | bug |
| T16 | PATCH | `birthDate` omitida se conserva | `200`, birthDate intacta | `400` | ❌ | bug |
| T17 | PATCH | `null` limpia phone/gender/birthDate | `200`, campos `null` | `400` | ❌ | bug |
| T18 | PATCH | Arrays se reemplazan enteros | `200`, array nuevo | `400` | ❌ | bug |
| T19 | PATCH | Normalización: trim de espacios | `200`, `Ana` | `400` | ❌ | bug |
| T20 | PATCH | Normalización: arrays en minúsculas | `200`, minúsculas | `400` | ❌ | bug |
| T21 | PATCH | 409 userName ya usado por otro | `409` | `500` | ❌ | bug |
| T22 | PATCH | 409 atómico: nada se guarda | `409` + storage sin cambios | `500` | ❌ | bug |
| T23 | PATCH | 500 sin filtrar detalles internos | `500` sin detalles | `400` (no se alcanza el storage) | ❌ | bug (bloqueado por F02) |
| T24 | PATCH | Un usuario no modifica el perfil de otro | `200` y el otro intacto | `400` | ❌ | bug |
| T25 | PATCH | userName cambia solo para el token | `200` y solo ese usuario | `200` (userName no validado, ver F03) | ✅* | — |
| T26 | PATCH | Límites válidos: defaultServings 1 y 100 | `200` | `400` | ❌ | bug |
| T27 | PATCH | Límite válido: userName de 30 | `200` | `200` | ✅ | — |
| T28-01 | PATCH validación | userName corto (2) | `400` | `200` | ❌ | bug |
| T28-02 | PATCH validación | userName largo (31) | `400` | `200` | ❌ | bug |
| T28-03 | PATCH validación | userName con espacios | `400` | `200` | ❌ | bug |
| T28-04 | PATCH validación | userName con espacios en bordes | `400` | `200` | ❌ | bug |
| T28-05..08 | PATCH validación | firstName vacío / largo (51) ×2 | `400` | `400` | ✅ | — |
| T28-09..11 | PATCH validación | phone: charset / corto (6) / largo (21) | `400` | `400` | ✅ | — |
| T28-12 | PATCH validación | gender fuera de la lista | `400` | `400` | ✅ | — |
| T28-13 | PATCH validación | birthDate futura | `400` | `400` | ✅ | — |
| T28-14 | PATCH validación | birthDate formato inválido | `400` | `400` | ✅ | — |
| T28-15..17 | PATCH validación | defaultServings 0 / 101 / 2.5 | `400` | `400` | ✅ | — |
| T28-18..21 | PATCH validación | dietaryPreferences: >25 / vacío / duplicados / duplicados por mayúsculas | `400` | `400` | ✅ | — |
| T28-22..24 | PATCH validación | allergenWarnings: >25 / vacío / duplicados | `400` | `400` | ✅ | — |
| T28-25..27 | PATCH validación | Campo desconocido: role / email / plan | `400` | `400` | ✅ | — |
| T55 | GET /profile/me | Límite de peticiones excedido | `429` entre respuestas | `429` presente | ✅ | — |

\* T25 "pasó" en el sentido literal de la aserción (el userName cambió para el usuario del token), pero como los `200` de userName provienen de falta de validación (F03), el resultado positivo no es confiable.

**Estados:** ✅ pasó · ❌ falló · ⚠️ bloqueado

**Clasificación de fallos:**

- `bug` — el código no cumple la spec.
- `spec` — la spec es ambigua o contradictoria.
- `test` — el test está mal escrito.
- `entorno` — falta configuración, datos o dependencia.

## Fallos encontrados

### F01 — GET /profile/me no devuelve `userName`

- **Caso**: T01, T07
- **Esperado**: la respuesta `200` incluye `userName` (decisión aprobada #1: "Los de la tabla + `userName`").
- **Obtenido**: `200` con los demás campos del perfil, pero `body.userName` es `undefined`.
- **Evidencia**: `expect(body.userName).toBe('usuario_a')` → `Received: undefined` (`pnpm run test:spec`, salida de T01/T07).
- **Clasificación**: `bug`
- **Acción propuesta**: incluir `userName` en el objeto de respuesta de GET /profile/me (y por extensión en PATCH, ver F02).

### F02 — PATCH rechaza con `400` toda actualización con campos distintos de `userName`, incluso válida

- **Caso**: T09, T10, T14, T15, T16, T17, T18, T19, T20, T23, T24, T26
- **Esperado**: `200` al enviar uno o más campos válidos (la spec dice "uno o más campos", "todos los campos son opcionales").
- **Obtenido**: `400` en todos los casos: con el cuerpo completo y válido (`validBody`), con un solo campo (`{ firstName }`, `{ defaultServings: 5 }`), con `null` para limpiar campos, y también para el usuario sin perfil (que debía ser `404`, T14). Incluso los valores de borde válidos (`defaultServings: 1` y `100`) son rechazados.
- **Evidencia**: `expected 200 "OK", got 400 "Bad Request"` en T09, T15, T16, T26; `expected 404, got 400` en T14.
- **Clasificación**: `bug`
- **Acción propuesta**: revisar el DTO/validación de PATCH /profile/me: hoy ningún cuerpo con campos "normales" pasa la validación; solo los cuerpos que contienen únicamente `userName` la atraviesan (ver F03). Los efectos de esta validación están bloqueando casi toda la funcionalidad de actualización.

### F03 — `userName` no se valida en PATCH

- **Caso**: T28-01, T28-02, T28-03, T28-04
- **Esperado**: `400` para userName con menos de 3 o más de 30 caracteres, con espacios internos o en los bordes (tabla del recurso: 3 a 30, "letras, números, punto, guion y guion bajo"; decisión #8: espacios no permitidos).
- **Obtenido**: `200` para los cuatro valores inválidos (`'ab'`, `'a'.repeat(31)`, `'tiene espacio'`, `'  espacios  '`), es decir, se actualiza el `userName` sin ninguna validación.
- **Evidencia**: `expected 400 "Bad Request", got 200 "OK"` en T28-01..04.
- **Clasificación**: `bug`
- **Acción propuesta**: agregar validación de `userName` (longitud 3–30 y patrón sin espacios) al endpoint PATCH. Nótese la asimetría: lo único que hoy atraviesa la validación de PATCH es justamente lo único que no se valida.

### F04 — Conflicto de `userName` responde `500` en lugar de `409`

- **Caso**: T21, T22
- **Esperado**: `409` (tabla de respuestas: "userName ya usado por otro usuario → 409") y, por regla de atomicidad, sin modificar ningún campo.
- **Obtenido**: `500 Internal Server Error`. La simulación del almacenamiento rechaza la escritura con un error de restricción única (equivalente a `P2002` de Prisma) y el servicio no lo traduce a conflicto: el error sube sin mapear. (El servidor además registra el stack completo por `console.error`.)
- **Evidencia**: `expected 409 "Conflict", got 500 "Internal Server Error"` en T21/T22; log del servidor: `Error al actualizar el perfil: Error: Unique constraint failed on the fields: ('user_name')` con `code: 'P2002'`.
- **Clasificación**: `test` — **reclasificado en el triaje del 2026-11-17**. El servicio sí traduce `P2002` a `409`; el mock lanzaba un `Error` común con `code: 'P2002'` pegado y por eso el `instanceof Prisma.PrismaClientKnownRequestError` daba falso. Corregido en el test lanzando la clase real de Prisma.
- **Acción propuesta**: corregir el mock (hecho) y volver a correr T21/T22. Nota: el test de atomicidad (T22) no pudo evaluarse por completo porque la respuesta no fue `409`; el chequeo a nivel de mock (`user.update` rechaza con `P2002` y no se reintentó la escritura) sugiere que no hubo escritura parcial, pero debe re-verificarse cuando el mock esté corregido.

### F05 — El escenario `500` (falla inesperada del almacenamiento) no pudo ejecutarse

- **Caso**: T23
- **Esperado**: `500` con cuerpo sin detalles internos (stack, mensajes de Prisma, SQL).
- **Obtenido**: `400`: la petición con cuerpo válido (`{ firstName }`) es rechazada por la validación (F02) antes de llegar a la capa de almacenamiento, por lo que el mock de falla nunca se invoca.
- **Evidencia**: `Expected: 500, Received: 400` en T23.
- **Clasificación**: `bug` (consecuencia de F02; no es un fallo del test ni del entorno)
- **Acción propuesta**: re-ejecutar este caso cuando F02 esté corregido. El test ya está preparado para verificar que la respuesta `500` no contenga `Prisma`, `SQL`, `UPDATE`, `stack`, etc.

## Ambigüedades de la spec

| # | Dónde | Duda | Propuesta |
|---|---|---|---|
| 1 | Regla 3 de actualización vs. decisión 7 | La regla dice que los campos desconocidos (`role`, `plan`, `email`) "pueden ignorarse o rechazarse con 400"; la decisión 7 aprobada dice que "se rechazan con 400". | Elegí la decisión aprobada: `400`. Test T28-25..27. |
| 2 | Normalización vs. decisión 8 | La regla 5 pide recortar espacios en los textos, pero la decisión 8 prohíbe espacios en `userName`. Para `'  espacios  '` puede interpretarse: (a) se recorta y es válido, o (b) cualquier presencia de espacios es inválida. | Interpretación conservadora: (b), `400`. Test T28-04. |
| 3 | Duplicados en arrays | No se aclara si la validación de duplicados ocurre antes o después de la normalización a minúsculas. | Conservador: `['Vegano','vegano']` también es `400`. Tests T28-21 y T28-24. Si el backend valida antes de normalizar, este caso puede diferir. |
| 4 | Formato de `birthDate` en la respuesta | La spec define `YYYY-MM-DD` para la **entrada**, pero no el formato de salida. | Los tests solo verifican que la fecha contenga la parte `YYYY-MM-DD`, sin exigir formato exacto. |
| 5 | 429 y entorno | El rate limiting está deshabilitado salvo `NODE_ENV=production` (config del módulo). | El test T55 activa `NODE_ENV=production` solo dentro de ese caso. Si la spec pretendía aplicar 429 también fuera de producción, la configuración difiere de la spec. |
| 6 | Efecto de `PATCH` con `userName` inválido | Dado que `userName` hoy se guarda sin validar (F03), la spec no aclara si un `200` con valor no conforme es un fallo de validación o de respuesta. | Reportado como F03; no hubo que inventar comportamiento. |

## Tests descartados

| Test | Motivo |
|---|---|
| — | Ninguno. Los 55 casos definidos se ejecutaron; no se descartó ninguno por falta de infraestructura (el 429 se pudo reproducir activando `NODE_ENV=production`). |

## Declaración del tester

- [x] Escribí los tests solo desde la spec.
- [x] No leí la implementación del perfil.
- [x] No modifiqué tests para que pasaran.
- [x] Reporté las diferencias en lugar de acomodarlas.

## Próximos pasos

- [x] Revisar cada fallo (F01–F05) y clasificarlo con el dueño del proyecto.
- [ ] Arreglar el código, la spec o el test según corresponda.
- [ ] Volver a correr y actualizar este reporte.

---

# Triaje del dueño del proyecto — 2026-11-17

## 1. Correcciones a la clasificación del tester

| Fallo | Clasificación original | Clasificación final | Motivo |
|---|---|---|---|
| F01 | `bug` | `bug` | Confirmado |
| F02 | `bug` | `bug` | Confirmado, con causa raíz distinta: `userName` es **obligatorio** en el DTO, así que todo PATCH sin `userName` da `400` |
| F03 | `bug` | `bug` | Confirmado |
| F04 | `bug` | **`test`** | El código sí mapea `P2002 → 409`. El mock lanzaba un `Error` genérico con `code` pegado y `instanceof` fallaba |
| F05 | `bug` | **Bloqueado por F02** | Se re-ejecuta cuando F02 esté corregido |

## 2. Falsos verdes detectados

De los 35 tests que pasaban, **24 no probaban lo que decían probar**. Los casos
`T28-05` a `T28-27` mandaban solamente el campo inválido, sin `userName`. Como
`userName` era obligatorio, la respuesta era `400` por ese motivo y no por la
regla bajo prueba.

Ejemplo: `T28-12` ("gender fuera de la lista") enviaba `{ gender: 'Otro' }` y
recibía `400`. Con un `userName` válido en el cuerpo, la respuesta es `200`,
porque el enum de `gender` **no** está validado. El test pasaba y el bug seguía
ahí.

## 3. Tests corregidos

- Todos los casos de validación envían un `userName` válido de contexto.
- Cada `400` verifica además que el mensaje corresponda **al campo probado**.
- El mock lanza errores reales de Prisma (`Prisma.PrismaClientKnownRequestError`).
- `T22` compara el estado completo antes/después (antes comparaba un snapshot
  consigo mismo).
- `T28-04` (espacios en los bordes) pasa a ser un caso positivo: se recorta y
  se guarda sin espacios.
- Se eliminó el bloque de `429` (fuera de alcance del piloto).
- Se agregó `T27b` (userName de 3 caracteres, límite mínimo válido).
- El mock ahora soporta `select`/`include` de la relación `profile.user`, para
  no obligar a una forma concreta de devolver `userName`.

Resultado tras la corrección, **con el código todavía sin arreglar**:
`57 tests · 32 pasan · 25 fallan`.

## 4. Bugs confirmados en el código

| # | Bug | Dónde | Tests que lo demuestran |
|---|---|---|---|
| B1 | `userName` obligatorio: rompe toda actualización parcial | `updated-profile.dto.ts` | T09, T10, T14–T20, T23, T24, T26 |
| B2 | `userName` ausente en la respuesta de GET y PATCH | `profile.service.ts` (`select`) | T01, T07, T09 |
| B3 | Reglas de `userName`: acepta 2–50 caracteres, espacios y cualquier símbolo | `updated-profile.dto.ts` | T28-01…05, T28-29, T27, T27b |
| B4 | `birthDate` se borra si no se envía | `profile.service.ts` | T16 |
| B5 | No se recortan los espacios de los textos | DTO y servicio | T19, T28-29 |
| B6 | Los arrays no se pasan a minúsculas antes de validar duplicados | DTO y servicio | T20, T28-22 |
| B7 | `gender` no valida los 5 valores permitidos | `updated-profile.dto.ts` | T28-13 |
| B8 | PATCH sin perfil devuelve `500` en vez de `404` | `profile.service.ts` | T14 |
| B9 | `firstName`/`lastName` permiten hasta 100 caracteres (la spec dice 50) | `updated-profile.dto.ts` | T28-07, T28-09 |
| B10 | `birthDate` futura no se rechaza | `updated-profile.dto.ts` | T28-14 |

Deuda menor detectada, sin test que falle: `phone` usa `@IsPhoneNumber` (validación
por librería) en vez de la regla de la spec (7–20 caracteres, `+`, `-`, espacios).

## 5. Cambios en la spec

- `userName`: charset explícito (solo ASCII, sin acentos ni `ñ`).
- Orden de normalización y validación documentado.
- `birthDate` de salida en ISO 8601.
- `429` fuera del alcance del piloto.

## 6. Resultado final del piloto

Código corregido y tests re-ejecutados el **2026-11-17**:

| Suite | Resultado |
|---|---|
| Aceptación (`pnpm run test:spec`) | **57 / 57** ✅ |
| Unitarios (`pnpm run test`) | **110 / 110** ✅ |
| Lint | 0 errores (2 warnings preexistentes en `auth/strategies`) |

### Bugs encontrados y corregidos

| # | Bug | Estado |
|---|---|---|
| B1 | `userName` obligatorio rompía toda actualización parcial | ✅ Corregido |
| B2 | `userName` ausente en la respuesta de GET y PATCH | ✅ Corregido |
| B3 | Reglas de `userName` (largo, charset, espacios) | ✅ Corregido |
| B4 | `birthDate` se borraba si no se enviaba | ✅ Corregido |
| B5 | No se recortaban los espacios | ✅ Corregido |
| B6 | Arrays sin minúsculas ni deduplicación posterior | ✅ Corregido |
| B7 | `gender` sin enum | ✅ Corregido |
| B8 | PATCH sin perfil devolvía `500` en vez de `404` | ✅ Corregido |
| B9 | `firstName`/`lastName` hasta 100 caracteres | ✅ Corregido |
| B10 | `birthDate` futura aceptada | ✅ Corregido |

Un bug reportado por el tester quedó **descartado** tras el triaje (F04: era el
mock, no el código). Dos bugs adicionales (B4, B8) estaban **ocultos** por B1 y
no habrían aparecido sin corregir primero la validación.

### Lectura del piloto

- El tester encontró **bugs reales que los 110 tests unitarios no veían**.
- Su clasificación automática fue correcta en 3 de 5 fallos; el triaje humano
  corrigió uno y detectó **24 falsos verdes**.
- La spec creció: cuatro reglas que antes eran ambiguas hoy están escritas.
- Sin la spec, B4 y B8 seguían invisibles: los tests unitarios estaban escritos
  desde la implementación y compartían sus supuestos.
