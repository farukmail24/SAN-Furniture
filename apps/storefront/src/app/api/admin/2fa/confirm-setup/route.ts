import { NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/auth-token";
import { getDbPool } from "@/lib/db";
import {
  verifyTOTP,
  generateRecoveryCodes,
  hashRecoveryCode,
} from "@/lib/two-factor-auth";
import { getClientIp } from "@/lib/security-guard";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const method = (body.method || "app").toLowerCase(); // 'app' | 'email'
    const code = (body.code || "").trim();

    if (!code) {
      return NextResponse.json({ error: "Please enter the 6-digit confirmation code." }, { status: 400 });
    }

    const pool = getDbPool();
    const [rows]: any = await pool.query(
      `SELECT id, email, two_factor_temp_secret, email_otp_code, email_otp_expires_at
       FROM admin_users WHERE id = ?`,
      [admin.id]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    const user = rows[0];
    let isCodeValid = false;

    if (method === "email") {
      const storedOtp = user.email_otp_code;
      const expiresAt = user.email_otp_expires_at ? new Date(user.email_otp_expires_at).getTime() : 0;
      if (storedOtp && storedOtp === code && Date.now() < expiresAt) {
        isCodeValid = true;
      }
    } else {
      // Authenticator App
      const tempSecret = user.two_factor_temp_secret;
      if (!tempSecret) {
        return NextResponse.json(
          { error: "Setup session expired. Please regenerate the QR code and try again." },
          { status: 400 }
        );
      }
      isCodeValid = verifyTOTP(tempSecret, code, 1);
    }

    if (!isCodeValid) {
      return NextResponse.json(
        { error: "Incorrect verification code. Please check and try again." },
        { status: 400 }
      );
    }

    // Generate 8 new backup recovery codes
    const recoveryCodes = generateRecoveryCodes(8);
    const hashedCodes = recoveryCodes.map(hashRecoveryCode);

    if (method === "email") {
      await pool.query(
        `UPDATE admin_users 
         SET two_factor_enabled = 1,
             two_factor_method = 'email',
             email_otp_code = NULL,
             email_otp_expires_at = NULL,
             two_factor_recovery_codes = ?,
             two_factor_verified_at = NOW()
         WHERE id = ?`,
        [JSON.stringify(hashedCodes), admin.id]
      );
    } else {
      await pool.query(
        `UPDATE admin_users 
         SET two_factor_enabled = 1,
             two_factor_method = 'app',
             two_factor_secret = two_factor_temp_secret,
             two_factor_temp_secret = NULL,
             two_factor_recovery_codes = ?,
             two_factor_verified_at = NOW()
         WHERE id = ?`,
        [JSON.stringify(hashedCodes), admin.id]
      );
    }

    const clientIp = getClientIp(request);
    await pool.query(
      "INSERT INTO admin_audit_logs (id, actor, action, resource, details_json, ip_address) VALUES (?, ?, ?, ?, ?, ?)",
      [
        `log_${Date.now()}`,
        admin.email,
        "ADMIN_2FA_ACTIVATED",
        "admin_users",
        JSON.stringify({ method }),
        clientIp,
      ]
    ).catch(() => {});

    return NextResponse.json({
      success: true,
      message: `Two-Factor Authentication via ${method === "app" ? "Authenticator App" : "Email"} successfully activated.`,
      method,
      recoveryCodes, // Send raw recovery codes only once so the user can save them
    });
  } catch (err: any) {
    console.error("[2FA Confirm Error]:", err);
    return NextResponse.json({ error: "Failed to confirm 2FA setup. Please try again." }, { status: 500 });
  }
}
