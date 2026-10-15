import { calculateNetAndVat, formatGBP, type VATBreakdown } from "@san-furniture/types";

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

export class VatInvoiceGenerator {
  public static readonly COMPANY_VAT_NUMBER = "GB 421 9823 45";
  public static readonly COMPANY_CRN = "15482910";
  public static readonly COMPANY_NAME = "SAN Furniture Ltd";
  public static readonly COMPANY_ADDRESS = [
    "100 Pall Mall",
    "St James's",
    "London",
    "SW1Y 5NQ",
    "United Kingdom",
  ];

  /**
   * Generate UK HMRC compliant VAT invoice structure
   */
  public generateInvoice(
    invoiceSeq: number,
    orderId: string,
    customer: InvoiceCustomer,
    lineItems: InvoiceLineItem[],
    shippingGrossPennies: number,
    paymentMethod = "Stripe UK (Cards / Klarna)",
    paymentReference?: string
  ): VATInvoiceData {
    const invoiceNumber = `INV-2026-${String(invoiceSeq).padStart(5, "0")}`;
    const today = new Date().toISOString().split("T")[0]!;

    let totalGoodsGrossPennies = 0;

    const formattedItems = lineItems.map((item) => {
      const lineGross = item.grossUnitPricePennies * item.quantity;
      totalGoodsGrossPennies += lineGross;
      const vatBreakdown = calculateNetAndVat(lineGross);

      return {
        sku: item.sku,
        title: item.title,
        quantity: item.quantity,
        grossTotalPennies: lineGross,
        netTotalPennies: vatBreakdown.netPennies,
        vatTotalPennies: vatBreakdown.vatPennies,
        formattedGross: vatBreakdown.formattedGross,
        formattedNet: vatBreakdown.formattedNet,
        formattedVat: vatBreakdown.formattedVat,
      };
    });

    const grandTotalGrossPennies = totalGoodsGrossPennies + shippingGrossPennies;
    const overallBreakdown = calculateNetAndVat(grandTotalGrossPennies);

    return {
      invoiceNumber,
      issueDate: today,
      taxPointDate: today,
      companyName: VatInvoiceGenerator.COMPANY_NAME,
      companyAddress: VatInvoiceGenerator.COMPANY_ADDRESS,
      companyVatNumber: VatInvoiceGenerator.COMPANY_VAT_NUMBER,
      companyRegistrationNumber: VatInvoiceGenerator.COMPANY_CRN,
      customer,
      items: formattedItems,
      shippingGrossPennies,
      breakdown: overallBreakdown,
      paymentMethod,
      paymentReference: paymentReference || `pi_${orderId}`,
    };
  }

