import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { getAdminFromRequest, getCustomerFromRequest } from "@/lib/auth-token";
import { ensureVoucherSchema } from "@/lib/ensure-voucher-schema";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; messageId: string }> }
) {
  try {
    await ensureVoucherSchema().catch(() => {});
    const admin = await getAdminFromRequest(request);
    const customer = await getCustomerFromRequest(request);

    if (!admin && !customer) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { id: ticketParam, messageId } = await params;
    const pool = getDbPool();
    const body = await request.json().catch(() => ({}));
    const newText = String(body.message || "").trim();

    if (!newText) {
      return NextResponse.json({ error: "Message content cannot be empty" }, { status: 400 });
    }

    const [tRows]: any = await pool.query(
      "SELECT id FROM support_tickets WHERE id = ? OR ticket_number = ? LIMIT 1",
      [ticketParam, ticketParam]
    );
    if (!tRows || tRows.length === 0) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }
    const ticketId = tRows[0].id;

    const [mRows]: any = await pool.query(
      "SELECT id, sender_type, sender_id FROM support_messages WHERE id = ? AND ticket_id = ? LIMIT 1",
      [messageId, ticketId]
    );
    if (!mRows || mRows.length === 0) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }
    const targetMsg = mRows[0];

    if (!admin && customer) {
      if (targetMsg.sender_type !== "customer" || targetMsg.sender_id !== customer.id) {
        return NextResponse.json({ error: "Forbidden: You can only edit your own messages" }, { status: 403 });
      }
    }

    await pool.query(
      `UPDATE support_messages 
       SET message = ?, is_edited = 1, edited_at = NOW() 
       WHERE id = ? AND ticket_id = ?`,
      [newText, messageId, ticketId]
    );

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
    console.error("[Message Edit Route Error]:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; messageId: string }> }
) {
  try {
    await ensureVoucherSchema().catch(() => {});
    const admin = await getAdminFromRequest(request);
    const customer = await getCustomerFromRequest(request);

    if (!admin && !customer) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { id: ticketParam, messageId } = await params;
    const pool = getDbPool();

    const [tRows]: any = await pool.query(
      "SELECT id FROM support_tickets WHERE id = ? OR ticket_number = ? LIMIT 1",
      [ticketParam, ticketParam]
    );
    if (!tRows || tRows.length === 0) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }
    const ticketId = tRows[0].id;

    const [mRows]: any = await pool.query(
      "SELECT id, sender_type, sender_id FROM support_messages WHERE id = ? AND ticket_id = ? LIMIT 1",
      [messageId, ticketId]
    );
    if (!mRows || mRows.length === 0) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }
    const targetMsg = mRows[0];

    if (!admin && customer) {
      if (targetMsg.sender_type !== "customer" || targetMsg.sender_id !== customer.id) {
        return NextResponse.json({ error: "Forbidden: You can only delete your own messages" }, { status: 403 });
      }
    }

    await pool.query(
      "DELETE FROM support_messages WHERE id = ? AND ticket_id = ?",
      [messageId, ticketId]
    );

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
    console.error("[Message Delete Route Error]:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
