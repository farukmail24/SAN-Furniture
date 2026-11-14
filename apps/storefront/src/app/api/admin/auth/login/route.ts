import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { signAuthToken, verifyPassword } from "@/lib/auth-token";
import { getClientIp, checkIpSecurity, recordFailedAuth, recordSuccessfulAuth } from "@/lib/security-guard";
import { ensure2FASchema } from "@/lib/ensure-2fa-schema";
import { sign2FATicket, maskEmail, generateEmailOTP, send2FAEmailCode } from "@/lib/two-factor-auth";

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
    const email = (body.email || "").trim().toLowerCase();
    const password = (body.password || "").trim();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Auto-verify 2FA schema integrity
    await ensure2FASchema().catch(() => {});

    const pool = getDbPool();
    const [rows]: any = await pool.query(
      `SELECT id, email, password_hash, full_name, role, is_active,
              two_factor_enabled, two_factor_method, two_factor_secret
       FROM admin_users WHERE email = ?`,
      [email]
    );

    if (!rows || rows.length === 0 || !rows[0].is_active) {
      await recordFailedAuth(clientIp, "failed_admin_login");
      return NextResponse.json(
        { error: "Invalid admin credentials" },
        { status: 401 }
      );
    }

    const user = rows[0];
    const isPasswordValid = verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      await recordFailedAuth(clientIp, "failed_admin_login");
      return NextResponse.json(
        { error: "Invalid admin credentials" },
        { status: 401 }
      );
    }

    await recordSuccessfulAuth(clientIp);

    // =========================================================================
    // 2FA INTERCEPTION: If Two-Factor is enabled, require Step 2 challenge
    // =========================================================================
    if (user.two_factor_enabled) {
      const ticket = sign2FATicket(user.id, user.email);
      const activeMethod: "app" | "email" = user.two_factor_method === "email" ? "email" : "app";

      // If user uses email OTP, dispatch code immediately
      if (activeMethod === "email") {
        const otpCode = generateEmailOTP();
        await pool.query(
          "UPDATE admin_users SET email_otp_code = ?, email_otp_expires_at = DATE_ADD(NOW(), INTERVAL 10 MINUTE) WHERE id = ?",
          [otpCode, user.id]
        );
        // Dispatch in background
        send2FAEmailCode(user.email, user.full_name, otpCode, clientIp).catch((e) => {
          console.error("[2FA Email Dispatch Failed]:", e);
        });
      }

      return NextResponse.json({
        success: true,
        require2FA: true,
        twoFactorTicket: ticket,
        method: activeMethod,
        maskedEmail: maskEmail(user.email),
        canSwitchMethod: Boolean(user.two_factor_secret && user.email),
        message:
          activeMethod === "email"
            ? `A 6-digit verification code has been dispatched to ${maskEmail(user.email)}`
            : "Please enter the 6-digit verification code from your Authenticator app",
      });
    }

    // =========================================================================
    // STANDARD LOGIN (If 2FA is not yet configured for this user)
    // =========================================================================
    await pool.query("UPDATE admin_users SET last_login_at = NOW() WHERE id = ?", [user.id]).catch(() => {});

    const token = signAuthToken("adm", user.id);

    await pool.query(
      "INSERT INTO admin_audit_logs (id, actor, action, resource, details_json, ip_address) VALUES (?, ?, ?, ?, ?, ?)",
      [`log_${Date.now()}`, user.email, "ADMIN_LOGIN", "admin_users", JSON.stringify({ role: user.role }), clientIp]
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
    console.error("[Admin Login Route Error]:", err);
    return NextResponse.json(
      { error: "Authentication service error. Please try again or verify database connectivity." },
      { status: 500 }
    );
  }
}
