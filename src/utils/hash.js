const crypto = require('crypto');

const hash = (someString) =>
    crypto.createHash('md5').update(someString).digest('hex');

exports.hash = hash;
