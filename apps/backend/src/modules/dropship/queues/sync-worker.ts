import { Worker, type Job } from "bullmq";
import { SUPPLIER_SYNC_QUEUE_NAME, getRedisConnectionOptions } from "./supplier-queue.js";
import { StockReconciliationEngine, type ExistingProductState } from "../services/stock-reconciler.js";
import { CsvSupplierAdapter } from "../adapters/csv-supplier-adapter.js";

export interface SyncJobPayload {
  supplierId: string;
  supplierName: string;
  feedType: "csv" | "json";
  rawFeedContent?: string;
  triggeredBy: "cron" | "manual" | "webhook";
}

export function createSupplierSyncWorker(
  catalogProvider?: () => Promise<Map<string, ExistingProductState>>
): Worker {
  const reconciler = new StockReconciliationEngine();

  const worker = new Worker(
    SUPPLIER_SYNC_QUEUE_NAME,
    async (job: Job<SyncJobPayload>) => {
      console.log(`[Worker] Starting job ${job.id} for supplier: ${job.data.supplierId || "default"}`);

      if (!job.data.rawFeedContent) {
        return { success: true, message: "No feed payload supplied to job, skipping." };
      }

      // Default CSV adapter with standard mapping
      const adapter = new CsvSupplierAdapter(
        job.data.supplierId,
        job.data.supplierName,
        {
          sku: "sku",
          title: "title",
          costPrice: "cost_price",
          carriageCost: "carriage_cost",
          stockLevel: "stock_level",
          leadTimeDays: "lead_time_days"
        }
      );

      const parsed = await adapter.parse(job.data.rawFeedContent);
      console.log(`[Worker] Parsed ${parsed.items.length} items from supplier ${job.data.supplierId}`);

      const catalogMap = catalogProvider
        ? await catalogProvider()
        : new Map<string, ExistingProductState>();

      const report = reconciler.reconcileBatch(job.data.supplierId, parsed.items, catalogMap);

      console.log(`[Worker] Reconciliation complete: ${report.pricesUpdated} prices updated, ${report.unpublishedCount} unpublished.`);
      return report;
    },
    {
      connection: getRedisConnectionOptions(),
      concurrency: 5
    }
  );

  worker.on("failed", (job, err) => {
    console.error(`[Worker] Job ${job?.id} failed with error:`, err.message);
  });

  return worker;
}
