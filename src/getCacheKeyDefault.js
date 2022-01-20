const { hash } = require('./utils/hash');

const uniqueFN = new Set();

function getCacheKeyDefault(fn, args) {
    const fnKey =
        uniqueFN[fn] ||
        ((f) => {
            uniqueFN[f] = f.toString();
            return uniqueFN[f];
        })(fn);

    return hash(
        [fnKey, ...args]
            .map((p) => JSON.stringify(p))
            .map((str) => str)
            .map(hash)
            // .map(String)
            // .map((str) =>
            //   str
            //     .split("")
            //     .map((c) => c.charCodeAt(0).toString(16))
            //     .slice(-32)
            //     .join("")
            // )
            .join('_')
    );
}

exports.getCacheKeyDefault = getCacheKeyDefault;
