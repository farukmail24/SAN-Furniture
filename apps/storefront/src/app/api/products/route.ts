import { NextResponse } from "next/server";
import { fetchLiveProductsFromDb } from "@/lib/catalog-server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryFilter = searchParams.get("category");
    const refresh = searchParams.get("refresh") === "true";
    const debug = searchParams.get("debug") === "true";

    if (debug) {
      const { getDbPool } = await import("@/lib/db");
      const pool = getDbPool();
      const [statusCounts]: any = await pool.query(
        "SELECT status, count(*) as count FROM products GROUP BY status"
      ).catch(() => [[]]);
      const [totalProducts]: any = await pool.query(
        "SELECT count(*) as count FROM products"
      ).catch(() => [[]]);
      const [specCounts]: any = await pool.query(
        "SELECT count(*) as count, count(distinct product_id) as distinct_prod FROM furniture_specs"
      ).catch(() => [[]]);
      const [dupeSpecs]: any = await pool.query(
        "SELECT product_id, count(*) as count FROM furniture_specs GROUP BY product_id HAVING count > 1"
      ).catch(() => [[]]);
      const [nonPublished]: any = await pool.query(
        "SELECT id, title, status FROM products WHERE status NOT IN ('published', 'active')"
      ).catch(() => [[]]);

      return NextResponse.json({
        success: true,
        totalInProductsTable: totalProducts[0]?.count || 0,
        statusCounts,
        specCounts,
        dupeSpecs,
        nonPublished,
      });
    }

    const products = await fetchLiveProductsFromDb(refresh);
    const filtered = categoryFilter
      ? products.filter((p) => p.categoryId === categoryFilter)
      : products;

    return NextResponse.json(
      {
        success: true,
        products: filtered,
        total: filtered.length,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, max-age=15, stale-while-revalidate=120",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (err: any) {
    console.error("Failed to fetch public products from MySQL:", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch products", details: err?.message || String(err), products: [] },
      { status: 500 }
    );
  }
}
