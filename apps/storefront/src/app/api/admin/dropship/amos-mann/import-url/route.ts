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
          const deliveryTier = item.deliveryTier || "two_man_white_glove";
          const title = item.title ? String(item.title).trim() : null;
          const images = Array.isArray(item.images) && item.images.length > 0 ? item.images : null;

          const imported = await amosMannExtractor.extractAndImportUrl(
            pool,
            item.url.trim(),
            categoryId,
            deliveryTier,
            null,
            tradeCostPennies > 0 ? tradeCostPennies : null,
            markup,
            title,
            images
          );

          importedProducts.push(imported);
        } catch (itemErr: any) {
          console.error(`[Amos Mann Staged Import Error] ${item.url}:`, itemErr.message);
          const reasons = Array.isArray(itemErr.problems)
            ? itemErr.problems
            : Array.isArray(itemErr.reasons)
            ? itemErr.reasons
            : [{ field: "import", reason: itemErr.message || "Failed to import" }];
          importErrors.push({ url: item.url, error: itemErr.message, reasons });
        }
      }

      return NextResponse.json(
        {
          success: true,
          importedCount: importedProducts.length,
          failedCount: importErrors.length,
          message: `Successfully batch-imported ${importedProducts.length} verified products into catalog!${
            importErrors.length > 0 ? ` (${importErrors.length} failed/skipped)` : ""
          }`,
          products: importedProducts,
          errors: importErrors,
        },
        { status: 201 }
      );
    }

    // 2. DIRECT URL IMPORT WORKFLOW (Single or batch URLs)
    const rawUrls = Array.isArray(body.urls)
      ? body.urls
      : body.url
      ? String(body.url).split(/[\r\n,]+/)
      : [];

    const urls = rawUrls.map((u: any) => String(u).trim()).filter((u: string) => u.startsWith("http"));

    if (urls.length === 0) {
      return NextResponse.json(
        { success: false, error: "At least one valid Amos Mann product URL is required" },
        { status: 400 }
      );
    }

    const categoryId = body.categoryId || "auto";
    const deliveryTier = body.deliveryTier || "two_man_white_glove";

    if (urls.length === 1) {
      const imported = await amosMannExtractor.extractAndImportUrl(
        pool,
        urls[0],
        categoryId,
        deliveryTier
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
      const batchRes = await amosMannExtractor.batchImportUrls(
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
    console.error("[Amos Mann Import URL Error]:", err);
    const reasons = Array.isArray(err.problems)
      ? err.problems
      : Array.isArray(err.reasons)
      ? err.reasons
      : [{ field: "import", reason: err.message || "Failed to import" }];
    return NextResponse.json(
      { success: false, error: err.message || "Failed to import Amos Mann product", reasons },
      { status: 500 }
    );
  }
}
