import test from "node:test";
import assert from "node:assert/strict";

import { QueryOptimizerService } from "../dist/src/modules/performance/services/query-optimizer.js";
import { PerformanceCacheManager } from "../dist/src/modules/performance/services/cache-manager.js";

test("QueryOptimizerService: Computes MySQL InnoDB tuning recommendations", () => {
  const optimizer = new QueryOptimizerService();

  const config8Gb = optimizer.generateMySqlTuning(8);
  assert.equal(config8Gb.innodbBufferPoolSize, "5734MB");
  assert.equal(config8Gb.innodbLogBufferSize, "64MB");
  assert.equal(config8Gb.maxConnections, 100);

  const config16Gb = optimizer.generateMySqlTuning(16);
  assert.equal(config16Gb.innodbBufferPoolSize, "11469MB");
});

test("QueryOptimizerService: Verifies MySQL indexes and Meilisearch fuzzy search", () => {
  const optimizer = new QueryOptimizerService();

  const catalogCheck = optimizer.verifyQueryIndexCompatibility(
    "SELECT * FROM products WHERE category_id = ? AND status = ? AND price_pennies BETWEEN ? AND ?"
  );
  assert.equal(catalogCheck.compatible, true);
  assert.equal(catalogCheck.recommendedIndex, "idx_prod_cat_status_price");

  const fuzzyCheck = optimizer.verifyQueryIndexCompatibility(
    "SELECT * FROM product WHERE title LIKE '%boucle%'"
  );
  assert.equal(fuzzyCheck.compatible, true);
  assert.equal(fuzzyCheck.recommendedIndex, "Meilisearch");

  const statusOnlyCheck = optimizer.verifyQueryIndexCompatibility(
    "SELECT id, handle FROM product WHERE status = 'published'"
  );
  assert.equal(statusOnlyCheck.compatible, false);
  assert.equal(statusOnlyCheck.recommendedIndex, "idx_products_status");
});

test("PerformanceCacheManager: Evaluates cache hits, misses, TTL, and pattern invalidation", async () => {
  const cache = new PerformanceCacheManager();
  let fetchCount = 0;

  const fetcher = async () => {
    fetchCount++;
    return { items: ["sofa_1", "sofa_2"] };
  };

  // 1. Initial call: Miss
  const first = await cache.getOrSet("catalog:sofas:all", fetcher, 60);
  assert.equal(first.fromCache, false);
  assert.equal(first.data.items.length, 2);
  assert.equal(fetchCount, 1);

  // 2. Second call: Hit
  const second = await cache.getOrSet("catalog:sofas:all", fetcher, 60);
  assert.equal(second.fromCache, true);
  assert.equal(second.data.items.length, 2);
  assert.equal(fetchCount, 1); // Fetcher was NOT called again

  // 3. Telemetry check
  const metrics = cache.getMetrics();
  assert.equal(metrics.hits, 1);
  assert.equal(metrics.misses, 1);
  assert.equal(metrics.hitRatioPercent, 50.0);

  // 4. Pattern invalidation
  const invalidatedCount = cache.invalidatePattern("catalog:sofas");
  assert.equal(invalidatedCount, 1);

  // 5. Subsequent call after invalidation: Miss again
  const third = await cache.getOrSet("catalog:sofas:all", fetcher, 60);
  assert.equal(third.fromCache, false);
  assert.equal(fetchCount, 2);
});
