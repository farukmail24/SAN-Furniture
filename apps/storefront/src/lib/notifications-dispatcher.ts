import nodemailer from "nodemailer";
import { getDbPool } from "@/lib/db";
import { formatGBP } from "@san-furniture/types";

// ============================================================================
// Notification Settings Cache (15s TTL to eliminate SQL overhead while responsive)
// ============================================================================
export interface NotificationSettings {
  email_notifications_enabled?: string;
  smtp_provider?: string;
  smtp_host?: string;
  smtp_port?: string;
  smtp_encryption?: string;
  smtp_user?: string;
  smtp_pass?: string;
  smtp_from_email?: string;
  smtp_from_name?: string;
  support_email?: string;
  support_phone?: string;
  sms_notifications_enabled?: string;
  sms_provider?: string;
  sms_account_sid?: string;
  sms_auth_token?: string;
  sms_sender_id?: string;
  sms_dispatch_enabled?: string;
  sms_driver_alert_enabled?: string;
}

let cachedSettings: NotificationSettings | null = null;
let cachedSettingsExpiresAt = 0;

export async function getNotificationSettings(forceRefresh = false): Promise<NotificationSettings> {
  const now = Date.now();
  if (!forceRefresh && cachedSettings && now < cachedSettingsExpiresAt) {
    return cachedSettings;
  }

  try {
    const pool = getDbPool();
    const [rows]: any = await pool.query(
      `SELECT setting_key, setting_value FROM system_settings 
       WHERE setting_key LIKE 'smtp_%' 
          OR setting_key LIKE 'sms_%' 
          OR setting_key LIKE 'email_%'
          OR setting_key IN ('support_email', 'support_phone')`
    );

    const map: Record<string, string> = {};
    if (Array.isArray(rows)) {
      for (const r of rows) {
        if (r.setting_key) {
          map[r.setting_key] = r.setting_value;
        }
      }
    }

    cachedSettings = map;
    cachedSettingsExpiresAt = now + 15_000; // 15 seconds cache
    return map;
  } catch (err) {
    console.error("[Notifications] Failed to load notification settings from DB:", err);
    return cachedSettings || {};
  }
}

export function invalidateNotificationSettingsCache() {
  cachedSettings = null;
  cachedSettingsExpiresAt = 0;
}

// ============================================================================
// Notification Audit Logger (persists to MySQL `notifications` table)
// ============================================================================
export async function recordNotificationLog(options: {
  recipientType: "admin" | "customer";
  recipientId?: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, any>;
}): Promise<void> {
  try {
    const pool = getDbPool();
    const id = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await pool.query(
      `INSERT INTO notifications (id, recipient_type, recipient_id, type, title, message, link, is_read, metadata, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, NOW())`,
      [
        id,
        options.recipientType,
        options.recipientId || null,
        options.type,
        options.title.slice(0, 255),
        options.message,
        options.link || null,
        options.metadata ? JSON.stringify(options.metadata) : null,
      ]
    );
  } catch (err: any) {
    console.warn("[Notifications] Failed to write notification audit entry:", err?.message || err);
  }
}

// ============================================================================
// Guard Helpers: Check if Email or SMS is actively enabled
// ============================================================================
export function isEmailActive(settings: NotificationSettings): boolean {
  if (settings.email_notifications_enabled !== "true") return false;
  if (!settings.smtp_host || !settings.smtp_host.trim()) return false;
  if (!settings.smtp_user || !settings.smtp_user.trim()) return false;
  const pass = settings.smtp_pass?.trim() || "";
  if (!pass || pass.includes("••••") || pass.length < 3) return false;
  return true;
}

export function isSmsActive(settings: NotificationSettings): boolean {
  const isEnabled =
    settings.sms_notifications_enabled === "true" || settings.sms_dispatch_enabled === "true";
  if (!isEnabled) return false;
  const sid = settings.sms_account_sid?.trim() || "";
  const token = settings.sms_auth_token?.trim() || "";
  if (!sid || sid.startsWith("AC_SAN_FURNITURE_DEMO") || sid.includes("DEMO")) return false;
  if (!token || token.includes("••••") || token.length < 8) return false;
  return true;
}

