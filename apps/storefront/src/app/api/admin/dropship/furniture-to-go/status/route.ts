import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth-token";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const pool = getDbPool();
    const [items]: any = await pool.query(`
      SELECT fi.*, p.title, p.handle, p.thumbnail_url
      FROM supplier_feed_items fi
      JOIN products p ON fi.product_id = p.id
      WHERE fi.supplier_id = 'furniture_to_go'
      ORDER BY fi.stock_level DESC
    `).catch(() => [[]]);

    return NextResponse.json({
      supplier: "Furniture To Go (FTG)",
      hub: "Melksham, Wiltshire UK Distribution Centre",
      feedType: "B2B CSV / Direct DPD & 2-Man Dropship",
      leadTimeDays: 3,
      defaultDelivery: "DPD Express (<40kg) / 2-Man Room of Choice (>40kg)",
      activeSkus: items?.length || 0,
      items: items || [],
    });
  } catch (err: any) {
    console.error("[FTG Status Error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch Furniture To Go status" },
      { status: 500 }
    );
  }
}
