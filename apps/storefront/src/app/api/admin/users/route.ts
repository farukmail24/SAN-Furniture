import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { getDbPool } from "@/lib/db";
import { getAdminFromRequest, hashPassword } from "@/lib/auth-token";
import { ensure2FASchema } from "@/lib/ensure-2fa-schema";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Admin authorization required" },
        { status: 401 }
      );
    }

    await ensure2FASchema().catch(() => {});

    const pool = getDbPool();
    const [rows]: any = await pool.query(
      `SELECT id, email, full_name, role, is_active,
              two_factor_enabled, two_factor_method, two_factor_verified_at,
              last_login_at, created_at
       FROM admin_users ORDER BY created_at ASC`
    ).catch(() => [[]]);

    return NextResponse.json({
      success: true,
      users: rows || [],
      total: rows?.length || 0,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Admin authorization required" },
        { status: 401 }
      );
    }

    if (admin.role !== "super_admin") {
      return NextResponse.json(
        { success: false, error: "Forbidden: Only super_admin can create staff accounts" },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { fullName, email, role, password } = body;

    if (!fullName || !email || !password) {
      return NextResponse.json(
        { success: false, error: "Full name, email, and password are required" },
        { status: 400 }
      );
    }

    if (typeof password !== "string" || password.trim().length < 8) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    const pool = getDbPool();
    const emailNorm = email.trim().toLowerCase();

    // Check duplicate email
    const [existing]: any = await pool.query(
      "SELECT id FROM admin_users WHERE email = ? LIMIT 1",
      [emailNorm]
    );
    if (existing && existing.length > 0) {
      return NextResponse.json(
        { success: false, error: "An admin user with this email already exists" },
        { status: 409 }
      );
    }

    const newId = `adm_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
    const passwordHash = hashPassword(password.trim());
    const userRole = role || "catalog_manager";

    await pool.query(
      `INSERT INTO admin_users (id, email, password_hash, full_name, role, is_active, created_at)
       VALUES (?, ?, ?, ?, ?, 1, NOW())`,
      [newId, emailNorm, passwordHash, fullName.trim(), userRole]
    );

    // Audit log
    const auditId = `audit_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
    const clientIp = request.headers.get("x-forwarded-for") || "internal";
    await pool.query(
      `INSERT INTO admin_audit_logs (id, actor, action, resource, details_json, ip_address, created_at)
       VALUES (?, ?, 'STAFF_USER_CREATED', ?, ?, ?, NOW())`,
      [
        auditId,
        `${admin.fullName || admin.email} (${admin.role})`,
        `admin_user:${newId}`,
        JSON.stringify({ newUserId: newId, email: emailNorm, role: userRole }),
        clientIp,
      ]
    ).catch(() => {});

    return NextResponse.json({
      success: true,
      message: "Staff user created successfully",
      user: { id: newId, email: emailNorm, full_name: fullName.trim(), role: userRole },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Failed to create staff user", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
