import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth-token";
import { furnitureToGoExtractor } from "@/lib/dropship";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || "all";

    const pool = getDbPool();
    const discovery = await furnitureToGoExtractor.discoverSitemapProducts(pool, category);

    return NextResponse.json(discovery);
  } catch (err: any) {
    console.error("[FTG Sitemap Catalog Error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to load Furniture To Go sitemap catalog" },
      { status: 500 }
    );
  }
}
