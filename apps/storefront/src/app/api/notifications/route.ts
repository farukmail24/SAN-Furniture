import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "100", 10), 500);
    const recipientType = searchParams.get("recipient_type");

    const pool = getDbPool();
    let query =
      "SELECT id, recipient_type, title, message, type, is_read, link, metadata, created_at FROM notifications";
    const params: any[] = [];

    if (recipientType) {
      query += " WHERE recipient_type = ?";
      params.push(recipientType);
    }
    query += " ORDER BY created_at DESC LIMIT ?";
    params.push(limit);

    const [rows]: any = await pool.query(query, params).catch(() => [[]]);
    const notifications = Array.isArray(rows) ? rows : [];

    const unreadCount = notifications.filter((r: any) => !r.is_read).length;
    const stats = {
      total: notifications.length,
      unread: unreadCount,
      critical: notifications.filter((r: any) => r.type === "critical" || r.type === "alert").length,
      info: notifications.filter((r: any) => r.type === "info" || r.type === "order").length,
    };

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount,
      stats,
    });
  } catch (err: any) {
    return NextResponse.json({
      success: true,
      notifications: [],
      unreadCount: 0,
      stats: { total: 0, unread: 0, critical: 0, info: 0 },
    });
  }
}

export async function POST(request: Request) {
  try {
    const pool = getDbPool();
    const body = await request.json();

    const id = `notif_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
    await pool.query(
      `INSERT INTO notifications (id, recipient_type, type, title, message, link, is_read, metadata, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 0, ?, NOW())`,
      [
        id,
        body.recipient_type || "admin",
        body.type || "info",
        body.title || "Notification",
        body.message || "",
        body.link || "/admin",
        JSON.stringify(body.metadata || {}),
      ]
    );

    return NextResponse.json({ success: true, message: "Notification created", id });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
