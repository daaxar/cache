const {
    mkdirSync: mkdir,
    rmSync,
    writeFileSync,
    readFileSync,
    existsSync,
    unlinkSync,
} = require('fs');
const path = require('path');
const { getFilename } = require('./getFilename');
const { cacheModelFactory } = require('../cacheModelFactory');
const { jsonSerializer } = require('../../utils/jsonSerializer');

function resolveNamespace({ namespace, prefix } = {}) {
    return namespace ?? prefix ?? 'default';
}

module.exports = ({ folder, serializer = jsonSerializer } = {}) => {
    const cacheFolder = folder ?? path.join(process.cwd(), '.daaxar-cache');

    mkdir(cacheFolder, { recursive: true });

    const deleteSync = (key, options = {}) => {
        const filename = getFilename(key, resolveNamespace(options), {
            folder: cacheFolder,
        });

        if (existsSync(filename)) unlinkSync(filename);
    };

    const hasSync = (key, options = {}) => {
        const cached = readSync(key, options);

        return Boolean(cached && cached.expire > Date.now());
    };

    const clearSync = (options = {}) => {
        const namespace = resolveNamespace(options);
        const filename = getFilename('__namespace_marker__', namespace, {
            folder: cacheFolder,
        });
        const namespaceFolder = path.dirname(filename);

        rmSync(namespaceFolder, { recursive: true, force: true });
    };

    const readSync = (key, options = {}) => {
        const filename = getFilename(key, resolveNamespace(options), {
            folder: cacheFolder,
        });
        const { throwOnError = true } = options;

        try {
            if (!existsSync(filename))
                return cacheModelFactory({ expired: true }, undefined, {
                    expire: 0,
                });
            return serializer.deserialize(readFileSync(filename, 'utf8'));
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
            namespace,
            prefix,
            instanceExpiresAtValue,
            expiresAtValue,
            throwOnError = false,
        } = {},
    ) => {
        const filename = getFilename(
            key,
            resolveNamespace({ namespace, prefix }),
            {
                folder: cacheFolder,
            },
        );
        const ttl = instanceExpiresAtValue ?? expiresAtValue ?? 0;

        const expire = Date.now() + ttl * 1000;

        const data = cacheModelFactory(content, args, { expire, ttl });
        try {
            mkdir(path.dirname(filename), { recursive: true });
            writeFileSync(filename, serializer.serialize(data));
        } catch (error) {
            if (throwOnError) throw error;
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
