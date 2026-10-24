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

    const pool = getDbPool();
    const [customers]: any = await pool.query(`
      SELECT 
        c.id, c.email, c.first_name, c.last_name, c.phone, c.created_at,
        COUNT(DISTINCT o.id) AS orders_count,
        COALESCE(SUM(o.total_pennies), 0) AS total_spend_pennies,
        MAX(o.created_at) AS last_order_at,
        COALESCE(MIN(a.postcode), 'N/A') AS postcode,
        COALESCE(MIN(a.city), 'N/A') AS city
      FROM customers c
      LEFT JOIN orders o ON c.email = o.customer_email
      LEFT JOIN customer_addresses a ON c.id = a.customer_id AND a.is_default_delivery = 1
      GROUP BY c.id, c.email, c.first_name, c.last_name, c.phone, c.created_at
      ORDER BY c.created_at DESC
    `);

    return NextResponse.json({
      success: true,
      customers: Array.isArray(customers) ? customers : [],
    });
  } catch (err: any) {
    console.error("Failed to fetch admin customers:", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch customers", details: err?.message || String(err) },
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
    const { firstName, lastName, email, phone, addressLine1, city, postcode } = body;

    if (!email) {
      return NextResponse.json({ error: "Customer email is required" }, { status: 400 });
    }

    const customerId = `cust_${crypto.randomBytes(6).toString("hex")}`;
    const username = email.split("@")[0] + "_" + Math.floor(100 + Math.random() * 900);

    await pool.query(
      `INSERT INTO customers (id, email, username, password_hash, first_name, last_name, phone, created_at)
       VALUES (?, ?, ?, 'manual_crm_unhashed', ?, ?, ?, NOW())`,
      [customerId, email, username, firstName || "", lastName || "", phone || ""]
    );

    if (addressLine1 || postcode) {
      const addressId = `addr_${Date.now()}`;
      await pool.query(
        `INSERT INTO customer_addresses (
          id, customer_id, label, recipient, address_line1, city, postcode, phone,
          country, is_default_delivery, is_default_billing, created_at
        ) VALUES (?, ?, 'Primary Residence', ?, ?, ?, ?, ?, 'United Kingdom', 1, 1, NOW())`,
        [
          addressId,
          customerId,
          `${firstName || ""} ${lastName || ""}`.trim() || "Customer",
          addressLine1 || "London",
          city || "London",
          postcode || "SW1A 1AA",
          phone || "",
        ]
      );
    }

    return NextResponse.json({
      success: true,
      message: "Customer created successfully",
      customerId,
    });
  } catch (err: any) {
    console.error("Failed to create customer:", err);
    return NextResponse.json(
      { success: false, error: "Failed to create customer", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
