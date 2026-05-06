function stableStringify(value) {
    const seen = new WeakSet();

    function stringify(part) {
        if (typeof part === 'undefined') return { $type: 'undefined' };
        if (typeof part === 'bigint')
            return { $type: 'bigint', value: String(part) };
        if (typeof part === 'function') {
            return { $type: 'function', value: part.name || part.toString() };
        }
        if (typeof part === 'symbol') {
            return { $type: 'symbol', value: String(part.description ?? part) };
        }
        if (part === null || typeof part !== 'object') return part;

        if (seen.has(part)) {
            throw new TypeError('Cache key arguments must be serializable');
        }

        seen.add(part);

        if (Array.isArray(part)) return part.map(stringify);
        if (part instanceof Date)
            return { $type: 'date', value: part.toISOString() };

        return Object.keys(part)
            .sort()
            .reduce((acc, key) => {
                acc[key] = stringify(part[key]);
                return acc;
            }, {});
    }

    return JSON.stringify(stringify(value));
}

exports.stableStringify = stableStringify;
