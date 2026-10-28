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

    const body = await request.json().catch(() => ({}));
    const rawUrls = Array.isArray(body.urls)
      ? body.urls
      : body.url
      ? String(body.url).split(/[\r\n,]+/)
      : [];

    const urls = rawUrls.map((u: any) => String(u).trim()).filter((u: string) => u.startsWith("http"));

    if (urls.length === 0) {
      return NextResponse.json(
        { success: false, error: "At least one valid Furniture To Go product URL is required" },
        { status: 400 }
      );
    }

    const pool = getDbPool();
    const categoryId = body.categoryId || "cat_beds";
    const deliveryTier = body.deliveryTier || "standard_parcel";
    const assemblyInstructionsUrl = body.assemblyInstructionsUrl || body.assembly_instructions_url || null;

    if (urls.length === 1) {
      const imported = await furnitureToGoExtractor.extractAndImportUrl(
        pool,
        urls[0],
        categoryId,
        deliveryTier,
        assemblyInstructionsUrl
      );
      return NextResponse.json(
        {
          success: true,
          importedCount: 1,
          message: `Product "${imported.title}" successfully extracted & imported into catalog!`,
          product: imported,
        },
        { status: 201 }
      );
    } else {
      const batchRes = await furnitureToGoExtractor.batchImportUrls(
        pool,
        urls,
        categoryId,
        deliveryTier
      );
      return NextResponse.json(
        {
          success: true,
          importedCount: batchRes.importedCount,
          failedCount: batchRes.failedCount,
          message: `Successfully batch-imported ${batchRes.importedCount} FTG products into catalog!`,
          products: batchRes.products,
          errors: batchRes.errors,
        },
        { status: 201 }
      );
    }
  } catch (err: any) {
    console.error("[FTG Import URL Error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to import Furniture To Go product" },
      { status: 500 }
    );
  }
}
