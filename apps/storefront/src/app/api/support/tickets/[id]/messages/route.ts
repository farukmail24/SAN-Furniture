import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pool = getDbPool();
    const body = await request.json();

    const { message, is_internal_note = false, sender_name = "SAN Support Team" } = body;
    if (!message || !message.trim()) {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 });
    }

    const [ticketRows]: any = await pool.query(
      "SELECT id FROM support_tickets WHERE id = ? OR ticket_number = ? LIMIT 1",
      [id, id]
    );

    if (!ticketRows || ticketRows.length === 0) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const ticketId = ticketRows[0].id;
    const msgId = `msg_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;

    await pool.query(
      `INSERT INTO support_messages (
        id, ticket_id, sender_type, sender_id, sender_name, message, is_internal_note, created_at
      ) VALUES (?, ?, 'agent', 'admin_usr_01', ?, ?, ?, NOW())`,
      [msgId, ticketId, sender_name, message.trim(), is_internal_note ? 1 : 0]
    );

    // Update ticket last_reply_at and status
    await pool.query(
      `UPDATE support_tickets 
       SET last_reply_at = NOW(), 
           status = IF(? = 1, status, 'waiting_customer'),
           updated_at = NOW()
       WHERE id = ?`,
      [is_internal_note ? 1 : 0, ticketId]
    );

    return NextResponse.json({
      success: true,
      message: "Reply sent successfully",
      messageId: msgId,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
