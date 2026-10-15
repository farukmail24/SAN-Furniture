import test from "node:test";
import assert from "node:assert/strict";

import { QueryOptimizerService } from "../dist/src/modules/performance/services/query-optimizer.js";
import { PerformanceCacheManager } from "../dist/src/modules/performance/services/cache-manager.js";

test("QueryOptimizerService: Computes PostgreSQL NVMe production tuning parameters", () => {
  const optimizer = new QueryOptimizerService();

  const config8Gb = optimizer.generatePostgresTuning(8);
  assert.equal(config8Gb.sharedBuffers, "2048MB"); // 25%
  assert.equal(config8Gb.effectiveCacheSize, "6144MB"); // 75%
  assert.equal(config8Gb.randomPageCost, 1.1); // Fast SSD cost
  assert.equal(config8Gb.checkpointCompletionTarget, 0.9);
  assert.equal(config8Gb.effectiveIoConcurrency, 200);

  const config16Gb = optimizer.generatePostgresTuning(16);
  assert.equal(config16Gb.sharedBuffers, "4096MB");
  assert.equal(config16Gb.effectiveCacheSize, "12288MB");
});

test("QueryOptimizerService: Verifies ESR and GIN Trigram index matching", () => {
  const optimizer = new QueryOptimizerService();

  // ESR query
  const esrCheck = optimizer.verifyQueryIndexCompatibility(
    "SELECT * FROM product WHERE category_id = 'cat_sofas' AND status = 'published' AND price BETWEEN 50000 AND 150000"
  );
  assert.equal(esrCheck.compatible, true);
  assert.equal(esrCheck.recommendedIndex, "idx_products_cat_status_created_price");

  // Fuzzy Search query
  const trgmCheck = optimizer.verifyQueryIndexCompatibility(
    "SELECT * FROM product WHERE title LIKE '%boucle%'"
  );
  assert.equal(trgmCheck.compatible, true);
  assert.equal(trgmCheck.recommendedIndex, "idx_product_title_trgm");

  // Partial Index active products query
  const partialCheck = optimizer.verifyQueryIndexCompatibility(
    "SELECT id, handle FROM product WHERE status = 'published'"
  );
  assert.equal(partialCheck.compatible, true);
  assert.equal(partialCheck.recommendedIndex, "idx_published_furniture");
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
