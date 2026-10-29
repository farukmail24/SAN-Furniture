import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { getDbPool } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth-token";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Admin authorization required" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const pool = getDbPool();
    const body = await request.json();

    const { fullName, role, isActive } = body;

    // Privilege check: Only super_admin can modify roles or disable staff accounts
    if (role !== undefined && admin.role !== "super_admin") {
      return NextResponse.json(
        { success: false, error: "Forbidden: Only super_admin can modify staff roles" },
        { status: 403 }
      );
    }

    if (isActive !== undefined && admin.role !== "super_admin" && admin.id !== id) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Only super_admin can deactivate staff accounts" },
        { status: 403 }
      );
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (fullName !== undefined) {
      updates.push("full_name = ?");
      values.push(fullName);
    }
    if (role !== undefined) {
      updates.push("role = ?");
      values.push(role);
    }
    if (isActive !== undefined) {
      updates.push("is_active = ?");
      values.push(isActive ? 1 : 0);
    }

    if (updates.length > 0) {
      values.push(id);
      await pool.query(
        `UPDATE admin_users SET ${updates.join(", ")} WHERE id = ?`,
        values
      );

      // Record audit log
      const auditId = `audit_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
      const clientIp = request.headers.get("x-forwarded-for") || "internal";
      await pool.query(
        `INSERT INTO admin_audit_logs (id, actor, action, resource, details_json, ip_address, created_at)
         VALUES (?, ?, 'STAFF_USER_UPDATED', ?, ?, ?, NOW())`,
        [
          auditId,
          `${admin.fullName || admin.email} (${admin.role})`,
          `admin_user:${id}`,
          JSON.stringify({ targetUserId: id, changes: { fullName, role, isActive } }),
          clientIp,
        ]
      ).catch(() => {});
    }

    return NextResponse.json({ success: true, message: "User updated successfully" });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Failed to update user", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Admin authorization required" },
        { status: 401 }
      );
    }

    // Privilege check: Only super_admin can delete staff accounts
    if (admin.role !== "super_admin") {
      return NextResponse.json(
        { success: false, error: "Forbidden: Only super_admin can delete staff accounts" },
        { status: 403 }
      );
    }

    const { id } = await params;
    if (admin.id === id) {
      return NextResponse.json(
        { success: false, error: "Cannot delete your own admin account" },
        { status: 400 }
      );
    }

    const pool = getDbPool();
    await pool.query("DELETE FROM admin_users WHERE id = ?", [id]);

    // Record audit log
    const auditId = `audit_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
    const clientIp = request.headers.get("x-forwarded-for") || "internal";
    await pool.query(
      `INSERT INTO admin_audit_logs (id, actor, action, resource, details_json, ip_address, created_at)
       VALUES (?, ?, 'STAFF_USER_DELETED', ?, ?, ?, NOW())`,
      [
        auditId,
        `${admin.fullName || admin.email} (${admin.role})`,
        `admin_user:${id}`,
        JSON.stringify({ deletedUserId: id }),
        clientIp,
      ]
    ).catch(() => {});

    return NextResponse.json({ success: true, message: "User deleted successfully" });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Failed to delete user", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
