import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const email = (searchParams.get("email") || "").trim().toLowerCase();

    const pool = getDbPool();
    if (email) {
      await pool.query(
        "DELETE FROM customer_wishlist WHERE (id = ? OR product_id = ?) AND LOWER(customer_email) = ?",
        [id, id, email]
      );
    } else {
      await pool.query(
        "DELETE FROM customer_wishlist WHERE id = ? OR product_id = ?",
        [id, id]
      );
    }

    return NextResponse.json({
      success: true,
      message: "Item removed from wishlist",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Failed to remove item", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
