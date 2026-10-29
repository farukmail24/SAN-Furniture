import { BaseSupplierAdapter, type FeedParseResult } from "./base-adapter.js";
import { type SupplierFeedItem } from "@san-furniture/types";

/**
 * Furniture To Go (FTG) Ltd (Wiltshire, UK) - Dedicated Dropship Feed Adapter
 * Handles parsing and normalizing trade feeds from Furniture To Go UK:
 * - Danish & European flat-pack furniture (Bedroom sets, Chests of Drawers, Wardrobes, Desks & Dining)
 * - Trade wholesale pricing (GBP ex VAT)
 * - 48h to 72h UK Mainland Dropship via Parcel (DPD/DX) & 2-Man Room of Choice
 * - Central Warehouse: Wiltshire, UK
 */
export interface FTGProductFeedRow {
  sku: string;
  ean?: string;
  range_name?: string;
  product_title?: string;
  category?: string;
  trade_cost_gbp: number;
  rrp_inc_vat_gbp?: number;
  stock_quantity: number;
  width_cm?: number;
  height_cm?: number;
  depth_cm?: number;
  weight_kg?: number;
  color_finish?: string;
  delivery_tier?: "standard_parcel" | "two_man_white_glove" | "pallet";
  lead_time_days?: number;
  image_url?: string;
}

export class FurnitureToGoDropshipAdapter extends BaseSupplierAdapter {
  constructor() {
    super("furniture_to_go", "Furniture To Go (FTG UK Dropship Hub, Wiltshire)");
  }

