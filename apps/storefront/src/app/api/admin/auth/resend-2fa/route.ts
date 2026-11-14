import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { getClientIp, checkIpSecurity } from "@/lib/security-guard";
import {
  verify2FATicket,
  generateEmailOTP,
  send2FAEmailCode,
  maskEmail,
} from "@/lib/two-factor-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);
    const securityCheck = await checkIpSecurity(clientIp);
    if (!securityCheck.allowed) {
      return NextResponse.json(
        { error: securityCheck.message || "Too many attempts. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const ticket = (body.ticket || "").trim();

    if (!ticket) {
      return NextResponse.json({ error: "Verification ticket is missing." }, { status: 400 });
    }

    const ticketResult = verify2FATicket(ticket);
    if (!ticketResult.valid || !ticketResult.userId) {
      return NextResponse.json(
        { error: ticketResult.error || "Session ticket expired. Please log in again." },
        { status: 401 }
      );
    }

    const pool = getDbPool();
    const [rows]: any = await pool.query(
      "SELECT id, email, full_name, is_active FROM admin_users WHERE id = ?",
      [ticketResult.userId]
    );

    if (!rows || rows.length === 0 || !rows[0].is_active) {
      return NextResponse.json({ error: "Staff account not found or suspended." }, { status: 401 });
    }

    const user = rows[0];

    // Generate new OTP
    const newOtp = generateEmailOTP();
    await pool.query(
      "UPDATE admin_users SET email_otp_code = ?, email_otp_expires_at = DATE_ADD(NOW(), INTERVAL 10 MINUTE) WHERE id = ?",
      [newOtp, user.id]
    );

    // Send email
    await send2FAEmailCode(user.email, user.full_name, newOtp, clientIp);

    return NextResponse.json({
      success: true,
      message: `A fresh 6-digit verification code has been dispatched to ${maskEmail(user.email)}.`,
    });
  } catch (err: any) {
    console.error("[Resend 2FA Route Error]:", err);
    return NextResponse.json(
      { error: "Failed to dispatch verification email. Please check SMTP settings or try again." },
      { status: 500 }
    );
  }
}
