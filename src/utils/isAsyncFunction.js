const isAsyncFunction = (fn) =>
    (typeof fn === 'function' && fn.constructor.name === 'AsyncFunction') ||
    (typeof fn === 'object' && fn instanceof Promise);

exports.isAsyncFunction = isAsyncFunction;
