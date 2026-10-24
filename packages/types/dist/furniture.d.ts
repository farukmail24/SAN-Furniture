import { z } from "zod";
/**
 * Delivery logistics tiers for UK furniture
 */
export declare const DeliveryTierEnum: z.ZodEnum<["standard_parcel", "pallet", "two_man_white_glove"]>;
export type DeliveryTier = z.infer<typeof DeliveryTierEnum>;
/**
 * Physical furniture dimensions in centimetres (cm)
 */
export declare const FurnitureDimensionsSchema: z.ZodObject<{
    width_cm: z.ZodNumber;
    height_cm: z.ZodNumber;
    depth_cm: z.ZodNumber;
    seat_height_cm: z.ZodOptional<z.ZodNumber>;
    seat_depth_cm: z.ZodOptional<z.ZodNumber>;
    arm_height_cm: z.ZodOptional<z.ZodNumber>;
    weight_kg: z.ZodNumber;
    doorway_clearance_min_cm: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    width_cm: number;
    height_cm: number;
    depth_cm: number;
    weight_kg: number;
    seat_height_cm?: number | undefined;
    seat_depth_cm?: number | undefined;
    arm_height_cm?: number | undefined;
    doorway_clearance_min_cm?: number | undefined;
}, {
    width_cm: number;
    height_cm: number;
    depth_cm: number;
    weight_kg: number;
    seat_height_cm?: number | undefined;
    seat_depth_cm?: number | undefined;
    arm_height_cm?: number | undefined;
    doorway_clearance_min_cm?: number | undefined;
}>;
export type FurnitureDimensions = z.infer<typeof FurnitureDimensionsSchema>;
/**
 * Packaged box dimensions for courier volume & pallet space calculation
 */
export declare const PackagedBoxSchema: z.ZodObject<{
    box_number: z.ZodNumber;
    width_cm: z.ZodNumber;
    height_cm: z.ZodNumber;
    depth_cm: z.ZodNumber;
    weight_kg: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    width_cm: number;
    height_cm: number;
    depth_cm: number;
    weight_kg: number;
    box_number: number;
}, {
    width_cm: number;
    height_cm: number;
    depth_cm: number;
    weight_kg: number;
    box_number: number;
}>;
export type PackagedBox = z.infer<typeof PackagedBoxSchema>;
/**
 * Materials & Upholstery options
 */
export declare const UpholsteryMaterialEnum: z.ZodEnum<["boucle", "velvet", "linen_blend", "chenille", "top_grain_leather", "faux_leather", "wool_blend", "cotton_canvas", "none"]>;
export type UpholsteryMaterial = z.infer<typeof UpholsteryMaterialEnum>;
export declare const FrameMaterialEnum: z.ZodEnum<["solid_oak", "american_walnut", "engineered_hardwood", "powder_coated_steel", "brushed_brass", "reclaimed_wood", "marble", "tempered_glass"]>;
export type FrameMaterial = z.infer<typeof FrameMaterialEnum>;
/**
 * UK Furniture & Furnishings (Fire Safety) Regulations 1988 Compliance
 */
export declare const FireSafetyComplianceSchema: z.ZodObject<{
    compliant: z.ZodEffects<z.ZodBoolean, boolean, boolean>;
    standard: z.ZodDefault<z.ZodString>;
    certificate_ref: z.ZodString;
    label_attached: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    compliant: boolean;
    standard: string;
    certificate_ref: string;
    label_attached: boolean;
}, {
    compliant: boolean;
    certificate_ref: string;
    standard?: string | undefined;
    label_attached?: boolean | undefined;
}>;
export type FireSafetyCompliance = z.infer<typeof FireSafetyComplianceSchema>;
/**
 * Complete Furniture Specifications Schema
 */
