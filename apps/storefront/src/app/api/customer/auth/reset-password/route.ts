import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { getDbPool } from "@/lib/db";
import { hashPassword } from "@/lib/auth-token";
import { dispatchCustomerPasswordChanged } from "@/lib/notifications-dispatcher";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const token = (body.token || "").trim();
    const email = (body.email || "").trim().toLowerCase();
    const password = (body.password || "").trim();

    if (!token || !email) {
      return NextResponse.json(
        { success: false, error: "Reset token and email address are required." },
        { status: 400 }
      );
    }

    if (!password || password.length < 8) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const pool = getDbPool();

    const [rows]: any = await pool.query(
      `SELECT id, customer_id, expires_at, used_at 
       FROM customer_password_resets 
       WHERE token_hash = ? AND email = ? AND used_at IS NULL 
       ORDER BY created_at DESC LIMIT 1`,
      [tokenHash, email]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid or expired password reset link. Please request a new password reset.",
        },
        { status: 400 }
      );
    }

    const resetRecord = rows[0];
    const now = new Date();
    const expiresAt = new Date(resetRecord.expires_at);

    if (now > expiresAt) {
      return NextResponse.json(
        {
          success: false,
          error: "This password reset link has expired. Please submit a new request.",
        },
        { status: 400 }
      );
    }

    // Hash new password using PBKDF2 (100k rounds SHA-512)
    const newPasswordHash = hashPassword(password);

    // Update customer password
    await pool.query(
      "UPDATE customers SET password_hash = ? WHERE id = ?",
      [newPasswordHash, resetRecord.customer_id]
    );

    // Mark current reset token as used and invalidate others
    await pool.query(
      "UPDATE customer_password_resets SET used_at = NOW() WHERE id = ? OR customer_id = ?",
      [resetRecord.id, resetRecord.customer_id]
    );

    // Get customer first name for confirmation email
    const [custRows]: any = await pool.query(
      "SELECT first_name FROM customers WHERE id = ? LIMIT 1",
      [resetRecord.customer_id]
    );
    const firstName = custRows?.[0]?.first_name || "";

    // Dispatch security confirmation email
    await dispatchCustomerPasswordChanged({
      email,
      firstName,
    });

    return NextResponse.json({
      success: true,
      message: "Your password has been successfully reset. You can now sign in with your new password.",
    });
  } catch (err: any) {
    console.error("[Customer Reset Password API Error]:", err);
    return NextResponse.json(
      { success: false, error: "Service error updating your password. Please try again." },
      { status: 500 }
    );
  }
}
