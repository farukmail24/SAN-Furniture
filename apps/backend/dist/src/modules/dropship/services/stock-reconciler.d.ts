import { type SupplierFeedItem, type MarginAlert } from "@san-furniture/types";
import { MarginGuardService } from "./margin-guard.js";
export interface ExistingProductState {
    id: string;
    sku: string;
    currentStatus: "published" | "draft" | "out_of_stock" | "archived";
    currentPricePennies: number;
    currentStock: number;
}
export interface ProductUpdateAction {
    productId: string;
    sku: string;
    action: "price_update" | "unpublish_stock" | "restore_stock" | "discontinue" | "no_change";
    oldPricePennies?: number;
    newPricePennies?: number;
    oldStock?: number;
    newStock?: number;
    newStatus?: "published" | "draft" | "out_of_stock" | "archived";
    alert?: MarginAlert;
}
export interface ReconciliationReport {
    supplierId: string;
    totalProcessed: number;
    pricesUpdated: number;
    stockUpdated: number;
    unpublishedCount: number;
    restoredCount: number;
    discontinuedCount: number;
    alertsTriggered: MarginAlert[];
    actions: ProductUpdateAction[];
    reconciledAt: string;
}
export declare class StockReconciliationEngine {
    private marginGuard;
    constructor(marginGuard?: MarginGuardService);
    /**
     * Reconcile a batch of supplier feed items against current store product records
     */
    reconcileBatch(supplierId: string, feedItems: SupplierFeedItem[], catalogMap: Map<string, ExistingProductState>): ReconciliationReport;
}
