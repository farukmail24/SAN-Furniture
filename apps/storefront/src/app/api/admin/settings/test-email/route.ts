import { NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/auth-token";
import {
  getNotificationSettings,
  isEmailActive,
  sendRawEmail,
  invalidateNotificationSettingsCache,
} from "@/lib/notifications-dispatcher";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    invalidateNotificationSettingsCache();
    const settings = await getNotificationSettings(true);

    if (!isEmailActive(settings)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Email gateway is not active. Please ensure 'Enable Outgoing Transactional Emails' is ON, and SMTP Host, Port, Username, and Password are fully entered and saved.",
        },
        { status: 400 }
      );
    }

    const targetEmail = body.to || admin.email || settings.support_email || settings.smtp_user;

    const result = await sendRawEmail({
      to: targetEmail,
      subject: "SAN Furniture — Live SMTP Verification Test",
      html: `
        <div style="font-family: sans-serif; padding: 24px; color: #1a2233;">
          <h2 style="color: #0e1526;">SMTP Connection Verified!</h2>
          <p>This is a live transactional test email dispatched from your <strong>SAN Furniture UK</strong> store administration console.</p>
          <p><strong>Configured SMTP Host:</strong> ${settings.smtp_host}</p>
          <p><strong>Port:</strong> ${settings.smtp_port} (${settings.smtp_encryption})</p>
          <p><strong>From:</strong> ${settings.smtp_from_name} &lt;${settings.smtp_from_email || settings.smtp_user}&gt;</p>
          <p style="color: #059669; font-weight: bold;">✔ All customer notifications (Registration, Order Confirmed, Dispatched, Cancelled) are now active and ready to deliver.</p>
        </div>
      `,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Test email successfully dispatched to ${targetEmail} (MessageId: ${result.messageId || "sent"})!`,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Failed to dispatch test email via SMTP server.",
        },
        { status: 502 }
      );
    }
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Internal server error during email test" },
      { status: 500 }
    );
  }
}
