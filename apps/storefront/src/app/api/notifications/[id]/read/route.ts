import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { getAdminFromRequest, getCustomerFromRequest } from "@/lib/auth-token";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminFromRequest(request);
    const customer = await getCustomerFromRequest(request);

    if (!admin && !customer) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { id } = await params;
    const pool = getDbPool();

    if (!admin && customer) {
      const [res]: any = await pool.query(
        "UPDATE notifications SET is_read = 1 WHERE id = ? AND recipient_type = 'customer' AND (recipient_id = ? OR recipient_id = ?)",
        [id, customer.email, customer.id]
      );
      if (res.affectedRows === 0) {
        return NextResponse.json({ error: "Notification not found or unauthorized" }, { status: 404 });
      }
    } else {
      await pool.query("UPDATE notifications SET is_read = 1 WHERE id = ?", [id]);
    }

    return NextResponse.json({ success: true, message: "Notification marked as read" });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
