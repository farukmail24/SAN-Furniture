import { BaseSupplierAdapter, type FeedParseResult } from "./base-adapter.js";
export interface CsvColumnMapping {
    sku: string;
    title: string;
    costPrice: string;
    carriageCost?: string;
    stockLevel: string;
    leadTimeDays?: string;
    barcodeGtin?: string;
    categoryHint?: string;
    discontinued?: string;
}
export declare class CsvSupplierAdapter extends BaseSupplierAdapter {
    private mapping;
    private delimiter;
    constructor(supplierId: string, supplierName: string, mapping: CsvColumnMapping, delimiter?: string);
    parse(rawContent: string): Promise<FeedParseResult>;
    /**
     * Helper to parse CSV values respecting quotes
     */
    private parseCsvRow;
    /**
     * Parse string price ("£450.00", "450.00", "450") to integer pennies (45000)
     */
    private parsePriceToPennies;
}
