const { isAsyncFunction } = require('./utils/isAsyncFunction');
const { stableStringify } = require('./utils/stableStringify');

function resolveNamespace({ namespace, prefix } = {}) {
    return namespace ?? prefix ?? 'default';
}

function resolveTtl(args, { expiresAt, instanceExpiresAt }) {
    const instanceExpiresAtValue =
        typeof instanceExpiresAt === 'function'
            ? instanceExpiresAt(...args)
            : instanceExpiresAt;
    const expiresAtValue =
        typeof expiresAt === 'function' ? expiresAt(...args) : expiresAt;

    return { instanceExpiresAtValue, expiresAtValue };
}

function isFresh(cached) {
    return cached && cached.expire > Date.now();
}

function isThenable(value) {
    return value && typeof value.then === 'function';
}

function defineWrappedName(wrapped, fn) {
    try {
        Object.defineProperty(wrapped, 'name', {
            configurable: true,
            value: fn.name ? `cached_${fn.name}` : 'cached',
        });
    } catch (_) {
        // Function metadata is best-effort only.
    }
}

function createRepositoryErrorHandler({ throwOnError, cacheErrorStrategy }) {
    const strategy = cacheErrorStrategy ?? (throwOnError ? 'throw' : 'bypass');

    return function handleRepositoryError(error) {
        if (strategy === 'throw') throw error;

        return undefined;
    };
}

function createCacheController(
    repository,
    { namespace, handleRepositoryError },
) {
    const clear = async (options = {}) => {
        if (!repository.clear) return undefined;

        try {
            return await repository.clear({
                namespace: resolveNamespace({ namespace, ...options }),
            });
        } catch (error) {
            return handleRepositoryError(error);
        }
    };

    const deleteKey = async (key, options = {}) => {
        if (!repository.delete) return undefined;

        try {
            return await repository.delete(key, {
                namespace: resolveNamespace({ namespace, ...options }),
            });
        } catch (error) {
            return handleRepositoryError(error);
        }
    };

    return { clear, deleteKey };
}

exports.wrapperFactory = (repository) =>
    function wrapper(
        fn,
        {
            expiresAt,
            getCacheKey,
            throwOnError,
            cacheErrorStrategy,
            disableCache = false,
            keySerializer = stableStringify,
        },
        {
            prefix,
            namespace: instanceNamespace,
            expiresAt: instanceExpiresAt,
        } = {},
    ) {
        if (disableCache === true) return fn;

        const namespace = resolveNamespace({
            namespace: instanceNamespace,
            prefix,
        });
        const inflight = new Map();
        const functionKeys = new WeakMap();
        const handleRepositoryError = createRepositoryErrorHandler({
            throwOnError,
            cacheErrorStrategy,
        });
        const controller = createCacheController(repository, {
            namespace,
            handleRepositoryError,
        });
        let hasAsyncResult = false;

        const getParams = (args) => {
            const { instanceExpiresAtValue, expiresAtValue } = resolveTtl(
                args,
                {
                    expiresAt,
                    instanceExpiresAt,
                },
            );
            const key = getCacheKey(fn, args, {
                namespace,
                serializer: keySerializer,
            });

            return { key, instanceExpiresAtValue, expiresAtValue };
        };

        const readCached = async (key, ttlOptions) => {
            try {
                return await repository.read(key, {
                    namespace,
                    throwOnError,
                    ...ttlOptions,
                });
            } catch (error) {
                return handleRepositoryError(error);
            }
        };

        const readCachedSync = (key, ttlOptions) => {
            if (!repository.readSync) return undefined;

            try {
                return repository.readSync(key, {
                    namespace,
                    throwOnError,
                    ...ttlOptions,
                });
            } catch (error) {
                return handleRepositoryError(error);
            }
        };

        const writeCached = async (key, content, args, ttlOptions) => {
            try {
                await repository.write(key, content, args, {
                    namespace,
                    throwOnError,
                    ...ttlOptions,
                });
            } catch (error) {
                handleRepositoryError(error);
            }
        };

        const writeCachedSync = (key, content, args, ttlOptions) => {
            if (!repository.writeSync) return undefined;

            try {
                repository.writeSync(key, content, args, {
                    namespace,
                    throwOnError,
                    ...ttlOptions,
                });
            } catch (error) {
                handleRepositoryError(error);
            }
        };

        const trackKey = (key) => {
            if (typeof fn !== 'function') return;
            if (!functionKeys.has(fn)) functionKeys.set(fn, new Set());

            functionKeys.get(fn).add(key);
        };

        const deleteFunction = async () => {
            const keys = functionKeys.get(fn) ?? new Set();

            await Promise.all(
                [...keys].map((key) => controller.deleteKey(key)),
            );
            keys.clear();
        };

        const runAsync = async (thisArg, args, key, ttlOptions, invoke) => {
            const flightKey = `${namespace}:${key}`;

            if (inflight.has(flightKey)) return inflight.get(flightKey);

            const promise = (async () => {
                const content = await invoke();
                await writeCached(key, content, args, ttlOptions);
                trackKey(key);

                return content;
            })();

            inflight.set(flightKey, promise);

            try {
                return await promise;
            } finally {
                inflight.delete(flightKey);
            }
        };

        const wrappedAsync = async function cachedAsync(...args) {
            const { key, instanceExpiresAtValue, expiresAtValue } =
                getParams(args);
            const ttlOptions = { instanceExpiresAtValue, expiresAtValue };
            const cached = await readCached(key, ttlOptions);

            if (isFresh(cached)) return cached.data;

            return runAsync(this, args, key, ttlOptions, () =>
                fn.apply(this, args),
            );
        };

        const wrappedSync = function cachedSync(...args) {
            const { key, instanceExpiresAtValue, expiresAtValue } =
                getParams(args);
            const ttlOptions = { instanceExpiresAtValue, expiresAtValue };
            const cached = readCachedSync(key, ttlOptions);

            if (isFresh(cached)) {
                return hasAsyncResult
                    ? Promise.resolve(cached.data)
                    : cached.data;
            }
            if (inflight.has(`${namespace}:${key}`))
                return inflight.get(`${namespace}:${key}`);

            const result = fn.apply(this, args);

            if (isThenable(result)) {
                hasAsyncResult = true;
                return runAsync(this, args, key, ttlOptions, () => result);
            }

            writeCachedSync(key, result, args, ttlOptions);
            trackKey(key);

            return result;
        };

        const wrapped = isAsyncFunction(fn) ? wrappedAsync : wrappedSync;

        wrapped.cache = {
            clear: controller.clear,
            deleteKey: controller.deleteKey,
            deleteFunction,
            namespace,
        };
        wrapped.invalidate = controller.deleteKey;
        wrapped.clear = controller.clear;
        defineWrappedName(wrapped, fn);

        return wrapped;
    };
