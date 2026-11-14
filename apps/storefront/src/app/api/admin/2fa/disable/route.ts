import { NextResponse } from "next/server";
import { getAdminFromRequest, verifyPassword } from "@/lib/auth-token";
import { getDbPool } from "@/lib/db";
import { getClientIp } from "@/lib/security-guard";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const password = (body.password || "").trim();

    if (!password) {
      return NextResponse.json(
        { error: "Please enter your staff master password to confirm disabling 2FA." },
        { status: 400 }
      );
    }

    const pool = getDbPool();
    const [rows]: any = await pool.query(
      "SELECT password_hash FROM admin_users WHERE id = ?",
      [admin.id]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: "Admin account not found" }, { status: 404 });
    }

    const isPasswordValid = verifyPassword(password, rows[0].password_hash);
    if (!isPasswordValid) {
      return NextResponse.json({ error: "Incorrect password. 2FA cannot be disabled." }, { status: 403 });
    }

    await pool.query(
      `UPDATE admin_users 
       SET two_factor_enabled = 0,
           two_factor_secret = NULL,
           two_factor_temp_secret = NULL,
           email_otp_code = NULL,
           email_otp_expires_at = NULL,
           two_factor_recovery_codes = NULL
       WHERE id = ?`,
      [admin.id]
    );

    const clientIp = getClientIp(request);
    await pool.query(
      "INSERT INTO admin_audit_logs (id, actor, action, resource, details_json, ip_address) VALUES (?, ?, ?, ?, ?, ?)",
      [
        `log_${Date.now()}`,
        admin.email,
        "ADMIN_2FA_DISABLED",
        "admin_users",
        JSON.stringify({ disabledBy: admin.email }),
        clientIp,
      ]
    ).catch(() => {});

    return NextResponse.json({
      success: true,
      message: "Two-Factor Authentication has been disabled for your account.",
    });
  } catch (err: any) {
    console.error("[2FA Disable Error]:", err);
    return NextResponse.json({ error: "Failed to disable 2FA. Please try again." }, { status: 500 });
  }
}
