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

    // Merge any currently entered form settings from body so test works in real-time
    const mergedSettings = {
      ...settings,
      ...(body.smtp_host ? { smtp_host: body.smtp_host } : {}),
      ...(body.smtp_port ? { smtp_port: body.smtp_port === "456" ? "465" : body.smtp_port } : {}),
      ...(body.smtp_encryption ? { smtp_encryption: body.smtp_encryption } : {}),
      ...(body.smtp_user ? { smtp_user: body.smtp_user } : {}),
      ...(body.smtp_pass ? { smtp_pass: body.smtp_pass } : {}),
      ...(body.smtp_from_email ? { smtp_from_email: body.smtp_from_email } : {}),
      ...(body.smtp_from_name ? { smtp_from_name: body.smtp_from_name } : {}),
      email_notifications_enabled: "true", // Force active for explicit test button
    };

    if (!isEmailActive(mergedSettings)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Email gateway is not active. Please ensure SMTP Host, Port, Username, and Password are fully entered.",
        },
        { status: 400 }
      );
    }

    const targetEmail = body.to || admin.email || mergedSettings.support_email || mergedSettings.smtp_user;

    const result = await sendRawEmail(
      {
        to: targetEmail,
        subject: "SAN Furniture — Live SMTP Verification Test",
        html: `
        <div style="font-family: sans-serif; padding: 24px; color: #1a2233;">
          <h2 style="color: #0e1526;">SMTP Connection Verified!</h2>
          <p>This is a live transactional test email dispatched from your <strong>SAN Furniture UK</strong> store administration console.</p>
          <p><strong>Configured SMTP Host:</strong> ${mergedSettings.smtp_host}</p>
          <p><strong>Port:</strong> ${mergedSettings.smtp_port === "456" ? "465" : mergedSettings.smtp_port} (${mergedSettings.smtp_encryption})</p>
          <p><strong>From:</strong> ${mergedSettings.smtp_from_name || "SAN Furniture"} &lt;${mergedSettings.smtp_from_email || mergedSettings.smtp_user}&gt;</p>
          <p style="color: #059669; font-weight: bold;">✔ All customer notifications (Registration, Order Confirmed, Dispatched, Cancelled) are now active and ready to deliver.</p>
        </div>
      `,
      },
      mergedSettings
    );

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
