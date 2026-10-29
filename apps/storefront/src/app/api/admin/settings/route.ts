import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth-token";
import { invalidateNotificationSettingsCache } from "@/lib/notifications-dispatcher";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const pool = getDbPool();
    const [rows]: any = await pool.query("SELECT setting_key, setting_value FROM system_settings");
    const settings: Record<string, string> = {};

    const SENSITIVE_SECRET_KEYS = new Set([
      "smtp_pass",
      "sms_auth_token",
      "stripe_secret_key",
      "stripe_webhook_secret",
      "paypal_client_secret",
      "github_webhook_secret",
      "deploy_secret",
    ]);

    const isSuperAdmin = admin.role === "super_admin";

    if (Array.isArray(rows)) {
      for (const r of rows) {
        if (r.setting_key && r.setting_key !== "settings") {
          if (!isSuperAdmin && SENSITIVE_SECRET_KEYS.has(r.setting_key)) {
            settings[r.setting_key] = r.setting_value ? "••••••••••••••••" : "";
          } else {
            settings[r.setting_key] = r.setting_value;
          }
        }
      }
    }
    return NextResponse.json({ success: true, settings });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const pool = getDbPool();
    const body = await request.json().catch(() => ({}));

    // If body contains a nested `settings` object (from frontend { settings: { ... } }), unwrap it
    const updates = body.settings && typeof body.settings === "object" ? body.settings : body;

    const SENSITIVE_SECRET_KEYS = new Set([
      "smtp_pass",
      "sms_auth_token",
      "stripe_secret_key",
      "stripe_webhook_secret",
      "paypal_client_secret",
      "github_webhook_secret",
      "deploy_secret",
    ]);

    const isSuperAdmin = admin.role === "super_admin";

    // Non-super-admins cannot alter sensitive security secrets
    if (!isSuperAdmin) {
      for (const key of Object.keys(updates)) {
        if (SENSITIVE_SECRET_KEYS.has(key)) {
          return NextResponse.json(
            { success: false, error: `Forbidden: Only super_admin can configure credentials (${key})` },
            { status: 403 }
          );
        }
      }
    }

    for (const [key, val] of Object.entries(updates)) {
      if (typeof key === "string" && key.length > 0 && typeof val !== "object" && key !== "settings") {
        const valStr = String(val ?? "").trim();

        // Guard sensitive secrets: Never overwrite with UI mask bullets or empty strings
        if (SENSITIVE_SECRET_KEYS.has(key)) {
          if (!valStr || valStr.includes("••••")) {
            continue; // Keep existing persisted secret intact
          }
        }

        await pool.query(
          `INSERT INTO system_settings (setting_key, setting_value, updated_at) 
           VALUES (?, ?, NOW()) 
           ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()`,
          [key, String(val ?? "")]
        );
      }
    }

    // Purge any corrupted 'settings' object row if it exists
    await pool.query("DELETE FROM system_settings WHERE setting_key = 'settings'").catch(() => {});

    invalidateNotificationSettingsCache();

    return NextResponse.json({ success: true, message: "Settings saved successfully" });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
