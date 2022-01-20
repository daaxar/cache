function getFilename(key, prefix, options) {
    const folder = options.folder || './.cache';
    const filename = `${folder}/${prefix || ''}${key}.json`;
    return filename;
}
exports.getFilename = getFilename;
