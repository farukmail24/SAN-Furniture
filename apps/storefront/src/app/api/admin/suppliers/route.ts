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
      "SELECT id, name, code, location, contact_name, contact_email, contact_phone, feed_type, feed_url, lead_time_days, is_active, last_sync_at, sync_status FROM suppliers ORDER BY name ASC"
    ).catch(() => [[]]);

    return NextResponse.json({
      success: true,
      suppliers: rows || [],
      total: rows?.length || 0,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
