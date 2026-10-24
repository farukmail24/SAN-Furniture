import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth-token";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const pool = getDbPool();

    await pool.query(
      "UPDATE suppliers SET is_active = IF(is_active = 1, 0, 1) WHERE id = ? OR code = ?",
      [id, id]
    );

    const [rows]: any = await pool.query(
      "SELECT id, name, is_active FROM suppliers WHERE id = ? OR code = ? LIMIT 1",
      [id, id]
    );

    return NextResponse.json({
      success: true,
      message: "Supplier active status updated",
      supplier: rows?.[0],
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Failed to toggle supplier", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
