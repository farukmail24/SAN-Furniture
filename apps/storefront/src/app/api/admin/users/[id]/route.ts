import { NextResponse } from "next/server";
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

    const { id } = await params;
    if (admin.id === id) {
      return NextResponse.json(
        { success: false, error: "Cannot delete your own admin account" },
        { status: 400 }
      );
    }

    const pool = getDbPool();
    await pool.query("DELETE FROM admin_users WHERE id = ?", [id]);

    return NextResponse.json({ success: true, message: "User deleted successfully" });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Failed to delete user", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
