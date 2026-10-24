import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const pool = getDbPool();
    const body = await request.json().catch(() => ({}));
    const recipientType = body.recipient_type || "admin";

    await pool.query(
      "DELETE FROM notifications WHERE recipient_type = ?",
      [recipientType]
    );

    return NextResponse.json({ success: true, message: "Notifications cleared" });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
