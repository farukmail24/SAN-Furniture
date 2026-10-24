import { z } from "zod";
export declare const UK_VAT_RATE_PERCENTAGE = 20;
export declare const UK_VAT_MULTIPLIER = 1.2;
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
export declare function calculateNetAndVat(grossPennies: number): VATBreakdown;
/**
 * Format integer pennies into UK standard currency string
 * e.g. 49900 -> "£499.00"
 */
export declare function formatGBP(pennies: number): string;
/**
 * VAT Invoice Line Item Schema
 */
export declare const VATInvoiceLineItemSchema: z.ZodObject<{
    sku: z.ZodString;
    description: z.ZodString;
    quantity: z.ZodNumber;
    unit_gross_pennies: z.ZodNumber;
    unit_net_pennies: z.ZodNumber;
    unit_vat_pennies: z.ZodNumber;
    total_gross_pennies: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    sku: string;
    description: string;
    quantity: number;
    unit_gross_pennies: number;
    unit_net_pennies: number;
    unit_vat_pennies: number;
    total_gross_pennies: number;
}, {
    sku: string;
    description: string;
    quantity: number;
    unit_gross_pennies: number;
    unit_net_pennies: number;
    unit_vat_pennies: number;
    total_gross_pennies: number;
}>;
export type VATInvoiceLineItem = z.infer<typeof VATInvoiceLineItemSchema>;
/**
 * Official UK VAT Invoice Schema
 */
export declare const VATInvoiceSchema: z.ZodObject<{
    invoice_number: z.ZodString;
    order_id: z.ZodString;
    issue_date: z.ZodString;
    tax_point_date: z.ZodString;
    seller: z.ZodObject<{
        company_name: z.ZodDefault<z.ZodString>;
        company_number: z.ZodString;
        vat_number: z.ZodString;
        address: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        company_name: string;
        company_number: string;
        vat_number: string;
        address: string;
    }, {
        company_number: string;
        vat_number: string;
        address: string;
        company_name?: string | undefined;
    }>;
    buyer: z.ZodObject<{
        name: z.ZodString;
        address: z.ZodString;
        postcode: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        postcode: string;
        address: string;
        name: string;
    }, {
        postcode: string;
        address: string;
        name: string;
    }>;
    line_items: z.ZodArray<z.ZodObject<{
        sku: z.ZodString;
        description: z.ZodString;
        quantity: z.ZodNumber;
        unit_gross_pennies: z.ZodNumber;
        unit_net_pennies: z.ZodNumber;
        unit_vat_pennies: z.ZodNumber;
        total_gross_pennies: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        sku: string;
        description: string;
        quantity: number;
        unit_gross_pennies: number;
        unit_net_pennies: number;
        unit_vat_pennies: number;
        total_gross_pennies: number;
    }, {
        sku: string;
        description: string;
        quantity: number;
        unit_gross_pennies: number;
        unit_net_pennies: number;
        unit_vat_pennies: number;
        total_gross_pennies: number;
    }>, "many">;
    total_net_pennies: z.ZodNumber;
    vat_rate_percent: z.ZodDefault<z.ZodLiteral<20>>;
    total_vat_pennies: z.ZodNumber;
    total_gross_pennies: z.ZodNumber;
    currency: z.ZodDefault<z.ZodLiteral<"GBP">>;
}, "strip", z.ZodTypeAny, {
    total_gross_pennies: number;
    invoice_number: string;
    order_id: string;
    issue_date: string;
    tax_point_date: string;
    seller: {
        company_name: string;
        company_number: string;
        vat_number: string;
        address: string;
    };
    buyer: {
        postcode: string;
        address: string;
        name: string;
    };
    line_items: {
        sku: string;
        description: string;
        quantity: number;
        unit_gross_pennies: number;
        unit_net_pennies: number;
        unit_vat_pennies: number;
        total_gross_pennies: number;
    }[];
    total_net_pennies: number;
    vat_rate_percent: 20;
    total_vat_pennies: number;
    currency: "GBP";
}, {
    total_gross_pennies: number;
    invoice_number: string;
    order_id: string;
    issue_date: string;
    tax_point_date: string;
    seller: {
        company_number: string;
        vat_number: string;
        address: string;
        company_name?: string | undefined;
    };
    buyer: {
        postcode: string;
        address: string;
        name: string;
    };
    line_items: {
        sku: string;
        description: string;
        quantity: number;
        unit_gross_pennies: number;
        unit_net_pennies: number;
        unit_vat_pennies: number;
        total_gross_pennies: number;
    }[];
    total_net_pennies: number;
    total_vat_pennies: number;
    vat_rate_percent?: 20 | undefined;
    currency?: "GBP" | undefined;
}>;
export type VATInvoice = z.infer<typeof VATInvoiceSchema>;
//# sourceMappingURL=vat.d.ts.map