export class MetaCatalogFeedGenerator {
    baseUrl;
    constructor(baseUrl = "https://sanfurniture.com") {
        this.baseUrl = baseUrl.replace(/\/$/, "");
    }
    /**
     * Escape CSV field with RFC 4180 rules
     */
    escapeCsv(field) {
        if (field.includes(",") || field.includes('"') || field.includes("\n") || field.includes("\r")) {
            return `"${field.replace(/"/g, '""')}"`;
        }
        return field;
    }
    /**
     * Generate CSV format catalog feed for Meta Commerce Manager
     */
    generateFeedCsv(products) {
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
                "UK Quality Checked",
            ].join(",");
        });
        return [headers.join(","), ...rows].join("\n");
    }
}
