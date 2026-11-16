# Spec — Perfil de usuario (Etapa 02, backend)

## Estado

✅ Aprobada — 2026-11-16

## Objetivo

Definir el comportamiento esperado de la API de perfil para que pueda probarse **desde afuera**, sin mirar la implementación. Esta spec es la fuente de verdad del piloto de *spec-driven testing*.

## Alcance

**Incluye**

- `GET /api/v1/profile/me`
- `PATCH /api/v1/profile/me`
- Autenticación, validación, errores y atomicidad.

**No incluye**

- Frontend (pantalla de perfil).
- Subida de avatar.
- Eliminar cuenta o cerrar sesión.
- Endpoints `me/dietary` y `me/allergens`.
- Tests E2E de navegador.

## Convenciones

- Base de la API: `/api/v1`.
- Formato: JSON (`Content-Type: application/json`).
- Autenticación: JWT válido. Sin token, token inválido o expirado → `401`.
- Fechas de entrada: `YYYY-MM-DD`.
- Los mensajes de error van en español, pero los tests **no** comparan el texto exacto: comparan el código HTTP y, si aplica, el campo que falló.
- Ninguna respuesta incluye `password`, tokens ni datos internos.

---

## Recurso: perfil

| Campo | Tipo | Regla |
|---|---|---|
| `userName` | string | 3 a 30 caracteres; letras, números, punto, guion y guion bajo; único |
| `firstName` | string | 1 a 50 caracteres |
| `lastName` | string | 1 a 50 caracteres |
| `phone` | string | 7 a 20 caracteres; dígitos, `+`, `-` y espacios |
| `gender` | string | uno de: `Sin especificar`, `Masculino`, `Femenino`, `No binario`, `Prefiero no decir` |
| `birthDate` | string | fecha válida en formato `YYYY-MM-DD`; no puede ser futura |
| `defaultServings` | integer | entre 1 y 100 |
| `dietaryPreferences` | string[] | máximo 25; sin elementos vacíos; sin duplicados |
| `allergenWarnings` | string[] | máximo 25; sin elementos vacíos; sin duplicados |

> Todas las reglas de esta spec están aprobadas. El detalle de las decisiones está al final del documento.

---

## GET /api/v1/profile/me

Devuelve el perfil del usuario autenticado.

### Respuestas

| Caso | Código | Cuerpo |
|---|---|---|
| Token válido y perfil existente | `200` | Objeto con los campos del perfil |
| Sin token, token inválido o expirado | `401` | Error de autenticación |
| Token válido pero el usuario no tiene perfil | `404` | Error indicando que el perfil no existe |
| Se excede el límite de peticiones | `429` | Error de límite |

### Reglas

- Solo devuelve el perfil del usuario del token. Nunca el de otro usuario.
- No devuelve datos sensibles.
- El perfil devuelto incluye `userName` y los campos de la tabla anterior.

---

## PATCH /api/v1/profile/me

Actualiza el perfil del usuario autenticado.

### Entrada

- JSON con **uno o más** campos de la tabla.
- Todos los campos son opcionales, pero un cuerpo vacío `{}` es inválido.

### Respuestas

| Caso | Código | Cuerpo |
|---|---|---|
| Actualización válida | `200` | Perfil actualizado |
| Cuerpo vacío o campo inválido | `400` | Error de validación |
| Sin token, token inválido o expirado | `401` | Error de autenticación |
| Token válido pero sin perfil | `404` | Error indicando que el perfil no existe |
| `userName` ya usado por otro usuario | `409` | Error de conflicto |
| Falla inesperada del servidor | `500` | Error interno, sin detalles internos |

### Reglas de actualización

1. **Parcial**: solo se modifican los campos enviados.
2. **Atómica**: si una parte falla, no se guarda ninguna. En particular, un `409` por `userName` no debe dejar otros campos modificados.
3. **Sin escalada de privilegios**: campos como `role`, `plan` o `email` no deben poder modificarse desde este endpoint. La API puede ignorarlos o rechazarlos con `400`, pero el valor no debe cambiar.
4. **Arrays completos**: `dietaryPreferences` y `allergenWarnings` se reemplazan enteros, no se mezclan con los anteriores.
5. **Normalización**: se eliminan espacios al inicio y al final de los textos. Los arrays se guardan sin distinguir mayúsculas de minúsculas.
6. **`userName` único**: si otro usuario ya lo tiene, responde `409` y no modifica nada.
7. **Independencia entre usuarios**: el token de un usuario nunca modifica el perfil de otro.

---

## Decisiones aprobadas

Aprobadas por el dueño del proyecto el **2026-11-16**.

| # | Decisión | Resultado |
|---|---|---|
| 1 | Campos de la respuesta | Los de la tabla + `userName`, sin datos sensibles |
| 2 | `birthDate` omitida | Se **conserva** (actualización parcial) |
| 3 | Borrar un campo con `null` | Permitido para `phone`, `gender` y `birthDate` |
| 4 | Valores de `gender` | `Sin especificar`, `Masculino`, `Femenino`, `No binario`, `Prefiero no decir` |
| 5 | Mayúsculas en arrays | Se normalizan a minúsculas |
| 6 | Rango de `defaultServings` | 1 a 100 |
| 7 | Campos desconocidos | Se rechazan con `400` |
| 8 | Espacios en `userName` | No permitidos |

> Nota sobre `gender`: se usan etiquetas en español como valores de la API. Si el proyecto se internacionaliza, conviene migrar a códigos estables y traducir en el frontend.

---

## Criterios de aceptación

- [ ] `GET /profile/me` devuelve el perfil del usuario autenticado sin datos sensibles.
- [ ] `GET /profile/me` responde `404` si el perfil no existe y `401` sin token.
- [ ] `PATCH /profile/me` actualiza los datos de forma atómica.
- [ ] Cambiar a un `userName` ocupado responde `409` y no modifica nada.
- [ ] Un cuerpo vacío responde `400`.
- [ ] `birthDate` se valida como fecha y se guarda correctamente.
- [ ] Los errores del backend se comunican con el código HTTP correcto.
- [ ] Un usuario no puede modificar el perfil de otro.

---

## Entorno de pruebas (para el agente tester)

- Framework: **Jest + Supertest** contra la aplicación NestJS.
- Base de datos del piloto: **Prisma mockeado** (rápido, sin infraestructura). Una segunda fase puede usar una base real.
- Autenticación: un JWT válido para un usuario de prueba; casos sin token y con token inválido para los `401`.
- Para el caso `409`, simular que el `userName` ya existe.
- Para el caso `500`, simular una falla inesperada del almacenamiento.

### Reglas para el tester

1. Escribir los tests **solo** a partir de esta spec.
2. No leer la implementación del perfil.
3. No modificar un test para que pase. Si falla, reportar la diferencia entre la spec y el resultado.
4. Si la spec es ambigua, preguntar antes de inventar.
5. Entregar el reporte con la plantilla indicada abajo.

---

## Reporte de resultados

El tester debe entregar un reporte en:

```
docs/reports/stage-02-profile-spec-tests.md
```

usando la plantilla [`docs/templates/spec-test-report-template.md`](../templates/spec-test-report-template.md).

---

## Referencias

- [`docs/planing/stage-02-profile.md`](../planing/stage-02-profile.md) — historias de usuario y criterios de origen.
- [`docs/roadmap/ai/spec-driven-testing.md`](../roadmap/ai/spec-driven-testing.md) — proceso del piloto.
- [`docs/roadmap/pendientes.md`](../roadmap/pendientes.md) — pendientes de la etapa.
