const { getCacheKeyDefault } = require('../src/getCacheKeyDefault');

describe('getCacheKeyDefault', () => {
    it('should return a consistent hash for same function + args', () => {
        const fn = (a) => a;
        const key1 = getCacheKeyDefault(fn, [1, 2]);
        const key2 = getCacheKeyDefault(fn, [1, 2]);
        expect(key1).toBe(key2);
    });

    it('should return different hashes for different args', () => {
        const fn = (a) => a;
        const key1 = getCacheKeyDefault(fn, [1, 2]);
        const key2 = getCacheKeyDefault(fn, [3, 4]);
        expect(key1).not.toBe(key2);
    });
});
