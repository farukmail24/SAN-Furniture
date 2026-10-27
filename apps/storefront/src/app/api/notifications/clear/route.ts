import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { getAdminFromRequest, getCustomerFromRequest } from "@/lib/auth-token";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const admin = await getAdminFromRequest(request);
    const customer = await getCustomerFromRequest(request);

    if (!admin && !customer) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const pool = getDbPool();
    const body = await request.json().catch(() => ({}));

    if (!admin && customer) {
      // Customer can ONLY clear their own notifications
      await pool.query(
        "DELETE FROM notifications WHERE recipient_type = 'customer' AND (recipient_id = ? OR recipient_id = ?)",
        [customer.email, customer.id]
      );
    } else {
      // Admin can clear admin notifications or specific recipient
      const recipientType = body.recipient_type || "admin";
      if (body.recipient_id) {
        await pool.query(
          "DELETE FROM notifications WHERE recipient_type = ? AND recipient_id = ?",
          [recipientType, body.recipient_id]
        );
      } else {
        await pool.query(
          "DELETE FROM notifications WHERE recipient_type = ?",
          [recipientType]
        );
      }
    }

    return NextResponse.json({ success: true, message: "Notifications cleared" });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
