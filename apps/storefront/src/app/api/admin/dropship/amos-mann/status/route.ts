import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth-token";
import { amosMannExtractor } from "@/lib/dropship";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const pool = getDbPool();
    const engineStatus = await amosMannExtractor.getEngineStatus(pool);

    return NextResponse.json({
      supplier: "Amos Mann Furniture",
      hub: "Leicester UK Warehouse",
      feedType: "Automated Live Web Scraper & Reconciler",
      leadTimeDays: 5,
      defaultDelivery: "2-Man White Glove / Pallet",
      activeSkus: engineStatus.trackedCount,
      items: engineStatus.trackedProducts,
      recentLogs: engineStatus.recentLogs,
      supplierInfo: engineStatus.supplier,
    });
  } catch (err: any) {
    console.error("[Amos Mann Status Error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch Amos Mann status" },
      { status: 500 }
    );
  }
}
