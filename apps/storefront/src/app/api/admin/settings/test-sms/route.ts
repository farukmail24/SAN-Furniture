import { NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/auth-token";
import {
  getNotificationSettings,
  isSmsActive,
  sendRawSms,
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

    if (!isSmsActive(settings)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "SMS gateway is not active. Please ensure 'Enable Outgoing Customer SMS Alerts' is ON, and Twilio Account SID and Auth Token are fully entered and saved.",
        },
        { status: 400 }
      );
    }

    const targetPhone = body.to || settings.support_phone;
    if (!targetPhone) {
      return NextResponse.json(
        {
          success: false,
          error: "Please enter a valid destination UK mobile number to receive the test SMS.",
        },
        { status: 400 }
      );
    }

    const result = await sendRawSms({
      to: targetPhone,
      message: `SAN Furniture: Live SMS alert test verified! UK furniture notifications are connected. (SID: ${Date.now().toString().slice(-4)})`,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Test SMS successfully dispatched to ${targetPhone} (Twilio SID: ${result.sid})!`,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Failed to dispatch test SMS via Twilio gateway.",
        },
        { status: 502 }
      );
    }
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Internal server error during SMS test" },
      { status: 500 }
    );
  }
}
