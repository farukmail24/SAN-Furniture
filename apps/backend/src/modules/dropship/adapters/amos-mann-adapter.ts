import { BaseSupplierAdapter, type FeedParseResult } from "./base-adapter.js";
import { type SupplierFeedItem } from "@san-furniture/types";

/**
 * Amos Mann Furniture (Leicester, UK) - Dedicated Dropship Feed Adapter
 * Handles parsing and normalizing trade feeds from Amos Mann Furniture UK:
 * - Trade-only wholesale pricing (GBP ex VAT)
 * - 2-Man White Glove dispatch for large sliding wardrobes & high gloss units
 * - Flat-pack bedroom ranges, living TV cabinets, dining & home office
 */
export interface AmosMannProductFeedRow {
  sku: string;
  range_name: string;
  product_title: string;
  category: "wardrobes" | "bedroom" | "lounge" | "dining" | "office" | "storage";
  trade_cost_gbp: number;
  stock_quantity: number;
  width_cm: number;
  height_cm: number;
  depth_cm: number;
  weight_kg: number;
  color_finish: string;
  delivery_tier: "two_man_white_glove" | "pallet" | "standard_parcel";
  lead_time_days: number;
  image_url: string;
}

export class AmosMannDropshipAdapter extends BaseSupplierAdapter {
  constructor() {
    super("amos_mann_furniture", "Amos Mann Furniture (Trade Dropshipping, Leicester UK)");
  }

  /**
   * Parse CSV or JSON feed content from Amos Mann Trade Portal
   */
  public async parse(rawContent: string): Promise<FeedParseResult> {
    const items: SupplierFeedItem[] = [];
    const errors: { row: number; reason: string }[] = [];

    try {
      // Support JSON feed
      if (rawContent.trim().startsWith("[") || rawContent.trim().startsWith("{")) {
        const parsed = JSON.parse(rawContent);
        const list = Array.isArray(parsed) ? parsed : [parsed];

        list.forEach((row: any, idx: number) => {
          if (!row.sku || row.trade_cost_gbp === undefined) {
            errors.push({ row: idx + 1, reason: "Missing SKU or trade cost in Amos Mann feed" });
            return;
          }

          const costPricePennies = Math.round(Number(row.trade_cost_gbp) * 100);
          items.push({
            supplier_id: this.supplierId,
            supplier_sku: String(row.sku),
            product_title: row.product_title || `Amos Mann ${row.range_name || "Furniture"} - ${row.sku}`,
            cost_price_pennies: costPricePennies,
            carriage_cost_pennies: row.delivery_tier === "two_man_white_glove" ? 4500 : 2500,
            stock_level: parseInt(String(row.stock_quantity || "0"), 10),
            lead_time_days: parseInt(String(row.lead_time_days || "5"), 10),
            barcode_gtin: row.barcode || `50609128${String(idx).padStart(5, "0")}`,
            category_hint: row.category || "bedroom",
            discontinued: Boolean(row.is_discontinued)
          });
        });

        return {
          supplierId: this.supplierId,
          items,
          invalidItemsCount: errors.length,
          errors,
          parsedAt: new Date().toISOString()
        };
      }

      // Support CSV feed
      const lines = rawContent.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
      if (lines.length < 2) {
        return {
          supplierId: this.supplierId,
          items: [],
          invalidItemsCount: 0,
          errors: [{ row: 0, reason: "Amos Mann CSV has insufficient rows" }],
          parsedAt: new Date().toISOString()
        };
      }

      const headerLine = lines[0] || "";
      const headers = this.parseCsvRow(headerLine, ",").map((h: string) => h.toLowerCase());
      const skuIdx = headers.findIndex((h: string) => h.includes("sku") || h.includes("item code"));
      const titleIdx = headers.findIndex((h: string) => h.includes("title") || h.includes("name") || h.includes("product"));
      const costIdx = headers.findIndex((h: string) => h.includes("trade") || h.includes("cost") || h.includes("price"));
      const stockIdx = headers.findIndex((h: string) => h.includes("stock") || h.includes("qty"));

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i] || "";
        const row = this.parseCsvRow(line, ",");
        const sku = row[skuIdx];
        const title = row[titleIdx];
        const costStr = row[costIdx];
        const stockStr = row[stockIdx];

        if (!sku || !costStr) {
          errors.push({ row: i + 1, reason: "Missing required fields" });
          continue;
        }

        const costNum = parseFloat(costStr.replace(/[^0-9.]/g, ""));
        const costPricePennies = Math.round(costNum * 100);

        items.push({
          supplier_id: this.supplierId,
          supplier_sku: sku.trim(),
          product_title: (title || `Amos Mann Item ${sku}`).trim(),
          cost_price_pennies: costPricePennies,
          carriage_cost_pennies: 3500,
          stock_level: parseInt(stockStr || "10", 10),
          lead_time_days: 7,
          category_hint: "bedroom",
          discontinued: false
        });
      }

      return {
        supplierId: this.supplierId,
        items,
        invalidItemsCount: errors.length,
        errors,
        parsedAt: new Date().toISOString()
      };
    } catch (err: any) {
      return {
        supplierId: this.supplierId,
        items: [],
        invalidItemsCount: 1,
        errors: [{ row: 0, reason: `Failed to parse Amos Mann feed: ${err.message}` }],
        parsedAt: new Date().toISOString()
      };
    }
  }

  /**
   * Helper to parse CSV values respecting quotes
   */
  private parseCsvRow(row: string, delimiter = ","): string[] {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < row.length; i++) {
      const char = row[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    return values;
  }

  /**
   * Format a Purchase Order (PO) dispatch email / notification for Amos Mann dropshipping desk
   */
  public formatPurchaseOrderEmail(poData: {
    poNumber: string;
    orderNumber: string;
    customerName: string;
    customerPhone: string;
    deliveryAddress: string;
    postcode: string;
    items: { sku: string; title: string; quantity: number; tradePriceGbp: string }[];
    notes?: string;
  }): string {
    const itemList = poData.items
      .map(it => `• [${it.sku}] ${it.title} x ${it.quantity} (@ £${it.tradePriceGbp} ex VAT)`)
      .join("\n");

    return `
============================================================
SAN FURNITURE UK -> AMOS MANN FURNITURE DROPSHIP DISPATCH
============================================================
TO: orders@amosmannfurniture.co.uk / trade@amosmannfurniture.co.uk
SUPPLIER: Amos Mann Furniture (Leicester Warehouse)
PO NUMBER: ${poData.poNumber}
STORE ORDER REF: ${poData.orderNumber}
DISPATCH METHOD: Direct-to-Consumer Dropship (White Label)
DATE: ${new Date().toLocaleDateString("en-GB")}

CUSTOMER DELIVERY MANIFEST:
------------------------------------------------------------
Recipient: ${poData.customerName}
Contact Phone: ${poData.customerPhone} (For 2-Man Pre-call)
Address: ${poData.deliveryAddress}
Postcode: ${poData.postcode}
Delivery Tier: 2-Man Booked-in Service (Room of Choice)

PURCHASE ORDER ITEMS:
------------------------------------------------------------
${itemList}

SPECIAL INSTRUCTIONS:
------------------------------------------------------------
${poData.notes || "Please include SAN Furniture white-label delivery note. Contact customer 30 minutes prior to delivery arrival."}

============================================================
Authorized by SAN Furniture UK Operations Desk
48 Grosvenor Square, Mayfair, London W1K 2HP
============================================================
`.trim();
  }
}
