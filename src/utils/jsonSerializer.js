const jsonSerializer = {
    serialize(value) {
        return JSON.stringify(value, null, 2);
    },
    deserialize(value) {
        return JSON.parse(value);
    },
};

exports.jsonSerializer = jsonSerializer;
