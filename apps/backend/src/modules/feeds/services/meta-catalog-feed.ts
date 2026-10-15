import { type FeedProductItem } from "./google-merchant-feed.js";

export class MetaCatalogFeedGenerator {
  private baseUrl: string;

  constructor(baseUrl = "https://sanfurniture.co.uk") {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  /**
   * Escape CSV field with RFC 4180 rules
   */
  private escapeCsv(field: string): string {
    if (field.includes(",") || field.includes('"') || field.includes("\n") || field.includes("\r")) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  }

  /**
   * Generate CSV format catalog feed for Meta Commerce Manager
   */
  public generateFeedCsv(products: FeedProductItem[]): string {
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

    const rows = products
      .filter((p) => p.status !== "draft")
      .map((p) => {
        const link = `${this.baseUrl}/products/${p.handle}`;
        const priceGbp = `${(p.pricePennies / 100).toFixed(2)} GBP`;
        const availability = p.status === "published" ? "in stock" : "out of stock";

        return [
          this.escapeCsv(p.id),
          this.escapeCsv(p.title),
          this.escapeCsv(p.description),
          availability,
          "new",
          priceGbp,
          this.escapeCsv(link),
          this.escapeCsv(p.thumbnailUrl),
          "SAN Furniture",
          "Home & Garden > Furniture",
          this.escapeCsv(p.specs.material),
          this.escapeCsv(p.specs.color),
          this.escapeCsv(p.specs.delivery_tier),
          "BS 5852 Certified",
        ].join(",");
      });

    return [headers.join(","), ...rows].join("\n");
  }
}
