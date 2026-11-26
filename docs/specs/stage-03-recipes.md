# Spec — Recetas con generación por IA (Etapa 03, backend)

## Estado

✅ Aprobada — 2026-11-26.

Redactada y aprobada **antes** de escribir código. La suite de aceptación se
escribe solo a partir de este documento.

Los cambios posteriores se agregan al final, en **Enmiendas**, con fecha. No se
reescribe el texto original.

---

## Objetivo

Definir el comportamiento esperado de la API de recetas para que pueda probarse
**desde afuera**, sin mirar la implementación: generación con IA, guardado,
edición, borrado, favoritos, cuota diaria e idempotencia.

---

## Alcance

**Incluye**

- `POST /api/v1/recipes/generate`
- `GET /api/v1/recipes/quota`
- `POST /api/v1/recipes`
- `GET /api/v1/recipes`
- `GET /api/v1/recipes/:id`
- `PATCH /api/v1/recipes/:id`
- `DELETE /api/v1/recipes/:id`
- `PUT /api/v1/recipes/:id/favorite`
- `DELETE /api/v1/recipes/:id/favorite`
- Cuota diaria, caché de generaciones, idempotencia y validación de la salida del
  modelo.

**No incluye**

- Frontend.
- Colecciones, plan semanal, lista de compras.
- Sustituciones de ingredientes.
- Voz, foto de receta, foto de ingredientes, imagen de emplatado.
- Pagos y planes.
- Búsqueda por texto libre.
- Tests E2E de navegador.

> A diferencia de la etapa 02, el `429` **sí** es parte del alcance: la cuota es
> comportamiento del producto y hay que testearla.

---

## Convenciones

- Base de la API: `/api/v1`.
- Formato: JSON (`Content-Type: application/json`).
- Autenticación: JWT válido en la cookie `access-token`. Sin token, inválido o
  expirado → `401`.
- Los mensajes de error van en español, pero los tests **no** comparan el texto
  exacto: comparan el código HTTP y, cuando aplica, el campo que falló.
- Todas las fechas y horas se devuelven en ISO 8601 UTC.
- Las respuestas nunca incluyen datos internos: ni `userId`, ni claves de caché,
  ni el prompt, ni el texto crudo del modelo.
- Los identificadores son UUID v4.
- Campos desconocidos en el cuerpo → `400`.

---

## Recurso: receta

| Campo | Tipo | Regla |
|---|---|---|
| `id` | string (uuid) | solo lectura |
| `title` | string | 3 a 120 caracteres después de recortar espacios |
| `description` | string \| null | hasta 500 caracteres |
| `servings` | integer | 1 a 12 |
| `prepTimeMinutes` | integer | 0 a 1440 |
| `cookTimeMinutes` | integer | 0 a 1440 |
| `tags` | string[] | máximo 10; 1 a 30 caracteres cada uno; sin vacíos; sin duplicados |
| `ingredients` | Ingrediente[] | 1 a 50 elementos |
| `steps` | string[] | 1 a 30 elementos; 1 a 500 caracteres cada uno; sin vacíos |
| `nutrition` | Nutrición \| null | solo lectura (ver más abajo) |
| `nutritionDisclaimer` | string | solo lectura; texto fijo |
| `allergenWarnings` | string[] | solo lectura; calculado en cada lectura (ver más abajo) |
| `imageUrl` | string \| null | reservado; **siempre `null`** en esta etapa |
| `isFavorite` | boolean | se modifica solo por los endpoints de favorito |
| `source` | `generated` \| `manual` | solo lectura; se deriva al crear |
| `createdAt` | string (ISO) | solo lectura |
| `updatedAt` | string (ISO) | solo lectura; cambia en cada `PATCH` que modifica algo |

### Ingrediente

| Campo | Tipo | Regla |
|---|---|---|
| `name` | string | 1 a 80 caracteres después de recortar espacios |
| `quantity` | number \| null | mayor que 0 y hasta 10000; hasta 2 decimales; `null` = "al gusto" |
| `unit` | string \| null | 1 a 20 caracteres; `null` si `quantity` es `null` |

