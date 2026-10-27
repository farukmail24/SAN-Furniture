import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { getCustomerFromRequest, getAdminFromRequest } from "@/lib/auth-token";
import { formatGBP } from "@san-furniture/types";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const rawPostcode = (searchParams.get("postcode") || "").trim().toUpperCase().replace(/\s+/g, "");

    const pool = getDbPool();

    // Query order by id or order_number
    const [orderRows]: any = await pool.query(
      `SELECT * FROM orders WHERE id = ? OR order_number = ? LIMIT 1`,
      [id, id]
    );

    if (!orderRows || orderRows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Order not found. Please verify your order number and retry." },
        { status: 404 }
      );
    }

    const order = orderRows[0];

    // Authorization Guard: Admins or the authenticated customer owning the order can track without postcode
    const authCust = await getCustomerFromRequest(request);
    const authAdmin = !authCust ? await getAdminFromRequest(request) : null;
    const isOwner = authCust && authCust.email?.toLowerCase() === (order.customer_email || "").toLowerCase();

    if (!authAdmin && !isOwner) {
      if (!rawPostcode) {
        return NextResponse.json(
          {
            success: false,
            error: "Delivery postcode verification is required to view order tracking details.",
          },
          { status: 401 }
        );
      }
      const orderPostcode = (order.shipping_postcode || "").toUpperCase().replace(/\s+/g, "");
      if (orderPostcode && !orderPostcode.startsWith(rawPostcode) && !rawPostcode.startsWith(orderPostcode)) {
        return NextResponse.json(
          {
            success: false,
            error: "The provided delivery postcode does not match the registered shipping address for this order.",
          },
          { status: 403 }
        );
      }
    }

    // Query fulfillment / carrier dispatch records
    const [dispatchRows]: any = await pool.query(
      `SELECT id, carrier, tracking_number, status, created_at FROM order_po_dispatches WHERE order_id = ? OR po_number = ?`,
      [order.id, order.id]
    ).catch(() => [[]]);

    let items: any[] = [];
    try {
      items = typeof order.items_json === "string" ? JSON.parse(order.items_json) : (order.items_json || []);
    } catch {
      items = [];
    }

    const subtotal = Number(order.subtotal_pennies) || 0;
    const shipping = Number(order.shipping_pennies) || 0;
    const vat = Number(order.vat_pennies) || 0;
    const total = Number(order.total_pennies) || (subtotal + shipping);

    const formattedOrder = {
      id: order.id,
      order_number: order.order_number,
      customer_name: order.customer_name,
      customer_email: order.customer_email,
      customer_phone: order.customer_phone,
      shipping_address: order.shipping_address,
      shipping_postcode: order.shipping_postcode,
      shipping_zone: order.shipping_zone || "Mainland UK",
      delivery_tier: order.delivery_tier || "two_man_white_glove",
      delivery_slot: order.delivery_slot,
      payment_status: order.payment_status || "paid",
      fulfillment_status: order.fulfillment_status || "po_dispatched",
      formattedSubtotal: formatGBP(subtotal),
      formattedShipping: formatGBP(shipping),
      formattedVat: formatGBP(vat),
      formattedTotal: formatGBP(total),
      items: items.map((it: any) => ({
        id: it.id || it.productId,
        productId: it.productId || it.id,
        title: it.title || it.name,
        name: it.title || it.name,
        quantity: it.quantity || 1,
        price_pennies: it.pricePennies || it.price_pennies,
        thumbnailUrl: it.thumbnailUrl,
      })),
      dispatches: (Array.isArray(dispatchRows) ? dispatchRows : []).map((d: any) => ({
        id: d.id,
        carrier: d.carrier || "SAN Dedicated Fleet",
        tracking_number: d.tracking_number || "TRK-SAN-DIRECT",
        status: d.status || "dispatched",
        created_at: String(d.created_at || order.created_at),
      })),
      created_at: String(order.created_at),
    };

    return NextResponse.json({
      success: true,
      order: formattedOrder,
    });
  } catch (err: any) {
    console.error("[API Order Track Error]:", err);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve order tracking details", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
