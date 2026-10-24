import { type ShippingQuoteRequest, type ShippingQuoteResponse } from "@san-furniture/types";
export interface ZoneSurchargeRule {
    surchargePennies: number;
    minDaysOffset: number;
    maxDaysOffset: number;
    isDeliverable: boolean;
    disclaimer?: string;
}
export declare class ShippingRateService {
    /**
     * Calculate precise UK shipping quote based on postcode zone, delivery tier, and subtotal
     */
    calculateQuote(req: ShippingQuoteRequest): ShippingQuoteResponse;
}
