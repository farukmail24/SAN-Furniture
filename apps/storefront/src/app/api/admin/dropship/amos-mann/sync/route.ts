import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth-token";
import { amosMannExtractor } from "@/lib/dropship";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const pool = getDbPool();
    const syncResult = await amosMannExtractor.syncTrackedCatalog(pool, { triggerType: "manual" });

    return NextResponse.json(syncResult);
  } catch (err: any) {
    console.error("[Amos Mann Sync Error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to sync Amos Mann catalog" },
      { status: 500 }
    );
  }
}
