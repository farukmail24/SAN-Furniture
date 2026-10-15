import {
  classifyUKPostcode,
  type UKPostcodeZone,
  type DeliveryTier,
  type ShippingQuoteRequest,
  type ShippingQuoteResponse,
} from "@san-furniture/types";

export interface ZoneSurchargeRule {
  surchargePennies: number;
  minDaysOffset: number;
  maxDaysOffset: number;
  isDeliverable: boolean;
  disclaimer?: string;
}

const ZONE_RULES: Record<UKPostcodeZone, Record<DeliveryTier, ZoneSurchargeRule>> = {
  zone_1_mainland: {
    standard_parcel: { surchargePennies: 0, minDaysOffset: 0, maxDaysOffset: 0, isDeliverable: true },
    pallet: { surchargePennies: 0, minDaysOffset: 0, maxDaysOffset: 0, isDeliverable: true },
    two_man_white_glove: { surchargePennies: 0, minDaysOffset: 0, maxDaysOffset: 0, isDeliverable: true },
  },
  zone_2_scottish_highlands: {
    standard_parcel: { surchargePennies: 1900, minDaysOffset: 1, maxDaysOffset: 3, isDeliverable: true, disclaimer: "Scottish Highlands parcel surcharge applies" },
    pallet: { surchargePennies: 4900, minDaysOffset: 2, maxDaysOffset: 4, isDeliverable: true, disclaimer: "Regional freight pallet surcharge applied" },
    two_man_white_glove: { surchargePennies: 4900, minDaysOffset: 3, maxDaysOffset: 5, isDeliverable: true, disclaimer: "Highlands 2-man regional team surcharge applied" },
  },
  zone_3_scottish_islands: {
    standard_parcel: { surchargePennies: 2900, minDaysOffset: 3, maxDaysOffset: 6, isDeliverable: true, disclaimer: "Scottish Offshore ferry transit required" },
    pallet: { surchargePennies: 6900, minDaysOffset: 4, maxDaysOffset: 7, isDeliverable: true, disclaimer: "Maritime pallet crate surcharge applied" },
    two_man_white_glove: { surchargePennies: 6900, minDaysOffset: 5, maxDaysOffset: 8, isDeliverable: true, disclaimer: "Offshore island 2-man logistics transit" },
  },
  zone_4_northern_ireland: {
    standard_parcel: { surchargePennies: 1900, minDaysOffset: 2, maxDaysOffset: 4, isDeliverable: true, disclaimer: "Northern Ireland courier transit" },
    pallet: { surchargePennies: 5900, minDaysOffset: 3, maxDaysOffset: 5, isDeliverable: true, disclaimer: "Irish Sea freight surcharge applied" },
    two_man_white_glove: { surchargePennies: 5900, minDaysOffset: 4, maxDaysOffset: 6, isDeliverable: true, disclaimer: "Northern Ireland 2-man delivery service" },
  },
  zone_5_uk_offshore: {
    standard_parcel: { surchargePennies: 2500, minDaysOffset: 3, maxDaysOffset: 5, isDeliverable: true, disclaimer: "Isle of Man / Scilly transit" },
    pallet: { surchargePennies: 6500, minDaysOffset: 4, maxDaysOffset: 7, isDeliverable: true, disclaimer: "Offshore pallet carriage" },
    two_man_white_glove: { surchargePennies: 6500, minDaysOffset: 5, maxDaysOffset: 8, isDeliverable: true, disclaimer: "Offshore white glove carriage" },
  },
  zone_excluded: {
    standard_parcel: { surchargePennies: 0, minDaysOffset: 0, maxDaysOffset: 0, isDeliverable: false, disclaimer: "Channel Islands: online checkout unavailable. Please contact concierge." },
    pallet: { surchargePennies: 0, minDaysOffset: 0, maxDaysOffset: 0, isDeliverable: false, disclaimer: "Channel Islands: online checkout unavailable. Please contact concierge." },
    two_man_white_glove: { surchargePennies: 0, minDaysOffset: 0, maxDaysOffset: 0, isDeliverable: false, disclaimer: "Channel Islands: online checkout unavailable. Please contact concierge." },
  },
};

// Base transit days by tier for Mainland UK
const BASE_TRANSIT_DAYS: Record<DeliveryTier, { minDays: number; maxDays: number; baseRatePennies: number }> = {
  standard_parcel: { minDays: 2, maxDays: 4, baseRatePennies: 999 }, // £9.99
  pallet: { minDays: 3, maxDays: 6, baseRatePennies: 3900 },         // £39.00
  two_man_white_glove: { minDays: 5, maxDays: 10, baseRatePennies: 4900 }, // £49.00
};

const FREE_SHIPPING_THRESHOLD_PENNIES = 50000; // £500.00

export class ShippingRateService {
  /**
   * Calculate precise UK shipping quote based on postcode zone, delivery tier, and subtotal
   */
  public calculateQuote(req: ShippingQuoteRequest): ShippingQuoteResponse {
    const zone = classifyUKPostcode(req.postcode);
    const tierConfig = BASE_TRANSIT_DAYS[req.delivery_tier];
    const zoneRule = ZONE_RULES[zone][req.delivery_tier];

    if (!zoneRule.isDeliverable) {
      return {
        zone,
        base_rate_pennies: 0,
        surcharge_pennies: 0,
        total_shipping_pennies: 0,
        is_deliverable: false,
        estimated_days_min: 0,
        estimated_days_max: 0,
        disclaimer: zoneRule.disclaimer,
      };
    }

    // Mainland base rate is waived if order meets £500 threshold
    const qualifiesForFreeDelivery = req.order_subtotal_pennies >= FREE_SHIPPING_THRESHOLD_PENNIES;
    const baseRate = qualifiesForFreeDelivery ? 0 : tierConfig.baseRatePennies;

    // Regional surcharges (Highlands, NI, Islands) always apply to protect logistics margins
    const surcharge = zoneRule.surchargePennies;
    const totalShipping = baseRate + surcharge;

    return {
      zone,
      base_rate_pennies: baseRate,
      surcharge_pennies: surcharge,
      total_shipping_pennies: totalShipping,
      is_deliverable: true,
      estimated_days_min: tierConfig.minDays + zoneRule.minDaysOffset,
      estimated_days_max: tierConfig.maxDays + zoneRule.maxDaysOffset,
      disclaimer: zoneRule.disclaimer ?? (qualifiesForFreeDelivery ? "Qualifies for Free Mainland Delivery" : undefined),
    };
  }
}
