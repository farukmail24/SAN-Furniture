import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const pool = getDbPool();
    const { ids } = await request.json();

    if (Array.isArray(ids) && ids.length > 0) {
      const placeholders = ids.map(() => "?").join(", ");
      await pool.query(
        `DELETE FROM notifications WHERE id IN (${placeholders})`,
        ids
      );
    }

    return NextResponse.json({ success: true, message: "Notifications deleted" });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
