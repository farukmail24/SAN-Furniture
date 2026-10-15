import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { OrderFulfillmentDispatcher, type SupplierTrackingPayload } from "../../../modules/dropship/services/order-dispatcher.js";

const dispatcher = new OrderFulfillmentDispatcher();

export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const body = req.body as Partial<SupplierTrackingPayload>;

  if (!body.poNumber || !body.trackingNumber || !body.courierName) {
    res.status(400).json({
      error: "Missing required fields: poNumber, trackingNumber, courierName"
    });
    return;
  }

  const payload: SupplierTrackingPayload = {
    supplierId: body.supplierId || "uk_supplier",
    poNumber: body.poNumber,
    orderId: body.orderId || "unknown",
    courierName: body.courierName,
    trackingNumber: body.trackingNumber,
    trackingUrl: body.trackingUrl,
    dispatchedAt: body.dispatchedAt || new Date().toISOString()
  };

  const updatedRecord = dispatcher.ingestSupplierTracking(payload);

  res.status(200).json({
    success: true,
    message: "Supplier tracking information ingested successfully",
    record: updatedRecord
  });
};
