import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { getCustomerFromRequest, getAdminFromRequest } from "@/lib/auth-token";

export const dynamic = "force-dynamic";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const queryEmail = (searchParams.get("email") || "").trim().toLowerCase();

    const authCust = await getCustomerFromRequest(request);
    const authAdmin = !authCust ? await getAdminFromRequest(request) : null;

    if (!authCust && !authAdmin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Sign in required to modify wishlist" },
        { status: 401 }
      );
    }

    const targetEmail = authCust ? authCust.email.toLowerCase() : queryEmail;

    if (!id || !targetEmail) {
      return NextResponse.json(
        { success: false, error: "Missing item identifier or authenticated customer email" },
        { status: 400 }
      );
    }

    const pool = getDbPool();
    await pool.query(
      "DELETE FROM customer_wishlist WHERE (id = ? OR product_id = ?) AND LOWER(customer_email) = ?",
      [id, id, targetEmail]
    );

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
