const { Cache } = require('../src/cache');

describe('Cache', () => {
    it('should return a function when wrapping', () => {
        const cache = Cache();
        const fn = () => 1;
        const wrapped = cache(fn);
        expect(typeof wrapped).toBe('function');
    });

    it('should cache sync results', () => {
        const cache = Cache({
            repository: require('../src/repository').memory(),
        });
        const fn = jest.fn((x) => x + 1);
        const wrapped = cache(fn);

        expect(wrapped(1)).toBe(2);
        expect(wrapped(1)).toBe(2);
        expect(fn).toHaveBeenCalledTimes(1); // cached
    });

    it('should cache async results', async () => {
        const cache = Cache({
            repository: require('../src/repository').memory(),
        });
        const fn = jest.fn(async (x) => x * 2);
        const wrapped = cache(fn);

        expect(await wrapped(5)).toBe(10);
        expect(await wrapped(5)).toBe(10);
        expect(fn).toHaveBeenCalledTimes(1); // cached
    });
});
