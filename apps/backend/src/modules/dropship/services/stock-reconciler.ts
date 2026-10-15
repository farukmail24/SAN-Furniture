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

export class StockReconciliationEngine {
  private marginGuard: MarginGuardService;

  constructor(marginGuard?: MarginGuardService) {
    this.marginGuard = marginGuard || new MarginGuardService();
  }

  /**
   * Reconcile a batch of supplier feed items against current store product records
   */
  public reconcileBatch(
    supplierId: string,
    feedItems: SupplierFeedItem[],
    catalogMap: Map<string, ExistingProductState>
  ): ReconciliationReport {
    const actions: ProductUpdateAction[] = [];
    const alerts: MarginAlert[] = [];
    let pricesUpdated = 0;
    let stockUpdated = 0;
    let unpublishedCount = 0;
    let restoredCount = 0;
    let discontinuedCount = 0;

    for (const item of feedItems) {
      const existing = catalogMap.get(item.supplier_sku);
      if (!existing) {
        // New SKU not yet mapped to catalog
        continue;
      }

      const { pricing, alert, recommendedRetailGrossPennies } = this.marginGuard.evaluatePrice(
        item.cost_price_pennies,
        item.carriage_cost_pennies,
        existing.currentPricePennies
      );

      if (alert) {
        alert.supplier_id = supplierId;
        alert.supplier_sku = item.supplier_sku;
        alert.product_id = existing.id;
        alerts.push(alert);
      }

      // Check stock and status transitions
      if (item.discontinued) {
        actions.push({
          productId: existing.id,
          sku: item.supplier_sku,
          action: "discontinue",
          newStatus: "archived"
        });
        discontinuedCount++;
        continue;
      }

      // 1. Out of stock trigger
      if (item.stock_level === 0 && existing.currentStatus === "published") {
        actions.push({
          productId: existing.id,
          sku: item.supplier_sku,
          action: "unpublish_stock",
          oldStock: existing.currentStock,
          newStock: 0,
          newStatus: "out_of_stock"
        });
        unpublishedCount++;
      }
      // 2. Restock trigger
      else if (item.stock_level > 0 && existing.currentStatus === "out_of_stock") {
        actions.push({
          productId: existing.id,
          sku: item.supplier_sku,
          action: "restore_stock",
          oldStock: existing.currentStock,
          newStock: item.stock_level,
          newStatus: "published"
        });
        restoredCount++;
      }

      // 3. Price update trigger
      if (recommendedRetailGrossPennies !== existing.currentPricePennies) {
        actions.push({
          productId: existing.id,
          sku: item.supplier_sku,
          action: "price_update",
          oldPricePennies: existing.currentPricePennies,
          newPricePennies: recommendedRetailGrossPennies,
          alert
        });
        pricesUpdated++;
      }

      if (item.stock_level !== existing.currentStock) {
        stockUpdated++;
      }
    }

    return {
      supplierId,
      totalProcessed: feedItems.length,
      pricesUpdated,
      stockUpdated,
      unpublishedCount,
      restoredCount,
      discontinuedCount,
      alertsTriggered: alerts,
      actions,
      reconciledAt: new Date().toISOString()
    };
  }
}
