import { Worker } from "bullmq";
import { type ExistingProductState } from "../services/stock-reconciler.js";
export interface SyncJobPayload {
    supplierId: string;
    supplierName: string;
    feedType: "csv" | "json";
    rawFeedContent?: string;
    triggeredBy: "cron" | "manual" | "webhook";
}
export declare function createSupplierSyncWorker(catalogProvider?: () => Promise<Map<string, ExistingProductState>>): Worker;
