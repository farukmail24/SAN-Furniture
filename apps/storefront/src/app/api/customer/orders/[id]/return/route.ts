import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import crypto from "node:crypto";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const reason = body.reason || "Customer resolution request";

    const pool = getDbPool();
    const [orders]: any = await pool.query(
      "SELECT id, order_number, customer_email, customer_name FROM orders WHERE id = ? OR order_number = ? LIMIT 1",
      [id, id]
    );

    if (!orders || orders.length === 0) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    const order = orders[0];

    await pool.query(
      "UPDATE orders SET fulfillment_status = 'return_requested' WHERE id = ?",
      [order.id]
    );

    // Notify operations and support desk
    const notifId = `notif_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
    await pool.query(
      `INSERT INTO notifications (id, recipient_type, type, title, message, link, is_read, metadata, created_at)
       VALUES (?, 'admin', 'return_requested', ?, ?, ?, 0, ?, NOW())`,
      [
        notifId,
        `Return / Resolution Claim: #${order.order_number}`,
        `${order.customer_name} submitted a return resolution claim. Reason: ${reason}`,
        `/admin/orders`,
        JSON.stringify({ orderId: order.id, orderNumber: order.order_number, reason }),
      ]
    ).catch(() => {});

    return NextResponse.json({
      success: true,
      message: "Your return claim has been registered. Our concierge team will contact you within 24 hours.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Failed to submit return request", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
