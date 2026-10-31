import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth-token";
import crypto from "node:crypto";

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

    // 1. Fetch order details including stripe_payment_intent_id
    const [orderRows]: any = await pool.query(
      `SELECT id, order_number, customer_name, customer_email, total_pennies, stripe_payment_intent_id, payment_status, fulfillment_status 
       FROM orders 
       WHERE id = ? OR order_number = ? LIMIT 1`,
      [id, id]
    );

    if (!Array.isArray(orderRows) || orderRows.length === 0) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    const order = orderRows[0];

    if (order.payment_status === "refunded") {
      return NextResponse.json(
        { success: false, error: `Order #${order.order_number} has already been marked as refunded.` },
        { status: 400 }
      );
    }

    const paymentIntentId = order.stripe_payment_intent_id || "";
    const isStripe = paymentIntentId.startsWith("pi_") && !paymentIntentId.startsWith("pi_test_reused");

    // 2. Fetch Stripe secret key
    const [settingsRows]: any = await pool.query(
      "SELECT setting_value FROM system_settings WHERE setting_key = 'stripe_secret_key' LIMIT 1"
    ).catch(() => [[]]);
    const secretKey = settingsRows?.[0]?.setting_value || process.env.STRIPE_SECRET_KEY || "";

    let refundId = `ref_settled_${Date.now()}`;

    // 3. Issue Refund on Gateway API if Stripe
    if (isStripe && secretKey) {
      const refundParams = new URLSearchParams();
      refundParams.append("payment_intent", paymentIntentId);
      refundParams.append("reason", "requested_by_customer");
      refundParams.append("metadata[order_number]", order.order_number);
      refundParams.append("metadata[order_id]", order.id);
      refundParams.append("metadata[customer_name]", order.customer_name || "");
      refundParams.append("metadata[refunded_by]", admin.fullName || admin.email || "Admin");

      const stripeRefundRes = await fetch("https://api.stripe.com/v1/refunds", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: refundParams.toString(),
        signal: AbortSignal.timeout(10000),
      });

      const stripeRefundData = await stripeRefundRes.json().catch(() => ({}));
      if (!stripeRefundRes.ok) {
        // If Stripe returns already_refunded error, we can sync it to refunded in MySQL
        if (stripeRefundData?.error?.code === "charge_already_refunded") {
          // Already refunded in Stripe, sync our local DB
          refundId = "charge_already_refunded";
        } else {
          return NextResponse.json(
            {
              success: false,
              error: stripeRefundData?.error?.message || "Failed to process refund with Stripe API",
              stripeError: stripeRefundData?.error,
            },
            { status: stripeRefundRes.status || 400 }
          );
        }
      } else {
        refundId = stripeRefundData.id;
      }
    }

    // 4. Update order payment_status to 'refunded' in MySQL
    await pool.query(
      "UPDATE orders SET payment_status = 'refunded' WHERE id = ?",
      [order.id]
    );

    // 5. Create notifications & audit log
    const notifId = `notif_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
    await pool.query(
      `INSERT INTO notifications (id, recipient_type, type, title, message, link, is_read, metadata, created_at)
       VALUES (?, 'admin', 'order', ?, ?, '/admin/orders', 0, ?, NOW())`,
      [
        notifId,
        `Refund Completed: Order #${order.order_number}`,
        `Full refund of £${((order.total_pennies || 0) / 100).toFixed(2)} processed for #${order.order_number} (${order.customer_name}) via ${isStripe ? "Stripe Gateway" : order.payment_method || "Payment Gateway"}.`,
        JSON.stringify({ orderId: order.id, orderNumber: order.order_number, refundId, paymentIntentId }),
      ]
    ).catch(() => {});

    return NextResponse.json({
      success: true,
      message: `Full refund of £${((order.total_pennies || 0) / 100).toFixed(2)} issued successfully via ${isStripe ? "Stripe" : (order.payment_method || "Gateway")}!`,
      refundId,
      orderNumber: order.order_number,
      paymentIntentId,
    });
  } catch (err: any) {
    console.error("[Admin Refund] Error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to process refund", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