  /**
   * Parse CSV or JSON feed content from Furniture To Go Trade Portal
   */
  public async parse(rawContent: string): Promise<FeedParseResult> {
    const items: SupplierFeedItem[] = [];
    const errors: { row: number; reason: string }[] = [];

    try {
      // 1. Support JSON feed
      if (rawContent.trim().startsWith("[") || rawContent.trim().startsWith("{")) {
        const parsed = JSON.parse(rawContent);
        const list = Array.isArray(parsed) ? parsed : [parsed];

        list.forEach((row: any, idx: number) => {
          const sku = row.sku || row.item_code || row.article_no;
          const costGbp = row.trade_cost_gbp ?? row.trade_price ?? row.wholesale_cost;

          if (!sku || costGbp === undefined) {
            errors.push({ row: idx + 1, reason: "Missing SKU or trade price in Furniture To Go feed" });
            return;
          }

          const costPricePennies = Math.round(Number(costGbp) * 100);
          const weightKg = Number(row.weight_kg || 25);
          const deliveryTier = row.delivery_tier || (weightKg > 40 ? "two_man_white_glove" : "standard_parcel");

          items.push({
            supplier_id: this.supplierId,
            supplier_sku: String(sku),
            product_title: row.product_title
              ? String(row.product_title).replace(/^(?:FTG|Furniture\s+To\s+Go)[\s\-–—:]+/i, "").trim()
              : `${row.range_name || "Scandinavian"} - ${sku}`,
            cost_price_pennies: costPricePennies,
            carriage_cost_pennies: deliveryTier === "two_man_white_glove" ? 4000 : 1500,
            stock_level: parseInt(String(row.stock_quantity ?? row.stock ?? "0"), 10),
            lead_time_days: parseInt(String(row.lead_time_days || "3"), 10),
            barcode_gtin: row.ean || `50609129${String(idx).padStart(5, "0")}`,
            category_hint: row.category || "bedroom",
            discontinued: Boolean(row.discontinued || row.is_discontinued || false),
          });
        });

        return {
          supplierId: this.supplierId,
          items,
          invalidItemsCount: errors.length,
          errors,
          parsedAt: new Date().toISOString(),
        };
      }

      // 2. Support Standard CSV Feed (RFC 4180 / FTG Export)
      const lines = rawContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length < 2) {
        return {
          supplierId: this.supplierId,
          items: [],
          invalidItemsCount: 1,
          errors: [{ row: 0, reason: "Furniture To Go CSV has insufficient rows" }],
          parsedAt: new Date().toISOString(),
        };
      }

      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/["']/g, ""));
      const skuIdx = headers.findIndex((h) => h === "sku" || h === "item_code" || h === "item code" || h === "code");
      const titleIdx = headers.findIndex((h) => h === "product_title" || h === "title" || h === "name" || h === "description");
      const costIdx = headers.findIndex((h) => h === "trade_cost_gbp" || h === "trade_price" || h === "trade" || h === "trade price ex vat");
      const stockIdx = headers.findIndex((h) => h === "stock_quantity" || h === "stock" || h === "qty" || h === "available");
      const leadIdx = headers.findIndex((h) => h === "lead_time_days" || h === "lead_time" || h === "dispatch_days");
      const weightIdx = headers.findIndex((h) => h === "weight_kg" || h === "weight" || h === "gross weight");

      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",").map((c) => c.trim().replace(/^["']|["']$/g, ""));
        const sku = cols[skuIdx >= 0 ? skuIdx : 0];
        const rawCost = cols[costIdx >= 0 ? costIdx : 1];

        if (!sku || !rawCost) {
          errors.push({ row: i + 1, reason: `Row ${i + 1}: Missing SKU or trade cost` });
          continue;
        }

        const costGbp = parseFloat(rawCost.replace(/[^0-9.]/g, ""));
        if (isNaN(costGbp) || costGbp <= 0) {
          errors.push({ row: i + 1, reason: `Row ${i + 1}: Invalid trade cost "${rawCost}"` });
          continue;
        }

        const title = titleIdx >= 0 ? cols[titleIdx] : "";
        const stockStr = stockIdx >= 0 ? cols[stockIdx] : "10";
        const leadStr = leadIdx >= 0 ? cols[leadIdx] : "3";
        const weightKg = weightIdx >= 0 ? parseFloat(cols[weightIdx]) || 25 : 25;
        const deliveryTier = weightKg > 40 ? "two_man_white_glove" : "standard_parcel";

        items.push({
          supplier_id: this.supplierId,
          supplier_sku: sku.trim(),
          product_title: (title || `Furniture To Go - ${sku}`).trim(),
          cost_price_pennies: Math.round(costGbp * 100),
          carriage_cost_pennies: deliveryTier === "two_man_white_glove" ? 4000 : 1500,
          stock_level: parseInt(stockStr.replace(/[^0-9]/g, "") || "0", 10),
          lead_time_days: parseInt(leadStr.replace(/[^0-9]/g, "") || "3", 10),
          discontinued: false,
          category_hint: "bedroom",
          barcode_gtin: sku.trim(),
        });
      }
    } catch (err: any) {
      errors.push({ row: 0, reason: `Failed to parse Furniture To Go feed: ${err.message}` });
    }

    return {
      supplierId: this.supplierId,
      items,
      invalidItemsCount: errors.length,
      errors,
      parsedAt: new Date().toISOString(),
    };
  }

  /**
   * Format a Purchase Order (PO) dispatch email / notification for Furniture To Go trade desk
   */
  public formatPurchaseOrderEmail(params: {
    poNumber: string;
    orderNumber: string;
    customerName: string;
    shippingAddress: {
      addressLine1: string;
      addressLine2?: string;
      city: string;
      postcode: string;
      country: string;
      phone: string;
    };
    lineItems: {
      sku: string;
      title: string;
      quantity: number;
      unitCostPennies: number;
    }[];
    deliveryNotes?: string;
  }): {
    to: string;
    subject: string;
    bodyText: string;
  } {
    const totalCostGbp = (
      params.lineItems.reduce((acc, item) => acc + item.unitCostPennies * item.quantity, 0) / 100
    ).toFixed(2);

    const itemsSummary = params.lineItems
      .map(
        (it) =>
          `- SKU: ${it.sku} | QTY: ${it.quantity} | "${it.title}" | Cost: £${(it.unitCostPennies / 100).toFixed(2)} ex VAT`
      )
      .join("\n");

    const bodyText = `
================================================================================
SAN FURNITURE UK -> FURNITURE TO GO (FTG) B2B DROPSHIP DISPATCH
================================================================================
PURCHASE ORDER: ${params.poNumber}
CUSTOMER SALES REF: ${params.orderNumber}
SUPPLIER: Furniture To Go (FTG Wiltshire UK Distribution Centre)
TO: orders@furniture-to-go.co.uk / trade@furniture-to-go.co.uk

DISPATCH RECIPIENT & ADDRESS:
--------------------------------------------------------------------------------
Name: ${params.customerName}
Address: ${params.shippingAddress.addressLine1} ${params.shippingAddress.addressLine2 || ""}
City: ${params.shippingAddress.city}
Postcode: ${params.shippingAddress.postcode} (UK)
Phone for Courier SMS Updates: ${params.shippingAddress.phone}

ORDER ITEMS:
--------------------------------------------------------------------------------
${itemsSummary}

Total Trade Cost (Ex. VAT): £${totalCostGbp}

DELIVERY INSTRUCTIONS:
--------------------------------------------------------------------------------
Service: UK Mainland Direct Dropship (DPD / 2-Man Courier)
Notes: ${params.deliveryNotes || "Please dispatch under plain label / SAN Furniture delivery note. Send tracking webhook or reply with tracking reference."}

Kind regards,
SAN Furniture Operations & Fulfillment Team
London, UK | operations@sanfurniture.com
================================================================================
`.trim();

    return {
      to: "orders@furniture-to-go.co.uk",
      subject: `[B2B PO] ${params.poNumber} - SAN Furniture Direct Dropship Dispatch (${params.shippingAddress.postcode})`,
      bodyText,
    };
  }
}
