# Stage 03 — Generación y gestión de recetas

## Estado

🟡 En progreso — planificación y spec aprobadas (2026-11-26). Código pendiente.
La suite de aceptación se mide con la plantilla de métricas (ver **Testing**).

---

## Última actualización

2026-11-25

---

## Prioridad

Alta

---

## Objetivo

Que el usuario autenticado pueda **generar una receta con IA a partir de texto**
(nombre del plato, los ingredientes que tiene o una idea libre, más tiempo,
ocasión, porciones y dieta), **guardarla si le sirve** y después **administrarla**:
verla, editarla, marcarla como favorita, crear recetas propias a mano y borrarlas.

La generación recibe las preferencias dietéticas y los alérgenos del perfil como
restricciones, y la respuesta advierte cuando una receta contiene un alérgeno del
usuario. La app no bloquea: informa y deja la decisión en manos del usuario.
Todo está limitado por una cuota diaria, y la base nunca se llena de recetas que
el usuario descartó.

Este no es un recetario: es un producto que resuelve "qué cocino con lo que
tengo". Por eso el núcleo es la generación, no el catálogo.

---

## Estimación de tiempo

2–3 semanas, incluyendo la spec, la suite de aceptación y el reporte.

---

## Requisitos previos

- [x] Stage 01 — Autenticación (JWT en cookies, guard global)
- [x] Stage 02 — Perfil (`defaultServings`, `dietaryPreferences`, `allergenWarnings`)
- [ ] Cuenta en el proveedor de IA con clave gratuita (Groq)
- [ ] Workflow de spec-driven testing funcionando en CI (Fase 3, cerrada en la 02)

---

## Alcance

### Dentro de la etapa 03

| Función | Detalle |
|---|---|
| Generar por nombre | "Tortilla de papas" + tiempo, ocasión, porciones, dieta |
| Generar por ingredientes | Lista de ingredientes que el usuario ya tiene |
| Generar por idea | Texto libre, por ejemplo "cena romántica con mariscos" |
| Guardar | La receta generada solo se persiste cuando el usuario la guarda |
| Editar | Solo recetas guardadas; los valores nutricionales no se recalculan |
| Favoritos | Marcar y desmarcar |
| Crear a mano | Misma forma de datos, sin IA, `source = manual` |
| Listar | Del usuario autenticado, paginado, filtro por favoritas |
| Borrar | Solo el dueño |
| Cuota | 10 generaciones por día por usuario, `429` al superarla |
| Dieta | Se envía al modelo; se puede reemplazar o quitar en cada receta |
| Alérgenos | Se envían al modelo por defecto; la respuesta advierte si la receta los contiene |
| Caché | Generaciones repetidas se reutilizan (Postgres) |
| Idempotencia | `Idempotency-Key` en el POST de generación |

### Fuera de la etapa 03

- Colecciones o carpetas de recetas.
- Plan semanal y lista de compras.
- Sustituciones de ingredientes ("no lo tengo").
- Captura por voz o por foto de una receta escrita.
- Foto de ingredientes con visión.
- Imagen de emplatado generada.
- Pagos y suscripciones.
- Asistente conversacional.
- Búsqueda por texto libre y filtros avanzados (solo paginación y favoritas).

Cada una de esas funciones duplica el tamaño de la etapa. El criterio para
dejarlas afuera es que la 03 tiene que poder especificarse, testearse y medirse
en una sola pasada.

---

## Historias de usuario

- Como usuario, quiero generar una receta diciendo el nombre de un plato para
  cocinar algo que ya conozco
- Como usuario, quiero generar una receta con los ingredientes que tengo para no
  salir a comprar
- Como usuario, quiero indicar tiempo disponible, ocasión, cantidad de personas
  y dieta para que la receta se ajuste a mi situación
