import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "100", 10), 200);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    const pool = getDbPool();

    let query = `
      SELECT 
        t.id, t.ticket_number, t.customer_id, t.customer_name, t.customer_email, t.customer_phone,
        t.order_id, t.category, t.priority, t.status, t.subject, t.assigned_to,
        t.last_reply_at, t.created_at, t.updated_at,
        COALESCE(o.order_number, t.order_id) as order_number
      FROM support_tickets t
      LEFT JOIN orders o ON t.order_id = o.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status && status !== "all") {
      query += " AND t.status = ?";
      params.push(status);
    }
    if (priority && priority !== "all") {
      query += " AND t.priority = ?";
      params.push(priority);
    }
    if (category && category !== "all") {
      query += " AND t.category = ?";
      params.push(category);
    }
    if (search) {
      query += " AND (t.customer_name LIKE ? OR t.customer_email LIKE ? OR t.subject LIKE ? OR t.ticket_number LIKE ?)";
      const wild = `%${search}%`;
      params.push(wild, wild, wild, wild);
    }

    query += " ORDER BY t.updated_at DESC LIMIT ?";
    params.push(limit);

    const [rows]: any = await pool.query(query, params).catch(() => [[]]);
    const tickets = Array.isArray(rows) ? rows : [];

    // Calculate live counts
    const [countRows]: any = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COALESCE(SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END), 0) as open_count,
        COALESCE(SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END), 0) as in_progress_count,
        COALESCE(SUM(CASE WHEN status = 'waiting_customer' THEN 1 ELSE 0 END), 0) as waiting_count,
        COALESCE(SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END), 0) as resolved_count
      FROM support_tickets
    `).catch(() => [[]]);

    const c = countRows?.[0] || {};
    const counts = {
      total: Number(c.total) || tickets.length,
      open: Number(c.open_count) || 0,
      in_progress: Number(c.in_progress_count) || 0,
      waiting_customer: Number(c.waiting_count) || 0,
      resolved: Number(c.resolved_count) || 0,
    };

    return NextResponse.json({
      success: true,
      tickets,
      counts,
      total: tickets.length,
    });
  } catch (err: any) {
    return NextResponse.json({
      success: true,
      tickets: [],
      counts: { total: 0, open: 0, in_progress: 0, waiting_customer: 0, resolved: 0 },
      total: 0,
    });
  }
}
