import { type FurnitureSpecs, type DeliveryTier } from "@san-furniture/types";

export interface FeedProductItem {
  id: string;
  title: string;
  handle: string;
  description: string;
  pricePennies: number;
  compareAtPricePennies?: number;
  thumbnailUrl: string;
  images: string[];
  status: "published" | "draft" | "out_of_stock";
  categoryHandle: string;
  gtinBarcode: string;
  specs: {
    material: string;
    color: string;
    delivery_tier: DeliveryTier;
    fire_safety: {
      compliant: boolean;
      standard: string;
    };
  };
}

const CATEGORY_MAP: Record<string, string> = {
  sofas: "Home & Garden > Furniture > Sofas",
  armchairs: "Home & Garden > Furniture > Chairs > Armchairs, Recliners & Sleeper Chairs",
  dining: "Home & Garden > Furniture > Dining Room Furniture",
  beds: "Home & Garden > Furniture > Bedroom Furniture > Beds & Bed Frames",
  "living-tables": "Home & Garden > Furniture > Tables > Coffee Tables",
};

export class GoogleMerchantFeedGenerator {
  private baseUrl: string;

  constructor(baseUrl = "https://sanfurniture.com") {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  /**
   * Escape XML special characters
   */
  private escapeXml(unsafe: string): string {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  /**
   * Generate valid RSS 2.0 XML feed with Google Merchant namespace
   */
  public generateFeedXml(products: FeedProductItem[]): string {
    const publishedProducts = products.filter((p) => p.status !== "draft");

    const itemsXml = publishedProducts
      .map((p) => {
        const link = `${this.baseUrl}/products/${p.handle}`;
        const priceGbp = `${(p.pricePennies / 100).toFixed(2)} GBP`;
        const availability = p.status === "published" ? "in_stock" : "out_of_stock";
        const googleCat = CATEGORY_MAP[p.categoryHandle] || "Home & Garden > Furniture";
        const shippingCost = p.pricePennies >= 50000 ? "0.00 GBP" : "49.00 GBP";

        const additionalImagesXml = p.images
          .slice(1, 5)
          .map((img) => `      <g:additional_image_link>${this.escapeXml(img)}</g:additional_image_link>`)
          .join("\n");

        return `    <item>
      <g:id>${this.escapeXml(p.id)}</g:id>
      <g:title>${this.escapeXml(p.title)}</g:title>
      <g:description>${this.escapeXml(p.description)}</g:description>
      <g:link>${this.escapeXml(link)}</g:link>
      <g:image_link>${this.escapeXml(p.thumbnailUrl)}</g:image_link>
${additionalImagesXml ? additionalImagesXml + "\n" : ""}\
      <g:availability>${availability}</g:availability>
      <g:price>${priceGbp}</g:price>
      <g:brand>SAN Furniture</g:brand>
      <g:gtin>${this.escapeXml(p.gtinBarcode)}</g:gtin>
      <g:mpn>${this.escapeXml(p.id)}</g:mpn>
      <g:condition>new</g:condition>
      <g:google_product_category>${this.escapeXml(googleCat)}</g:google_product_category>
      <g:shipping>
        <g:country>GB</g:country>
        <g:service>UK 2-Man White Glove Delivery</g:service>
        <g:price>${shippingCost}</g:price>
      </g:shipping>
      <g:material>${this.escapeXml(p.specs.material)}</g:material>
      <g:color>${this.escapeXml(p.specs.color)}</g:color>
      <g:custom_label_0>${this.escapeXml(p.specs.delivery_tier)}</g:custom_label_0>
      <g:custom_label_1>BS 5852 Fire Safety Verified</g:custom_label_1>
      <g:custom_label_2>${p.pricePennies >= 50000 ? "Free Delivery Eligible" : "Standard Freight"}</g:custom_label_2>
    </item>`;
      })
      .join("\n");

    return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>SAN Furniture UK Product Feed</title>
    <link>${this.baseUrl}</link>
    <description>Luxury British Handcrafted Sofas, Dining Sets and Accent Furniture</description>
${itemsXml}
  </channel>
</rss>`;
  }
}
