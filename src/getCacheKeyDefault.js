const { hash } = require('./utils/hash');
const { stableStringify } = require('./utils/stableStringify');

const functionKeys = new WeakMap();

function getFunctionSignature(fn) {
    if (!functionKeys.has(fn)) {
        functionKeys.set(fn, {
            name: fn.name || 'anonymous',
            sourceHash: hash(fn.toString()),
        });
    }

    return functionKeys.get(fn);
}

function serializeArgs(args, serializer = stableStringify) {
    try {
        return serializer(args);
    } catch (error) {
        throw new TypeError(
            `Unable to generate cache key: ${error.message || 'arguments are not serializable'}`,
        );
    }
}

function getCacheKeyDefault(fn, args, { namespace = '', serializer } = {}) {
    const serializedArgs = serializeArgs(args, serializer);

    if (typeof fn !== 'function') {
        return hash(
            stableStringify({
                namespace,
                fn: String(fn),
                args: serializedArgs,
            }),
        );
    }

    return hash(
        stableStringify({
            namespace,
            fn: getFunctionSignature(fn),
            args: serializedArgs,
        }),
    );
}

exports.getCacheKeyDefault = getCacheKeyDefault;
