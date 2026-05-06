# 🧠 @daaxar/cache

> Yet another decorator-based cache function – elegant, flexible, and production-ready.

[![DEVELOP](https://github.com/daaxar/cache/actions/workflows/nodejs.develop.yml/badge.svg)](https://github.com/daaxar/cache/actions/workflows/nodejs.develop.yml) | [![MAIN](https://github.com/daaxar/cache/actions/workflows/nodejs.main.yml/badge.svg)](https://github.com/daaxar/cache/actions/workflows/nodejs.main.yml)

`@daaxar/cache` is a lightweight JavaScript library that lets you easily wrap functions (sync or async) with caching behavior using decorators. It supports multiple storage strategies, including filesystem and in-memory repositories, and is built with extensibility and maintainability in mind.

---

## ✨ Features

- ✅ Supports both synchronous and asynchronous functions
- ✅ Supports non-`async` functions that return `Promise`
- ✅ Single-flight: concurrent calls for the same key share one execution
- ⚡ Minimal, efficient, and non-intrusive
- 🗃️ Built-in support for filesystem and memory-based storage
- ⏱️ Customizable cache expiration
- 🧱 Decorator support for both functions and entire objects
- 🧹 Manual invalidation by key, function, or namespace
- 🎯 Well-defined code style (Prettier, commitlint, husky)

---

## 🚀 Installation

```bash
npm install @daaxar/cache
```

> Note: This package is published on GitHub Packages.

---

## 🧪 Basic usage

```js
const { Cache } = require('@daaxar/cache');

const cache = Cache();

const slowFn = async (param) => {
    await new Promise((r) => setTimeout(r, 1000));
    return `Result for ${param}`;
};

const cachedFn = cache(slowFn, { prefix: 'slow' });

(async () => {
    console.time('first');
    console.log(await cachedFn('A'));
    console.timeEnd('first');

    console.time('second');
    console.log(await cachedFn('A')); // retrieved from cache
    console.timeEnd('second');
})();
```

---

## ⚙️ Configuration options

```js
Cache({
    repository, // repositories.filesystem() by default
    namespace, // preferred cache namespace
    prefix, // backwards-compatible alias for namespace
    expiresAt, // TTL in seconds, defaults to 30
    throwOnError, // legacy shortcut for cacheErrorStrategy: 'throw'
    cacheErrorStrategy, // 'bypass' (default) or 'throw'
    getCacheKey, // custom function key generator
    keySerializer, // custom serializer for key input
});
```

You can also pass options per function instance:

```js
const cached = cache(fn, {
    namespace: 'my-function',
    expiresAt: 60,
});
```

`prefix` still works, but new code should use `namespace`. A namespace isolates storage and is also used by `clear`.

---

## 🧩 Built-in repositories

- `filesystem`: stores cache as `.json` files
- `memory`: keeps cache in-memory (useful for testing or ephemeral processes)

```js
const { repositories } = require('@daaxar/cache');

const memoryRepo = repositories.memory();
const cache = Cache({ repository: memoryRepo });
```

Filesystem cache defaults to `path.join(process.cwd(), '.daaxar-cache')`, not the package directory. Pass `repositories.filesystem({ folder })` to choose an explicit location.

```js
const cache = Cache({
    repository: repositories.filesystem({
        folder: './.cache/my-app',
    }),
});
```

### Manual invalidation

```js
const cache = Cache({
    repository: repositories.memory(),
    getCacheKey: (_fn, args) => args[0],
});

const cachedUser = cache(loadUser, { namespace: 'users' });

await cachedUser.cache.deleteKey('user-123');
await cachedUser.cache.deleteFunction();
await cache.clear({ namespace: 'users' });
```

### Object methods

Objects are not mutated by default. The returned object contains wrapped methods and preserves `this`.

```js
const service = {
    factor: 2,
    multiply(value) {
        return value * this.factor;
    },
};

const cachedService = cache(service, { namespace: 'service' });
cachedService.multiply(4);
```

If you intentionally want mutation:

```js
cache(service, { namespace: 'service', mutate: true });
```

### Repository contract

Repositories expose this async contract:

```js
{
    read(key, options);
    write(key, content, args, options);
    delete (key, options);
    has(key, options);
    clear(options);
}
```

Built-in repositories also expose sync variants for sync function caching: `readSync`, `writeSync`, `deleteSync`, `hasSync`, and `clearSync`. If a custom repository does not expose sync methods, sync functions execute without persistence.

### Serializers and key limits

Default key generation uses stable JSON-like serialization and rejects circular arguments. It handles `undefined`, `Date`, `BigInt`, `Function`, and `Symbol` with explicit markers, but cache keys are only as good as the values you pass in. For non-serializable or domain-specific arguments, provide `getCacheKey` or `keySerializer`.

Filesystem output uses JSON by default and can be customized:

```js
const repository = repositories.filesystem({
    serializer: {
        serialize: (entry) => JSON.stringify(entry),
        deserialize: (text) => JSON.parse(text),
    },
});
```

### Error behavior

By default cache repository failures are bypassed: the wrapped function still executes and the cache read/write failure is ignored. Use `cacheErrorStrategy: 'throw'` or `throwOnError: true` when cache failures should fail the call.

### Module compatibility

The package is CommonJS-first:

```js
const { Cache, repositories } = require('@daaxar/cache');
```

Type declarations are included for TypeScript consumers. ESM projects can import it through Node's CommonJS interop.

### Known limits

- Cached arguments and filesystem values must be serializable by the configured serializers.
- Promise results are cached after resolution; rejected promises are not cached.
- Single-flight is in-process only. It does not coordinate across Node processes.
- Filesystem storage is local disk storage, not a distributed cache.
- Default TTL is 30 seconds. Use an explicit `expiresAt` for production behavior.

---

## 🧰 Project structure & tools

This project uses:

- `prettier` for code formatting
- `husky` + `lint-staged` for pre-commit checks
- `commitlint` to enforce conventional commit messages

### Available scripts

```bash
npm run lint        # Analyze code formatting
npm run lint:write  # Auto-fix formatting
npm test            # Run Jest tests
npm run build       # Check JavaScript syntax
npm run clean       # Remove generated local artifacts
```

---

## 🔁 Development & release workflow

This project follows the **Git Flow** branching strategy, with automated publishing powered by **GitHub Actions**.

### 🧪 On `develop` branch

Each push triggers:

- Dependency install
- Project build
- Lint and test checks

🛑 No version bump or publishing is done here.

### 🚀 On `main` branch

When a pull request is merged into `main`:

1. `npm version patch` is executed automatically
2. The version bump is committed and pushed
3. The package is published to GitHub Packages
4. A GitHub Release is created automatically with the new version

### 🏷️ Optional: Tag-based publishing

You can also manually create a tag (e.g., `v1.2.3`) and trigger publishing via a separate GitHub Actions workflow.

---

## 📦 Publishing the package

This package is published to [GitHub Packages](https://github.com/features/packages). To publish a new version:

1. Create a Pull Request from `develop` to `main`
2. Merge it after CI passes
3. GitHub Actions will:
    - Bump the version
    - Publish the package
    - Create a GitHub Release with the version tag

> The `package.json` is configured with:
>
> ```json
> "publishConfig": {
>   "registry": "https://npm.pkg.github.com/"
> }
> ```

---

## ✅ Best practices

- Avoid caching functions with non-idempotent side effects.
- Ensure that function arguments and return values are serializable.
- Use memory caching in tests and short-lived apps, and filesystem for persistent environments.

---

## 📚 Resources

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [GitHub Packages Docs](https://docs.github.com/en/packages)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Git Flow Model](https://nvie.com/posts/a-successful-git-branching-model/)

---

## 👤 Author

Crafted with ❤️ by [@daaxar](https://github.com/daaxar)
