import { BaseSupplierAdapter, type FeedParseResult } from "./base-adapter.js";
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
export declare class AmosMannDropshipAdapter extends BaseSupplierAdapter {
    constructor();
    /**
     * Parse CSV or JSON feed content from Amos Mann Trade Portal
     */
    parse(rawContent: string): Promise<FeedParseResult>;
    /**
     * Helper to parse CSV values respecting quotes
     */
    private parseCsvRow;
    /**
     * Format a Purchase Order (PO) dispatch email / notification for Amos Mann dropshipping desk
     */
    formatPurchaseOrderEmail(poData: {
        poNumber: string;
        orderNumber: string;
        customerName: string;
        customerPhone: string;
        deliveryAddress: string;
        postcode: string;
        items: {
            sku: string;
            title: string;
            quantity: number;
            tradePriceGbp: string;
        }[];
        notes?: string;
    }): string;
}
