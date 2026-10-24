import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { signAuthToken, verifyPassword } from "@/lib/auth-token";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = (body.email || "").trim().toLowerCase();
    const password = (body.password || "").trim();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const pool = getDbPool();
    const [rows]: any = await pool.query(
      "SELECT id, email, password_hash, full_name, role, is_active FROM admin_users WHERE email = ?",
      [email]
    );

    if (!rows || rows.length === 0 || !rows[0].is_active) {
      return NextResponse.json(
        { error: "Invalid admin credentials" },
        { status: 401 }
      );
    }

    const user = rows[0];
    const isPasswordValid = verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid admin credentials" },
        { status: 401 }
      );
    }

    // Update last login
    await pool.query("UPDATE admin_users SET last_login_at = NOW() WHERE id = ?", [user.id]).catch(() => {});

    // Generate signed admin token
    const token = signAuthToken("adm", user.id);

    // Audit log
    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    await pool.query(
      "INSERT INTO admin_audit_logs (id, actor, action, resource, details_json, ip_address) VALUES (?, ?, ?, ?, ?, ?)",
      [`log_${Date.now()}`, user.email, "ADMIN_LOGIN", "admin_users", JSON.stringify({ role: user.role }), clientIp]
    ).catch(() => {});

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
      },
    });
  } catch (err: any) {
    console.error("[Admin Login Route Error]:", err);
    return NextResponse.json(
      { error: "Authentication service error. Please try again or verify database connectivity." },
      { status: 500 }
    );
  }
}
