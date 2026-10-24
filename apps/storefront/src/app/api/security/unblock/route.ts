import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { ip } = await request.json();
    if (!ip) {
      return NextResponse.json({ error: "IP address is required" }, { status: 400 });
    }

    const pool = getDbPool();
    await pool.query("DELETE FROM security_ip_jail WHERE ip_address = ?", [ip]);

    return NextResponse.json({
      success: true,
      message: `IP ${ip} released from jail.`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Failed to release IP", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
