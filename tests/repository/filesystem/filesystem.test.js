const fsRepo = require('../../../src/repository/filesystem');
const fs = require('fs');
const path = require('path');

describe('filesystem repository', () => {
    const cachePath = path.resolve(__dirname, '.test-cache');
    const repo = fsRepo({ folder: cachePath });

    afterAll(() => {
        fs.rmSync(cachePath, { recursive: true, force: true });
    });

    it('should write and read from disk', async () => {
        await repo.write('key', 'data', [], { expiresAtValue: 5 });
        const cached = await repo.read('key');
        expect(cached.data).toBe('data');
    });

    it('should return expired cache for unknown key', async () => {
        const cached = await repo.read('unknown');
        expect(cached.expire).toBe(0);
    });
});
