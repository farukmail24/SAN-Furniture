import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import crypto from "crypto";
import { getAdminFromRequest, getCustomerFromRequest } from "@/lib/auth-token";
import { ensureVoucherSchema } from "@/lib/ensure-voucher-schema";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureVoucherSchema().catch(() => {});
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
           last_message_preview = ?,
           status = ?,
           updated_at = NOW()
       WHERE id = ?`,
      [message.slice(0, 255), nextTicketStatus, ticketId]
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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureVoucherSchema().catch(() => {});
    const admin = await getAdminFromRequest(request);
    const customer = await getCustomerFromRequest(request);

    if (!admin && !customer) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { id: ticketParam } = await params;
    const pool = getDbPool();
    const body = await request.json().catch(() => ({}));

    const messageId = String(body.messageId || body.message_id || "").trim();
    const newText = String(body.message || "").trim();

    if (!messageId) {
      return NextResponse.json({ error: "Message ID is required" }, { status: 400 });
    }
    if (!newText) {
      return NextResponse.json({ error: "Message content cannot be empty" }, { status: 400 });
    }

    // Resolve ticket
    const [tRows]: any = await pool.query(
      "SELECT id, customer_email FROM support_tickets WHERE id = ? OR ticket_number = ? LIMIT 1",
      [ticketParam, ticketParam]
    );
    if (!tRows || tRows.length === 0) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }
    const ticketId = tRows[0].id;

    // Find message
    const [mRows]: any = await pool.query(
      "SELECT id, sender_type, sender_id, message FROM support_messages WHERE id = ? AND ticket_id = ? LIMIT 1",
      [messageId, ticketId]
    );
    if (!mRows || mRows.length === 0) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }
    const targetMsg = mRows[0];

    // Authorization: Admin can edit any message; customer can only edit their own
    if (!admin && customer) {
      if (targetMsg.sender_type !== "customer" || targetMsg.sender_id !== customer.id) {
        return NextResponse.json({ error: "Forbidden: You can only edit your own messages" }, { status: 403 });
      }
    }

    // Update message
    await pool.query(
      `UPDATE support_messages 
       SET message = ?, is_edited = 1, edited_at = NOW() 
       WHERE id = ? AND ticket_id = ?`,
      [newText, messageId, ticketId]
    );

    // If this is the latest message on the ticket, update ticket last_message_preview
    const [latestRows]: any = await pool.query(
      "SELECT id FROM support_messages WHERE ticket_id = ? ORDER BY created_at DESC LIMIT 1",
      [ticketId]
    );
    if (latestRows && latestRows.length > 0 && latestRows[0].id === messageId) {
      await pool.query(
        "UPDATE support_tickets SET last_message_preview = ?, updated_at = NOW() WHERE id = ?",
        [newText.slice(0, 255), ticketId]
      ).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      message: "Message updated successfully",
      messageId,
      updatedContent: newText,
      is_edited: 1,
      edited_at: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("[Ticket Message Edit Error]:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureVoucherSchema().catch(() => {});
    const admin = await getAdminFromRequest(request);
    const customer = await getCustomerFromRequest(request);

    if (!admin && !customer) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { id: ticketParam } = await params;
    const pool = getDbPool();

    const url = new URL(request.url);
    let messageId = url.searchParams.get("messageId") || url.searchParams.get("message_id") || "";
    if (!messageId) {
      const body = await request.json().catch(() => ({}));
      messageId = String(body.messageId || body.message_id || "");
    }

    if (!messageId) {
      return NextResponse.json({ error: "Message ID is required" }, { status: 400 });
    }

    // Resolve ticket
    const [tRows]: any = await pool.query(
      "SELECT id, customer_email FROM support_tickets WHERE id = ? OR ticket_number = ? LIMIT 1",
      [ticketParam, ticketParam]
    );
    if (!tRows || tRows.length === 0) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }
    const ticketId = tRows[0].id;

    // Find message
    const [mRows]: any = await pool.query(
      "SELECT id, sender_type, sender_id FROM support_messages WHERE id = ? AND ticket_id = ? LIMIT 1",
      [messageId, ticketId]
    );
    if (!mRows || mRows.length === 0) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }
    const targetMsg = mRows[0];

    // Authorization: Admin can delete any message; customer can only delete their own
    if (!admin && customer) {
      if (targetMsg.sender_type !== "customer" || targetMsg.sender_id !== customer.id) {
        return NextResponse.json({ error: "Forbidden: You can only delete your own messages" }, { status: 403 });
      }
    }

    // Delete the message
    await pool.query(
      "DELETE FROM support_messages WHERE id = ? AND ticket_id = ?",
      [messageId, ticketId]
    );

    // Reconcile ticket's last_message_preview and last_reply_at
    const [remainingRows]: any = await pool.query(
      "SELECT message, created_at FROM support_messages WHERE ticket_id = ? ORDER BY created_at DESC LIMIT 1",
      [ticketId]
    );

    if (remainingRows && remainingRows.length > 0) {
      const lastMsg = remainingRows[0];
      await pool.query(
        "UPDATE support_tickets SET last_message_preview = ?, last_reply_at = ?, updated_at = NOW() WHERE id = ?",
        [lastMsg.message.slice(0, 255), lastMsg.created_at, ticketId]
      ).catch(() => {});
    } else {
      await pool.query(
        "UPDATE support_tickets SET last_message_preview = NULL, updated_at = NOW() WHERE id = ?",
        [ticketId]
      ).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      message: "Message deleted successfully",
      messageId,
    });
  } catch (err: any) {
    console.error("[Ticket Message Delete Error]:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
