import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth-token";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const pool = getDbPool();
    const body = await request.json();

    const {
      name,
      badge,
      pricePennies,
      description,
      timeframe,
      serviceScope = "all_mainland",
      regions = ["all_mainland"],
      allowedPrefixes = "",
      excludedPrefixes = "",
      minOrderPennies = 0,
      isActive = true,
      sortOrder = 1,
    } = body;

    const id = `del_opt_${crypto.randomBytes(4).toString("hex")}`;
    const regionsJson = JSON.stringify(regions || ["all_mainland"]);

    await pool.query(
      `INSERT INTO delivery_options (
        id, name, badge, price_pennies, description, timeframe,
        service_scope, regions_json, allowed_prefixes, excluded_prefixes,
        min_order_pennies, is_active, sort_order, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        id,
        name,
        badge || null,
        Number(pricePennies) || 0,
        description || "",
        timeframe || "3 - 7 business days",
        serviceScope,
        regionsJson,
        allowedPrefixes || "",
        excludedPrefixes || "",
        Number(minOrderPennies) || 0,
        isActive ? 1 : 0,
        Number(sortOrder) || 1,
      ]
    );

    return NextResponse.json({
      success: true,
      message: "Delivery option created successfully",
      optionId: id,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
