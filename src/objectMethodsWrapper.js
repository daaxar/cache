// TODO: Can i do a best effort here?
const objectMethodsWrapper = (fn, wrapper, factoryOptions, instanceOptions) => {
    Object.keys(fn)
        .filter((key) => typeof fn[key] === 'function')
        .forEach((key) => {
            // eslint-disable-next-line no-param-reassign
            fn[key] = wrapper(fn[key], factoryOptions, {
                ...instanceOptions,
                prefix: `${instanceOptions.prefix || ''}-${key}`,
            });
        });
};

exports.objectMethodsWrapper = objectMethodsWrapper;
