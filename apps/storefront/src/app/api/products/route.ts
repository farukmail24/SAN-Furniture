import { NextResponse } from "next/server";
import { fetchLiveProductsFromDb } from "@/lib/catalog-server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryFilter = searchParams.get("category");
    const refresh = searchParams.get("refresh") === "true";

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
