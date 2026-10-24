import { type UKAddress, type DeliveryTier } from "@san-furniture/types";
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
export declare class OrderFulfillmentDispatcher {
    private poRegistry;
    /**
     * Generate and dispatch a Purchase Order payload to a UK dropship supplier
     */
    generatePurchaseOrder(req: PurchaseOrderRequest): PurchaseOrderRecord;
    /**
     * Ingest tracking number from supplier webhook or API callback
     */
    ingestSupplierTracking(payload: SupplierTrackingPayload): PurchaseOrderRecord;
    /**
     * Retrieve PO record by PO number
     */
    getPurchaseOrder(poNumber: string): PurchaseOrderRecord | undefined;
}
