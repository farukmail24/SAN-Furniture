import { z } from "zod";

/**
 * Delivery logistics tiers for UK furniture
 */
export const DeliveryTierEnum = z.enum([
  "standard_parcel",    // Small decor, cushions, stools, lamps (< 25kg)
  "pallet",             // Kerbside pallet drop (dining tables, flatpack)
  "two_man_white_glove" // Room of choice + packaging removal (sofas, wardrobes)
]);
export type DeliveryTier = z.infer<typeof DeliveryTierEnum>;

/**
 * Physical furniture dimensions in centimetres (cm)
 */
export const FurnitureDimensionsSchema = z.object({
  width_cm: z.number().positive({ message: "Width must be greater than 0 cm" }),
  height_cm: z.number().positive({ message: "Height must be greater than 0 cm" }),
  depth_cm: z.number().positive({ message: "Depth must be greater than 0 cm" }),
  seat_height_cm: z.number().positive().optional(),
  seat_depth_cm: z.number().positive().optional(),
  arm_height_cm: z.number().positive().optional(),
  weight_kg: z.number().positive({ message: "Weight must be greater than 0 kg" }),
  doorway_clearance_min_cm: z.number().positive().optional()
});
export type FurnitureDimensions = z.infer<typeof FurnitureDimensionsSchema>;

/**
 * Packaged box dimensions for courier volume & pallet space calculation
 */
export const PackagedBoxSchema = z.object({
  box_number: z.number().int().positive(),
  width_cm: z.number().positive(),
  height_cm: z.number().positive(),
  depth_cm: z.number().positive(),
  weight_kg: z.number().positive()
});
export type PackagedBox = z.infer<typeof PackagedBoxSchema>;

/**
 * Materials & Upholstery options
 */
export const UpholsteryMaterialEnum = z.enum([
  "boucle",
  "velvet",
  "linen_blend",
  "chenille",
  "top_grain_leather",
  "faux_leather",
  "wool_blend",
  "cotton_canvas",
  "none"
]);
export type UpholsteryMaterial = z.infer<typeof UpholsteryMaterialEnum>;

export const FrameMaterialEnum = z.enum([
  "solid_oak",
  "american_walnut",
  "engineered_hardwood",
  "powder_coated_steel",
  "brushed_brass",
  "reclaimed_wood",
  "marble",
  "tempered_glass"
]);
export type FrameMaterial = z.infer<typeof FrameMaterialEnum>;

/**
 * UK Furniture & Furnishings (Fire Safety) Regulations 1988 Compliance
 */
export const FireSafetyComplianceSchema = z.object({
  compliant: z.boolean().refine((val) => val === true, {
    message: "Furniture sold in the UK must pass quality inspection"
  }),
  standard: z.string().default("UK Quality Checked"),
  certificate_ref: z.string().min(1, "Certificate reference is mandatory"),
  label_attached: z.boolean().default(true)
});
export type FireSafetyCompliance = z.infer<typeof FireSafetyComplianceSchema>;

/**
 * Complete Furniture Specifications Schema
 */
export const FurnitureSpecsSchema = z.object({
  dimensions: FurnitureDimensionsSchema,
  packaged_boxes: z.array(PackagedBoxSchema).default([]),
  material: UpholsteryMaterialEnum,
  frame_material: FrameMaterialEnum,
  color: z.string().min(1),
  assembly_required: z.boolean().default(false),
  assembly_time_mins: z.number().int().nonnegative().optional(),
  assembly_instructions_url: z.string().optional(),
  delivery_tier: DeliveryTierEnum.default("two_man_white_glove"),
  fire_safety: FireSafetyComplianceSchema,
  lead_time_days: z.number().int().positive().default(5)
});
export type FurnitureSpecs = z.infer<typeof FurnitureSpecsSchema>;

/**
 * Product Variant Schema for sizes, colors, finishes & doors
 */
export const ProductVariantSchema = z.object({
  id: z.string(),
  title: z.string(),
  sku: z.string().optional(),
  price_pennies: z.number().int().positive().optional(),
  price_modifier_pennies: z.number().int().default(0),
  options: z.record(z.string()).optional(),
  stock_quantity: z.number().int().default(10),
  thumbnail_url: z.string().optional()
});
export type ProductVariant = z.infer<typeof ProductVariantSchema>;