export declare const FurnitureSpecsSchema: z.ZodObject<{
    dimensions: z.ZodObject<{
        width_cm: z.ZodNumber;
        height_cm: z.ZodNumber;
        depth_cm: z.ZodNumber;
        seat_height_cm: z.ZodOptional<z.ZodNumber>;
        seat_depth_cm: z.ZodOptional<z.ZodNumber>;
        arm_height_cm: z.ZodOptional<z.ZodNumber>;
        weight_kg: z.ZodNumber;
        doorway_clearance_min_cm: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        width_cm: number;
        height_cm: number;
        depth_cm: number;
        weight_kg: number;
        seat_height_cm?: number | undefined;
        seat_depth_cm?: number | undefined;
        arm_height_cm?: number | undefined;
        doorway_clearance_min_cm?: number | undefined;
    }, {
        width_cm: number;
        height_cm: number;
        depth_cm: number;
        weight_kg: number;
        seat_height_cm?: number | undefined;
        seat_depth_cm?: number | undefined;
        arm_height_cm?: number | undefined;
        doorway_clearance_min_cm?: number | undefined;
    }>;
    packaged_boxes: z.ZodDefault<z.ZodArray<z.ZodObject<{
        box_number: z.ZodNumber;
        width_cm: z.ZodNumber;
        height_cm: z.ZodNumber;
        depth_cm: z.ZodNumber;
        weight_kg: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        width_cm: number;
        height_cm: number;
        depth_cm: number;
        weight_kg: number;
        box_number: number;
    }, {
        width_cm: number;
        height_cm: number;
        depth_cm: number;
        weight_kg: number;
        box_number: number;
    }>, "many">>;
    material: z.ZodEnum<["boucle", "velvet", "linen_blend", "chenille", "top_grain_leather", "faux_leather", "wool_blend", "cotton_canvas", "none"]>;
    frame_material: z.ZodEnum<["solid_oak", "american_walnut", "engineered_hardwood", "powder_coated_steel", "brushed_brass", "reclaimed_wood", "marble", "tempered_glass"]>;
    color: z.ZodString;
    assembly_required: z.ZodDefault<z.ZodBoolean>;
    assembly_time_mins: z.ZodOptional<z.ZodNumber>;
    delivery_tier: z.ZodDefault<z.ZodEnum<["standard_parcel", "pallet", "two_man_white_glove"]>>;
    fire_safety: z.ZodObject<{
        compliant: z.ZodEffects<z.ZodBoolean, boolean, boolean>;
        standard: z.ZodDefault<z.ZodString>;
        certificate_ref: z.ZodString;
        label_attached: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        compliant: boolean;
        standard: string;
        certificate_ref: string;
        label_attached: boolean;
    }, {
        compliant: boolean;
        certificate_ref: string;
        standard?: string | undefined;
        label_attached?: boolean | undefined;
    }>;
    lead_time_days: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    dimensions: {
        width_cm: number;
        height_cm: number;
        depth_cm: number;
        weight_kg: number;
        seat_height_cm?: number | undefined;
        seat_depth_cm?: number | undefined;
        arm_height_cm?: number | undefined;
        doorway_clearance_min_cm?: number | undefined;
    };
    packaged_boxes: {
        width_cm: number;
        height_cm: number;
        depth_cm: number;
        weight_kg: number;
        box_number: number;
    }[];
    material: "boucle" | "velvet" | "linen_blend" | "chenille" | "top_grain_leather" | "faux_leather" | "wool_blend" | "cotton_canvas" | "none";
    frame_material: "solid_oak" | "american_walnut" | "engineered_hardwood" | "powder_coated_steel" | "brushed_brass" | "reclaimed_wood" | "marble" | "tempered_glass";
    color: string;
    assembly_required: boolean;
    delivery_tier: "standard_parcel" | "pallet" | "two_man_white_glove";
    fire_safety: {
        compliant: boolean;
        standard: string;
        certificate_ref: string;
        label_attached: boolean;
    };
    lead_time_days: number;
    assembly_time_mins?: number | undefined;
}, {
    dimensions: {
        width_cm: number;
        height_cm: number;
        depth_cm: number;
        weight_kg: number;
        seat_height_cm?: number | undefined;
        seat_depth_cm?: number | undefined;
        arm_height_cm?: number | undefined;
        doorway_clearance_min_cm?: number | undefined;
    };
    material: "boucle" | "velvet" | "linen_blend" | "chenille" | "top_grain_leather" | "faux_leather" | "wool_blend" | "cotton_canvas" | "none";
    frame_material: "solid_oak" | "american_walnut" | "engineered_hardwood" | "powder_coated_steel" | "brushed_brass" | "reclaimed_wood" | "marble" | "tempered_glass";
    color: string;
    fire_safety: {
        compliant: boolean;
        certificate_ref: string;
        standard?: string | undefined;
        label_attached?: boolean | undefined;
    };
    packaged_boxes?: {
        width_cm: number;
        height_cm: number;
        depth_cm: number;
        weight_kg: number;
        box_number: number;
    }[] | undefined;
    assembly_required?: boolean | undefined;
    assembly_time_mins?: number | undefined;
    delivery_tier?: "standard_parcel" | "pallet" | "two_man_white_glove" | undefined;
    lead_time_days?: number | undefined;
}>;
export type FurnitureSpecs = z.infer<typeof FurnitureSpecsSchema>;
/**
 * Product Variant Schema for sizes, colors, finishes & doors
 */
export declare const ProductVariantSchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    sku: z.ZodOptional<z.ZodString>;
    price_pennies: z.ZodOptional<z.ZodNumber>;
    price_modifier_pennies: z.ZodDefault<z.ZodNumber>;
    options: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    stock_quantity: z.ZodDefault<z.ZodNumber>;
    thumbnail_url: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string;
    title: string;
    price_modifier_pennies: number;
    stock_quantity: number;
    options?: Record<string, string> | undefined;
    sku?: string | undefined;
    price_pennies?: number | undefined;
    thumbnail_url?: string | undefined;
}, {
    id: string;
    title: string;
    options?: Record<string, string> | undefined;
    sku?: string | undefined;
    price_pennies?: number | undefined;
    price_modifier_pennies?: number | undefined;
    stock_quantity?: number | undefined;
    thumbnail_url?: string | undefined;
}>;
export type ProductVariant = z.infer<typeof ProductVariantSchema>;
//# sourceMappingURL=furniture.d.ts.map