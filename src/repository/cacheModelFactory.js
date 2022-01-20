function cacheModelFactory(content, args, { expire }) {
    return {
        expire,
        expireDate: new Date(expire).toISOString(),
        args,
        data: content,
    };
}
exports.cacheModelFactory = cacheModelFactory;
