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

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "100", 10), 500);

    const pool = getDbPool();
    const [rows]: any = await pool
      .query(
        "SELECT id, actor, action, resource, details_json, ip_address, created_at FROM admin_audit_logs ORDER BY created_at DESC LIMIT ?",
        [limit]
      )
      .catch(() => [[]]);

    const logs = Array.isArray(rows) ? rows : [];

    return NextResponse.json({
      success: true,
      logs,
      auditLogs: logs,
      total: logs.length,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
