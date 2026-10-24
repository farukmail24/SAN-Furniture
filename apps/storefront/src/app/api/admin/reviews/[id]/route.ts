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

    await pool.query("DELETE FROM customer_reviews WHERE id = ?", [id]);

    return NextResponse.json({ success: true, message: "Review deleted successfully" });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Failed to delete review", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
