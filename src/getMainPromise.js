const fs = require('fs');

function getMainPromise(
    prefix,
    key,
    fn,
    throwOnError,
    args,
    instanceExpiresAtValue,
    expiresAtValue,
) {
    const folder = `${__dirname}/.cache`;
    const filename = `${folder}/${prefix || ''}${key}.json`;

    const promise = new Promise((resolve, reject) => {
        try {
            fs.readFile(filename, (errRead, cached) => {
                if (!errRead) {
                    try {
                        const json = JSON.parse(cached);
                        if (json && (json.expire > Date.now() || !fn)) {
                            return resolve(json.data);
                        }
                    } catch (error) {
                        if (throwOnError) return reject(error);
                    }
                }
                if (!fn) return resolve({ expired: true });

                return fn(...args)
                    .then((content) => {
                        const jsonExpire =
                            Date.now() +
                            (instanceExpiresAtValue || expiresAtValue) * 1000;
                        const json = {
                            expire: jsonExpire,
                            expireDate: new Date(jsonExpire).toISOString(),
                            args,
                            data: content,
                        };

                        resolve(content);
                        try {
                            fs.writeFile(
                                filename,
                                JSON.stringify(json, null, 2),
                                (errWrite) => {
                                    if (throwOnError) reject(errWrite);
                                },
                            );
                        } catch (writeError) {
                            if (throwOnError) reject(writeError);
                        }
                    })
                    .catch((errFn) => reject(errFn));
            });
        } catch (error) {
            return reject(error);
        }

        return null;
    });
    return promise;
}

exports.getMainPromise = getMainPromise;
