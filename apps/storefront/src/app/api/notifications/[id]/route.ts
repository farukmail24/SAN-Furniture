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

    let targetStatus: number | null = null;
    try {
      const body = await request.json();
      if (typeof body.is_read === "number" || typeof body.is_read === "boolean") {
        targetStatus = body.is_read ? 1 : 0;
      }
    } catch {}

    if (!admin && customer) {
      // Customer can toggle only their own notification
      const sql =
        targetStatus !== null
          ? "UPDATE notifications SET is_read = ? WHERE id = ? AND recipient_type = 'customer' AND (recipient_id = ? OR recipient_id = ?)"
          : "UPDATE notifications SET is_read = IF(is_read = 1, 0, 1) WHERE id = ? AND recipient_type = 'customer' AND (recipient_id = ? OR recipient_id = ?)";
      const queryParams =
        targetStatus !== null
          ? [targetStatus, id, customer.email, customer.id]
          : [id, customer.email, customer.id];

      const [res]: any = await pool.query(sql, queryParams);
      if (res.affectedRows === 0) {
        return NextResponse.json({ error: "Notification not found or unauthorized" }, { status: 404 });
      }
    } else {
      // Admin
      if (targetStatus !== null) {
        await pool.query("UPDATE notifications SET is_read = ? WHERE id = ?", [targetStatus, id]);
      } else {
        await pool.query("UPDATE notifications SET is_read = IF(is_read = 1, 0, 1) WHERE id = ?", [id]);
      }
    }

    return NextResponse.json({ success: true, message: "Notification read state toggled" });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(
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
      // Customer can only delete their own notification
      const [res]: any = await pool.query(
        "DELETE FROM notifications WHERE id = ? AND recipient_type = 'customer' AND (recipient_id = ? OR recipient_id = ?)",
        [id, customer.email, customer.id]
      );
      if (res.affectedRows === 0) {
        return NextResponse.json({ error: "Notification not found or unauthorized" }, { status: 404 });
      }
    } else {
      // Admin
      await pool.query("DELETE FROM notifications WHERE id = ?", [id]);
    }

    return NextResponse.json({ success: true, message: "Notification deleted" });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
