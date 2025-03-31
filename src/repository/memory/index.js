const { cacheModelFactory } = require('../cacheModelFactory');

const memo = new Set();
module.exports = ({ bucketName = 'default' } = {}) => {
    memo[bucketName] = memo[bucketName] || new Set();
    const deleteSync = (key) => {
        delete memo[bucketName][key];
    };

    const readSync = (key) => {
        const cached = memo[bucketName][key];

        if (cached) return cached;

        return cacheModelFactory({ expired: true }, undefined, {
            expire: 0,
        });
    };

    const writeSync = (
        key,
        content,
        args,
        { instanceExpiresAtValue, expiresAtValue } = {},
    ) => {
        const expire =
            Date.now() + (instanceExpiresAtValue || expiresAtValue) * 1000;

        const data = cacheModelFactory(content, args, { expire });

        memo[bucketName][key] = data;
    };

    return {
        delete: async (key) => deleteSync(key),
        read: async (key) => readSync(key),
        write: async (...args) => writeSync(...args),
        deleteSync,
        readSync,
        writeSync,
    };
};
