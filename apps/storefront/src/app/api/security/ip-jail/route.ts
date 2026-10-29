import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth-token";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized: Administrator privileges required", jailedIps: [] }, { status: 401 });
    }

    const pool = getDbPool();
    const [rows]: any = await pool
      .query(
        "SELECT id, ip_address, strike_count, reason, locked_until, is_permanent, created_at FROM security_ip_jail ORDER BY created_at DESC"
      )
      .catch(() => [[]]);

    return NextResponse.json({
      success: true,
      jailedIps: Array.isArray(rows) ? rows : [],
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message, jailedIps: [] },
      { status: 500 }
    );
  }
}
