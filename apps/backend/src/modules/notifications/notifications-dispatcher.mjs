import nodemailer from "nodemailer";
import { formatGBP } from "@san-furniture/types";

// ============================================================================
// Notification Settings Cache (15s TTL)
// ============================================================================
let cachedSettings = null;
let cachedSettingsExpiresAt = 0;

export async function getNotificationSettings(pool, forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && cachedSettings && now < cachedSettingsExpiresAt) {
    return cachedSettings;
  }

  try {
    const [rows] = await pool.query(
      `SELECT setting_key, setting_value FROM system_settings 
       WHERE setting_key LIKE 'smtp_%' 
          OR setting_key LIKE 'sms_%' 
          OR setting_key LIKE 'email_%'
          OR setting_key IN ('support_email', 'support_phone')`
    );

    const map = {};
    if (Array.isArray(rows)) {
      for (const r of rows) {
        if (r.setting_key) {
          map[r.setting_key] = r.setting_value;
        }
      }
    }

    cachedSettings = map;
    cachedSettingsExpiresAt = now + 15_000;
    return map;
  } catch (err) {
    console.error("[Backend Notifications] Failed to load notification settings:", err.message);
    return cachedSettings || {};
  }
}

export function invalidateNotificationSettingsCache() {
  cachedSettings = null;
  cachedSettingsExpiresAt = 0;
}

// ============================================================================
// Audit Logger (MySQL `notifications` table)
// ============================================================================
export async function recordNotificationLog(pool, options) {
  try {
    const id = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await pool.query(
      `INSERT INTO notifications (id, recipient_type, recipient_id, type, title, message, link, is_read, metadata, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, NOW())`,
      [
        id,
        options.recipientType || "customer",
        options.recipientId || null,
        options.type,
        (options.title || "").slice(0, 255),
        options.message || "",
        options.link || null,
        options.metadata ? JSON.stringify(options.metadata) : null,
      ]
    );
  } catch (err) {
    console.warn("[Backend Notifications] Failed to write notification audit entry:", err.message);
  }
}

// ============================================================================
// Guard Helpers
// ============================================================================
export function isEmailActive(settings) {
  if (settings.email_notifications_enabled !== "true") return false;
  if (!settings.smtp_host || !settings.smtp_host.trim()) return false;
  if (!settings.smtp_user || !settings.smtp_user.trim()) return false;
  const pass = settings.smtp_pass?.trim() || "";
  if (!pass || pass.includes("••••") || pass.length < 3) return false;
  return true;
}

export function isSmsActive(settings) {
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
// Low-Level Senders
// ============================================================================
export async function sendRawEmail(pool, options) {
  try {
    const settings = await getNotificationSettings(pool);
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

    await recordNotificationLog(pool, {
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
  } catch (err) {
    const errorMsg = err.message || "Failed to send email via SMTP";
    console.error("[Backend Notifications] Email dispatch failed:", errorMsg, err.code);

    await recordNotificationLog(pool, {
      recipientType: "customer",
      recipientId: options.to,
      type: "email_failed",
      title: `Failed Email: ${options.subject}`,
      message: `SMTP dispatch error to ${options.to}: ${errorMsg}`,
      metadata: { gateway: "smtp", to: options.to, error: errorMsg, code: err.code },
    });

    return { success: false, error: errorMsg };
  }
}

export function formatUKPhone(phone) {
  if (!phone) return null;
  const digits = String(phone).replace(/[^\d+]/g, "");
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

export async function sendRawSms(pool, options) {
  try {
    const settings = await getNotificationSettings(pool);
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

    const accountSid = settings.sms_account_sid.trim();
    const authToken = settings.sms_auth_token.trim();
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
      await recordNotificationLog(pool, {
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
    await recordNotificationLog(pool, {
      recipientType: "customer",
      recipientId: formattedTo,
      type: "sms_failed",
      title: "SMS Alert Failed",
      message: `Failed to dispatch SMS to ${formattedTo}: ${failureReason}`,
      metadata: { gateway: "twilio", to: formattedTo, error: failureReason },
    });

    return { success: false, error: failureReason };
  } catch (err) {
    const errorMsg = err.message || "Failed to send SMS";
    console.error("[Backend Notifications] SMS dispatch failed:", errorMsg);

    await recordNotificationLog(pool, {
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
// HTML Email Wrapper
// ============================================================================
function wrapEmailHtml(title, bodyContent) {
  const baseUrl = process.env.NEXT_PUBLIC_STOREFRONT_URL || "https://sanfurniture.co.uk";
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
// Event Dispatches
// ============================================================================

export async function dispatchOrderStatusChanged(pool, data) {
  try {
    const settings = await getNotificationSettings(pool);
    const emailOn = isEmailActive(settings);
    const smsOn = isSmsActive(settings);

    if (!emailOn && !smsOn) return { emailSent: false, smsSent: false };

    const baseUrl = process.env.NEXT_PUBLIC_STOREFRONT_URL || "https://sanfurniture.co.uk";
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
    const tasks = [];

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
        sendRawEmail(pool, {
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
        sendRawSms(pool, {
          to: data.customerPhone,
          message: smsText,
        })
      );
    }

    const settled = await Promise.race([
      Promise.allSettled(tasks),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Notification dispatch timed out")), 8000)
      ),
    ]);

    return {
      emailSent: settled[0]?.status === "fulfilled" && settled[0].value?.success,
      smsSent: settled[1]?.status === "fulfilled" && settled[1].value?.success,
    };
  } catch (err) {
    console.warn("[Backend Notifications] Status update dispatch error:", err.message);
    return { error: err.message };
  }
}

export async function dispatchOrderCancelled(pool, data) {
  try {
    const settings = await getNotificationSettings(pool);
    const emailOn = isEmailActive(settings);
    const smsOn = isSmsActive(settings);

    if (!emailOn && !smsOn) return { emailSent: false, smsSent: false };

    const baseUrl = process.env.NEXT_PUBLIC_STOREFRONT_URL || "https://sanfurniture.co.uk";
    const reasonText = data.reason || "Customer requested cancellation before courier dispatch";
    const cancelledByText = data.cancelledBy || "Customer Support";
    const refundAmountFormatted = data.totalPennies ? formatGBP(data.totalPennies) : "100% Full Payment";
    const tasks = [];

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
        sendRawEmail(pool, {
          to: data.customerEmail,
          subject: `SAN Furniture: Order #${data.orderNumber} Cancellation & Full Refund Confirmation`,
          html,
          text: `SAN Furniture: Order #${data.orderNumber} has been cancelled (${reasonText}). A 100% full refund (${refundAmountFormatted}) has been scheduled.`,
        })
      );
    }

    if (smsOn && data.customerPhone) {
      tasks.push(
        sendRawSms(pool, {
          to: data.customerPhone,
          message: `SAN Furniture: Order #${data.orderNumber} has been cancelled. A 100% refund is scheduled to your payment card within 3-5 business days.`,
        })
      );
    }

    const settled = await Promise.race([
      Promise.allSettled(tasks),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Notification dispatch timed out")), 8000)
      ),
    ]);

    return {
      emailSent: settled[0]?.status === "fulfilled" && settled[0].value?.success,
      smsSent: settled[1]?.status === "fulfilled" && settled[1].value?.success,
    };
  } catch (err) {
    console.warn("[Backend Notifications] Cancel dispatch error:", err.message);
    return { error: err.message };
  }
}
