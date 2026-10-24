import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { getCustomerFromRequest } from "@/lib/auth-token";
import crypto from "node:crypto";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const queryEmail = (searchParams.get("email") || "").trim().toLowerCase();

    const authCust = await getCustomerFromRequest(request);
    const targetEmail = authCust?.email || queryEmail;

    if (!targetEmail) {
      return NextResponse.json(
        { success: false, error: "Authentication required to view addresses", addresses: [] },
        { status: 401 }
      );
    }

    const pool = getDbPool();

    // Find customer ID by email
    const [custRows]: any = await pool.query(
      "SELECT id FROM customers WHERE LOWER(email) = ? LIMIT 1",
      [targetEmail]
    );

    if (!custRows || custRows.length === 0) {
      return NextResponse.json({ success: true, addresses: [] });
    }

    const customerId = custRows[0].id;

    const [rows]: any = await pool.query(
      "SELECT * FROM customer_addresses WHERE customer_id = ? ORDER BY is_default_delivery DESC, created_at DESC",
      [customerId]
    );

    const addresses = (Array.isArray(rows) ? rows : []).map((a: any) => ({
      id: a.id,
      label: a.label || "Delivery Address",
      recipient: a.recipient,
      company: a.company,
      addressLine1: a.address_line1,
      addressLine2: a.address_line2,
      city: a.city,
      county: a.county,
      postcode: a.postcode,
      phone: a.phone,
      country: a.country || "United Kingdom",
      accessNotes: a.access_notes,
      isDefaultDelivery: Boolean(a.is_default_delivery),
      isDefaultBilling: Boolean(a.is_default_billing),
    }));

    return NextResponse.json({
      success: true,
      addresses,
      total: addresses.length,
    });
  } catch (err: any) {
    console.error("[Customer Addresses Route Error]:", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch customer addresses", details: err?.message || String(err), addresses: [] },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      email,
      label = "Home",
      recipient,
      company,
      addressLine1,
      addressLine2,
      city,
      county,
      postcode,
      phone,
      accessNotes,
      isDefaultDelivery = false,
      isDefaultBilling = false,
    } = body;

    const authCust = await getCustomerFromRequest(request);
    const targetEmail = authCust?.email || email;

    if (!targetEmail) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    if (!addressLine1 || !postcode || !city) {
      return NextResponse.json(
        { success: false, error: "Address line 1, city, and UK postcode are required." },
        { status: 400 }
      );
    }

    const pool = getDbPool();
    const [custRows]: any = await pool.query(
      "SELECT id FROM customers WHERE LOWER(email) = ? LIMIT 1",
      [targetEmail.toLowerCase()]
    );

    if (!custRows || custRows.length === 0) {
      return NextResponse.json({ success: false, error: "Customer record not found" }, { status: 404 });
    }

    const customerId = custRows[0].id;
    const addrId = `addr_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;

    if (isDefaultDelivery) {
      await pool.query(
        "UPDATE customer_addresses SET is_default_delivery = 0 WHERE customer_id = ?",
        [customerId]
      );
    }

    await pool.query(
      `INSERT INTO customer_addresses (
        id, customer_id, label, recipient, company, address_line1, address_line2, city, county, postcode, phone, country, access_notes, is_default_delivery, is_default_billing, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'United Kingdom', ?, ?, ?, NOW())`,
      [
        addrId,
        customerId,
        label,
        recipient || null,
        company || null,
        addressLine1,
        addressLine2 || null,
        city,
        county || null,
        postcode.toUpperCase(),
        phone || null,
        accessNotes || null,
        isDefaultDelivery ? 1 : 0,
        isDefaultBilling ? 1 : 0,
      ]
    );

    return NextResponse.json({
      success: true,
      message: "Address added successfully",
      addressId: addrId,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Failed to add address", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
