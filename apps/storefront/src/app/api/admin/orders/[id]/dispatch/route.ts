import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth-token";
import crypto from "crypto";
import { dispatchOrderStatusChanged } from "@/lib/notifications-dispatcher";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const pool = getDbPool();
    const body = await request.json();

    const { status, carrier } = body;
    const tracking_number = body.tracking_number || body.trackingNumber;
    const isDispatched = status === "in_transit" || status === "dispatched" || status === "delivered";

    // Update fulfillment status in orders
    if (status) {
      await pool.query(
        "UPDATE orders SET fulfillment_status = ? WHERE id = ? OR order_number = ?",
        [status, id, id]
      );
    }

    // Update or insert into order_po_dispatches
    const [existingPo]: any = await pool.query(
      "SELECT id FROM order_po_dispatches WHERE order_id = ? OR po_number = ? LIMIT 1",
      [id, id]
    );

    if (existingPo && existingPo.length > 0) {
      await pool.query(
        `UPDATE order_po_dispatches 
         SET carrier = COALESCE(?, carrier), 
             tracking_number = COALESCE(?, tracking_number),
             status = COALESCE(?, status),
             dispatched_at = CASE WHEN ? = 1 AND dispatched_at IS NULL THEN NOW() ELSE dispatched_at END
         WHERE id = ?`,
        [carrier, tracking_number, status, isDispatched ? 1 : 0, existingPo[0].id]
      );
    } else {
      const poId = `po_${crypto.randomBytes(6).toString("hex")}`;
      await pool.query(
        `INSERT INTO order_po_dispatches (
          id, po_number, order_id, supplier_id, item_count, delivery_tier, status, tracking_number, carrier, dispatched_at
        ) VALUES (?, ?, ?, 'sup_amos_mann', 1, 'standard_parcel', ?, ?, ?, ?)`,
        [
          poId,
          `PO-${id}`,
          id,
          status || "in_transit",
          tracking_number || `TRK-${Date.now()}`,
          carrier || "SAN Dedicated Delivery Fleet",
          isDispatched ? new Date() : null,
        ]
      );
    }

    // Dispatch status change notification
    const [orderRows]: any = await pool.query(
      "SELECT id, order_number, customer_email, customer_name, customer_phone FROM orders WHERE id = ? OR order_number = ? LIMIT 1",
      [id, id]
    );
    if (orderRows && orderRows.length > 0) {
      const o = orderRows[0];
      await dispatchOrderStatusChanged({
        orderNumber: o.order_number,
        customerName: o.customer_name,
        customerEmail: o.customer_email,
        customerPhone: o.customer_phone,
        newStatus: status || "dispatched",
        carrier: carrier || "SAN Dedicated Delivery Fleet",
        trackingNumber: tracking_number,
      }).catch((err) => console.warn("[Dispatch] Notification warning:", err?.message || err));
    }

    return NextResponse.json({
      success: true,
      message: "Order dispatch details saved successfully",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Failed to update dispatch", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
