import { NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/auth-token";
import { getDbPool } from "@/lib/db";
import { ensure2FASchema } from "@/lib/ensure-2fa-schema";
import {
  generateBase32Secret,
  generateOtpauthUri,
  generateQRCodeDataUrl,
  generateEmailOTP,
  send2FAEmailCode,
  maskEmail,
} from "@/lib/two-factor-auth";
import { getClientIp } from "@/lib/security-guard";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensure2FASchema().catch(() => {});

    const body = await request.json().catch(() => ({}));
    const method = (body.method || "app").toLowerCase(); // 'app' | 'email'
    const pool = getDbPool();

    if (method === "email") {
      // 1. Setup Email 2FA
      const otpCode = generateEmailOTP();
      await pool.query(
        "UPDATE admin_users SET email_otp_code = ?, email_otp_expires_at = DATE_ADD(NOW(), INTERVAL 10 MINUTE) WHERE id = ?",
        [otpCode, admin.id]
      );

      const clientIp = getClientIp(request);
      await send2FAEmailCode(admin.email, admin.fullName, otpCode, clientIp);

      return NextResponse.json({
        success: true,
        method: "email",
        maskedEmail: maskEmail(admin.email),
        message: `A 6-digit confirmation code has been dispatched to ${maskEmail(admin.email)}.`,
      });
    }

    // 2. Setup Authenticator App (TOTP)
    const secret = generateBase32Secret(20);
    const otpauthUri = generateOtpauthUri(admin.email, secret, "SAN Furniture UK");
    const qrCodeDataUrl = await generateQRCodeDataUrl(otpauthUri);

    // Save temporary secret until verified
    await pool.query("UPDATE admin_users SET two_factor_temp_secret = ? WHERE id = ?", [secret, admin.id]);

    return NextResponse.json({
      success: true,
      method: "app",
      secret,
      qrCodeDataUrl,
      otpauthUri,
      formattedSecret: secret.match(/.{1,4}/g)?.join(" ") || secret,
    });
  } catch (err: any) {
    console.error("[2FA Setup Error]:", err);
    return NextResponse.json({ error: "Failed to initiate 2FA setup. Please try again." }, { status: 500 });
  }
}
