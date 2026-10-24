import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth-token";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Admin authorization required" },
        { status: 401 }
      );
    }

    const pool = getDbPool();
    const [rows]: any = await pool.query(
      "SELECT id, email, full_name, role, is_active, last_login_at, created_at FROM admin_users ORDER BY created_at ASC"
    ).catch(() => [[]]);

    return NextResponse.json({
      success: true,
      users: rows || [],
      total: rows?.length || 0,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
