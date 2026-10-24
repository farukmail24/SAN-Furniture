export interface CacheEntry<T> {
    data: T;
    cachedAt: number;
    ttlMs: number;
}
export interface CacheMetrics {
    hits: number;
    misses: number;
    hitRatioPercent: number;
    keysCount: number;
}
export declare class PerformanceCacheManager {
    private cache;
    private hits;
    private misses;
    /**
     * Get cached item or execute fetcher and store with TTL
     */
    getOrSet<T>(key: string, fetcher: () => Promise<T>, ttlSeconds?: number): Promise<{
        data: T;
        fromCache: boolean;
    }>;
    /**
     * Invalidate specific key
     */
    invalidateKey(key: string): boolean;
    /**
     * Invalidate by prefix / pattern
     */
    invalidatePattern(prefix: string): number;
    /**
     * Read cache performance telemetry
     */
    getMetrics(): CacheMetrics;
    clear(): void;
}
