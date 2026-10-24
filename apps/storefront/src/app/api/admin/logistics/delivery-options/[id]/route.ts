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
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const pool = getDbPool();
    const body = await request.json();

    const {
      name,
      badge,
      pricePennies,
      description,
      timeframe,
      serviceScope,
      regions,
      allowedPrefixes,
      excludedPrefixes,
      minOrderPennies,
      isActive,
      sortOrder,
    } = body;

    const updates: string[] = [];
    const values: any[] = [];

    if (name !== undefined) {
      updates.push("name = ?");
      values.push(name);
    }
    if (badge !== undefined) {
      updates.push("badge = ?");
      values.push(badge);
    }
    if (pricePennies !== undefined) {
      updates.push("price_pennies = ?");
      values.push(Number(pricePennies) || 0);
    }
    if (description !== undefined) {
      updates.push("description = ?");
      values.push(description);
    }
    if (timeframe !== undefined) {
      updates.push("timeframe = ?");
      values.push(timeframe);
    }
    if (serviceScope !== undefined) {
      updates.push("service_scope = ?");
      values.push(serviceScope);
    }
    if (regions !== undefined) {
      updates.push("regions_json = ?");
      values.push(JSON.stringify(regions));
    }
    if (allowedPrefixes !== undefined) {
      updates.push("allowed_prefixes = ?");
      values.push(allowedPrefixes);
    }
    if (excludedPrefixes !== undefined) {
      updates.push("excluded_prefixes = ?");
      values.push(excludedPrefixes);
    }
    if (minOrderPennies !== undefined) {
      updates.push("min_order_pennies = ?");
      values.push(Number(minOrderPennies) || 0);
    }
    if (isActive !== undefined) {
      updates.push("is_active = ?");
      values.push(isActive ? 1 : 0);
    }
    if (sortOrder !== undefined) {
      updates.push("sort_order = ?");
      values.push(Number(sortOrder) || 0);
    }

    updates.push("updated_at = NOW()");

    if (updates.length > 1) {
      values.push(id);
      await pool.query(
        `UPDATE delivery_options SET ${updates.join(", ")} WHERE id = ?`,
        values
      );
    }

    return NextResponse.json({
      success: true,
      message: "Delivery option updated successfully",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
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

    await pool.query("DELETE FROM delivery_options WHERE id = ?", [id]);

    return NextResponse.json({
      success: true,
      message: "Delivery option deleted successfully",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
