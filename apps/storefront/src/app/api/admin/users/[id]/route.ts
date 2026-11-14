import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { getDbPool } from "@/lib/db";
import { getAdminFromRequest, hashPassword } from "@/lib/auth-token";
import { ensure2FASchema } from "@/lib/ensure-2fa-schema";

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

    await ensure2FASchema().catch(() => {});

    const { id } = await params;
    const pool = getDbPool();
    const body = await request.json().catch(() => ({}));

    const { fullName, role, isActive, password, resetTwoFactor } = body;

    // Privilege check: Only super_admin can reset 2FA
    if (resetTwoFactor && admin.role !== "super_admin") {
      return NextResponse.json(
        { success: false, error: "Forbidden: Only super_admin can reset 2FA security" },
        { status: 403 }
      );
    }

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

    // Password change privilege check: Super admin can reset any staff password; users can reset their own.
    if (password !== undefined && password !== null && password !== "") {
      if (admin.role !== "super_admin" && admin.id !== id) {
        return NextResponse.json(
          { success: false, error: "Forbidden: Only super_admin or the account owner can reset password" },
          { status: 403 }
        );
      }
      if (typeof password !== "string" || password.trim().length < 8) {
        return NextResponse.json(
          { success: false, error: "Password must be at least 8 characters long" },
          { status: 400 }
        );
      }
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
    if (password !== undefined && password !== null && password !== "") {
      const newHash = hashPassword(password.trim());
      updates.push("password_hash = ?");
      values.push(newHash);
    }
    if (resetTwoFactor) {
      updates.push("two_factor_enabled = 0");
      updates.push("two_factor_secret = NULL");
      updates.push("two_factor_temp_secret = NULL");
      updates.push("email_otp_code = NULL");
      updates.push("email_otp_expires_at = NULL");
      updates.push("two_factor_recovery_codes = NULL");
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
          JSON.stringify({
            targetUserId: id,
            changes: { fullName, role, isActive, passwordReset: Boolean(password), resetTwoFactor: Boolean(resetTwoFactor) },
          }),
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
