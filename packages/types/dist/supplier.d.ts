import { z } from "zod";
/**
 * Supplier Feed Item Schema (from supplier CSV/XML/API)
 */
export declare const SupplierFeedItemSchema: z.ZodObject<{
    supplier_id: z.ZodString;
    supplier_sku: z.ZodString;
    product_title: z.ZodString;
    category_hint: z.ZodOptional<z.ZodString>;
    cost_price_pennies: z.ZodNumber;
    carriage_cost_pennies: z.ZodDefault<z.ZodNumber>;
    stock_level: z.ZodNumber;
    lead_time_days: z.ZodDefault<z.ZodNumber>;
    discontinued: z.ZodDefault<z.ZodBoolean>;
    barcode_gtin: z.ZodOptional<z.ZodString>;
    supplier_updated_at: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    lead_time_days: number;
    supplier_id: string;
    supplier_sku: string;
    product_title: string;
    cost_price_pennies: number;
    carriage_cost_pennies: number;
    stock_level: number;
    discontinued: boolean;
    category_hint?: string | undefined;
    barcode_gtin?: string | undefined;
    supplier_updated_at?: string | undefined;
}, {
    supplier_id: string;
    supplier_sku: string;
    product_title: string;
    cost_price_pennies: number;
    stock_level: number;
    lead_time_days?: number | undefined;
    category_hint?: string | undefined;
    carriage_cost_pennies?: number | undefined;
    discontinued?: boolean | undefined;
    barcode_gtin?: string | undefined;
    supplier_updated_at?: string | undefined;
}>;
export type SupplierFeedItem = z.infer<typeof SupplierFeedItemSchema>;
/**
 * Configuration parameters for Margin Guard
 */
export declare const MarginGuardConfigSchema: z.ZodObject<{
    default_target_margin_percent: z.ZodDefault<z.ZodNumber>;
    minimum_floor_margin_percent: z.ZodDefault<z.ZodNumber>;
    payment_gateway_fee_percent: z.ZodDefault<z.ZodNumber>;
    payment_gateway_fixed_pennies: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    default_target_margin_percent: number;
    minimum_floor_margin_percent: number;
    payment_gateway_fee_percent: number;
    payment_gateway_fixed_pennies: number;
}, {
    default_target_margin_percent?: number | undefined;
    minimum_floor_margin_percent?: number | undefined;
    payment_gateway_fee_percent?: number | undefined;
    payment_gateway_fixed_pennies?: number | undefined;
}>;
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
export declare function calculateRetailWithMarginGuard(costPricePennies: number, carriagePennies: number, targetMarginPercent?: number, floorMarginPercent?: number, paymentFeePercent?: number, paymentFixedPennies?: number): MarginCalculationResult;
/**
 * Margin Guard Alert event
 */
export declare const MarginAlertSchema: z.ZodObject<{
    supplier_id: z.ZodString;
    supplier_sku: z.ZodString;
    product_id: z.ZodString;
    old_cost_pennies: z.ZodNumber;
    new_cost_pennies: z.ZodNumber;
    calculated_margin_percent: z.ZodNumber;
    floor_margin_percent: z.ZodNumber;
    timestamp: z.ZodString;
}, "strip", z.ZodTypeAny, {
    supplier_id: string;
    supplier_sku: string;
    product_id: string;
    old_cost_pennies: number;
    new_cost_pennies: number;
    calculated_margin_percent: number;
    floor_margin_percent: number;
    timestamp: string;
}, {
    supplier_id: string;
    supplier_sku: string;
    product_id: string;
    old_cost_pennies: number;
    new_cost_pennies: number;
    calculated_margin_percent: number;
    floor_margin_percent: number;
    timestamp: string;
}>;
export type MarginAlert = z.infer<typeof MarginAlertSchema>;
//# sourceMappingURL=supplier.d.ts.map