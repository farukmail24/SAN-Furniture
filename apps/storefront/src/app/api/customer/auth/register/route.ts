import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { signAuthToken, hashPassword } from "@/lib/auth-token";
import crypto from "node:crypto";
import { dispatchCustomerRegistered } from "@/lib/notifications-dispatcher";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = (body.email || "").trim().toLowerCase();
    const username = (body.username || "").trim() || email.split("@")[0];
    const password = (body.password || "").trim();
    const firstName = (body.firstName || "").trim();
    const lastName = (body.lastName || "").trim();
    const phone = (body.phone || "").trim();
    const addressLine1 = (body.addressLine1 || "").trim();
    const city = (body.city || "").trim();
    const postcode = (body.postcode || "").trim().toUpperCase();

    if (!email || !password || !firstName || !lastName || !phone) {
      return NextResponse.json(
        { success: false, error: "First name, last name, email, password, and mobile number are mandatory." },
        { status: 400 }
      );
    }

    const cleanPhone = phone.replace(/[\s\-\(\)]/g, "");
    if (cleanPhone.length < 10) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid UK mobile or telephone number (at least 10 digits) for delivery notifications." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    const pool = getDbPool();

    // Check if email already registered
    const [existing]: any = await pool.query(
      "SELECT id FROM customers WHERE email = ? LIMIT 1",
      [email]
    );

    if (existing && existing.length > 0) {
      return NextResponse.json(
        { success: false, error: "An account with this email address already exists. Please sign in instead." },
        { status: 409 }
      );
    }

    const customerId = `cust_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
    const passwordHashed = hashPassword(password);

    await pool.query(
      `INSERT INTO customers (id, email, username, password_hash, first_name, last_name, phone, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [customerId, email, username, passwordHashed, firstName, lastName, phone]
    );

    // Save default address if supplied
    if (addressLine1 && postcode) {
      const addrId = `addr_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
      await pool.query(
        `INSERT INTO customer_addresses (id, customer_id, label, recipient, address_line1, city, postcode, phone, is_default_delivery, is_default_billing, created_at)
         VALUES (?, ?, 'Primary Delivery Address', ?, ?, ?, ?, ?, 1, 1, NOW())`,
        [addrId, customerId, `${firstName} ${lastName}`, addressLine1, city || "London", postcode, phone]
      ).catch(() => {});
    }

    const token = signAuthToken("cust", customerId);

    // Fire-and-forget notification dispatch (guarded: immediately returns if email/sms disabled in admin)
    dispatchCustomerRegistered({
      email,
      firstName,
      lastName,
      phone,
    });

    const response = NextResponse.json({
      success: true,
      token,
      customer: {
        id: customerId,
        email,
        username,
        firstName,
        lastName,
        phone,
      },
    });

    response.cookies.set("san_customer_token", token, {
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
      sameSite: "lax",
      httpOnly: false,
    });

    return response;
  } catch (err: any) {
    console.error("[Customer Register Route Error]:", err);
    return NextResponse.json(
      { success: false, error: "Registration service error. Please try again later." },
      { status: 500 }
    );
  }
}
