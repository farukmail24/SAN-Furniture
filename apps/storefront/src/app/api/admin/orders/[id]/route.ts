import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth-token";

export const dynamic = "force-dynamic";

export async function GET(
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

    const [rows]: any = await pool.query(
      `SELECT 
        o.*,
        o.shipping_postcode as postcode,
        COALESCE(NULLIF(o.fulfillment_status, ''), o.payment_status, 'po_dispatched') as status,
        po.po_number,
        po.carrier,
        po.tracking_number,
        po.status as po_status
      FROM orders o
      LEFT JOIN order_po_dispatches po ON o.id = po.order_id
      WHERE o.id = ? OR o.order_number = ?
      LIMIT 1`,
      [id, id]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, order: rows[0] });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch order", details: err?.message || String(err) },
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

    await pool.query("DELETE FROM order_po_dispatches WHERE order_id = ?", [id]);
    const [result]: any = await pool.query("DELETE FROM orders WHERE id = ? OR order_number = ?", [id, id]);

    return NextResponse.json({
      success: true,
      message: "Order deleted successfully",
      affectedRows: result?.affectedRows || 0,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Failed to delete order", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}

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

    const updates: string[] = [];
    const values: any[] = [];

    if (body.customer_name) {
      updates.push("customer_name = ?");
      values.push(body.customer_name);
    }
    if (body.customer_phone) {
      updates.push("customer_phone = ?");
      values.push(body.customer_phone);
    }
    if (body.shipping_address) {
      updates.push("shipping_address = ?");
      values.push(body.shipping_address);
    }
    if (body.postcode || body.shipping_postcode) {
      updates.push("shipping_postcode = ?");
      values.push(body.postcode || body.shipping_postcode);
    }
    if (body.delivery_tier) {
      updates.push("delivery_tier = ?");
      values.push(body.delivery_tier);
    }
    if (body.status || body.fulfillment_status) {
      updates.push("fulfillment_status = ?");
      values.push(body.status || body.fulfillment_status);
    }

    if (updates.length > 0) {
      values.push(id, id);
      await pool.query(
        `UPDATE orders SET ${updates.join(", ")} WHERE id = ? OR order_number = ?`,
        values
      );
    }

    return NextResponse.json({ success: true, message: "Order updated successfully" });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Failed to update order", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
