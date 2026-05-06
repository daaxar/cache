export type CacheErrorStrategy = 'bypass' | 'throw';

export interface CacheEntry<T = unknown> {
    expire: number;
    expireDate: string;
    ttl?: number;
    args?: unknown[];
    data: T;
}

export interface Serializer<T = unknown> {
    serialize(value: T): string;
    deserialize(value: string): T;
}

export interface Repository {
    read<T = unknown>(
        key: string,
        options?: RepositoryOptions,
    ): Promise<CacheEntry<T>>;
    write<T = unknown>(
        key: string,
        content: T,
        args?: unknown[],
        options?: RepositoryWriteOptions,
    ): Promise<void>;
    delete(key: string, options?: RepositoryOptions): Promise<void>;
    has?(key: string, options?: RepositoryOptions): Promise<boolean>;
    clear?(options?: RepositoryOptions): Promise<void>;
    readSync?<T = unknown>(
        key: string,
        options?: RepositoryOptions,
    ): CacheEntry<T>;
    writeSync?<T = unknown>(
        key: string,
        content: T,
        args?: unknown[],
        options?: RepositoryWriteOptions,
    ): void;
    deleteSync?(key: string, options?: RepositoryOptions): void;
    hasSync?(key: string, options?: RepositoryOptions): boolean;
    clearSync?(options?: RepositoryOptions): void;
}

export interface RepositoryOptions {
    namespace?: string;
    prefix?: string;
    throwOnError?: boolean;
}

export interface RepositoryWriteOptions extends RepositoryOptions {
    instanceExpiresAtValue?: number;
    expiresAtValue?: number;
}

export interface CacheOptions {
    repository?: Repository;
    namespace?: string;
    prefix?: string;
    expiresAt?: number | ((...args: unknown[]) => number);
    throwOnError?: boolean;
    cacheErrorStrategy?: CacheErrorStrategy;
    getCacheKey?: (
        fn: Function,
        args: unknown[],
        options?: {
            namespace?: string;
            serializer?: (value: unknown) => string;
        },
    ) => string;
    keySerializer?: (value: unknown) => string;
}

export interface WrapOptions {
    namespace?: string;
    prefix?: string;
    expiresAt?: number | ((...args: unknown[]) => number);
    mutate?: boolean;
}

export interface CachedFunctionControls {
    namespace: string;
    deleteKey(key: string, options?: RepositoryOptions): Promise<void>;
    deleteFunction(): Promise<void>;
    clear(options?: RepositoryOptions): Promise<void>;
}

export type CachedFunction<T extends (...args: any[]) => any> = T & {
    cache: CachedFunctionControls;
    invalidate(key: string, options?: RepositoryOptions): Promise<void>;
    clear(options?: RepositoryOptions): Promise<void>;
};

export interface CacheDecorator {
    <T extends (...args: any[]) => any>(
        fn: T,
        options?: WrapOptions,
    ): CachedFunction<T>;
    <T extends object>(target: T, options?: WrapOptions): T;
    deleteKey(key: string, options?: RepositoryOptions): Promise<void>;
    deleteFunction(
        cachedFn: CachedFunction<(...args: any[]) => any>,
    ): Promise<void>;
    clear(options?: RepositoryOptions): Promise<void>;
}

export function Cache(options?: CacheOptions): CacheDecorator;

export const repositories: {
    memory(options?: { bucketName?: string }): Repository;
    filesystem(options?: {
        folder?: string;
        serializer?: Serializer;
    }): Repository;
};
