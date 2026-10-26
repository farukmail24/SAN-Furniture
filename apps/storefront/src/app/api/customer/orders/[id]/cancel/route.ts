import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { getCustomerFromRequest } from "@/lib/auth-token";
import crypto from "node:crypto";
import { dispatchOrderCancelled } from "@/lib/notifications-dispatcher";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const reason = body.reason || "Customer requested cancellation before dispatch";

    const pool = getDbPool();

    // Verify order exists
    const [orders]: any = await pool.query(
      "SELECT id, order_number, customer_email, customer_name, customer_phone, total_pennies, fulfillment_status FROM orders WHERE id = ? OR order_number = ? LIMIT 1",
      [id, id]
    );

    if (!orders || orders.length === 0) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    const order = orders[0];
    if (order.fulfillment_status === "delivered") {
      return NextResponse.json(
        { success: false, error: "Delivered orders cannot be cancelled. Please request a return collection instead." },
        { status: 400 }
      );
    }

    const cancelledBy = `Customer (${order.customer_name || "Customer"})`;
    await pool.query(
      `UPDATE orders 
       SET fulfillment_status = 'cancelled', 
           payment_status = 'refund_pending',
           cancellation_reason = ?,
           cancelled_by = ?,
           cancelled_at = NOW()
       WHERE id = ?`,
      [reason, cancelledBy, order.id]
    );

    await pool.query(
      "UPDATE order_po_dispatches SET status = 'cancelled' WHERE order_id = ?",
      [order.id]
    );

    // Notify operations team
    const notifId = `notif_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
    await pool.query(
      `INSERT INTO notifications (id, recipient_type, type, title, message, link, is_read, metadata, created_at)
       VALUES (?, 'admin', 'order_cancelled', ?, ?, ?, 0, ?, NOW())`,
      [
        notifId,
        `Order Cancelled: #${order.order_number}`,
        `${order.customer_name} cancelled order #${order.order_number}. Reason: ${reason}`,
        `/admin/orders`,
        JSON.stringify({ orderId: order.id, orderNumber: order.order_number, reason }),
      ]
    ).catch(() => {});

    // Dispatch cancellation notification
    await dispatchOrderCancelled({
      orderNumber: order.order_number,
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      customerPhone: order.customer_phone,
      totalPennies: order.total_pennies,
      reason,
      cancelledBy,
    }).catch((err) => console.warn("[CustomerCancel] Notification warning:", err?.message || err));

    return NextResponse.json({
      success: true,
      message: "Order has been successfully cancelled and 100% refund initiated.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Failed to cancel order", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
