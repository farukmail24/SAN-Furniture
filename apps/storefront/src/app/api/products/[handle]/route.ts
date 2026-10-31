import { NextResponse } from "next/server";
import { fetchLiveProductsFromDb } from "@/lib/catalog-server";
import { normalizeProductHandle } from "@san-furniture/types";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ handle: string }> }
) {
  try {
    const { handle } = await params;
    const cleanHandle = (handle || "").toString().trim();
    const normalized = normalizeProductHandle(cleanHandle);

    const products = await fetchLiveProductsFromDb();
    const product = products.find(
      (p) =>
        p.handle === normalized ||
        p.id === normalized ||
        p.handle === cleanHandle ||
        p.id === cleanHandle ||
        p.handle.toLowerCase() === cleanHandle.toLowerCase()
    );

    if (!product) {
      return NextResponse.json(
        { success: false, error: `Product not found for handle "${cleanHandle}"` },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, product },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch product", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
