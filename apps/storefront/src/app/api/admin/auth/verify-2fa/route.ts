import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { signAuthToken } from "@/lib/auth-token";
import { getClientIp, checkIpSecurity, recordFailedAuth, recordSuccessfulAuth } from "@/lib/security-guard";
import {
  verify2FATicket,
  verifyTOTP,
  verifyAndConsumeRecoveryCode,
} from "@/lib/two-factor-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);
    const securityCheck = await checkIpSecurity(clientIp);
    if (!securityCheck.allowed) {
      return NextResponse.json(
        { error: securityCheck.message || "Too many authentication attempts. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const ticket = (body.ticket || "").trim();
    const code = (body.code || "").trim();
    const method = (body.method || "app").toLowerCase(); // 'app' | 'email' | 'recovery'

    if (!ticket) {
      return NextResponse.json(
        { error: "Verification ticket is missing. Please restart your login." },
        { status: 400 }
      );
    }

    if (!code) {
      return NextResponse.json(
        { error: "Verification code is required." },
        { status: 400 }
      );
    }

    // 1. Validate Ticket
    const ticketResult = verify2FATicket(ticket);
    if (!ticketResult.valid || !ticketResult.userId) {
      await recordFailedAuth(clientIp, "failed_2fa_ticket");
      return NextResponse.json(
        { error: ticketResult.error || "Session ticket expired or invalid. Please log in again." },
        { status: 401 }
      );
    }

    const pool = getDbPool();
    const [rows]: any = await pool.query(
      `SELECT id, email, full_name, role, is_active,
              two_factor_enabled, two_factor_method, two_factor_secret,
              email_otp_code, email_otp_expires_at, two_factor_recovery_codes
       FROM admin_users WHERE id = ?`,
      [ticketResult.userId]
    );

    if (!rows || rows.length === 0 || !rows[0].is_active) {
      return NextResponse.json({ error: "Staff account suspended or not found." }, { status: 401 });
    }

    const user = rows[0];
    let isCodeValid = false;
    let authMethodUsed = method;

    // 2. Validate based on selected method
    if (method === "recovery") {
      // Validate backup recovery code
      let storedCodes: string[] = [];
      try {
        storedCodes = user.two_factor_recovery_codes ? JSON.parse(user.two_factor_recovery_codes) : [];
      } catch {
        storedCodes = [];
      }

      const recoveryCheck = verifyAndConsumeRecoveryCode(code, storedCodes);
      if (recoveryCheck.valid) {
        isCodeValid = true;
        authMethodUsed = "recovery_code";
        // Update remaining recovery codes in DB
        await pool.query("UPDATE admin_users SET two_factor_recovery_codes = ? WHERE id = ?", [
          JSON.stringify(recoveryCheck.remainingHashedCodes),
          user.id,
        ]);
      }
    } else if (method === "email") {
      // Validate Email OTP
      const storedOtp = user.email_otp_code;
      const expiresAt = user.email_otp_expires_at ? new Date(user.email_otp_expires_at).getTime() : 0;
      const now = Date.now();

      if (storedOtp && storedOtp === code && now < expiresAt) {
        isCodeValid = true;
        authMethodUsed = "email_otp";
      }
    } else {
      // Default: Authenticator App (TOTP)
      if (user.two_factor_secret) {
        isCodeValid = verifyTOTP(user.two_factor_secret, code, 1);
        authMethodUsed = "totp_app";
      }
    }

    if (!isCodeValid) {
      await recordFailedAuth(clientIp, "failed_2fa_code");
      return NextResponse.json(
        {
          error:
            method === "recovery"
              ? "Invalid backup recovery code. Please check and try again."
              : method === "email"
              ? "Incorrect or expired email verification code."
              : "Invalid 6-digit authenticator code. Ensure your device clock is synced.",
        },
        { status: 401 }
      );
    }

    // 3. Code is valid! Complete Authentication
    await recordSuccessfulAuth(clientIp);

    // Clear one-time email OTP
    await pool.query(
      "UPDATE admin_users SET email_otp_code = NULL, email_otp_expires_at = NULL, last_login_at = NOW() WHERE id = ?",
      [user.id]
    );

    // Sign official admin token
    const token = signAuthToken("adm", user.id);

    // Audit log
    await pool.query(
      "INSERT INTO admin_audit_logs (id, actor, action, resource, details_json, ip_address) VALUES (?, ?, ?, ?, ?, ?)",
      [
        `log_${Date.now()}`,
        user.email,
        "ADMIN_LOGIN_2FA_VERIFIED",
        "admin_users",
        JSON.stringify({ method: authMethodUsed, role: user.role }),
        clientIp,
      ]
    ).catch(() => {});

    const response = NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
      },
    });

    response.cookies.set("san_admin_token", token, {
      path: "/",
      maxAge: 86400,
      sameSite: "strict",
      httpOnly: true,
    });

    return response;
  } catch (err: any) {
    console.error("[Verify 2FA Route Error]:", err);
    return NextResponse.json(
      { error: "Two-Factor validation encountered an internal error. Please try again." },
      { status: 500 }
    );
  }
}
