import { type DeliveryTier, type UpholsteryMaterial, type FrameMaterial } from "@san-furniture/types";
export interface SeedProduct {
    id: string;
    title: string;
    handle: string;
    subtitle: string;
    description: string;
    categoryId: string;
    status: "published" | "draft" | "out_of_stock";
    pricePennies: number;
    compareAtPricePennies?: number;
    vatRatePercent: number;
    gtinBarcode: string;
    thumbnailUrl: string;
    specs: {
        width_cm: number;
        height_cm: number;
        depth_cm: number;
        seat_height_cm?: number;
        seat_depth_cm?: number;
        arm_height_cm?: number;
        weight_kg: number;
        material: UpholsteryMaterial;
        frame_material: FrameMaterial;
        color: string;
        assembly_required: boolean;
        assembly_time_mins?: number;
        doorway_clearance_min_cm?: number;
        delivery_tier: DeliveryTier;
        fire_safety: {
            compliant: boolean;
            standard: string;
            certificate_ref: string;
            label_attached: boolean;
        };
        lead_time_days: number;
    };
    supplier: {
        supplierId: string;
        supplierSku: string;
        costPricePennies: number;
        carriageCostPennies: number;
        stockLevel: number;
    };
}
export declare const SEED_CATEGORIES: {
    id: string;
    name: string;
    handle: string;
    description: string;
}[];
export declare const SEED_FURNITURE_PRODUCTS: SeedProduct[];
/**
 * Generate executable SQL INSERT statements for initial database seed
 */
export declare function generateSeedSQL(): string;
