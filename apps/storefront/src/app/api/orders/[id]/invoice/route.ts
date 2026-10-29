import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { getDbPool } from "@/lib/db";
import { formatGBP, calculateNetAndVat } from "@san-furniture/types";
import { getAdminFromRequest, getCustomerFromRequest } from "@/lib/auth-token";

export const dynamic = "force-dynamic";

function escapeHtml(unsafe: any): string {
  if (unsafe === null || unsafe === undefined) return "";
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pool = getDbPool();

    const [orderRows]: any = await pool.query(
      "SELECT * FROM orders WHERE id = ? OR order_number = ? LIMIT 1",
      [id, id]
    );

    if (!orderRows || orderRows.length === 0) {
      return new NextResponse("Order not found", { status: 404 });
    }

    const order = orderRows[0];

    // Authorization check: Admin, Order Customer, or Postcode Verification
    const admin = await getAdminFromRequest(request);
    const authCust = await getCustomerFromRequest(request);
    const { searchParams } = new URL(request.url);
    const queryPostcode = (searchParams.get("postcode") || "").trim().toUpperCase().replace(/\s+/g, "");

    const isOrderOwner =
      authCust &&
      order.customer_email &&
      authCust.email.toLowerCase() === order.customer_email.toLowerCase();

    if (!admin && !isOrderOwner) {
      if (!queryPostcode) {
        return new NextResponse(
          "Unauthorized: Please sign in or provide the delivery postcode to view this invoice.",
          { status: 401 }
        );
      }
      const orderPostcode = (order.shipping_postcode || "").trim().toUpperCase().replace(/\s+/g, "");
      if (queryPostcode !== orderPostcode) {
        return new NextResponse(
          "Forbidden: Postcode does not match the order delivery address.",
          { status: 403 }
        );
      }
    }

    const totalPennies = Number(order.total_pennies) || 0;
    const vatBreakdown = calculateNetAndVat(totalPennies);

    let items: any[] = [];
    try {
      items = typeof order.items_json === "string" ? JSON.parse(order.items_json) : (order.items_json || []);
    } catch {
      items = [];
    }

    const [settingsRows]: any = await pool.query(
      "SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN ('company_name', 'company_number', 'vat_number', 'registered_address', 'support_email', 'support_phone', 'site_logo_light')"
    ).catch(() => [[]]);

    const settings: Record<string, string> = {};
    if (Array.isArray(settingsRows)) {
      for (const r of settingsRows) {
        settings[r.setting_key] = r.setting_value;
      }
    }

    const companyName = settings.company_name || "SAN Furniture Ltd";
    const companyAddress = settings.registered_address || "Mainland UK Logistics Hub, London, United Kingdom";
    const companyNumber = settings.company_number || "14829103";
    const vatNumber = settings.vat_number || "GB 429 8812 04";

    // Resolve Brand Logo (Base64 Data URI for 100% reliable offline & print rendering)
    let logoSrc = "/SanFurnitureLogo.png";
    const logoFileName = (settings.site_logo_light || "/SanFurnitureLogo.png").replace(/^\//, "");
    const candidateLogoPaths = [
      path.join(process.cwd(), "public", logoFileName),
      path.join(process.cwd(), "public", "SanFurnitureLogo.png"),
      path.join(process.cwd(), "apps", "storefront", "public", logoFileName),
      path.join(process.cwd(), "apps", "storefront", "public", "SanFurnitureLogo.png"),
      path.resolve(__dirname, "../../../../../public", logoFileName),
      path.resolve(__dirname, "../../../../../public", "SanFurnitureLogo.png"),
      path.resolve(__dirname, "../../../../../../public", logoFileName),
      path.resolve(__dirname, "../../../../../../public", "SanFurnitureLogo.png"),
    ];

    for (const p of candidateLogoPaths) {
      try {
        if (fs.existsSync(p)) {
          const imgBuf = fs.readFileSync(p);
          logoSrc = `data:image/png;base64,${imgBuf.toString("base64")}`;
          break;
        }
      } catch {}
    }

    const itemsRowsHtml = items
      .map((it: any) => {
        const itemTotalPennies = (it.pricePennies || it.price_pennies || 0) * (it.quantity || 1);
        const itemVat = calculateNetAndVat(itemTotalPennies);
        const itemTitle = escapeHtml(it.title || it.name || "Bespoke Furniture Piece");
        return `
          <tr>
            <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 13px; font-weight: 600; color: #0f172a;">${itemTitle}</td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 13px; text-align: center; color: #334155;">${Number(it.quantity) || 1}</td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 13px; text-align: right; color: #334155;">${itemVat.formattedNet}</td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 13px; text-align: right; color: #334155;">20% (${itemVat.formattedVat})</td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 13px; text-align: right; font-weight: 700; color: #0f172a;">${itemVat.formattedGross}</td>
          </tr>
        `;
      })
      .join("");

    const invoiceDate = new Date(order.created_at || Date.now()).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const safeCompanyName = escapeHtml(companyName);
    const safeCompanyAddress = escapeHtml(companyAddress);
    const safeCompanyNumber = escapeHtml(companyNumber);
    const safeVatNumber = escapeHtml(vatNumber);
    const safeSupportEmail = escapeHtml(settings.support_email || "support@sanfurniture.com");
    const safeOrderNumber = escapeHtml(order.order_number);
    const safeCustomerName = escapeHtml(order.customer_name);
    const safeCustomerEmail = escapeHtml(order.customer_email);
    const safeShippingAddress = escapeHtml(order.shipping_address || "UK Mainland Shipping");
    const safeShippingPostcode = escapeHtml(order.shipping_postcode || "");
    const safeDeliveryTier = escapeHtml(order.delivery_tier || "Mainland Free");

    const html = `<!DOCTYPE html>
<html lang="en-GB">
<head>
  <meta charset="utf-8">
  <title>VAT Invoice ${safeOrderNumber} - ${safeCompanyName}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0f172a; background: #f8fafc; margin: 0; padding: 40px 20px; }
    .invoice-card { max-width: 820px; margin: 0 auto; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); padding: 48px; border: 1px solid #e2e8f0; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #00072d; padding-bottom: 24px; margin-bottom: 32px; gap: 24px; }
    .brand-block { display: flex; flex-direction: column; align-items: flex-start; gap: 10px; }
    .invoice-logo { height: 52px; width: auto; max-width: 260px; object-fit: contain; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .badge { display: inline-block; background: #00072d; color: #f8fafc; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
    .meta-header { text-align: right; }
    .meta-header h3 { margin: 0; font-size: 16px; font-weight: 700; color: #00072d; }
    .meta-header p { margin: 4px 0 0 0; font-size: 12px; color: #64748b; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 36px; }
    .meta-box h4 { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; margin: 0 0 8px 0; letter-spacing: 0.5px; }
    .meta-box p { font-size: 13px; line-height: 1.6; margin: 0; color: #1e293b; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 32px; }
    th { background: #f1f5f9; padding: 12px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #475569; text-align: left; }
    .totals { margin-left: auto; width: 320px; border-top: 2px solid #e2e8f0; padding-top: 16px; }
    .total-row { display: flex; justify-content: space-between; font-size: 13px; color: #475569; margin-bottom: 8px; }
    .grand-total { font-size: 18px; font-weight: 800; color: #00072d; border-top: 2px solid #00072d; padding-top: 12px; margin-top: 12px; }
    .footer-note { border-top: 1px solid #e2e8f0; padding-top: 24px; margin-top: 40px; font-size: 11px; color: #64748b; text-align: center; line-height: 1.6; }
    @media print { body { background: #ffffff; padding: 0; } .invoice-card { box-shadow: none; border: none; padding: 0; } .invoice-logo { max-height: 54px; } }
  </style>
</head>
<body>
  <div class="invoice-card">
    <div class="header">
      <div class="brand-block">
        <img src="${logoSrc}" alt="${safeCompanyName}" class="invoice-logo" />
        <span class="badge">Official UK VAT Invoice</span>
      </div>
      <div class="meta-header">
        <h3>Invoice #${safeOrderNumber}</h3>
        <p>Tax Point: <strong>${invoiceDate}</strong></p>
        <p>VAT Reg No: <strong>${safeVatNumber}</strong></p>
      </div>
    </div>

    <div class="meta-grid">
      <div class="meta-box">
        <h4>Supplier Information</h4>
        <p><strong>${safeCompanyName}</strong></p>
        <p>${safeCompanyAddress}</p>
        <p>Company Registration: ${safeCompanyNumber}</p>
        <p>Email: ${safeSupportEmail}</p>
      </div>
      <div class="meta-box" style="text-align: right;">
        <h4>Billed / Delivered To</h4>
        <p><strong>${safeCustomerName}</strong></p>
        <p>${safeCustomerEmail}</p>
        <p>${safeShippingAddress}</p>
        <p>Postcode: <strong>${safeShippingPostcode}</strong></p>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th style="text-align: center;">Qty</th>
          <th style="text-align: right;">Net (GBP)</th>
          <th style="text-align: right;">VAT Rate</th>
          <th style="text-align: right;">Gross (GBP)</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRowsHtml || `<tr><td colspan="5" style="padding: 16px; text-align: center; color: #64748b;">Bespoke Furniture Commission - Free UK Mainland Delivery</td></tr>`}
      </tbody>
    </table>

    <div class="totals">
      <div class="total-row">
        <span>Subtotal (Net):</span>
        <span>${vatBreakdown.formattedNet}</span>
      </div>
      <div class="total-row">
        <span>Standard UK VAT (20.0%):</span>
        <span>${vatBreakdown.formattedVat}</span>
      </div>
      <div class="total-row">
        <span>Delivery (${safeDeliveryTier}):</span>
        <span>${formatGBP(Number(order.shipping_pennies) || 0)}</span>
      </div>
      <div class="total-row grand-total">
        <span>Total Gross Payable:</span>
        <span>${vatBreakdown.formattedGross}</span>
      </div>
    </div>

    <div class="footer-note">
      <p>Thank you for choosing ${safeCompanyName}. Every piece is quality checked and protected under UK Consumer Rights Act 2015.</p>
      <p>${safeCompanyName} • Registered in England & Wales (#${safeCompanyNumber}) • VAT Registration: ${safeVatNumber}</p>
    </div>
  </div>
</body>
</html>`;

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    });
  } catch (err: any) {
    return new NextResponse(`Invoice generation error: ${err.message}`, { status: 500 });
  }
}