Regla cruzada: si `quantity` es `null`, `unit` debe ser `null`. Si `quantity`
tiene valor, `unit` puede ser `null` (por ejemplo "2 huevos") o un texto.

### Nutrición

| Campo | Tipo | Regla |
|---|---|---|
| `calories` | number | 0 a 10000 (kcal por porción) |
| `proteinGrams` | number | 0 a 1000 |
| `carbsGrams` | number | 0 a 1000 |
| `fatGrams` | number | 0 a 1000 |
| `fiberGrams` | number | 0 a 1000 |
| `sugarGrams` | number | 0 a 1000 |
| `sodiumMg` | number | 0 a 20000 (miligramos por porción) |

Todos los campos son obligatorios dentro del objeto y **cero es un valor
válido**. Se guarda sodio y no sal: la sal es sodio × 2.5, así que almacenar los
dos duplica el mismo dato.

`nutrition` puede ser `null` si el modelo no devolvió datos válidos, pero el
objeto, cuando existe, tiene los siete campos.

### Texto fijo de nutrición

`nutritionDisclaimer` se devuelve siempre con este texto, idéntico:

> Valores estimados generados automáticamente. No reemplazan el asesoramiento de
> un profesional de la salud.

---

## Advertencia de alérgenos

`allergenWarnings` es la lista de alérgenos **del perfil del usuario** que
aparecen en los ingredientes de la receta. Se calcula en cada lectura y no se
guarda.

### Cálculo

Para cada ingrediente, comparar `name` contra cada valor de
`allergenWarnings` del perfil:

1. Recortar, pasar a minúsculas y quitar tildes a ambos lados.
2. Hay coincidencia si el alérgeno aparece como palabra completa dentro del
   nombre del ingrediente, tolerando plural simple (`marisco` / `mariscos`).

Ejemplos:

| Alérgeno del perfil | Ingrediente | Resultado |
|---|---|---|
| `mariscos` | `mariscos mixtos` | se advierte `mariscos` |
| `mariscos` | `camarón` | **no** se advierte |
| `frutos secos` | `almendra` | **no** se advierte |
| `lactosa` | `leche entera` | **no** se advierte |

### Límite explícito

La comparación es textual: no sabe que un camarón es un marisco ni que una
almendra es un fruto seco. Por eso:

- La API nunca afirma que una receta esté libre de alérgenos. Solo devuelve lo
  que encontró.
- `allergenWarnings: []` significa "no se detectó por nombre", no "es segura".
- Ningún endpoint rechaza una receta por contener un alérgeno. Ni la generación
  ni el CRUD.

Relacionar alérgenos con sus ingredientes requiere una taxonomía canónica y es
una etapa posterior.

---

## Recurso: entrada de generación

| Campo | Tipo | Regla |
|---|---|---|
| `dishName` | string | 2 a 100 caracteres; excluyente con los otros dos modos |
| `ingredients` | string[] | 1 a 20 elementos; 1 a 80 caracteres cada uno; excluyente con los otros dos modos |
| `idea` | string | 5 a 300 caracteres; texto libre; excluyente con los otros dos modos |
| `maxTimeMinutes` | integer | 1 a 1440; opcional |
| `occasion` | enum | `desayuno`, `almuerzo`, `cena`, `merienda`, `postre`, `cualquiera`; opcional, por defecto `cualquiera` |
| `servings` | integer | 1 a 12; opcional, por defecto `defaultServings` del perfil |
| `diet` | string[] | máximo 10; 2 a 40 caracteres cada uno; opcional |
| `avoidAllergens` | string[] | máximo 10; 2 a 40 caracteres cada uno; opcional |

Reglas:

1. Exactamente uno de `dishName`, `ingredients` o `idea`. Dos o ninguno → `400`.
2. `idea` se envía al modelo como dato delimitado, con longitud máxima. Es el
   campo con más superficie para intentar alterar las instrucciones, por eso
   toda la respuesta se valida contra esta spec.
