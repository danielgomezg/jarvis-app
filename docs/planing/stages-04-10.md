# Etapas 04–10 — Bosquejo

## Estado

📝 Bosquejo. No es un plan: es el registro de las ideas aprobadas y del orden en
que conviene construirlas, para no reabrirlas en cada etapa. Cada una se detalla
con [`planning-template.md`](../templates/planning-template.md) cuando le toque.

---

## Última actualización

2026-11-25

---

## Cómo se usa este documento

- **No** tiene historias de usuario ni criterios de aceptación finos: eso se
  escribe al planificar la etapa, cuando ya existe el código de la anterior.
- **Sí** fija qué entra, de qué depende y qué decisiones quedan abiertas.
- Si una etapa cambia de alcance al planificarla, se actualiza este archivo.

Planificar lejos del presente produce documentos que se archivan sin usarse. Por
eso acá hay una página por etapa y no un plan completo.

---

## Orden y dependencias

| Etapa | Alcance | Depende de |
|---|---|---|
| 03 | Generar por texto · guardar, editar, borrar, favoritos · creación manual · cuota | Perfil (02) |
| **04** | Sustituciones de ingredientes · colecciones | Recetas guardadas (03) |
| **05** | Plan semanal · lista de compras | Colecciones y recetas (04) |
| **06** | Captura multimodal: voz y foto de receta escrita → texto | Pipeline de generación (03) |
| **07** | Foto de ingredientes con visión | Captura de archivos (06) |
| **08** | Imagen de emplatado generada | Recetas con imagen de referencia (03/05) |
| **09** | Suscripciones y pagos | Cuota medida (03) |
| **10** | Asistente conversacional | Sustituciones validadas (04) |

El orden no es arbitrario: cada etapa necesita que la anterior exista. Pagos
antes de cuotas sería cobrar por algo que no se está midiendo.

---

## Etapa 04 — Sustituciones y colecciones

**Objetivo.** Resolver "no tengo este ingrediente" sin salir a comprar, y
agrupar recetas guardadas.

**Alcance tentativo**