// ============================================================================
// Core Low-Level Senders
// ============================================================================
export async function sendRawEmail(options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const settings = await getNotificationSettings();
    if (!isEmailActive(settings)) {
      const reason =
        settings.email_notifications_enabled !== "true"
          ? "Email notifications are turned OFF in Admin Settings"
          : "SMTP Host, User, or Password is missing or contains placeholder mask bullets";
      return { success: false, error: reason };
    }

    const port = Number.parseInt(settings.smtp_port || "465", 10);
    const isSsl = settings.smtp_encryption?.toUpperCase() === "SSL" || port === 465;

    const transporter = nodemailer.createTransport({
      host: settings.smtp_host,
      port,
      secure: isSsl,
      auth: {
        user: settings.smtp_user,
        pass: settings.smtp_pass,
      },
      tls: {
        // Prevent silent failure on cPanel / wildcard SSL certificates
        rejectUnauthorized: false,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });

    const fromAddress = `"${settings.smtp_from_name || "SAN Furniture"}" <${
      settings.smtp_from_email || settings.smtp_user
    }>`;

    const info = await transporter.sendMail({
      from: fromAddress,
      to: options.to,
      subject: options.subject,
      text: options.text || options.subject,
      html: options.html,
    });

    await recordNotificationLog({
      recipientType: "customer",
      recipientId: options.to,
      type: "email_dispatched",
      title: options.subject,
      message: `Transactional email successfully sent to ${options.to}. MessageId: ${info.messageId || "delivered"}`,
      metadata: {
        gateway: "smtp",
        host: settings.smtp_host,
        port,
        messageId: info.messageId,
        to: options.to,
      },
    });

    return { success: true, messageId: info.messageId };
  } catch (err: any) {
    const errorMsg = err?.message || "Failed to send email via SMTP";
    console.error("[Notifications] Email dispatch failed:", errorMsg, err?.code);

    await recordNotificationLog({
      recipientType: "customer",
      recipientId: options.to,
      type: "email_failed",
      title: `Failed Email: ${options.subject}`,
      message: `SMTP dispatch error to ${options.to}: ${errorMsg}`,
      metadata: {
        gateway: "smtp",
        to: options.to,
        error: errorMsg,
        code: err?.code,
      },
    });

    return { success: false, error: errorMsg };
  }
}

export function formatUKPhone(phone: string): string | null {
  if (!phone) return null;
  const digits = phone.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) {
    return digits.length >= 10 ? digits : null;
  }
  if (digits.startsWith("0")) {
    return `+44${digits.slice(1)}`;
  }
  if (digits.startsWith("44")) {
    return `+${digits}`;
  }
  return digits.length >= 10 ? `+${digits}` : null;
}

