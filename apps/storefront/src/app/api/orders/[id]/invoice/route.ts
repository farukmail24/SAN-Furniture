import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { formatGBP, calculateNetAndVat } from "@san-furniture/types";
import { getAdminFromRequest, getCustomerFromRequest } from "@/lib/auth-token";

export const dynamic = "force-dynamic";

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
      "SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN ('company_name', 'company_number', 'vat_number', 'registered_address', 'support_email', 'support_phone')"
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

    const itemsRowsHtml = items
      .map((it: any) => {
        const itemTotalPennies = (it.pricePennies || it.price_pennies || 0) * (it.quantity || 1);
        const itemVat = calculateNetAndVat(itemTotalPennies);
        return `
          <tr>
            <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 13px; font-weight: 600; color: #0f172a;">${it.title || it.name || "Bespoke Furniture Piece"}</td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 13px; text-align: center; color: #334155;">${it.quantity || 1}</td>
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

    const html = `<!DOCTYPE html>
<html lang="en-GB">
<head>
  <meta charset="utf-8">
  <title>VAT Invoice ${order.order_number} - ${companyName}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0f172a; background: #f8fafc; margin: 0; padding: 40px 20px; }
    .invoice-card { max-width: 820px; margin: 0 auto; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); padding: 48px; border: 1px solid #e2e8f0; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #00072d; padding-bottom: 24px; margin-bottom: 32px; }
    .brand-title { font-size: 24px; font-weight: 800; color: #00072d; letter-spacing: -0.5px; margin: 0; }
    .badge { display: inline-block; background: #00072d; color: #f8fafc; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 4px; text-transform: uppercase; margin-top: 6px; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 36px; }
    .meta-box h4 { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; margin: 0 0 8px 0; letter-spacing: 0.5px; }
    .meta-box p { font-size: 13px; line-height: 1.6; margin: 0; color: #1e293b; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 32px; }
    th { background: #f1f5f9; padding: 12px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #475569; text-align: left; }
    .totals { margin-left: auto; width: 320px; border-top: 2px solid #e2e8f0; padding-top: 16px; }
    .total-row { display: flex; justify-content: space-between; font-size: 13px; color: #475569; margin-bottom: 8px; }
    .grand-total { font-size: 18px; font-weight: 800; color: #00072d; border-top: 2px solid #00072d; padding-top: 12px; margin-top: 12px; }
    .footer-note { border-top: 1px solid #e2e8f0; padding-top: 24px; margin-top: 40px; font-size: 11px; color: #64748b; text-align: center; line-height: 1.6; }
    @media print { body { background: #ffffff; padding: 0; } .invoice-card { box-shadow: none; border: none; padding: 0; } }
  </style>
</head>
<body>
  <div class="invoice-card">
    <div class="header">
      <div>
        <h1 class="brand-title">${companyName}</h1>
        <span class="badge">Official UK VAT Invoice</span>
      </div>
      <div style="text-align: right;">
        <h3 style="margin: 0; font-size: 16px; font-weight: 700; color: #00072d;">Invoice #${order.order_number}</h3>
        <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b;">Tax Point: ${invoiceDate}</p>
        <p style="margin: 2px 0 0 0; font-size: 12px; color: #64748b;">VAT Reg No: <strong>${vatNumber}</strong></p>
      </div>
    </div>

    <div class="meta-grid">
      <div class="meta-box">
        <h4>Supplier Information</h4>
        <p><strong>${companyName}</strong></p>
        <p>${companyAddress}</p>
        <p>Company Registration: ${companyNumber}</p>
        <p>Email: ${settings.support_email || "support@sanfurniture.com"}</p>
      </div>
      <div class="meta-box" style="text-align: right;">
        <h4>Billed / Delivered To</h4>
        <p><strong>${order.customer_name}</strong></p>
        <p>${order.customer_email}</p>
        <p>${order.shipping_address || "UK Mainland Shipping"}</p>
        <p>Postcode: <strong>${order.shipping_postcode}</strong></p>
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
        <span>Delivery (${order.delivery_tier || "Mainland Free"}):</span>
        <span>${formatGBP(Number(order.shipping_pennies) || 0)}</span>
      </div>
      <div class="total-row grand-total">
        <span>Total Gross Payable:</span>
        <span>${vatBreakdown.formattedGross}</span>
      </div>
    </div>

    <div class="footer-note">
      <p>Thank you for choosing ${companyName}. Every piece is quality checked and protected under UK Consumer Rights Act 2015.</p>
      <p>${companyName} • Registered in England & Wales (#${companyNumber}) • VAT Registration: ${vatNumber}</p>
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
