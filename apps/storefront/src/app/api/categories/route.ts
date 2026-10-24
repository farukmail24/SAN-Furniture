import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { autoSeedDatabaseIfNeeded } from "@/lib/auto-seed";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const pool = getDbPool();

    let [rows]: any = await pool
      .query("SELECT id, name, handle, description, hero_image as heroImage, created_at FROM categories ORDER BY created_at ASC")
      .catch(() => [[]]);

    if (!Array.isArray(rows) || rows.length === 0) {
      await autoSeedDatabaseIfNeeded();
      const [reFetched]: any = await pool
        .query("SELECT id, name, handle, description, hero_image as heroImage, created_at FROM categories ORDER BY created_at ASC")
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
