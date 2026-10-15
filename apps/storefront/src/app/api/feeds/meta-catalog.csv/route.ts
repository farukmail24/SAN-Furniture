import { NextResponse } from "next/server";
import { getLiveProducts } from "@/lib/catalog";

function escapeCsv(field: string): string {
  if (field.includes(",") || field.includes('"') || field.includes("\n") || field.includes("\r")) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

export async function GET() {
  const baseUrl = "https://sanfurniture.co.uk";
  const liveProducts = await getLiveProducts();
  const headers = [
    "id",
    "title",
    "description",
    "availability",
    "condition",
    "price",
    "link",
    "image_link",
    "brand",
    "google_product_category",
    "material",
    "color",
    "custom_label_0",
    "custom_label_1",
  ];

  const rows = liveProducts.filter((p) => p.status !== "draft").map((p) => {
    const link = `${baseUrl}/products/${p.handle}`;
    const priceGbp = `${(p.pricePennies / 100).toFixed(2)} GBP`;
    const availability = p.status === "published" ? "in stock" : "out of stock";

    return [
      escapeCsv(p.id),
      escapeCsv(p.title),
      escapeCsv(p.description),
      availability,
      "new",
      priceGbp,
      escapeCsv(link),
      escapeCsv(p.thumbnailUrl),
      "SAN Furniture",
      "Home & Garden > Furniture",
      escapeCsv(p.specs.material),
      escapeCsv(p.specs.color),
      escapeCsv(p.specs.delivery_tier),
      "BS 5852 Certified",
    ].join(",");
  });

  const csv = [headers.join(","), ...rows].join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
