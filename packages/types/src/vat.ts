import { z } from "zod";

export const UK_VAT_RATE_PERCENTAGE = 20.0;
export const UK_VAT_MULTIPLIER = 1.20;

/**
 * Detailed VAT breakdown in integer pennies
 */
export interface VATBreakdown {
  grossPennies: number;
  netPennies: number;
  vatPennies: number;
  vatRatePercentage: number;
  formattedGross: string;
  formattedNet: string;
  formattedVat: string;
}

/**
 * Calculate VAT breakdown from a customer-facing VAT-inclusive gross amount (in pennies)
 * Formula: Net = round(Gross / 1.20), VAT = Gross - Net
 */
export function calculateNetAndVat(grossPennies: number): VATBreakdown {
  if (grossPennies < 0) {
    throw new Error("Amount in pennies must be non-negative");
  }

  const netPennies = Math.round(grossPennies / UK_VAT_MULTIPLIER);
  const vatPennies = grossPennies - netPennies;

  return {
    grossPennies,
    netPennies,
    vatPennies,
    vatRatePercentage: UK_VAT_RATE_PERCENTAGE,
    formattedGross: formatGBP(grossPennies),
    formattedNet: formatGBP(netPennies),
    formattedVat: formatGBP(vatPennies)
  };
}

/**
 * Format integer pennies into UK standard currency string
 * e.g. 49900 -> "£499.00"
 */
export function formatGBP(pennies: number): string {
  const pounds = (pennies / 100).toFixed(2);
  const parts = pounds.split(".");
  const intPart = parts[0] ?? "0";
  const decPart = parts[1] ?? "00";
  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `£${withCommas}.${decPart}`;
}

/**
 * VAT Invoice Line Item Schema
 */
export const VATInvoiceLineItemSchema = z.object({
  sku: z.string(),
  description: z.string(),
  quantity: z.number().int().positive(),
  unit_gross_pennies: z.number().int().nonnegative(),
  unit_net_pennies: z.number().int().nonnegative(),
  unit_vat_pennies: z.number().int().nonnegative(),
  total_gross_pennies: z.number().int().nonnegative()
});
export type VATInvoiceLineItem = z.infer<typeof VATInvoiceLineItemSchema>;

/**
 * Official UK VAT Invoice Schema
 */
export const VATInvoiceSchema = z.object({
  invoice_number: z.string(),
  order_id: z.string(),
  issue_date: z.string(),
  tax_point_date: z.string(),
  seller: z.object({
    company_name: z.string().default("SAN Furniture Ltd"),
    company_number: z.string(),
    vat_number: z.string().regex(/^GB\d{9}$/, "Invalid UK VAT Number format"),
    address: z.string()
  }),
  buyer: z.object({
    name: z.string(),
    address: z.string(),
    postcode: z.string()
  }),
  line_items: z.array(VATInvoiceLineItemSchema),
  total_net_pennies: z.number().int().nonnegative(),
  vat_rate_percent: z.literal(20.0).default(20.0),
  total_vat_pennies: z.number().int().nonnegative(),
  total_gross_pennies: z.number().int().nonnegative(),
  currency: z.literal("GBP").default("GBP")
});
export type VATInvoice = z.infer<typeof VATInvoiceSchema>;
