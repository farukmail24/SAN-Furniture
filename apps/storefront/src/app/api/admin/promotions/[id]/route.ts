import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth-token";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const pool = getDbPool();

    const isActive = body.isActive ? 1 : 0;
    await pool.query("UPDATE promotions SET is_active = ? WHERE id = ? OR code = ?", [
      isActive,
      id,
      id,
    ]);

    return NextResponse.json({ success: true, message: "Promotion status updated" });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Failed to update promotion", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    await pool.query("DELETE FROM promotions WHERE id = ? OR code = ?", [id, id]);

    return NextResponse.json({ success: true, message: "Promotion deleted successfully" });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Failed to delete promotion", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