3. `diet`:
   - omitido → se usan las `dietaryPreferences` del perfil;
   - presente → **reemplaza** a las del perfil;
   - `[]` → sin restricciones de dieta para esta receta.
4. `avoidAllergens`, con la misma semántica:
   - omitido → se usan los `allergenWarnings` del perfil;
   - presente → **reemplaza** a los del perfil;
   - `[]` → sin restricción de alérgenos en la generación.
5. Si `servings` se omite, se usa `defaultServings` del perfil.
6. Los textos se recortan antes de validar.

> La API no verifica que la receta generada cumpla la dieta ni que evite los
> alérgenos pedidos: eso depende del modelo. Lo único que se calcula y se
> devuelve es `allergenWarnings`, con el alcance textual descrito arriba.

---

## Recurso: borrador de receta (respuesta de la generación)

| Campo | Tipo | Regla |
|---|---|---|
| `generationId` | string (uuid) | identifica la generación; se usa al guardar |
| `recipe.title` | string | mismas reglas que el recurso receta |
| `recipe.description` | string \| null | idem |
| `recipe.servings` | integer | idem |
| `recipe.prepTimeMinutes` | integer | idem |
| `recipe.cookTimeMinutes` | integer | idem |
| `recipe.tags` | string[] | idem |
| `recipe.ingredients` | Ingrediente[] | idem |
| `recipe.steps` | string[] | idem |
| `recipe.nutrition` | Nutrición \| null | idem |
| `recipe.nutritionDisclaimer` | string | texto fijo |
| `recipe.allergenWarnings` | string[] | calculado contra el perfil, como en el recurso receta |
| `cacheHit` | boolean | `true` si se sirvió desde caché |
| `quota` | objeto | `{ used, limit, remaining, resetsAt }` después del consumo |

El borrador **no** incluye `id`, `source`, `createdAt` ni `updatedAt`: no existe
en la base hasta que el usuario lo guarda.

---

## POST /api/v1/recipes/generate

Genera una receta a partir de texto. No persiste la receta.

### Entrada

- Cuerpo: entrada de generación (tabla anterior).
- Cabecera `Idempotency-Key`: **obligatoria**, 8 a 100 caracteres.

### Respuestas

| Caso | Código | Cuerpo |
|---|---|---|
| Generación válida | `200` | Borrador + `quota` |
| Cuerpo inválido, sin `Idempotency-Key` o con dos modos a la vez | `400` | Error de validación |
| Sin token, inválido o expirado | `401` | Error de autenticación |
| `Idempotency-Key` reutilizada con otro cuerpo | `409` | Error de conflicto |
| Cuota diaria agotada | `429` | Error con `resetsAt` |
| El proveedor falló o devolvió algo inválido dos veces | `503` | Error genérico |

### Reglas

1. **Cuota**: 10 generaciones por día por usuario, en UTC, corte a las 00:00
   UTC. Se consume **solo** si la respuesta es `200`.
2. **Caché**: la clave incluye el modo, los textos normalizados, tiempo, ocasión,
   porciones, la **dieta efectiva** y los **alérgenos efectivos** (los que
   quedaron después de resolver perfil vs pedido). Dos pedidos idénticos del
   mismo usuario devuelven el mismo `recipe` con `cacheHit: true`.
3. **Caché y cuota**: una respuesta desde caché **consume** cuota igual.
4. **Caché y dieta**: dos usuarios con dietas o alérgenos efectivos distintos
   nunca comparten entrada de caché.
5. **Alérgenos**: la generación **no** se bloquea por alérgenos. Los efectivos se
   envían al modelo como restricción y, al armar la respuesta, se calcula
   `allergenWarnings` contra el perfil del usuario, tenga o no la restricción en
   el pedido.
6. **Dieta**: se envía al modelo como restricción. La API no verifica que la
   receta la cumpla.
7. **Reintento**: si la salida del modelo no valida contra esta spec, se
   reintenta **una** vez. El segundo fallo es `503`.
