import { z } from "zod";

/**
 * Supplier Feed Item Schema (from supplier CSV/XML/API)
 */
export const SupplierFeedItemSchema = z.object({
  supplier_id: z.string().min(1),
  supplier_sku: z.string().min(1),
  product_title: z.string().min(1),
  category_hint: z.string().optional(),
  cost_price_pennies: z.number().int().positive({ message: "Cost price must be positive" }),
  carriage_cost_pennies: z.number().int().nonnegative().default(0),
  stock_level: z.number().int().nonnegative(),
  lead_time_days: z.number().int().positive().default(3),
  discontinued: z.boolean().default(false),
  barcode_gtin: z.string().optional(),
  supplier_updated_at: z.string().datetime().optional()
});
export type SupplierFeedItem = z.infer<typeof SupplierFeedItemSchema>;

/**
 * Configuration parameters for Margin Guard
 */
export const MarginGuardConfigSchema = z.object({
  default_target_margin_percent: z.number().positive().default(35.0),
  minimum_floor_margin_percent: z.number().positive().default(20.0),
  payment_gateway_fee_percent: z.number().default(1.5), // Stripe standard UK card fee
  payment_gateway_fixed_pennies: z.number().default(20) // Stripe 20p fixed
});
export type MarginGuardConfig = z.infer<typeof MarginGuardConfigSchema>;

/**
 * Result of Margin Guard Calculation
 */
export interface MarginCalculationResult {
  costPricePennies: number;
  carriagePennies: number;
  totalSupplierCostPennies: number;
  targetMarginPercent: number;
  retailGrossPennies: number;
  retailNetPennies: number;
  estimatedNetProfitPennies: number;
  actualGrossMarginPercent: number;
  isBelowFloorMargin: boolean;
  alertTriggered: boolean;
}

/**
 * Calculate recommended retail price guaranteeing minimum margin
 */
export function calculateRetailWithMarginGuard(
  costPricePennies: number,
  carriagePennies: number,
  targetMarginPercent = 35.0,
  floorMarginPercent = 20.0,
  paymentFeePercent = 1.5,
  paymentFixedPennies = 20
): MarginCalculationResult {
  const totalCost = costPricePennies + carriagePennies;
  const targetMultiplier = 1 + (targetMarginPercent / 100);
  const paymentFeeDecimal = paymentFeePercent / 100;

  // Desired net revenue after payment fees
  const rawNetRequired = (totalCost * targetMultiplier + paymentFixedPennies) / (1 - paymentFeeDecimal);
  const retailNetPennies = Math.round(rawNetRequired);
  
  // Add 20% UK VAT to reach customer gross price
  const retailGrossPennies = Math.round(retailNetPennies * 1.20);

  // Actual net earnings after payment gateway fee
  const actualPaymentFee = Math.round((retailGrossPennies * paymentFeeDecimal) + paymentFixedPennies);
  const netEarnings = retailNetPennies - actualPaymentFee;
  const estimatedNetProfitPennies = netEarnings - totalCost;

  const actualGrossMarginPercent = Math.round(((netEarnings - totalCost) / netEarnings) * 10000) / 100;
  const isBelowFloorMargin = actualGrossMarginPercent < floorMarginPercent;

  return {
    costPricePennies,
    carriagePennies,
    totalSupplierCostPennies: totalCost,
    targetMarginPercent,
    retailGrossPennies,
    retailNetPennies,
    estimatedNetProfitPennies,
    actualGrossMarginPercent,
    isBelowFloorMargin,
    alertTriggered: isBelowFloorMargin
  };
}

/**
 * Margin Guard Alert event
 */
export const MarginAlertSchema = z.object({
  supplier_id: z.string(),
  supplier_sku: z.string(),
  product_id: z.string(),
  old_cost_pennies: z.number().int(),
  new_cost_pennies: z.number().int(),
  calculated_margin_percent: z.number(),
  floor_margin_percent: z.number(),
  timestamp: z.string().datetime()
});
export type MarginAlert = z.infer<typeof MarginAlertSchema>;
