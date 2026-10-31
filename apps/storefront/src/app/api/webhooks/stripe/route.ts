import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { getDbPool } from "@/lib/db";
import { dispatchOrderCreated } from "@/lib/notifications-dispatcher";

export const dynamic = "force-dynamic";

/**
 * Verifies the Stripe webhook signature manually via HMAC-SHA256
 * Format of stripe-signature header: t=1492774577,v1=5257a869e7ecebeda32affa62cd325494d3c1f6c59938032b71bf04447ec4703
 */
function verifyStripeSignature(
  rawPayload: string,
  signatureHeader: string,
  webhookSecret: string,
  toleranceSeconds = 300
): boolean {
  if (!signatureHeader || !webhookSecret) return false;

  const components = signatureHeader.split(",").reduce<Record<string, string>>((acc, pair) => {
    const [k, v] = pair.split("=");
    if (k && v) acc[k.trim()] = v.trim();
    return acc;
  }, {});

  const timestamp = parseInt(components.t, 10);
  const signature = components.v1;

  if (isNaN(timestamp) || !signature) return false;

  // Protect against replay attacks (5 minute default tolerance)
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > toleranceSeconds) {
    console.warn(`[Stripe Webhook] Timestamp outside tolerance window (${Math.abs(now - timestamp)}s > ${toleranceSeconds}s)`);
    return false;
  }

  const signedPayload = `${timestamp}.${rawPayload}`;
  const expectedSig = crypto
    .createHmac("sha256", webhookSecret)
    .update(signedPayload, "utf8")
    .digest("hex");

  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expectedSig);

  if (sigBuf.length !== expBuf.length) return false;
  return crypto.timingSafeEqual(sigBuf, expBuf);
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signatureHeader = request.headers.get("stripe-signature") || "";

    const pool = getDbPool();

    // Retrieve configured webhook secret from database or environment
    const [settingsRows]: any = await pool.query(
      "SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN ('stripe_webhook_secret', 'stripe_secret_key')"
    ).catch(() => [[]]);

    const conf: Record<string, string> = {};
    if (Array.isArray(settingsRows)) {
      for (const r of settingsRows) {
        conf[r.setting_key] = r.setting_value;
      }
    }

    const webhookSecret =
      conf.stripe_webhook_secret ||
      process.env.STRIPE_WEBHOOK_SECRET ||
      "";

    // Enforce webhook signature verification
    if (webhookSecret) {
      const isValid = verifyStripeSignature(rawBody, signatureHeader, webhookSecret);
      if (!isValid) {
        console.warn("[Stripe Webhook] Signature verification failed.");
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
      }
    } else {
      console.warn("[Stripe Webhook] Notice: No stripe_webhook_secret configured. Skipping HMAC signature check in test environment.");
    }

    let event: any;
    try {
      event = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    const eventType = event.type;
    const dataObject = event.data?.object;

    if (!dataObject) {
      return NextResponse.json({ received: true });
    }

    // Handle payment_intent.succeeded
    if (eventType === "payment_intent.succeeded") {
      const paymentIntentId = dataObject.id;
      const amountReceived = dataObject.amount_received || dataObject.amount || 0;

      // Find order by Stripe payment intent ID
      const [orderRows]: any = await pool.query(
        "SELECT id, order_number, payment_status, total_pennies, customer_email, customer_name FROM orders WHERE stripe_payment_intent_id = ? LIMIT 1",
        [paymentIntentId]
      );

      if (Array.isArray(orderRows) && orderRows.length > 0) {
        const order = orderRows[0];

        // Idempotency check: if already marked paid, skip redundant updates
        if (order.payment_status !== "paid") {
          await pool.query(
            "UPDATE orders SET payment_status = 'paid' WHERE id = ?",
            [order.id]
          );

          // Create notification for operations team
          const notifId = `notif_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
          await pool.query(
            `INSERT INTO notifications (id, recipient_type, recipient_id, type, title, message, link, is_read, metadata, created_at)
             VALUES (?, 'admin', NULL, 'order', ?, ?, ?, 0, ?, NOW())`,
            [
              notifId,
              `Payment Settled: Order #${order.order_number}`,
              `Stripe confirmed £${(amountReceived / 100).toFixed(2)} settlement for order #${order.order_number} (${order.customer_name}).`,
              `/admin/orders/${order.id}`,
              JSON.stringify({ orderId: order.id, orderNumber: order.order_number, paymentIntentId }),
            ]
          ).catch(() => {});
        }
      }
    }

    // Handle payment_intent.payment_failed
    if (eventType === "payment_intent.payment_failed") {
      const paymentIntentId = dataObject.id;
      const failureMessage = dataObject.last_payment_error?.message || "Card declined or processing failure";

      const [orderRows]: any = await pool.query(
        "SELECT id, order_number FROM orders WHERE stripe_payment_intent_id = ? LIMIT 1",
        [paymentIntentId]
      );

      if (Array.isArray(orderRows) && orderRows.length > 0) {
        const order = orderRows[0];
        await pool.query(
          "UPDATE orders SET payment_status = 'failed' WHERE id = ?",
          [order.id]
        );

        // Notify admin
        const notifId = `notif_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
        await pool.query(
          `INSERT INTO notifications (id, recipient_type, recipient_id, type, title, message, link, is_read, metadata, created_at)
           VALUES (?, 'admin', NULL, 'alert', ?, ?, ?, 0, ?, NOW())`,
          [
            notifId,
            `Payment Failed: Order #${order.order_number}`,
            `Stripe payment intent ${paymentIntentId} failed: ${failureMessage}`,
            `/admin/orders/${order.id}`,
            JSON.stringify({ orderId: order.id, orderNumber: order.order_number, error: failureMessage }),
          ]
        ).catch(() => {});
      }
    }

    // Handle charge.refunded
    if (eventType === "charge.refunded") {
      const paymentIntentId = dataObject.payment_intent || dataObject.id;
      if (paymentIntentId) {
        await pool.query(
          "UPDATE orders SET payment_status = 'refunded' WHERE stripe_payment_intent_id = ? OR stripe_payment_intent_id = ?",
          [dataObject.payment_intent || "", dataObject.id || ""]
        );

        // Find order to record notification
        const [oRows]: any = await pool.query(
          "SELECT id, order_number, customer_name, total_pennies FROM orders WHERE stripe_payment_intent_id = ? OR stripe_payment_intent_id = ? LIMIT 1",
          [dataObject.payment_intent || "", dataObject.id || ""]
        ).catch(() => [[]]);

        if (Array.isArray(oRows) && oRows.length > 0) {
          const ord = oRows[0];
          const notifId = `notif_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
          await pool.query(
            `INSERT INTO notifications (id, recipient_type, recipient_id, type, title, message, link, is_read, metadata, created_at)
             VALUES (?, 'admin', NULL, 'order', ?, ?, ?, 0, ?, NOW())`,
            [
              notifId,
              `Payment Refunded: Order #${ord.order_number}`,
              `Stripe confirmed full refund of £${((ord.total_pennies || 0) / 100).toFixed(2)} for order #${ord.order_number} (${ord.customer_name}).`,
              `/admin/orders`,
              JSON.stringify({ orderId: ord.id, orderNumber: ord.order_number, paymentIntentId }),
            ]
          ).catch(() => {});
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("[Stripe Webhook] Error processing event:", err);
    return NextResponse.json({ error: "Webhook processing error", details: err.message }, { status: 500 });
  }
}
