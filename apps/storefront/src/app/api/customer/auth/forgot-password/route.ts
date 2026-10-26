import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { getDbPool } from "@/lib/db";
import { dispatchCustomerPasswordReset } from "@/lib/notifications-dispatcher";

export const dynamic = "force-dynamic";

function getOriginUrl(request: Request): string {
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") || "https";
  if (host) {
    return `${proto}://${host}`;
  }
  return process.env.NEXT_PUBLIC_STOREFRONT_URL || "https://sanfurniture.co.uk";
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = (body.email || "").trim().toLowerCase();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    const pool = getDbPool();
    const [rows]: any = await pool.query(
      "SELECT id, email, first_name, last_name FROM customers WHERE email = ? LIMIT 1",
      [email]
    );

    // Constant-time UX: Always return generic success to prevent email enumeration
    const genericSuccessResponse = {
      success: true,
      message:
        "If an account exists for this email address, password reset instructions have been dispatched.",
    };

    if (!rows || rows.length === 0) {
      return NextResponse.json(genericSuccessResponse);
    }

    const customer = rows[0];

    // Invalidate existing unused reset tokens for this customer
    await pool.query(
      "UPDATE customer_password_resets SET used_at = NOW() WHERE customer_id = ? AND used_at IS NULL",
      [customer.id]
    );

    // Generate cryptographically secure token & SHA-256 hash
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const resetId = `cpr_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour TTL

    await pool.query(
      `INSERT INTO customer_password_resets (id, customer_id, email, token_hash, expires_at)
       VALUES (?, ?, ?, ?, ?)`,
      [resetId, customer.id, customer.email, tokenHash, expiresAt]
    );

    // Build reset link
    const origin = getOriginUrl(request);
    const resetUrl = `${origin}/account/reset-password?token=${rawToken}&email=${encodeURIComponent(customer.email)}`;

    // Dispatch luxury branded email
    await dispatchCustomerPasswordReset({
      email: customer.email,
      firstName: customer.first_name,
      resetUrl,
      expiresInMinutes: 60,
    });

    return NextResponse.json(genericSuccessResponse);
  } catch (err: any) {
    console.error("[Customer Forgot Password API Error]:", err);
    return NextResponse.json(
      { success: false, error: "Service error processing password reset request." },
      { status: 500 }
    );
  }
}
