import { z } from "zod";
/**
 * UK Postcode Zones
 */
export declare const UKPostcodeZoneEnum: z.ZodEnum<["zone_1_mainland", "zone_2_scottish_highlands", "zone_3_scottish_islands", "zone_4_northern_ireland", "zone_5_uk_offshore", "zone_excluded"]>;
export type UKPostcodeZone = z.infer<typeof UKPostcodeZoneEnum>;
/**
 * Standard UK Address Schema
 */
export declare const UKAddressSchema: z.ZodObject<{
    recipient_name: z.ZodString;
    line_1: z.ZodString;
    line_2: z.ZodOptional<z.ZodString>;
    city: z.ZodString;
    county: z.ZodOptional<z.ZodString>;
    postcode: z.ZodString;
    country_code: z.ZodDefault<z.ZodLiteral<"GB">>;
    phone: z.ZodString;
}, "strip", z.ZodTypeAny, {
    recipient_name: string;
    line_1: string;
    city: string;
    postcode: string;
    country_code: "GB";
    phone: string;
    line_2?: string | undefined;
    county?: string | undefined;
}, {
    recipient_name: string;
    line_1: string;
    city: string;
    postcode: string;
    phone: string;
    line_2?: string | undefined;
    county?: string | undefined;
    country_code?: "GB" | undefined;
}>;
export type UKAddress = z.infer<typeof UKAddressSchema>;
/**
 * Detailed E-Commerce Billing Address Schema
 */
export declare const BillingAddressSchema: z.ZodObject<{
    first_name: z.ZodString;
    last_name: z.ZodString;
    company: z.ZodOptional<z.ZodString>;
    address_1: z.ZodString;
    address_2: z.ZodOptional<z.ZodString>;
    city: z.ZodString;
    postcode: z.ZodString;
    country: z.ZodDefault<z.ZodString>;
    state: z.ZodOptional<z.ZodString>;
    email: z.ZodString;
    phone: z.ZodString;
}, "strip", z.ZodTypeAny, {
    city: string;
    postcode: string;
    phone: string;
    first_name: string;
    last_name: string;
    address_1: string;
    country: string;
    email: string;
    company?: string | undefined;
    address_2?: string | undefined;
    state?: string | undefined;
}, {
    city: string;
    postcode: string;
    phone: string;
    first_name: string;
    last_name: string;
    address_1: string;
    email: string;
    company?: string | undefined;
    address_2?: string | undefined;
    country?: string | undefined;
    state?: string | undefined;
}>;
export type BillingAddress = z.infer<typeof BillingAddressSchema>;
/**
 * Detailed E-Commerce Shipping Address Schema
 */
export declare const ShippingAddressSchema: z.ZodObject<{
    first_name: z.ZodString;
    last_name: z.ZodString;
    company: z.ZodOptional<z.ZodString>;
    address_1: z.ZodString;
    address_2: z.ZodOptional<z.ZodString>;
    city: z.ZodString;
    postcode: z.ZodString;
    country: z.ZodDefault<z.ZodString>;
    state: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    city: string;
    postcode: string;
    first_name: string;
    last_name: string;
    address_1: string;
    country: string;
    company?: string | undefined;
    address_2?: string | undefined;
    state?: string | undefined;
}, {
    city: string;
    postcode: string;
    first_name: string;
    last_name: string;
    address_1: string;
    company?: string | undefined;
    address_2?: string | undefined;
    country?: string | undefined;
    state?: string | undefined;
}>;
export type ShippingAddress = z.infer<typeof ShippingAddressSchema>;
/**
 * Classify a UK postcode into a logistics zone
 */
export declare function classifyUKPostcode(postcode: string): UKPostcodeZone;
/**
 * Standard 11 UK Mainland Administrative Regions definition
 * (Provided by SAN Furniture Logistics Operations)
 */
export interface UKRegionItem {
    key: string;
    name: string;
    prefixes: string[];
    description: string;
}
export declare const UK_MAINLAND_REGIONS: UKRegionItem[];
/**
 * High-accuracy UK Postcode Outcode to City, County and Region Lookup Table
 */
export declare const UK_POSTCODE_AREA_DATA: Record<string, {
    city: string;
    county: string;
    regionKey: string;
    regionName: string;
}>;
/**
 * Extract area prefix from clean postcode (e.g. "CV79EU" -> "CV", "SW1A1AA" -> "SW", "M11AE" -> "M")
 */
export declare function extractUKPostcodeArea(postcode: string): string;
/**
 * Determine if a postcode is located in Mainland UK
 */
export declare function isMainlandUKPostcode(postcode: string): boolean;
/**
 * Comprehensive resolver for UK postcode details (City, County, Region, Mainland status)
 */
export declare function resolveUKPostcodeInfo(postcode: string): {
    postcode: string;
    cleanPostcode: string;
    areaPrefix: string;
    isMainland: boolean;
    city: string;
    county: string;
    regionKey: string;
    regionName: string;
};
/**
 * Shipping rate calculation schema
 */
export declare const ShippingQuoteRequestSchema: z.ZodObject<{
    postcode: z.ZodString;
    delivery_tier: z.ZodEnum<["standard_parcel", "pallet", "two_man_white_glove"]>;
    order_subtotal_pennies: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    delivery_tier: "standard_parcel" | "pallet" | "two_man_white_glove";
    postcode: string;
    order_subtotal_pennies: number;
}, {
    delivery_tier: "standard_parcel" | "pallet" | "two_man_white_glove";
    postcode: string;
    order_subtotal_pennies: number;
}>;
export type ShippingQuoteRequest = z.infer<typeof ShippingQuoteRequestSchema>;
export declare const ShippingQuoteResponseSchema: z.ZodObject<{
    zone: z.ZodEnum<["zone_1_mainland", "zone_2_scottish_highlands", "zone_3_scottish_islands", "zone_4_northern_ireland", "zone_5_uk_offshore", "zone_excluded"]>;
    base_rate_pennies: z.ZodNumber;
    surcharge_pennies: z.ZodNumber;
    total_shipping_pennies: z.ZodNumber;
    is_deliverable: z.ZodBoolean;
    estimated_days_min: z.ZodNumber;
    estimated_days_max: z.ZodNumber;
    disclaimer: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    zone: "zone_1_mainland" | "zone_2_scottish_highlands" | "zone_3_scottish_islands" | "zone_4_northern_ireland" | "zone_5_uk_offshore" | "zone_excluded";
    base_rate_pennies: number;
    surcharge_pennies: number;
    total_shipping_pennies: number;
    is_deliverable: boolean;
    estimated_days_min: number;
    estimated_days_max: number;
    disclaimer?: string | undefined;
}, {
    zone: "zone_1_mainland" | "zone_2_scottish_highlands" | "zone_3_scottish_islands" | "zone_4_northern_ireland" | "zone_5_uk_offshore" | "zone_excluded";
    base_rate_pennies: number;
    surcharge_pennies: number;
    total_shipping_pennies: number;
    is_deliverable: boolean;
    estimated_days_min: number;
    estimated_days_max: number;
    disclaimer?: string | undefined;
}>;
export type ShippingQuoteResponse = z.infer<typeof ShippingQuoteResponseSchema>;
//# sourceMappingURL=logistics.d.ts.map