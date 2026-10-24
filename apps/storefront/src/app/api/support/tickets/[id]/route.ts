import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pool = getDbPool();

    const [ticketRows]: any = await pool.query(
      `SELECT 
        t.*,
        COALESCE(o.order_number, t.order_id) as order_number
      FROM support_tickets t
      LEFT JOIN orders o ON t.order_id = o.id
      WHERE t.id = ? OR t.ticket_number = ?
      LIMIT 1`,
      [id, id]
    );

    if (!ticketRows || ticketRows.length === 0) {
      return NextResponse.json({ success: false, error: "Ticket not found" }, { status: 404 });
    }

    const ticket = ticketRows[0];

    // Fetch message thread
    const [messages]: any = await pool
      .query(
        "SELECT * FROM support_messages WHERE ticket_id = ? ORDER BY created_at ASC",
        [ticket.id]
      )
      .catch(() => [[]]);

    // Fetch linked order if present
    let linked_order = null;
    if (ticket.order_id) {
      const [orderRows]: any = await pool
        .query(
          `SELECT 
            o.id, o.order_number, o.status, o.total_pennies, o.delivery_tier,
            po.carrier, po.tracking_number, o.created_at
          FROM orders o
          LEFT JOIN order_po_dispatches po ON o.id = po.order_id
          WHERE o.id = ? OR o.order_number = ?
          LIMIT 1`,
          [ticket.order_id, ticket.order_id]
        )
        .catch(() => [[]]);

      if (orderRows && orderRows[0]) {
        linked_order = orderRows[0];
      }
    }

    return NextResponse.json({
      success: true,
      ticket,
      messages: Array.isArray(messages) ? messages : [],
      linked_order,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch ticket", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pool = getDbPool();
    const body = await request.json();

    const updates: string[] = [];
    const values: any[] = [];

    if (body.status) {
      updates.push("status = ?");
      values.push(body.status);
    }
    if (body.priority) {
      updates.push("priority = ?");
      values.push(body.priority);
    }
    if (body.assigned_to !== undefined) {
      updates.push("assigned_to = ?");
      values.push(body.assigned_to);
    }

    updates.push("updated_at = NOW()");

    if (updates.length > 1) {
      values.push(id, id);
      await pool.query(
        `UPDATE support_tickets SET ${updates.join(", ")} WHERE id = ? OR ticket_number = ?`,
        values
      );
    }

    return NextResponse.json({ success: true, message: "Ticket updated successfully" });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Failed to update ticket", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
