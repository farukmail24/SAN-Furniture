import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth-token";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "100", 10), 500);

    const pool = getDbPool();
    const [rows]: any = await pool.query(
      `SELECT 
        o.id,
        o.order_number,
        o.customer_name,
        o.customer_email,
        o.customer_phone,
        o.shipping_address,
        o.shipping_postcode as postcode,
        o.shipping_postcode,
        o.shipping_zone,
        o.delivery_tier,
        o.delivery_slot,
        o.subtotal_pennies,
        o.shipping_pennies,
        o.vat_pennies,
        o.total_pennies,
        o.payment_status,
        o.fulfillment_status,
        o.cancellation_reason,
        o.cancelled_by,
        o.cancelled_at,
        COALESCE(NULLIF(o.fulfillment_status, ''), o.payment_status, 'po_dispatched') as status,
        o.items_json,
        o.billing_address,
        o.payment_method,
        o.created_at,
        po.po_number,
        po.carrier,
        po.tracking_number,
        po.status as po_status
      FROM orders o
      LEFT JOIN order_po_dispatches po ON o.id = po.order_id
      ORDER BY o.created_at DESC
      LIMIT ?`,
      [limit]
    );

    return NextResponse.json({
      success: true,
      orders: Array.isArray(rows) ? rows : [],
      total: Array.isArray(rows) ? rows.length : 0,
    });
  } catch (err: any) {
    console.error("Failed to fetch admin orders:", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch orders", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const pool = getDbPool();
    const body = await request.json();

    const orderId = `ord_manual_${Date.now()}`;
    const orderNumber = `SAN-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const itemsJson = JSON.stringify(body.items || []);
    const subtotal = Number(body.total_pennies) || 0;
    const vat = Math.round(subtotal * (20 / 120));

    await pool.query(
      `INSERT INTO orders (
        id, order_number, customer_name, customer_email, customer_phone,
        shipping_address, shipping_postcode, shipping_zone, delivery_tier,
        delivery_slot, subtotal_pennies, shipping_pennies, vat_pennies,
        total_pennies, payment_status, fulfillment_status, items_json, payment_method
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'paid', ?, ?, 'bacs_manual')`,
      [
        orderId,
        orderNumber,
        body.customer_name || "Valued Customer",
        body.customer_email || "sales@sanfurniture.com",
        body.customer_phone || "+44 20 7946 0912",
        body.shipping_address || "London, UK",
        body.postcode || body.shipping_postcode || "SW1A 1AA",
        body.shipping_zone || "mainland_uk",
        body.delivery_tier || "two_man_white_glove",
        body.delivery_slot || "Standard 3-5 Working Days",
        subtotal,
        0,
        vat,
        subtotal,
        body.status || "po_dispatched",
        itemsJson,
      ]
    );

    // Create PO dispatch record
    const poId = `po_${crypto.randomBytes(6).toString("hex")}`;
    const poNumber = `PO-${orderNumber}`;
    await pool.query(
      `INSERT INTO order_po_dispatches (
        id, po_number, order_id, supplier_id, item_count, delivery_tier,
        status, tracking_number, carrier
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        poId,
        poNumber,
        orderId,
        "sup_amos_mann",
        (body.items || []).length || 1,
        body.delivery_tier || "two_man_white_glove",
        body.status === "delivered" ? "delivered" : "dispatched",
        `TRK-${Math.floor(100000 + Math.random() * 900000)}`,
        body.carrier || "Amos Mann 2-Man Dedicated Fleet",
      ]
    );

    return NextResponse.json({
      success: true,
      message: "Manual order created successfully",
      orderId,
      orderNumber,
    });
  } catch (err: any) {
    console.error("Failed to create manual order:", err);
    return NextResponse.json(
      { success: false, error: "Failed to create order", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
