const { hash } = require('../../src/utils/hash');

describe('hash', () => {
    it('should return same hash for same input', () => {
        expect(hash('hello')).toBe(hash('hello'));
    });

    it('should return different hashes for different input', () => {
        expect(hash('a')).not.toBe(hash('b'));
    });
});
