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

    const { firstName, lastName, email, phone } = body;

    await pool.query(
      `UPDATE customers 
       SET first_name = COALESCE(?, first_name),
           last_name = COALESCE(?, last_name),
           email = COALESCE(?, email),
           phone = COALESCE(?, phone)
       WHERE id = ?`,
      [firstName, lastName, email, phone, id]
    );

    return NextResponse.json({ success: true, message: "Customer profile updated successfully" });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Failed to update customer", details: err?.message || String(err) },
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

    await pool.query("DELETE FROM customer_addresses WHERE customer_id = ?", [id]);
    await pool.query("DELETE FROM customer_wishlist WHERE customer_id = ?", [id]);
    await pool.query("DELETE FROM customers WHERE id = ?", [id]);

    return NextResponse.json({ success: true, message: "Customer profile deleted successfully" });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Failed to delete customer", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
