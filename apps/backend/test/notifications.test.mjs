import { test } from "node:test";
import assert from "node:assert/strict";
import mysql from "mysql2/promise";
import nodemailer from "nodemailer";
import {
  getNotificationSettings,
  invalidateNotificationSettingsCache,
  isEmailActive,
  isSmsActive,
  formatUKPhone,
  recordNotificationLog,
} from "../src/modules/notifications/notifications-dispatcher.mjs";

const pool = mysql.createPool({
  host: "127.0.0.1",
  port: 3306,
  user: "root",
  password: "",
  database: "san_furniture",
  waitForConnections: true,
  connectionLimit: 5,
});

test("Notification System: Evaluates isEmailActive and isSmsActive guards accurately", () => {
  // Test Email Active Guard
  assert.equal(
    isEmailActive({
      email_notifications_enabled: "false",
      smtp_host: "sanfurniture.com",
      smtp_user: "no-reply@sanfurniture.com",
      smtp_pass: "Ulfa@#2188",
    }),
    false,
    "Should be false when email_notifications_enabled is false"
  );

  assert.equal(
    isEmailActive({
      email_notifications_enabled: "true",
      smtp_host: "sanfurniture.com",
      smtp_user: "no-reply@sanfurniture.com",
      smtp_pass: "••••••••••••••••",
    }),
    false,
    "Should reject placeholder mask bullets"
  );

  assert.equal(
    isEmailActive({
      email_notifications_enabled: "true",
      smtp_host: "sanfurniture.com",
      smtp_user: "no-reply@sanfurniture.com",
      smtp_pass: "Ulfa@#2188",
    }),
    true,
    "Should be true for valid SMTP configuration"
  );

  // Test SMS Active Guard
  assert.equal(
    isSmsActive({
      sms_notifications_enabled: "false",
      sms_dispatch_enabled: "false",
      sms_account_sid: "AC_LIVE_123",
      sms_auth_token: "secret_token_12345",
    }),
    false,
    "Should be false when SMS disabled"
  );

  assert.equal(
    isSmsActive({
      sms_notifications_enabled: "true",
      sms_account_sid: "AC_SAN_FURNITURE_DEMO",
      sms_auth_token: "secret_token_12345",
    }),
    false,
    "Should reject DEMO account SID"
  );

  assert.equal(
    isSmsActive({
      sms_notifications_enabled: "true",
      sms_account_sid: "AC_SAN_FURNITURE_LIVE_001",
      sms_auth_token: "••••••••••••••••••••••••",
    }),
    false,
    "Should reject mask bullets in auth token"
  );

  assert.equal(
    isSmsActive({
      sms_notifications_enabled: "true",
      sms_account_sid: "AC_SAN_FURNITURE_LIVE_001",
      sms_auth_token: "valid_twilio_auth_token_99988",
    }),
    true,
    "Should be true for valid Twilio credentials"
  );
});

test("Notification System: Formats UK phone numbers into international E.164 format", () => {
  assert.equal(formatUKPhone("07700 900123"), "+447700900123");
  assert.equal(formatUKPhone("+447700900123"), "+447700900123");
  assert.equal(formatUKPhone("02079460192"), "+442079460192");
  assert.equal(formatUKPhone("447700900123"), "+447700900123");
  assert.equal(formatUKPhone("invalid"), null);
});

test("Notification System: Loads persisted settings from MySQL and verifies SMTP connectivity", async () => {
  invalidateNotificationSettingsCache();
  const settings = await getNotificationSettings(pool, true);
  assert.ok(settings, "Settings should load from MySQL");
  assert.equal(settings.email_notifications_enabled, "true");
  assert.ok(settings.smtp_host, "SMTP host must be set");
  assert.ok(settings.smtp_user, "SMTP user must be set");

  // Verify real live SMTP handshake with configured server
  const transporter = nodemailer.createTransport({
    host: settings.smtp_host,
    port: Number.parseInt(settings.smtp_port || "465", 10),
    secure: settings.smtp_port === "465",
    auth: {
      user: settings.smtp_user,
      pass: settings.smtp_pass,
    },
    tls: { rejectUnauthorized: false },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
  });

  const verified = await transporter.verify();
  assert.equal(verified, true, "SMTP transport must verify successfully with sanfurniture.com");
});

test("Notification System: Records delivery audit logs in MySQL notifications table", async () => {
  const testEmail = `audit_test_${Date.now()}@example.com`;
  await recordNotificationLog(pool, {
    recipientType: "customer",
    recipientId: testEmail,
    type: "email_dispatched",
    title: "Order #SAN-2026-TEST Confirmed",
    message: `Test delivery audit log to ${testEmail}`,
    metadata: { test: true },
  });

  const [rows] = await pool.query(
    "SELECT * FROM notifications WHERE recipient_id = ? ORDER BY created_at DESC LIMIT 1",
    [testEmail]
  );

  assert.equal(rows.length, 1, "Must find recorded notification in MySQL");
  assert.equal(rows[0].title, "Order #SAN-2026-TEST Confirmed");

  // Cleanup test row
  await pool.query("DELETE FROM notifications WHERE recipient_id = ?", [testEmail]);
  await pool.end();
});
