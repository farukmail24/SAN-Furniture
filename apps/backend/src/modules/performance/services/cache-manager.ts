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

export class PerformanceCacheManager {
  private cache = new Map<string, CacheEntry<any>>();
  private hits = 0;
  private misses = 0;

  /**
   * Get cached item or execute fetcher and store with TTL
   */
  public async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds = 3600
  ): Promise<{ data: T; fromCache: boolean }> {
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
  public invalidateKey(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Invalidate by prefix / pattern
   */
  public invalidatePattern(prefix: string): number {
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
  public getMetrics(): CacheMetrics {
    const totalRequests = this.hits + this.misses;
    const hitRatioPercent = totalRequests > 0 ? Number(((this.hits / totalRequests) * 100).toFixed(1)) : 0;

    return {
      hits: this.hits,
      misses: this.misses,
      hitRatioPercent,
      keysCount: this.cache.size,
    };
  }

  public clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }
}
