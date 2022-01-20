const { isAsyncFunction } = require('./utils/isAsyncFunction');

exports.wrapperFactory = ({ read, write }) =>
    function wrapper(
        fn,
        { expiresAt, getCacheKey, throwOnError, disableCache = false },
        { prefix, expiresAt: instanceExpiresAt }
    ) {
        if (disableCache === true) return fn;

        return async (...args) => {
            const instanceExpiresAtValue =
                typeof instanceExpiresAt === 'function'
                    ? instanceExpiresAt(...args)
                    : instanceExpiresAt;
            const expiresAtValue =
                typeof expiresAt === 'function'
                    ? expiresAt(...args)
                    : expiresAt;

            const key = getCacheKey(fn, args);

            const cached = await read(key, {
                prefix,
                instanceExpiresAtValue,
                expiresAtValue,
                throwOnError,
            });

            if (cached && (cached.expire > Date.now() || !fn))
                return cached.data;

            if (!fn) throw new Error('expired content');

            const content = isAsyncFunction(fn)
                ? await fn(...args)
                : fn(...args);

            write(key, content, args, {
                prefix,
                instanceExpiresAtValue,
                expiresAtValue,
                throwOnError,
            });

            return content;
        };
    };
