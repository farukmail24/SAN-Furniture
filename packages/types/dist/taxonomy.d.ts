export interface ProductCategory {
    id: string;
    name: string;
    handle: string;
    description: string;
    heroImage: string;
}
export declare const CATALOG_CATEGORIES: ProductCategory[];
export declare const CATEGORY_HANDLE_ALIASES: Record<string, string>;
export declare function normalizeCategoryHandle(handle: string): string;
export declare function getCategoryByHandle(handle: string): ProductCategory | undefined;
export interface FurnitureSubType {
    id: string;
    label: string;
    categoryId: string;
    aliases: string[];
    matches: (product: {
        title: string;
        handle: string;
        description?: string;
    }) => boolean;
}
export declare const FURNITURE_SUBTYPES: FurnitureSubType[];
export declare function getCategorySubTypes(categoryId: string): FurnitureSubType[];
export declare function resolveSubType(categoryId: string, rawType?: string | null): FurnitureSubType | null;
export declare function productMatchesSubType(product: {
    title: string;
    handle: string;
    description?: string;
}, subType: FurnitureSubType): boolean;
export declare function getSubTypesWithCounts<T extends {
    title: string;
    handle: string;
    description?: string;
}>(categoryId: string, products: T[]): {
    subType: FurnitureSubType;
    count: number;
}[];
//# sourceMappingURL=taxonomy.d.ts.map