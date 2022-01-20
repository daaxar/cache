const { cacheModelFactory } = require('../cacheModelFactory');

const memo = new Set();
module.exports = ({ bucketName = 'default' } = {}) => {
    memo[bucketName] = memo[bucketName] || new Set();

    return {
        delete: async (key) => {
            delete memo[bucketName][key];
        },

        read: async (key) => {
            const cached = memo[bucketName][key];

            if (cached) return cached;

            return cacheModelFactory({ expired: true }, undefined, {
                expire: 0,
            });
        },

        write: async (
            key,
            content,
            args,
            { instanceExpiresAtValue, expiresAtValue } = {}
        ) => {
            const expire =
                Date.now() + (instanceExpiresAtValue || expiresAtValue) * 1000;

            const data = cacheModelFactory(content, args, { expire });

            memo[bucketName][key] = data;
        },
    };
};
