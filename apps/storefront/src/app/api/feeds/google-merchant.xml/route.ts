import { NextResponse } from "next/server";
import { getLiveProducts } from "@/lib/catalog";
import { getStorefrontTrackingSettings } from "@/lib/tracking-server";

const CATEGORY_MAP: Record<string, string> = {
  cat_sofas: "Home & Garden > Furniture > Sofas",
  cat_armchairs: "Home & Garden > Furniture > Chairs > Armchairs, Recliners & Sleeper Chairs",
  cat_dining: "Home & Garden > Furniture > Dining Room Furniture",
  cat_beds: "Home & Garden > Furniture > Bedroom Furniture > Beds & Bed Frames",
  cat_living: "Home & Garden > Furniture > Tables > Coffee Tables",
  cat_office: "Home & Garden > Furniture > Office Furniture > Desks",
};

function escapeXml(unsafe: any): string {
  return String(unsafe ?? "")
    // Strip XML 1.0 disallowed control characters (Char value 8 backspace, etc.)
    // Allowed XML 1.0: 0x9 (tab), 0xA (LF), 0xD (CR), 0x20-0xD7FF, 0xE000-0xFFFD
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const tracking = await getStorefrontTrackingSettings();

  if (!tracking.google_merchant_feed_enabled) {
    return new NextResponse("Google Merchant Center feed is currently disabled by administrator.", {
      status: 403,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const baseUrl = "https://sanfurniture.com";
  const liveProducts = await getLiveProducts();
  const freeShippingThresholdPennies = Math.round(Number(tracking.google_merchant_free_shipping_threshold || "500") * 100);
  const defaultShippingCostGbp = `${Number(tracking.google_merchant_shipping_cost || "49.00").toFixed(2)} GBP`;

  const itemsXml = liveProducts.filter((p) => p.status !== "draft")
    .map((p) => {
      const link = `${baseUrl}/products/${p.handle}`;
      const priceGbp = `${(p.pricePennies / 100).toFixed(2)} GBP`;
      const availability = p.status === "published" ? "in_stock" : "out_of_stock";
      const googleCat = CATEGORY_MAP[p.categoryId] || "Home & Garden > Furniture";
      const shippingCost = p.pricePennies >= freeShippingThresholdPennies ? "0.00 GBP" : defaultShippingCostGbp;

      return `    <item>
      <g:id>${escapeXml(p.id)}</g:id>
      <g:title>${escapeXml(p.title)}</g:title>
      <g:description>${escapeXml(p.description)}</g:description>
      <g:link>${escapeXml(link)}</g:link>
      <g:image_link>${escapeXml(p.thumbnailUrl)}</g:image_link>
      <g:availability>${availability}</g:availability>
      <g:price>${priceGbp}</g:price>
      <g:brand>${escapeXml(tracking.google_merchant_brand)}</g:brand>
      <g:gtin>${escapeXml(p.gtinBarcode)}</g:gtin>
      <g:mpn>${escapeXml(p.id)}</g:mpn>
      <g:condition>new</g:condition>
      <g:google_product_category>${escapeXml(googleCat)}</g:google_product_category>
      <g:shipping>
        <g:country>GB</g:country>
        <g:service>${escapeXml(tracking.google_merchant_shipping_service)}</g:service>
        <g:price>${shippingCost}</g:price>
      </g:shipping>
      <g:material>${escapeXml(p?.specs?.material)}</g:material>
      <g:color>${escapeXml(p?.specs?.color)}</g:color>
      <g:custom_label_0>${escapeXml(p?.specs?.delivery_tier)}</g:custom_label_0>
      <g:custom_label_1>UK Quality Checked</g:custom_label_1>
      <g:custom_label_2>${p.pricePennies >= freeShippingThresholdPennies ? "Free Delivery Eligible" : "Standard Freight"}</g:custom_label_2>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>SAN Furniture UK Product Feed</title>
    <link>${baseUrl}</link>
    <description>Curated Modern Sofas, Dining Sets and Home Accent Furniture</description>
${itemsXml}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
