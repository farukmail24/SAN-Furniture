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
    const { status } = await request.json();
    const pool = getDbPool();

    await pool.query("UPDATE customer_reviews SET status = ? WHERE id = ?", [status, id]);

    return NextResponse.json({ success: true, message: `Review status changed to ${status}` });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Failed to update review status", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