8. **`503` no consume cuota** ni deja rastro que ocupe lugar en la cuota.
9. **Idempotencia**: misma clave + mismo cuerpo → misma respuesta que la primera
   vez, con `200`, y **sin** consumir cuota de nuevo. Misma clave + cuerpo
   distinto → `409`. La ventana de idempotencia es de 24 horas.
10. **Independencia**: la cuota y la caché se calculan por usuario.
11. **Una sola generación por pedido**: la respuesta contiene exactamente una
    receta.

### Ejemplo de respuesta `200`

```json
{
  "generationId": "3f1b2c9e-8a54-4c0b-9b1e-2f0d5c7a1b44",
  "cacheHit": false,
  "recipe": {
    "title": "Tortilla de papas",
    "description": "Tortilla clásica de cuatro huevos.",
    "servings": 2,
    "prepTimeMinutes": 15,
    "cookTimeMinutes": 25,
    "tags": ["española", "sin gluten"],
    "ingredients": [
      { "name": "papa", "quantity": 500, "unit": "g" },
      { "name": "huevo", "quantity": 4, "unit": null },
      { "name": "sal", "quantity": null, "unit": null }
    ],
    "steps": [
      "Pelar y cortar las papas en láminas finas.",
      "Freír las papas 8–10 min, hasta que estén tiernas.",
      "Batir los huevos, mezclar y cuajar en la sartén 4–5 min por lado."
    ],
    "nutrition": {
      "calories": 380,
      "proteinGrams": 18,
      "carbsGrams": 32,
      "fatGrams": 20,
      "fiberGrams": 3,
      "sugarGrams": 2,
      "sodiumMg": 620
    },
    "nutritionDisclaimer": "Valores estimados generados automáticamente. No reemplazan el asesoramiento de un profesional de la salud.",
    "allergenWarnings": []
  },
  "quota": {
    "used": 1,
    "limit": 10,
    "remaining": 9,
    "resetsAt": "2026-11-27T00:00:00.000Z"
  }
}
```

### Ejemplo de respuesta `429`

```json
{
  "statusCode": 429,
  "message": "Alcanzaste el límite de 10 generaciones por día. Se reinicia a las 00:00 UTC.",
  "resetsAt": "2026-11-27T00:00:00.000Z"
}
```

El texto puede variar; el código y la presencia de `resetsAt` no.

---

## GET /api/v1/recipes/quota

Devuelve la cuota del día sin consumirla.

### Respuestas

| Caso | Código | Cuerpo |
|---|---|---|
| Usuario autenticado | `200` | `{ used, limit, remaining, resetsAt }` |
| Sin token, inválido o expirado | `401` | Error de autenticación |

Si el usuario no generó nada hoy: `{ used: 0, limit: 10, remaining: 10 }`.

---

## POST /api/v1/recipes

Guarda una receta: el borrador de una generación o una receta escrita por el
usuario.

### Entrada

Campos de la receta: `title`, `description`, `servings`, `prepTimeMinutes`,
`cookTimeMinutes`, `tags`, `ingredients`, `steps`.

Opcional: `generationId`.

Reglas:

1. `title`, `servings`, `prepTimeMinutes`, `cookTimeMinutes`, `ingredients` y
   `steps` son **obligatorios**.
2. `nutrition`, `nutritionDisclaimer`, `allergenWarnings`, `isFavorite`, `source`,
   `id`, `createdAt` y `updatedAt` **no se aceptan** en el cuerpo → `400`. La
   excepción es `nutrition`: el cliente puede enviarlo, y si lo hace se ignora
   (se guarda `null`). Ver decisión 12.
3. Si viene `generationId`, `source` es `generated`; si no, es `manual`.
4. El usuario no puede crear una receta a nombre de otro.
5. **No se rechaza por alérgenos.** Una receta manual puede contener cualquier
   ingrediente; `allergenWarnings` se calcula al leer y se devuelve.
6. La receta creada se devuelve completa, con `id`, `source`, `allergenWarnings`,
   `createdAt` y `updatedAt`.

### Respuestas

