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
    const pool = getDbPool();

    // 1. STAGED / VERIFIED BATCH IMPORT WORKFLOW (Admin confirmed from Preview Screen)
    if (Array.isArray(body.items) && body.items.length > 0) {
      const importedProducts = [];
      const importErrors = [];

      for (const item of body.items) {
        if (!item.url || typeof item.url !== "string" || !item.url.startsWith("http")) {
          continue;
        }

        try {
          const tradePriceGbp = Number(item.tradePriceGbp || item.costPriceGbp) || 0;
          const tradeCostPennies = Math.round(tradePriceGbp * 100);
          const markup = Number(item.markupPercent) || 40;
          const categoryId = item.categoryId || "auto";
          const deliveryTier = item.deliveryTier || "standard_parcel";
          const assemblyUrl = item.assemblyInstructionsUrl || null;
          const title = item.title ? String(item.title).trim() : null;
          const images = Array.isArray(item.images) && item.images.length > 0 ? item.images : null;

          const imported = await furnitureToGoExtractor.extractAndImportUrl(
            pool,
            item.url.trim(),
            categoryId,
            deliveryTier,
            assemblyUrl,
            tradeCostPennies,
            markup,
            title,
            images
          );

          importedProducts.push(imported);
        } catch (itemErr: any) {
          console.error(`[FTG Staged Import Error] ${item.url}:`, itemErr.message);
          importErrors.push({ url: item.url, error: itemErr.message });
        }
      }

      return NextResponse.json(
        {
          success: true,
          importedCount: importedProducts.length,
          failedCount: importErrors.length,
          message: `Successfully confirmed & imported ${importedProducts.length} verified products into catalog!`,
          products: importedProducts,
          errors: importErrors,
        },
        { status: 201 }
      );
    }

    // 2. LEGACY / DIRECT URL(S) IMPORT WORKFLOW
    const rawUrls = Array.isArray(body.urls)
      ? body.urls
      : body.url
      ? String(body.url).split(/[\r\n,]+/)
      : [];

    const urls = rawUrls.map((u: any) => String(u).trim()).filter((u: string) => u.startsWith("http"));

    if (urls.length === 0) {
      return NextResponse.json(
        { success: false, error: "At least one valid Furniture To Go product URL or staged item is required" },
        { status: 400 }
      );
    }

    const categoryId = body.categoryId || "auto";
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
          message: `Successfully batch-imported ${batchRes.importedCount} products into catalog!`,
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
