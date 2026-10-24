import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth-token";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const pool = getDbPool();
    const body = await request.json();

    const { orderIds, status } = body;
    if (!Array.isArray(orderIds) || orderIds.length === 0 || !status) {
      return NextResponse.json({ error: "orderIds array and status are required" }, { status: 400 });
    }

    const placeholders = orderIds.map(() => "?").join(", ");
    await pool.query(
      `UPDATE orders SET fulfillment_status = ? WHERE id IN (${placeholders}) OR order_number IN (${placeholders})`,
      [status, ...orderIds, ...orderIds]
    );

    return NextResponse.json({
      success: true,
      message: `Updated ${orderIds.length} orders to ${status}`,
      updatedCount: orderIds.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Failed to bulk update orders", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
