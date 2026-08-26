# Contribuir al Proyecto — Guia para el equipo

Este documento explica las reglas y convenciones que seguimos para mantener
el proyecto ordenado y profesional.

---

## Flujo de trabajo completo (ejemplo práctico)

Imaginás que querés agregar un botón de "Cerrar sesión" en el frontend.
Esto es lo que hacés, paso a paso:

### Paso 1 — Crear la rama

Nunca trabajás directo en `main`. Creás una rama con un nombre descriptivo:

```bash
# Asegurate de estar en main y actualizado
git checkout main
git pull

# Crear la rama
git checkout -b feat/agregar-boton-logout
```

### Paso 2 — Hacés tu cambio

Editás los archivos que necesitás. Por ejemplo, en `frontend-jarvis/` creás
un componente `LogoutButton.tsx`.

### Paso 3 — Marcás y commiteás

```bash
# Ver qué archivos cambiaron
git status

# Marcar los archivos
git add frontend-jarvis/src/components/LogoutButton.tsx

# Commit con mensaje descriptivo
git commit -m "feat: agregar boton de cerrar sesion"
```

### Paso 4 — Subís la rama

```bash
git push -u origin feat/agregar-boton-logout
```

### Paso 5 — Abrís el Pull Request (PR)

1. En GitHub, aparece un cartel amarillo que dice **"Compare & pull request"**.
   Hacé click.
2. Poné un título claro y descripción si hace falta.
3. Dá **Create pull request**.

### Paso 6 — El robot revisa

El robot (GitHub Actions) corre automáticamente y verifica:
- ✅ El código tiene buen estilo (lint)
- ✅ El código compila (build)
- ✅ Los 69 tests pasan (test)
- ✅ No hay vulnerabilidades conocidas (audit)

Si todo verde → podés mergear.
Si algo rojo → arreglás, hacé otro commit, y el robot vuelve a correr solo.

### Paso 7 — Merge y limpieza

1. Dá click a **Merge** en el PR.
2. Borrá la rama (GitHub te da el botón, o a mano):
```bash
git checkout main
git pull
git branch -d feat/agregar-boton-logout
```

**Listo.** Tu cambio ya está en `main` y el robot lo verificó.

---

## Convenciones de ramas

Siempre creá una rama antes de trabajar. Usá este formato:

```
prefijo/nombre-descriptivo-del-cambio
```

| Prefijo | Cuándo usarlo | Ejemplo |
|---------|---------------|---------|
| `feat/` | Nueva funcionalidad | `feat/agregar-login-google` |
| `fix/` | Arreglar un bug | `fix/error-en-login` |
| `refactor/` | Mejorar código sin cambiar funcionalidad | `refactor/limpiar-auth-service` |
| `test/` | Agregar o modificar tests | `test/agregar-tests-de-login` |
| `docs/` | Documentación | `docs/actualizar-readme` |
| `ci/` | Cambios al robot CI/CD | `ci/agregar-auditoria-de-seguridad` |
| `chore/` | Tareas de mantenimiento | `chore/actualizar-dependencias` |

---

## Convenciones de commits

Usamos **conventional commits**. El formato es:

```
prefijo: descripcion corta en minuscula
```

| Prefijo | Significado | Ejemplo |
|---------|-------------|---------|
| `feat` | Nueva funcionalidad | `feat: agregar endpoint de registro` |
| `fix` | Corregir un bug | `fix: corregir error 500 en login` |
| `chore` | Tarea de mantenimiento | `chore: actualizar prisma` |
| `refactor` | Reorganizar codigo sin cambiar comportamiento | `refactor: extraer logica de validacion` |
| `test` | Agregar o modificar tests | `test: agregar tests para register` |
| `ci` | Cambios en CI/CD | `ci: agregar paso de prisma generate` |
| `docs` | Documentacion | `docs: agregar guia de contributing` |
| `style` | Formato (espacios, comas, etc) | `style: formatear archivos con prettier` |

**Reglas:**
- Descripción en **inglés** y en **minúscula** después de los dos puntos.
- No usar punto al final.
- Que sea corta (5-7 palabras máximo).

---

## El robot CI (GitHub Actions)

Cada PR que creás activa automáticamente el robot, que verifica:

| Paso | Qué hace | Herramienta |
|------|----------|-------------|
| Lint | Revisa estilo y reglas del código | ESLint + Prettier |
| Build | Compila TypeScript (detecta errores de tipos) | NestJS CLI |
| Test | Corre los 69 tests unitarios | Jest |
| Audit | Revisa vulnerabilidades en las librerías | pnpm audit |

Si el robot está **verde** → el código está listo para merge.
Si el robot está **rojo** → hay que arreglar antes de mergear.

---

## Branch Protection (candado en main)

`main` está protegido. Esto significa:

- **No podés pushear directo a main.** Todo cambio pasa por un PR.
- **El robot debe estar verde** antes de poder mergear.
- **Al menos 1 persona debe aprobar** el PR.
- **No se permite force push** (no se puede sobrescribir historia).

Esto asegura que `main` siempre esté en un estado funcional.

---

## Notas importantes

- **Los archivos `.env` nunca se suben.** Contienen secretos (DATABASE_URL,
  JWT_SECRET, claves de OAuth, SendGrid). Si algún día se suben por accidente,
  hay que rotar las claves inmediatamente.
- **Los tests no necesitan base de datos.** Prisma está mockeado, así que los
  tests corren sin conexión a PostgreSQL.
- **Si el CI falla**, GitHub te notifica por email. No necesitás estar
  revisando manualmente — el robot te avisa.
