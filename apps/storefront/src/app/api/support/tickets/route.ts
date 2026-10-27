import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { getAdminFromRequest, getCustomerFromRequest } from "@/lib/auth-token";
import crypto from "node:crypto";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const admin = await getAdminFromRequest(request);
    const customer = await getCustomerFromRequest(request);

    if (!admin && !customer) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

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

    if (customer && !admin) {
      // Restrict customer strictly to their own tickets
      query += " AND (t.customer_email = ? OR t.customer_id = ?)";
      params.push(customer.email, customer.id);
    } else {
      // Admin request: allow customer email filter if provided
      const custEmail = searchParams.get("customer_email");
      if (custEmail) {
        query += " AND t.customer_email = ?";
        params.push(custEmail);
      }
    }

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
    let countQuery = `
      SELECT 
        COUNT(*) as total,
        COALESCE(SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END), 0) as open_count,
        COALESCE(SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END), 0) as in_progress_count,
        COALESCE(SUM(CASE WHEN status = 'waiting_customer' THEN 1 ELSE 0 END), 0) as waiting_count,
        COALESCE(SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END), 0) as resolved_count
      FROM support_tickets
    `;
    const countParams: any[] = [];
    if (customer && !admin) {
      countQuery += " WHERE (customer_email = ? OR customer_id = ?)";
      countParams.push(customer.email, customer.id);
    }

    const [countRows]: any = await pool.query(countQuery, countParams).catch(() => [[]]);

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

export async function POST(request: Request) {
  try {
    const admin = await getAdminFromRequest(request);
    const customer = await getCustomerFromRequest(request);

    if (!admin && !customer) {
      return NextResponse.json({ error: "Authentication required to submit support tickets" }, { status: 401 });
    }

    const pool = getDbPool();
    const body = await request.json().catch(() => ({}));

    const subject = (body.subject || "").trim();
    const message = (body.message || "").trim();

    if (!subject || !message) {
      return NextResponse.json({ error: "Subject and message are required" }, { status: 400 });
    }

    const ticketId = `tkt_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
    const ticketNumber = `SAN-TKT-${Math.floor(1000 + Math.random() * 9000)}`;

    let customerId = body.customer_id || null;
    let customerName = (body.customer_name || "Valued SAN Customer").trim();
    let customerEmail = (body.customer_email || "").trim().toLowerCase();
    let customerPhone = body.customer_phone || null;

    if (!admin && customer) {
      customerId = customer.id;
      customerName = `${customer.firstName} ${customer.lastName}`.trim() || customer.email;
      customerEmail = customer.email;
      customerPhone = customer.phone || null;
    }

    const category = body.category || "general";
    const priority = body.priority || "normal";
    const orderId = body.order_id || null;

    await pool.query(
      `INSERT INTO support_tickets (
        id, ticket_number, customer_id, customer_name, customer_email, customer_phone,
        order_id, category, priority, status, subject, last_reply_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', ?, NOW(), NOW(), NOW())`,
      [
        ticketId,
        ticketNumber,
        customerId,
        customerName,
        customerEmail,
        customerPhone,
        orderId,
        category,
        priority,
        subject,
      ]
    );

    const msgId = `msg_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
    const senderType = (!admin && customer) ? "customer" : "agent";
    const senderId = (!admin && customer) ? customer.id : (admin ? admin.id : "system");
    const senderName = (!admin && customer) ? customerName : (admin ? (admin.fullName || "SAN Support Specialist") : "Support Specialist");

    await pool.query(
      `INSERT INTO support_messages (
        id, ticket_id, sender_type, sender_id, sender_name, message, is_internal_note, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, 0, NOW())`,
      [msgId, ticketId, senderType, senderId, senderName, message]
    );

    return NextResponse.json({
      success: true,
      message: "Ticket created successfully",
      ticket: {
        id: ticketId,
        ticket_number: ticketNumber,
        subject,
        status: "open",
        category,
        priority,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
