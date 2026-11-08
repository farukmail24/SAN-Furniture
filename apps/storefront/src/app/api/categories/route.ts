import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { autoSeedDatabaseIfNeeded } from "@/lib/auto-seed";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const pool = getDbPool();

    // Auto-heal duplicate default image for Sale if it still matches legacy green sofa
    await pool.query("UPDATE `categories` SET `hero_image` = 'https://images.unsplash.com/photo-1579656381226-5fc0f0100c3b?auto=format&fit=crop&w=1600&q=85' WHERE `id` = 'cat_sale' AND `hero_image` = 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1600&q=85'").catch(() => {});

    let [rows]: any = await pool
      .query("SELECT id, name, handle, description, hero_image as heroImage, created_at FROM categories ORDER BY FIELD(id, 'cat_living', 'cat_sofas', 'cat_dining', 'cat_beds', 'cat_kids', 'cat_office', 'cat_bathroom', 'cat_sale'), id ASC")
      .catch(() => [[]]);

    if (!Array.isArray(rows) || rows.length < 8) {
      await autoSeedDatabaseIfNeeded();
      const [reFetched]: any = await pool
        .query("SELECT id, name, handle, description, hero_image as heroImage, created_at FROM categories ORDER BY FIELD(id, 'cat_living', 'cat_sofas', 'cat_dining', 'cat_beds', 'cat_kids', 'cat_office', 'cat_bathroom', 'cat_sale'), id ASC")
        .catch(() => [[]]);
      rows = reFetched;
    }

    const categories = Array.isArray(rows) ? rows : [];

    return NextResponse.json(
      {
        success: true,
        categories,
        total: categories.length,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, max-age=30, stale-while-revalidate=300",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (err: any) {
    console.error("Failed to fetch public categories from MySQL:", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch categories", details: err?.message || String(err), categories: [] },
      { status: 500 }
    );
  }
}
