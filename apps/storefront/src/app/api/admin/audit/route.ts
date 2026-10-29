import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth-token";
import crypto from "node:crypto";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "100", 10), 500);

    const pool = getDbPool();
    const [rows]: any = await pool
      .query(
        "SELECT id, actor, action, resource, details_json, ip_address, created_at FROM admin_audit_logs ORDER BY created_at DESC LIMIT ?",
        [limit]
      )
      .catch(() => [[]]);

    const logs = Array.isArray(rows) ? rows : [];

    return NextResponse.json({
      success: true,
      logs,
      auditLogs: logs,
      total: logs.length,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await getAdminFromRequest(request);
    const body = await request.json().catch(() => ({}));
    const authHeader = request.headers.get("x-deploy-secret") || "";

    const isDeploySecretValid =
      Boolean(authHeader) &&
      authHeader === (process.env.DEPLOY_SECRET || "san_furniture_auto_deploy_master_secret_2026");

    if (!admin && !isDeploySecretValid) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { actor, action, resource, details, ipAddress } = body;
    const pool = getDbPool();
    const logId = `log_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
    const clientIp =
      ipAddress ||
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "127.0.0.1";

    await pool.query(
      "INSERT INTO admin_audit_logs (id, actor, action, resource, details_json, ip_address, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())",
      [
        logId,
        actor || (admin ? admin.email : "system"),
        action || "SYSTEM_EVENT",
        resource || "system",
        typeof details === "string" ? details : JSON.stringify(details || {}),
        clientIp,
      ]
    );

    // Also record notification if this is a deployment event
    if (action === "GITHUB_AUTO_DEPLOY" || action === "GITHUB_DEPLOY_FAILED") {
      try {
        const notifId = `notif_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
        const detailObj = typeof details === "object" ? details : {};
        const branch = detailObj?.branch || "main";
        const commitSha = detailObj?.commitSha || "latest";
        const pusher = detailObj?.pusher || "GitHub";
        await pool.query(
          "INSERT INTO notifications (id, recipient_type, recipient_id, type, title, message, link, is_read, metadata, created_at) VALUES (?, 'admin', 'all', 'deploy', ?, ?, '/admin/audit', 0, ?, NOW())",
          [
            notifId,
            `Auto-Deployed branch '${branch}' (${commitSha})`,
            `Pushed by ${pusher}: ${detailObj?.commitMessage || "Update"}`,
            JSON.stringify({ branch, commitSha, pusher, logId }),
          ]
        );
      } catch {
        // notifications table is optional
      }
    }

    return NextResponse.json({ success: true, logId });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
