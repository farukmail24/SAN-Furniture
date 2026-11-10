import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth-token";
import { amosMannExtractor } from "@/lib/dropship";
import { classifyFurnitureProduct } from "@san-furniture/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const pool = getDbPool();
    await amosMannExtractor.loadAuthSession(pool);

    const body = await request.json().catch(() => ({}));
    const rawUrls = Array.isArray(body.urls)
      ? body.urls
      : body.url
      ? String(body.url).split(/[\r\n,]+/)
      : [];

    const urls = rawUrls.map((u: any) => String(u).trim()).filter((u: string) => u.startsWith("http"));

    if (urls.length === 0) {
      return NextResponse.json(
        { success: false, error: "At least one valid Amos Mann product URL is required to preview" },
        { status: 400 }
      );
    }

    const defaultMarkup = typeof body.markupPercent === "number" && !isNaN(body.markupPercent)
      ? body.markupPercent
      : 40;
    const requestedCategory = body.categoryId || "auto";
    const requestedDeliveryTier = body.deliveryTier || null;

    const items = [];
    const errors = [];

    for (const url of urls) {
      try {
        const liveData = await amosMannExtractor.extractProductData(url, {
          mode: "import",
          optionalFields: ["price"],
        });
        const cleanTitle = amosMannExtractor.cleanProductTitle(liveData.title);

        let finalCategoryId = requestedCategory;
        let finalCategoryLabel = "Auto-Detect";
        if (!finalCategoryId || finalCategoryId === "auto") {
          const classification = classifyFurnitureProduct({
            title: cleanTitle,
            description: liveData.description,
            url,
            range_name: liveData.rangeName,
          });
          finalCategoryId = classification.categoryId;
          finalCategoryLabel = classification.categoryName;
        }

        const tradePriceGbp = Number(liveData.priceGbp) || 0;
        const tradeCostPennies = Math.round(tradePriceGbp * 100);
        const tier = requestedDeliveryTier || liveData.deliveryTier || "two_man_white_glove";
        const carriagePennies = liveData.extractedDeliveryPennies || (tier === "standard_parcel" ? 1995 : 4900);

        const pricing = amosMannExtractor.calculateRetailPrice(tradeCostPennies, carriagePennies, defaultMarkup);
        const retailPricePennies = pricing.retailPricePennies;
        const compareAtPennies = pricing.compareAtPennies || Math.round(retailPricePennies * 1.25);
        const netRetailPennies = pricing.netRetail;

        const netRetailGbp = netRetailPennies / 100;
        const retailPriceGbp = retailPricePennies / 100;
        const vatGbp = Math.round(retailPricePennies - netRetailPennies) / 100;
        const profitGbp = Math.round(netRetailPennies - (tradeCostPennies + carriagePennies)) / 100;

        items.push({
          url,
          sku: liveData.sku,
          title: cleanTitle,
          thumbnail: (liveData.images && liveData.images[0]) || "",
          images: Array.isArray(liveData.images) ? liveData.images : [],
          tradePriceGbp,
          markupPercent: defaultMarkup,
          netRetailGbp,
          vatGbp,
          retailPriceGbp,
          retailPricePennies,
          compareAtPennies,
          profitGbp,
          categoryId: finalCategoryId,
          categoryLabel: finalCategoryLabel,
          deliveryTier: tier,
          weightKg: liveData.weightKg || null,
          dimensions: liveData.dimensions || null,
          description: liveData.description || "",
          rangeName: liveData.rangeName || "Amos Mann Collection",
          isOutOfStock: Boolean(liveData.isOutOfStock),
          assemblyInstructionsUrl: null,
          warning: null,
        });
      } catch (err: any) {
        const reasons = Array.isArray(err.problems)
          ? err.problems
          : Array.isArray(err.reasons)
          ? err.reasons
          : [{ field: "scrape", reason: err.message || "Failed to extract product" }];

        errors.push({
          url,
          error: err.message || "Failed to extract product",
          reasons,
        });
      }
    }

    return NextResponse.json({
      success: true,
      totalRequested: urls.length,
      extractedCount: items.length,
      items,
      errors,
    });
  } catch (err: any) {
    console.error("[Amos Mann Preview Error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to preview Amos Mann products" },
      { status: 500 }
    );
  }
}
