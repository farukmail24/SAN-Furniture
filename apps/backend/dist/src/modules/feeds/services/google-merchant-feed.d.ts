import { type DeliveryTier } from "@san-furniture/types";
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
export declare class GoogleMerchantFeedGenerator {
    private baseUrl;
    constructor(baseUrl?: string);
    /**
     * Escape XML special characters
     */
    private escapeXml;
    /**
     * Generate valid RSS 2.0 XML feed with Google Merchant namespace
     */
    generateFeedXml(products: FeedProductItem[]): string;
}
