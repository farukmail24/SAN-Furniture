import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import crypto from "crypto";
import { getAdminFromRequest, getCustomerFromRequest } from "@/lib/auth-token";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminFromRequest(request);
    const customer = await getCustomerFromRequest(request);

    if (!admin && !customer) {
      return NextResponse.json({ error: "Authentication required to reply to ticket" }, { status: 401 });
    }

    const { id } = await params;
    const pool = getDbPool();
    const body = await request.json().catch(() => ({}));

    const message = (body.message || "").trim();
    if (!message) {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 });
    }

    const [ticketRows]: any = await pool.query(
      "SELECT id, customer_email, customer_id, status FROM support_tickets WHERE id = ? OR ticket_number = ? LIMIT 1",
      [id, id]
    );

    if (!ticketRows || ticketRows.length === 0) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const ticket = ticketRows[0];
    const ticketId = ticket.id;

    // Check authorization: Customer can only reply to their own tickets
    if (!admin && customer) {
      const ticketEmail = (ticket.customer_email || "").toLowerCase();
      if (ticketEmail !== customer.email.toLowerCase()) {
        return NextResponse.json({ error: "Forbidden: You cannot post messages to this ticket" }, { status: 403 });
      }
    }

    const msgId = `msg_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;

    let senderType: "customer" | "agent";
    let senderId: string;
    let senderName: string;
    let isInternalNote = 0;
    let nextTicketStatus: string;

    if (!admin && customer) {
      // Message from Customer
      senderType = "customer";
      senderId = customer.id;
      senderName = `${customer.firstName} ${customer.lastName}`.trim() || customer.email;
      isInternalNote = 0; // Customers cannot write internal notes
      // When customer replies, ticket status moves to waiting_agent
      nextTicketStatus = ticket.status === "resolved" ? "open" : "waiting_agent";
    } else {
      // Message from Admin/Agent
      senderType = "agent";
      senderId = admin ? admin.id : "admin_usr_01";
      senderName = admin ? (admin.fullName || "SAN Support Team") : (body.sender_name || "SAN Support Team");
      isInternalNote = body.is_internal_note ? 1 : 0;
      // When agent replies publicly, status moves to waiting_customer. If internal note, leave status as is.
      nextTicketStatus = isInternalNote ? ticket.status : "waiting_customer";
    }

    await pool.query(
      `INSERT INTO support_messages (
        id, ticket_id, sender_type, sender_id, sender_name, message, is_internal_note, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [msgId, ticketId, senderType, senderId, senderName, message, isInternalNote]
    );

    // Update ticket last_reply_at and status
    await pool.query(
      `UPDATE support_tickets 
       SET last_reply_at = NOW(), 
           status = ?,
           updated_at = NOW()
       WHERE id = ?`,
      [nextTicketStatus, ticketId]
    );

    return NextResponse.json({
      success: true,
      message: "Reply sent successfully",
      messageId: msgId,
      status: nextTicketStatus,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
