import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { signAuthToken, verifyPassword } from "@/lib/auth-token";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawIdentifier = (body.email || body.phone || body.identifier || "").trim();
    const password = (body.password || "").trim();

    if (!rawIdentifier || !password) {
      return NextResponse.json(
        { success: false, error: "Email address or mobile number and password are required" },
        { status: 400 }
      );
    }

    const emailCandidate = rawIdentifier.toLowerCase();
    const cleanInput = rawIdentifier.replace(/[\s\-\(\)\.]/g, "");
    const digitsOnly = rawIdentifier.replace(/\D/g, "");
    const last10Digits = digitsOnly.length >= 10 ? digitsOnly.slice(-10) : (digitsOnly.length >= 7 ? digitsOnly : "NOMATCH");

    const pool = getDbPool();
    const [rows]: any = await pool.query(
      `SELECT id, email, username, password_hash, first_name, last_name, phone 
       FROM customers 
       WHERE email = ? 
          OR username = ? 
          OR phone = ? 
          OR REPLACE(REPLACE(REPLACE(REPLACE(phone, ' ', ''), '-', ''), '(', ''), ')', '') = ?
          OR RIGHT(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(phone, ' ', ''), '-', ''), '(', ''), ')', ''), '+', ''), 10) = ?
       LIMIT 1`,
      [emailCandidate, rawIdentifier, rawIdentifier, cleanInput, last10Digits]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Invalid login credentials. Please check your email or mobile number and password." },
        { status: 401 }
      );
    }

    const customer = rows[0];
    const isPasswordValid = verifyPassword(password, customer.password_hash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: "Invalid login credentials. Please check your email and password." },
        { status: 401 }
      );
    }

    const token = signAuthToken("cust", customer.id);

    const response = NextResponse.json({
      success: true,
      token,
      customer: {
        id: customer.id,
        email: customer.email,
        username: customer.username || customer.email.split("@")[0],
        firstName: customer.first_name,
        lastName: customer.last_name,
        phone: customer.phone,
      },
    });

    response.cookies.set("san_customer_token", token, {
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      sameSite: "lax",
      httpOnly: false,
    });

    return response;
  } catch (err: any) {
    console.error("[Customer Login Route Error]:", err);
    return NextResponse.json(
      { success: false, error: "Authentication service error. Please try again later." },
      { status: 500 }
    );
  }
}
