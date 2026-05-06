const path = require('path');
const { hash } = require('../../utils/hash');

function sanitizeNamespace(namespace) {
    return String(namespace || 'default').replace(/[^a-zA-Z0-9._-]/g, '_');
}

function getFilename(key, namespace, options = {}) {
    const folder = options.folder || './.cache';
    const namespaceFolder = sanitizeNamespace(namespace);

    return path.join(folder, namespaceFolder, `${hash(String(key))}.json`);
}
exports.getFilename = getFilename;
