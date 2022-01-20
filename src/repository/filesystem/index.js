const { readFile, writeFile, mkdirSync: mkdir, unlink } = require('fs');
const { getFilename } = require('./getFilename');
const { cacheModelFactory } = require('../cacheModelFactory');

module.exports = ({ folder } = {}) => {
    if (folder === undefined) {
        // eslint-disable-next-line no-param-reassign
        folder = `${__dirname}/.cache`;
    }

    mkdir(folder, { recursive: true });

    return {
        delete: (key, { prefix } = {}) => {
            const filename = getFilename(key, prefix, { folder });

            return new Promise((resolve, reject) => {
                unlink(filename, (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        },

        read: (key, { prefix = '', throwOnError = true } = {}) => {
            const filename = getFilename(key, prefix, { folder });

            return new Promise((resolve, reject) => {
                readFile(filename, (errRead, cached) => {
                    if (throwOnError && errRead) reject(errRead);
                    else if (errRead)
                        resolve(
                            cacheModelFactory({ expired: true }, undefined, {
                                expire: 0,
                            })
                        );
                    else resolve(JSON.parse(cached));
                });
            });
        },

        write: (
            key,
            content,
            args,
            {
                prefix = '',
                instanceExpiresAtValue,
                expiresAtValue,
                throwOnError = false,
            } = {}
        ) => {
            const filename = getFilename(key, prefix, { folder });

            const expire =
                Date.now() + (instanceExpiresAtValue || expiresAtValue) * 1000;

            const data = cacheModelFactory(content, args, { expire });

            return new Promise((resolve, reject) => {
                writeFile(filename, JSON.stringify(data, null, 2), (err) => {
                    if (err && throwOnError) reject(err);
                    else resolve();
                });
            });
        },
    };
};
