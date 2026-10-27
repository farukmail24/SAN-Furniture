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
    const [rows]: any = await pool.query(
      `SELECT 
        s.id, s.name, s.code, s.location, s.contact_name, s.contact_email, s.contact_phone, 
        s.feed_type, s.feed_url, s.lead_time_days, s.is_active, s.last_sync_at, s.sync_status,
        COUNT(DISTINCT fi.product_id) AS mapped_products_count
      FROM suppliers s
      LEFT JOIN supplier_feed_items fi ON (s.code = fi.supplier_id OR s.id = fi.supplier_id)
      GROUP BY s.id
      ORDER BY s.is_active DESC, s.name ASC`
    ).catch(() => [[]]);

    const suppliers = (rows || []).map((s: any) => ({
      ...s,
      mapped_products_count: Number(s.mapped_products_count || 0),
    }));

    return NextResponse.json({
      success: true,
      suppliers,
      total: suppliers.length,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
