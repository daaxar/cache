const { getCacheKeyDefault } = require('./getCacheKeyDefault');
const { wrapperFactory } = require('./wrapper');
const repo = require('./repository');
const { objectMethodsWrapper } = require('./objectMethodsWrapper');

const Cache = ({
    repository = repo.filesystem(),
    prefix: prefixDefault = undefined,
    expiresAt = 30,
    throwOnError = false,
    getCacheKey = getCacheKeyDefault,
} = {}) => {
    const wrapper = wrapperFactory(repository);

    return (
        fn,
        { prefix = prefixDefault, expiresAt: instanceExpiresAt } = {},
    ) => {
        const factoryOptions = { expiresAt, getCacheKey, throwOnError };
        const instanceOptions = { prefix, expiresAt: instanceExpiresAt };
        if (typeof fn === 'object') {
            // TODO: Can i do a best effort here?
            objectMethodsWrapper(fn, wrapper, factoryOptions, instanceOptions);

            return fn;
        }

        return wrapper(fn, factoryOptions, instanceOptions);
    };
};

exports.Cache = Cache;