export async function sendRawSms(options: {
  to: string;
  message: string;
}): Promise<{ success: boolean; sid?: string; error?: string }> {
  try {
    const settings = await getNotificationSettings();
    if (!isSmsActive(settings)) {
      return {
        success: false,
        error:
          "SMS gateway is not active. Please enable SMS in Admin Settings and provide a valid Twilio Account SID & Auth Token.",
      };
    }

    const formattedTo = formatUKPhone(options.to);
    if (!formattedTo) {
      return { success: false, error: `Invalid telephone number format: ${options.to}` };
    }

    const accountSid = settings.sms_account_sid!.trim();
    const authToken = settings.sms_auth_token!.trim();
    const senderId = settings.sms_sender_id?.trim() || "SANFURNITURE";

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const basicAuth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

    const params = new URLSearchParams();
    params.append("To", formattedTo);
    params.append("From", senderId);
    params.append("Body", options.message);

    const res = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
      signal: AbortSignal.timeout(10000),
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok && data.sid) {
      await recordNotificationLog({
        recipientType: "customer",
        recipientId: formattedTo,
        type: "sms_dispatched",
        title: "SMS Alert Dispatched",
        message: `SMS sent to ${formattedTo}. SID: ${data.sid}`,
        metadata: { gateway: "twilio", to: formattedTo, sid: data.sid },
      });

      return { success: true, sid: data.sid };
    }

    const failureReason = data.message || `Twilio HTTP ${res.status}`;
    await recordNotificationLog({
      recipientType: "customer",
      recipientId: formattedTo,
      type: "sms_failed",
      title: "SMS Alert Failed",
      message: `Failed to dispatch SMS to ${formattedTo}: ${failureReason}`,
      metadata: { gateway: "twilio", to: formattedTo, error: failureReason },
    });

    return { success: false, error: failureReason };
  } catch (err: any) {
    const errorMsg = err?.message || "Failed to send SMS";
    console.error("[Notifications] SMS dispatch failed:", errorMsg);

    await recordNotificationLog({
      recipientType: "customer",
      recipientId: options.to,
      type: "sms_failed",
      title: "SMS Dispatch Exception",
      message: `Error sending SMS to ${options.to}: ${errorMsg}`,
      metadata: { gateway: "twilio", to: options.to, error: errorMsg },
    });

    return { success: false, error: errorMsg };
  }
}

// ============================================================================
// Base URL Resolver
// ============================================================================
function getStorefrontUrl(): string {
  const url = process.env.NEXT_PUBLIC_STOREFRONT_URL;
  if (url && typeof url === "string" && url.trim().length > 0) {
    return url.replace(/\/+$/, "");
  }
  return "https://sanfurniture.co.uk";
}

