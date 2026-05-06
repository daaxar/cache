function cacheModelFactory(content, args, { expire, ttl }) {
    return {
        expire,
        expireDate: new Date(expire).toISOString(),
        ttl,
        args,
        data: content,
    };
}
exports.cacheModelFactory = cacheModelFactory;
