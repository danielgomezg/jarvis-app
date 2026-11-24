# Pendientes del proyecto

## Objetivo

Reunir en un solo lugar las tareas identificadas pero dejadas **fuera del alcance** de la etapa en la que aparecieron, para que ninguna se pierda y cualquiera sepa qué falta.

## Contexto

Al cerrar una etapa se pueden detectar mejoras que no forman parte de su alcance. En vez de dejarlas sueltas en el documento de la etapa (que se da por cerrada), se anotan acá. Cuando una tarea crece lo suficiente, se crea una etapa propia en `docs/planing/` y se mueve.

## Dependencias

- [`docs/planing/stage-02-profile.md`](../planing/stage-02-profile.md) — origen de los pendientes iniciales.
- Etapas futuras: al planificarlas, revisar este archivo.

## Estado

🟡 Activo

## Última actualización

2026-11-20

---

## Cómo usar este archivo

- Cada pendiente indica **qué falta**, **dónde** está el código y **por qué** importa.
- Al terminarlo, se marca `[x]` y se agrega la fecha.
- Si una tarea crece, se convierte en una etapa nueva en `docs/planing/` y se enlaza desde acá.

---

## Etapa 02 — Perfil

Etapa cerrada el 2026-11-13. Origen: [`stage-02-profile.md`](../planing/stage-02-profile.md).

### Subir avatar

- [ ] Implementar la subida de avatar.
- Dónde: `frontend-jarvis/components/card/profile/CardHeaderProfile.tsx`.
- Qué falta: endpoint de subida (o servicio externo), validación del archivo y guardar la URL en `Profile.avatarUrl`.
- Por qué: el botón existe en la pantalla pero no responde.

### Eliminar cuenta

- [ ] Permitir que el usuario elimine su cuenta.
- Dónde: `frontend-jarvis/components/card/profile/CardDeleteUser.tsx`.
- Qué falta: endpoint `DELETE /profile/me` con confirmación y borrado en cascada.
- Por qué: es una acción prometida en la UI que hoy no hace nada.

### Cerrar sesión desde la zona de peligro

- [ ] Conectar el botón de cerrar sesión.
- Dónde: `frontend-jarvis/components/card/profile/CardDeleteUser.tsx`.
- Qué falta: reutilizar el logout existente y limpiar cookies/sesión.
- Por qué: el botón está visible pero no tiene efecto.

### Endpoints dedicados para preferencias y alérgenos

- [ ] Implementar `PATCH /profile/me/dietary` y `PATCH /profile/me/allergens`.
- Dónde: `backend-jarvis/src/modules/profile/profile.controller.ts` (bloque comentado `me/dietary` / `me/allergens`).
- Nota: hoy ambos campos se actualizan con el `PATCH /profile/me` general, así que no es urgente.
- Por qué: permitirían actualizaciones parciales más pequeñas.

### Tests E2E del perfil

- [ ] Agregar el flujo E2E con Playwright.
- Qué falta: registro → login → ver perfil → editar → guardar.
- Por qué: los tests actuales son unitarios y no cubren el recorrido real en un navegador.

---

## Etapa 02 — Hallazgos del piloto de tests por spec

Origen: [`docs/reports/stage-02-profile-spec-tests.md`](../reports/stage-02-profile-spec-tests.md).

### `MailService` valida la API key en el constructor

- [ ] Validar `SENDGRID_API_KEY` al **usar** el servicio, no al construirlo.
- Dónde: `backend-jarvis/src/modules/mail/mail.service.ts` (líneas 7-13).
- Qué falta: mover el chequeo a un método privado que se llame en `sendVerificationEmail` / `sendPasswordResetEmail`, o degradar con un error claro solo cuando se intente enviar.
- Por qué: hoy toda la aplicación es inarrancable sin la variable, incluso para endpoints que no envían correos. Eso obligó a los tests de aceptación a inventar una key falsa (`test/spec/setup-env.ts`).

### Configuración OAuth lee `process.env` directo

- [ ] Usar `ConfigService` en `google-oauth.config.ts` y `github-oauth.config.ts`.
- Dónde: `backend-jarvis/src/modules/auth/config/`.
- Qué falta: registrar las factories con acceso a `ConfigService` (o validar con `validationSchema` en `ConfigModule.forRoot`).
- Por qué: al leer `process.env` en el constructor de la estrategia, un entorno sin credenciales falla con `OAuth2Strategy requires a clientID option`, un mensaje que no dice qué variable falta.

---

## Referencias

- [`docs/planing/stage-02-profile.md`](../planing/stage-02-profile.md)
- [`docs/roadmap/notes.md`](./notes.md) — tecnologías pendientes de aprender.
