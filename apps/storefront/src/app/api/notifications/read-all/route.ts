import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const pool = getDbPool();
    const body = await request.json().catch(() => ({}));
    const recipientType = body.recipient_type || "admin";

    await pool.query(
      "UPDATE notifications SET is_read = 1 WHERE recipient_type = ?",
      [recipientType]
    );

    return NextResponse.json({ success: true, message: "All notifications marked as read" });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
