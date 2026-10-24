export class PerformanceCacheManager {
    cache = new Map();
    hits = 0;
    misses = 0;
    /**
     * Get cached item or execute fetcher and store with TTL
     */
    async getOrSet(key, fetcher, ttlSeconds = 3600) {
        const now = Date.now();
        const entry = this.cache.get(key);
        if (entry && now - entry.cachedAt < entry.ttlMs) {
            this.hits++;
            return { data: entry.data, fromCache: true };
        }
        this.misses++;
        const freshData = await fetcher();
        this.cache.set(key, {
            data: freshData,
            cachedAt: now,
            ttlMs: ttlSeconds * 1000,
        });
        return { data: freshData, fromCache: false };
    }
    /**
     * Invalidate specific key
     */
    invalidateKey(key) {
        return this.cache.delete(key);
    }
    /**
     * Invalidate by prefix / pattern
     */
    invalidatePattern(prefix) {
        let count = 0;
        for (const key of this.cache.keys()) {
            if (key.startsWith(prefix)) {
                this.cache.delete(key);
                count++;
            }
        }
        return count;
    }
    /**
     * Read cache performance telemetry
     */
    getMetrics() {
        const totalRequests = this.hits + this.misses;
        const hitRatioPercent = totalRequests > 0 ? Number(((this.hits / totalRequests) * 100).toFixed(1)) : 0;
        return {
            hits: this.hits,
            misses: this.misses,
            hitRatioPercent,
            keysCount: this.cache.size,
        };
    }
    clear() {
        this.cache.clear();
        this.hits = 0;
        this.misses = 0;
    }
}