| Caso | Código | Cuerpo |
|---|---|---|
| Receta creada | `201` | La receta completa |
| Cuerpo inválido o campo no permitido | `400` | Error de validación |
| Sin token, inválido o expirado | `401` | Error de autenticación |

---

## GET /api/v1/recipes

Lista las recetas del usuario autenticado.

### Parámetros

| Nombre | Tipo | Regla |
|---|---|---|
| `page` | integer | ≥ 1; por defecto 1 |
| `limit` | integer | 1 a 50; por defecto 20 |
| `favorite` | boolean | opcional; filtra por favoritas |

### Respuesta `200`

```json
{
  "items": [],
  "page": 1,
  "limit": 20,
  "total": 0
}
```

Reglas:

1. Solo recetas del usuario del token.
2. Orden: `createdAt` descendente. Desempate por `id` descendente.
3. `total` es la cantidad de recetas que cumplen el filtro, no la de la página.
4. `page` más allá del final devuelve `items: []` con el `total` real y `200`.
5. `page` o `limit` no numéricos, fuera de rango o negativos → `400`.
6. `favorite=true` devuelve solo favoritas; `favorite=false`, solo no favoritas;
   ausente, todas.
7. Cada elemento de `items` tiene los mismos campos que `GET /recipes/:id`,
   incluido `allergenWarnings` calculado contra el perfil actual.

---

## GET /api/v1/recipes/:id

### Respuestas

| Caso | Código | Cuerpo |
|---|---|---|
| Existe y es del usuario | `200` | La receta completa |
| No existe | `404` | Error indicando que no se encontró |
| Es de otro usuario | `404` | **El mismo** error que "no existe" |
| `:id` no es UUID | `400` | Error de validación |
| Sin token, inválido o expirado | `401` | Error de autenticación |

---

## PATCH /api/v1/recipes/:id

Edita una receta guardada.

### Entrada

- JSON con **uno o más** campos editables.
- Editables: `title`, `description`, `servings`, `prepTimeMinutes`,
  `cookTimeMinutes`, `tags`, `ingredients`, `steps`.
- Cuerpo vacío `{}` → `400`.
- Campo no editable (`nutrition`, `nutritionDisclaimer`, `allergenWarnings`,
  `source`, `isFavorite`, `id`, `createdAt`, `updatedAt`, `generationId`,
  `imageUrl`) → `400`.
- Campo desconocido → `400`.

### Respuestas

| Caso | Código | Cuerpo |
|---|---|---|
| Actualización válida | `200` | La receta completa actualizada |
| Cuerpo vacío, campo inválido o no editable | `400` | Error de validación |
| Sin token, inválido o expirado | `401` | Error de autenticación |
| No existe o es de otro usuario | `404` | Error indicando que no se encontró |

### Reglas

1. **Parcial**: solo cambian los campos enviados.
2. **Atómica**: si algo falla, no se guarda nada.
3. `nutrition` **no se recalcula** y permanece igual, aunque cambien los
   ingredientes.
4. `source` nunca cambia, ni siquiera si se envía `generationId`.
5. `updatedAt` cambia en cada actualización válida.
6. Los arrays se reemplazan enteros, no se mezclan.
7. Los textos se recortan al guardar y los `tags` se guardan en minúsculas.
8. Si `description` llega como `null`, se guarda `null`.
9. `allergenWarnings` se recalcula en la respuesta: si el usuario quita los
   ingredientes que contenían un alérgeno, la advertencia desaparece.
10. No se rechaza por alérgenos.

---

## DELETE /api/v1/recipes/:id

### Respuestas

| Caso | Código | Cuerpo |
|---|---|---|
| Borrada | `204` | Sin cuerpo |
| No existe o es de otro usuario | `404` | Error indicando que no se encontró |
| `:id` no es UUID | `400` | Error de validación |
| Sin token, inválido o expirado | `401` | Error de autenticación |

Reglas: borrar dos veces el mismo `id` → el segundo intento es `404`. El borrado
es físico: `GET /recipes` deja de listarla y `GET /recipes/:id` responde `404`.

