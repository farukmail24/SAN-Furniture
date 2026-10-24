import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pool = getDbPool();

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
