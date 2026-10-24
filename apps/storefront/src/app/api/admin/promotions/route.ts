import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth-token";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const pool = getDbPool();
    const [promotions]: any = await pool.query("SELECT * FROM promotions ORDER BY created_at DESC");
    return NextResponse.json({
      success: true,
      promotions: Array.isArray(promotions) ? promotions : [],
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
      minOrderPennies = 0,
      maxUses = 100,
      isActive = 1,
    } = body;

    if (!code) {
      return NextResponse.json({ error: "Voucher code is required" }, { status: 400 });
    }

    const promoId = `promo_${code.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
    await pool.query(
      `INSERT INTO promotions (id, code, description, discount_type, discount_value, min_order_pennies, is_active, usage_count, max_uses)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)
       ON DUPLICATE KEY UPDATE description = VALUES(description), discount_type = VALUES(discount_type), discount_value = VALUES(discount_value), min_order_pennies = VALUES(min_order_pennies), is_active = VALUES(is_active)`,
      [
        promoId,
        code.toUpperCase(),
        description || code,
        discountType,
        discountValue,
        minOrderPennies,
        isActive ? 1 : 0,
        maxUses,
      ]
    );

    return NextResponse.json(
      { success: true, promoId, message: `Promotion ${code} created` },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to create promotion", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
