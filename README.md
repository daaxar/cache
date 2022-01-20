# Yet another cache wrapper function

[![DEVELOP](https://github.com/daaxar/cache/actions/workflows/nodejs.develop.yml/badge.svg)](https://github.com/daaxar/cache/actions/workflows/nodejs.develop.yml) | [![MAIN](https://github.com/daaxar/cache/actions/workflows/nodejs.main.yml/badge.svg)](https://github.com/daaxar/cache/actions/workflows/nodejs.main.yml)

## Create a cache wrapper instance

```javascript
const { Cache } = require('@daaxar/cache');

const cacheOptions = { expiresAt: 2 };
const cache = Cache(cacheOptions);
```

## Use cache wrapper on a function

```javascript
const foo = async () => Date.now();

const cacheableFoo = cache(foo);

const promise = cacheableFoo();

promise.then((value) => console.log({ value }));
```

## Using the file system repository (default)

```javascript
const { filesystem } = require('../src/repository');

const repository = filesystem({ folder: `${__dirname}/.cache` });

const cache = Cache({
    expiresAt: 2,   // Expire at 2 seconds. Default is 30 seconds
    repository,
});
```

## Using memory repository

```javascript
const { memory } = require('../src/repository');

const repository = memory();

const cache = Cache({
    expiresAt: 2,
    repository,
});
```
