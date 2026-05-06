const { getCacheKeyDefault } = require('./getCacheKeyDefault');
const { wrapperFactory } = require('./wrapper');
const repo = require('./repository');
const { objectMethodsWrapper } = require('./objectMethodsWrapper');

const Cache = ({
    repository = repo.filesystem(),
    prefix: prefixDefault = undefined,
    namespace: namespaceDefault = undefined,
    expiresAt = 30,
    throwOnError = false,
    cacheErrorStrategy = undefined,
    getCacheKey = getCacheKeyDefault,
    keySerializer = undefined,
} = {}) => {
    const wrapper = wrapperFactory(repository);

    const cacheDecorator = (
        fn,
        {
            prefix = prefixDefault,
            namespace = namespaceDefault,
            expiresAt: instanceExpiresAt,
            mutate = false,
        } = {},
    ) => {
        const factoryOptions = {
            expiresAt,
            getCacheKey,
            throwOnError,
            cacheErrorStrategy,
            keySerializer,
        };
        const instanceOptions = {
            prefix,
            namespace,
            expiresAt: instanceExpiresAt,
            mutate,
        };
        if (typeof fn === 'object') {
            return objectMethodsWrapper(
                fn,
                wrapper,
                factoryOptions,
                instanceOptions,
            );
        }

        return wrapper(fn, factoryOptions, instanceOptions);
    };

    cacheDecorator.deleteKey = (key, { prefix, namespace } = {}) => {
        if (!repository.delete) return Promise.resolve();

        return repository.delete(key, {
            namespace: namespace ?? prefix ?? namespaceDefault ?? prefixDefault,
            throwOnError,
        });
    };
    cacheDecorator.clear = ({ prefix, namespace } = {}) => {
        if (!repository.clear) return Promise.resolve();

        return repository.clear({
            namespace: namespace ?? prefix ?? namespaceDefault ?? prefixDefault,
            throwOnError,
        });
    };
    cacheDecorator.deleteFunction = (cachedFn) => {
        if (!cachedFn || !cachedFn.cache || !cachedFn.cache.deleteFunction) {
            return Promise.resolve();
        }

        return cachedFn.cache.deleteFunction();
    };

    return cacheDecorator;
};

exports.Cache = Cache;
