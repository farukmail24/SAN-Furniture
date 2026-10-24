import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth-token";
import { dispatchOrderStatusChanged } from "@/lib/notifications-dispatcher";

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
    const pool = getDbPool();
    const body = await request.json();

    const { status } = body;
    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 });
    }

    await pool.query(
      "UPDATE orders SET fulfillment_status = ? WHERE id = ? OR order_number = ?",
      [status, id, id]
    );

    // Fire-and-forget notification dispatch (guarded: immediately returns if email/sms disabled in admin)
    const [orderRows]: any = await pool.query(
      "SELECT id, order_number, customer_email, customer_name, customer_phone FROM orders WHERE id = ? OR order_number = ? LIMIT 1",
      [id, id]
    );
    if (orderRows && orderRows.length > 0) {
      const o = orderRows[0];
      dispatchOrderStatusChanged({
        orderNumber: o.order_number,
        customerName: o.customer_name,
        customerEmail: o.customer_email,
        customerPhone: o.customer_phone,
        newStatus: status,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Order status updated to ${status}`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Failed to update order status", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
