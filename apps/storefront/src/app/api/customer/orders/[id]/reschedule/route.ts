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
    const newSlot = body.slot || body.deliverySlot || "Standard Business Day (08:00 - 18:00)";
    const newDate = body.date || "Next available White Glove window";

    const pool = getDbPool();
    const [orders]: any = await pool.query(
      "SELECT id, order_number, customer_email, customer_name FROM orders WHERE id = ? OR order_number = ? LIMIT 1",
      [id, id]
    );

    if (!orders || orders.length === 0) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    const order = orders[0];
    const slotStr = `${newDate} - ${newSlot}`;

    await pool.query(
      "UPDATE orders SET delivery_slot = ? WHERE id = ?",
      [slotStr, order.id]
    );

    // Notify logistics team
    const notifId = `notif_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
    await pool.query(
      `INSERT INTO notifications (id, recipient_type, type, title, message, link, is_read, metadata, created_at)
       VALUES (?, 'admin', 'delivery_rescheduled', ?, ?, ?, 0, ?, NOW())`,
      [
        notifId,
        `Delivery Rescheduled: #${order.order_number}`,
        `${order.customer_name} rescheduled delivery slot to: ${slotStr}`,
        `/admin/orders`,
        JSON.stringify({ orderId: order.id, orderNumber: order.order_number, newSlot: slotStr }),
      ]
    ).catch(() => {});

    return NextResponse.json({
      success: true,
      message: "Delivery appointment successfully rescheduled with dedicated white glove logistics.",
      slot: slotStr,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Failed to reschedule delivery", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
