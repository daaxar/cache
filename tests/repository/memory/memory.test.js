const memory = require('../../../src/repository/memory');

describe('memory repository', () => {
    const repo = memory();

    it('should write and read cached value', async () => {
        await repo.write('key', 'value', [], { expiresAtValue: 5 });
        const cached = await repo.read('key');
        expect(cached.data).toBe('value');
    });

    it('should return expired object for unknown key', async () => {
        const cached = await repo.read('unknown');
        expect(cached.expire).toBe(0);
        expect(cached.data.expired).toBeTruthy();
    });
});
