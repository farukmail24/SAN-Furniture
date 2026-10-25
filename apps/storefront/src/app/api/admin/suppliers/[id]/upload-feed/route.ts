import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth-token";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id: supId } = await params;
    const body = await request.json().catch(() => ({}));
    const { feedContent } = body;

    if (!feedContent || typeof feedContent !== "string") {
      return NextResponse.json(
        { success: false, error: "Missing feedContent string payload" },
        { status: 400 }
      );
    }

    const pool = getDbPool();
    let supplierCode = supId;
    if (supId === "sup_amos_mann" || supId === "amos_mann_furniture") {
      supplierCode = "amos_mann_furniture";
    } else if (supId === "sup_furniture_to_go" || supId === "furniture_to_go") {
      supplierCode = "furniture_to_go";
    }

    // Update supplier last sync
    await pool.query(
      "UPDATE suppliers SET last_sync_at = NOW(), sync_status = 'operational' WHERE id = ? OR code = ?",
      [supId, supplierCode]
    );

    return NextResponse.json({
      success: true,
      message: `Feed content processed successfully for ${supplierCode}.`,
    });
  } catch (err: any) {
    console.error("[Upload Feed Route Error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to process feed" },
      { status: 500 }
    );
  }
}
