import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { signAuthToken, verifyPassword } from "@/lib/auth-token";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = (body.email || "").trim().toLowerCase();
    const password = (body.password || "").trim();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email address and password are required" },
        { status: 400 }
      );
    }

    const pool = getDbPool();
    const [rows]: any = await pool.query(
      "SELECT id, email, username, password_hash, first_name, last_name, phone FROM customers WHERE email = ? LIMIT 1",
      [email]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Invalid login credentials. Please check your email and password." },
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
