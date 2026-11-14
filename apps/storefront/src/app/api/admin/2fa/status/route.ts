import { NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/auth-token";
import { getDbPool } from "@/lib/db";
import { ensure2FASchema } from "@/lib/ensure-2fa-schema";
import { maskEmail } from "@/lib/two-factor-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensure2FASchema().catch(() => {});

    const pool = getDbPool();
    const [rows]: any = await pool.query(
      `SELECT two_factor_enabled, two_factor_method, two_factor_secret,
              two_factor_verified_at, two_factor_recovery_codes
       FROM admin_users WHERE id = ?`,
      [admin.id]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    const row = rows[0];
    let recoveryCount = 0;
    try {
      if (row.two_factor_recovery_codes) {
        const parsed = JSON.parse(row.two_factor_recovery_codes);
        recoveryCount = Array.isArray(parsed) ? parsed.length : 0;
      }
    } catch {
      recoveryCount = 0;
    }

    return NextResponse.json({
      success: true,
      twoFactorEnabled: Boolean(row.two_factor_enabled),
      method: row.two_factor_method || "app",
      hasAppConfigured: Boolean(row.two_factor_secret),
      hasEmailConfigured: true,
      verifiedAt: row.two_factor_verified_at,
      email: admin.email,
      maskedEmail: maskEmail(admin.email),
      remainingRecoveryCodes: recoveryCount,
    });
  } catch (err: any) {
    console.error("[2FA Status Error]:", err);
    return NextResponse.json({ error: "Failed to fetch 2FA status" }, { status: 500 });
  }
}
