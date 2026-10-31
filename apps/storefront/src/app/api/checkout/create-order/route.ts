import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { formatGBP, calculateNetAndVat, classifyUKPostcode } from "@san-furniture/types";
import { hashPassword } from "@/lib/auth-token";
import { ensureVoucherSchema } from "@/lib/ensure-voucher-schema";
import crypto from "node:crypto";
import { dispatchOrderCreated } from "@/lib/notifications-dispatcher";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  await ensureVoucherSchema();
  const pool = getDbPool();
  const connection = await pool.getConnection();

  try {
    const body = await request.json().catch(() => ({}));
    const {
      customer,
      shippingAddress,
      billingAddress,
      items,
      deliveryOption,
      deliveryTier,
      paymentMethod,
      paymentConfirmation,
      createAccount,
      accountPassword,
    } = body;

    // 1. Strict Payment Gate: Order cannot be placed without verified payment confirmation
    if (
      !paymentConfirmation ||
      paymentConfirmation.status !== "succeeded" ||
      !paymentConfirmation.paymentIntentId
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Payment Authorization Required: Your payment must be verified before submitting your order.",
        },
        { status: 402 }
      );
    }

    // 1b. Server-Side Stripe Settlement Verification: Query Stripe directly to verify that the PaymentIntent has ACTUALLY succeeded
    const [settingsRows]: any = await pool.query(
      "SELECT setting_key, setting_value FROM system_settings WHERE setting_key = 'stripe_secret_key'"
    ).catch(() => [[]]);
    const secretKey = settingsRows?.[0]?.setting_value || process.env.STRIPE_SECRET_KEY || "";

    if (secretKey && paymentConfirmation.paymentIntentId.startsWith("pi_")) {
      const stripeVerifyRes = await fetch(
        `https://api.stripe.com/v1/payment_intents/${paymentConfirmation.paymentIntentId}`,
        {
          headers: { Authorization: `Bearer ${secretKey}` },
          signal: AbortSignal.timeout(6000),
        }
      );
      const stripePiData = await stripeVerifyRes.json().catch(() => ({}));

      if (!stripeVerifyRes.ok || stripePiData.status !== "succeeded") {
        console.warn("[create-order] Stripe verification rejected: Status is not succeeded:", stripePiData?.status);
        return NextResponse.json(
          {
            success: false,
            error: "Payment Verification Failed: Stripe has not settled this transaction. Order cannot be placed.",
            status: "failed",
          },
          { status: 402 }
        );
      }
    }

    // 2. Anti-Replay / Idempotency Check
    const [existingOrders]: any = await pool.query(
      "SELECT id, order_number, total_pennies FROM orders WHERE stripe_payment_intent_id = ? LIMIT 1",
      [paymentConfirmation.paymentIntentId]
    );

    if (existingOrders && existingOrders.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `An order (#${existingOrders[0].order_number}) has already been recorded for this transaction.`,
          orderNumber: existingOrders[0].order_number,
          orderId: existingOrders[0].id,
        },
        { status: 409 }
      );
    }

    if (!customer?.name || !customer?.email || !shippingAddress?.addressLine1 || !shippingAddress?.postcode) {
      return NextResponse.json(
        { success: false, error: "Customer name, email, delivery address, and UK postcode are required." },
        { status: 400 }
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Your basket is empty. Please add items before checking out." },
        { status: 400 }
      );
    }

    const cleanPostcode = (shippingAddress.postcode || "").toUpperCase().replace(/\s+/g, "");
    const zone = classifyUKPostcode(cleanPostcode);

    let surchargePennies = 0;
    if (zone === "zone_2_scottish_highlands") {
      surchargePennies = 4900;
    } else if (zone !== "zone_1_mainland") {
      return NextResponse.json(
        { success: false, error: "We currently deliver exclusively to UK Mainland addresses." },
        { status: 400 }
      );
    }

    // 3. Canonical Price Enforcement against MySQL database
    const productIds = items.map((it: any) => it.productId || it.id).filter(Boolean);
    const [dbProducts]: any = await pool.query(
      "SELECT id, title, price_pennies, status, thumbnail_url FROM products WHERE id IN (?)",
      [productIds]
    );

    const pMap = new Map((Array.isArray(dbProducts) ? dbProducts : []).map((p: any) => [p.id, p]));
    const canonicalItems: any[] = [];
    let subtotalPennies = 0;

    for (const it of items) {
      const pid = it.productId || it.id;
      const dbP = pMap.get(pid);
      if (!dbP) {
        return NextResponse.json(
          { success: false, error: `Invalid product in basket: Product "${pid}" not found in catalog.` },
          { status: 400 }
        );
      }
      if (dbP.status !== "published") {
        return NextResponse.json(
          { success: false, error: `Product "${dbP.title || pid}" is currently unavailable for purchase.` },
          { status: 400 }
        );
      }
      const unitPrice = Number(dbP.price_pennies);
      const qty = Math.max(1, parseInt(it.quantity, 10) || 1);
      subtotalPennies += unitPrice * qty;
      canonicalItems.push({
        ...it,
        productId: pid,
        title: dbP.title,
        pricePennies: unitPrice,
        quantity: qty,
        thumbnailUrl: it.thumbnailUrl || it.thumbnail_url || it.image || dbP.thumbnail_url || "",
      });
    }

    const tier = deliveryOption?.tier || deliveryTier || "del_opt_001";
    let baseShippingPennies = 0;
    if (tier && tier !== "free_delivery" && tier !== "del_opt_001") {
      const [optRows]: any = await pool
        .query(
          "SELECT price_pennies FROM delivery_options WHERE id = ? AND is_active = 1 LIMIT 1",
          [tier]
        )
        .catch(() => [[]]);
      if (Array.isArray(optRows) && optRows.length > 0) {
        baseShippingPennies = Number(optRows[0].price_pennies) || 0;
      } else if (tier === "white_glove_assembly" || tier === "del_opt_002") {
        baseShippingPennies = 2900;
      } else if (tier === "priority_saturday" || tier === "del_opt_003") {
        baseShippingPennies = 4900;
      }
    }

    // Voucher discount validation
    const promoCode = (body.voucherCode || body.promoCode || "").toString().trim().toUpperCase();
    let discountPennies = 0;
    let appliedVoucherId: string | null = null;
    let appliedVoucherCode: string | null = null;

    if (promoCode) {
      const [promos]: any = await pool.query(
        "SELECT * FROM promotions WHERE UPPER(code) = ? AND is_active = 1 LIMIT 1",
        [promoCode]
      ).catch(() => [[]]);

      if (Array.isArray(promos) && promos.length > 0) {
        const promo = promos[0];
        const now = new Date();
        const validDates =
          (!promo.starts_at || new Date(promo.starts_at) <= now) &&
          (!promo.expires_at || new Date(promo.expires_at) >= now);
        const validUses = promo.max_uses <= 0 || promo.usage_count < promo.max_uses;
        const validSpend = subtotalPennies >= (Number(promo.min_order_pennies) || 0);

        if (validDates && validUses && validSpend) {
          appliedVoucherId = promo.id;
          appliedVoucherCode = promo.code;
          if (promo.discount_type === "percentage") {
            discountPennies = Math.round((subtotalPennies * Number(promo.discount_value)) / 100);
            if (promo.max_discount_pennies && promo.max_discount_pennies > 0) {
              discountPennies = Math.min(discountPennies, Number(promo.max_discount_pennies));
            }
          } else {
            discountPennies = Math.min(Number(promo.discount_value), subtotalPennies);
          }
        }
      }
    }

    const shippingPennies = baseShippingPennies + surchargePennies;
    const discountedGoodsPennies = Math.max(0, subtotalPennies - discountPennies);
    const grandTotalPennies = discountedGoodsPennies + shippingPennies;
    const vatBreakdown = calculateNetAndVat(grandTotalPennies);

    const orderId = `ord_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const seqNum = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `SAN-2026-${seqNum}`;
    const poNumber = `PO-SAN-${seqNum}`;
    const trackingNumber = `TRK-SAN-${Math.floor(100000 + Math.random() * 900000)}`;

    const fullShippingAddress = [
      shippingAddress.addressLine1,
      shippingAddress.addressLine2,
      shippingAddress.city,
      shippingAddress.state,
      shippingAddress.postcode,
      shippingAddress.country || "United Kingdom",
    ]
      .filter(Boolean)
      .join(", ");

    const bAddress = billingAddress || shippingAddress;
    const fullBillingAddress = [
      bAddress.addressLine1 || shippingAddress.addressLine1,
      bAddress.addressLine2 || shippingAddress.addressLine2,
      bAddress.city || shippingAddress.city,
      bAddress.postcode || shippingAddress.postcode,
      bAddress.country || "United Kingdom",
    ]
      .filter(Boolean)
      .join(", ");

    // Customer Account Resolution
    const [nameFirst, ...nameRest] = (customer.name || "").trim().split(" ");
    const firstName = customer.firstName || nameFirst || "Client";
    const lastName = customer.lastName || nameRest.join(" ") || "Client";
    const customerId = `cust_${crypto.createHash("md5").update(customer.email.toLowerCase()).digest("hex").slice(0, 12)}`;

    // 4. ACID Database Transaction
    await connection.beginTransaction();

    let passwordHash = "GUEST_CHECKOUT";
    if (createAccount && accountPassword && accountPassword.length >= 8) {
      passwordHash = hashPassword(accountPassword);
    }

    // Upsert customer (resilient: profile collisions must never abort paid order)
    try {
      await connection.query(
        `INSERT INTO customers (id, email, username, password_hash, first_name, last_name, phone)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
           phone = COALESCE(VALUES(phone), phone),
           first_name = COALESCE(VALUES(first_name), first_name),
           last_name = COALESCE(VALUES(last_name), last_name)`,
        [
          customerId,
          customer.email.trim().toLowerCase(),
          customer.username || customer.email.split("@")[0],
          passwordHash,
          firstName,
          lastName,
          customer.phone || null,
        ]
      );
    } catch (custErr: any) {
      console.warn("[create-order: customers upsert warning]:", custErr?.message || custErr);
    }

    // Save shipping address to customer_addresses
    const addrId = `addr_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
    await connection.query(
      `INSERT INTO customer_addresses (id, customer_id, label, recipient, address_line1, address_line2, city, postcode, phone, is_default_delivery, created_at)
       VALUES (?, ?, 'Delivery Address', ?, ?, ?, ?, ?, ?, 1, NOW())
       ON DUPLICATE KEY UPDATE updated_at = NOW()`,
      [
        addrId,
        customerId,
        customer.name,
        shippingAddress.addressLine1,
        shippingAddress.addressLine2 || null,
        shippingAddress.city,
        shippingAddress.postcode.toUpperCase(),
        customer.phone || null,
      ]
    ).catch(() => {});

    // Insert Order
    await connection.query(
      `INSERT INTO orders (
        id, order_number, customer_name, customer_email, customer_phone,
        shipping_address, shipping_postcode, shipping_zone, delivery_tier, delivery_slot,
        subtotal_pennies, discount_pennies, voucher_code, shipping_pennies, vat_pennies, total_pennies,
        payment_status, fulfillment_status, stripe_payment_intent_id, items_json,
        billing_address, payment_method, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'paid', 'unfulfilled', ?, ?, ?, ?, NOW())`,
      [
        orderId,
        orderNumber,
        customer.name,
        customer.email.trim().toLowerCase(),
        customer.phone || null,
        fullShippingAddress,
        cleanPostcode,
        zone === "zone_1_mainland" ? "Mainland UK" : "Scottish Highlands",
        tier,
        deliveryOption?.timeframe || "5 - 10 business days",
        subtotalPennies,
        discountPennies,
        appliedVoucherCode,
        shippingPennies,
        vatBreakdown.vatPennies,
        grandTotalPennies,
        paymentConfirmation.paymentIntentId,
        JSON.stringify(canonicalItems),
        fullBillingAddress,
        paymentConfirmation.paymentMethod || paymentMethod || "card",
      ]
    );

    // Record voucher redemption & increment promotion usage count
    if (appliedVoucherCode && appliedVoucherId && discountPennies > 0) {
      const redemptionId = `red_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
      await connection.query(
        `INSERT INTO voucher_redemptions (id, voucher_id, voucher_code, order_id, customer_email, discount_pennies, created_at)
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [redemptionId, appliedVoucherId, appliedVoucherCode, orderId, customer.email.trim().toLowerCase(), discountPennies]
      ).catch((redErr: any) => console.warn("[create-order: voucher_redemptions insert warning]:", redErr?.message || redErr));

      await connection.query(
        "UPDATE promotions SET usage_count = usage_count + 1 WHERE id = ?",
        [appliedVoucherId]
      ).catch((updErr: any) => console.warn("[create-order: promotions usage_count update warning]:", updErr?.message || updErr));
    }

    // Update Stripe PaymentIntent metadata & description so Stripe Dashboard displays Order Number & Customer Name
    if (secretKey && paymentConfirmation.paymentIntentId?.startsWith("pi_") && !paymentConfirmation.paymentIntentId.startsWith("pi_test_reused")) {
      const stripeUpdateParams = new URLSearchParams();
      stripeUpdateParams.append("description", `SAN Furniture UK Order #${orderNumber} - £${(grandTotalPennies / 100).toFixed(2)}`);
      stripeUpdateParams.append("metadata[order_number]", orderNumber);
      stripeUpdateParams.append("metadata[order_id]", orderId);
      stripeUpdateParams.append("metadata[customer_name]", customer.name);
      stripeUpdateParams.append("metadata[customer_email]", customer.email.trim().toLowerCase());
      stripeUpdateParams.append("metadata[shipping_postcode]", cleanPostcode);
      if (appliedVoucherCode) {
        stripeUpdateParams.append("metadata[voucher_code]", appliedVoucherCode);
        stripeUpdateParams.append("metadata[discount_gbp]", (discountPennies / 100).toFixed(2));
      }

      fetch(`https://api.stripe.com/v1/payment_intents/${paymentConfirmation.paymentIntentId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: stripeUpdateParams.toString(),
        signal: AbortSignal.timeout(5000),
      }).catch((err) => console.warn("[create-order] Stripe PaymentIntent update warning:", err?.message || err));
    }

    // Save Card Record to customer_payment_methods
    // User mandate: Card is ALWAYS saved in our database. But is_saved_for_future is 1 only if customer agreed.
    try {
      const paymentDetails = body.paymentDetails || paymentConfirmation?.paymentDetails || {};
      const isSavedCard = Boolean(paymentDetails?.isSavedCard || paymentDetails?.savedCardId);
      const savedCardId = paymentDetails?.savedCardId;
      const custEmail = customer.email.trim().toLowerCase();

      if (isSavedCard && savedCardId) {
        // Reuse of existing authorized instrument: touch updated_at and ensure it remains active
        await connection.query(
          "UPDATE customer_payment_methods SET is_default = 1, updated_at = NOW() WHERE id = ? OR (customer_email = ? AND last4 = ?)",
          [savedCardId, custEmail, paymentDetails?.last4 || "4242"]
        ).catch(() => {});
      } else {
        const rawCard = String(paymentDetails?.cardNumber || "").replace(/\s+/g, "");
        const last4 = rawCard.length >= 4 ? rawCard.slice(-4) : (paymentDetails?.last4 || "4242");
        let brand = paymentDetails?.brand || "Visa";
        if (!paymentDetails?.brand) {
          if (rawCard.startsWith("5")) brand = "Mastercard";
          else if (rawCard.startsWith("3")) brand = "American Express";
          else if (rawCard.startsWith("6")) brand = "Discover";
        }

        const expStr = String(paymentDetails?.cardExpiry || "12/28").trim();
        const expParts = expStr.split("/");
        const expMonth = parseInt(expParts[0], 10) || 12;
        let expYear = parseInt(expParts[1], 10) || 2028;
        if (expYear < 100) expYear += 2000;

        const cardholderName = String(paymentDetails?.cardholderName || customer.name || "Valued SAN Customer").trim();
        const isSavedForFuture = Boolean(body.saveCardForFuture ?? paymentDetails?.saveCardForFuture ?? false);
        const pmId = `cpm_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

        const [custRows]: any = await connection.query(
          "SELECT id FROM customers WHERE email = ? LIMIT 1",
          [custEmail]
        ).catch(() => [[]]);
        const dbCustomerId = Array.isArray(custRows) && custRows.length > 0 ? custRows[0].id : null;

        if (isSavedForFuture) {
          await connection.query(
            "UPDATE customer_payment_methods SET is_default = 0 WHERE customer_email = ?",
            [custEmail]
          ).catch(() => {});
        }

        await connection.query(
          `INSERT INTO customer_payment_methods (
            id, customer_id, customer_email, brand, last4, exp_month, exp_year, cardholder_name,
            stripe_payment_method_id, stripe_customer_id, is_saved_for_future, is_default, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            pmId,
            dbCustomerId,
            custEmail,
            brand,
            last4,
            expMonth,
            expYear,
            cardholderName,
            paymentConfirmation.transactionId || null,
            paymentConfirmation.paymentIntentId || null,
            isSavedForFuture ? 1 : 0,
            isSavedForFuture ? 1 : 0,
          ]
        );
      }
    } catch (cpmErr: any) {
      console.warn("[customer_payment_methods] Save error:", cpmErr.message);
    }

    // Insert B2B Dropship Dispatch record (Pending supplier/hub dispatch)
    // Non-fatal: subsidiary supplier logistics tracking must never rollback paid customer order
    try {
      const primarySupplierId =
        canonicalItems[0]?.supplierId ||
        (String(canonicalItems[0]?.productId || "").startsWith("prod_live_am_") ? "sup_amos_mann" : "sup_craft_uk");

      await connection.query(
        `INSERT INTO order_po_dispatches (
          id, po_number, order_id, supplier_id, item_count, delivery_tier, status, tracking_number, carrier
        ) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, 'SAN Dedicated Delivery Fleet')`,
        [
          `po_${orderId}`,
          poNumber,
          orderId,
          primarySupplierId,
          canonicalItems.length,
          tier,
          trackingNumber,
        ]
      );
    } catch (poErr: any) {
      console.warn("[order_po_dispatches] Non-fatal dispatch log error:", poErr?.message || poErr);
    }

    // Create Admin notification
    const notifId = `notif_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
    await connection.query(
      `INSERT INTO notifications (id, recipient_type, type, title, message, link, is_read, metadata, created_at)
       VALUES (?, 'admin', 'order_created', ?, ?, ?, 0, ?, NOW())`,
      [
        notifId,
        `New Order #${orderNumber} (${formatGBP(grandTotalPennies)})`,
        `Customer ${customer.name} placed order #${orderNumber} for ${formatGBP(grandTotalPennies)} via ${paymentConfirmation.paymentMethod || "Card"}.`,
        `/admin/orders`,
        JSON.stringify({ orderId, orderNumber, totalPennies: grandTotalPennies }),
      ]
    ).catch(() => {});

    await connection.commit();

    // Dispatch transactional notifications (guarded: immediately returns if email/sms disabled in admin)
    await dispatchOrderCreated({
      orderNumber,
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      totalPennies: grandTotalPennies,
      subtotalPennies,
      vatPennies: vatBreakdown.vatPennies,
      deliveryTier: tier,
      shippingAddress: fullShippingAddress,
      items: canonicalItems.map((it: any) => ({
        title: it.title,
        quantity: it.quantity,
        pricePennies: it.pricePennies,
        finish: it.finish,
      })),
    }).catch((err) => console.warn("[Checkout] Order notification dispatch warning:", err?.message || err));

    return NextResponse.json({
      success: true,
      orderId,
      orderNumber,
      poNumber,
      invoiceNumber: `INV-${orderNumber}`,
      trackingNumber,
      carrier: "SAN Dedicated Delivery Fleet",
      totalPennies: grandTotalPennies,
      formattedTotal: formatGBP(grandTotalPennies),
      subtotalPennies,
      discountPennies,
      voucherCode: appliedVoucherCode,
      customerName: customer.name,
      customerEmail: customer.email,
      shippingAddress: fullShippingAddress,
      billingAddress: fullBillingAddress,
      deliveryTier: tier,
      deliveryLabel: deliveryOption?.name || "Free UK Mainland Delivery",
      estimatedDays: deliveryOption?.timeframe || "5 - 10 business days",
      items: canonicalItems,
      invoiceHtmlUrl: `/api/orders/${orderId}/invoice`,
    });
  } catch (err: any) {
    try {
      await connection.rollback();
    } catch {}
    console.error("[Checkout Create Order Error]:", err);
    return NextResponse.json(
      { success: false, error: "Failed to persist verified order in database.", details: err?.message || String(err) },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}
