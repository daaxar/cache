const {
    mkdirSync: mkdir,
    unlink,
    writeFileSync,
    readFileSync,
    existsSync,
} = require('fs');
const { getFilename } = require('./getFilename');
const { cacheModelFactory } = require('../cacheModelFactory');

module.exports = ({ folder } = {}) => {
    const cacheFolder = folder ?? `${__dirname}/.cache`;

    mkdir(cacheFolder, { recursive: true });

    const deleteSync = (key, { prefix } = {}) => {
        const filename = getFilename(key, prefix, { folder: cacheFolder });

        return new Promise((resolve, reject) => {
            unlink(filename, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    };

    const readSync = (key, { prefix = '', throwOnError = true } = {}) => {
        const filename = getFilename(key, prefix, { folder: cacheFolder });

        try {
            if (!existsSync(filename))
                return cacheModelFactory({ expired: true }, undefined, {
                    expire: 0,
                });
            return JSON.parse(readFileSync(filename));
        } catch (error) {
            if (throwOnError) throw error;

            return cacheModelFactory({ expired: true }, undefined, {
                expire: 0,
            });
        }
    };

    const writeSync = (
        key,
        content,
        args,
        {
            prefix = '',
            instanceExpiresAtValue,
            expiresAtValue,
            throwOnError = false,
        } = {},
    ) => {
        const filename = getFilename(key, prefix, { folder: cacheFolder });

        const expire =
            Date.now() + (instanceExpiresAtValue || expiresAtValue) * 1000;

        const data = cacheModelFactory(content, args, { expire });
        try {
            writeFileSync(filename, JSON.stringify(data, null, 2));
        } catch (error) {
            if (throwOnError) throw error;
        }
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
