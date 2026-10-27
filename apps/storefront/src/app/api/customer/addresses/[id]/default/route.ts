import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { getCustomerFromRequest, getAdminFromRequest } from "@/lib/auth-token";

export const dynamic = "force-dynamic";

export async function PATCH(
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
    const body = await request.json().catch(() => ({}));
    const isBilling = body.type === "billing";

    const pool = getDbPool();

    // Get customer_id of this address
    const [addrRows]: any = await pool.query(
      "SELECT customer_id FROM customer_addresses WHERE id = ? LIMIT 1",
      [id]
    );

    if (!addrRows || addrRows.length === 0) {
      return NextResponse.json({ success: false, error: "Address not found" }, { status: 404 });
    }

    const customerId = addrRows[0].customer_id;

    if (authCust && authCust.id !== customerId) {
      return NextResponse.json({ success: false, error: "Forbidden: Address does not belong to you" }, { status: 403 });
    }

    if (isBilling) {
      await pool.query("UPDATE customer_addresses SET is_default_billing = 0 WHERE customer_id = ?", [customerId]);
      await pool.query("UPDATE customer_addresses SET is_default_billing = 1 WHERE id = ?", [id]);
    } else {
      await pool.query("UPDATE customer_addresses SET is_default_delivery = 0 WHERE customer_id = ?", [customerId]);
      await pool.query("UPDATE customer_addresses SET is_default_delivery = 1 WHERE id = ?", [id]);
    }

    return NextResponse.json({
      success: true,
      message: `Default ${isBilling ? "billing" : "delivery"} address updated successfully`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Failed to update default address", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
