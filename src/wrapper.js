const { isAsyncFunction } = require('./utils/isAsyncFunction');

function getParams(
    fn,
    args,
    { expiresAt, getCacheKey },
    { expiresAt: instanceExpiresAt },
) {
    const instanceExpiresAtValue =
        typeof instanceExpiresAt === 'function'
            ? instanceExpiresAt(...args)
            : instanceExpiresAt;
    const expiresAtValue =
        typeof expiresAt === 'function' ? expiresAt(...args) : expiresAt;

    const key = getCacheKey(fn, args);
    return { key, instanceExpiresAtValue, expiresAtValue };
}

function getWrappedFn(
    fn,
    { expiresAt, getCacheKey, throwOnError },
    { prefix, expiresAt: instanceExpiresAt },
    { read, write },
) {
    return async (...args) => {
        const { key, instanceExpiresAtValue, expiresAtValue } = getParams(
            fn,
            args,
            { expiresAt, getCacheKey },
            { expiresAt: instanceExpiresAt },
        );

        const cached = await read(key, {
            prefix,
            instanceExpiresAtValue,
            expiresAtValue,
            throwOnError,
        });
        if (cached && (cached.expire > Date.now() || !fn)) return cached.data;

        if (!fn) throw new Error('expired content');

        return fn(...args).then((content) => {
            write(key, content, args, {
                prefix,
                instanceExpiresAtValue,
                expiresAtValue,
                throwOnError,
            });

            return content;
        });
    };
}

function getWrappedFnSync(
    fn,
    { expiresAt, getCacheKey, throwOnError },
    { prefix, expiresAt: instanceExpiresAt },
    { read, write },
) {
    return (...args) => {
        const { key, instanceExpiresAtValue, expiresAtValue } = getParams(
            fn,
            args,
            { expiresAt, getCacheKey },
            { expiresAt: instanceExpiresAt },
        );

        const cached = read(key, {
            prefix,
            instanceExpiresAtValue,
            expiresAtValue,
            throwOnError,
        });

        if (cached && (cached.expire > Date.now() || !fn)) return cached.data;

        if (!fn) throw new Error('expired content');

        const content = fn(...args);

        write(key, content, args, {
            prefix,
            instanceExpiresAtValue,
            expiresAtValue,
            throwOnError,
        });

        return content;
    };
}

exports.wrapperFactory = ({ read, write, readSync, writeSync }) =>
    function wrapper(
        fn,
        { expiresAt, getCacheKey, throwOnError, disableCache = false },
        { prefix, expiresAt: instanceExpiresAt },
    ) {
        if (disableCache === true) return fn;

        if (isAsyncFunction(fn)) {
            return getWrappedFn(
                fn,
                { expiresAt, getCacheKey, throwOnError, disableCache },
                { prefix, expiresAt: instanceExpiresAt },
                { read, write },
            );
        }

        return getWrappedFnSync(
            fn,
            { expiresAt, getCacheKey, throwOnError, disableCache },
            { prefix, expiresAt: instanceExpiresAt },
            { read: readSync, write: writeSync },
        );
    };
