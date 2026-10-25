import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth-token";
import { furnitureToGoExtractor } from "@/lib/dropship";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const pool = getDbPool();
    const syncResult = await furnitureToGoExtractor.syncTrackedCatalog(pool, { triggerType: "manual" });

    return NextResponse.json({
      success: true,
      message: `Furniture To Go sync completed: ${syncResult.itemsScanned} items verified, ${syncResult.pricesUpdated} prices updated, ${syncResult.stockUpdated} stock status updated.`,
      syncResult,
    });
  } catch (err: any) {
    console.error("[FTG Sync Catalog Error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to sync Furniture To Go catalog" },
      { status: 500 }
    );
  }
}