// ============================================================================
// Luxury Responsive HTML Email Layout Wrapper
// ============================================================================
function wrapEmailHtml(title: string, bodyContent: string): string {
  const baseUrl = getStorefrontUrl();
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f7f6f2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1a2233; -webkit-font-smoothing: antialiased; }
    .container { max-width: 600px; margin: 30px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e7e2d9; box-shadow: 0 4px 20px rgba(17,24,39,0.06); }
    .header { background: linear-gradient(135deg, #0e1526 0%, #17243c 100%); padding: 32px 30px; text-align: center; }
    .logo { color: #fbf8f3; font-size: 24px; font-weight: 800; letter-spacing: 0.15em; text-transform: uppercase; margin: 0; font-family: Georgia, serif; }
    .logo-sub { color: #d4a359; font-size: 10px; font-weight: 700; letter-spacing: 0.25em; text-transform: uppercase; margin-top: 4px; }
    .content { padding: 36px 32px; font-size: 14px; line-height: 1.65; color: #2d3748; }
    .card { background-color: #fbf8f3; border: 1px solid #ede8de; border-radius: 12px; padding: 20px; margin: 24px 0; }
    .card-title { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #8c734b; font-weight: 800; margin: 0 0 10px 0; }
    .button { display: inline-block; background-color: #0e1526; color: #fbf8f3 !important; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 13px; font-weight: 700; letter-spacing: 0.05em; text-align: center; margin-top: 18px; }
    .footer { background-color: #f7f6f2; padding: 24px 30px; text-align: center; font-size: 11px; color: #718096; border-top: 1px solid #ede8de; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
    .badge-success { background-color: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; }
    .badge-cancel { background-color: #fff1f2; color: #9f1239; border: 1px solid #fecdd3; }
    .badge-gold { background-color: #fefce8; color: #854d0e; border: 1px solid #fef08a; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="logo">SAN Furniture</h1>
      <div class="logo-sub">Artisanal Living &bull; United Kingdom</div>
    </div>
    <div class="content">
      ${bodyContent}
    </div>
    <div class="footer">
      <p style="margin: 0 0 6px 0;"><strong>SAN Furniture UK Ltd</strong> &bull; Registered in England &amp; Wales</p>
      <p style="margin: 0 0 10px 0;">UK Furniture &amp; Furnishings (Fire Safety) Regulations 1988 Compliant</p>
      <p style="margin: 0; color: #a0aec0;">Questions? Contact our London Concierge at support@sanfurniture.co.uk</p>
    </div>
  </div>
</body>
</html>`;
}

// ============================================================================
// High-Level Event Dispatches (Reliably Awaited with 8s Circuit Breaker)
// ============================================================================

/**
 * 1. Customer Registration Event
 */
export async function dispatchCustomerRegistered(data: {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
}): Promise<{ emailSent?: boolean; smsSent?: boolean; error?: string }> {
  try {
    const settings = await getNotificationSettings();
    const emailOn = isEmailActive(settings);
    const smsOn = isSmsActive(settings);

    if (!emailOn && !smsOn) {
      return { emailSent: false, smsSent: false };
    }

    const baseUrl = getStorefrontUrl();
    const tasks: Promise<any>[] = [];

    if (emailOn && data.email) {
      const html = wrapEmailHtml(
        "Welcome to SAN Furniture",
        `
        <h2 style="font-size: 20px; color: #0e1526; margin-top: 0;">Welcome, ${data.firstName}!</h2>
        <p>Thank you for joining <strong>SAN Furniture</strong>. Your private customer portal is now active, granting you seamless order management, real-time white-glove GPS consignment tracking, and verified UK VAT receipts.</p>
        
        <div class="card">
          <div class="card-title">Your Member Credentials</div>
          <p style="margin: 0 0 6px 0;"><strong>Registered Email:</strong> ${data.email}</p>
          <p style="margin: 0;"><strong>Customer Care:</strong> 2-Man Delivery Concierge &amp; Room of Choice Assembly included on eligible pieces.</p>
        </div>

        <p>Every piece in our collection is strictly compliant with UK Fire Safety Regulations 1988 and crafted for discerning British homes.</p>

        <div style="text-align: center;">
          <a href="${baseUrl}/account" class="button">Visit Your Customer Portal</a>
        </div>
        `
      );

      tasks.push(
        sendRawEmail({
          to: data.email,
          subject: "Welcome to SAN Furniture — Your Account is Ready",
          html,
          text: `Welcome ${data.firstName}! Your SAN Furniture customer account is ready. Visit ${baseUrl}/account`,
        })
      );
    }

    if (smsOn && data.phone) {
      tasks.push(
        sendRawSms({
          to: data.phone,
          message: `SAN Furniture: Welcome ${data.firstName}! Your luxury UK furniture account is now active. Explore collections at ${baseUrl}`,
        })
      );
    }

    const settled = await Promise.race([
      Promise.allSettled(tasks),
      new Promise<any[]>((_, reject) =>
        setTimeout(() => reject(new Error("Notification dispatch timed out")), 8000)
      ),
    ]);

    return {
      emailSent: settled[0]?.status === "fulfilled" && settled[0].value?.success,
      smsSent: settled[1]?.status === "fulfilled" && settled[1].value?.success,
    };
  } catch (err: any) {
    console.warn("[Notifications] Registration dispatch error:", err?.message || err);
    return { error: err?.message || String(err) };
  }
}

/**
 * 2. Order Placed / Confirmed Event
 */
export async function dispatchOrderCreated(data: {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  totalPennies: number;
  subtotalPennies: number;
  vatPennies: number;
  deliveryTier: string;
  shippingAddress: string;
  items: Array<{ title: string; quantity: number; pricePennies: number; finish?: string }>;
}): Promise<{ emailSent?: boolean; smsSent?: boolean; error?: string }> {
  try {
    const settings = await getNotificationSettings();
    const emailOn = isEmailActive(settings);
    const smsOn = isSmsActive(settings);

    if (!emailOn && !smsOn) {
      return { emailSent: false, smsSent: false };
    }

    const baseUrl = getStorefrontUrl();
    const tasks: Promise<any>[] = [];

    if (emailOn && data.customerEmail) {
      const itemsHtml = (data.items || [])
        .map(
          (it) => `
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #ede8de;">
              <strong>${it.title}</strong>
              ${it.finish ? `<br><span style="font-size: 11px; color: #718096;">Finish: ${it.finish}</span>` : ""}
            </td>
            <td style="padding: 10px 12px; text-align: center; border-bottom: 1px solid #ede8de; font-family: monospace;">&times;${it.quantity}</td>
            <td style="padding: 10px 0; text-align: right; border-bottom: 1px solid #ede8de; font-weight: bold; font-family: monospace;">${formatGBP(
              it.pricePennies * it.quantity
            )}</td>
          </tr>
        `
        )
        .join("");

      const tierName =
        data.deliveryTier === "two_man_white_glove" || data.deliveryTier === "white_glove_assembly"
          ? "2-Man White Glove (Room of Choice + Assembly)"
          : data.deliveryTier === "pallet"
          ? "Pallet Curbside Delivery"
          : "Standard UK Delivery";

      const html = wrapEmailHtml(
        `Order Confirmation #${data.orderNumber}`,
        `
        <div style="margin-bottom: 20px;">
          <span class="badge badge-success">Payment Confirmed &bull; Order Received</span>
        </div>

        <h2 style="font-size: 20px; color: #0e1526; margin-top: 0;">Thank you, ${data.customerName}!</h2>
        <p>We are delighted to confirm your furniture order <strong style="font-family: monospace;">#${data.orderNumber}</strong>. Our logistics team and craftsman network are preparing your items for transit.</p>

        <div class="card">
          <div class="card-title">Order Summary</div>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            ${itemsHtml}
            <tr>
              <td colspan="2" style="padding-top: 12px; color: #718096;">Subtotal (Net):</td>
              <td style="padding-top: 12px; text-align: right; font-family: monospace;">${formatGBP(data.subtotalPennies)}</td>
            </tr>
            <tr>
              <td colspan="2" style="color: #718096;">UK 20% VAT:</td>
              <td style="text-align: right; font-family: monospace;">${formatGBP(data.vatPennies)}</td>
            </tr>
            <tr>
              <td colspan="2" style="padding: 8px 0; font-size: 15px; font-weight: bold; color: #0e1526;">Grand Total:</td>
              <td style="padding: 8px 0; text-align: right; font-size: 16px; font-weight: bold; font-family: monospace; color: #0e1526;">${formatGBP(
                data.totalPennies
              )}</td>
            </tr>
          </table>
        </div>

        <div class="card">
          <div class="card-title">Delivery &amp; Logistics</div>
          <p style="margin: 0 0 6px 0;"><strong>Delivery Service:</strong> ${tierName}</p>
          <p style="margin: 0;"><strong>Destination Address:</strong> ${data.shippingAddress}</p>
        </div>

        <div style="text-align: center;">
          <a href="${baseUrl}/account?tab=orders" class="button">Track Your Consignment</a>
        </div>
        `
      );

      tasks.push(
        sendRawEmail({
          to: data.customerEmail,
          subject: `SAN Furniture: Order #${data.orderNumber} Confirmed (${formatGBP(data.totalPennies)})`,
          html,
          text: `Thank you ${data.customerName}! Order #${data.orderNumber} for ${formatGBP(
            data.totalPennies
          )} is confirmed. Track at ${baseUrl}/account?tab=orders`,
        })
      );
    }

    if (smsOn && data.customerPhone) {
      tasks.push(
        sendRawSms({
          to: data.customerPhone,
          message: `SAN Furniture: Thank you ${data.customerName}! Order #${data.orderNumber} (${formatGBP(
            data.totalPennies
          )}) is confirmed. We will SMS you once dispatched.`,
        })
      );
    }

    const settled = await Promise.race([
      Promise.allSettled(tasks),
      new Promise<any[]>((_, reject) =>
        setTimeout(() => reject(new Error("Notification dispatch timed out")), 8000)
      ),
    ]);

    return {
      emailSent: settled[0]?.status === "fulfilled" && settled[0].value?.success,
      smsSent: settled[1]?.status === "fulfilled" && settled[1].value?.success,
    };
  } catch (err: any) {
    console.warn("[Notifications] Order created dispatch error:", err?.message || err);
    return { error: err?.message || String(err) };
  }
}

/**
 * 3. Order Status Changed Event (Dispatched / Delivered)
 */
export async function dispatchOrderStatusChanged(data: {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  newStatus: string;
  carrier?: string;
  trackingNumber?: string;
}): Promise<{ emailSent?: boolean; smsSent?: boolean; error?: string }> {
  try {
    const settings = await getNotificationSettings();
    const emailOn = isEmailActive(settings);
    const smsOn = isSmsActive(settings);

    if (!emailOn && !smsOn) {
      return { emailSent: false, smsSent: false };
    }

    const baseUrl = getStorefrontUrl();
    const isDispatched =
      data.newStatus === "dispatched" ||
      data.newStatus === "in_transit" ||
      data.newStatus === "in_transit_two_man" ||
      data.newStatus === "po_dispatched";
    const isDelivered = data.newStatus === "delivered";

    const carrierName = data.carrier || "SAN Dedicated Delivery Fleet";
    const trackingCode = data.trackingNumber || "Allocated on Route";

    const statusBadge = isDelivered
      ? '<span class="badge badge-success">Delivered &bull; Inspection Complete</span>'
      : '<span class="badge badge-gold">In Transit &bull; Dispatched</span>';

    const statusHeading = isDelivered ? "Your Furniture Has Arrived!" : "Your Order Is On Its Way!";
    const tasks: Promise<any>[] = [];

    if (emailOn && data.customerEmail) {
      const html = wrapEmailHtml(
        `Order #${data.orderNumber} Status Update`,
        `
        <div style="margin-bottom: 20px;">
          ${statusBadge}
        </div>

        <h2 style="font-size: 20px; color: #0e1526; margin-top: 0;">${statusHeading}</h2>
        <p>Dear ${data.customerName}, your furniture order <strong style="font-family: monospace;">#${data.orderNumber}</strong> status has been updated to <strong>${data.newStatus.replace(/_/g, " ").toUpperCase()}</strong>.</p>

        <div class="card">
          <div class="card-title">Consignment &amp; Carrier Information</div>
          <p style="margin: 0 0 6px 0;"><strong>Logistics Carrier:</strong> ${carrierName}</p>
          <p style="margin: 0 0 6px 0;"><strong>Consignment Tracking Code:</strong> <span style="font-family: monospace; font-weight: bold;">${trackingCode}</span></p>
          <p style="margin: 0;"><strong>Service Tier:</strong> Dedicated UK Furniture Logistics</p>
        </div>

        <div style="text-align: center;">
          <a href="${baseUrl}/account?tab=orders" class="button">View Real-Time Tracking</a>
        </div>
        `
      );

      tasks.push(
        sendRawEmail({
          to: data.customerEmail,
          subject: `SAN Furniture: Order #${data.orderNumber} — ${isDelivered ? "Delivered" : "Dispatched"}`,
          html,
          text: `SAN Furniture: Order #${data.orderNumber} is now ${data.newStatus}. Carrier: ${carrierName}, Tracking: ${trackingCode}. Track at ${baseUrl}/account?tab=orders`,
        })
      );
    }

    if (smsOn && data.customerPhone) {
      const smsText = isDelivered
        ? `SAN Furniture: Order #${data.orderNumber} has been delivered. Thank you for choosing SAN Furniture.`
        : `SAN Furniture: Order #${data.orderNumber} is now dispatched with ${carrierName}. Tracking: ${trackingCode}.`;

      tasks.push(
        sendRawSms({
          to: data.customerPhone,
          message: smsText,
        })
      );
    }

    const settled = await Promise.race([
      Promise.allSettled(tasks),
      new Promise<any[]>((_, reject) =>
        setTimeout(() => reject(new Error("Notification dispatch timed out")), 8000)
      ),
    ]);

    return {
      emailSent: settled[0]?.status === "fulfilled" && settled[0].value?.success,
      smsSent: settled[1]?.status === "fulfilled" && settled[1].value?.success,
    };
  } catch (err: any) {
    console.warn("[Notifications] Status update dispatch error:", err?.message || err);
    return { error: err?.message || String(err) };
  }
}

/**
 * 4. Order Cancelled & Refund Event
 */
export async function dispatchOrderCancelled(data: {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  totalPennies?: number;
  reason?: string;
  cancelledBy?: string;
}): Promise<{ emailSent?: boolean; smsSent?: boolean; error?: string }> {
  try {
    const settings = await getNotificationSettings();
    const emailOn = isEmailActive(settings);
    const smsOn = isSmsActive(settings);

    if (!emailOn && !smsOn) {
      return { emailSent: false, smsSent: false };
    }

    const reasonText = data.reason || "Customer requested cancellation before courier dispatch";
    const cancelledByText = data.cancelledBy || "Customer";
    const refundAmountFormatted = data.totalPennies ? formatGBP(data.totalPennies) : "100% Full Payment";
    const tasks: Promise<any>[] = [];

    if (emailOn && data.customerEmail) {
      const html = wrapEmailHtml(
        `Order #${data.orderNumber} Cancelled`,
        `
        <div style="margin-bottom: 20px;">
          <span class="badge badge-cancel">Order Cancelled &bull; 100% Refund Scheduled</span>
        </div>

        <h2 style="font-size: 20px; color: #0e1526; margin-top: 0;">Cancellation Confirmation</h2>
        <p>Dear ${data.customerName}, this email confirms that order <strong style="font-family: monospace;">#${data.orderNumber}</strong> has been cancelled.</p>

        <div class="card">
          <div class="card-title">Cancellation &amp; Refund Audit</div>
          <p style="margin: 0 0 6px 0;"><strong>Cancelled By:</strong> ${cancelledByText}</p>
          <p style="margin: 0 0 6px 0;"><strong>Recorded Reason:</strong> &ldquo;${reasonText}&rdquo;</p>
          <p style="margin: 0 0 6px 0;"><strong>Refund Amount:</strong> <span style="font-family: monospace; font-weight: bold; color: #065f46;">${refundAmountFormatted}</span></p>
          <p style="margin: 0; font-size: 12px; color: #718096;">Refunds are processed back to your original payment method within 3-5 business days depending on your bank.</p>
        </div>

        <p>If you have any questions or require assistance with alternative selections, our London team is at your disposal.</p>
        `
      );

      tasks.push(
        sendRawEmail({
          to: data.customerEmail,
          subject: `SAN Furniture: Order #${data.orderNumber} Cancellation & Full Refund Confirmation`,
          html,
          text: `SAN Furniture: Order #${data.orderNumber} has been cancelled (${reasonText}). A 100% full refund (${refundAmountFormatted}) has been scheduled.`,
        })
      );
    }

    if (smsOn && data.customerPhone) {
      tasks.push(
        sendRawSms({
          to: data.customerPhone,
          message: `SAN Furniture: Order #${data.orderNumber} has been cancelled. A 100% refund is scheduled to your payment card within 3-5 business days.`,
        })
      );
    }

    const settled = await Promise.race([
      Promise.allSettled(tasks),
      new Promise<any[]>((_, reject) =>
        setTimeout(() => reject(new Error("Notification dispatch timed out")), 8000)
      ),
    ]);

    return {
      emailSent: settled[0]?.status === "fulfilled" && settled[0].value?.success,
      smsSent: settled[1]?.status === "fulfilled" && settled[1].value?.success,
    };
  } catch (err: any) {
    console.warn("[Notifications] Cancel dispatch error:", err?.message || err);
    return { error: err?.message || String(err) };
  }
}
