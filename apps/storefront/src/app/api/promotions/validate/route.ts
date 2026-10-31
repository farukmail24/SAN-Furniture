import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { formatGBP, calculateNetAndVat } from "@san-furniture/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawCode = (body.code || "").toString().trim().toUpperCase();
    const customerEmail = (body.customerEmail || body.email || "").toString().trim().toLowerCase();

    if (!rawCode) {
      return NextResponse.json(
        { valid: false, error: "Please enter a promotional voucher code." },
        { status: 400 }
      );
    }

    const pool = getDbPool();

    // 1. Fetch promotion rule
    const [promos]: any = await pool.query(
      `SELECT id, code, description, discount_type, discount_value, max_discount_pennies,
              min_order_pennies, is_active, starts_at, expires_at, usage_count, max_uses,
              per_customer_limit, first_order_only
       FROM promotions 
       WHERE UPPER(code) = ? LIMIT 1`,
      [rawCode]
    );

    if (!Array.isArray(promos) || promos.length === 0) {
      return NextResponse.json(
        { valid: false, error: `Voucher code "${rawCode}" is invalid or not recognised.` },
        { status: 400 }
      );
    }

    const promo = promos[0];

    // 2. Active status check
    if (!promo.is_active) {
      return NextResponse.json(
        { valid: false, error: `Voucher code "${promo.code}" is currently paused and cannot be applied.` },
        { status: 400 }
      );
    }

    const now = new Date();

    // 3. Date window checks
    if (promo.starts_at && new Date(promo.starts_at) > now) {
      const startDateStr = new Date(promo.starts_at).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      return NextResponse.json(
        { valid: false, error: `Voucher "${promo.code}" is not valid yet. This campaign begins on ${startDateStr}.` },
        { status: 400 }
      );
    }

    if (promo.expires_at && new Date(promo.expires_at) < now) {
      const expDateStr = new Date(promo.expires_at).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      return NextResponse.json(
        { valid: false, error: `Voucher code "${promo.code}" expired on ${expDateStr}.` },
        { status: 400 }
      );
    }

    // 4. Global redemptions cap
    if (promo.max_uses > 0 && promo.usage_count >= promo.max_uses) {
      return NextResponse.json(
        { valid: false, error: `Voucher "${promo.code}" has reached its maximum total redemptions limit.` },
        { status: 400 }
      );
    }

    // 5. Customer-specific eligibility
    if (customerEmail) {
      // First order only check
      if (promo.first_order_only) {
        const [prevOrders]: any = await pool.query(
          "SELECT id FROM orders WHERE customer_email = ? AND payment_status = 'paid' LIMIT 1",
          [customerEmail]
        );
        if (Array.isArray(prevOrders) && prevOrders.length > 0) {
          return NextResponse.json(
            {
              valid: false,
              error: `Voucher "${promo.code}" is exclusively reserved for first-time customers.`,
            },
            { status: 400 }
          );
        }
      }

      // Per-customer redemption limit check
      const perCustLimit = promo.per_customer_limit || 1;
      const [userRedemptions]: any = await pool.query(
        "SELECT COUNT(*) as count FROM voucher_redemptions WHERE voucher_code = ? AND customer_email = ?",
        [promo.code, customerEmail]
      );
      const usedCount = Number(userRedemptions?.[0]?.count || 0);
      if (usedCount >= perCustLimit) {
        return NextResponse.json(
          {
            valid: false,
            error: `You have already redeemed voucher "${promo.code}" the maximum allowed number of times (${perCustLimit}).`,
          },
          { status: 400 }
        );
      }
    }

    // 6. Subtotal calculation & Minimum spend requirement
    let effectiveSubtotalPennies = Number(body.subtotalPennies) || 0;

    // Canonical item recalculation if items array is passed
    if (Array.isArray(body.items) && body.items.length > 0) {
      const productIds = body.items.map((it: any) => it.productId || it.id).filter(Boolean);
      if (productIds.length > 0) {
        const [dbProducts]: any = await pool.query(
          "SELECT id, price_pennies, status FROM products WHERE id IN (?)",
          [productIds]
        ).catch(() => [[]]);
        if (Array.isArray(dbProducts) && dbProducts.length > 0) {
          const pMap = new Map(dbProducts.map((p: any) => [p.id, p]));
          let recomputed = 0;
          for (const it of body.items) {
            const dbP = pMap.get(it.productId || it.id);
            if (dbP && dbP.status === "published") {
              const qty = Math.max(1, parseInt(it.quantity, 10) || 1);
              recomputed += Number(dbP.price_pennies) * qty;
            }
          }
          if (recomputed > 0) {
            effectiveSubtotalPennies = recomputed;
          }
        }
      }
    }

    const minOrderPennies = Number(promo.min_order_pennies) || 0;
    if (effectiveSubtotalPennies < minOrderPennies) {
      const diffPennies = minOrderPennies - effectiveSubtotalPennies;
      return NextResponse.json(
        {
          valid: false,
          error: `Voucher "${promo.code}" requires a minimum spend of ${formatGBP(minOrderPennies)}. Add ${formatGBP(diffPennies)} more to your basket to qualify!`,
          minSpendPennies: minOrderPennies,
          diffPennies,
        },
        { status: 400 }
      );
    }

    // 7. Calculate discount
    let discountPennies = 0;
    if (promo.discount_type === "percentage") {
      discountPennies = Math.round((effectiveSubtotalPennies * Number(promo.discount_value)) / 100);
      if (promo.max_discount_pennies && promo.max_discount_pennies > 0) {
        discountPennies = Math.min(discountPennies, Number(promo.max_discount_pennies));
      }
    } else {
      // Fixed amount in pennies
      discountPennies = Math.min(Number(promo.discount_value), effectiveSubtotalPennies);
    }

    const discountedSubtotalPennies = Math.max(0, effectiveSubtotalPennies - discountPennies);
    const discountedVatBreakdown = calculateNetAndVat(discountedSubtotalPennies);

    return NextResponse.json({
      valid: true,
      code: promo.code,
      description: promo.description,
      discountType: promo.discount_type,
      discountValue: promo.discount_value,
      discountPennies,
      discountFormatted: formatGBP(discountPennies),
      originalSubtotalPennies: effectiveSubtotalPennies,
      originalSubtotalFormatted: formatGBP(effectiveSubtotalPennies),
      discountedSubtotalPennies,
      discountedSubtotalFormatted: formatGBP(discountedSubtotalPennies),
      netPennies: discountedVatBreakdown.netPennies,
      formattedNet: discountedVatBreakdown.formattedNet,
      vatPennies: discountedVatBreakdown.vatPennies,
      formattedVat: discountedVatBreakdown.formattedVat,
      message: `Voucher "${promo.code}" applied! You save ${formatGBP(discountPennies)}.`,
    });
  } catch (err: any) {
    console.error("Voucher validation error:", err);
    return NextResponse.json(
      { valid: false, error: "An unexpected error occurred while validating the voucher." },
      { status: 500 }
    );
  }
}
