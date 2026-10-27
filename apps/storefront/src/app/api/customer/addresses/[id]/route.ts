import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { getCustomerFromRequest, getAdminFromRequest } from "@/lib/auth-token";

export const dynamic = "force-dynamic";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCust = await getCustomerFromRequest(request);
    const authAdmin = !authCust ? await getAdminFromRequest(request) : null;

    if (!authCust && !authAdmin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const pool = getDbPool();

    if (authCust) {
      const [addr]: any = await pool.query(
        "SELECT a.id FROM customer_addresses a JOIN customers c ON a.customer_id = c.id WHERE a.id = ? AND LOWER(c.email) = ? LIMIT 1",
        [id, authCust.email.toLowerCase()]
      );
      if (!addr || addr.length === 0) {
        return NextResponse.json({ success: false, error: "Address not found or does not belong to your account" }, { status: 404 });
      }
    }

    await pool.query("DELETE FROM customer_addresses WHERE id = ?", [id]);

    return NextResponse.json({
      success: true,
      message: "Address deleted successfully",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Failed to delete address", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
