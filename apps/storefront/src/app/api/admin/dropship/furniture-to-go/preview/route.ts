import { NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/auth-token";
import { furnitureToGoExtractor } from "@/lib/dropship";
import { classifyFurnitureProduct } from "@san-furniture/types";

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
        { success: false, error: "At least one valid Furniture To Go URL is required to preview" },
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
        const liveData = await furnitureToGoExtractor.extractProductData(url);
        const cleanTitle = furnitureToGoExtractor.cleanProductTitle(liveData.title);

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
        const netRetailPennies = Math.round(tradeCostPennies * (1 + defaultMarkup / 100));
        const retailPricePennies = Math.round(netRetailPennies * 1.20);
        const compareAtPennies = Math.round(retailPricePennies * 1.25);

        const netRetailGbp = netRetailPennies / 100;
        const retailPriceGbp = retailPricePennies / 100;
        const vatGbp = Math.round((retailPricePennies - netRetailPennies)) / 100;
        const profitGbp = Math.round((netRetailPennies - tradeCostPennies)) / 100;

        const tier = requestedDeliveryTier || liveData.deliveryTier || "standard_parcel";

        items.push({
          url,
          title: cleanTitle,
          sku: liveData.sku,
          thumbnail: liveData.images[0] || "https://images.unsplash.com/photo-1595428774223-ef52624120d2",
          images: liveData.images,
          tradePriceGbp,
          tradeCostPennies,
          priceVerified: Boolean(liveData.priceVerified),
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
          weightKg: liveData.weightKg || 30,
          dimensions: liveData.dimensions || { width_cm: 100, height_cm: 80, depth_cm: 50 },
          description: liveData.description || "",
          rangeName: liveData.rangeName || "Scandinavian Range",
          isOutOfStock: Boolean(liveData.isOutOfStock),
          assemblyInstructionsUrl: liveData.assemblyInstructionsUrl || null,
          warning: liveData.priceVerified
            ? null
            : "Wholesale trade cost could not be detected automatically. Please verify supplier trade price (£).",
        });
      } catch (err: any) {
        errors.push({ url, error: err.message || "Failed to extract product" });
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
    console.error("[FTG Preview Error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to preview Furniture To Go products" },
      { status: 500 }
    );
  }
}