---

## PUT /api/v1/recipes/:id/favorite

Marca la receta como favorita.

| Caso | Código | Cuerpo |
|---|---|---|
| Marcada | `200` | La receta con `isFavorite: true` |
| Ya era favorita | `200` | La receta con `isFavorite: true` |
| No existe o es de otro usuario | `404` | Error |
| `:id` no es UUID | `400` | Error de validación |

## DELETE /api/v1/recipes/:id/favorite

Desmarca la receta como favorita.

| Caso | Código | Cuerpo |
|---|---|---|
| Desmarcada | `200` | La receta con `isFavorite: false` |
| No era favorita | `200` | La receta con `isFavorite: false` |
| No existe o es de otro usuario | `404` | Error |
| `:id` no es UUID | `400` | Error de validación |

Ambos endpoints son **idempotentes**.

---

## Reglas de normalización

Orden fijo:

```
1. Recortar espacios al inicio y al final de todos los textos.
2. Pasar tags, diet, avoidAllergens y preferencias a minúsculas.
3. Validar largos, formatos, rangos, listas permitidas y duplicados.
4. Validar las reglas cruzadas (modo de generación, quantity/unit).
```

Consecuencias explícitas:

- `'  Tortilla  '` → se guarda `'Tortilla'`.
- `['Vegano', 'vegano']` → `400` (duplicado después de normalizar).
- `['  ', 'sal']` → `400` (elemento vacío después del recorte).
- `quantity: 0` → `400`; `quantity: null, unit: 'g'` → `400`.
- `dishName` y `ingredients` juntos → `400`; ninguno → `400`.
- `diet: []` → válido, sin restricciones (no usa las del perfil).
- `diet` omitido → se usan las del perfil.
- `avoidAllergens: []` → válido, la generación no restringe alérgenos.

---

## Decisiones aprobadas

Aprobadas por el dueño del proyecto el **2026-11-26**.

| # | Tema | Decisión |
|---|---|---|
| 1 | Cuota | 10 generaciones por día, UTC, corte 00:00 UTC |
| 2 | Cuota y errores | Se consume solo en `200`; `503` y `400` no consumen |
| 3 | Cuota y caché | Una respuesta desde caché consume cuota |
| 4 | Idempotencia | `Idempotency-Key` obligatoria, ventana de 24 h, mismo cuerpo → misma respuesta |
| 5 | Clave de caché | Usa la **dieta efectiva** y los **alérgenos efectivos** (perfil resuelto con el pedido) |
| 6 | Alérgenos | No se bloquea la generación: se envían como restricción y se devuelve `allergenWarnings` calculado contra el perfil |
| 7 | Nutrición | Solo lectura, no se recalcula, texto fijo de advertencia; siete campos, cero permitido |
| 8 | Favoritos | `PUT`/`DELETE` idempotentes, `200` con la receta, no consumen cuota |
| 9 | Receta ajena | `404`, no `403` |
| 10 | Paginación | `page`/`limit` con `items`/`total`, tope 50 |
| 11 | `steps` | `string[]`; el orden es la posición |
| 12 | `nutrition` en `POST /recipes` | Se acepta y se ignora; se guarda `null` salvo que venga de una generación |
| 13 | `source` | Se deriva de la presencia de `generationId`; nunca lo elige el cliente |
| 14 | `imageUrl` | Se devuelve siempre `null` en esta etapa |
| 15 | Nutrición: sodio y azúcar | `sodiumMg` (0–20000) y `sugarGrams` (0–1000); se guarda sodio, no sal |
| 16 | Modo de generación | Tercer modo `idea` (5–300 caracteres), además de `dishName` e `ingredients` |
| 17 | Dieta | `diet` reemplaza a `dietaryPreferences` cuando viene; omitido → perfil; `[]` → sin restricciones |
| 18 | Alérgenos en el pedido | `avoidAllergens` con la misma semántica que `diet` |
| 19 | Advertencia de alérgenos | Calculada en lectura, por palabra completa, sin tildes; alcance textual documentado |
| 20 | CRUD y alérgenos | `POST` y `PATCH` nunca rechazan por alérgenos |
| 21 | Tiempo en los pasos | Se incluye dentro del texto del paso ("8–10 min, hasta que estén tiernas"); sin estructura propia |

