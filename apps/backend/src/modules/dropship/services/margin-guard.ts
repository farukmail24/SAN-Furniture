import {
  calculateRetailWithMarginGuard,
  type MarginCalculationResult,
  type MarginAlert,
  MarginAlertSchema
} from "@san-furniture/types";

export interface MarginGuardSettings {
  targetMarginPercent: number; // e.g. 35.0%
  floorMarginPercent: number;  // e.g. 20.0%
  paymentFeePercent: number;   // e.g. 1.5%
  paymentFixedPennies: number; // e.g. 20p
  preventPriceDropOnAlert: boolean;
}

export const DEFAULT_MARGIN_SETTINGS: MarginGuardSettings = {
  targetMarginPercent: 35.0,
  floorMarginPercent: 20.0,
  paymentFeePercent: 1.5,
  paymentFixedPennies: 20,
  preventPriceDropOnAlert: true
};

export class MarginGuardService {
  private settings: MarginGuardSettings;
  private recordedAlerts: MarginAlert[] = [];

  constructor(settings: Partial<MarginGuardSettings> = {}) {
    this.settings = { ...DEFAULT_MARGIN_SETTINGS, ...settings };
  }

  /**
   * Calculate retail pricing and evaluate margin health against floor rules
   */
  public evaluatePrice(
    costPricePennies: number,
    carriagePennies = 0,
    currentRetailPennies?: number
  ): {
    pricing: MarginCalculationResult;
    alert?: MarginAlert;
    recommendedRetailGrossPennies: number;
  } {
    const pricing = calculateRetailWithMarginGuard(
      costPricePennies,
      carriagePennies,
      this.settings.targetMarginPercent,
      this.settings.floorMarginPercent,
      this.settings.paymentFeePercent,
      this.settings.paymentFixedPennies
    );

    let alert: MarginAlert | undefined;
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
  public getRecordedAlerts(): MarginAlert[] {
    return [...this.recordedAlerts];
  }

  /**
   * Clear recorded alerts (e.g. after dispatching admin notifications)
   */
  public clearAlerts(): void {
    this.recordedAlerts = [];
  }
}