- Como usuario, quiero generar una receta a partir de una idea libre ("cena
  romántica con mariscos") cuando no sé el nombre del plato ni tengo una lista
  cerrada de ingredientes
- Como usuario con alergias, quiero que las recetas generadas eviten mis
  alérgenos y que la app me avise cuando alguna los contiene
- Como usuario, quiero generar para invitados una receta que yo no puedo comer,
  quitando mis restricciones solo para esa receta
- Como usuario, quiero ver la receta completa (ingredientes con cantidades,
  pasos, tiempo, información nutricional estimada) antes de decidir guardarla
- Como usuario, quiero guardar una receta generada para volver a usarla otro día
- Como usuario, quiero editar una receta guardada porque la cociné y ajusté
  cantidades
- Como usuario, quiero marcar recetas como favoritas para encontrarlas rápido
- Como usuario, quiero crear una receta propia desde cero (la de mi abuela)
- Como usuario, quiero borrar recetas que ya no quiero
- Como usuario, quiero saber cuántas generaciones me quedan hoy

---

## Flujo

### Generar

```
1. El usuario entra a /recipes/new (ruta privada)
2. Elige modo: nombre del plato, ingredientes o idea libre
3. Completa tiempo, ocasión, porciones (con defaultServings) y ajusta los chips
   de dieta y alérgenos, que vienen precargados desde el perfil
4. Envía → POST /api/v1/recipes/generate con Idempotency-Key
5. El backend valida el DTO y la cuota del día (GenerationQuota)
6. Si la cuota está agotada → 429, sin llamar al modelo
7. Resuelve la dieta y los alérgenos efectivos y arma la clave de caché
8. Si hay caché válida → la devuelve (no llama al modelo)
9. Si no → llama a Groq pidiendo JSON, valida contra el DTO interno
10. Si la validación falla → reintenta una vez incluyendo el error en el prompt
11. Si vuelve a fallar → 503
12. Consume 1 de cuota, guarda en caché y devuelve RecipeDraft (sin id), con
    allergenWarnings calculado contra el perfil
```

### Guardar

```
1. El usuario ve el borrador y pulsa "Guardar"
2. POST /api/v1/recipes con el contenido del borrador
3. El backend valida de nuevo (no confía en lo que devolvió el modelo)
4. La receta queda con source = generated (o manual si vino de creación manual)
```

### Editar

```
1. El usuario abre una receta guardada
2. PATCH /api/v1/recipes/:id con los campos modificados
3. Se valida la pertenencia (dueño) y se actualiza
4. nutrition no se recalcula y no es editable
```

---

## Modelo de datos

Cuatro tablas nuevas. `Profile` no cambia.

### `Recipe`

| Columna | Tipo | Nota |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | FK a `User`, índice |
| `title` | text | 3–120 caracteres |
| `description` | text? | máx. 500 |
| `servings` | int | 1–12 |
| `prep_time_minutes` | int | 0–1440 |
| `cook_time_minutes` | int | 0–1440 |
| `tags` | text[] | hasta 10 |
| `ingredients` | jsonb | `[{ name, quantity, unit }]` |
| `steps` | jsonb | `string[]`; el orden es la posición |
| `nutrition` | jsonb? | `{ calories, proteinGrams, carbsGrams, fatGrams, fiberGrams, sugarGrams, sodiumMg }` |
| `image_url` | text? | Reservada; la escribe la etapa 08 |
| `is_favorite` | boolean | default `false` |
| `source` | enum | `generated` \| `manual` |
| `generation_id` | uuid? | FK a `RecipeGenerationCache`, trazabilidad |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | `@updatedAt` de Prisma; cambia en cada `PATCH` |

**Calorías dentro de `nutrition`, no como columna suelta.** El dato vive una sola
vez, en el objeto que devuelve la generación. Con una columna `calories` aparte,
`PATCH` sobre ingredientes dejaría el número viejo y habría que decidir cuál de
los dos manda. Cuando alguna etapa necesite filtrar u ordenar por calorías, se
agrega una columna generada (`GENERATED ALWAYS AS`) o un índice sobre el `jsonb`,
que no duplican la escritura.

**`image_url` no se usa en la 03.** Es `nullable` y el código de esta etapa no la
lee ni la escribe. Está en el modelo para que la etapa 08 no tenga que migrar
una tabla con datos. Si preferís no cargar campos especulativos, se saca y se
agrega cuando exista la función: es una migración de una columna nullable, sin
riesgo.

**Decisión: ingredientes y pasos en `jsonb`, no en tablas hijas.** Una receta se
lee siempre completa y se escribe completa; no hay consultas del tipo "todas las
recetas con tomate" en esta etapa. Con tablas hijas, cada `PATCH` se vuelve una
transacción de borrar y reinsertar filas, con más superficie de error. Cuando la
lista de compras (etapa 05) necesite agregar por ingrediente, se migra: el
`jsonb` se puede recorrer con `jsonb_array_elements` sin cambiar el contrato de
la API.

### `RecipeGenerationCache`

| Columna | Tipo | Nota |
|---|---|---|
| `id` | uuid | PK |
| `cache_key` | text | único; hash de la entrada normalizada |
| `payload` | jsonb | la receta generada completa |
| `provider` | text | `groq` |
| `model` | text | permite invalidar por modelo |
| `hit_count` | int | métrica de reutilización |
| `created_at` | timestamptz | expira por fecha (30 días) |

La `cache_key` incluye: modo (nombre, ingredientes o idea), texto normalizado,
tiempo, ocasión, porciones, **dieta efectiva** y **alérgenos efectivos** (los que
quedaron después de resolver perfil vs pedido). Sin lo segundo, un usuario con
alergia a los mariscos podría recibir la receta cacheada de otro que no la tiene.

### `GenerationQuota`

| Columna | Tipo | Nota |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | FK a `User` |
| `quota_date` | date | día UTC |
| `used` | int | default 0 |
| `updated_at` | timestamptz | |

Índice único `(user_id, quota_date)`. El día se calcula en UTC y el corte es
00:00 UTC. Se usa un `UPSERT` con incremento atómico para que dos requests
simultáneos no consuman el mismo cupo.

### `GenerationRequest` (idempotencia)

| Columna | Tipo | Nota |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | FK a `User` |
| `idempotency_key` | text | junto con `user_id` es único |
| `request_hash` | text | detecta reutilización de la clave con otro body |
| `response` | jsonb | respuesta devuelta la primera vez |
| `created_at` | timestamptz | expira a las 24 h |

Misma clave + mismo body → devuelve la respuesta guardada, sin consumir cuota.
Misma clave + body distinto → `409`.

---

## API

Todos los endpoints requieren JWT y solo operan sobre recetas del usuario
autenticado. `:id` que no existe **o** pertenece a otro usuario responde `404`,
para no revelar que existe.

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/recipes/generate` | Genera un borrador. Requiere `Idempotency-Key` |
| `GET` | `/recipes/quota` | Cuota usada y restante del día |
| `POST` | `/recipes` | Guarda una receta (generada o manual) |
| `GET` | `/recipes` | Lista paginada del usuario (`page`, `limit`, `favorite`) |
| `GET` | `/recipes/:id` | Detalle |
| `PATCH` | `/recipes/:id` | Edita campos permitidos |
| `DELETE` | `/recipes/:id` | Borra |
| `PUT` | `/recipes/:id/favorite` | Marca favorita |
| `DELETE` | `/recipes/:id/favorite` | Desmarca favorita |

### Códigos de error

| Código | Cuándo |
|---|---|
| `400` | DTO inválido, body vacío, `Idempotency-Key` ausente o mal formada |
| `401` | Sin sesión |
| `404` | Receta inexistente o de otro usuario |
| `409` | `Idempotency-Key` reutilizada con otro body |
| `429` | Cuota diaria agotada |
| `503` | El proveedor falló o devolvió algo inválido dos veces |

### Campos editables

`title`, `description`, `servings`, `prepTimeMinutes`, `cookTimeMinutes`,
`tags`, `ingredients`, `steps`.

No editables: `nutrition` (estimación de la generación),
`allergenWarnings` (se calcula en cada lectura), `source`, `id`, `userId`,
`createdAt`, `imageUrl` (reservado para la etapa 08; no se expone en esta
etapa).

---

## Cuota

- **10 generaciones por día** por usuario.
- Se consume **solo** cuando la generación termina bien.
- Una respuesta servida desde caché **sí** consume: mantiene el número
  predecible para el usuario y evita que la cuota sea un premio por pedir lo
  mismo.
- Guardar, editar, listar, borrar y marcar favoritas **no** consumen.
- Reseteo a las 00:00 UTC.
- `GET /recipes/quota` devuelve `{ used, limit, remaining, resetsAt }`.

La cuota de la app es independiente de los límites del proveedor de IA. Si el
proveedor corta por su propio límite, la respuesta es `503` y **no** consume
cuota del usuario.

---

## Generación con IA

- Proveedor: **Groq** (compatible con la API de OpenAI, capa gratuita de 1.000
  peticiones diarias, baja latencia).
- El código depende de una interfaz propia (`RecipeGeneratorService`) con un
  adaptador por proveedor. Cambiar a Gemini o a uno pago es escribir otro
  adaptador, no reescribir el módulo.
- Salida en **JSON estricto** validado contra el mismo DTO que usa la API
  (`class-validator` + `plainToInstance`).
- Un reintento con el error de validación en el prompt. Segundo fallo → `503`.
- El input del usuario se envía como **dato**, delimitado, nunca como
  instrucción. Los textos se recortan a una longitud máxima antes de armar el
  prompt.
- Los alérgenos efectivos y la dieta efectiva se envían al modelo como
  restricciones. La respuesta **no se bloquea** por contener un alérgeno: la API
  calcula `allergenWarnings` contra el perfil y lo devuelve.
- Detección de alérgenos: comparación textual por palabra completa, sin tildes,
  tolerando plural. Alcance documentado en la spec; no es una garantía de
  seguridad alimentaria.

---

## Tareas

### Backend

- [ ] Migración de Prisma: `Recipe`, `RecipeGenerationCache`,
      `GenerationQuota`, `GenerationRequest` y el enum `RecipeSource`
- [ ] `RecipesModule` (`controller`, `service`, DTOs)
- [ ] `RecipeGeneratorService` + adaptador de Groq con salida estructurada
- [ ] Validación de la respuesta del modelo y reintento único
- [ ] `AllergenWarningService`: cálculo textual de alérgenos contra el perfil
- [ ] `QuotaService` con `UPSERT` atómico y guard
- [ ] `RecipeCacheService` (clave normalizada, expiración a 30 días)
- [ ] Idempotencia en `POST /recipes/generate`
- [ ] Endpoints de la tabla anterior
- [ ] DTOs con mensajes en español y límites explícitos
- [ ] Rate limiting por endpoint con `@nestjs/throttler`
- [ ] Documentar en Swagger
- [ ] Tests unitarios: controller, service, quota, caché, generador (con el
      proveedor mockeado)

### Frontend

- [ ] Servicio `RecipeService` y tipos `Recipe` / `RecipeDraft`
- [ ] Hooks `useGenerateRecipe`, `useSaveRecipe`, `useRecipes`,
      `useRecipe`, `useUpdateRecipe`, `useDeleteRecipe`, `useFavoriteRecipe`,
      `useRecipeQuota`
- [ ] Schemas Zod para el formulario de generación y el de edición
- [ ] Página `/recipes/new` (tres modos, chips de dieta y alérgenos, resultado,
      guardar)
- [ ] Página `/recipes` (listado paginado, filtro de favoritas)
- [ ] Página `/recipes/[id]` (detalle, favorito, editar, borrar)
- [ ] Formulario de edición y de creación manual
- [ ] Aviso fijo de valores nutricionales estimados
- [ ] Aviso de alérgenos detectados en el detalle y antes de guardar
- [ ] Estado de cuota agotada con mensaje y hora de reinicio
- [ ] Tests de componentes y hooks (Vitest + RTL)

### Documentación y medición

- [ ] `docs/specs/stage-03-recipes.md` aprobada **antes** de escribir código
- [ ] Suite de aceptación en `backend-jarvis/test/spec/`
- [ ] Reporte en `docs/reports/stage-03-recipes-spec-tests.md` con la sección
      **Métricas** de la plantilla
- [ ] Actualizar `docs/roadmap/notes.md` y este documento al cerrar

---

## Testing

La etapa 03 es la primera que se mide con la plantilla completa, según la
decisión de la etapa 02.

### Aceptación (backend, Jest + supertest)

Escrita por el tester en contexto aislado, sin leer `src/modules/**`, desde la
spec aprobada. Cubre, como mínimo:

- Generación por nombre, por ingredientes y por idea, y forma de la respuesta.
- Dieta efectiva: omitida usa el perfil, presente la reemplaza, `[]` no restringe.
- `allergenWarnings` aparece cuando la receta contiene un alérgeno del perfil, y
  **no** produce `503`.
- Proveedor caído → `503` y cuota intacta.
- Cuota: décima generación pasa, undécima `429`; el contador no baja al fallar.
- Idempotencia: misma clave devuelve la misma receta y consume una sola vez.
- Caché: dos pedidos idénticos → una sola llamada al proveedor.
- CRUD completo, incluida la pertenencia (`404` con receta de otro usuario).
- Edición no cambia `nutrition` ni `source`.
- Listado paginado y filtro de favoritas.
- `400` por body vacío y por campos fuera de rango.

La suite es autocontenida (variables de entorno en `test/spec/setup-env.ts`,
proveedor mockeado) y corre en CI con el comentario en el PR.

### Unitarios (backend)

Servicios con Prisma y proveedor mockeados: quota, caché, generador,
validación y reintento, service y controller.

### Frontend (Vitest + RTL)

Hooks, schemas, servicio y páginas: generar → guardar, editar, favorito,
cuota agotada.

---

## Criterios de aceptación

- [ ] `POST /recipes/generate` devuelve un borrador válido con ingredientes,
      pasos, tiempos y nutrición estimada
- [ ] La dieta efectiva resuelve perfil vs pedido como dice la spec
- [ ] `allergenWarnings` se calcula contra el perfil y no bloquea la receta
- [ ] Un borrador no se persiste hasta que el usuario lo guarda
- [ ] El usuario puede guardar, listar, ver, editar y borrar sus recetas
- [ ] El usuario puede crear una receta manual sin IA (`source = manual`)
- [ ] Marcar y desmarcar favoritas funciona y el listado filtra por ellas
- [ ] `nutrition` no se recalcula ni se puede editar
- [ ] Acceder a una receta ajena responde `404`
- [ ] La cuota es de 10 por día, se consume solo en éxito y responde `429` al
      agotarse
- [ ] `Idempotency-Key` evita generaciones duplicadas y consumos dobles
- [ ] La caché reduce llamadas al proveedor sin mezclar dietas ni alérgenos
- [ ] Un fallo del proveedor responde `503` sin consumir cuota
- [ ] El frontend cubre generar, guardar, editar, favorito y cuota agotada
- [ ] La suite de aceptación corre en CI y comenta el resultado en el PR
- [ ] El reporte de la etapa 03 completa la sección **Métricas**

---

## Tecnologías

### Backend

- NestJS 11
- Prisma 7 (`jsonb`, migraciones, transacciones)
- PostgreSQL (Neon)
- Groq SDK (API compatible con OpenAI)
- class-validator + class-transformer (validación de la salida del modelo)
- `@nestjs/throttler` (rate limiting; la cuota diaria va en tabla propia)
- `@nestjs/swagger`
- Jest + supertest

### Frontend

- Next.js 16 (App Router), React 19
- TanStack Query v5
- React Hook Form v7 + Zod v4
- Zustand v5
- shadcn/ui + Radix UI
- Sonner
- Vitest + React Testing Library + MSW

### Descartado para esta etapa

- Redis (la caché va en Postgres; una dependencia menos que mantener).
- OpenAPI + cliente tipado (se evalúa cuando el frontend consuma más
  endpoints).
- Streaming de la generación (se evalúa si la latencia molesta).

---

## Riesgos

- **Costo y cuota del proveedor.** La capa gratuita es del proyecto, no por
  usuario. Un pico de pruebas puede agotarla y dejar la app sin generación
  hasta el día siguiente. Mitigación: adaptador intercambiable y caché.
- **Latencia.** Una generación tarda varios segundos con un spinner en pantalla.
  Si es inaceptable, el streaming entra en una etapa posterior.
- **Calidad del modelo.** Puede devolver recetas incoherentes o imposibles de
  cocinar.
  La validación de forma no detecta eso. Mitigación parcial: instrucciones
  estrictas, campos obligatorios y el reporte de la etapa para saber con qué
  frecuencia pasa.
- **Seguridad alimentaria.** La detección de alérgenos es textual: reconoce
  "mariscos" pero no deduce que "camarón" lo es. Un aviso vacío no significa que
  la receta sea segura. Mitigación: el aviso nunca afirma ausencia, el texto fijo
  lo aclara y la decisión final queda en el usuario; la taxonomía canónica de
  alérgenos es una etapa posterior.
- **Valores nutricionales imprecisos.** Son estimaciones. Se muestran con un
  aviso fijo y no se recalculan al editar; quedan desactualizados si el usuario
  cambia los ingredientes, y eso está aceptado y documentado.
- **Inyección de prompt.** El texto del usuario puede intentar alterar las
  instrucciones. Mitigación: se envía como dato delimitado, con longitud máxima,
  y toda la respuesta se valida contra el DTO.
- **Migración de `jsonb` a tablas hijas** cuando llegue la lista de compras.
  Costo conocido y acotado a un módulo.
- **Cuota eludible** creando varias cuentas. Aceptado en esta etapa; se resuelve
  con verificación de email y planes en etapas posteriores.

---

## Resultado esperado

El usuario puede pedir una receta con lo que tiene a mano, verla completa antes
de decidir, guardarla si le sirve y administrarla después (editar, marcar
favorita, crear a mano, borrar). La generación usa su dieta y sus alérgenos como
restricciones y advierte cuando una receta contiene un alérgeno del perfil, tiene
un límite diario claro y no se paga dos veces por la misma receta.

El backend queda cubierto por tests unitarios y por una suite de aceptación
escrita desde la spec, y la etapa se cierra con un reporte que mide el método
con la plantilla.

---

## Documentación relacionada

- [Stage 02 — Perfil de usuario y preferencias](./stage-02-profile.md)
- [Etapas 04–10 (bosquejo)](./stages-04-10.md)
- [Workflow de spec-driven testing](../roadmap/ai/spec-driven-testing.md)
- [Plantilla de reporte de la suite](../templates/spec-test-report-template.md)
- [Plantilla de planificación](../templates/planning-template.md)
- [Pendientes del proyecto](../roadmap/pendientes.md)

---

## Próxima etapa

Etapa 04 — Sustituciones de ingredientes y colecciones. Ver
[stages-04-10.md](./stages-04-10.md).
