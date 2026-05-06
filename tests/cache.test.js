const fs = require('fs');
const os = require('os');
const path = require('path');

const { Cache, repositories } = require('../src');
const { getCacheKeyDefault } = require('../src/getCacheKeyDefault');

describe('Cache', () => {
    test('caches async results in memory', async () => {
        const repository = repositories.memory({ bucketName: 'async-memory' });
        const cache = Cache({ repository, expiresAt: 60 });
        const fn = jest.fn(async (value) => `value:${value}`);
        const cached = cache(fn, { prefix: 'fn:' });

        await expect(cached('a')).resolves.toBe('value:a');
        await expect(cached('a')).resolves.toBe('value:a');

        expect(fn).toHaveBeenCalledTimes(1);
    });

    test('keeps prefixed async filesystem entries isolated', async () => {
        const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'daaxar-cache-'));
        const repository = repositories.filesystem({ folder });
        const cache = Cache({
            repository,
            expiresAt: 60,
            getCacheKey: () => 'shared-key',
        });
        const firstFn = jest.fn(async () => 'first');
        const secondFn = jest.fn(async () => 'second');

        const first = cache(firstFn, { prefix: 'first:' });
        const second = cache(secondFn, { prefix: 'second:' });

        await expect(first()).resolves.toBe('first');
        await expect(second()).resolves.toBe('second');
        await expect(first()).resolves.toBe('first');
        await expect(second()).resolves.toBe('second');

        expect(firstFn).toHaveBeenCalledTimes(1);
        expect(secondFn).toHaveBeenCalledTimes(1);
        expect(fs.readdirSync(folder).sort()).toEqual(['first_', 'second_']);
    });

    test('caches falsy synchronous values', () => {
        const repository = repositories.memory({ bucketName: 'falsy-sync' });
        const cache = Cache({ repository, expiresAt: 60 });
        const fn = jest.fn(() => false);
        const cached = cache(fn);

        expect(cached()).toBe(false);
        expect(cached()).toBe(false);
        expect(fn).toHaveBeenCalledTimes(1);
    });

    test('wraps object methods without mutating by default or losing context', () => {
        const repository = repositories.memory({
            bucketName: 'object-methods',
        });
        const cache = Cache({ repository, expiresAt: 60 });
        const multiply = jest.fn(function multiply(value) {
            return value * this.factor;
        });
        const service = {
            factor: 3,
            multiply,
        };

        const cachedService = cache(service, { namespace: 'service' });

        expect(cachedService).not.toBe(service);
        expect(cachedService.multiply(4)).toBe(12);
        expect(cachedService.multiply(4)).toBe(12);
        expect(multiply).toHaveBeenCalledTimes(1);
    });

    test('can explicitly mutate object methods', () => {
        const repository = repositories.memory({
            bucketName: 'object-methods-mutate',
        });
        const cache = Cache({ repository, expiresAt: 60 });
        const service = {
            value: 5,
            getValue: function getValue() {
                return this.value;
            },
        };

        const cachedService = cache(service, {
            namespace: 'mutating-service',
            mutate: true,
        });

        expect(cachedService).toBe(service);
        expect(service.getValue()).toBe(5);
        expect(service.getValue()).toBe(5);
        expect(cachedService.getValue.name).toBe('cached_getValue');
    });

    test('default key generation accepts undefined arguments', () => {
        const fn = (value) => value;

        expect(() => getCacheKeyDefault(fn, [undefined])).not.toThrow();
        expect(getCacheKeyDefault(fn, [undefined])).toBe(
            getCacheKeyDefault(fn, [undefined]),
        );
    });

    test('default key generation accepts missing functions', () => {
        expect(() => getCacheKeyDefault(undefined, ['key'])).not.toThrow();
    });

    test('rejects circular arguments during default key generation', () => {
        const circular = {};
        circular.self = circular;

        expect(() => getCacheKeyDefault(() => undefined, [circular])).toThrow(
            /Unable to generate cache key/,
        );
    });

    test('supports functions that return promises without being async', async () => {
        const repository = repositories.memory({
            bucketName: 'promise-returning',
        });
        const cache = Cache({ repository, expiresAt: 60 });
        const fn = jest.fn((value) => Promise.resolve(`promise:${value}`));
        const cached = cache(fn, { namespace: 'promise' });

        await expect(cached('a')).resolves.toBe('promise:a');
        await expect(cached('a')).resolves.toBe('promise:a');
        expect(fn).toHaveBeenCalledTimes(1);
    });

    test('single-flights concurrent calls for the same key', async () => {
        const repository = repositories.memory({ bucketName: 'single-flight' });
        const cache = Cache({ repository, expiresAt: 60 });
        let resolve;
        const deferred = new Promise((done) => {
            resolve = done;
        });
        const fn = jest.fn(() => deferred.then(() => 'done'));
        const cached = cache(fn, { namespace: 'flight' });

        const first = cached('a');
        const second = cached('a');
        resolve();

        await expect(Promise.all([first, second])).resolves.toEqual([
            'done',
            'done',
        ]);
        expect(fn).toHaveBeenCalledTimes(1);
    });

    test('expires entries using per-entry ttl', async () => {
        const repository = repositories.memory({ bucketName: 'ttl' });
        const cache = Cache({ repository, expiresAt: 0.001 });
        const fn = jest.fn(() => 'fresh');
        const cached = cache(fn, { namespace: 'ttl' });

        expect(cached()).toBe('fresh');
        await new Promise((resolve) => setTimeout(resolve, 5));
        expect(cached()).toBe('fresh');
        expect(fn).toHaveBeenCalledTimes(2);
    });

    test('manually invalidates by key, function, and namespace', async () => {
        const repository = repositories.memory({ bucketName: 'manual' });
        const cache = Cache({
            repository,
            expiresAt: 60,
            getCacheKey: (_fn, args) => args[0],
        });
        const fn = jest.fn((value) => `value:${value}:${fn.mock.calls.length}`);
        const cached = cache(fn, { namespace: 'manual' });

        expect(cached('a')).toBe('value:a:1');
        await cached.cache.deleteKey('a');
        expect(cached('a')).toBe('value:a:2');
        await cached.cache.deleteFunction();
        expect(cached('a')).toBe('value:a:3');
        await cache.clear({ namespace: 'manual' });
        expect(cached('a')).toBe('value:a:4');
    });

    test('recreates missing filesystem folders before writing', async () => {
        const folder = fs.mkdtempSync(
            path.join(os.tmpdir(), 'daaxar-cache-missing-'),
        );
        const repository = repositories.filesystem({ folder });
        fs.rmSync(folder, { recursive: true, force: true });
        const cache = Cache({ repository, expiresAt: 60 });
        const cached = cache(() => 'created', { namespace: 'missing-folder' });

        expect(cached()).toBe('created');
        expect(fs.existsSync(folder)).toBe(true);
    });

    test('supports configurable filesystem serializers', () => {
        const folder = fs.mkdtempSync(
            path.join(os.tmpdir(), 'daaxar-cache-serializer-'),
        );
        const serializer = {
            serialize: jest.fn((value) => JSON.stringify({ envelope: value })),
            deserialize: jest.fn((value) => JSON.parse(value).envelope),
        };
        const repository = repositories.filesystem({ folder, serializer });
        const cache = Cache({ repository, expiresAt: 60 });
        const fn = jest.fn(() => ({ ok: true }));
        const cached = cache(fn, { namespace: 'serializer' });

        expect(cached()).toEqual({ ok: true });
        expect(cached()).toEqual({ ok: true });
        expect(serializer.serialize).toHaveBeenCalled();
        expect(serializer.deserialize).toHaveBeenCalled();
        expect(fn).toHaveBeenCalledTimes(1);
    });

    test('can bypass repository errors and execute the wrapped function', async () => {
        const repository = {
            read: jest.fn(async () => {
                throw new Error('readonly');
            }),
            write: jest.fn(async () => {
                throw new Error('readonly');
            }),
        };
        const cache = Cache({
            repository,
            expiresAt: 60,
            cacheErrorStrategy: 'bypass',
        });
        const fn = jest.fn(async () => 'uncached');
        const cached = cache(fn, { namespace: 'readonly' });

        await expect(cached()).resolves.toBe('uncached');
        expect(fn).toHaveBeenCalledTimes(1);
    });
});
