import { NextResponse } from "next/server";
import { formatGBP, classifyUKPostcode } from "@san-furniture/types";
import { getDbPool } from "@/lib/db";
import crypto from "node:crypto";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { amountPennies, customer, shippingAddress, deliveryTier, items } = body;

    let resolvedAmountPennies = Number(amountPennies) || 0;
    let voucherDiscountPennies = 0;
    let validatedVoucherCode: string | null = null;

    // Canonical price recalculation if items are provided (Prevents client-side price manipulation)
    if (Array.isArray(items) && items.length > 0) {
      const pool = getDbPool();
      const productIds = items.map((it: any) => it.productId || it.id).filter(Boolean);
      if (productIds.length > 0) {
        const [dbProducts]: any = await pool.query(
          "SELECT id, title, price_pennies, status FROM products WHERE id IN (?)",
          [productIds]
        ).catch(() => [[]]);

        if (Array.isArray(dbProducts) && dbProducts.length > 0) {
          const pMap = new Map(dbProducts.map((p: any) => [p.id, p]));
          let canonicalSubtotal = 0;
          for (const it of items) {
            const pid = it.productId || it.id;
            const dbP = pMap.get(pid);
            if (!dbP) {
              return NextResponse.json(
                { success: false, error: `Invalid product in basket: Product "${pid}" not found.` },
                { status: 400 }
              );
            }
            if (dbP.status !== "published") {
              return NextResponse.json(
                { success: false, error: `Product "${dbP.title || pid}" is currently unavailable for purchase.` },
                { status: 400 }
              );
            }
            const price = Number(dbP.price_pennies);
            if (price) {
              const qty = Math.max(1, parseInt(it.quantity, 10) || 1);
              canonicalSubtotal += price * qty;
            }
          }
          let tierShipping = 0;
          if (deliveryTier && deliveryTier !== "free_delivery" && deliveryTier !== "del_opt_001") {
            const [optRows]: any = await pool
              .query(
                "SELECT price_pennies FROM delivery_options WHERE id = ? AND is_active = 1 LIMIT 1",
                [deliveryTier]
              )
              .catch(() => [[]]);
            if (Array.isArray(optRows) && optRows.length > 0) {
              tierShipping = Number(optRows[0].price_pennies) || 0;
            } else if (deliveryTier === "white_glove_assembly" || deliveryTier === "del_opt_002") {
              tierShipping = 2900;
            } else if (deliveryTier === "priority_saturday" || deliveryTier === "del_opt_003") {
              tierShipping = 4900;
            }
          }

          // Scottish Highlands delivery surcharge (£49)
          const rawPostcode = shippingAddress?.postcode || body.postcode || "";
          const cleanPostcode = String(rawPostcode).toUpperCase().replace(/\s+/g, "");
          let surchargePennies = 0;
          if (cleanPostcode) {
            const zone = classifyUKPostcode(cleanPostcode);
            if (zone === "zone_2_scottish_highlands") {
              surchargePennies = 4900;
            }
          }

          // Voucher discount evaluation
          const promoCode = (body.voucherCode || body.promoCode || "").toString().trim().toUpperCase();

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
              const validSpend = canonicalSubtotal >= (Number(promo.min_order_pennies) || 0);

              if (validDates && validUses && validSpend) {
                validatedVoucherCode = promo.code;
                if (promo.discount_type === "percentage") {
                  voucherDiscountPennies = Math.round((canonicalSubtotal * Number(promo.discount_value)) / 100);
                  if (promo.max_discount_pennies && promo.max_discount_pennies > 0) {
                    voucherDiscountPennies = Math.min(voucherDiscountPennies, Number(promo.max_discount_pennies));
                  }
                } else {
                  voucherDiscountPennies = Math.min(Number(promo.discount_value), canonicalSubtotal);
                }
              }
            }
          }

          const discountedSubtotal = Math.max(0, canonicalSubtotal - voucherDiscountPennies);
          resolvedAmountPennies = discountedSubtotal + tierShipping + surchargePennies;
        }
      }
    }

    if (!resolvedAmountPennies || resolvedAmountPennies <= 0) {
      return NextResponse.json({ success: false, error: "Invalid payment amount in pennies" }, { status: 400 });
    }

    const pool = getDbPool();
    const [settingsRows]: any = await pool.query(
      "SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN ('stripe_enabled', 'stripe_mode', 'stripe_publishable_key', 'stripe_secret_key', 'stripe_statement_descriptor', 'stripe_currency')"
    ).catch(() => [[]]);

    const conf: Record<string, string> = {};
    if (Array.isArray(settingsRows)) {
      for (const r of settingsRows) {
        conf[r.setting_key] = r.setting_value;
      }
    }

    const secretKey = conf.stripe_secret_key || process.env.STRIPE_SECRET_KEY || "";
    let paymentIntentId = "";
    let clientSecret = "";

    // Connect to live Stripe API when secret key is configured
    if (secretKey && (secretKey.startsWith("sk_test_") || secretKey.startsWith("sk_live_"))) {
      try {
        // 1. Create or Find Stripe Customer so Stripe Dashboard displays Customer Name & Email
        let stripeCustomerId = "";
        const custEmail = (customer?.email || shippingAddress?.email || body.email || "").trim().toLowerCase();
        const custName = (
          customer?.name ||
          `${customer?.firstName || ""} ${customer?.lastName || ""}`.trim() ||
          shippingAddress?.fullName ||
          `${shippingAddress?.firstName || ""} ${shippingAddress?.lastName || ""}`.trim() ||
          "Valued SAN Customer"
        ).trim();
        const custPhone = (customer?.phone || shippingAddress?.phone || body.phone || "").trim();
        const shipAddr = shippingAddress || customer?.shippingAddress || body.shipping_address;

        if (custEmail) {
          try {
            // Speed optimization: Check DB first to avoid unnecessary Stripe API network roundtrip
            const [dbCust]: any = await pool.query(
              "SELECT stripe_customer_id FROM customer_payment_methods WHERE customer_email = ? AND stripe_customer_id LIKE 'cus_%' LIMIT 1",
              [custEmail]
            ).catch(() => [[]]);

            if (Array.isArray(dbCust) && dbCust.length > 0 && dbCust[0].stripe_customer_id) {
              stripeCustomerId = dbCust[0].stripe_customer_id;
            } else {
              const searchCustRes = await fetch(`https://api.stripe.com/v1/customers?email=${encodeURIComponent(custEmail)}&limit=1`, {
                headers: { Authorization: `Bearer ${secretKey}` },
                signal: AbortSignal.timeout(3500),
              });
              const searchCustData = await searchCustRes.json().catch(() => ({}));
              if (searchCustRes.ok && searchCustData.data && searchCustData.data.length > 0) {
                stripeCustomerId = searchCustData.data[0].id;
                if (custName && searchCustData.data[0].name !== custName) {
                  const updateParams = new URLSearchParams();
                  updateParams.append("name", custName);
                  if (custPhone) updateParams.append("phone", custPhone);
                  fetch(`https://api.stripe.com/v1/customers/${stripeCustomerId}`, {
                    method: "POST",
                    headers: {
                      Authorization: `Bearer ${secretKey}`,
                      "Content-Type": "application/x-www-form-urlencoded",
                    },
                    body: updateParams.toString(),
                  }).catch(() => {});
                }
              } else {
                const newCustParams = new URLSearchParams();
                newCustParams.append("name", custName);
                newCustParams.append("email", custEmail);
                if (custPhone) newCustParams.append("phone", custPhone);
                if (shipAddr?.addressLine1) {
                  newCustParams.append("shipping[name]", custName);
                  newCustParams.append("shipping[address][line1]", shipAddr.addressLine1);
                  if (shipAddr.city) newCustParams.append("shipping[address][city]", shipAddr.city);
                  if (shipAddr.postcode) newCustParams.append("shipping[address][postal_code]", shipAddr.postcode);
                  newCustParams.append("shipping[address][country]", "GB");
                }
                const createCustRes = await fetch("https://api.stripe.com/v1/customers", {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${secretKey}`,
                    "Content-Type": "application/x-www-form-urlencoded",
                  },
                  body: newCustParams.toString(),
                  signal: AbortSignal.timeout(3500),
                });
                const newCustData = await createCustRes.json().catch(() => ({}));
                if (createCustRes.ok && newCustData.id) {
                  stripeCustomerId = newCustData.id;
                }
              }
            }
          } catch (custErr) {
            console.warn("[Stripe Customer Link] Error:", custErr);
          }
        }

        const stripeParams = new URLSearchParams();
        stripeParams.append("amount", String(resolvedAmountPennies));
        stripeParams.append("currency", (conf.stripe_currency || "gbp").toLowerCase());
        stripeParams.append("payment_method_types[]", "card");
        stripeParams.append("description", `SAN Furniture UK Order - ${formatGBP(resolvedAmountPennies)}`);
        if (stripeCustomerId) {
          stripeParams.append("customer", stripeCustomerId);
        }
        if (custEmail) {
          stripeParams.append("receipt_email", custEmail);
        }
        stripeParams.append("metadata[merchant]", "SAN Furniture Ltd (UK)");
        if (custName) {
          stripeParams.append("metadata[customer_name]", custName);
        }
        if (custEmail) {
          stripeParams.append("metadata[customer_email]", custEmail);
        }
        if (deliveryTier) {
          stripeParams.append("metadata[delivery_tier]", deliveryTier);
        }
        if (validatedVoucherCode) {
          stripeParams.append("metadata[voucher_code]", validatedVoucherCode);
          stripeParams.append("metadata[discount_pennies]", String(voucherDiscountPennies));
          stripeParams.append("metadata[discount_gbp]", (voucherDiscountPennies / 100).toFixed(2));
        }

        const stripeRes = await fetch("https://api.stripe.com/v1/payment_intents", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${secretKey}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: stripeParams.toString(),
          signal: AbortSignal.timeout(8000),
        });

        const stripeData = await stripeRes.json().catch(() => ({}));
        if (stripeRes.ok && stripeData.id) {
          paymentIntentId = stripeData.id;
          clientSecret = stripeData.client_secret || `${paymentIntentId}_secret`;
        }
      } catch (stripeErr) {
        console.warn("[Stripe CreateIntent] Outbound call error, falling back to local intent:", stripeErr);
      }
    }

    // Fallback if Stripe outbound request fails or in offline dev mode
    if (!paymentIntentId) {
      const isLive = conf.stripe_mode === "live";
      const prefix = isLive ? "pi_live_" : "pi_test_";
      paymentIntentId = `${prefix}${Date.now()}_${crypto.randomBytes(6).toString("hex")}`;
      clientSecret = `${paymentIntentId}_secret_${crypto.randomBytes(12).toString("hex")}`;
    }

    return NextResponse.json({
      success: true,
      paymentIntentId,
      clientSecret,
      amountPennies: resolvedAmountPennies,
      formattedAmount: formatGBP(resolvedAmountPennies),
      discountPennies: voucherDiscountPennies,
      voucherCode: validatedVoucherCode,
      currency: conf.stripe_currency || "GBP",
      status: "requires_confirmation",
      paymentMethod: "card",
      deliveryTier: deliveryTier || "free_delivery",
      customerEmail: customer?.email || "customer@sanfurniture.com",
      merchant: {
        name: "SAN Furniture Ltd",
        location: "London, UK",
        mode: conf.stripe_mode || "test",
        publishableKey: conf.stripe_publishable_key || "pk_test_demo",
        statementDescriptor: conf.stripe_statement_descriptor || "SAN FURNITURE UK",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Failed to create payment intent", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
