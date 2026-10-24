import { type FaqItem } from "./schema-org-generator.js";
export interface ProgrammaticPageDefinition {
    slug: string;
    categoryHandle: string;
    materialFilter?: string;
    colorFilter?: string;
    title: string;
    metaDescription: string;
    headline: string;
    buyerGuideSummary: string;
    careAdvice: string;
    faqs: FaqItem[];
}
export interface ProgrammaticEvaluationResult {
    slug: string;
    isIndexable: boolean;
    robotsDirective: "index, follow" | "noindex, follow";
    canonicalUrl: string;
    matchingProductCount: number;
    definition: ProgrammaticPageDefinition;
}
export declare const PROGRAMMATIC_COLLECTIONS: ProgrammaticPageDefinition[];
export declare class ProgrammaticSeoEngine {
    private baseUrl;
    private minProductsThreshold;
    constructor(baseUrl?: string, minProductsThreshold?: number);
    /**
     * Evaluate a programmatic landing page against the Thin Content Guard
     */
    evaluateCollection(def: ProgrammaticPageDefinition, availableProducts: Array<{
        categoryId: string;
        specs: {
            material: string;
        };
    }>): ProgrammaticEvaluationResult;
    getCollectionBySlug(slug: string): ProgrammaticPageDefinition | undefined;
}
