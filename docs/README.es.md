# 🧠 @daaxar/cache

> Yet another decorator cache function – elegante, versátil y lista para producción.

[![DEVELOP](https://github.com/daaxar/cache/actions/workflows/nodejs.develop.yml/badge.svg)](https://github.com/daaxar/cache/actions/workflows/nodejs.develop.yml) | [![MAIN](https://github.com/daaxar/cache/actions/workflows/nodejs.main.yml/badge.svg)](https://github.com/daaxar/cache/actions/workflows/nodejs.main.yml)

`@daaxar/cache` es una pequeña librería que permite aplicar **decoradores de caché** de manera simple y poderosa. Está diseñada para funcionar en entornos síncronos y asíncronos, y soporta múltiples estrategias de almacenamiento como sistema de archivos (`filesystem`) y memoria (`memory`).

---

## ✨ Características

- ✅ Decoradores para funciones y objetos
- 🧠 Detección automática de funciones `async`
- 📦 Almacenamiento en disco o memoria
- 🧩 Extensible con repositorios personalizados
- 📆 Control granular del tiempo de expiración
- 📚 Estilo y convenciones modernas (`prettier`, `commitlint`, `husky`)

---

## 🚀 Instalación

```bash
npm install @daaxar/cache
```

> Nota: este paquete se publica en GitHub Packages.

---

## 🧪 Uso básico

```js
const { Cache } = require('@daaxar/cache');

const cache = Cache();

const slowFn = async (param) => {
    await new Promise((r) => setTimeout(r, 1000));
    return `Resultado de ${param}`;
};

const cachedFn = cache(slowFn, { prefix: 'slow' });

(async () => {
    console.time('first');
    console.log(await cachedFn('A'));
    console.timeEnd('first');

    console.time('second');
    console.log(await cachedFn('A')); // viene del caché
    console.timeEnd('second');
})();
```

---

## 🛠️ Opciones del decorador

```js
Cache({
    repository, // 'memory' o 'filesystem' (por defecto: filesystem)
    prefix, // Prefijo para las claves
    expiresAt, // Tiempo de expiración (segundos)
    throwOnError, // Si tirar o no error ante fallos de caché
    getCacheKey, // Función para generar claves únicas
});
```

También podés pasar opciones por instancia del decorador:

```js
const cachedFn = cache(fn, {
    prefix: 'mi-funcion',
    expiresAt: 60,
});
```

---

## 🧩 Repositorios incluidos

- `filesystem`: escribe archivos `.json` en un directorio de caché
- `memory`: almacena en memoria (útil para pruebas o procesos efímeros)

Podés importar directamente:

```js
const { repositories } = require('@daaxar/cache');

const memoryRepo = repositories.memory();
const cache = Cache({ repository: memoryRepo });
```

---

## 🔧 Configuración del proyecto

Este proyecto usa:

- `prettier` para formateo automático
- `husky` + `lint-staged` para pre-commits
- `commitlint` para convenciones de mensajes

### Comandos útiles

```bash
npm run lint        # Analiza el código
npm run lint:write  # Formatea archivos automáticamente
npm test            # Ejecuta pruebas (placeholder)
```

---

## 🔁 Flujo de desarrollo y publicación

Este proyecto sigue **Git Flow** con automatización mediante **GitHub Actions**.

### 🔨 En `develop`

Cada push a `develop` corre CI (build, test) pero no publica nada.

### 🚀 En `main`

Al hacer merge a `main`, se ejecuta:

1. `npm version patch` → bump automático de versión
2. Commit y push con el cambio
3. Publicación en GitHub Packages
4. Creación de un Release en GitHub

### 🏷️ Alternativamente: publicar por tag

También podés crear un tag manualmente (`v1.2.3`) y se disparará un workflow para publicar la versión.

---

## 💡 Recomendaciones

- No uses la caché para funciones con efectos secundarios no idempotentes.
- Si usás el repositorio de `filesystem`, asegurate de que el proceso tenga permisos de escritura.
- Las funciones decoradas deben poder serializarse (los argumentos y su retorno).

---

## 📚 Referencias

- [GitHub Packages](https://docs.github.com/en/packages)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Git Flow](https://nvie.com/posts/a-successful-git-branching-model/)

---

## 🧑‍💻 Autor

Hecho con 💙 por [@daaxar](https://github.com/daaxar)