- Botón "No lo tengo" por ingrediente, dentro de una receta guardada.
- Respuesta con 2–3 sustitutos y nota de proporción ("misma cantidad", "la
  mitad").
- Los sustitutos que contengan un alérgeno del perfil no se ofrecen; la
  advertencia de la 03 sigue aplicando sobre el resultado.
- Colecciones: crear, renombrar, borrar y agregar o quitar recetas.
- Una receta puede estar en varias colecciones.

**Requisito previo.** Recetas persistidas y perfil con alérgenos (03).

**Decisiones abiertas**

- ¿La sustitución se guarda como variante de la receta o solo se muestra?
- ¿Las colecciones son privadas o compartibles por link?

**Por qué no es un chatbot.** La acción es contextual y el contrato es acotado
(`ingrediente + receta → sustitutos`). Eso se especifica y se testea. Un chat
tiene estado conversacional y otro costo por sesión.

**Herramientas sugeridas.** Mismo `RecipeGeneratorService` con un prompt corto;
tabla `RecipeCollection` y tabla puente.

---

## Etapa 05 — Plan semanal y lista de compras

**Objetivo.** Armar la semana de comidas y convertirla en una lista de compras.

**Alcance tentativo**

- Plan de 7 días con desayuno, almuerzo y cena (configurable).
- Asignar recetas guardadas a cada hueco.
- Generar recetas que falten a partir de objetivos (dieta, calorías
  aproximadas, tiempo disponible).
- Lista de compras agregada desde los ingredientes del plan, con cantidades
  sumadas.
- Marcar ítems comprados.

**Requisito previo.** Recetas y colecciones (04).

**Decisiones abiertas**

- ¿Un plan activo por usuario o varios guardados?
- ¿La lista de compras es fija o se regenera cada vez?
- ¿Se suman cantidades con unidades distintas (500 g + 1 kg)?

**Nota técnica.** Es la etapa que justifica migrar `ingredients` de `jsonb` a
tabla hija: agregar por ingrediente en SQL es mucho más simple que recorrer JSON
en la aplicación.

---

## Etapa 06 — Captura multimodal (voz y foto de receta escrita)

**Objetivo.** Permitir entrar al mismo pipeline de generación sin escribir.

**Alcance tentativo**

- Dictado por voz que devuelve texto editable antes de generar.
- Foto de una receta escrita (papel, libro, captura) que devuelve texto
  editable.
- Ese texto entra al flujo normal de la 03: no hay endpoints nuevos de recetas.

**Requisito previo.** Pipeline de generación (03) y almacenamiento de archivos
con límites de tamaño y expiración.

**Decisiones abiertas**

- Voz con Web Speech API (gratis, solo Chrome) o servicio pago (parejo, cuesta
  por minuto).
- ¿La imagen se guarda o se descarta después de extraer el texto?

**Riesgo principal.** El reconocimiento de letra manuscrita falla seguido con
números, abreviaturas y unidades. La etapa debe incluir la corrección humana
obligatoria antes de generar.

---

## Etapa 07 — Foto de ingredientes (visión)

**Objetivo.** Sacar una foto a lo que hay en la heladera y que la app arme la
receta sin escribir ingredientes.

**Alcance tentativo**

- Subida de una o varias fotos.
- Detección de ingredientes con un modelo de visión.
- Confirmación del usuario: agregar, quitar o corregir lo detectado.
- El resultado entra al generador de la 03 como lista de ingredientes.

**Requisito previo.** Captura de archivos (06) y cuotas ya resueltas.

**Decisión abierta.** ¿Cuántas fotos por generación y cómo se cobra en cuota
(una generación por conjunto de fotos).

**Riesgo principal.** Es la función más frágil del producto: un modelo de visión
confunde envases, cantidades y marcas. Sin el paso de confirmación, la
experiencia se rompe.

---

## Etapa 08 — Imagen de emplatado generada

**Objetivo.** Mostrar una imagen de referencia del plato terminado.

**Alcance tentativo**

- Imagen fija por categoría o foto real de Unsplash mientras no haya generación.
- Generación de imagen por receta con caché por receta.
- Placeholder cuando el proveedor falla; nunca bloquear la receta.

**Requisito previo.** Recetas con detalle completo y almacenamiento de archivos.

**Decisiones abiertas**

- Proveedor: generación paga, Hugging Face con capa gratuita (modelos que se
  deprecan y arranques en frío lentos) o solo Unsplash.
- ¿La imagen se genera al guardar o bajo demanda?

**Nota.** Generar imágenes cuesta y tarda (5–15 s). Conviene bajo demanda y con
caché, no en cada guardado.

---

## Etapa 09 — Suscripciones y pagos

**Objetivo.** Cobrar por los límites que hasta ahora son fijos.

**Alcance tentativo**

- Planes con límite de generaciones distinto (gratis, pro).
- Checkout y portal del cliente.
- Webhooks idempotentes: alta, renovación, fallo de pago, cancelación.
- Estado de la suscripción consultable por el frontend.
- La cuota lee el plan del usuario en vez de un número fijo.
- **Recálculo de información nutricional bajo demanda**, solo en planes pagos,
  con su propio consumo de cuota. Resuelve el caso que la 03 deja abierto: la
  nutrición queda vieja después de editar los ingredientes.

**Requisito previo.** Cuota funcionando y medida (03).

**Decisiones abiertas**

- Stripe en modo test (mejor documentado, webhooks fáciles de simular) o
  Mercado Pago (más adecuado comercialmente en Chile, sandbox más burocrático).
- Precio y qué incluye cada plan.

**Riesgo principal.** No es solo el cobro: es plan, estado, período, reintentos y
qué pasa cuando el pago falla. Es una de las etapas más grandes.

---

## Etapa 10 — Asistente conversacional

**Objetivo.** Un chat que responde dudas de cocina con contexto del usuario.

**Alcance tentativo**

- Ventana de chat en la app (burbuja flotante).
- Contexto: perfil, recetas guardadas, plan activo.
- Historial por conversación, con límite de mensajes.
- Cuota propia, separada de la de generaciones.

**Requisito previo.** Sustituciones usadas de verdad (04) y cuotas por plan (09).

**Por qué al final.** Tiene estado conversacional, moderación, historial y un
costo por sesión mucho mayor. Si las sustituciones contextuales demuestran que
la gente pide ayuda con ingredientes, el chat tiene sentido; si no, no.

---

## Mejoras transversales (sin etapa asignada)

No son funcionalidades: son cambios que mejoran el proyecto cuando aparezca el
momento.

| Mejora | Cuándo |
|---|---|
| OpenAPI publicado + cliente tipado generado | Cuando el frontend consuma varios endpoints |
| Streaming de la generación (SSE) | Si la latencia con spinner molesta |
| PostHog (analítica y embudos) | Antes de la etapa 09 |
| Sentry (errores del backend) | Antes de la etapa 09 |
| Despliegue del frontend en Vercel | Para tener una demo navegable |
| Resend en lugar de SendGrid | Cuando se toque `MailService` |
| Unsplash para fotos de referencia | Etapa 08 |
| Open Food Facts para nutrición real | Si los valores del modelo no alcanzan |
| Playwright (E2E) | Antes de mostrar el producto |
| Taxonomía canónica de alérgenos (alérgeno → ingredientes) | Cuando la advertencia textual de la 03 no alcance |

---

## Fuera del proyecto

Descartado explícitamente, para no reabrirlo:

- Microservicios, Kafka, Kubernetes. Complejidad sin señal para este producto.
- GraphQL. La API REST ya funciona y el piloto de testing está montado sobre
  HTTP.
- Redis. La caché en Postgres alcanza; se migra si algún día crece.
- Recetario con catálogo curado. El producto resuelve "qué cocino con lo que
  tengo", no compite por cantidad de contenido.
