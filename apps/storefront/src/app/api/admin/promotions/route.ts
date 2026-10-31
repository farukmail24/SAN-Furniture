import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth-token";
import crypto from "node:crypto";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const pool = getDbPool();
    const [promotions]: any = await pool.query(
      `SELECT p.*,
              COALESCE((SELECT SUM(discount_pennies) FROM voucher_redemptions WHERE voucher_code = p.code), 0) as total_savings_pennies
       FROM promotions p 
       ORDER BY p.created_at DESC`
    );

    const list = Array.isArray(promotions) ? promotions : [];
    const totalRedeemed = list.reduce((acc: number, p: any) => acc + (Number(p.usage_count) || 0), 0);
    const totalSavingsPennies = list.reduce(
      (acc: number, p: any) => acc + (Number(p.total_savings_pennies) || 0),
      0
    );

    return NextResponse.json({
      success: true,
      promotions: list,
      summary: {
        totalVouchers: list.length,
        activeCampaigns: list.filter((p: any) => p.is_active).length,
        totalRedeemed,
        totalSavingsPennies,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch promotions", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const pool = getDbPool();
    const body = await request.json();
    const {
      code,
      description,
      discountType = "percentage",
      discountValue = 10,
      maxDiscountPennies = null,
      minOrderPennies = 0,
      maxUses = 1000,
      perCustomerLimit = 1,
      firstOrderOnly = 0,
      startsAt = null,
      expiresAt = null,
      isActive = 1,
    } = body;

    const cleanCode = (code || "").toString().trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");
    if (!cleanCode) {
      return NextResponse.json({ error: "A valid alphanumeric voucher code is required" }, { status: 400 });
    }

    const promoId = `promo_${cleanCode.toLowerCase()}_${crypto.randomBytes(3).toString("hex")}`;
    
    await pool.query(
      `INSERT INTO promotions (
        id, code, description, discount_type, discount_value, max_discount_pennies,
        min_order_pennies, is_active, starts_at, expires_at, usage_count, max_uses,
        per_customer_limit, first_order_only, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        description = VALUES(description),
        discount_type = VALUES(discount_type),
        discount_value = VALUES(discount_value),
        max_discount_pennies = VALUES(max_discount_pennies),
        min_order_pennies = VALUES(min_order_pennies),
        is_active = VALUES(is_active),
        starts_at = VALUES(starts_at),
        expires_at = VALUES(expires_at),
        max_uses = VALUES(max_uses),
        per_customer_limit = VALUES(per_customer_limit),
        first_order_only = VALUES(first_order_only)`,
      [
        promoId,
        cleanCode,
        description || cleanCode,
        discountType,
        Number(discountValue) || 0,
        maxDiscountPennies ? Number(maxDiscountPennies) : null,
        Number(minOrderPennies) || 0,
        isActive ? 1 : 0,
        startsAt ? new Date(startsAt) : null,
        expiresAt ? new Date(expiresAt) : null,
        Number(maxUses) || 1000,
        Number(perCustomerLimit) || 1,
        firstOrderOnly ? 1 : 0,
      ]
    );

    return NextResponse.json(
      { success: true, promoId, code: cleanCode, message: `Voucher "${cleanCode}" created successfully` },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to create promotion", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
