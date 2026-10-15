import { BaseSupplierAdapter, type FeedParseResult } from "./base-adapter.js";
import { type SupplierFeedItem } from "@san-furniture/types";

export interface JsonFieldMapping {
  sku: string;
  title: string;
  costPrice: string; // e.g. "wholesale_price" or "cost"
  carriageCost?: string;
  stockLevel: string;
  leadTimeDays?: string;
  barcodeGtin?: string;
  categoryHint?: string;
  discontinued?: string;
}

export class JsonSupplierAdapter extends BaseSupplierAdapter {
  private mapping: JsonFieldMapping;

  constructor(
    supplierId: string,
    supplierName: string,
    mapping: JsonFieldMapping
  ) {
    super(supplierId, supplierName);
    this.mapping = mapping;
  }

  public async parse(rawContent: string): Promise<FeedParseResult> {
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(rawContent);
    } catch {
      return {
        supplierId: this.supplierId,
        items: [],
        invalidItemsCount: 0,
        errors: [{ row: 0, reason: "Malformed JSON payload" }],
        parsedAt: new Date().toISOString()
      };
    }

    const rawArray: unknown[] = Array.isArray(parsedJson)
      ? parsedJson
      : typeof parsedJson === "object" && parsedJson !== null && "products" in parsedJson && Array.isArray((parsedJson as { products: unknown[] }).products)
      ? (parsedJson as { products: unknown[] }).products
      : [];

    const items: SupplierFeedItem[] = [];
    const errors: { row: number; reason: string }[] = [];
    let invalidCount = 0;

    for (let i = 0; i < rawArray.length; i++) {
      const entry = rawArray[i] as Record<string, unknown>;
      try {
        const sku = String(entry[this.mapping.sku] || "").trim();
        const title = String(entry[this.mapping.title] || "").trim();
        const rawCost = entry[this.mapping.costPrice];
        const rawStock = entry[this.mapping.stockLevel];

        if (!sku || !title) {
          invalidCount++;
          errors.push({ row: i, reason: "Missing SKU or Title" });
          continue;
        }

        const costPricePennies = typeof rawCost === "number"
          ? (Number.isInteger(rawCost) && rawCost > 1000 ? rawCost : Math.round(rawCost * 100))
          : Math.round(parseFloat(String(rawCost || "0").replace(/[£$,\s]/g, "")) * 100);

        const carriageCostPennies = this.mapping.carriageCost && entry[this.mapping.carriageCost]
          ? Math.round(parseFloat(String(entry[this.mapping.carriageCost]).replace(/[£$,\s]/g, "")) * 100)
          : 0;

        const stockLevel = Math.max(0, parseInt(String(rawStock ?? "0"), 10) || 0);
        const leadTimeDays = this.mapping.leadTimeDays && entry[this.mapping.leadTimeDays]
          ? Math.max(1, parseInt(String(entry[this.mapping.leadTimeDays]), 10) || 3)
          : 3;

        const barcodeGtin = this.mapping.barcodeGtin ? String(entry[this.mapping.barcodeGtin] || "").trim() || undefined : undefined;
        const categoryHint = this.mapping.categoryHint ? String(entry[this.mapping.categoryHint] || "").trim() || undefined : undefined;
        const discontinued = this.mapping.discontinued ? Boolean(entry[this.mapping.discontinued]) : false;

        const candidate = {
          supplier_id: this.supplierId,
          supplier_sku: sku,
          product_title: title,
          category_hint: categoryHint,
          cost_price_pennies: costPricePennies,
          carriage_cost_pennies: carriageCostPennies,
          stock_level: stockLevel,
          lead_time_days: leadTimeDays,
          discontinued,
          barcode_gtin: barcodeGtin,
          supplier_updated_at: new Date().toISOString()
        };

        const validated = this.validateItem(candidate, i);
        if (validated.item) {
          items.push(validated.item);
        } else if (validated.error) {
          invalidCount++;
          errors.push({ row: i, reason: validated.error });
        }
      } catch (err: unknown) {
        invalidCount++;
        const message = err instanceof Error ? err.message : "Parsing failure";
        errors.push({ row: i, reason: message });
      }
    }

    return {
      supplierId: this.supplierId,
      items,
      invalidItemsCount: invalidCount,
      errors,
      parsedAt: new Date().toISOString()
    };
  }
}
