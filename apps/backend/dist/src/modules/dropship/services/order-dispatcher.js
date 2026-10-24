export class OrderFulfillmentDispatcher {
    poRegistry = new Map();
    /**
     * Generate and dispatch a Purchase Order payload to a UK dropship supplier
     */
    generatePurchaseOrder(req) {
        const poRecord = {
            poNumber: req.poNumber,
            orderId: req.orderId,
            supplierId: req.supplierId,
            status: "dispatched",
            dispatchedAt: new Date().toISOString()
        };
        this.poRegistry.set(req.poNumber, poRecord);
        console.log(`[PO Dispatch] Dispatched ${req.poNumber} to supplier ${req.supplierId} for order ${req.orderId} (${req.items.length} items, Tier: ${req.deliveryTier})`);
        return poRecord;
    }
    /**
     * Ingest tracking number from supplier webhook or API callback
     */
    ingestSupplierTracking(payload) {
        const record = this.poRegistry.get(payload.poNumber);
        if (!record) {
            // Auto-register if not previously recorded in memory
            const newRecord = {
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
        console.log(`[PO Tracking] Received tracking for ${payload.poNumber}: ${payload.courierName} #${payload.trackingNumber}`);
        return record;
    }
    /**
     * Retrieve PO record by PO number
     */
    getPurchaseOrder(poNumber) {
        return this.poRegistry.get(poNumber);
    }
}
