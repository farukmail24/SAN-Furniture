import { NextResponse } from "next/server";
import { getLiveProducts } from "@/lib/catalog";

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
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const baseUrl = "https://sanfurniture.com";
  const liveProducts = await getLiveProducts();
  const itemsXml = liveProducts.filter((p) => p.status !== "draft")
    .map((p) => {
      const link = `${baseUrl}/products/${p.handle}`;
      const priceGbp = `${(p.pricePennies / 100).toFixed(2)} GBP`;
      const availability = p.status === "published" ? "in_stock" : "out_of_stock";
      const googleCat = CATEGORY_MAP[p.categoryId] || "Home & Garden > Furniture";
      const shippingCost = p.pricePennies >= 50000 ? "0.00 GBP" : "49.00 GBP";

      return `    <item>
      <g:id>${escapeXml(p.id)}</g:id>
      <g:title>${escapeXml(p.title)}</g:title>
      <g:description>${escapeXml(p.description)}</g:description>
      <g:link>${escapeXml(link)}</g:link>
      <g:image_link>${escapeXml(p.thumbnailUrl)}</g:image_link>
      <g:availability>${availability}</g:availability>
      <g:price>${priceGbp}</g:price>
      <g:brand>SAN Furniture</g:brand>
      <g:gtin>${escapeXml(p.gtinBarcode)}</g:gtin>
      <g:mpn>${escapeXml(p.id)}</g:mpn>
      <g:condition>new</g:condition>
      <g:google_product_category>${escapeXml(googleCat)}</g:google_product_category>
      <g:shipping>
        <g:country>GB</g:country>
        <g:service>UK 2-Man White Glove Delivery</g:service>
        <g:price>${shippingCost}</g:price>
      </g:shipping>
      <g:material>${escapeXml(p?.specs?.material)}</g:material>
      <g:color>${escapeXml(p?.specs?.color)}</g:color>
      <g:custom_label_0>${escapeXml(p?.specs?.delivery_tier)}</g:custom_label_0>
      <g:custom_label_1>UK Quality Checked</g:custom_label_1>
      <g:custom_label_2>${p.pricePennies >= 50000 ? "Free Delivery Eligible" : "Standard Freight"}</g:custom_label_2>
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
