import { type VATBreakdown } from "@san-furniture/types";
export interface InvoiceCustomer {
    name: string;
    email: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    postcode: string;
    country: string;
}
export interface InvoiceLineItem {
    sku: string;
    title: string;
    quantity: number;
    grossUnitPricePennies: number;
    vatRatePercent: number;
}
export interface VATInvoiceData {
    invoiceNumber: string;
    issueDate: string;
    taxPointDate: string;
    companyName: string;
    companyAddress: string[];
    companyVatNumber: string;
    companyRegistrationNumber: string;
    customer: InvoiceCustomer;
    items: Array<{
        sku: string;
        title: string;
        quantity: number;
        grossTotalPennies: number;
        netTotalPennies: number;
        vatTotalPennies: number;
        formattedGross: string;
        formattedNet: string;
        formattedVat: string;
    }>;
    shippingGrossPennies: number;
    breakdown: VATBreakdown;
    paymentMethod: string;
    paymentReference: string;
}
export declare class VatInvoiceGenerator {
    static readonly COMPANY_VAT_NUMBER = "";
    static readonly COMPANY_CRN = "";
    static readonly COMPANY_NAME = "SAN Furniture";
    static readonly COMPANY_ADDRESS: string[];
    /**
     * Generate UK compliant VAT invoice structure
     */
    generateInvoice(invoiceSeq: number, orderId: string, customer: InvoiceCustomer, lineItems: InvoiceLineItem[], shippingGrossPennies: number, paymentMethod?: string, paymentReference?: string): VATInvoiceData;
    /**
     * Render HTML representation of the UK VAT invoice for customer PDF / email
     */
    renderInvoiceHtml(invoice: VATInvoiceData): string;
}
