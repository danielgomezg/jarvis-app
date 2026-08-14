# Plan de Implementación — Git + GitHub + GitHub Actions (CI/CD)

## Objetivo

Poner el proyecto bajo control de versiones (Git + GitHub) y agregar un
"robot" de calidad (GitHub Actions) que revise el código automáticamente en
cada cambio. Así:

- Tenemos un **respaldo** del proyecto en la nube (GitHub).
- Si mañana tocamos algo y se rompe, el robot nos avisa **antes** de que el
  cambio dañe la rama principal (`main`).
- El proyecto se ve y se maneja como los repos de equipos profesionales.

## Estado actual (al inicio)

- `backend-jarvis/` ya tiene un repo de Git inicializado, pero **sin ningún
  commit** y **sin conexión a GitHub**.
- La carpeta raíz del proyecto y `frontend-jarvis/` **no** tienen git.
- Existen archivos temporales generados por mí al correr tests/lint/build
  (se borran) y notas personales en .txt (se agregan al `.gitignore`).

---

## Checklist de pasos

Cada paso se marca con `[x]` cuando queda terminado.

### Paso 1 — Limpieza y .gitignore

- [x] Borrar los archivos temporales que generé al correr los comandos:
  - `backend-jarvis/build-out.txt`
  - `backend-jarvis/jest-out.txt`
  - `backend-jarvis/lint-out.txt`
- [x] Agregar al `.gitignore` las notas personales (no se borran, solo se
  evita que se suban a GitHub por accidente):
  - `backend-jarvis/recordatorio.txt`
  - `practice.txt` (raíz)
  - `frontend-jarvis/.watch-test.txt`
- [x] Crear el `.gitignore` de la raíz (contendrá `practice.txt`; en el
  Paso 2 se consolida con las reglas de backend y frontend).

> **¿Por qué importa?** El `.gitignore` le dice a Git "estos archivos no se
> suben jamás". Lo más importante que cubre es el `.env` (donde están las
> contraseñas y claves de Google/GitHub/DB). Un `.env` subido a GitHub es una
> fuga de seguridad grave.

### Paso 2 — Monorepo (un solo repo en la raíz)

- [ ] Borrar el `.git` interno de `backend-jarvis/` (quedó obsoleto).
- [ ] Inicializar git en la raíz del proyecto (`Proyecto-Jarvis-Evolve`),
  que abarca `backend-jarvis/` + `frontend-jarvis/`.
- [ ] Consolidar las reglas de `.gitignore` de backend y frontend en el
  `.gitignore` de la raíz (`.env`, `node_modules`, `dist`, `.next`, etc).

> **¿Por qué "monorepo"?** Es el estándar profesional para un proyecto
> full-stack: todo el código en un solo lugar, un solo historial y un solo
> robot de calidad. Con `main` protegido, nada se rompe.

### Paso 3 — Primer commit

- [ ] Hacer el primer commit con mensaje descriptivo, por ejemplo:
  `chore: initial commit (backend + frontend)`.

> **¿Qué es un commit?** Una "foto" del proyecto en un momento dado. Es el
> punto de partida: si en el futuro rompemos algo, podemos volver a esta foto.
> Usamos el formato **conventional commits** (`feat:`, `fix:`, `chore:`...),
> que es el idioma estándar de los repos profesionales.

### Paso 4 — Subir a GitHub

- [ ] Crear el repo vacío en github.com (lo hace el usuario).
- [ ] Conectar el repo local con el de GitHub (`git remote add origin <URL>`).
- [ ] Hacer el push (subir el commit a GitHub).

> **¿Qué es un remote?** La dirección del "disco en la nube" donde vive la
> copia del proyecto. `push` = subir los commits locales a esa dirección.

### Paso 5 — Crear el CI con GitHub Actions

- [ ] Crear `.github/workflows/ci.yml` con las etapas:
  1. `checkout` → tomar el código del repo.
  2. setup de Node.js + pnpm.
  3. `pnpm install` → instalar las librerías.
  4. `pnpm run lint` → revisar estilo y reglas.
  5. `pnpm run build` → compilar (detecta errores de tipos).
  6. `pnpm run test` → correr los tests unitarios.
  7. (opcional) `pnpm audit` → revisar vulnerabilidades de librerías.
- [ ] Configurar que se corra en cada `push` y cada `pull request`.

> **¿Qué es?** Un archivo de configuración (formato YAML) que describe la
> "receta" del robot. Cada línea con `run:` es un comando de terminal — los
> mismos que corremos a mano, pero ejecutados automáticamente por GitHub en
> cada cambio.

### Paso 6 — Proteger la rama `main`

- [ ] En GitHub: Settings → Branches → *Require status checks*.
- [ ] Configurar que `main` exija: un PR aprobado y el CI en verde.

> **¿Por qué?** Es el "puesto de control": ningún cambio entra a la versión
> oficial sin pasar por un PR y sin que el robot esté verde. Nada se rompe.

### Paso 7 — Verificación final

- [ ] Hacer un push de prueba.
- [ ] Confirmar en GitHub (pestaña Actions) que el workflow corre y queda
  verde.

---

## Conceptos básicos (para releer cuando quieras)

| Término | Qué es | Analogía |
|---------|--------|----------|
| Git | Programa que guarda "fotos" del proyecto con historial | Guardados de un videojuego |
| GitHub | Servicio que guarda una copia del proyecto en la nube | Disco en la nube |
| Commit | Una "foto" guardada del proyecto | Checkpoint |
| Push | Subir tus commits a GitHub | Subir archivos al disco en la nube |
| Rama (branch) | Línea de trabajo separada de la principal | Borrador paralelo |
| main | Rama principal = lo que funciona | Versión oficial |
| PR | Pedido para integrar un borrador a la principal | Revisión antes de integrar |
| CI (GitHub Actions) | Robot que revisa el código en cada cambio | Revisor automático |
| Lint | Revisa estilo y reglas del código | Corrector de ortografía |
| Build | Compila el código y detecta errores | Traducir a "máquina" |
| Test | Corre las pruebas unitarias | El examen |
| Deploy | Publicar la app en un servidor en la nube | Subir la web a internet |

## Comandos útiles

```bash
# Desde backend-jarvis/
pnpm run lint        # revisar estilo
pnpm run build       # compilar
pnpm run test        # correr los tests unitarios
pnpm run test -- -t "login"   # solo tests con "login" en el nombre
```

## Notas de seguridad

- Los archivos `.env` (backend y frontend) **nunca se suben** — ya están en el
  `.gitignore`. Contienen DATABASE_URL, JWT_SECRET, claves de Google/GitHub y
  SendGrid.
- Cuando en el futuro se haga deploy, esos secretos van como variables de
  entorno del proveedor (ej: Render / GitHub Secrets), nunca en el repo.
