import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { getAdminFromRequest, getCustomerFromRequest } from "@/lib/auth-token";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const admin = await getAdminFromRequest(request);
    const customer = await getCustomerFromRequest(request);

    if (!admin && !customer) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const pool = getDbPool();
    const { ids } = await request.json();

    if (Array.isArray(ids) && ids.length > 0) {
      const placeholders = ids.map(() => "?").join(", ");
      if (!admin && customer) {
        await pool.query(
          `DELETE FROM notifications WHERE id IN (${placeholders}) AND recipient_type = 'customer' AND (recipient_id = ? OR recipient_id = ?)`,
          [...ids, customer.email, customer.id]
        );
      } else {
        await pool.query(
          `DELETE FROM notifications WHERE id IN (${placeholders})`,
          ids
        );
      }
    }

    return NextResponse.json({ success: true, message: "Notifications deleted" });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
