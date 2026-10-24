import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth-token";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const pool = getDbPool();
    const body = await request.json();

    const { scope, restrictedPrefixes, nonServiceableNotice } = body;

    const queries = [
      { key: "delivery_policy_scope", val: scope || "mainland_only" },
      { key: "delivery_policy_restricted", val: restrictedPrefixes || "" },
      { key: "delivery_policy_notice", val: nonServiceableNotice || "" },
    ];

    for (const q of queries) {
      await pool.query(
        `INSERT INTO system_settings (setting_key, setting_value, category, description, updated_at)
         VALUES (?, ?, 'logistics', 'UK delivery policy config', NOW())
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()`,
        [q.key, q.val]
      );
    }

    return NextResponse.json({
      success: true,
      message: "Delivery policy saved successfully",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
