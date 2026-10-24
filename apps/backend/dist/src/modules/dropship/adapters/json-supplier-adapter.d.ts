import { BaseSupplierAdapter, type FeedParseResult } from "./base-adapter.js";
export interface JsonFieldMapping {
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
export declare class JsonSupplierAdapter extends BaseSupplierAdapter {
    private mapping;
    constructor(supplierId: string, supplierName: string, mapping: JsonFieldMapping);
    parse(rawContent: string): Promise<FeedParseResult>;
}
