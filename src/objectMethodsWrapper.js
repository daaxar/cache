const objectMethodsWrapper = (
    source,
    wrapper,
    factoryOptions,
    instanceOptions,
) => {
    const target = instanceOptions.mutate === true ? source : { ...source };
    const baseNamespace =
        instanceOptions.namespace ?? instanceOptions.prefix ?? 'default';

    Object.keys(source)
        .filter((key) => typeof source[key] === 'function')
        .forEach((key) => {
            target[key] = wrapper(source[key], factoryOptions, {
                ...instanceOptions,
                namespace: `${baseNamespace}.${key}`,
            });
        });

    return target;
};

exports.objectMethodsWrapper = objectMethodsWrapper;
