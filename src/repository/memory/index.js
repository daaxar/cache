const { cacheModelFactory } = require('../cacheModelFactory');

const buckets = new Map();

function getBucket(bucketName) {
    if (!buckets.has(bucketName)) buckets.set(bucketName, new Map());

    return buckets.get(bucketName);
}

function resolveNamespace({ namespace, prefix } = {}) {
    return namespace ?? prefix ?? 'default';
}

function getStorageKey(key, options = {}) {
    return `${resolveNamespace(options)}:${key}`;
}

module.exports = ({ bucketName = 'default' } = {}) => {
    const bucket = getBucket(bucketName);

    const deleteSync = (key, options) => {
        bucket.delete(getStorageKey(key, options));
    };

    const readSync = (key, options) => {
        const storageKey = getStorageKey(key, options);

        if (bucket.has(storageKey)) return bucket.get(storageKey);

        return cacheModelFactory({ expired: true }, undefined, {
            expire: 0,
        });
    };

    const writeSync = (
        key,
        content,
        args,
        { namespace, prefix, instanceExpiresAtValue, expiresAtValue } = {},
    ) => {
        const ttl = instanceExpiresAtValue ?? expiresAtValue ?? 0;
        const expire = Date.now() + ttl * 1000;

        const data = cacheModelFactory(content, args, { expire, ttl });

        bucket.set(getStorageKey(key, { namespace, prefix }), data);
    };

    const hasSync = (key, options) => {
        const cached = readSync(key, options);

        return Boolean(cached && cached.expire > Date.now());
    };

    const clearSync = (options = {}) => {
        const namespace = `${resolveNamespace(options)}:`;

        for (const key of bucket.keys()) {
            if (key.startsWith(namespace)) bucket.delete(key);
        }
    };

    return {
        delete: async (key, options) => deleteSync(key, options),
        has: async (key, options) => hasSync(key, options),
        clear: async (options) => clearSync(options),
        read: async (key, options) => readSync(key, options),
        write: async (...args) => writeSync(...args),
        deleteSync,
        hasSync,
        clearSync,
        readSync,
        writeSync,
    };
};
