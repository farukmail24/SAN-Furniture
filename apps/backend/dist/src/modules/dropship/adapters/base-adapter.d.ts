import { type SupplierFeedItem } from "@san-furniture/types";
export interface FeedParseResult {
    supplierId: string;
    items: SupplierFeedItem[];
    invalidItemsCount: number;
    errors: {
        row: number;
        reason: string;
    }[];
    parsedAt: string;
}
export declare abstract class BaseSupplierAdapter {
    protected supplierId: string;
    protected supplierName: string;
    constructor(supplierId: string, supplierName: string);
    getSupplierId(): string;
    getSupplierName(): string;
    /**
     * Parse raw feed string or buffer into standardized SupplierFeedItem array
     */
    abstract parse(rawContent: string): Promise<FeedParseResult>;
    /**
     * Validate and sanitize a normalized item against Zod schema
     */
    protected validateItem(rawItem: unknown, rowNumber: number): {
        item?: SupplierFeedItem;
        error?: string;
    };
}
