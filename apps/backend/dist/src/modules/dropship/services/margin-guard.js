import { calculateRetailWithMarginGuard, MarginAlertSchema } from "@san-furniture/types";
export const DEFAULT_MARGIN_SETTINGS = {
    targetMarginPercent: 35.0,
    floorMarginPercent: 20.0,
    paymentFeePercent: 1.5,
    paymentFixedPennies: 20,
    preventPriceDropOnAlert: true
};
export class MarginGuardService {
    settings;
    recordedAlerts = [];
    constructor(settings = {}) {
        this.settings = { ...DEFAULT_MARGIN_SETTINGS, ...settings };
    }
    /**
     * Calculate retail pricing and evaluate margin health against floor rules
     */
    evaluatePrice(costPricePennies, carriagePennies = 0, currentRetailPennies) {
        const pricing = calculateRetailWithMarginGuard(costPricePennies, carriagePennies, this.settings.targetMarginPercent, this.settings.floorMarginPercent, this.settings.paymentFeePercent, this.settings.paymentFixedPennies);
        let alert;
        let recommendedRetailGrossPennies = pricing.retailGrossPennies;
        // Check if the current price or calculated margin violates the safety floor
        if (pricing.isBelowFloorMargin) {
            alert = MarginAlertSchema.parse({
                supplier_id: "unknown",
                supplier_sku: "unknown",
                product_id: "unknown",
                old_cost_pennies: costPricePennies,
                new_cost_pennies: costPricePennies,
                calculated_margin_percent: pricing.actualGrossMarginPercent,
                floor_margin_percent: this.settings.floorMarginPercent,
                timestamp: new Date().toISOString()
            });
            this.recordedAlerts.push(alert);
            // Guardrail: If current retail is higher, preserve current retail to protect bottom line
            if (currentRetailPennies && currentRetailPennies > pricing.retailGrossPennies) {
                recommendedRetailGrossPennies = currentRetailPennies;
            }
        }
        return {
            pricing,
            alert,
            recommendedRetailGrossPennies
        };
    }
    /**
     * Retrieve all recorded margin alerts
     */
    getRecordedAlerts() {
        return [...this.recordedAlerts];
    }
    /**
     * Clear recorded alerts (e.g. after dispatching admin notifications)
     */
    clearAlerts() {
        this.recordedAlerts = [];
    }
}
