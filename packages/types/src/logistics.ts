import { z } from "zod";
import { DeliveryTierEnum } from "./furniture.js";

/**
 * UK Postcode Zones
 */
export const UKPostcodeZoneEnum = z.enum([
  "zone_1_mainland",         // England, Wales, Southern Scotland
  "zone_2_scottish_highlands",// Inverness, Highlands postcodes (IV, KW1-14, etc.)
  "zone_3_scottish_islands",  // Outer Hebrides, Shetland, Orkney (HS, ZE, etc.)
  "zone_4_northern_ireland",  // BT postcodes
  "zone_5_uk_offshore",       // Isle of Man (IM), Scilly Isles (TR21-25)
  "zone_excluded"             // Channel Islands (GY, JE)
]);
export type UKPostcodeZone = z.infer<typeof UKPostcodeZoneEnum>;

/**
 * Standard UK Address Schema
 */
export const UKAddressSchema = z.object({
  recipient_name: z.string().min(2, "Recipient name is required"),
  line_1: z.string().min(3, "Address line 1 is required"),
  line_2: z.string().optional(),
  city: z.string().min(2, "City/Town is required"),
  county: z.string().optional(),
  postcode: z.string().regex(
    /^([Gg][Ii][Rr] 0[Aa]{2})|((([A-Za-z][0-9]{1,2})|(([A-Za-z][A-Ha-hJ-Yj-y][0-9]{1,2})|(([A-Za-z][0-9][A-Za-z])|([A-Za-z][A-Ha-hJ-Yj-y][0-9][A-Za-z]?))))\s?[0-9][A-Za-z]{2})$/,
    "Invalid UK Postcode format"
  ),
  country_code: z.literal("GB").default("GB"),
  phone: z.string().min(10, "UK mobile or telephone number required for delivery booking")
});
export type UKAddress = z.infer<typeof UKAddressSchema>;

/**
 * Classify a UK postcode into a logistics zone
 */
export function classifyUKPostcode(postcode: string): UKPostcodeZone {
  const clean = postcode.toUpperCase().replace(/\s+/g, "");

  // Channel Islands
  if (/^(GY|JE)/.test(clean)) {
    return "zone_excluded";
  }

  // Northern Ireland
  if (/^BT/.test(clean)) {
    return "zone_4_northern_ireland";
  }

  // Scottish Offshore Islands
  if (/^(HS|ZE|KW15|KW16|KW17|PA20|PA4[1-9]|PA6[0-9]|PA7[0-8]|PH4[1-4]|KA27|KA28)/.test(clean)) {
    return "zone_3_scottish_islands";
  }

  // Scottish Highlands
  if (/^(IV|KW[1-9]|KW1[0-4]|PA34|PA3[7-9]|PH19|PH2[0-6]|PH3[0-9]|PH40|PH49|PH50)/.test(clean)) {
    return "zone_2_scottish_highlands";
  }

  // Offshore UK (Isle of Man, Scilly)
  if (/^(IM|TR2[1-5])/.test(clean)) {
    return "zone_5_uk_offshore";
  }

  // Standard UK Mainland
  return "zone_1_mainland";
}

/**
 * Shipping rate calculation schema
 */
export const ShippingQuoteRequestSchema = z.object({
  postcode: z.string(),
  delivery_tier: DeliveryTierEnum,
  order_subtotal_pennies: z.number().int().nonnegative()
});
export type ShippingQuoteRequest = z.infer<typeof ShippingQuoteRequestSchema>;

export const ShippingQuoteResponseSchema = z.object({
  zone: UKPostcodeZoneEnum,
  base_rate_pennies: z.number().int().nonnegative(),
  surcharge_pennies: z.number().int().nonnegative(),
  total_shipping_pennies: z.number().int().nonnegative(),
  is_deliverable: z.boolean(),
  estimated_days_min: z.number().int(),
  estimated_days_max: z.number().int(),
  disclaimer: z.string().optional()
});
export type ShippingQuoteResponse = z.infer<typeof ShippingQuoteResponseSchema>;
