import {
  type UKAddress,
  type DeliveryTier,
  formatGBP
} from "@san-furniture/types";

export interface OrderItemDispatch {
  sku: string;
  supplierSku: string;
  title: string;
  quantity: number;
  costPricePennies: number;
}

export interface PurchaseOrderRequest {
  orderId: string;
  poNumber: string;
  supplierId: string;
  customerDeliveryAddress: UKAddress;
  deliveryTier: DeliveryTier;
  specialInstructions?: string;
  items: OrderItemDispatch[];
  createdAt: string;
}

export interface PurchaseOrderRecord {
  poNumber: string;
  orderId: string;
  supplierId: string;
  status: "dispatched" | "acknowledged" | "shipped" | "failed";
  trackingNumber?: string;
  courierName?: string;
  trackingUrl?: string;
  dispatchedAt: string;
  shippedAt?: string;
}

export interface SupplierTrackingPayload {
  supplierId: string;
  poNumber: string;
  orderId: string;
  courierName: string;
  trackingNumber: string;
  trackingUrl?: string;
  dispatchedAt: string;
}

export class OrderFulfillmentDispatcher {
  private poRegistry = new Map<string, PurchaseOrderRecord>();

  /**
   * Generate and dispatch a Purchase Order payload to a UK dropship supplier
   */
  public generatePurchaseOrder(req: PurchaseOrderRequest): PurchaseOrderRecord {
    const poRecord: PurchaseOrderRecord = {
      poNumber: req.poNumber,
      orderId: req.orderId,
      supplierId: req.supplierId,
      status: "dispatched",
      dispatchedAt: new Date().toISOString()
    };

    this.poRegistry.set(req.poNumber, poRecord);

    console.log(
      `[PO Dispatch] Dispatched ${req.poNumber} to supplier ${req.supplierId} for order ${req.orderId} (${req.items.length} items, Tier: ${req.deliveryTier})`
    );

    return poRecord;
  }

  /**
   * Ingest tracking number from supplier webhook or API callback
   */
  public ingestSupplierTracking(payload: SupplierTrackingPayload): PurchaseOrderRecord {
    const record = this.poRegistry.get(payload.poNumber);
    if (!record) {
      // Auto-register if not previously recorded in memory
      const newRecord: PurchaseOrderRecord = {
        poNumber: payload.poNumber,
        orderId: payload.orderId,
        supplierId: payload.supplierId,
        status: "shipped",
        trackingNumber: payload.trackingNumber,
        courierName: payload.courierName,
        trackingUrl: payload.trackingUrl || `https://track.courier.co.uk/${payload.trackingNumber}`,
        dispatchedAt: payload.dispatchedAt,
        shippedAt: new Date().toISOString()
      };
      this.poRegistry.set(payload.poNumber, newRecord);
      return newRecord;
    }

    record.status = "shipped";
    record.trackingNumber = payload.trackingNumber;
    record.courierName = payload.courierName;
    record.trackingUrl = payload.trackingUrl || `https://track.courier.co.uk/${payload.trackingNumber}`;
    record.shippedAt = new Date().toISOString();

    console.log(
      `[PO Tracking] Received tracking for ${payload.poNumber}: ${payload.courierName} #${payload.trackingNumber}`
    );

    return record;
  }

  /**
   * Retrieve PO record by PO number
   */
  public getPurchaseOrder(poNumber: string): PurchaseOrderRecord | undefined {
    return this.poRegistry.get(poNumber);
  }
}
