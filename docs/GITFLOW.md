# Guía de GitFlow y GitHub Actions para el Proyecto

Este documento describe cómo se implementa el flujo de trabajo GitFlow en nuestro proyecto, incluyendo el uso de ramas, el proceso de desarrollo, lanzamiento y las acciones automáticas gestionadas por GitHub Actions. Sirve como referencia para el equipo para mantener consistencia y entender el flujo de trabajo.

## 1. ¿Qué es GitFlow?

GitFlow es un modelo de branching (ramificación) para gestionar proyectos de software que separa el desarrollo, las características, los lanzamientos y las correcciones. Su objetivo es proporcionar un flujo estructurado y predecible para el desarrollo de software, especialmente en equipos.

### Principales ramas y su propósito:

- **main**: Contiene el código de producción, es decir, las versiones estables y lanzadas al público o producción. Solo se mergean releases aquí.
- **develop**: Es la rama principal de desarrollo donde se integran todas las nuevas características, correcciones y mejoras. Sirve como base para las ramas de características y releases.
- **feature/\***: Ramas temporales creadas desde `develop` para desarrollar nuevas funcionalidades. Se mergean de vuelta a `develop` cuando están completas.
- **release/\***: Ramas temporales creadas desde `develop` para preparar un lanzamiento específico (por ejemplo, `release/1.0.0`). Se mergean a `main` y `develop` después de completar el release.
- **hotfix/\***: Ramas temporales creadas desde `main` para correcciones críticas en producción. Se mergean de vuelta a `main` y `develop`.

### Flujo típico:

1. Se trabaja en `develop` o en ramas `feature/*` para nuevas funcionalidades.
2. Cuando se quiere lanzar una versión, se crea una rama `release/X.Y.Z` desde `develop`.
3. La rama `release` se usa para estabilizar y preparar el lanzamiento (por ejemplo, ajustar versiones, documentación).
4. Una vez lista, la rama `release` se mergea a `main` (para producción) y a `develop` (para continuar el desarrollo).
5. Se crea un tag en `main` (por ejemplo, `v1.0.0`) y se publica el paquete.
6. Si hay errores en producción, se crea una rama `hotfix` desde `main`.

## 2. Flujos de GitHub Actions

Nuestros workflows en GitHub Actions están configurados para automatizar las tareas comunes en este flujo. A continuación, detallamos cada workflow y su función:

### 2.1. `nodejs.develop.yml` - CI para la rama `develop`

**Trigger:** Push a la rama `develop`.

**Acciones:**

- Checkout del código.
- Configuración de Node.js (usando `.nvmrc`).
- Instalación de dependencias (`npm ci`).
- Construcción del proyecto (`npm run build --if-present`).
- Ejecución de tests (`npm test`).
- Verificación del formato del código (`npm run lint --if-present`, si existe).

**Propósito:** Asegurar que el código en `develop` sea compilable, testable y cumpla con los estándares de calidad antes de integrarlo en releases.

---

### 2.2. `nodejs.release.yml` - Gestión de Releases (GitFlow)

**Trigger:** Push a cualquier rama que comience con `release/*` (por ejemplo, `release/1.0.0`).

**Acciones:**

- Checkout del código con historial completo.
- Configuración de Node.js y autenticación para GitHub Packages.
- Instalación de dependencias y construcción.
- Ejecución de tests.
- Validación del nombre de la rama `release` para asegurar que siga el formato SemVer (por ejemplo, `1.0.0`).
- Creación de un tag con el formato `vX.Y.Z` (por ejemplo, `v1.0.0`) y push al repositorio.
- Publicación del paquete npm con el tag específico (por ejemplo, `--tag 1.0.0`).
- Merge automático de la rama `release` a `main` (producción) y a `develop` (desarrollo).
- Eliminación de la rama `release` después del merge.
- Creación de una release en GitHub con notas automáticas basadas en los commits desde el último tag.

**Propósito:** Preparar, lanzar y publicar una versión estable, siguiendo el modelo GitFlow.

---

### 2.3. `nodejs.pull-request.yml` - Chequeo y Auto-Merge de Pull Requests

**Trigger:** Pull Requests hacia la rama `develop`.

**Acciones:**

- Checkout del código.
- Configuración de Node.js.
- Instalación de dependencias.
- Construcción del proyecto.
- Ejecución de tests.
- Verificación de cobertura de código (mínimo 80%): Asegura que los tests cubran al menos el 80% del código. Usa `npm run test:coverage` y analiza el archivo `coverage/lcov.info`.
- Si todos los checks pasan y el autor no es `github-actions[bot]`, se habilita el auto-merge (usando el método `squash` para mantener el historial limpio).

**Propósito:** Garantizar que solo código de calidad se integre en `develop` y automatizar merges cuando sea seguro.

---

## 3. Cómo Usar GitFlow en el Proyecto

### Pasos para un nuevo desarrollo:

1. **Crear una rama de característica:**

    - Desde `develop`, crea una nueva rama: `git checkout develop; git pull; git checkout -b feature/nueva-funcionalidad`.
    - Desarrolla tu código, haz commits y pushea la rama.
    - Abre un Pull Request desde `feature/nueva-funcionalidad` hacia `develop`.
    - GitHub Actions ejecutará los checks automáticos (`nodejs.pull-request.yml`).
    - Una vez aprobados y mergeados, la rama `feature` puede eliminarse.

2. **Preparar un release:**

    - Cuando `develop` esté listo para un lanzamiento, crea una rama `release`: `git checkout develop; git pull; git checkout -b release/X.Y.Z` (reemplaza `X.Y.Z` con la versión, ej. `1.0.0`).
    - Realiza ajustes finales (por ejemplo, versión en `package.json`, documentación).
    - Pushes a la rama `release/X.Y.Z` para desencadenar `nodejs.release.yml`.
    - GitHub Actions automatizará el resto: creará el tag, publicará el paquete, mergeará a `main` y `develop`, y generará la release.

3. **Correcciones en producción (hotfix):**
    - Si hay un bug en producción, crea una rama desde `main`: `git checkout main; git pull; git checkout -b hotfix/correccion-urgente`.
    - Arregla el problema, haz commits y abre un PR hacia `main`.
    - Después del merge, mergea también a `develop` manualmente o crea un workflow adicional para esto.

## 4. Consideraciones y Mejoras

- **Secrets:** Asegúrate de que `NPM_AUTH_TOKEN` y `GITHUB_TOKEN` estén configurados en los secretos del repositorio de GitHub.
- **Cobertura de Código:** El mínimo de 80% en cobertura puede ajustarse según las necesidades del proyecto. Si usas otra herramienta que no sea `lcov`, actualiza el script en `nodejs.pull-request.yml`.
- **Notificaciones:** Considera agregar notificaciones (por ejemplo, a Slack) si los workflows fallan, usando acciones como `slackapi/slack-github-action`.
- **Hotfixes y Features:** Si necesitas workflows específicos para `hotfix` o `feature` branches, puedes crearlos siguiendo un patrón similar a `nodejs.develop.yml`.

## 5. Referencias Útiles

- Documentación oficial de GitFlow: [GitFlow Cheatsheet](https://www.atlassian.com/git/tutorials/comparing-workflows#gitflow-workflow)
- GitHub Actions: [Documentación oficial](https://docs.github.com/en/actions)
- SemVer (Versionado Semántico): [semver.org](https://semver.org/)
