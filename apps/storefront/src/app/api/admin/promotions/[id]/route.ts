import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth-token";
import { ensureVoucherSchema } from "@/lib/ensure-voucher-schema";

export const dynamic = "force-dynamic";

function parseDbDate(val: any): string | null {
  if (!val) return null;
  const d = new Date(val);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 19).replace("T", " ");
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await ensureVoucherSchema();

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const pool = getDbPool();

    // Check if simple status toggle
    if (Object.keys(body).length === 1 && typeof body.isActive !== "undefined") {
      const isActive = body.isActive ? 1 : 0;
      await pool.query("UPDATE promotions SET is_active = ? WHERE id = ? OR code = ?", [
        isActive,
        id,
        id,
      ]);
      return NextResponse.json({ success: true, message: "Promotion status updated" });
    }

    // Full update
    const fields: string[] = [];
    const values: any[] = [];

    if (typeof body.description === "string") {
      fields.push("description = ?");
      values.push(body.description);
    }
    if (body.discountType) {
      fields.push("discount_type = ?");
      values.push(body.discountType);
    }
    if (typeof body.discountValue !== "undefined") {
      fields.push("discount_value = ?");
      values.push(Number(body.discountValue) || 0);
    }
    if (typeof body.maxDiscountPennies !== "undefined") {
      fields.push("max_discount_pennies = ?");
      values.push(body.maxDiscountPennies ? Number(body.maxDiscountPennies) : null);
    }
    if (typeof body.minOrderPennies !== "undefined") {
      fields.push("min_order_pennies = ?");
      values.push(Number(body.minOrderPennies) || 0);
    }
    if (typeof body.isActive !== "undefined") {
      fields.push("is_active = ?");
      values.push(body.isActive ? 1 : 0);
    }
    if (typeof body.startsAt !== "undefined") {
      fields.push("starts_at = ?");
      values.push(parseDbDate(body.startsAt));
    }
    if (typeof body.expiresAt !== "undefined") {
      fields.push("expires_at = ?");
      values.push(parseDbDate(body.expiresAt));
    }
    if (typeof body.maxUses !== "undefined") {
      fields.push("max_uses = ?");
      values.push(Number(body.maxUses) || 1000);
    }
    if (typeof body.perCustomerLimit !== "undefined") {
      fields.push("per_customer_limit = ?");
      values.push(Number(body.perCustomerLimit) || 1);
    }
    if (typeof body.firstOrderOnly !== "undefined") {
      fields.push("first_order_only = ?");
      values.push(body.firstOrderOnly ? 1 : 0);
    }

    if (fields.length === 0) {
      return NextResponse.json({ success: false, error: "No fields provided to update" }, { status: 400 });
    }

    values.push(id, id);
    await pool.query(
      `UPDATE promotions SET ${fields.join(", ")} WHERE id = ? OR code = ?`,
      values
    );

    return NextResponse.json({ success: true, message: "Promotion updated successfully" });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Failed to update promotion", details: err?.message || String(err) },
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
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const pool = getDbPool();

    await pool.query("DELETE FROM promotions WHERE id = ? OR code = ?", [id, id]);

    return NextResponse.json({ success: true, message: "Promotion deleted successfully" });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Failed to delete promotion", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
