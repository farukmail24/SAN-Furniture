import { BaseSupplierAdapter, type FeedParseResult } from "./base-adapter.js";
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
export declare class FurnitureToGoDropshipAdapter extends BaseSupplierAdapter {
    constructor();
    /**
     * Parse CSV or JSON feed content from Furniture To Go Trade Portal
     */
    parse(rawContent: string): Promise<FeedParseResult>;
    /**
     * Format a Purchase Order (PO) dispatch email / notification for Furniture To Go trade desk
     */
    formatPurchaseOrderEmail(params: {
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
    };
}