---

## Criterios de aceptación

- [ ] La generación devuelve un borrador con todos los campos de la spec.
- [ ] El borrador no existe en la base hasta que se guarda.
- [ ] Los tres modos (`dishName`, `ingredients`, `idea`) son excluyentes y validan sus límites.
- [ ] La dieta efectiva se resuelve como dice la spec (omitida, presente, `[]`).
- [ ] La respuesta incluye `allergenWarnings` calculado contra el perfil, aun sin restricción en el pedido.
- [ ] Una receta con un alérgeno del perfil **no** se bloquea: se devuelve con la advertencia.
- [ ] `allergenWarnings` se recalcula al editar los ingredientes y no se guarda.
- [ ] La cuota cuenta solo éxitos, es de 10 por día y responde `429` con `resetsAt`.
- [ ] `GET /recipes/quota` refleja el consumo sin consumirlo.
- [ ] La misma `Idempotency-Key` con el mismo cuerpo no consume dos veces.
- [ ] La caché evita una segunda llamada al proveedor y se marca con `cacheHit`.
- [ ] La caché no se comparte entre dietas o alérgenos efectivos distintos.
- [ ] Un usuario no puede leer, editar ni borrar recetas de otro (`404`).
- [ ] El CRUD completo respeta las reglas de validación de la spec.
- [ ] `PATCH` no modifica `nutrition`, `source`, `allergenWarnings` ni `isFavorite`, y rechaza esos campos con `400`.
- [ ] El listado pagina, ordena y filtra por favoritas.
- [ ] Los favoritos son idempotentes y no consumen cuota.
- [ ] Los errores no filtran datos internos.

---

## Entorno de pruebas (para el agente tester)

- Framework: **Jest + Supertest** contra la aplicación NestJS.
- Base de datos: **Prisma mockeado**, igual que en la etapa 02.
- Proveedor de IA: se reemplaza por un doble de prueba a través del token de
  inyección del generador. El doble permite:
  - devolver una receta válida,
  - devolver una receta inválida (para el reintento y el `503`),
  - devolver una receta que contiene un alérgeno del perfil (para verificar
    `allergenWarnings`; **no** debe producir `503`),
  - devolver `nutrition: null`,
  - fallar (para el `503`),
  - contar cuántas veces fue llamado (para verificar la caché).
- Perfil del usuario de prueba: con `dietaryPreferences` y `allergenWarnings`
  cargados, para verificar la resolución de dieta y el cálculo de advertencias.
- Cuota: se preparan filas de cuota para el día (usada, agotada) y para el día
  anterior (para verificar el corte diario). No se depende del reloj real.
- Imágenes y voz no se prueban.

### Reglas para el tester

1. Escribir los tests **solo** a partir de esta spec.
2. No leer la implementación de `src/modules/recipes/**` ni el servicio de
   generación.
3. No modificar un test para que pase. Si falla, reportar la diferencia entre la
   spec y el resultado.
4. Si la spec es ambigua, preguntar antes de inventar.
5. Entregar el reporte con la plantilla indicada abajo.

---

## Reporte de resultados

El tester entrega el reporte en:

```
docs/reports/stage-03-recipes-spec-tests.md
```

usando la plantilla
[`docs/templates/spec-test-report-template.md`](../templates/spec-test-report-template.md),
incluida la sección **Métricas**.

---

## Referencias

- [`docs/planing/stage-03-recipes.md`](../planing/stage-03-recipes.md) — alcance,
  modelo de datos y riesgos.
- [`docs/roadmap/ai/spec-driven-testing.md`](../roadmap/ai/spec-driven-testing.md)
  — proceso y roles.
- [`docs/specs/stage-02-profile.md`](./stage-02-profile.md) — spec anterior, como
  referencia de formato.
