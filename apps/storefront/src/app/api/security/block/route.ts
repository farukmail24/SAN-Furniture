import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import crypto from "crypto";
import { getAdminFromRequest } from "@/lib/auth-token";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized: Administrator privileges required" }, { status: 401 });
    }

    const { ip, reason = "Manual administrator block" } = await request.json();
    if (!ip) {
      return NextResponse.json({ error: "IP address is required" }, { status: 400 });
    }

    const pool = getDbPool();
    const id = `jail_${crypto.randomBytes(6).toString("hex")}`;
    // Lock for 24 hours by default
    const lockedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await pool.query(
      `INSERT INTO security_ip_jail (id, ip_address, strike_count, reason, locked_until, is_permanent)
       VALUES (?, ?, 5, ?, ?, 0)
       ON DUPLICATE KEY UPDATE strike_count = strike_count + 1, reason = VALUES(reason), locked_until = VALUES(locked_until)`,
      [id, ip, reason, lockedUntil]
    );

    return NextResponse.json({
      success: true,
      message: `IP ${ip} permanently locked in jail.`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Failed to block IP", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
