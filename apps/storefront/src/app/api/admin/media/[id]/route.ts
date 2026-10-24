import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth-token";

export const dynamic = "force-dynamic";

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

    await pool.query("DELETE FROM media_assets WHERE id = ?", [id]);
    return NextResponse.json({ success: true, message: `Media ${id} deleted` });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to delete media", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
