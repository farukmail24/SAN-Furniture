import { type FeedProductItem } from "./google-merchant-feed.js";
export declare class MetaCatalogFeedGenerator {
    private baseUrl;
    constructor(baseUrl?: string);
    /**
     * Escape CSV field with RFC 4180 rules
     */
    private escapeCsv;
    /**
     * Generate CSV format catalog feed for Meta Commerce Manager
     */
    generateFeedCsv(products: FeedProductItem[]): string;
}