  /**
   * Render HTML representation of the UK VAT invoice for customer PDF / email
   */
  public renderInvoiceHtml(invoice: VATInvoiceData): string {
    return `<!DOCTYPE html>
<html lang="en-GB">
<head>
  <meta charset="utf-8" />
  <title>VAT Invoice ${invoice.invoiceNumber} - ${invoice.companyName}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #070D1E; margin: 0; padding: 40px; background: #fff; line-height: 1.5; font-size: 13px; }
    .header { display: flex; justify-content: space-between; border-b: 2px solid #0B132B; padding-bottom: 20px; margin-bottom: 24px; }
    .company-title { font-size: 20px; font-weight: 700; color: #0B132B; }
    .vat-badge { font-size: 11px; background: #E8E2D5; padding: 4px 8px; border-radius: 4px; font-weight: 600; display: inline-block; margin-top: 4px; }
    .grid { display: flex; justify-content: space-between; margin-bottom: 30px; }
    .bill-to h4, .inv-meta h4 { margin: 0 0 6px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #4F6D7A; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    th { text-align: left; padding: 10px; background: #F4F1EA; font-size: 11px; text-transform: uppercase; border-bottom: 1px solid #E8E2D5; }
    td { padding: 10px; border-bottom: 1px solid #E8E2D5; font-size: 12px; }
    .text-right { text-align: right; }
    .totals { width: 320px; margin-left: auto; margin-top: 10px; }
    .totals-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #E8E2D5; }
    .totals-row.grand { font-size: 16px; font-weight: 700; border-top: 2px solid #0B132B; border-bottom: none; padding-top: 10px; }
    .footer { margin-top: 40px; border-top: 1px solid #E8E2D5; padding-top: 16px; font-size: 11px; color: #4F6D7A; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="company-title">${invoice.companyName}</div>
      <div>${invoice.companyAddress.join(", ")}</div>
      <div class="vat-badge">UK VAT REG NO: ${invoice.companyVatNumber}</div>
    </div>
    <div style="text-align: right;">
      <h2 style="margin: 0; color: #0B132B;">TAX INVOICE</h2>
      <div><strong>Invoice #:</strong> ${invoice.invoiceNumber}</div>
      <div><strong>Tax Point / Date:</strong> ${invoice.taxPointDate}</div>
    </div>
  </div>

  <div class="grid">
    <div class="bill-to">
      <h4>Customer Billing & Delivery</h4>
      <div><strong>${invoice.customer.name}</strong></div>
      <div>${invoice.customer.addressLine1}</div>
      ${invoice.customer.addressLine2 ? `<div>${invoice.customer.addressLine2}</div>` : ""}
      <div>${invoice.customer.city}, ${invoice.customer.postcode}</div>
      <div>${invoice.customer.country}</div>
      <div>${invoice.customer.email}</div>
    </div>
    <div class="inv-meta" style="text-align: right;">
      <h4>Payment Information</h4>
      <div><strong>Method:</strong> ${invoice.paymentMethod}</div>
      <div><strong>Transaction Ref:</strong> ${invoice.paymentReference}</div>
      <div><strong>Currency:</strong> GBP (£)</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>SKU</th>
        <th>Description</th>
        <th class="text-right">Qty</th>
        <th class="text-right">Net</th>
        <th class="text-right">VAT (20%)</th>
        <th class="text-right">Gross Total</th>
      </tr>
    </thead>
    <tbody>
      ${invoice.items
        .map(
          (it) => `
        <tr>
          <td style="font-family: monospace;">${it.sku}</td>
          <td>${it.title}</td>
          <td class="text-right">${it.quantity}</td>
          <td class="text-right">${it.formattedNet}</td>
          <td class="text-right">${it.formattedVat}</td>
          <td class="text-right"><strong>${it.formattedGross}</strong></td>
        </tr>`
        )
        .join("")}
      ${
        invoice.shippingGrossPennies > 0
          ? `<tr>
        <td style="font-family: monospace;">SHIPPING-UK</td>
        <td>UK Delivery & Logistics</td>
        <td class="text-right">1</td>
        <td class="text-right">${calculateNetAndVat(invoice.shippingGrossPennies).formattedNet}</td>
        <td class="text-right">${calculateNetAndVat(invoice.shippingGrossPennies).formattedVat}</td>
        <td class="text-right"><strong>${formatGBP(invoice.shippingGrossPennies)}</strong></td>
      </tr>`
          : `<tr>
        <td style="font-family: monospace;">SHIPPING-FREE</td>
        <td>Free 2-Man White Glove Delivery (Order &gt; £500)</td>
        <td class="text-right">1</td>
        <td class="text-right">£0.00</td>
        <td class="text-right">£0.00</td>
        <td class="text-right"><strong>FREE</strong></td>
      </tr>`
      }
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-row">
      <span>Total Net Amount (ex. VAT):</span>
      <span>${invoice.breakdown.formattedNet}</span>
    </div>
    <div class="totals-row">
      <span>Total UK VAT (20%):</span>
      <span>${invoice.breakdown.formattedVat}</span>
    </div>
    <div class="totals-row grand">
      <span>Grand Total (Inc. VAT):</span>
      <span>${invoice.breakdown.formattedGross}</span>
    </div>
  </div>

  <div class="footer">
    ${invoice.companyName} • Registered in England &amp; Wales No. ${invoice.companyRegistrationNumber} • VAT No. ${invoice.companyVatNumber}<br/>
    This document constitutes an official UK VAT Invoice under the Value Added Tax Act 1994.
  </div>
</body>
</html>`;
  }
}
