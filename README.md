# 🧠 @daaxar/cache

> Yet another decorator-based cache function – elegant, flexible, and production-ready.

[![DEVELOP](https://github.com/daaxar/cache/actions/workflows/nodejs.develop.yml/badge.svg)](https://github.com/daaxar/cache/actions/workflows/nodejs.develop.yml) | [![MAIN](https://github.com/daaxar/cache/actions/workflows/nodejs.main.yml/badge.svg)](https://github.com/daaxar/cache/actions/workflows/nodejs.main.yml)

`@daaxar/cache` is a lightweight JavaScript library that lets you easily wrap functions (sync or async) with caching behavior using decorators. It supports multiple storage strategies, including filesystem and in-memory repositories, and is built with extensibility and maintainability in mind.

---

## ✨ Features

- ✅ Supports both synchronous and asynchronous functions
- ⚡ Minimal, efficient, and non-intrusive
- 🗃️ Built-in support for filesystem and memory-based storage
- ⏱️ Customizable cache expiration
- 🧱 Decorator support for both functions and entire objects
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
    repository, // 'memory' or 'filesystem' (default: filesystem)
    prefix, // Key prefix
    expiresAt, // Cache expiration time in seconds
    throwOnError, // Whether to throw if caching fails
    getCacheKey, // Custom function to generate a cache key
});
```

You can also pass options per function instance:

```js
const cached = cache(fn, {
    prefix: 'my-function',
    expiresAt: 60,
});
```

---

## 🧩 Built-in repositories

- `filesystem`: stores cache as `.json` files
- `memory`: keeps cache in-memory (useful for testing or ephemeral processes)

```js
const { repositories } = require('@daaxar/cache');

const memoryRepo = repositories.memory();
const cache = Cache({ repository: memoryRepo });
```

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
npm test            # Run tests (currently a placeholder)
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
