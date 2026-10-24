import { type MarginCalculationResult, type MarginAlert } from "@san-furniture/types";
export interface MarginGuardSettings {
    targetMarginPercent: number;
    floorMarginPercent: number;
    paymentFeePercent: number;
    paymentFixedPennies: number;
    preventPriceDropOnAlert: boolean;
}
export declare const DEFAULT_MARGIN_SETTINGS: MarginGuardSettings;
export declare class MarginGuardService {
    private settings;
    private recordedAlerts;
    constructor(settings?: Partial<MarginGuardSettings>);
    /**
     * Calculate retail pricing and evaluate margin health against floor rules
     */
    evaluatePrice(costPricePennies: number, carriagePennies?: number, currentRetailPennies?: number): {
        pricing: MarginCalculationResult;
        alert?: MarginAlert;
        recommendedRetailGrossPennies: number;
    };
    /**
     * Retrieve all recorded margin alerts
     */
    getRecordedAlerts(): MarginAlert[];
    /**
     * Clear recorded alerts (e.g. after dispatching admin notifications)
     */
    clearAlerts(): void;
}
