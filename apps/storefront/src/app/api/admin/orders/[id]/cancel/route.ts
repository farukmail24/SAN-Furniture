import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth-token";
import crypto from "node:crypto";
import { dispatchOrderCancelled } from "@/lib/notifications-dispatcher";

export const dynamic = "force-dynamic";

export async function POST(
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
    const body = await request.json().catch(() => ({}));

    const staffName = admin.fullName || admin.email || "Staff";
    const cancelledBy = `Staff (${staffName})`;
    const reason = body.reason || "Administrative cancellation before courier dispatch";

    await pool.query(
      `UPDATE orders 
       SET fulfillment_status = 'cancelled', 
           payment_status = 'refund_pending',
           cancellation_reason = ?,
           cancelled_by = ?,
           cancelled_at = NOW()
       WHERE id = ? OR order_number = ?`,
      [reason, cancelledBy, id, id]
    );

    // Also update PO status
    await pool.query(
      "UPDATE order_po_dispatches SET status = 'cancelled' WHERE order_id = ? OR po_number = ?",
      [id, id]
    );

    // Notify customer
    const [orderRows]: any = await pool.query(
      "SELECT id, order_number, customer_email, customer_name, customer_phone, total_pennies FROM orders WHERE id = ? OR order_number = ? LIMIT 1",
      [id, id]
    );
    if (orderRows && orderRows.length > 0) {
      const o = orderRows[0];
      const notifId = `notif_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
      await pool.query(
        `INSERT INTO notifications (id, recipient_type, type, title, message, link, is_read, metadata, created_at)
         VALUES (?, 'customer', 'order_cancelled', ?, ?, ?, 0, ?, NOW())`,
        [
          notifId,
          `Order Cancelled: #${o.order_number}`,
          `Your order #${o.order_number} has been cancelled by support (${staffName}). Reason: ${reason}. A full refund is scheduled.`,
          `/account?tab=orders`,
          JSON.stringify({ orderId: o.id, orderNumber: o.order_number, reason, cancelledBy }),
        ]
      ).catch(() => {});

      // Fire-and-forget notification dispatch (guarded: immediately returns if email/sms disabled in admin)
      dispatchOrderCancelled({
        orderNumber: o.order_number,
        customerName: o.customer_name,
        customerEmail: o.customer_email,
        customerPhone: o.customer_phone,
        totalPennies: o.total_pennies,
        reason,
        cancelledBy,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Order cancelled successfully",
      reason: body.reason || "Customer requested cancellation",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Failed to cancel order", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
