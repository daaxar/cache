# 🚀 Publicación automatizada con GitHub Actions + Git Flow

Este repositorio está configurado con un sistema de integración y publicación continua utilizando **GitHub Actions** y el modelo de ramificación **Git Flow**.

---

## 🧬 Flujo de trabajo basado en Git Flow

![Git Flow Diagram](https://raw.githubusercontent.com/daaxar/assets/main/gitflow-diagram.png)

Se utiliza el modelo clásico de Git Flow, que organiza el ciclo de desarrollo y entrega en ramas específicas:

| Rama      | Propósito                                 |
| --------- | ----------------------------------------- |
| `develop` | Desarrollo activo, integración continua.  |
| `main`    | Código estable y versiones de producción. |
| `release` | Preparación para producción (opcional).   |
| `hotfix`  | Fixes rápidos sobre producción.           |

---

## ⚙️ Workflows de GitHub Actions

El proyecto contiene los siguientes workflows automáticos:

| Archivo            | ¿Cuándo se ejecuta?       | ¿Qué hace?                                              |
| ------------------ | ------------------------- | ------------------------------------------------------- |
| `develop.yml`      | Push a `develop`          | CI: instala deps, build y tests.                        |
| `release.yml`      | Push a `main`             | Versiona, publica en GitHub Packages y crea un Release. |
| `tag-release.yml`  | Push de un tag `v*.*.*`   | Alternativa: publica usando tag directamente.           |
| `pull-request.yml` | Pull Request hacia `main` | Corre CI y habilita auto-merge si todo pasa.            |

---

## 🧪 Validaciones en `develop`

Cada vez que haces push a `develop`, se ejecuta:

- Instalación de dependencias
- Build del proyecto (`npm run build`)
- Tests (`npm test`)

👉 Esto asegura que `develop` siempre esté en estado válido.

---

## 🚀 Publicación en producción (`main`)

La rama `main` está protegida: **solo se puede actualizar vía Pull Request**.

Al hacer merge a `main`, se ejecuta:

1. `npm version patch` — crea una nueva versión (`vX.Y.Z`)
2. Commit y push automático del cambio en `package.json`
3. Publicación del paquete en **GitHub Packages**
4. Creación automática de un **GitHub Release**

Opcionalmente, también podés publicar vía tag (`v1.2.3`) usando el workflow `tag-release.yml`.

---

## 🤖 Auto-merge en Pull Requests

Cuando se abre un PR hacia `main`:

- Corre la CI completa (build + test)
- Si todo pasa, y las reglas del repo lo permiten, se **habilita el auto-merge**

💡 Asegurate de tener activada la opción en el repo:

```
Settings → General → Pull Requests → Allow auto-merge
```

---

## 🔒 Requisitos de configuración

Antes de usar estos workflows, necesitás configurar lo siguiente:

### 1. `.nvmrc`

Debe contener la versión de Node.js que usás, por ejemplo:

```
18
```

---

### 2. Secrets del repositorio

Entrá a **Settings → Secrets → Actions**, y agregá:

| Nombre           | Valor                                                 |
| ---------------- | ----------------------------------------------------- |
| `NPM_AUTH_TOKEN` | Token personal con permisos `write:packages` y `repo` |

El token se usa para publicar en GitHub Packages.

---

### 3. `package.json` configurado

Tu `package.json` debe incluir:

```json
{
    "name": "@tuusuario/tu-paquete",
    "publishConfig": {
        "registry": "https://npm.pkg.github.com/"
    }
}
```

Reemplazá `@tuusuario` por tu nombre de usuario u organización.

---

## ✨ ¿Querés probarlo todo rápido?

Corré el siguiente script en tu proyecto para generar automáticamente todos los workflows:

```bash
curl -sL https://raw.githubusercontent.com/daaxar/assets/main/setup-workflows.sh | bash
```

¡Y listo!

---

## 📦 Soporte para versiones por tag (opcional)

Si preferís publicar con tags (`v1.2.3`), podés usar el workflow `tag-release.yml` sin pasar por `main`.

---

## 📚 Recursos útiles

- [Git Flow original](https://nvie.com/posts/a-successful-git-branching-model/)
- [GitHub Packages](https://docs.github.com/en/packages)
- [GitHub Actions](https://docs.github.com/en/actions)

---

## 🧼 Limpio, modular y escalable

Este sistema está pensado para crecer con tu proyecto. Podés fácilmente agregar:

- Soporte multi-package (monorepo)
- Releases con changelog automático
- Publicación en NPM público, Docker Hub, etc.

---

Made with ❤️ by [daaxar](https://github.com/daaxar)
