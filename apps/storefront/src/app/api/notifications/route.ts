import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import crypto from "crypto";
import { getAdminFromRequest, getCustomerFromRequest } from "@/lib/auth-token";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const admin = await getAdminFromRequest(request);
    const customer = await getCustomerFromRequest(request);

    if (!admin && !customer) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "100", 10), 500);
    const requestedRecipientType = searchParams.get("recipient_type");

    const pool = getDbPool();
    let query =
      "SELECT id, recipient_type, recipient_id, title, message, type, is_read, link, metadata, created_at FROM notifications WHERE 1=1";
    const params: any[] = [];

    if (customer && !admin) {
      // Customer is strictly restricted to their own notifications
      query += " AND recipient_type = 'customer' AND (recipient_id = ? OR recipient_id = ?)";
      params.push(customer.email, customer.id);
    } else {
      // Admin request
      if (requestedRecipientType) {
        query += " AND recipient_type = ?";
        params.push(requestedRecipientType);
      }
      const requestedRecipientId = searchParams.get("recipient_id");
      if (requestedRecipientId) {
        query += " AND recipient_id = ?";
        params.push(requestedRecipientId);
      }
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
      unread_count: unreadCount,
      stats,
    });
  } catch (err: any) {
    return NextResponse.json({
      success: true,
      notifications: [],
      unreadCount: 0,
      unread_count: 0,
      stats: { total: 0, unread: 0, critical: 0, info: 0 },
    });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await getAdminFromRequest(request);
    const customer = await getCustomerFromRequest(request);

    if (!admin && !customer) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const pool = getDbPool();
    const body = await request.json();

    // Customers can only create customer-targeted notifications for themselves
    let recipientType = body.recipient_type || "admin";
    let recipientId = body.recipient_id || null;

    if (!admin && customer) {
      recipientType = "customer";
      recipientId = customer.email;
    }

    const id = `notif_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
    await pool.query(
      `INSERT INTO notifications (id, recipient_type, recipient_id, type, title, message, link, is_read, metadata, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, NOW())`,
      [
        id,
        recipientType,
        recipientId,
        body.type || "info",
        body.title || "Notification",
        body.message || "",
        body.link || (recipientType === "customer" ? "/account" : "/admin"),
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
