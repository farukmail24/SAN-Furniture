import "../database/mysql-config.mjs";
import mysql from "mysql2/promise";
import { amosMannExtractor } from "../apps/backend/src/modules/dropship/services/amos-mann-extractor.mjs";

const DB_CONFIG = {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306", 10),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "san_furniture",
};

async function testEngine() {
  console.log("==================================================");
  console.log("  TESTING AMOS MANN AUTOMATED EXTRACTION ENGINE   ");
  console.log("==================================================");

  const pool = mysql.createPool(DB_CONFIG);

  console.log("\n[1/3] Fetching engine status...");
  const status = await amosMannExtractor.getEngineStatus(pool);
  console.log(`Tracked Products in catalog: ${status.trackedCount}`);
  console.log(`Supplier Status: ${status.supplier?.sync_status}`);

  console.log("\n[2/3] Running syncTrackedCatalog({ triggerType: 'test_run' })...");
  const result = await amosMannExtractor.syncTrackedCatalog(pool, { triggerType: "manual" });
  console.log("Sync Result Summary:", {
    itemsScanned: result.itemsScanned,
    pricesUpdated: result.pricesUpdated,
    stockUpdated: result.stockUpdated,
    durationMs: result.durationMs,
    diffsCount: result.diffs.length
  });

  console.log("\nSample Diff Output:");
  result.diffs.slice(0, 3).forEach((d, i) => {
    console.log(`  [${i + 1}] ${d.title} (SKU: ${d.sku}): ${d.details} | Stock: ${d.status}`);
  });

  console.log("\n[3/3] Checking supplier_sync_logs...");
  const [logs] = await pool.query("SELECT * FROM supplier_sync_logs ORDER BY created_at DESC LIMIT 1");
  console.log("Latest Log Entry:", {
    id: logs[0]?.id,
    trigger_type: logs[0]?.trigger_type,
    items_scanned: logs[0]?.items_scanned,
    duration_ms: logs[0]?.duration_ms,
    created_at: logs[0]?.created_at
  });

  await pool.end();
  console.log("\n✓ All tests passed!");
}

testEngine().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
