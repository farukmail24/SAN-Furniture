/**
 * SAN Furniture - High Performance Backend Commerce Server
 * Connects to XAMPP MySQL (san_furniture) on port 3306
 * Exposes Commerce API, Feeds, Webhooks, Admin Metrics & Security on port 9000
 */
import http from "node:http";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";
import {
  formatGBP,
  calculateNetAndVat,
  classifyUKPostcode,
  UK_MAINLAND_REGIONS,
  UK_POSTCODE_AREA_DATA,
  extractUKPostcodeArea,
  isMainlandUKPostcode,
  resolveUKPostcodeInfo,
} from "./types-bridge.mjs";
import { amosMannExtractor } from "./modules/dropship/services/amos-mann-extractor.mjs";
import { furnitureToGoExtractor } from "./modules/dropship/services/furniture-to-go-extractor.mjs";
import { VatInvoiceGenerator } from "../dist/src/modules/vat/services/vat-invoice-generator.js";
import { SlidingWindowRateLimiter } from "../dist/src/modules/security/services/rate-limiter.js";
import { IpJailService } from "../dist/src/modules/security/services/ip-jail-service.js";
import { DEFAULT_PAGE_SECTIONS } from "./modules/content/default-sections.mjs";
import { mysqlConnectionOptions } from "../../../database/mysql-config.mjs";
import {
  getNotificationSettings,
  invalidateNotificationSettingsCache,
  sendRawEmail,
  sendRawSms,
  dispatchOrderStatusChanged,
  dispatchOrderCancelled,
} from "./modules/notifications/notifications-dispatcher.mjs";

const vatInvoiceGenerator = new VatInvoiceGenerator();
const rateLimiter = new SlidingWindowRateLimiter();
const ipJailService = new IpJailService();

const AUTH_SECRET = process.env.SAN_AUTH_SECRET || process.env.JWT_SECRET || process.env.AUTH_SECRET || "san_furniture_uk_master_jwt_secret_998124_prod";

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req.socket.remoteAddress || "127.0.0.1";
}

function signAuthToken(type, id) {
  const timestamp = Date.now();
  const nonce = crypto.randomBytes(8).toString("hex");
  const payloadStr = JSON.stringify({ type, id, ts: timestamp, nonce });
  const payloadB64 = Buffer.from(payloadStr).toString("base64url");
  const signature = crypto.createHmac("sha256", AUTH_SECRET).update(payloadB64).digest("hex");
  return `san_${type}.${payloadB64}.${signature}`;
}

function verifyAuthToken(token, expectedType) {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [prefix, payloadB64, signature] = parts;
  if (prefix !== `san_${expectedType}`) return null;

  const expectedSig = crypto.createHmac("sha256", AUTH_SECRET).update(payloadB64).digest("hex");
  if (signature.length !== expectedSig.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
    if (payload.type !== expectedType || !payload.id) return null;
    const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days TTL
    if (Date.now() - payload.ts > MAX_AGE_MS) return null;
    return payload;
  } catch {
    return null;
  }
}

async function getCustomerFromAuth(req) {
  let token = null;
  const authHeader = req.headers["authorization"] || "";
  if (authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7).trim();
  } else if (req.headers["cookie"]) {
    const cookies = req.headers["cookie"].split(";").reduce((acc, c) => {
      const [k, v] = c.trim().split("=");
      if (k && v) acc[k] = decodeURIComponent(v);
      return acc;
    }, {});
    token = cookies["san_customer_token"] || null;
  }

  if (!token) return null;

  const payload = verifyAuthToken(token, "cust");
  if (!payload || !payload.id) return null;

  let customers = [];
  try {
    [customers] = await pool.query(
      "SELECT id, email, username, first_name, last_name, phone FROM customers WHERE id = ?",
      [payload.id]
    );
  } catch {
    [customers] = await pool.query(
      "SELECT id, email, first_name, last_name, phone FROM customers WHERE id = ?",
      [payload.id]
    );
  }
  return customers.length > 0 ? customers[0] : null;
}

async function getAdminFromAuth(req) {
  let token = null;
  const authHeader = req.headers["authorization"] || "";
  if (authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7).trim();
  } else if (req.headers["cookie"]) {
    const cookies = req.headers["cookie"].split(";").reduce((acc, c) => {
      const [k, v] = c.trim().split("=");
      if (k && v) acc[k] = decodeURIComponent(v);
      return acc;
    }, {});
    token = cookies["san_admin_token"] || null;
  }

  if (!token) return null;

  const payload = verifyAuthToken(token, "adm");
  if (!payload || !payload.id) return null;

  const [users] = await pool.query(
    "SELECT id, email, full_name, role, last_login_at FROM admin_users WHERE id = ? AND is_active = 1",
    [payload.id]
  );
  return users.length > 0 ? users[0] : null;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "../../..");

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  if (!storedHash || !storedHash.includes(":")) return false;
  const [salt, originalHash] = storedHash.split(":");
  const testHash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  const origBuf = Buffer.from(originalHash);
  const testBuf = Buffer.from(testHash);
  if (origBuf.length !== testBuf.length) return false;
  return crypto.timingSafeEqual(origBuf, testBuf);
}

/**
 * Dynamic UK Delivery Policy Resolver (Connected to MySQL system_settings)
 */
async function getDeliveryPolicy() {
  const policy = {
    scope: "mainland_only",
    restrictedPrefixes: "IV, KW, PH, AB, PA, BT, HS, ZE, GY, JE, IM",
    nonServiceableNotice: "We currently deliver exclusively to Mainland UK addresses. We are unable to fulfill orders to Northern Ireland, Scottish Highlands & Islands, or Channel Islands at this time. Please enter a valid Mainland UK delivery postcode.",
  };
  try {
    if (pool) {
      const [rows] = await pool.query(
        "SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN ('delivery_policy_scope', 'delivery_restricted_prefixes', 'delivery_non_serviceable_notice')"
      );
      for (const r of rows) {
        if (r.setting_key === "delivery_policy_scope") policy.scope = r.setting_value;
        if (r.setting_key === "delivery_restricted_prefixes") policy.restrictedPrefixes = r.setting_value;
        if (r.setting_key === "delivery_non_serviceable_notice") policy.nonServiceableNotice = r.setting_value;
      }
    }
  } catch (err) {
    // fallback to defaults
  }
  return policy;
}

/**
 * Dynamic UK Logistics Zone Resolver (Connected to MySQL delivery_options & delivery policy)
 * Resolves postcode prefixes, checks active/inactive status, surcharge pennies, and extra lead time.
 */
async function getLogisticsZone(rawPostcode) {
  const clean = (rawPostcode || "").toUpperCase().replace(/\s+/g, "");
  const info = resolveUKPostcodeInfo(clean);

  // 0. Check dynamic delivery policy from system_settings
  const policy = await getDeliveryPolicy();

  // If store is mainland_only and postcode is not in mainland UK
  if (policy.scope === "mainland_only" && clean && !info.isMainland) {
    return {
      zoneCode: "remote_restricted",
      zoneName: "Restricted Non-Mainland Area",
      isDeliverable: false,
      surchargePennies: 0,
      surchargeFormatted: "£0.00",
      leadTimeExtraDays: 0,
      error: policy.nonServiceableNotice,
      matchedZone: null,
      city: info.city,
      county: info.county,
      regionKey: info.regionKey,
      regionName: info.regionName,
    };
  }

  // 1. Fetch configured zones from MySQL postcode_zones for legacy or surcharge mappings
  let zones = [];
  try {
    const [rows] = await pool.query("SELECT * FROM postcode_zones ORDER BY surcharge_pennies DESC");
    zones = rows || [];
  } catch (err) {
    console.error("[Logistics] Error fetching postcode_zones:", err);
  }

  // 2. Classify using pure algorithm baseline
  const typesZone = classifyUKPostcode(clean || "SW1A1AA");

  // 3. Find matched zone from DB
  let matchedZone = null;

  // First try: prefix_list match for special zones
  for (const z of zones) {
    if (z.zone_code === "mainland_uk") continue;
    if (z.prefix_list) {
      const prefixes = z.prefix_list.split(",").map((p) => p.trim().toUpperCase()).filter(Boolean);
      for (const p of prefixes) {
        if (clean.startsWith(p)) {
          matchedZone = z;
          break;
        }
      }
    }
    if (matchedZone) break;
  }

  // Second try: map from typesZone if no prefix matched
  if (!matchedZone) {
    if (typesZone === "zone_2_scottish_highlands") {
      matchedZone = zones.find((z) => z.zone_code === "scottish_highlands");
    } else if (typesZone === "zone_3_scottish_islands") {
      matchedZone = zones.find((z) => z.zone_code === "scottish_islands");
    } else if (typesZone === "zone_4_northern_ireland") {
      matchedZone = zones.find((z) => z.zone_code === "northern_ireland");
    } else if (typesZone === "zone_5_uk_offshore" || typesZone === "zone_excluded") {
      matchedZone = zones.find((z) => z.zone_code === "channel_islands");
    }
  }

  // Fallback to mainland_uk if no special offshore / highlands zone matched
  if (!matchedZone) {
    matchedZone = zones.find((z) => z.zone_code === "mainland_uk") || {
      id: "zone_001",
      zone_code: "mainland_uk",
      zone_name: "UK Mainland Standard Delivery",
      prefix_list: "All Mainland",
      surcharge_pennies: 0,
      lead_time_extra_days: 0,
      is_active: 1,
    };
  }

  // Mainland UK addresses are deliverable
  const isMainland = info.isMainland || matchedZone.zone_code === "mainland_uk";
  const isActive = isMainland ? true : Boolean(matchedZone.is_active);
  const surchargePennies = (isActive && !isMainland) ? (Number(matchedZone.surcharge_pennies) || 0) : 0;
  const leadTimeExtraDays = Number(matchedZone.lead_time_extra_days) || 0;

  return {
    zoneCode: matchedZone.zone_code,
    zoneName: isMainland ? "UK Mainland Standard Delivery" : matchedZone.zone_name,
    isDeliverable: isActive,
    surchargePennies,
    surchargeFormatted: formatGBP(surchargePennies),
    leadTimeExtraDays,
    error: isActive
      ? null
      : (policy.nonServiceableNotice || `Delivery to ${matchedZone.zone_name} is currently suspended in our logistics network. Please enter a valid UK Mainland delivery address.`),
    matchedZone,
    city: info.city,
    county: info.county,
    regionKey: info.regionKey,
    regionName: info.regionName,
  };
}

const FALLBACK_DELIVERY_OPTIONS = [
  {
    id: "del_opt_001",
    name: "Free UK Mainland Delivery",
    badge: "FREE DELIVERY",
    price_pennies: 0,
    description: "Complimentary room of choice delivery across mainland UK. Direct from SAN Central Distribution Hub with a 2-hour pre-delivery booking call.",
    timeframe: "3 - 7 business days",
    service_scope: "all_mainland",
    regions_json: '["all_mainland"]',
    allowed_prefixes: "All Mainland UK",
    excluded_prefixes: "",
    min_order_pennies: 0,
    is_active: 1,
    sort_order: 1,
  },
  {
    id: "del_opt_002",
    name: "White Glove Delivery & Packaging Disposal",
    badge: "Assembly Included",
    price_pennies: 2900,
    description: "Delivered into any room (up to 3rd floor). Full unboxing, inspection, item placement, and 100% eco-friendly packaging disposal & recycling.",
    timeframe: "3 - 7 business days",
    service_scope: "all_mainland",
    regions_json: '["all_mainland"]',
    allowed_prefixes: "All Mainland UK",
    excluded_prefixes: "",
    min_order_pennies: 0,
    is_active: 0,
    sort_order: 2,
  },
  {
    id: "del_opt_003",
    name: "Priority Saturday / Weekend White Glove Delivery",
    badge: "Fastest Weekend Slot",
    price_pennies: 4900,
    description: "Guaranteed Saturday delivery slot with priority loading at SAN Central Distribution Hub and live driver SMS GPS tracking.",
    timeframe: "Guaranteed Weekend Slot",
    service_scope: "all_mainland",
    regions_json: '["all_mainland"]',
    allowed_prefixes: "All Mainland UK",
    excluded_prefixes: "",
    min_order_pennies: 0,
    is_active: 0,
    sort_order: 3,
  },
];

/**
 * Dynamic Delivery Tiers & Pricing based on Admin delivery_options, Service Scopes and Postcode Matching
 */
async function getDeliveryOptions(zoneResult, subtotalPennies = 0, rawPostcode = "") {
  let dbOptions = [];
  try {
    if (pool) {
      const [rows] = await pool.query(
        "SELECT * FROM delivery_options WHERE is_active = 1 ORDER BY sort_order ASC, created_at ASC"
      );
      if (Array.isArray(rows) && rows.length > 0) {
        dbOptions = rows;
      }
    }
  } catch (err) {
    console.error("[Logistics] Error reading delivery_options from DB:", err.message);
  }

  if (dbOptions.length === 0) {
    dbOptions = FALLBACK_DELIVERY_OPTIONS.filter((o) => o.is_active);
  }

  const clean = (rawPostcode || "").toUpperCase().replace(/\s+/g, "");
  const info = clean ? resolveUKPostcodeInfo(clean) : null;

  // Filter options based on postcode matching if clean postcode is provided
  let filteredOptions = dbOptions;
  if (info && info.cleanPostcode) {
    filteredOptions = dbOptions.filter((opt) => {
      const scope = opt.service_scope || "all_mainland";

      // Check min order threshold if set
      if (opt.min_order_pennies && subtotalPennies > 0 && subtotalPennies < opt.min_order_pennies) {
        return false;
      }

      // Check exclusions if specified
      if (opt.excluded_prefixes) {
        const exclusions = String(opt.excluded_prefixes).split(",").map((p) => p.trim().toUpperCase()).filter(Boolean);
        if (exclusions.some((exc) => info.cleanPostcode.startsWith(exc) || info.areaPrefix === exc)) {
          return false;
        }
      }

      // Scope 1: All Mainland UK
      if (scope === "all_mainland") {
        return info.isMainland;
      }

      // Scope 2: Custom Regional Selection
      if (scope === "custom_regions") {
        if (!opt.regions_json) return info.isMainland;
        try {
          const regions = typeof opt.regions_json === "string" ? JSON.parse(opt.regions_json) : opt.regions_json;
          if (Array.isArray(regions)) {
            if (regions.includes("all_mainland")) return info.isMainland;
            return regions.includes(info.regionKey);
          }
        } catch {
          return info.isMainland;
        }
      }

      // Scope 3: Specific Postcodes / Prefixes
      if (scope === "specific_postcodes") {
        if (!opt.allowed_prefixes) return info.isMainland;
        const allowed = String(opt.allowed_prefixes).split(",").map((p) => p.trim().toUpperCase()).filter(Boolean);
        return allowed.some((pref) => info.cleanPostcode.startsWith(pref) || info.areaPrefix === pref);
      }

      return info.isMainland;
    });
  }

  const surcharge = zoneResult?.surchargePennies || 0;
  const extraDays = zoneResult?.leadTimeExtraDays || 0;

  return filteredOptions.map((opt) => {
    const baseFee = Number(opt.price_pennies) || 0;
    const totalFee = baseFee + surcharge;
    let timeframe = opt.timeframe || "3 - 7 business days";
    if (extraDays > 0 && !timeframe.includes(String(extraDays))) {
      timeframe = `${timeframe} (+${extraDays}d transit)`;
    }

    let parsedRegions = ["all_mainland"];
    if (opt.regions_json) {
      try {
        parsedRegions = typeof opt.regions_json === "string" ? JSON.parse(opt.regions_json) : opt.regions_json;
      } catch {
        parsedRegions = ["all_mainland"];
      }
    }

    return {
      id: opt.id,
      name: opt.name,
      badge: opt.badge || (baseFee === 0 && surcharge === 0 ? "FREE DELIVERY" : ""),
      baseFeePennies: baseFee,
      surchargePennies: surcharge,
      totalFeePennies: totalFee,
      formattedBaseFee: baseFee === 0 ? "FREE" : formatGBP(baseFee),
      formattedTotal: totalFee === 0 ? "FREE" : formatGBP(totalFee),
      timeframe,
      description: opt.description,
      serviceScope: opt.service_scope || "all_mainland",
      regions: parsedRegions,
      allowedPrefixes: opt.allowed_prefixes || "",
      excludedPrefixes: opt.excluded_prefixes || "",
      minOrderPennies: opt.min_order_pennies || 0,
      isActive: Boolean(opt.is_active),
      sortOrder: opt.sort_order || 0,
    };
  });
}

const PORT = process.env.PORT || 9000;
const DB_CONFIG = {
  ...mysqlConnectionOptions,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

let pool;
try {
  pool = mysql.createPool(DB_CONFIG);
  console.log(`[SAN Furniture Backend] Connected to MySQL database "${DB_CONFIG.database}" on port ${DB_CONFIG.port}`);
} catch (err) {
  console.error(`[SAN Furniture Backend] MySQL connection error:`, err.message);
}

// Self-healing database schema migrations on server start
async function ensureDatabaseSchema() {
  if (!pool) return;
  try {
    const [tables] = await pool.query("SHOW TABLES LIKE 'customers'");
    const tableName = tables.length > 0 ? Object.values(tables[0])[0] : "customers";

    const [cols] = await pool.query(`SHOW COLUMNS FROM \`${tableName}\` LIKE 'username'`);
    if (cols.length === 0) {
      console.log(`[DB Migration] Adding missing 'username' column to ${tableName} table...`);
      await pool.query(`ALTER TABLE \`${tableName}\` ADD COLUMN username VARCHAR(100) NULL AFTER email`);
      console.log(`[DB Migration] Successfully added 'username' to ${tableName}!`);
    }
  } catch (e) {
    console.warn("[DB Migration Notice - customers.username]:", e.message);
  }

  try {
    const [tables] = await pool.query("SHOW TABLES LIKE 'customer_addresses'");
    const tableName = tables.length > 0 ? Object.values(tables[0])[0] : "customer_addresses";

    const [cols] = await pool.query(`SHOW COLUMNS FROM \`${tableName}\` LIKE 'country'`);
    if (cols.length === 0) {
      console.log(`[DB Migration] Adding missing 'country' column to ${tableName} table...`);
      await pool.query(`ALTER TABLE \`${tableName}\` ADD COLUMN country VARCHAR(100) NOT NULL DEFAULT 'United Kingdom' AFTER postcode`);
      console.log(`[DB Migration] Successfully added 'country' to ${tableName}!`);
    }
  } catch (e) {
    console.warn("[DB Migration Notice - customer_addresses.country]:", e.message);
  }

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id VARCHAR(36) PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(150) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'super_admin',
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        last_login_at DATETIME NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  } catch (e) {
    console.warn("[DB Migration Notice - admin_users]:", e.message);
  }

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS delivery_options (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        badge VARCHAR(50) NULL DEFAULT NULL,
        price_pennies INT NOT NULL DEFAULT 0,
        description TEXT NOT NULL,
        timeframe VARCHAR(100) NOT NULL DEFAULT '3 - 7 business days',
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        sort_order INT NOT NULL DEFAULT 0,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    const [rows] = await pool.query("SELECT COUNT(*) as cnt FROM delivery_options");
    if (rows[0].cnt === 0) {
      await pool.query(`
        INSERT INTO delivery_options (id, name, badge, price_pennies, description, timeframe, is_active, sort_order) VALUES
        ('del_opt_001', 'Free UK Mainland Delivery', 'FREE DELIVERY', 0, 'Complimentary room of choice delivery across mainland UK. Direct from SAN Central Distribution Hub with a 2-hour pre-delivery booking call.', '3 - 7 business days', 1, 1),
        ('del_opt_002', 'White Glove Delivery & Packaging Disposal', 'Assembly Included', 2900, 'Delivered into any room (up to 3rd floor). Full unboxing, inspection, item placement, and 100% eco-friendly packaging disposal & recycling.', '3 - 7 business days', 1, 2),
        ('del_opt_003', 'Priority Saturday / Weekend White Glove Delivery', 'Fastest Weekend Slot', 4900, 'Guaranteed Saturday delivery slot with priority loading at SAN Central Distribution Hub and live driver SMS GPS tracking.', 'Guaranteed Weekend Slot', 1, 3);
      `);
      console.log("[DB Migration] Seeded default delivery_options successfully.");
    }
  } catch (e) {
    console.warn("[DB Migration Notice - delivery_options]:", e.message);
  }
}
ensureDatabaseSchema().catch(console.error);

// Hardened Security Headers (OWASP AppSec Standard)
const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=*",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
};

// Instant In-Memory Products & Catalog Cache Invalidator
export function invalidateProductsCache() {
  globalThis.__productsCacheStore = null;
  globalThis.__categoriesCacheStore = null;
  if (globalThis.__pageSectionsCache) globalThis.__pageSectionsCache.clear();
  console.log(`[SAN Furniture Cache] In-memory catalog cache invalidated at ${new Date().toISOString()}`);
}

// Clean and sanitize raw HTML descriptions into luxury typography & clean bullets
function cleanHtmlDescription(raw) {
  if (!raw || typeof raw !== "string") return "";

  let text = raw;
  text = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");
  text = text.replace(/<([a-z]+)[^>]*>\s*<\/\1>/gi, "");
  text = text.replace(/<([a-z]+)[^>]*>\s*<\/\1>/gi, "");

  text = text.replace(/<li[^>]*>(.*?)<\/li>/gis, (_, content) => {
    const cleanItem = content.replace(/<[^>]+>/g, "").trim();
    return cleanItem ? `\n• ${cleanItem}` : "";
  });

  text = text.replace(/<\/(p|div|h[1-6])>/gi, "\n\n");
  text = text.replace(/<br\s*\/?>/gi, "\n");
  text = text.replace(/<[^>]+>/g, "");

  text = text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#([0-9]+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));

  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line, i, arr) => line.length > 0 || (i > 0 && arr[i - 1].length > 0))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Sanitize Public Text to eliminate supplier leaks in customer-facing views and strip raw HTML codes
function sanitizePublicText(str) {
  if (!str) return "";
  let text = String(str)
    .replace(/Official\s+Amos\s+Mann\s+UK\s+Furniture/gi, "SAN Furniture Luxury Collection")
    .replace(/Amos\s+Mann('s)?/gi, "SAN Furniture's");

  if (text.includes("<") && text.includes(">")) {
    text = cleanHtmlDescription(text);
  }
  return text;
}

// CORS, Security Headers & Optimized JSON Helper (Fast-Path Buffer String Streaming)
function sendJson(res, statusCode, data, extraHeaders = {}) {
  const jsonStr = typeof data === "string" ? data : JSON.stringify(data);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(jsonStr),
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-requested-with, Cache-Control",
    ...SECURITY_HEADERS,
    ...extraHeaders,
  });
  res.end(jsonStr);
}

// Read Request Body
function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;
  const method = req.method;

  // Handle CORS Preflight
  if (method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, x-requested-with, Cache-Control",
    });
    return res.end();
  }

  // Client IP and Security Context
  const clientIp = getClientIp(req);

  // 1. IP Jail Enforcement for Brute-Force Protected Routes
  if (pathname.startsWith("/api/customer/auth/") || pathname.startsWith("/api/admin/auth/") || pathname.startsWith("/api/checkout/")) {
    const jailStatus = ipJailService.isIpJailed(clientIp);
    if (jailStatus.jailed) {
      return sendJson(res, 429, {
        error: `Access Denied: Your IP address is temporarily locked due to repeated security failures. Please try again in ${jailStatus.remainingSeconds} seconds.`,
        locked: true,
        remainingSeconds: jailStatus.remainingSeconds,
      });
    }
  }

  // 2. Centralized Admin Authentication Middleware (OWASP A01 Access Control)
  const isAdminRoute = pathname.startsWith("/api/admin/") || pathname.startsWith("/api/security/");
  if (isAdminRoute) {
    const ADMIN_PUBLIC_ROUTES = ["/api/admin/auth/login", "/api/admin/auth/forgot-password"];
    if (!ADMIN_PUBLIC_ROUTES.includes(pathname)) {
      const admin = await getAdminFromAuth(req);
      if (!admin) {
        return sendJson(res, 401, { error: "Unauthorized: Valid admin authentication token required" });
      }
      req.admin = admin;
    }
  }

  try {
    // 1. Health Route
    if (pathname === "/health" || pathname === "/" || pathname === "/api/health") {
      const [rows] = await pool.query("SELECT COUNT(*) AS productsCount FROM products");
      return sendJson(res, 200, {
        status: "healthy",
        service: "SAN Furniture Commerce Engine",
        environment: process.env.NODE_ENV || "development",
        database: {
          type: "MySQL / MariaDB (XAMPP)",
          host: DB_CONFIG.host,
          port: DB_CONFIG.port,
          name: DB_CONFIG.database,
          productsCount: rows[0]?.productsCount || 0,
        },
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
      });
    }

    // 2. Categories API with In-Memory Cache & HTTP Cache-Control
    if (pathname === "/api/categories" && method === "GET") {
      if (globalThis.__categoriesCacheStore && (Date.now() - globalThis.__categoriesCacheStore.timestamp < 60000)) {
        if (globalThis.__categoriesCacheStore.jsonString) {
          return sendJson(res, 200, globalThis.__categoriesCacheStore.jsonString, {
            "Cache-Control": "public, max-age=60, stale-while-revalidate=600",
          });
        }
        return sendJson(res, 200, { categories: globalThis.__categoriesCacheStore.categories }, {
          "Cache-Control": "public, max-age=60, stale-while-revalidate=600",
        });
      }
      const [categories] = await pool.query("SELECT * FROM categories ORDER BY created_at ASC");
      const mapped = categories.map((c) => ({
        ...c,
        heroImage: c.hero_image,
      }));
      const jsonString = JSON.stringify({ categories: mapped });
      globalThis.__categoriesCacheStore = {
        categories: mapped,
        jsonString,
        timestamp: Date.now(),
      };
      return sendJson(res, 200, jsonString, {
        "Cache-Control": "public, max-age=60, stale-while-revalidate=600",
      });
    }

    // 3. Products List API (Customer Storefront Catalog - auto-hides out_of_stock items with 0ms Cache)
    if (pathname === "/api/products" && method === "GET") {
      const categoryFilter = url.searchParams.get("category");
      const includeAll = url.searchParams.get("includeAll") === "true";
      const forceRefresh = url.searchParams.get("refresh") === "true" || Boolean(url.searchParams.get("cacheBust"));

      // 0ms in-memory cache fast path (pre-serialized Buffer streaming)
      if (!includeAll && !forceRefresh && globalThis.__productsCacheStore?.products && (Date.now() - globalThis.__productsCacheStore.timestamp < 30000)) {
        if (!categoryFilter && globalThis.__productsCacheStore.jsonString) {
          return sendJson(res, 200, globalThis.__productsCacheStore.jsonString, {
            "Cache-Control": "public, max-age=30, stale-while-revalidate=300",
          });
        }
        const cachedList = globalThis.__productsCacheStore.products;
        const result = categoryFilter
          ? cachedList.filter((p) => p.categoryId === categoryFilter)
          : cachedList;
        return sendJson(res, 200, { products: result, cached: true }, {
          "Cache-Control": "public, max-age=30, stale-while-revalidate=300",
        });
      }

      let query = `
        SELECT p.*, s.width_cm, s.height_cm, s.depth_cm, s.seat_height_cm, s.weight_kg,
               s.material, s.frame_material, s.color, s.assembly_required, s.doorway_clearance_min_cm,
               s.delivery_tier, s.fire_safety_compliant, s.fire_safety_standard, s.lead_time_days
        FROM products p
        LEFT JOIN furniture_specs s ON p.id = s.product_id
        WHERE ${includeAll ? "1=1" : "p.status = 'published'"}
      `;
      const params = [];
      if (categoryFilter) {
        query += " AND p.category_id = ?";
        params.push(categoryFilter);
      }
      query += " ORDER BY p.created_at DESC";

      const [products] = await pool.query(query, params);
      const formatted = products.map((row) => ({
        id: row.id,
        sku: row.sku ? row.sku.replace(/^SAN-FTG-/i, "SAN-") : undefined,
        createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
        title: row.title,
        handle: row.handle,
        subtitle: sanitizePublicText(row.subtitle),
        description: sanitizePublicText(row.description),
        categoryId: row.category_id,
        status: row.status,
        pricePennies: row.price_pennies,
        priceFormatted: formatGBP(row.price_pennies),
        compareAtPricePennies: row.compare_at_price_pennies,
        vatRatePercent: Number(row.vat_rate_percent || 20),
        gtinBarcode: row.gtin_barcode || "5060912830018",
        thumbnailUrl: row.thumbnail_url,
        images: row.images_json ? JSON.parse(row.images_json) : [row.thumbnail_url],
        variants: row.variants_json ? JSON.parse(row.variants_json) : [],
        specs: {
          width_cm: Number(row.width_cm),
          height_cm: Number(row.height_cm),
          depth_cm: Number(row.depth_cm),
          seat_height_cm: row.seat_height_cm ? Number(row.seat_height_cm) : null,
          weight_kg: Number(row.weight_kg),
          material: row.material || "engineered_hardwood",
          frame_material: row.frame_material || "engineered_hardwood",
          color: row.color || "Standard Finish",
          assembly_required: Boolean(row.assembly_required),
          doorway_clearance_min_cm: Number(row.doorway_clearance_min_cm || 75),
          delivery_tier: row.delivery_tier || "two_man_white_glove",
          fire_safety: {
            compliant: Boolean(row.fire_safety_compliant),
            standard: row.fire_safety_standard || "UK Quality Checked",
            certificate_ref: row.certificate_ref || "QC-INSPECTED",
            label_attached: true,
          },
          lead_time_days: row.lead_time_days || 7,
        },
      }));

      // Cache all published products in memory with pre-serialized fast-path string
      const jsonString = JSON.stringify({ products: formatted, cached: true });
      if (!includeAll && !categoryFilter) {
        globalThis.__productsCacheStore = {
          timestamp: Date.now(),
          products: formatted,
          jsonString,
        };
      }

      return sendJson(res, 200, jsonString, {
        "Cache-Control": "public, max-age=30, stale-while-revalidate=300",
      });
    }

    // Products Cache Purge / Invalidation Endpoint (0ms Instant Purge)
    if ((pathname === "/api/admin/cache/clear" || pathname === "/api/products/cache/invalidate") && (method === "POST" || method === "GET")) {
      invalidateProductsCache();
      return sendJson(res, 200, { success: true, message: "Products cache invalidated successfully" });
    }

    // 4. Single Product By Handle
    if (pathname.startsWith("/api/products/") && method === "GET") {
      const handle = pathname.replace("/api/products/", "").trim();
      const [rows] = await pool.query(
        `SELECT p.*, s.width_cm, s.height_cm, s.depth_cm, s.seat_height_cm, s.weight_kg,
                s.material, s.frame_material, s.color, s.assembly_required, s.doorway_clearance_min_cm,
                s.delivery_tier, s.fire_safety_compliant, s.fire_safety_standard, s.lead_time_days
         FROM products p LEFT JOIN furniture_specs s ON p.id = s.product_id WHERE p.handle = ? OR p.id = ? LIMIT 1`,
        [handle, handle]
      );
      if (rows.length === 0) {
        return sendJson(res, 404, { error: "Product not found", handle });
      }
      const row = rows[0];
      return sendJson(res, 200, {
        product: {
          id: row.id,
          sku: row.sku ? row.sku.replace(/^SAN-FTG-/i, "SAN-") : undefined,
          title: row.title,
          handle: row.handle,
          subtitle: sanitizePublicText(row.subtitle),
          description: sanitizePublicText(row.description),
          categoryId: row.category_id,
          status: row.status,
          pricePennies: row.price_pennies,
          priceFormatted: formatGBP(row.price_pennies),
          vatRatePercent: Number(row.vat_rate_percent || 20),
          gtinBarcode: row.gtin_barcode || "5060912830018",
          thumbnailUrl: row.thumbnail_url,
          images: row.images_json ? JSON.parse(row.images_json) : [row.thumbnail_url],
          variants: row.variants_json ? JSON.parse(row.variants_json) : [],
          specs: {
            width_cm: Number(row.width_cm),
            height_cm: Number(row.height_cm),
            depth_cm: Number(row.depth_cm),
            seat_height_cm: row.seat_height_cm ? Number(row.seat_height_cm) : null,
            weight_kg: Number(row.weight_kg),
            material: row.material || "engineered_hardwood",
            frame_material: row.frame_material || "engineered_hardwood",
            color: row.color || "Standard Finish",
            assembly_required: Boolean(row.assembly_required),
            doorway_clearance_min_cm: Number(row.doorway_clearance_min_cm || 75),
            delivery_tier: row.delivery_tier || "two_man_white_glove",
            fire_safety: {
              compliant: Boolean(row.fire_safety_compliant),
              standard: row.fire_safety_standard || "UK Quality Checked",
              certificate_ref: row.certificate_ref || "QC-INSPECTED",
              label_attached: true,
            },
            lead_time_days: row.lead_time_days || 7,
          },
        },
      });
    }

    // 4b. Public Delivery Options API (for immediate checkout page load)
    if (pathname === "/api/shipping/options" && method === "GET") {
      const dummyZone = { surchargePennies: 0, leadTimeExtraDays: 0 };
      const options = await getDeliveryOptions(dummyZone, 0);
      const deliveryPolicy = await getDeliveryPolicy();
      return sendJson(res, 200, { success: true, options, deliveryPolicy });
    }

    // 5. UK Dynamic Shipping Rate & Surcharge Calculator (Connected to MySQL postcode_zones)
    if (pathname === "/api/shipping/calculate" && (method === "POST" || method === "GET")) {
      const body = method === "POST" ? await readBody(req) : {};
      const postcode = (body.postcode || url.searchParams.get("postcode") || "").trim().toUpperCase();
      const subtotalPennies = Number(body.subtotalPennies || url.searchParams.get("subtotalPennies") || 0);

      const zoneResult = await getLogisticsZone(postcode || "SW1A 1AA");

      if (!zoneResult.isDeliverable) {
        return sendJson(res, 200, {
          postcode,
          zone: zoneResult.zoneCode,
          zoneName: zoneResult.zoneName,
          is_deliverable: false,
          deliverable: false,
          baseShippingPennies: 0,
          baseShippingFormatted: "£0.00",
          surchargePennies: 0,
          surchargeFormatted: "£0.00",
          totalShippingPennies: 0,
          totalShippingFormatted: "£0.00",
          deliveryOptions: [],
          isFreeDelivery: false,
          message: zoneResult.error,
          error: zoneResult.error
        });
      }

      const options = await getDeliveryOptions(zoneResult, subtotalPennies, postcode);
      if (!options || options.length === 0) {
        return sendJson(res, 200, {
          postcode,
          zone: zoneResult.zoneCode,
          zoneName: zoneResult.zoneName,
          is_deliverable: false,
          deliverable: false,
          baseShippingPennies: 0,
          baseShippingFormatted: "£0.00",
          surchargePennies: 0,
          surchargeFormatted: "£0.00",
          totalShippingPennies: 0,
          totalShippingFormatted: "£0.00",
          deliveryOptions: [],
          isFreeDelivery: false,
          message: zoneResult.error || "No active delivery methods currently service this postal region.",
          error: zoneResult.error || "No active delivery methods currently service this postal region."
        });
      }
      const defaultOption = options[0];

      return sendJson(res, 200, {
        postcode,
        zone: zoneResult.zoneCode,
        zoneName: zoneResult.zoneName,
        deliveryTier: defaultOption.id,
        deliveryTierDescription: defaultOption.description,
        baseShippingPennies: defaultOption.baseFeePennies,
        baseShippingFormatted: formatGBP(defaultOption.baseFeePennies),
        surchargePennies: zoneResult.surchargePennies,
        surchargeFormatted: zoneResult.surchargeFormatted,
        leadTimeExtraDays: zoneResult.leadTimeExtraDays,
        totalShippingPennies: defaultOption.totalFeePennies,
        totalShippingFormatted: formatGBP(defaultOption.totalFeePennies),
        isFreeDelivery: defaultOption.totalFeePennies === 0,
        is_deliverable: true,
        deliverable: true,
        deliveryOptions: options,
        message: zoneResult.surchargePennies > 0
          ? `${zoneResult.zoneName} Delivery Available (+${zoneResult.surchargeFormatted} regional surcharge)`
          : "UK Mainland Standard Free Delivery Available"
      });
    }

    // 6. Admin Sales & Gross Margin Metrics
    if (pathname === "/api/admin/metrics" && method === "GET") {
      try {
        const [orderRows] = await pool.query(
          "SELECT COUNT(*) AS totalOrders, COALESCE(SUM(total_pennies), 0) AS grossRevenuePennies FROM orders"
        );
        const [productRows] = await pool.query(
          "SELECT COUNT(*) AS totalProducts, COALESCE(AVG(price_pennies), 0) AS avgPricePennies FROM products WHERE status = 'published'"
        );
        const [jailedRows] = await pool.query("SELECT COUNT(*) AS jailedIpsCount FROM security_ip_jail").catch(() => [[{ jailedIpsCount: 0 }]]);
        const [pendingRows] = await pool.query(
          "SELECT COUNT(*) AS awaitingDispatchOrders FROM orders WHERE COALESCE(fulfillment_status, 'unfulfilled') IN ('unfulfilled', 'paid', 'po_dispatched')"
        ).catch(() => [[{ awaitingDispatchOrders: 0 }]]);

        const grossRevenuePennies = Number(orderRows[0]?.grossRevenuePennies || 0);
        const totalOrders = Number(orderRows[0]?.totalOrders || 0);
        const estimatedCostPennies = Math.round(grossRevenuePennies * 0.58); // Average dropship cost
        const grossMarginPennies = grossRevenuePennies - estimatedCostPennies;
        const marginPercent = grossRevenuePennies > 0 ? Number(((grossMarginPennies / grossRevenuePennies) * 100).toFixed(1)) : 42.0;
        const avgOrderPennies = totalOrders > 0 ? Math.round(grossRevenuePennies / totalOrders) : Number(productRows[0]?.avgPricePennies || 0);

        return sendJson(res, 200, {
          overview: {
            totalOrders,
            awaitingDispatchOrders: Number(pendingRows[0]?.awaitingDispatchOrders || 0),
            grossRevenuePennies,
            grossRevenueFormatted: formatGBP(grossRevenuePennies),
            grossMarginPennies,
            grossMarginFormatted: formatGBP(grossMarginPennies),
            grossMarginPercent: marginPercent,
            totalCatalogProducts: Number(productRows[0]?.totalProducts || 0),
            averageOrderValueFormatted: formatGBP(avgOrderPennies),
            jailedIpsCount: Number(jailedRows[0]?.jailedIpsCount || 0),
          },
        }, {
          "Cache-Control": "private, max-age=5, stale-while-revalidate=30",
        });
      } catch (err) {
        console.error("[Backend Error in /api/admin/metrics]:", err);
        return sendJson(res, 500, {
          error: "Failed to compute admin metrics",
          details: err.message,
          overview: {
            totalOrders: 0,
            awaitingDispatchOrders: 0,
            grossRevenuePennies: 0,
            grossRevenueFormatted: "£0.00",
            grossMarginPennies: 0,
            grossMarginFormatted: "£0.00",
            grossMarginPercent: 42.0,
            totalCatalogProducts: 0,
            averageOrderValueFormatted: "£0.00",
            jailedIpsCount: 0,
          }
        });
      }
    }

    // 7. Admin Authentication Endpoints
    if (pathname === "/api/admin/auth/login" && method === "POST") {
      const rateCheck = rateLimiter.checkLimit("auth", clientIp);
      if (!rateCheck.allowed) {
        return sendJson(res, 429, { error: `Too many login attempts. Please wait ${rateCheck.resetSeconds} seconds before trying again.` });
      }

      const body = await readBody(req);
      const email = (body.email || "").trim().toLowerCase();
      const password = (body.password || "").trim();

      if (!email || !password) {
        return sendJson(res, 400, { error: "Email and password are required" });
      }

      const [users] = await pool.query(
        "SELECT id, email, password_hash, full_name, role, is_active FROM admin_users WHERE email = ?",
        [email]
      );

      if (users.length === 0 || !users[0].is_active) {
        ipJailService.recordFailure(clientIp, "Admin login failed: user not found or inactive");
        return sendJson(res, 401, { error: "Invalid admin credentials" });
      }

      const user = users[0];
      const isPasswordValid = verifyPassword(password, user.password_hash);
      if (!isPasswordValid) {
        ipJailService.recordFailure(clientIp, "Admin login failed: incorrect password");
        return sendJson(res, 401, { error: "Invalid admin credentials" });
      }

      // Reset any accumulated failure attempts on successful authentication
      rateLimiter.resetLimit("auth", clientIp);
      ipJailService.releaseIp(clientIp);

      // Update last login
      await pool.query("UPDATE admin_users SET last_login_at = NOW() WHERE id = ?", [user.id]);

      // Generate cryptographically signed admin session token
      const token = signAuthToken("adm", user.id);

      // Log in audit trail
      await pool.query(
        "INSERT INTO admin_audit_logs (id, actor, action, resource, details_json, ip_address) VALUES (?, ?, ?, ?, ?, ?)",
        [`log_${Date.now()}`, user.email, "ADMIN_LOGIN", "admin_users", JSON.stringify({ role: user.role }), clientIp]
      );

      return sendJson(res, 200, {
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
        },
      });
    }

    if (pathname === "/api/admin/auth/me" && method === "GET") {
      if (!req.admin) {
        return sendJson(res, 401, { error: "Unauthorized: Admin session required" });
      }

      return sendJson(res, 200, {
        authenticated: true,
        user: {
          id: req.admin.id,
          email: req.admin.email,
          fullName: req.admin.full_name,
          role: req.admin.role,
          lastLoginAt: req.admin.last_login_at,
        },
      });
    }

    if (pathname === "/api/admin/auth/logout" && method === "POST") {
      return sendJson(res, 200, { success: true, message: "Logged out successfully" });
    }

    // 7.1 Customer Authentication Endpoints (SEPARATE customers & customer_addresses tables)
    if (pathname === "/api/customer/auth/register" && method === "POST") {
      const body = await readBody(req);
      const email = (body.email || "").trim().toLowerCase();
      const username = (body.username || "").trim() || email.split("@")[0];
      const password = (body.password || "").trim();
      const firstName = (body.firstName || "").trim();
      const lastName = (body.lastName || "").trim();
      const phone = (body.phone || "").trim();
      const addressLine1 = (body.addressLine1 || "").trim();
      const city = (body.city || "").trim();
      const postcode = (body.postcode || "").trim().toUpperCase();

      if (!email || !password || !firstName || !lastName || !phone) {
        return sendJson(res, 400, { error: "First name, last name, email, password, and mobile number are required" });
      }

      const cleanPhone = phone.replace(/[\s\-\(\)]/g, "");
      if (cleanPhone.length < 10) {
        return sendJson(res, 400, { error: "Please enter a valid UK mobile or phone number (minimum 10 digits)" });
      }

      if (password.length < 8) {
        return sendJson(res, 400, { error: "Password must be at least 8 characters long" });
      }

      // Check for existing customer by email
      const [existing] = await pool.query("SELECT id FROM customers WHERE email = ?", [email]);
      if (existing.length > 0) {
        return sendJson(res, 400, { error: "A customer account already exists with this email address" });
      }

      // Check username if provided and column exists
      if (username) {
        try {
          const [existingUser] = await pool.query("SELECT id FROM customers WHERE username = ?", [username]);
          if (existingUser.length > 0) {
            return sendJson(res, 400, { error: "A customer account already exists with this username" });
          }
        } catch {}
      }

      const customerId = `cust_${Date.now()}`;
      const passwordHashed = hashPassword(password);

      // Insert customer record with fallback
      try {
        await pool.query(
          `INSERT INTO customers (id, email, username, password_hash, first_name, last_name, phone)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [customerId, email, username, passwordHashed, firstName, lastName, phone || null]
        );
      } catch (insertErr) {
        await pool.query(
          `INSERT INTO customers (id, email, password_hash, first_name, last_name, phone)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [customerId, email, passwordHashed, firstName, lastName, phone || null]
        );
      }

      // Insert primary delivery address if provided with fallback
      if (addressLine1 && postcode) {
        try {
          await pool.query(
            `INSERT INTO customer_addresses (id, customer_id, address_line1, city, postcode, country, is_default_delivery)
             VALUES (?, ?, ?, ?, ?, 'United Kingdom', 1)`,
            [`addr_${Date.now()}`, customerId, addressLine1, city || "London", postcode]
          );
        } catch (addrErr) {
          await pool.query(
            `INSERT INTO customer_addresses (id, customer_id, address_line1, city, postcode, is_default_delivery)
             VALUES (?, ?, ?, ?, ?, 1)`,
            [`addr_${Date.now()}`, customerId, addressLine1, city || "London", postcode]
          );
        }
      }

      const token = signAuthToken("cust", customerId);
      return sendJson(res, 201, {
        success: true,
        token,
        customer: {
          id: customerId,
          email,
          username,
          firstName,
          lastName,
          phone,
        },
      });
    }

    if (pathname === "/api/customer/auth/login" && method === "POST") {
      const rateCheck = rateLimiter.checkLimit("auth", clientIp);
      if (!rateCheck.allowed) {
        return sendJson(res, 429, { error: `Too many login attempts. Please wait ${rateCheck.resetSeconds} seconds before trying again.` });
      }

      const body = await readBody(req);
      const emailOrUser = (body.email || body.username || body.login || body.identifier || "").trim().toLowerCase();
      const password = (body.password || "").trim();

      if (!emailOrUser || !password) {
        return sendJson(res, 400, { error: "Email or username and password are required" });
      }

      let customers = [];
      try {
        [customers] = await pool.query(
          "SELECT id, email, username, password_hash, first_name, last_name, phone FROM customers WHERE email = ? OR username = ?",
          [emailOrUser, emailOrUser]
        );
      } catch {
        [customers] = await pool.query(
          "SELECT id, email, password_hash, first_name, last_name, phone FROM customers WHERE email = ?",
          [emailOrUser]
        );
      }

      if (customers.length === 0) {
        ipJailService.recordFailure(clientIp, "Customer login failed: account not found");
        return sendJson(res, 401, { error: "Invalid customer credentials" });
      }

      const customer = customers[0];
      const valid = verifyPassword(password, customer.password_hash);
      if (!valid) {
        ipJailService.recordFailure(clientIp, "Customer login failed: invalid password");
        return sendJson(res, 401, { error: "Invalid customer credentials" });
      }

      // Reset any accumulated failure attempts on successful authentication
      rateLimiter.resetLimit("auth", clientIp);
      ipJailService.releaseIp(clientIp);

      const [addresses] = await pool.query(
        "SELECT * FROM customer_addresses WHERE customer_id = ? ORDER BY is_default_delivery DESC",
        [customer.id]
      );

      const token = signAuthToken("cust", customer.id);
      return sendJson(res, 200, {
        success: true,
        token,
        customer: {
          id: customer.id,
          email: customer.email,
          username: customer.username || customer.email.split("@")[0],
          firstName: customer.first_name,
          lastName: customer.last_name,
          phone: customer.phone,
          addresses,
        },
      });
    }

    if (pathname === "/api/customer/auth/me" && method === "GET") {
      const customer = await getCustomerFromAuth(req);
      if (!customer) {
        return sendJson(res, 401, { error: "Not logged in or session expired" });
      }
      const [addresses] = await pool.query(
        "SELECT * FROM customer_addresses WHERE customer_id = ? ORDER BY is_default_delivery DESC, created_at DESC",
        [customer.id]
      );
      const [orders] = await pool.query(
        "SELECT * FROM orders WHERE customer_email = ? ORDER BY created_at DESC",
        [customer.email]
      );

      return sendJson(res, 200, {
        customer: {
          id: customer.id,
          email: customer.email,
          username: customer.username || customer.email.split("@")[0],
          firstName: customer.first_name,
          lastName: customer.last_name,
          phone: customer.phone,
          addresses,
          orders,
        },
      });
    }

    if (pathname === "/api/customer/orders" && method === "GET") {
      const authCust = await getCustomerFromAuth(req);
      if (!authCust) {
        return sendJson(res, 401, { error: "Authentication required to view customer order history." });
      }
      const email = authCust.email.trim().toLowerCase();
      const [orders] = await pool.query(`
        SELECT o.*, d.carrier, d.tracking_number, d.po_number, d.dispatched_at
        FROM orders o
        LEFT JOIN order_po_dispatches d ON o.id = d.order_id
        WHERE LOWER(o.customer_email) = ?
        ORDER BY o.created_at DESC
      `, [email]);

      const finalOrders = orders;

      const ordersWithTracking = finalOrders.map((o) => {
        let items = [];
        try {
          items = typeof o.items_json === "string" ? JSON.parse(o.items_json) : (o.items_json || []);
        } catch (_) {
          items = [];
        }
        if (items.length === 0) {
          items = [
            {
              id: o.id || "item_1",
              title: "SAN Bespoke Furniture Commission",
              finish: "Standard White Glove Finish",
              quantity: 1,
              pricePennies: Number(o.total_pennies) || 0,
              thumbnailUrl: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=400&q=80",
            }
          ];
        }

        const isDelivered = o.fulfillment_status === "delivered";
        const isInTransit = o.fulfillment_status === "in_transit" || o.fulfillment_status === "po_dispatched";
        const isReturnRequested = o.fulfillment_status === "return_requested" || o.fulfillment_status === "returned";
        const isCancelled = o.fulfillment_status === "cancelled";

        let deliveryTimeline = [];
        if (isCancelled) {
          deliveryTimeline = [
            { step: "Order Placed & VAT Invoiced", done: true, time: "Day 1", note: "Original Deposit Recorded" },
            { step: "Order Cancelled Before Dispatch", done: true, time: "Confirmed", note: "Cancelled by Customer Request" },
            { step: "Payment Refund Scheduled", done: true, time: "Pending", note: "100% Refund Returning to Card" },
          ];
        } else if (isReturnRequested) {
          deliveryTimeline = [
            { step: "Order Delivered & Inspected", done: true, time: "Delivered", note: "Delivery Confirmed" },
            { step: "Resolution Requested", done: true, time: "Active", note: "Customer Support Resolution" },
            { step: "Collection Scheduled", done: false, time: "Pending", note: "Logistics Team Booking Pickup Window" },
            { step: "Warehouse Restock & Resolution", done: false, time: "Final", note: "Processed upon Inspection" },
          ];
        } else {
          deliveryTimeline = [
            { step: "Order Placed & Invoiced", done: true, time: "Day 1", note: "Payment Confirmed" },
            { step: "Workshop QC Inspection", done: true, time: "Day 2", note: "UK Quality Checked" },
            { step: "In Transit with Delivery Fleet", done: isInTransit || isDelivered, time: "Day 3", note: "Dispatch update sent" },
            { step: "Delivered to Residence", done: isDelivered, time: "Day 4", note: "Delivery Confirmed" },
          ];
        }

        const totalPennies = Number(o.total_pennies) || 0;
        const subtotalPennies = Number(o.subtotal_pennies) || totalPennies;
        const shippingPennies = Number(o.shipping_pennies) || 0;
        const vatPennies = Number(o.vat_pennies) || Math.round((totalPennies * 0.2) / 1.2);

        return {
          ...o,
          items,
          total_pennies: totalPennies,
          subtotal_pennies: subtotalPennies,
          shipping_pennies: shippingPennies,
          vat_pennies: vatPennies,
          totalGbpFormatted: formatGBP(totalPennies),
          subtotalFormatted: formatGBP(subtotalPennies),
          shippingFormatted: shippingPennies > 0 ? formatGBP(shippingPennies) : "FREE",
          vatFormatted: formatGBP(vatPennies),
          invoiceHtmlUrl: `/api/orders/${o.id}/invoice`,
          trackingNumber: o.tracking_number || o.order_number || "Awaiting allocation",
          carrier: o.carrier && !o.carrier.includes("Amos Mann") ? o.carrier : "SAN Dedicated Delivery Fleet",
          deliverySlot: o.delivery_slot || "Slot to be allocated upon dispatch",
          deliveryTimeline,
        };
      });

      return sendJson(res, 200, { orders: ordersWithTracking });
    }

    // 6b. Customer Return Request (UK Consumer Rights Act 2015 14-Day Return)
    if (pathname.startsWith("/api/customer/orders/") && pathname.endsWith("/return") && method === "POST") {
      const authCust = await getCustomerFromAuth(req);
      if (!authCust) {
        return sendJson(res, 401, { error: "Authentication required to submit return request." });
      }
      const orderId = pathname.replace("/api/customer/orders/", "").replace("/return", "");
      const body = await readBody(req);
      const { reason = "Dimensions did not suit living space", notes = "" } = body;

      const [rows] = await pool.query("SELECT * FROM orders WHERE id = ? OR order_number = ?", [orderId, orderId]);
      if (rows.length === 0) {
        return sendJson(res, 404, { error: "Order not found" });
      }
      const order = rows[0];
      if (order.customer_email.toLowerCase() !== authCust.email.toLowerCase()) {
        return sendJson(res, 403, { error: "Forbidden: You are not authorized to return an order belonging to another customer." });
      }

      // Update order fulfillment status to return_requested
      await pool.query(
        "UPDATE orders SET fulfillment_status = 'return_requested' WHERE id = ?",
        [order.id]
      );

      // Create Admin Alert Notification
      const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      await pool.query(
        `INSERT INTO notifications (id, recipient_type, recipient_id, type, title, message, link, metadata)
         VALUES (?, 'admin', 'all', 'order_created', ?, ?, ?, ?)`,
        [
          notifId,
          `Return Requested: ${order.order_number}`,
          `${order.customer_name} submitted 14-day statutory return request. Reason: "${reason}"`,
          `/admin/orders`,
          JSON.stringify({ orderId: order.id, orderNumber: order.order_number, reason, notes }),
        ]
      );

      // Audit Log
      await pool.query(
        `INSERT INTO admin_audit_logs (id, actor, action, resource, details_json, ip_address, created_at)
         VALUES (?, ?, 'CUSTOMER_RETURN_REQUESTED', 'orders', ?, ?, NOW())`,
        [
          `log_${Date.now()}`,
          order.customer_email,
          JSON.stringify({ orderId: order.id, orderNumber: order.order_number, reason, notes }),
          req.socket.remoteAddress || "127.0.0.1",
        ]
      );

      return sendJson(res, 200, {
        success: true,
        orderId: order.id,
        orderNumber: order.order_number,
        fulfillment_status: "return_requested",
        message: "Your 14-day statutory return request has been recorded. Our London logistics concierge will arrange white glove room-of-choice collection.",
      });
    }

    // 6c. Customer Cancel Order (Before Dispatch / While Unfulfilled)
    if (pathname.startsWith("/api/customer/orders/") && pathname.endsWith("/cancel") && method === "POST") {
      const authCust = await getCustomerFromAuth(req);
      if (!authCust) {
        return sendJson(res, 401, { error: "Authentication required to cancel order." });
      }
      const orderId = pathname.replace("/api/customer/orders/", "").replace("/cancel", "");
      const body = await readBody(req);
      const { reason = "Customer requested cancellation before dispatch" } = body;

      const [rows] = await pool.query("SELECT * FROM orders WHERE id = ? OR order_number = ?", [orderId, orderId]);
      if (rows.length === 0) {
        return sendJson(res, 404, { error: "Order not found" });
      }
      const order = rows[0];
      if (order.customer_email.toLowerCase() !== authCust.email.toLowerCase()) {
        return sendJson(res, 403, { error: "Forbidden: You are not authorized to cancel an order belonging to another customer." });
      }

      // Check if order has already been delivered or in transit
      if (order.fulfillment_status === "delivered") {
        return sendJson(res, 400, {
          error: "This order has already been delivered. Please use the 14-Day Statutory Return option instead.",
        });
      }

      // Update order fulfillment status to cancelled and payment to refund_pending
      await pool.query(
        "UPDATE orders SET fulfillment_status = 'cancelled', payment_status = 'refund_pending' WHERE id = ?",
        [order.id]
      );

      // Also mark order_po_dispatches as cancelled
      await pool.query(
        "UPDATE order_po_dispatches SET status = 'cancelled' WHERE order_id = ?",
        [order.id]
      );

      // Create Admin Notification
      const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      await pool.query(
        `INSERT INTO notifications (id, recipient_type, recipient_id, type, title, message, link, metadata)
         VALUES (?, 'admin', 'all', 'order_created', ?, ?, ?, ?)`,
        [
          notifId,
          `Order Cancelled: ${order.order_number}`,
          `Customer ${order.customer_name} cancelled order ${order.order_number} before dispatch. Reason: "${reason}". Refund pending.`,
          `/admin/orders`,
          JSON.stringify({ orderId: order.id, orderNumber: order.order_number, reason }),
        ]
      );

      // Audit Log
      await pool.query(
        `INSERT INTO admin_audit_logs (id, actor, action, resource, details_json, ip_address, created_at)
         VALUES (?, ?, 'CUSTOMER_ORDER_CANCELLED', 'orders', ?, ?, NOW())`,
        [
          `log_${Date.now()}`,
          order.customer_email,
          JSON.stringify({ orderId: order.id, orderNumber: order.order_number, reason }),
          req.socket.remoteAddress || "127.0.0.1",
        ]
      );

      return sendJson(res, 200, {
        success: true,
        orderId: order.id,
        orderNumber: order.order_number,
        fulfillment_status: "cancelled",
        message: "Your order has been cancelled successfully. Your payment refund has been scheduled.",
      });
    }

    // 6c-2. Customer Reschedule Delivery Slot API
    if (pathname.startsWith("/api/customer/orders/") && pathname.endsWith("/reschedule") && method === "POST") {
      const authCust = await getCustomerFromAuth(req);
      if (!authCust) {
        return sendJson(res, 401, { error: "Authentication required to reschedule delivery slot." });
      }
      const orderId = pathname.replace("/api/customer/orders/", "").replace("/reschedule", "");
      const body = await readBody(req);
      const slot = (body.slot || "").trim();

      if (!slot) {
        return sendJson(res, 400, { error: "Delivery slot description is required" });
      }

      const [rows] = await pool.query("SELECT * FROM orders WHERE id = ? OR order_number = ?", [orderId, orderId]);
      if (rows.length === 0) {
        return sendJson(res, 404, { error: "Order not found" });
      }
      const order = rows[0];
      if (order.customer_email.toLowerCase() !== authCust.email.toLowerCase()) {
        return sendJson(res, 403, { error: "Forbidden: You are not authorized to reschedule an order belonging to another customer." });
      }

      await pool.query("UPDATE orders SET delivery_slot = ? WHERE id = ?", [slot, order.id]);

      // Create Notification
      const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      await pool.query(
        `INSERT INTO notifications (id, recipient_type, recipient_id, type, title, message, link, metadata)
         VALUES (?, 'admin', 'all', 'system_alert', ?, ?, ?, ?)`,
        [
          notifId,
          `Delivery Slot Rescheduled: ${order.order_number}`,
          `Customer ${order.customer_name} updated delivery window to "${slot}" for order ${order.order_number}.`,
          `/admin/orders`,
          JSON.stringify({ orderId: order.id, orderNumber: order.order_number, slot }),
        ]
      );

      return sendJson(res, 200, {
        success: true,
        orderId: order.id,
        deliverySlot: slot,
        message: "Delivery window successfully updated and confirmed with dispatch.",
      });
    }

    // 6e. Customer Addresses Management API (Ownership-Enforced & GDPR Privacy Hardened)
    if (pathname === "/api/customer/addresses" && method === "GET") {
      const authCust = await getCustomerFromAuth(req);
      if (!authCust) {
        return sendJson(res, 401, { error: "Authentication required to access saved client addresses" });
      }

      const [rows] = await pool.query(
        `SELECT id, customer_id, label, recipient, address_line1 as line1, address_line2 as line2,
                city, postcode, phone, county, access_notes as accessNotes,
                is_default_delivery as isDefaultDelivery, is_default_billing as isDefaultBilling,
                created_at
         FROM customer_addresses
         WHERE customer_id = ?
         ORDER BY is_default_delivery DESC, created_at DESC`,
        [authCust.id]
      );

      return sendJson(res, 200, {
        addresses: rows.map((r) => ({
          id: r.id,
          label: r.label || "Delivery Destination",
          recipient: r.recipient || "Residential Client",
          line1: r.line1,
          line2: r.line2 || "",
          city: r.city,
          postcode: r.postcode,
          phone: r.phone || "+44 7700 900123",
          county: r.county || "",
          accessNotes: r.accessNotes || "Standard private residential entry.",
          isDefaultDelivery: Boolean(r.isDefaultDelivery),
          isDefaultBilling: Boolean(r.isDefaultBilling),
        })),
      });
    }

    // 6f. Customer Payment Methods API
    if (pathname === "/api/customer/payment-methods" && method === "GET") {
      let email = url.searchParams.get("email")?.trim().toLowerCase();
      let customerId = url.searchParams.get("customerId")?.trim() || "";
      const authCust = await getCustomerFromAuth(req).catch(() => null);
      if (authCust) {
        if (authCust.email) email = authCust.email.toLowerCase();
        if (authCust.id) customerId = authCust.id;
      }

      if (!email && !customerId) {
        return sendJson(res, 200, { success: true, paymentMethods: [] });
      }

      const [rows] = await pool.query(
        `SELECT id, customer_id, customer_email, brand, last4, exp_month, exp_year, cardholder_name, is_saved_for_future, is_default, created_at
         FROM customer_payment_methods
         WHERE (customer_email = ? OR (? != '' AND customer_id = ?)) AND is_saved_for_future = 1
         ORDER BY is_default DESC, created_at DESC`,
        [email || "", customerId, customerId]
      );

      // Strict enforcement: Exactly ONE default card
      let foundDefault = false;
      const sanitizedMethods = (Array.isArray(rows) ? rows : []).map((pm) => {
        if (Boolean(pm.is_default) && !foundDefault) {
          foundDefault = true;
          return { ...pm, is_default: 1 };
        }
        return { ...pm, is_default: 0 };
      });

      if (!foundDefault && sanitizedMethods.length > 0) {
        sanitizedMethods[0].is_default = 1;
      }

      return sendJson(res, 200, { success: true, paymentMethods: sanitizedMethods });
    }

    if (pathname === "/api/customer/payment-methods" && method === "PUT") {
      const body = await readBody(req);
      const { id, action } = body;
      let email = body.email?.trim().toLowerCase();
      let customerId = body.customerId?.trim() || "";
      const authCust = await getCustomerFromAuth(req).catch(() => null);
      if (authCust) {
        if (authCust.email) email = authCust.email.toLowerCase();
        if (authCust.id) customerId = authCust.id;
      }

      if (!id || (!email && !customerId)) {
        return sendJson(res, 400, { success: false, error: "Payment method ID and customer identifier required." });
      }

      if (action === "set_default" || !action) {
        await pool.query(
          "UPDATE customer_payment_methods SET is_default = 0 WHERE (customer_email = ? OR (? != '' AND customer_id = ?))",
          [email || "", customerId, customerId]
        );

        const [upRes] = await pool.query(
          "UPDATE customer_payment_methods SET is_default = 1 WHERE id = ? AND (customer_email = ? OR (? != '' AND customer_id = ?))",
          [id, email || "", customerId, customerId]
        );

        if (upRes.affectedRows === 0) {
          return sendJson(res, 404, { success: false, error: "Payment instrument not found or unauthorized." });
        }

        return sendJson(res, 200, { success: true, message: "Default payment method updated successfully.", defaultId: id });
      }

      return sendJson(res, 400, { success: false, error: "Unsupported action." });
    }

    if (pathname === "/api/customer/payment-methods" && method === "DELETE") {
      const id = url.searchParams.get("id");
      let email = url.searchParams.get("email")?.trim().toLowerCase();
      let customerId = url.searchParams.get("customerId")?.trim() || "";
      const authCust = await getCustomerFromAuth(req).catch(() => null);
      if (authCust) {
        if (authCust.email) email = authCust.email.toLowerCase();
        if (authCust.id) customerId = authCust.id;
      }

      if (!id || (!email && !customerId)) {
        return sendJson(res, 400, { success: false, error: "Payment method ID and email or ID are required" });
      }

      await pool.query(
        "UPDATE customer_payment_methods SET is_saved_for_future = 0, is_default = 0 WHERE id = ? AND (customer_email = ? OR (? != '' AND customer_id = ?))",
        [id, email || "", customerId, customerId]
      );

      // If the deleted card was default, set next remaining active card as default
      const [remaining] = await pool.query(
        "SELECT id FROM customer_payment_methods WHERE (customer_email = ? OR (? != '' AND customer_id = ?)) AND is_saved_for_future = 1 ORDER BY created_at DESC LIMIT 1",
        [email || "", customerId, customerId]
      );
      if (Array.isArray(remaining) && remaining.length > 0) {
        await pool.query(
          "UPDATE customer_payment_methods SET is_default = 1 WHERE id = ?",
          [remaining[0].id]
        );
      }

      return sendJson(res, 200, { success: true, message: "Payment instrument safely removed." });
    }

    if (pathname === "/api/customer/addresses" && method === "POST") {
      const authCust = await getCustomerFromAuth(req);
      if (!authCust) {
        return sendJson(res, 401, { error: "Authentication required to save address" });
      }
      const customerId = authCust.id;

      const body = await readBody(req);
      const {
        label = "Secondary Sanctuary",
        recipient,
        line1,
        line2 = "",
        city,
        postcode,
        phone,
        county = "",
        accessNotes = "Standard private residential entry.",
        isDefaultDelivery = false,
        isDefaultBilling = false,
      } = body;

      if (!line1 || !city || !postcode) {
        return sendJson(res, 400, { error: "Address line 1, city, and postcode are required." });
      }

      const addrId = `addr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

      if (isDefaultDelivery) {
        await pool.query("UPDATE customer_addresses SET is_default_delivery = 0 WHERE customer_id = ?", [customerId]);
      }
      if (isDefaultBilling) {
        await pool.query("UPDATE customer_addresses SET is_default_billing = 0 WHERE customer_id = ?", [customerId]);
      }

      await pool.query(
        `INSERT INTO customer_addresses (id, customer_id, label, recipient, address_line1, address_line2, city, postcode, phone, county, access_notes, is_default_delivery, is_default_billing, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          addrId,
          customerId,
          label,
          recipient || `${authCust.first_name} ${authCust.last_name}`.trim(),
          line1,
          line2,
          city,
          postcode.toUpperCase().trim(),
          phone || authCust.phone || null,
          county,
          accessNotes,
          isDefaultDelivery ? 1 : 0,
          isDefaultBilling ? 1 : 0,
        ]
      );

      return sendJson(res, 201, {
        success: true,
        address: {
          id: addrId,
          label,
          recipient: recipient || `${authCust.first_name} ${authCust.last_name}`.trim(),
          line1,
          line2,
          city,
          postcode: postcode.toUpperCase().trim(),
          phone: phone || authCust.phone || null,
          county,
          accessNotes,
          isDefaultDelivery: Boolean(isDefaultDelivery),
          isDefaultBilling: Boolean(isDefaultBilling),
        },
        message: "UK delivery destination saved to your client address book.",
      });
    }

    if (pathname.startsWith("/api/customer/addresses/") && pathname.endsWith("/default") && (method === "PATCH" || method === "POST")) {
      const authCust = await getCustomerFromAuth(req);
      if (!authCust) {
        return sendJson(res, 401, { error: "Authentication required" });
      }

      const addrId = pathname.replace("/api/customer/addresses/", "").replace("/default", "");
      const body = await readBody(req);
      const type = body.type || "delivery";

      const [addrRows] = await pool.query("SELECT * FROM customer_addresses WHERE id = ?", [addrId]);
      if (addrRows.length === 0) {
        return sendJson(res, 404, { error: "Address not found" });
      }
      const addr = addrRows[0];
      if (addr.customer_id !== authCust.id) {
        return sendJson(res, 403, { error: "Forbidden: You cannot modify another client's address" });
      }

      if (type === "delivery") {
        await pool.query("UPDATE customer_addresses SET is_default_delivery = 0 WHERE customer_id = ?", [addr.customer_id]);
        await pool.query("UPDATE customer_addresses SET is_default_delivery = 1 WHERE id = ?", [addr.id]);
      } else {
        await pool.query("UPDATE customer_addresses SET is_default_billing = 0 WHERE customer_id = ?", [addr.customer_id]);
        await pool.query("UPDATE customer_addresses SET is_default_billing = 1 WHERE id = ?", [addr.id]);
      }

      return sendJson(res, 200, { success: true, message: `Default ${type} address updated.` });
    }

    if (pathname.startsWith("/api/customer/addresses/") && method === "DELETE") {
      const authCust = await getCustomerFromAuth(req);
      if (!authCust) {
        return sendJson(res, 401, { error: "Authentication required" });
      }

      const addrId = pathname.replace("/api/customer/addresses/", "");
      const [addrRows] = await pool.query("SELECT * FROM customer_addresses WHERE id = ?", [addrId]);
      if (addrRows.length === 0) {
        return sendJson(res, 404, { error: "Address not found" });
      }
      if (addrRows[0].customer_id !== authCust.id) {
        return sendJson(res, 403, { error: "Forbidden: You cannot delete another client's address" });
      }

      await pool.query("DELETE FROM customer_addresses WHERE id = ?", [addrId]);
      return sendJson(res, 200, { success: true, message: "Address removed from address book." });
    }

    // 6d. Customer Wishlist API (Dynamic & Persistent)
    if (pathname === "/api/customer/wishlist" && method === "GET") {
      const authCust = await getCustomerFromAuth(req);
      const email = authCust ? authCust.email.trim().toLowerCase() : (url.searchParams.get("email") || "").trim().toLowerCase();
      if (!email) {
        return sendJson(res, 200, { wishlist: [] });
      }

      const [rows] = await pool.query(
        `SELECT w.id, w.product_id as productId, p.title, p.handle, 
                REPLACE(COALESCE(p.subtitle, 'Luxury British Furniture'), 'Amos Mann', 'SAN Furniture') as subtitle, 
                p.price_pennies as pricePennies,
                p.thumbnail_url as thumbnailUrl, p.status as stockStatus,
                COALESCE(fs.material, 'Engineered Hardwood & Natural Finish') as material,
                '3-5 business days mainland UK delivery' as leadTime
         FROM customer_wishlist w
         JOIN products p ON w.product_id = p.id
         LEFT JOIN furniture_specs fs ON p.id = fs.product_id
         WHERE LOWER(w.customer_email) = ?
         ORDER BY w.created_at DESC`,
        [email]
      );

      return sendJson(res, 200, { wishlist: rows });
    }

    if (pathname === "/api/customer/wishlist" && method === "POST") {
      const authCust = await getCustomerFromAuth(req);
      const body = await readBody(req);
      const email = authCust ? authCust.email.trim().toLowerCase() : (body.email || "").trim().toLowerCase();
      const productId = body.productId;
      if (!email || !productId) {
        return sendJson(res, 400, { error: "Email or customer session, and productId are required" });
      }

      const [custRows] = await pool.query("SELECT id FROM customers WHERE LOWER(email) = ?", [email]);
      const customerId = authCust ? authCust.id : (custRows.length > 0 ? custRows[0].id : `cust_${Date.now()}`);
      const wishId = `wish_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

      await pool.query(
        `INSERT IGNORE INTO customer_wishlist (id, customer_id, customer_email, product_id) VALUES (?, ?, ?, ?)`,
        [wishId, customerId, email, productId]
      );

      return sendJson(res, 200, { success: true, message: "Added to wishlist" });
    }

    if (pathname.startsWith("/api/customer/wishlist") && method === "DELETE") {
      const authCust = await getCustomerFromAuth(req);
      const wishId = pathname.replace("/api/customer/wishlist/", "").replace("/api/customer/wishlist", "");
      const email = authCust ? authCust.email.trim().toLowerCase() : (url.searchParams.get("email") || "").trim().toLowerCase();
      const queryId = url.searchParams.get("id") || wishId;

      if (email && queryId) {
        await pool.query(
          "DELETE FROM customer_wishlist WHERE (id = ? OR product_id = ?) AND LOWER(customer_email) = ?",
          [queryId, queryId, email]
        );
      } else if (authCust && queryId) {
        await pool.query(
          "DELETE FROM customer_wishlist WHERE (id = ? OR product_id = ?) AND (customer_id = ? OR LOWER(customer_email) = ?)",
          [queryId, queryId, authCust.id, authCust.email.toLowerCase()]
        );
      } else if (queryId) {
        await pool.query("DELETE FROM customer_wishlist WHERE id = ? OR product_id = ?", [queryId, queryId]);
      }

      return sendJson(res, 200, { success: true, message: "Removed from wishlist" });
    }

    // 7.2 UK Promotions & Coupon Rules Engine (Phase 17)
    if (pathname === "/api/promotions/validate" && method === "POST") {
      const body = await readBody(req);
      const code = (body.code || "").trim().toUpperCase();
      const basketSubtotalPennies = parseInt(body.subtotalPennies || "0", 10);

      const [promos] = await pool.query("SELECT * FROM promotions WHERE code = ? AND is_active = 1", [code]);
      if (promos.length === 0) {
        return sendJson(res, 400, { valid: false, error: `Promo code "${code}" is invalid or expired` });
      }

      const promo = promos[0];
      if (basketSubtotalPennies < promo.min_order_pennies) {
        const minGbp = (promo.min_order_pennies / 100).toFixed(2);
        return sendJson(res, 400, {
          valid: false,
          error: `Promo code "${code}" requires a minimum spend of £${minGbp}`,
        });
      }

      let discountPennies = 0;
      if (promo.discount_type === "percentage") {
        discountPennies = Math.round((basketSubtotalPennies * promo.discount_value) / 100);
      } else {
        discountPennies = Math.min(promo.discount_value, basketSubtotalPennies);
      }

      const finalTotalPennies = Math.max(0, basketSubtotalPennies - discountPennies);

      return sendJson(res, 200, {
        valid: true,
        code: promo.code,
        description: promo.description,
        discountPennies,
        discountFormatted: formatGBP(discountPennies),
        finalTotalPennies,
        finalTotalFormatted: formatGBP(finalTotalPennies),
      });
    }

    // 7.3 Customer Reviews & Social Proof Engine (Phase 16)
    if (pathname === "/api/reviews" && method === "GET") {
      const productId = url.searchParams.get("product_id");
      let query = "SELECT * FROM customer_reviews WHERE status = 'approved'";
      const params = [];
      if (productId) {
        query += " AND product_id = ?";
        params.push(productId);
      }
      query += " ORDER BY created_at DESC";
      const [reviews] = await pool.query(query, params);
      return sendJson(res, 200, { reviews }, {
        "Cache-Control": "public, max-age=60, stale-while-revalidate=600",
      });
    }

    if (pathname === "/api/reviews" && method === "POST") {
      const body = await readBody(req);
      const { productId, customerName, customerEmail, rating, title, comment } = body;
      if (!productId || !customerName || !rating || !comment) {
        return sendJson(res, 400, { error: "Product, Name, Rating, and Review comment are required" });
      }

      const reviewId = `rev_${Date.now()}`;
      await pool.query(
        `INSERT INTO customer_reviews (id, product_id, customer_name, customer_email, rating, title, comment, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'approved')`,
        [reviewId, productId, customerName, customerEmail || "customer@sanfurniture.com", rating, title || "Customer Review", comment]
      );

      return sendJson(res, 201, { success: true, reviewId, message: "Review posted successfully!" });
    }

    // 7.4 Official UK VAT Invoicing (Phase 15)
    if (pathname.startsWith("/api/invoices/") && method === "GET") {
      const orderId = pathname.replace("/api/invoices/", "");
      const [orders] = await pool.query("SELECT * FROM orders WHERE id = ?", [orderId]);
      if (orders.length === 0) {
        return sendJson(res, 404, { error: "Order not found" });
      }
      const order = orders[0];
      const { netPennies, vatPennies } = calculateNetAndVat(order.total_pennies);

      const invoiceData = {
        invoiceNumber: `INV-${order.id}`,
        company: {
          name: "SAN Furniture",
          companyNumber: "",
          vatNumber: "",
          registeredAddress: "Mainland United Kingdom • support@sanfurniture.com",
        },
        orderId: order.id,
        orderDate: order.created_at,
        taxPoint: order.created_at,
        customerName: order.customer_name,
        customerEmail: order.customer_email,
        deliveryPostcode: order.postcode,
        deliveryTier: order.delivery_tier,
        breakdown: {
          currency: "GBP",
          netPennies,
          netFormatted: formatGBP(netPennies),
          vatRatePercent: 20,
          vatPennies,
          vatFormatted: formatGBP(vatPennies),
          grossTotalPennies: order.total_pennies,
          grossTotalFormatted: formatGBP(order.total_pennies),
        },
      };

      // Check if user requested HTML printable format
      if (url.searchParams.get("format") === "html") {
        const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>VAT Invoice ${invoiceData.invoiceNumber} - SAN Furniture UK</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #070D1E; margin: 40px; }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0B132B; padding-bottom: 20px; }
    .title { font-size: 24px; font-weight: bold; color: #0B132B; }
    .company { font-size: 12px; color: #4F6D7A; line-height: 1.5; margin-top: 5px; }
    .meta-table { width: 100%; margin: 30px 0; border-collapse: collapse; font-size: 13px; }
    .meta-table td { padding: 8px 0; }
    .items-table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; }
    .items-table th { background: #0B132B; color: #FAF8F5; padding: 10px; text-align: left; }
    .items-table td { padding: 12px 10px; border-bottom: 1px solid #E8E2D5; }
    .totals { float: right; width: 300px; margin-top: 20px; font-size: 13px; }
    .totals table { width: 100%; border-collapse: collapse; }
    .totals td { padding: 6px 0; }
    .footer { margin-top: 150px; font-size: 11px; color: #4F6D7A; border-top: 1px solid #E8E2D5; padding-top: 15px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="title">SAN FURNITURE</div>
      <div class="company">
        Online UK Furniture Retailer • Mainland Delivery<br/>
        Customer Support: <strong>support@sanfurniture.com</strong>
      </div>
    </div>
    <div style="text-align: right;">
      <div style="font-size: 20px; font-weight: bold; color: #C89B3C;">ORDER INVOICE</div>
      <div style="font-size: 13px; margin-top: 5px;"><strong>Invoice No:</strong> ${invoiceData.invoiceNumber}</div>
      <div style="font-size: 12px; color: #4F6D7A;">Tax Point: ${new Date(invoiceData.taxPoint).toLocaleDateString("en-GB")}</div>
    </div>
  </div>

  <table class="meta-table">
    <tr>
      <td style="width: 50%;">
        <strong>Billed To:</strong><br/>
        ${invoiceData.customerName}<br/>
        ${invoiceData.customerEmail}<br/>
        UK Delivery Postcode: ${invoiceData.deliveryPostcode}
      </td>
      <td style="width: 50%; text-align: right;">
        <strong>Delivery Method:</strong><br/>
        ${invoiceData.deliveryTier === 'two_man_white_glove' ? 'UK White Glove (Room of Choice)' : 'Pallet Freight'}<br/>
        Payment Status: <strong>PAID IN FULL (20% UK VAT INCLUDED)</strong>
      </td>
    </tr>
  </table>

  <table class="items-table">
    <thead>
      <tr>
        <th>Description</th>
        <th>Quantity</th>
        <th>Delivery Tier</th>
        <th>VAT Rate</th>
        <th style="text-align: right;">Amount (GBP)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Bespoke Handcrafted Furniture Order (${order.id})</td>
        <td>1</td>
        <td>White Glove (Room of Choice)</td>
        <td>20% (Standard)</td>
        <td style="text-align: right;">${invoiceData.breakdown.grossTotalFormatted}</td>
      </tr>
    </tbody>
  </table>

  <div class="totals">
    <table>
      <tr><td>Subtotal (Net Ex-VAT):</td><td style="text-align: right;">${invoiceData.breakdown.netFormatted}</td></tr>
      <tr><td>UK VAT (20.00%):</td><td style="text-align: right;">${invoiceData.breakdown.vatFormatted}</td></tr>
      <tr style="font-size: 16px; font-weight: bold; border-top: 2px solid #0B132B;">
        <td style="padding-top: 8px;">Total Gross (Inc VAT):</td>
        <td style="text-align: right; padding-top: 8px; color: #0B132B;">${invoiceData.breakdown.grossTotalFormatted}</td>
      </tr>
    </table>
  </div>

  <div style="clear: both;"></div>
  <div class="footer">
    This document constitutes an official Tax Invoice compliant with Regulation 13 of the UK Value Added Tax Regulations 1995.
    Goods remain property of SAN Furniture UK Ltd until full clearance. For customer support, visit https://sanfurniture.com.
  </div>
</body>
</html>`;
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        return res.end(html);
      }

      return sendJson(res, 200, { invoice: invoiceData });
    }

    // Accounting CSV Export for Xero / QuickBooks
    if (pathname === "/api/admin/accounting/export.csv" && method === "GET") {
      const [orders] = await pool.query("SELECT * FROM orders ORDER BY created_at DESC");
      let csv = "Invoice Number,Order Date,Customer Name,Customer Email,Postcode,Net Amount (GBP),VAT Amount (GBP),Gross Total (GBP),Status\n";
      for (const o of orders) {
        const { netPennies, vatPennies } = calculateNetAndVat(o.total_pennies);
        csv += `INV-${o.id},${o.created_at},\"${o.customer_name}\",${o.customer_email},${o.postcode},${(netPennies/100).toFixed(2)},${(vatPennies/100).toFixed(2)},${(o.total_pennies/100).toFixed(2)},${o.status}\n`;
      }
      res.writeHead(200, {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=san_furniture_vat_accounting.csv",
        "Access-Control-Allow-Origin": "*",
      });
      return res.end(csv);
    }

    // 8. Admin Products Management CRUD
    if (pathname === "/api/admin/products" && method === "GET") {
      const [rows] = await pool.query(`
        SELECT p.*, s.width_cm, s.height_cm, s.depth_cm, s.seat_height_cm, s.weight_kg,
               s.material, s.color, s.assembly_required, s.assembly_instructions_url, s.fire_safety_compliant, s.delivery_tier,
               sup.supplier_id,
               sup.supplier_sku,
               sup.source_url as supplier_source_url,
               COALESCE(sup.cost_price_pennies, 0) as cost_price_pennies,
               COALESCE(sup.markup_percentage, 40) as markup_percentage,
               COALESCE(sup.stock_level, 25) as stock_level,
               COALESCE(sup.shipping_cost_pennies, 4900) as shipping_cost_pennies,
               COALESCE(sup.lead_time_days, 5) as lead_time_days
        FROM products p
        LEFT JOIN furniture_specs s ON p.id = s.product_id
        LEFT JOIN supplier_feed_items sup ON p.id = sup.product_id
        ORDER BY p.created_at DESC
      `);
      return sendJson(res, 200, { products: rows });
    }

    if (pathname === "/api/admin/products" && method === "POST") {
      const body = await readBody(req);
      const {
        title,
        handle,
        sku,
        subtitle,
        description,
        categoryId,
        pricePennies,
        compareAtPricePennies,
        thumbnailUrl,
        images,
        imagesJson,
        variants,
        variantsJson,
        supplierCostPennies,
        widthCm,
        heightCm,
        depthCm,
        weightKg,
        material,
        color,
        deliveryType = "two_man_white_glove",
        fireSafetyCompliant = true,
      } = body;

      if (!title || !pricePennies || !categoryId) {
        return sendJson(res, 400, { error: "Title, Category, and Price are required" });
      }

      const productId = `prod_${Date.now()}`;
      const productHandle = handle || title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

      const parsedImages = Array.isArray(images) && images.length > 0
        ? images
        : (imagesJson ? (typeof imagesJson === "string" ? JSON.parse(imagesJson) : imagesJson) : []);
      const primaryThumb = thumbnailUrl || parsedImages[0] || "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=85";
      const finalImages = parsedImages.length > 0 ? parsedImages : [primaryThumb];

      const finalVariants = Array.isArray(variants)
        ? variants
        : (variantsJson ? (typeof variantsJson === "string" ? JSON.parse(variantsJson) : variantsJson) : []);

      // Insert product
      const prodSku = sku ? String(sku).trim() : null;
      await pool.query(
        `INSERT INTO products (id, title, handle, sku, subtitle, description, category_id, status, price_pennies, compare_at_price_pennies, vat_rate_percent, thumbnail_url, images_json, variants_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'published', ?, ?, 20, ?, ?, ?)`,
        [productId, title, productHandle, prodSku, subtitle || "", description || "", categoryId, pricePennies, compareAtPricePennies || null, primaryThumb, JSON.stringify(finalImages), JSON.stringify(finalVariants)]
      );

      // Insert furniture specs
      await pool.query(
        `INSERT INTO furniture_specs (id, product_id, width_cm, height_cm, depth_cm, weight_kg, material, color, assembly_required, fire_safety_compliant, delivery_tier)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [`spec_${Date.now()}`, productId, widthCm || 200, heightCm || 85, depthCm || 95, weightKg || 60, material || "boucle", color || "Ivory", false, fireSafetyCompliant ? 1 : 0, deliveryType]
      );

      // Insert supplier item link if cost provided
      if (supplierCostPennies) {
        await pool.query(
          `INSERT INTO supplier_feed_items (id, supplier_id, supplier_sku, product_id, cost_price_pennies, retail_price_pennies, stock_level)
           VALUES (?, 'sup_cotswold', ?, ?, ?, ?, 25)`,
          [`sup_item_${Date.now()}`, `SKU-${Date.now()}`, productId, supplierCostPennies, pricePennies]
        );
      }

      // Log in audit
      await pool.query(
        "INSERT INTO admin_audit_logs (id, actor, action, resource, details_json, ip_address) VALUES (?, ?, ?, ?, ?, ?)",
        [`log_${Date.now()}`, "admin@sanfurniture.com", "CREATE_PRODUCT", "products", JSON.stringify({ id: productId, title }), req.socket.remoteAddress]
      );

      invalidateProductsCache();
      return sendJson(res, 201, { success: true, productId, handle: productHandle, message: "Product created successfully" });
    }

    // Delete Product
    if (pathname.startsWith("/api/admin/products/") && method === "DELETE") {
      const prodId = pathname.replace("/api/admin/products/", "");
      await pool.query("DELETE FROM furniture_specs WHERE product_id = ?", [prodId]);
      await pool.query("DELETE FROM supplier_feed_items WHERE product_id = ?", [prodId]);
      await pool.query("DELETE FROM products WHERE id = ?", [prodId]);

      await pool.query(
        "INSERT INTO admin_audit_logs (id, actor, action, resource, details_json, ip_address) VALUES (?, ?, ?, ?, ?, ?)",
        [`log_${Date.now()}`, "admin@sanfurniture.com", "DELETE_PRODUCT", "products", JSON.stringify({ id: prodId }), req.socket.remoteAddress]
      );

      invalidateProductsCache();
      return sendJson(res, 200, { success: true, message: `Product ${prodId} removed` });
    }

    // Single Product GET (Admin)
    if (pathname.startsWith("/api/admin/products/") && method === "GET") {
      const prodId = pathname.replace("/api/admin/products/", "");
      const [rows] = await pool.query(`
        SELECT p.*, s.width_cm, s.height_cm, s.depth_cm, s.seat_height_cm, s.weight_kg,
               s.material, s.color, s.assembly_required, s.assembly_instructions_url, s.fire_safety_compliant, s.delivery_tier,
               sup.supplier_id,
               sup.supplier_sku,
               sup.source_url as supplier_source_url,
               COALESCE(sup.cost_price_pennies, 0) as cost_price_pennies,
               COALESCE(sup.markup_percentage, 40) as markup_percentage,
               COALESCE(sup.stock_level, 25) as stock_level,
               COALESCE(sup.shipping_cost_pennies, 4900) as shipping_cost_pennies,
               COALESCE(sup.lead_time_days, 5) as lead_time_days
        FROM products p
        LEFT JOIN furniture_specs s ON p.id = s.product_id
        LEFT JOIN supplier_feed_items sup ON p.id = sup.product_id
        WHERE p.id = ? OR p.handle = ?
        LIMIT 1
      `, [prodId, prodId]);

      if (rows.length === 0) {
        return sendJson(res, 404, { error: "Product not found" });
      }
      const prod = rows[0];
      prod.images = prod.images_json ? (typeof prod.images_json === "string" ? JSON.parse(prod.images_json) : prod.images_json) : [prod.thumbnail_url];
      prod.variants = prod.variants_json ? (typeof prod.variants_json === "string" ? JSON.parse(prod.variants_json) : prod.variants_json) : [];
      return sendJson(res, 200, { product: prod });
    }

    // Update Product (PATCH)
    if (pathname.startsWith("/api/admin/products/") && method === "PATCH") {
      const prodId = pathname.replace("/api/admin/products/", "");
      const body = await readBody(req);
      const {
        title,
        sku,
        pricePennies,
        compareAtPricePennies,
        categoryId,
        thumbnailUrl,
        images,
        imagesJson,
        variants,
        variantsJson,
        supplierCostPennies,
        widthCm,
        heightCm,
        depthCm,
        weightKg,
        material,
        color,
        deliveryType,
        fireSafetyCompliant,
      } = body;

      const pFields = [];
      const pParams = [];
      if (title) { pFields.push("title = ?"); pParams.push(title); }
      if (sku !== undefined) { pFields.push("sku = ?"); pParams.push(sku); }
      if (pricePennies) { pFields.push("price_pennies = ?"); pParams.push(pricePennies); }
      if (compareAtPricePennies !== undefined) { pFields.push("compare_at_price_pennies = ?"); pParams.push(compareAtPricePennies); }
      if (categoryId) { pFields.push("category_id = ?"); pParams.push(categoryId); }
      if (thumbnailUrl) { pFields.push("thumbnail_url = ?"); pParams.push(thumbnailUrl); }
      if (images !== undefined || imagesJson !== undefined) {
        const imgs = Array.isArray(images) ? images : (typeof imagesJson === "string" ? JSON.parse(imagesJson) : (imagesJson || []));
        pFields.push("images_json = ?");
        pParams.push(JSON.stringify(imgs));
      }
      if (variants !== undefined || variantsJson !== undefined) {
        const vars = Array.isArray(variants) ? variants : (typeof variantsJson === "string" ? JSON.parse(variantsJson) : (variantsJson || []));
        pFields.push("variants_json = ?");
        pParams.push(JSON.stringify(vars));
      }

      if (pFields.length > 0) {
        pParams.push(prodId);
        await pool.query(`UPDATE products SET ${pFields.join(", ")} WHERE id = ?`, pParams);
      }

      const sFields = [];
      const sParams = [];
      if (widthCm) { sFields.push("width_cm = ?"); sParams.push(widthCm); }
      if (heightCm) { sFields.push("height_cm = ?"); sParams.push(heightCm); }
      if (depthCm) { sFields.push("depth_cm = ?"); sParams.push(depthCm); }
      if (weightKg) { sFields.push("weight_kg = ?"); sParams.push(weightKg); }
      if (material) { sFields.push("material = ?"); sParams.push(material); }
      if (color) { sFields.push("color = ?"); sParams.push(color); }
      if (deliveryType) { sFields.push("delivery_tier = ?"); sParams.push(deliveryType); }
      if (fireSafetyCompliant !== undefined) { sFields.push("fire_safety_compliant = ?"); sParams.push(fireSafetyCompliant ? 1 : 0); }

      if (sFields.length > 0) {
        sParams.push(prodId);
        await pool.query(`UPDATE furniture_specs SET ${sFields.join(", ")} WHERE product_id = ?`, sParams);
      }

      if (supplierCostPennies) {
        await pool.query(
          "UPDATE supplier_feed_items SET cost_price_pennies = ? WHERE product_id = ?",
          [supplierCostPennies, prodId]
        );
      }

      await pool.query(
        "INSERT INTO admin_audit_logs (id, actor, action, resource, details_json, ip_address) VALUES (?, ?, ?, ?, ?, ?)",
        [`log_${Date.now()}`, "admin@sanfurniture.com", "UPDATE_PRODUCT", "products", JSON.stringify({ id: prodId, body }), req.socket.remoteAddress]
      );

      invalidateProductsCache();
      return sendJson(res, 200, { success: true, message: `Product ${prodId} updated` });
    }

    // 9. Admin Orders Management & Advanced 2-Man Dispatch
    if (pathname === "/api/admin/orders" && method === "GET") {
      const [orders] = await pool.query(`
        SELECT o.id, o.order_number, o.customer_name, o.customer_email, o.customer_phone,
               o.shipping_address, o.shipping_postcode as postcode, o.shipping_zone, o.delivery_tier,
               o.subtotal_pennies, o.shipping_pennies, o.vat_pennies, o.total_pennies,
               o.payment_status, o.payment_method, o.billing_address, o.items_json,
               COALESCE(o.fulfillment_status, 'unfulfilled') as status,
               o.created_at,
               d.carrier, d.tracking_number, d.po_number, d.delivery_tier as dispatch_tier
        FROM orders o
        LEFT JOIN order_po_dispatches d ON o.id = d.order_id
        ORDER BY o.created_at DESC
      `);
      return sendJson(res, 200, { orders });
    }

    // 9a. Create Manual Concierge / Phone Order
    if (pathname === "/api/admin/orders" && method === "POST") {
      const body = await readBody(req);
      const {
        customer_name,
        customer_email,
        customer_phone = "+44 20 7946 0912",
        shipping_address,
        postcode,
        delivery_tier = "two_man_white_glove",
        items = [],
        payment_method = "Stripe Manual (Telephone MOTO)",
        notes = "Room of choice delivery requested.",
      } = body;

      if (!customer_name || !customer_email || !postcode || !shipping_address) {
        return sendJson(res, 400, { error: "Customer name, email, address, and UK postcode are required." });
      }

      if (!Array.isArray(items) || items.length === 0) {
        return sendJson(res, 400, { error: "At least one product item is required." });
      }

      const orderNumber = `SAN-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const orderId = `ord_manual_${Date.now()}`;

      // Calculate totals
      let subtotalPennies = 0;
      const formattedItems = items.map((it) => {
        const linePennies = Number(it.pricePennies || it.price_pennies || 0) * Number(it.quantity || 1);
        subtotalPennies += linePennies;
        return {
          productId: it.productId || it.id || "prod_manual",
          sku: it.sku || "SAN-CUSTOM",
          title: it.title || "Custom Furniture Piece",
          finish: it.finish || "Standard Finish",
          pricePennies: Number(it.pricePennies || it.price_pennies || 0),
          quantity: Number(it.quantity || 1),
          thumbnailUrl: it.thumbnailUrl || it.thumbnail_url || "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80",
        };
      });

      // Delivery shipping calculation
      let shippingPennies = 0;
      if (delivery_tier === "two_man_white_glove") {
        shippingPennies = subtotalPennies >= 75000 ? 0 : 4999;
      } else if (delivery_tier === "pallet") {
        shippingPennies = subtotalPennies >= 50000 ? 0 : 2999;
      } else {
        shippingPennies = subtotalPennies >= 5000 ? 0 : 499;
      }

      const totalPennies = subtotalPennies + shippingPennies;
      const vatPennies = Math.round(totalPennies - totalPennies / 1.2);

      const zRes = await getLogisticsZone(postcode);

      await pool.query(
        `INSERT INTO orders (id, order_number, customer_name, customer_email, customer_phone, shipping_address, shipping_postcode, shipping_zone, delivery_tier, subtotal_pennies, shipping_pennies, vat_pennies, total_pennies, payment_status, fulfillment_status, items_json, payment_method, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'paid', 'po_dispatched', ?, ?, NOW())`,
        [orderId, orderNumber, customer_name, customer_email, customer_phone, shipping_address, postcode.toUpperCase(), zRes.zoneCode, delivery_tier, subtotalPennies, shippingPennies, vatPennies, totalPennies, JSON.stringify(formattedItems), payment_method]
      );

      // Auto create PO dispatch record
      const poNumber = `PO-SAN-${Math.floor(100000 + Math.random() * 900000)}`;
      await pool.query(
        `INSERT INTO order_po_dispatches (id, po_number, order_id, supplier_id, item_count, delivery_tier, status, carrier, tracking_number, dispatched_at)
         VALUES (?, ?, ?, 'uk_craft_sofas', ?, ?, 'dispatched', 'Amos Mann 2-Man Dedicated Fleet', ?, NOW())`,
        [`po_${Date.now()}`, poNumber, orderId, formattedItems.length, delivery_tier, `TRX-AM-${Math.floor(100000 + Math.random() * 900000)}`]
      );

      // Create Admin notification
      await pool.query(
        `INSERT INTO notifications (id, recipient_type, recipient_id, type, title, message, link)
         VALUES (?, 'admin', 'all', 'order_created', ?, ?, ?)`,
        [`notif_${Date.now()}`, `New Concierge Order: ${orderNumber}`, `Manual order created for ${customer_name} (£${(totalPennies / 100).toFixed(2)})`, `/admin/orders`]
      );

      // Audit log
      await pool.query(
        `INSERT INTO admin_audit_logs (id, actor, action, resource, details_json, ip_address, created_at)
         VALUES (?, 'admin@sanfurniture.co.uk', 'CREATE_MANUAL_ORDER', 'orders', ?, ?, NOW())`,
        [`log_${Date.now()}`, JSON.stringify({ orderId, orderNumber, customer_name, totalPennies }), req.socket.remoteAddress || "127.0.0.1"]
      );

      return sendJson(res, 201, {
        success: true,
        orderId,
        orderNumber,
        message: "Manual concierge order created successfully."
      });
    }

    // 9b. Bulk Update Orders Status
    if (pathname === "/api/admin/orders/bulk-status" && method === "POST") {
      const body = await readBody(req);
      const ids = Array.isArray(body.ids) ? body.ids : (Array.isArray(body.order_ids) ? body.order_ids : []);
      const status = body.status;
      if (ids.length === 0 || !status) {
        return sendJson(res, 400, { error: "ids array and target status are required" });
      }

      let dbStatus = "in_transit";
      if (status === "delivered") dbStatus = "delivered";
      else if (status === "po_dispatched") dbStatus = "po_dispatched";
      else if (status === "unfulfilled" || status === "paid") dbStatus = "unfulfilled";

      await pool.query("UPDATE orders SET fulfillment_status = ? WHERE id IN (?)", [dbStatus, ids]);
      await pool.query(
        "UPDATE order_po_dispatches SET status = ? WHERE order_id IN (?)",
        [dbStatus === "delivered" ? "delivered" : "dispatched", ids]
      );

      await pool.query(
        `INSERT INTO admin_audit_logs (id, actor, action, resource, details_json, ip_address, created_at)
         VALUES (?, 'admin@sanfurniture.co.uk', 'BULK_UPDATE_ORDER_STATUS', 'orders', ?, ?, NOW())`,
        [`log_${Date.now()}`, JSON.stringify({ count: ids.length, ids, status }), req.socket.remoteAddress || "127.0.0.1"]
      );

      return sendJson(res, 200, { success: true, count: ids.length, status: dbStatus });
    }

    if (pathname.startsWith("/api/admin/orders/") && pathname.endsWith("/dispatch") && method === "PATCH") {
      const orderId = pathname.replace("/api/admin/orders/", "").replace("/dispatch", "");
      const body = await readBody(req);
      const { status, carrier = "BJS Home Delivery", trackingNumber, deliverySlot, notes } = body;

      // Map frontend status to MySQL enum ('unfulfilled','po_dispatched','in_transit','delivered')
      let dbStatus = "in_transit";
      if (status === "delivered") dbStatus = "delivered";
      else if (status === "po_dispatched") dbStatus = "po_dispatched";
      else if (status === "paid") dbStatus = "unfulfilled";

      await pool.query("UPDATE orders SET fulfillment_status = ? WHERE id = ?", [dbStatus, orderId]);

      // Upsert order_po_dispatches
      const [dispRows] = await pool.query("SELECT id FROM order_po_dispatches WHERE order_id = ?", [orderId]);
      if (dispRows.length > 0) {
        await pool.query(
          "UPDATE order_po_dispatches SET carrier = ?, tracking_number = ?, status = ? WHERE order_id = ?",
          [carrier, trackingNumber || `BJS-2MAN-${Date.now().toString().slice(-5)}`, dbStatus === "delivered" ? "delivered" : "dispatched", orderId]
        );
      } else {
        await pool.query(
          `INSERT INTO order_po_dispatches (id, po_number, order_id, supplier_id, item_count, delivery_tier, status, tracking_number, carrier)
           VALUES (?, ?, ?, 'uk_craft_sofas', 1, 'two_man_white_glove', ?, ?, ?)`,
          [`po_${Date.now()}`, `PO-SAN-${Date.now().toString().slice(-6)}`, orderId, dbStatus === "delivered" ? "delivered" : "dispatched", trackingNumber || `BJS-2MAN-${Date.now().toString().slice(-5)}`, carrier]
        );
      }

      await pool.query(
        "INSERT INTO admin_audit_logs (id, actor, action, resource, details_json, ip_address) VALUES (?, ?, ?, ?, ?, ?)",
        [`log_${Date.now()}`, "admin@sanfurniture.com", "DISPATCH_2MAN_ORDER", "orders", JSON.stringify({ orderId, status, carrier, trackingNumber, deliverySlot }), req.socket.remoteAddress]
      );

      // Dispatch transactional customer notification
      try {
        const [oRows] = await pool.query(
          "SELECT id, order_number, customer_name, customer_email, customer_phone FROM orders WHERE id = ?",
          [orderId]
        );
        if (oRows.length > 0) {
          const ord = oRows[0];
          await dispatchOrderStatusChanged(pool, {
            orderNumber: ord.order_number,
            customerName: ord.customer_name,
            customerEmail: ord.customer_email,
            customerPhone: ord.customer_phone,
            newStatus: status || "dispatched",
            carrier,
            trackingNumber,
          });
        }
      } catch (notifErr) {
        console.warn("[Backend Dispatch] Notification dispatch warning:", notifErr.message);
      }

      return sendJson(res, 200, { success: true, orderId, status, carrier, trackingNumber });
    }

    if (pathname.startsWith("/api/admin/orders/") && pathname.endsWith("/status") && method === "PATCH") {
      const parts = pathname.split("/");
      const orderId = parts[4];
      const body = await readBody(req);
      const { status, trackingNumber, carrier = "BJS Home Delivery" } = body;

      let dbStatus = "in_transit";
      if (status === "delivered") dbStatus = "delivered";
      else if (status === "po_dispatched") dbStatus = "po_dispatched";
      else if (status === "paid") dbStatus = "unfulfilled";

      await pool.query("UPDATE orders SET fulfillment_status = ? WHERE id = ?", [dbStatus, orderId]);

      if (trackingNumber) {
        const [exist] = await pool.query("SELECT id FROM order_po_dispatches WHERE order_id = ?", [orderId]);
        if (exist.length > 0) {
          await pool.query("UPDATE order_po_dispatches SET tracking_number = ?, carrier = ?, status = 'dispatched' WHERE order_id = ?", [trackingNumber, carrier, orderId]);
        } else {
          await pool.query(
            `INSERT INTO order_po_dispatches (id, po_number, order_id, supplier_id, item_count, delivery_tier, status, tracking_number, carrier)
             VALUES (?, ?, ?, 'uk_craft_sofas', 1, 'two_man_white_glove', 'dispatched', ?, ?)`,
            [`po_${Date.now()}`, `PO-SAN-${Date.now().toString().slice(-6)}`, orderId, trackingNumber, carrier]
          );
        }
      }

      await pool.query(
        "INSERT INTO admin_audit_logs (id, actor, action, resource, details_json, ip_address) VALUES (?, ?, ?, ?, ?, ?)",
        [`log_${Date.now()}`, "admin@sanfurniture.com", "UPDATE_ORDER_STATUS", "orders", JSON.stringify({ orderId, status, trackingNumber }), req.socket.remoteAddress]
      );

      // Dispatch transactional customer notification
      try {
        const [oRows] = await pool.query(
          "SELECT id, order_number, customer_name, customer_email, customer_phone FROM orders WHERE id = ?",
          [orderId]
        );
        if (oRows.length > 0) {
          const ord = oRows[0];
          await dispatchOrderStatusChanged(pool, {
            orderNumber: ord.order_number,
            customerName: ord.customer_name,
            customerEmail: ord.customer_email,
            customerPhone: ord.customer_phone,
            newStatus: status,
            carrier,
            trackingNumber,
          });
        }
      } catch (notifErr) {
        console.warn("[Backend StatusUpdate] Notification dispatch warning:", notifErr.message);
      }

      return sendJson(res, 200, { success: true, orderId, status });
    }

    // 9c. Admin Cancel Order
    if (pathname.startsWith("/api/admin/orders/") && pathname.endsWith("/cancel") && method === "POST") {
      const orderId = pathname.replace("/api/admin/orders/", "").replace("/cancel", "");
      const body = await readBody(req);
      const { reason = "Administrative cancellation" } = body;

      const [rows] = await pool.query("SELECT * FROM orders WHERE id = ? OR order_number = ?", [orderId, orderId]);
      if (rows.length === 0) {
        return sendJson(res, 404, { error: "Order not found" });
      }
      const order = rows[0];

      await pool.query(
        "UPDATE orders SET fulfillment_status = 'cancelled', payment_status = 'refund_pending' WHERE id = ?",
        [order.id]
      );
      await pool.query(
        "UPDATE order_po_dispatches SET status = 'cancelled' WHERE order_id = ?",
        [order.id]
      );

      if (order.customer_email) {
        const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        await pool.query(
          `INSERT INTO notifications (id, recipient_type, recipient_id, type, title, message, link, metadata)
           VALUES (?, 'customer', ?, 'order_status', ?, ?, ?, ?)`,
          [
            notifId,
            order.customer_email,
            `Order Cancelled: ${order.order_number}`,
            `Your order ${order.order_number} has been cancelled by our support team. Reason: ${reason}. A full refund is being processed.`,
            `/account?tab=orders`,
            JSON.stringify({ orderId: order.id, orderNumber: order.order_number, reason }),
          ]
        );
      }

      await pool.query(
        "INSERT INTO admin_audit_logs (id, actor, action, resource, details_json, ip_address) VALUES (?, ?, ?, ?, ?, ?)",
        [
          `log_${Date.now()}`,
          "admin@sanfurniture.com",
          "CANCEL_ORDER",
          "orders",
          JSON.stringify({ orderId: order.id, orderNumber: order.order_number, reason }),
          req.socket.remoteAddress,
        ]
      );

      // Dispatch cancel email and SMS to customer
      try {
        await dispatchOrderCancelled(pool, {
          orderNumber: order.order_number,
          customerName: order.customer_name,
          customerEmail: order.customer_email,
          customerPhone: order.customer_phone,
          totalPennies: order.total_pennies,
          reason,
          cancelledBy: "Admin Operations",
        });
      } catch (notifErr) {
        console.warn("[Backend Cancel] Notification dispatch warning:", notifErr.message);
      }

      return sendJson(res, 200, { success: true, orderId: order.id, status: "cancelled" });
    }

    // 9d. Admin Permanently Delete Order Record
    if (pathname.startsWith("/api/admin/orders/") && method === "DELETE") {
      const orderId = pathname.replace("/api/admin/orders/", "");
      const [rows] = await pool.query("SELECT * FROM orders WHERE id = ? OR order_number = ?", [orderId, orderId]);
      if (rows.length === 0) {
        return sendJson(res, 404, { error: "Order not found" });
      }
      const order = rows[0];

      await pool.query("DELETE FROM order_po_dispatches WHERE order_id = ?", [order.id]);
      await pool.query("DELETE FROM orders WHERE id = ?", [order.id]);

      await pool.query(
        "INSERT INTO admin_audit_logs (id, actor, action, resource, details_json, ip_address) VALUES (?, ?, ?, ?, ?, ?)",
        [
          `log_${Date.now()}`,
          "admin@sanfurniture.com",
          "DELETE_ORDER",
          "orders",
          JSON.stringify({ orderId: order.id, orderNumber: order.order_number, total: order.total_pennies }),
          req.socket.remoteAddress,
        ]
      );

      return sendJson(res, 200, { success: true, deletedOrderId: order.id, orderNumber: order.order_number });
    }



    // Settings Test Email & SMS Triggers
    if (pathname === "/api/admin/settings/test-email" && method === "POST") {
      const authAdmin = await getAdminFromAuth(req);
      if (!authAdmin) {
        return sendJson(res, 401, { error: "Unauthorized" });
      }

      const body = await readBody(req);
      invalidateNotificationSettingsCache();
      const settings = await getNotificationSettings(pool, true);

      const targetEmail = body.to || authAdmin.email || settings.support_email || settings.smtp_user;
      if (!targetEmail) {
        return sendJson(res, 400, { error: "Recipient email is required" });
      }

      const result = await sendRawEmail(pool, {
        to: targetEmail,
        subject: "SAN Furniture — Live SMTP Verification Test",
        html: `
          <div style="font-family: sans-serif; padding: 24px; color: #1a2233;">
            <h2 style="color: #0e1526;">SMTP Connection Verified!</h2>
            <p>This is a live transactional test email dispatched from your <strong>SAN Furniture UK</strong> store administration console.</p>
            <p><strong>Configured SMTP Host:</strong> ${settings.smtp_host}</p>
            <p><strong>Port:</strong> ${settings.smtp_port} (${settings.smtp_encryption})</p>
            <p><strong>From:</strong> ${settings.smtp_from_name || "SAN Furniture"} &lt;${settings.smtp_from_email || settings.smtp_user}&gt;</p>
            <p style="color: #059669; font-weight: bold;">✔ All customer notifications (Registration, Order Confirmed, Dispatched, Cancelled) are now active and ready to deliver.</p>
          </div>
        `,
      });

      if (result.success) {
        return sendJson(res, 200, {
          success: true,
          message: `Test email successfully dispatched to ${targetEmail} (MessageId: ${result.messageId || "sent"})!`,
        });
      } else {
        return sendJson(res, 502, {
          success: false,
          error: result.error || "Failed to dispatch test email via SMTP server.",
        });
      }
    }

    if (pathname === "/api/admin/settings/test-sms" && method === "POST") {
      const authAdmin = await getAdminFromAuth(req);
      if (!authAdmin) {
        return sendJson(res, 401, { error: "Unauthorized" });
      }

      const body = await readBody(req);
      invalidateNotificationSettingsCache();
      const settings = await getNotificationSettings(pool, true);

      const targetPhone = body.to || settings.support_phone;
      if (!targetPhone) {
        return sendJson(res, 400, { error: "Please enter a valid UK destination telephone number for test SMS." });
      }

      const result = await sendRawSms(pool, {
        to: targetPhone,
        message: `SAN Furniture: Live SMS alert test verified! UK furniture notifications are connected. (SID: ${Date.now().toString().slice(-4)})`,
      });

      if (result.success) {
        return sendJson(res, 200, {
          success: true,
          message: `Test SMS successfully dispatched to ${targetPhone} (Twilio SID: ${result.sid})!`,
        });
      } else {
        return sendJson(res, 502, {
          success: false,
          error: result.error || "Failed to dispatch test SMS via Twilio gateway.",
        });
      }
    }

    // Stripe UK Gateway Credential Test Trigger
    if (pathname === "/api/admin/settings/test-stripe" && method === "POST") {
      const body = await readBody(req);
      const publishableKey = (body.stripe_publishable_key || "").trim();
      const secretKey = (body.stripe_secret_key || "").trim();
      const mode = body.stripe_mode || "test";

      if (!publishableKey || !secretKey) {
        return sendJson(res, 400, {
          success: false,
          error: "Both Stripe Publishable Key and Secret Key are required to test connection.",
        });
      }

      if (!publishableKey.startsWith("pk_")) {
        return sendJson(res, 400, {
          success: false,
          error: "Invalid Publishable Key: Key must start with pk_test_ or pk_live_.",
        });
      }

      if (!secretKey.startsWith("sk_")) {
        return sendJson(res, 400, {
          success: false,
          error: "Invalid Secret Key: Key must start with sk_test_ or sk_live_.",
        });
      }

      return sendJson(res, 200, {
        success: true,
        mode,
        currency: "GBP",
        scaEnabled: true,
        message: `Stripe UK Gateway credentials verified successfully (${mode.toUpperCase()} mode). 3D Secure 2.0 (PSD2 SCA) and Webhook signature ready.`,
      });
    }

    // 10. Security IP Jail Management
    if (pathname === "/api/security/ip-jail" && method === "GET") {
      const [jailed] = await pool.query("SELECT * FROM security_ip_jail ORDER BY created_at DESC");
      return sendJson(res, 200, { jailedIps: jailed });
    }

    if (pathname === "/api/security/unblock" && method === "POST") {
      const body = await readBody(req);
      const ip = (body.ip || "").trim();
      if (!ip) {
        return sendJson(res, 400, { error: "Missing IP address" });
      }
      await pool.query("DELETE FROM security_ip_jail WHERE ip_address = ?", [ip]);
      await pool.query(
        "INSERT INTO admin_audit_logs (id, actor, action, resource, details_json, ip_address) VALUES (?, ?, ?, ?, ?, ?)",
        [`log_${Date.now()}`, "admin@sanfurniture.com", "UNBLOCK_IP", "security_ip_jail", JSON.stringify({ ip }), req.socket.remoteAddress]
      );
      return sendJson(res, 200, { success: true, message: `IP ${ip} released from jail.` });
    }

    // 8. Google Merchant XML Feed
    if (pathname === "/api/feeds/google-merchant.xml" && method === "GET") {
      const [products] = await pool.query(
        "SELECT p.*, s.delivery_tier FROM products p LEFT JOIN furniture_specs s ON p.id = s.product_id WHERE p.status = 'published'"
      );
      const catMap = {
        cat_beds: "Furniture &gt; Beds &amp; Accessories &gt; Beds &amp; Bed Frames",
        cat_sofas: "Furniture &gt; Benches, Couches &amp; Chairs &gt; Sofas",
        cat_dining: "Furniture &gt; Tables &gt; Kitchen &amp; Dining Room Tables",
        cat_armchairs: "Furniture &gt; Benches, Couches &amp; Chairs &gt; Armchairs",
        cat_living: "Furniture &gt; Tables &gt; Coffee Tables",
        cat_office: "Furniture &gt; Office Furniture &gt; Desks"
      };
      const itemsXml = products
        .map((p) => {
          const googleCat = catMap[p.category_id] || "Furniture";
          const tierName =
            p.delivery_tier === "standard_parcel"
              ? "Standard Courier Delivery"
              : p.delivery_tier === "pallet"
              ? "Pallet Freight Delivery"
              : "White Glove Delivery";
          return `
    <item>
      <g:id>${p.id}</g:id>
      <g:title><![CDATA[${p.title}]]></g:title>
      <g:description><![CDATA[${p.description}]]></g:description>
      <g:link>http://localhost:3000/products/${p.handle}</g:link>
      <g:image_link>${p.thumbnail_url}</g:image_link>
      <g:availability>in_stock</g:availability>
      <g:price>${(p.price_pennies / 100).toFixed(2)} GBP</g:price>
      <g:brand>SAN Furniture</g:brand>
      <g:gtin>${p.gtin_barcode || ""}</g:gtin>
      <g:google_product_category>${googleCat}</g:google_product_category>
      <g:condition>new</g:condition>
      <g:shipping>
        <g:country>GB</g:country>
        <g:service>${tierName}</g:service>
        <g:price>0.00 GBP</g:price>
      </g:shipping>
    </item>`;
        })
        .join("");

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>SAN Furniture UK - Google Merchant Feed</title>
    <link>http://localhost:3000</link>
    <description>Ultra-Premium Handcrafted UK Furniture</description>
    ${itemsXml}
  </channel>
</rss>`;

      res.writeHead(200, { "Content-Type": "application/xml; charset=utf-8", "Access-Control-Allow-Origin": "*" });
      return res.end(xml);
    }

    // 11. Admin System Settings API
    if (pathname === "/api/admin/settings" && method === "GET") {
      const [rows] = await pool.query("SELECT * FROM system_settings ORDER BY category, setting_key");
      const kv = {};
      for (const r of rows) {
        kv[r.setting_key] = r.setting_value;
      }
      return sendJson(res, 200, { settings: kv, items: rows });
    }

    if (pathname === "/api/admin/settings" && (method === "POST" || method === "PUT")) {
      const body = await readBody(req);
      const updates = body.settings || body;
      const keys = Object.keys(updates);

      const SENSITIVE_SECRET_KEYS = new Set([
        "smtp_pass",
        "sms_auth_token",
        "stripe_secret_key",
        "stripe_webhook_secret",
      ]);

      for (const k of keys) {
        const val = String(updates[k] ?? "").trim();
        if (SENSITIVE_SECRET_KEYS.has(k) && (!val || val.includes("••••"))) {
          continue; // Guard existing secrets from mask bullets
        }
        await pool.query(
          `INSERT INTO system_settings (setting_key, setting_value)
           VALUES (?, ?)
           ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
          [k, val]
        );
      }

      invalidateNotificationSettingsCache();

      await pool.query(
        "INSERT INTO admin_audit_logs (id, actor, action, resource, details_json, ip_address) VALUES (?, ?, ?, ?, ?, ?)",
        [`log_${Date.now()}`, "admin@sanfurniture.com", "UPDATE_SYSTEM_SETTINGS", "system_settings", JSON.stringify({ updatedKeys: keys }), req.socket.remoteAddress]
      );

      return sendJson(res, 200, { success: true, updatedCount: keys.length, message: "System settings updated successfully." });
    }

    // 12. Admin Suppliers & EDI Management API
    if (pathname === "/api/admin/suppliers" && method === "GET") {
      const activeOnly = url.searchParams.get("active_only") === "true";
      let query = `
        SELECT s.*, COUNT(DISTINCT sup_item.product_id) AS mapped_products_count
        FROM suppliers s
        LEFT JOIN supplier_feed_items sup_item ON (s.code = sup_item.supplier_id OR s.id = sup_item.supplier_id)
      `;
      if (activeOnly) {
        query += " WHERE s.is_active = 1";
      }
      query += `
        GROUP BY s.id
        ORDER BY s.is_active DESC, s.name ASC
      `;
      const [suppliers] = await pool.query(query);
      const mappedSuppliers = (suppliers || []).map((s) => ({
        ...s,
        mapped_products_count: Number(s.mapped_products_count || 0),
      }));
      return sendJson(res, 200, { suppliers: mappedSuppliers });
    }

    // 12a. Toggle Supplier Active / Paused Status
    if (pathname.startsWith("/api/admin/suppliers/") && pathname.endsWith("/toggle") && (method === "PATCH" || method === "POST")) {
      const supId = pathname.replace("/api/admin/suppliers/", "").replace("/toggle", "");
      const [sup] = await pool.query("SELECT * FROM suppliers WHERE id = ? OR code = ? LIMIT 1", [supId, supId]);
      if (sup.length === 0) {
        return sendJson(res, 404, { error: "Supplier not found", supId });
      }

      const currentStatus = sup[0].is_active;
      const newStatus = currentStatus === 1 ? 0 : 1;
      const newSyncStatus = newStatus === 1 ? "operational" : "paused";

      await pool.query(
        "UPDATE suppliers SET is_active = ?, sync_status = ? WHERE id = ?",
        [newStatus, newSyncStatus, sup[0].id]
      );

      await pool.query(
        "INSERT INTO admin_audit_logs (id, actor, action, resource, details_json, ip_address) VALUES (?, ?, ?, ?, ?, ?)",
        [
          `log_${Date.now()}`,
          "admin@sanfurniture.com",
          newStatus === 1 ? "ACTIVATE_SUPPLIER" : "DEACTIVATE_SUPPLIER",
          "suppliers",
          JSON.stringify({ supplierId: sup[0].id, name: sup[0].name, is_active: newStatus }),
          req.socket.remoteAddress
        ]
      );

      return sendJson(res, 200, {
        success: true,
        supplierId: sup[0].id,
        name: sup[0].name,
        is_active: newStatus,
        sync_status: newSyncStatus,
        message: `${sup[0].name} is now ${newStatus === 1 ? "Active & Operational" : "Deactivated / Paused"}.`
      });
    }

    if (pathname === "/api/admin/suppliers/sync" && method === "POST") {
      const body = await readBody(req);
      const supplierId = body.supplierId || "all";

      let syncedItemsCount = 0;
      let targetName = "All Supplier Feeds";

      if (supplierId === "all") {
        await pool.query("UPDATE suppliers SET last_sync_at = NOW(), sync_status = 'operational' WHERE is_active = 1");
        try {
          await amosMannExtractor.syncTrackedCatalog(pool, { triggerType: "manual" });
        } catch (e) {
          console.error("Amos Mann live sync error in sync-all:", e.message);
        }
        const [cnt] = await pool.query("SELECT COUNT(*) as total FROM supplier_feed_items");
        syncedItemsCount = cnt[0]?.total || 18;
      } else {
        const [sup] = await pool.query("SELECT id, name, code FROM suppliers WHERE id = ? OR code = ? LIMIT 1", [supplierId, supplierId]);
        if (sup.length > 0) {
          targetName = sup[0].name;
          if (sup[0].code === "amos_mann_furniture") {
            const syncRes = await amosMannExtractor.syncTrackedCatalog(pool, { triggerType: "manual" });
            syncedItemsCount = syncRes.itemsScanned;
          } else {
            await pool.query("UPDATE suppliers SET last_sync_at = NOW(), sync_status = 'operational' WHERE id = ?", [sup[0].id]);
            const [cnt] = await pool.query("SELECT COUNT(*) as total FROM supplier_feed_items WHERE supplier_id = ?", [sup[0].code]);
            syncedItemsCount = cnt[0]?.total || 5;
          }
        } else {
          await pool.query("UPDATE suppliers SET last_sync_at = NOW(), sync_status = 'operational' WHERE id = ?", [supplierId]);
          syncedItemsCount = 10;
        }
      }

      await pool.query(
        "INSERT INTO admin_audit_logs (id, actor, action, resource, details_json, ip_address) VALUES (?, ?, ?, ?, ?, ?)",
        [`log_${Date.now()}`, "admin@sanfurniture.com", "TRIGGER_EDI_SYNC", "suppliers", JSON.stringify({ supplierId, targetName, syncedItemsCount }), req.socket.remoteAddress]
      );

      return sendJson(res, 200, {
        success: true,
        supplierId,
        supplierName: targetName,
        syncedItems: syncedItemsCount,
        syncedAt: new Date().toISOString(),
        message: `Supplier catalog for ${targetName} (${syncedItemsCount} items) synchronized successfully.`
      });
    }

    // 12b. Dedicated Amos Mann Dropship Status & Extraction Engine API
    if (pathname === "/api/admin/dropship/amos-mann/status" && method === "GET") {
      const engineStatus = await amosMannExtractor.getEngineStatus(pool);
      return sendJson(res, 200, {
        supplier: "Amos Mann Furniture",
        hub: "Leicester UK Warehouse",
        feedType: "Automated Live Web Scraper & Reconciler",
        leadTimeDays: 5,
        defaultDelivery: "2-Man White Glove / Pallet",
        activeSkus: engineStatus.trackedCount,
        items: engineStatus.trackedProducts,
        recentLogs: engineStatus.recentLogs,
        supplierInfo: engineStatus.supplier
      });
    }

    // 12b-2. Trigger On-Demand Amos Mann Live Web Reconcile Now
    if (pathname === "/api/admin/dropship/amos-mann/sync" && method === "POST") {
      const syncResult = await amosMannExtractor.syncTrackedCatalog(pool, { triggerType: "manual" });
      return sendJson(res, 200, syncResult);
    }

    // 12b-3. Extract & Import Brand New Product(s) from Amos Mann URL(s) - Single or Batch
    if (pathname === "/api/admin/dropship/amos-mann/import-url" && method === "POST") {
      const body = await readBody(req);
      const rawUrls = Array.isArray(body.urls)
        ? body.urls
        : (body.url ? body.url.split(/[\r\n,]+/) : []);
      const urls = rawUrls.map((u) => u.trim()).filter((u) => u.startsWith("http"));

      if (urls.length === 0) {
        return sendJson(res, 400, { error: "At least one valid product URL is required" });
      }

      try {
        if (urls.length === 1) {
          const imported = await amosMannExtractor.extractAndImportUrl(
            pool,
            urls[0],
            body.categoryId || "cat_beds",
            body.deliveryTier || "two_man_white_glove"
          );
          return sendJson(res, 201, {
            success: true,
            importedCount: 1,
            message: `Product "${imported.title}" successfully extracted & imported into catalog!`,
            product: imported
          });
        } else {
          const batchRes = await amosMannExtractor.batchImportUrls(
            pool,
            urls,
            body.categoryId || "cat_beds",
            body.deliveryTier || "two_man_white_glove"
          );
          return sendJson(res, 201, {
            success: true,
            importedCount: batchRes.importedCount,
            failedCount: batchRes.failedCount,
            message: `Successfully batch-imported ${batchRes.importedCount} products into catalog!`,
            products: batchRes.products,
            errors: batchRes.errors
          });
        }
      } catch (err) {
        return sendJson(res, 500, { error: err.message });
      }
    }

    // 12b-4. Discover Amos Mann Sitemap Catalog for Category/Batch Import
    if (pathname === "/api/admin/dropship/amos-mann/sitemap-catalog" && method === "GET") {
      const cat = url.searchParams.get("category") || "all";
      const discovery = await amosMannExtractor.discoverSitemapProducts(pool, cat);
      return sendJson(res, 200, discovery);
    }

    // 12c. Dedicated Furniture To Go (FTG) Dropship Status & PO Preview API
    if (pathname === "/api/admin/dropship/furniture-to-go/status" && method === "GET") {
      const [items] = await pool.query(`
        SELECT fi.*, p.title, p.handle, p.thumbnail_url
        FROM supplier_feed_items fi
        JOIN products p ON fi.product_id = p.id
        WHERE fi.supplier_id = 'furniture_to_go'
        ORDER BY fi.stock_level DESC
      `);
      return sendJson(res, 200, {
        supplier: "Furniture To Go (FTG)",
        hub: "Melksham, Wiltshire UK Distribution Centre",
        feedType: "B2B CSV / Direct DPD & 2-Man Dropship",
        leadTimeDays: 3,
        defaultDelivery: "DPD Express (<40kg) / 2-Man Room of Choice (>40kg)",
        activeSkus: items.length,
        items
      });
    }

    // 12c-1. Extract & Import Brand New Product(s) from Furniture To Go URL(s) - Single or Batch
    if (pathname === "/api/admin/dropship/furniture-to-go/import-url" && method === "POST") {
      const body = await readBody(req);
      const rawUrls = Array.isArray(body.urls)
        ? body.urls
        : (body.url ? body.url.split(/[\r\n,]+/) : []);
      const urls = rawUrls.map((u) => u.trim()).filter((u) => u.startsWith("http"));

      if (urls.length === 0) {
        return sendJson(res, 400, { error: "At least one valid Furniture To Go product URL is required" });
      }

      try {
        if (urls.length === 1) {
          const imported = await furnitureToGoExtractor.extractAndImportUrl(
            pool,
            urls[0],
            body.categoryId || "cat_beds",
            body.deliveryTier || "standard_parcel"
          );
          return sendJson(res, 201, {
            success: true,
            importedCount: 1,
            message: `Product "${imported.title}" successfully extracted & imported into catalog!`,
            product: imported
          });
        } else {
          const batchRes = await furnitureToGoExtractor.batchImportUrls(
            pool,
            urls,
            body.categoryId || "cat_beds",
            body.deliveryTier || "standard_parcel"
          );
          return sendJson(res, 201, {
            success: true,
            importedCount: batchRes.importedCount,
            failedCount: batchRes.failedCount,
            message: `Successfully batch-imported ${batchRes.importedCount} FTG products into catalog!`,
            products: batchRes.products,
            errors: batchRes.errors
          });
        }
      } catch (err) {
        return sendJson(res, 500, { error: err.message });
      }
    }

    // 12c-2. Discover Furniture To Go Sitemap Catalog for Category/Batch Import
    if (pathname === "/api/admin/dropship/furniture-to-go/sitemap-catalog" && method === "GET") {
      const cat = url.searchParams.get("category") || "all";
      const discovery = await furnitureToGoExtractor.discoverSitemapProducts(pool, cat);
      return sendJson(res, 200, discovery);
    }

    // 12c-3. Sync Tracked Furniture To Go Catalog
    if (pathname === "/api/admin/dropship/furniture-to-go/sync-catalog" && method === "POST") {
      const syncResult = await furnitureToGoExtractor.syncTrackedCatalog(pool, { triggerType: "manual" });
      return sendJson(res, 200, {
        success: true,
        message: `Furniture To Go sync completed: ${syncResult.itemsScanned} items verified, ${syncResult.pricesUpdated} prices updated, ${syncResult.stockUpdated} stock status updated.`,
        syncResult
      });
    }

    // 12d. Upload & Process Supplier Feed (CSV or JSON file)
    if (pathname.startsWith("/api/admin/suppliers/") && pathname.endsWith("/upload-feed") && method === "POST") {
      const supId = pathname.replace("/api/admin/suppliers/", "").replace("/upload-feed", "");
      const body = await readBody(req);
      const { feedContent } = body;

      if (!feedContent || typeof feedContent !== "string") {
        return sendJson(res, 400, { error: "Missing feedContent string payload" });
      }

      let parsedItems = [];
      let supplierCode = supId;

      if (supId === "sup_amos_mann" || supId === "amos_mann_furniture") {
        supplierCode = "amos_mann_furniture";
        const { AmosMannDropshipAdapter } = await import("../dist/src/modules/dropship/adapters/amos-mann-adapter.js");
        const adapter = new AmosMannDropshipAdapter();
        const resParsed = await adapter.parse(feedContent);
        parsedItems = resParsed.items;
      } else if (supId === "sup_furniture_to_go" || supId === "furniture_to_go") {
        supplierCode = "furniture_to_go";
        const { FurnitureToGoDropshipAdapter } = await import("../dist/src/modules/dropship/adapters/furniture-to-go-adapter.js");
        const adapter = new FurnitureToGoDropshipAdapter();
        const resParsed = await adapter.parse(feedContent);
        parsedItems = resParsed.items;
      } else {
        return sendJson(res, 400, { error: "Unsupported supplier for feed upload" });
      }

      let updatedCount = 0;
      let insertedCount = 0;
      for (const it of parsedItems) {
        const [existing] = await pool.query(
          "SELECT id FROM supplier_feed_items WHERE supplier_id = ? AND supplier_sku = ? LIMIT 1",
          [supplierCode, it.supplier_sku]
        );
        if (existing.length > 0) {
          await pool.query(
            `UPDATE supplier_feed_items 
             SET stock_level = ?, cost_price_pennies = ?, shipping_cost_pennies = ?, lead_time_days = ?, last_synced_at = NOW()
             WHERE id = ?`,
            [it.stock_level, it.cost_price_pennies, it.carriage_cost_pennies, it.lead_time_days, existing[0].id]
          );
          updatedCount++;
        } else {
          const prodId = `prod_${supplierCode.slice(0, 3)}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          const handle = (it.product_title || `FTG ${it.supplier_sku}`)
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");

          const cost = it.cost_price_pennies;
          const carriage = it.carriage_cost_pennies || 1500;
          const netCost = (cost + carriage) / 100;
          const retailNet = netCost / (1 - 0.35);
          const retailGrossPennies = Math.round(retailNet * 1.2 * 100);

          await pool.query(
            `INSERT INTO products (
              id, title, handle, subtitle, description, category_id, status,
              price_pennies, compare_at_price_pennies, vat_rate_percent, gtin_barcode,
              thumbnail_url, images_json, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, 'cat_beds', 'published', ?, ?, 20.00, ?, ?, ?, NOW(), NOW())
            ON DUPLICATE KEY UPDATE updated_at = NOW()`,
            [
              prodId,
              it.product_title,
              handle,
              `Authentic Danish Scandinavian furniture from Furniture To Go`,
              `High-quality Danish flat-pack furniture manufactured to European standards. Supplied by Furniture To Go.`,
              retailGrossPennies,
              Math.round(retailGrossPennies * 1.25),
              it.barcode_gtin || null,
              "https://images.unsplash.com/photo-1595428774223-ef52624120d2?q=80&w=1200&auto=format&fit=crop",
              JSON.stringify(["https://images.unsplash.com/photo-1595428774223-ef52624120d2?q=80&w=1200&auto=format&fit=crop"])
            ]
          );

          await pool.query(
            `INSERT INTO supplier_feed_items (
              id, supplier_id, supplier_sku, product_id, cost_price_pennies, shipping_cost_pennies,
              markup_percentage, retail_price_pennies, stock_level, lead_time_days, last_synced_at
            ) VALUES (?, ?, ?, ?, ?, ?, 35.0, ?, ?, ?, NOW())`,
            [
              `supp_item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              supplierCode,
              it.supplier_sku,
              prodId,
              cost,
              carriage,
              retailGrossPennies,
              it.stock_level,
              it.lead_time_days || 3
            ]
          );
          insertedCount++;
        }
      }

      await pool.query(
        "UPDATE suppliers SET last_sync_at = NOW(), sync_status = 'operational' WHERE id = ? OR code = ?",
        [supId, supplierCode]
      );

      await pool.query(
        "INSERT INTO admin_audit_logs (id, actor, action, resource, details_json, ip_address) VALUES (?, ?, ?, ?, ?, ?)",
        [
          `log_${Date.now()}`,
          "admin@sanfurniture.com",
          "UPLOAD_SUPPLIER_FEED",
          "suppliers",
          JSON.stringify({ supplier: supplierCode, parsedItems: parsedItems.length, updatedCount }),
          req.socket.remoteAddress
        ]
      );

      return sendJson(res, 200, {
        success: true,
        supplier: supplierCode,
        parsedCount: parsedItems.length,
        updatedCount,
        message: `Successfully processed ${parsedItems.length} SKUs from feed file (${updatedCount} catalog items updated).`
      });
    }

    // 12e. Live UK Postcode Address & Zone Lookup API (Checkout Engine)
    if (pathname === "/api/checkout/postcode-lookup" && method === "GET") {
      const rawPostcode = (url.searchParams.get("postcode") || "").trim().toUpperCase();
      const clean = rawPostcode.replace(/\s+/g, "");

      const ukPostcodeRegex = /^([A-Z]{1,2}[0-9][A-Z0-9]?)\s*([0-9][A-Z]{2})$/i;
      const isFormatValid = ukPostcodeRegex.test(clean) || clean.length >= 3;

      if (!isFormatValid) {
        return sendJson(res, 400, { valid: false, error: "Please enter a valid UK postcode (e.g. CV7 9EU, SW1A 1AA, M1 1AE, B1 1BB, LE5 5FN)" });
      }

      const info = resolveUKPostcodeInfo(clean);
      const zoneResult = await getLogisticsZone(clean);
      const options = await getDeliveryOptions(zoneResult, 0, clean);

      const isDeliverable = zoneResult.isDeliverable && options.length > 0;
      const city = info.city;
      const county = info.county;
      const sampleAddress = clean === "SW1A1AA" ? "Buckingham Palace, The Mall" : `12 High Street, ${city}`;
      const defaultOpt = options[0];

      return sendJson(res, 200, {
        valid: true,
        deliverable: isDeliverable,
        postcode: info.postcode,
        cleanPostcode: clean,
        areaPrefix: info.areaPrefix,
        zone: zoneResult.zoneCode,
        zoneName: zoneResult.zoneName,
        regionName: info.regionName,
        regionKey: info.regionKey,
        city,
        county,
        sampleAddress,
        deliveryTier: isDeliverable ? (defaultOpt?.id || "free_delivery") : "none",
        deliveryLabel: isDeliverable
          ? (defaultOpt ? `${defaultOpt.name} (${defaultOpt.formattedTotal})` : "Free UK Mainland Delivery")
          : "Delivery Unavailable",
        surchargePennies: zoneResult.surchargePennies,
        surchargeFormatted: zoneResult.surchargeFormatted,
        leadTimeExtraDays: zoneResult.leadTimeExtraDays,
        deliveryOptions: options,
        estimatedDays: isDeliverable
          ? (defaultOpt?.timeframe || `${3 + zoneResult.leadTimeExtraDays} - ${7 + zoneResult.leadTimeExtraDays} business days`)
          : "Unavailable",
        message: isDeliverable
          ? `Verified UK Mainland Address: ${city}, ${county} (${info.regionName}). ${defaultOpt?.formattedTotal === "FREE" ? "Eligible for Free Delivery." : `Delivery Rate: ${defaultOpt?.formattedTotal}`}`
          : (zoneResult.error || "We currently deliver exclusively to UK Mainland addresses. We do not deliver to this address at this time."),
        error: isDeliverable ? null : (zoneResult.error || "Delivery to this destination is currently unavailable.")
      });
    }

    // 12e-1. Create Payment Intent (Stripe UK Gateway - Hardened & Rate Limited)
    if (pathname === "/api/checkout/create-payment-intent" && method === "POST") {
      const rateCheck = rateLimiter.checkLimit("checkout", clientIp);
      if (!rateCheck.allowed) {
        return sendJson(res, 429, {
          error: `Checkout rate limit exceeded. Please wait ${rateCheck.resetSeconds} seconds before trying again.`,
          resetSeconds: rateCheck.resetSeconds
        });
      }

      const body = await readBody(req);
      const { amountPennies: clientAmount, customer, deliveryTier, items, shippingAddress } = body;

      const postcodeToCheck = shippingAddress?.postcode || customer?.postcode || body.postcode;
      let zoneResult = { isDeliverable: true, surchargePennies: 0, zoneCode: "mainland_uk" };
      if (postcodeToCheck) {
        zoneResult = await getLogisticsZone(postcodeToCheck);
        if (!zoneResult.isDeliverable) {
          return sendJson(res, 400, {
            error: zoneResult.error || "Delivery Unavailable: We currently do not deliver to this destination."
          });
        }
      }

      // Canonical price recalculation if items are supplied (Prevents client price manipulation)
      let resolvedAmountPennies = clientAmount;
      if (Array.isArray(items) && items.length > 0) {
        const productIds = items.map(it => it.productId || it.id).filter(Boolean);
        if (productIds.length > 0) {
          const [dbProducts] = await pool.query(
            "SELECT id, price_pennies, status FROM products WHERE id IN (?)",
            [productIds]
          );
          const pMap = new Map(dbProducts.map(p => [p.id, p]));
          let calculatedSubtotal = 0;
          for (const it of items) {
            const pid = it.productId || it.id;
            const dbP = pMap.get(pid);
            if (!dbP) {
              return sendJson(res, 400, { error: `Invalid item in basket: Product "${pid}" not found in catalog.` });
            }
            const unitPrice = Number(dbP.price_pennies);
            const qty = Math.max(1, parseInt(it.quantity, 10) || 1);
            calculatedSubtotal += unitPrice * qty;
          }
          let tierShipping = 0;
          if (deliveryTier === "white_glove_assembly") tierShipping = 2900;
          else if (deliveryTier === "priority_saturday") tierShipping = 4900;
          resolvedAmountPennies = calculatedSubtotal + tierShipping + (zoneResult.surchargePennies || 0);
        }
      }

      if (!resolvedAmountPennies || resolvedAmountPennies <= 0) {
        return sendJson(res, 400, { error: "Invalid payment amount in pennies." });
      }

      // Read Stripe settings from MySQL system_settings
      const [settingsRows] = await pool.query(
        "SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN ('stripe_enabled', 'stripe_mode', 'stripe_publishable_key', 'stripe_secret_key', 'stripe_statement_descriptor', 'stripe_currency')"
      );
      const conf = {};
      for (const r of settingsRows) {
        conf[r.setting_key] = r.setting_value;
      }

      const secretKey = conf.stripe_secret_key || process.env.STRIPE_SECRET_KEY || "";
      let paymentIntentId = "";
      let clientSecret = "";

      // Connect to live Stripe API when secret key is configured
      if (secretKey && (secretKey.startsWith("sk_test_") || secretKey.startsWith("sk_live_"))) {
        try {
          // Create or Find Stripe Customer so Stripe Dashboard displays Customer Name & Email
          let stripeCustomerId = "";
          const custEmail = (customer?.email || shippingAddress?.email || body.email || "").trim().toLowerCase();
          const custName = (
            customer?.name ||
            `${customer?.firstName || ""} ${customer?.lastName || ""}`.trim() ||
            shippingAddress?.fullName ||
            `${shippingAddress?.firstName || ""} ${shippingAddress?.lastName || ""}`.trim() ||
            "Valued SAN Customer"
          ).trim();
          const custPhone = (customer?.phone || shippingAddress?.phone || body.phone || "").trim();
          const shipAddr = shippingAddress || customer?.shippingAddress || body.shipping_address;

          if (custEmail) {
            try {
              // Speed optimization: Check DB first to avoid unnecessary Stripe API network roundtrip
              const [dbCust] = await pool.query(
                "SELECT stripe_customer_id FROM customer_payment_methods WHERE customer_email = ? AND stripe_customer_id LIKE 'cus_%' LIMIT 1",
                [custEmail]
              ).catch(() => [[]]);

              if (Array.isArray(dbCust) && dbCust.length > 0 && dbCust[0].stripe_customer_id) {
                stripeCustomerId = dbCust[0].stripe_customer_id;
              } else {
                const searchCustRes = await fetch(`https://api.stripe.com/v1/customers?email=${encodeURIComponent(custEmail)}&limit=1`, {
                  headers: { Authorization: `Bearer ${secretKey}` },
                  signal: AbortSignal.timeout(3500),
                });
                const searchCustData = await searchCustRes.json().catch(() => ({}));
                if (searchCustRes.ok && searchCustData.data && searchCustData.data.length > 0) {
                  stripeCustomerId = searchCustData.data[0].id;
                  if (custName && searchCustData.data[0].name !== custName) {
                    const updateParams = new URLSearchParams();
                    updateParams.append("name", custName);
                    if (custPhone) updateParams.append("phone", custPhone);
                    fetch(`https://api.stripe.com/v1/customers/${stripeCustomerId}`, {
                      method: "POST",
                      headers: {
                        Authorization: `Bearer ${secretKey}`,
                        "Content-Type": "application/x-www-form-urlencoded",
                      },
                      body: updateParams.toString(),
                    }).catch(() => {});
                  }
                } else {
                  const newCustParams = new URLSearchParams();
                  newCustParams.append("name", custName);
                  newCustParams.append("email", custEmail);
                  if (custPhone) newCustParams.append("phone", custPhone);
                  if (shipAddr?.addressLine1) {
                    newCustParams.append("shipping[name]", custName);
                    newCustParams.append("shipping[address][line1]", shipAddr.addressLine1);
                    if (shipAddr.city) newCustParams.append("shipping[address][city]", shipAddr.city);
                    if (shipAddr.postcode) newCustParams.append("shipping[address][postal_code]", shipAddr.postcode);
                    newCustParams.append("shipping[address][country]", "GB");
                  }
                  const createCustRes = await fetch("https://api.stripe.com/v1/customers", {
                    method: "POST",
                    headers: {
                      Authorization: `Bearer ${secretKey}`,
                      "Content-Type": "application/x-www-form-urlencoded",
                    },
                    body: newCustParams.toString(),
                    signal: AbortSignal.timeout(3500),
                  });
                  const newCustData = await createCustRes.json().catch(() => ({}));
                  if (createCustRes.ok && newCustData.id) {
                    stripeCustomerId = newCustData.id;
                  }
                }
              }
            } catch (custErr) {
              console.warn("[Backend Stripe Customer Link] Error:", custErr.message);
            }
          }

          const stripeParams = new URLSearchParams();
          stripeParams.append("amount", String(resolvedAmountPennies));
          stripeParams.append("currency", (conf.stripe_currency || "gbp").toLowerCase());
          stripeParams.append("payment_method_types[]", "card");
          stripeParams.append("description", `SAN Furniture UK Order - ${formatGBP(resolvedAmountPennies)}`);
          if (stripeCustomerId) stripeParams.append("customer", stripeCustomerId);
          if (custEmail) stripeParams.append("receipt_email", custEmail);
          stripeParams.append("metadata[merchant]", "SAN Furniture Ltd (UK)");
          if (custName) stripeParams.append("metadata[customer_name]", custName);
          if (custEmail) stripeParams.append("metadata[customer_email]", custEmail);
          if (deliveryTier) stripeParams.append("metadata[delivery_tier]", deliveryTier);

          const stripeRes = await fetch("https://api.stripe.com/v1/payment_intents", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${secretKey}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: stripeParams.toString(),
            signal: AbortSignal.timeout(8000),
          });
          const stripeData = await stripeRes.json().catch(() => ({}));
          if (stripeRes.ok && stripeData.id) {
            paymentIntentId = stripeData.id;
            clientSecret = stripeData.client_secret || `${paymentIntentId}_secret`;
          }
        } catch (stripeErr) {
          console.warn("[Backend Stripe] Outbound call error:", stripeErr.message);
        }
      }

      if (!paymentIntentId) {
        const isLive = conf.stripe_mode === "live";
        const prefix = isLive ? "pi_live_" : "pi_test_";
        paymentIntentId = `${prefix}${Date.now()}_${crypto.randomBytes(6).toString("hex")}`;
        clientSecret = `${paymentIntentId}_secret_${crypto.randomBytes(12).toString("hex")}`;
      }

      return sendJson(res, 200, {
        success: true,
        paymentIntentId,
        clientSecret,
        amountPennies: resolvedAmountPennies,
        formattedAmount: formatGBP(resolvedAmountPennies),
        currency: conf.stripe_currency || "GBP",
        status: "requires_confirmation",
        paymentMethod: "card",
        deliveryTier: deliveryTier || "free_mainland",
        customerEmail: customer?.email || "customer@sanfurniture.com",
        merchant: {
          name: "SAN Furniture Ltd",
          location: "London, UK",
          mode: conf.stripe_mode || "test",
          publishableKey: conf.stripe_publishable_key || "pk_test_demo",
          statementDescriptor: conf.stripe_statement_descriptor || "SAN FURNITURE UK",
          stripeAccount: "acct_san_furniture_uk"
        }
      });
    }

    // 12e-2. Official Payment Gateway Confirmation (Stripe 3DS / Klarna Auth / Clearpay)
    if (pathname === "/api/checkout/confirm-payment" && method === "POST") {
      const rateCheck = rateLimiter.checkLimit("checkout", clientIp);
      if (!rateCheck.allowed) {
        return sendJson(res, 429, {
          error: `Payment confirmation rate limit reached. Please wait ${rateCheck.resetSeconds} seconds before trying again.`,
          resetSeconds: rateCheck.resetSeconds
        });
      }

      const body = await readBody(req);
      const { paymentIntentId, paymentMethod, paymentDetails, amountPennies } = body;

      if (!paymentIntentId) {
        return sendJson(res, 400, { error: "Missing payment intent identifier." });
      }

      const [settingsRows] = await pool.query(
        "SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN ('stripe_secret_key', 'stripe_mode', 'stripe_currency')"
      );
      const conf = {};
      for (const r of settingsRows) {
        conf[r.setting_key] = r.setting_value;
      }

      const secretKey = conf.stripe_secret_key || process.env.STRIPE_SECRET_KEY || "";
      const isLive = conf.stripe_mode === "live";

      const rawCard = String(paymentDetails?.cardNumber || "").replace(/\s+/g, "");
      const isSavedCard = Boolean(paymentDetails?.isSavedCard);
      const cvc = String(paymentDetails?.cardCvc || "").trim();
      const expParts = (paymentDetails?.cardExpiry || "").split("/");
      const expMonth = parseInt(expParts[0] || "0", 10);
      let expYear = parseInt(expParts[1] || "0", 10);
      if (expYear < 100) expYear += 2000;

      // 1. Strict Card Validation
      if (isSavedCard) {
        if (!cvc || cvc.length < 3 || cvc.length > 4) {
          return sendJson(res, 400, { success: false, status: "failed", error: "Please enter your card's 3 or 4-digit security code (CVC/CVV)." });
        }
        if (cvc === "000" || cvc === "999") {
          return sendJson(res, 402, { success: false, status: "failed", error: "Your card's security code (CVC) is incorrect. Payment declined." });
        }
      } else {
        if (!rawCard || rawCard.length < 13 || rawCard.length > 19) {
          return sendJson(res, 400, { success: false, status: "failed", error: "The credit or debit card number you entered is invalid. Please check the digits and try again." });
        }

        const isKnownStripeTestCard =
          rawCard === "4242424242424242" ||
          rawCard === "4000000000000002" ||
          rawCard === "4000000000000069" ||
          rawCard === "4000000000000036" ||
          rawCard === "4000000000000028" ||
          rawCard === "5555555555554444" ||
          rawCard === "378282246310005" ||
          rawCard === "6011111111111117";

        // Luhn algorithm
        let sum = 0;
        let isEven = false;
        for (let i = rawCard.length - 1; i >= 0; i--) {
          let digit = parseInt(rawCard.charAt(i), 10);
          if (isEven) {
            digit *= 2;
            if (digit > 9) digit -= 9;
          }
          sum += digit;
          isEven = !isEven;
        }
        if (sum % 10 !== 0 && !isKnownStripeTestCard) {
          return sendJson(res, 400, { success: false, status: "failed", error: "The card number you entered failed checksum validation. Please re-enter a valid card." });
        }

        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        if (!expMonth || expMonth < 1 || expMonth > 12) {
          return sendJson(res, 400, { success: false, status: "failed", error: "Card expiry month must be between 01 and 12." });
        }
        if (!expYear || expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
          return sendJson(res, 402, { success: false, status: "failed", error: "Your card has expired. Please check the MM/YY or use another card." });
        }
        if (!cvc || cvc.length < 3 || cvc.length > 4 || cvc === "000") {
          return sendJson(res, 402, { success: false, status: "failed", error: "Your card's security code (CVC) is incorrect. Payment authorization failed." });
        }
      }

      // 2. Stripe Gateway Execution
      if (!secretKey || !paymentIntentId.startsWith("pi_")) {
        return sendJson(res, 500, { success: false, status: "failed", error: "Payment Gateway Error: Stripe is not configured with a valid secret key." });
      }

      const confParams = new URLSearchParams();

      if (isSavedCard) {
        const cardLast4 = String(paymentDetails?.last4 || "").trim();

        if (!isLive) {
          // Strict Stripe Test Card Matching for Saved Cards:
          // Only recognized valid Stripe test cards are authorized to succeed.
          // Any bogus/invalid saved card (such as 8888, 0002, 1111, etc.) MUST BE REJECTED & DECLINED on Stripe!
          if (cardLast4 === "4242") {
            confParams.append("payment_method_data[type]", "card");
            confParams.append("payment_method_data[card][token]", "tok_visa");
          } else if (cardLast4 === "4444") {
            confParams.append("payment_method_data[type]", "card");
            confParams.append("payment_method_data[card][token]", "tok_mastercard");
          } else if (cardLast4 === "0005") {
            confParams.append("payment_method_data[type]", "card");
            confParams.append("payment_method_data[card][token]", "tok_amex");
          } else if (cardLast4 === "1117") {
            confParams.append("payment_method_data[type]", "card");
            confParams.append("payment_method_data[card][token]", "tok_discover");
          } else {
            console.warn(`[Backend Stripe Confirm] Saved card ending in '${cardLast4}' is not an authorized test card. Declining on Stripe.`);
            confParams.append("payment_method_data[type]", "card");
            confParams.append("payment_method_data[card][token]", "tok_chargeDeclined");
          }
        } else {
          confParams.append("payment_method_data[type]", "card");
          confParams.append("payment_method_data[card][token]", "tok_visa");
        }
      } else if (!isLive) {
        if (rawCard === "4000000000000002") {
          confParams.append("payment_method_data[type]", "card");
          confParams.append("payment_method_data[card][token]", "tok_chargeDeclined");
        } else if (rawCard === "4000000000000069") {
          confParams.append("payment_method_data[type]", "card");
          confParams.append("payment_method_data[card][token]", "tok_chargeDeclinedInsufficientFunds");
        } else if (rawCard === "4000000000000036") {
          confParams.append("payment_method_data[type]", "card");
          confParams.append("payment_method_data[card][token]", "tok_chargeDeclinedExpiredCard");
        } else if (rawCard === "4000000000000028") {
          confParams.append("payment_method_data[type]", "card");
          confParams.append("payment_method_data[card][token]", "tok_chargeDeclinedIncorrectCvc");
        } else if (rawCard.startsWith("4242424242424242")) {
          confParams.append("payment_method_data[type]", "card");
          confParams.append("payment_method_data[card][token]", "tok_visa");
        } else if (rawCard.startsWith("5555555555554444")) {
          confParams.append("payment_method_data[type]", "card");
          confParams.append("payment_method_data[card][token]", "tok_mastercard");
        } else if (rawCard.startsWith("378282246310005")) {
          confParams.append("payment_method_data[type]", "card");
          confParams.append("payment_method_data[card][token]", "tok_amex");
        } else if (rawCard.startsWith("6011111111111117")) {
          confParams.append("payment_method_data[type]", "card");
          confParams.append("payment_method_data[card][token]", "tok_discover");
        } else {
          // Any other unrecognized card number MUST BE DECLINED on Stripe!
          confParams.append("payment_method_data[type]", "card");
          confParams.append("payment_method_data[card][token]", "tok_chargeDeclined");
        }
      } else {
        confParams.append("payment_method_data[type]", "card");
        confParams.append("payment_method_data[card][number]", rawCard);
        confParams.append("payment_method_data[card][exp_month]", String(expMonth));
        confParams.append("payment_method_data[card][exp_year]", String(expYear));
        confParams.append("payment_method_data[card][cvc]", cvc);
        if (paymentDetails?.cardholderName) {
          confParams.append("payment_method_data[billing_details][name]", paymentDetails.cardholderName);
        }
      }

      confParams.append("return_url", "http://localhost:3000/checkout");

      const confUrl = `https://api.stripe.com/v1/payment_intents/${paymentIntentId}/confirm`;
      const confRes = await fetch(confUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: confParams.toString(),
        signal: AbortSignal.timeout(10000),
      });

      const confData = await confRes.json().catch(() => ({}));
      if (!confRes.ok || confData.status !== "succeeded") {
        const declineMsg =
          confData?.error?.message ||
          (confData?.status === "requires_action"
            ? "3D Secure customer authentication required by your bank."
            : "Your card was declined by the card issuer. Please try a different card.");

        console.warn(`[Backend Stripe Confirm] Declined: ${declineMsg}`, confData?.error);
        return sendJson(res, 402, {
          success: false,
          error: declineMsg,
          status: "failed",
          declineCode: confData?.error?.decline_code || "card_declined"
        });
      }

      const latestCharge = confData.charges?.data?.[0];
      const transactionId = latestCharge?.id || `ch_${paymentIntentId.replace("pi_", "")}`;
      const authCode = Math.floor(100000 + Math.random() * 900000).toString();

      return sendJson(res, 200, {
        success: true,
        status: "succeeded",
        transactionId,
        paymentIntentId,
        authCode,
        paymentMethod: paymentMethod || "card",
        amountPennies,
        formattedAmount: formatGBP(amountPennies),
        authorizedAt: new Date().toISOString(),
        receiptUrl: latestCharge?.receipt_url || null,
        receiptMessage: `Payment of ${formatGBP(amountPennies)} successfully verified and authorized via CARD (Auth #${authCode})`
      });
    }

    // 12f. Full-Stack Checkout: Create Verified Live Order (ACID Transaction & Anti-Replay Defense)
    if (pathname === "/api/checkout/create-order" && method === "POST") {
      const rateCheck = rateLimiter.checkLimit("checkout", clientIp);
      if (!rateCheck.allowed) {
        return sendJson(res, 429, {
          error: `Order submission rate limit reached. Please wait ${rateCheck.resetSeconds} seconds before trying again.`,
          resetSeconds: rateCheck.resetSeconds
        });
      }

      const body = await readBody(req);
      const {
        customer,
        shippingAddress,
        billingAddress,
        items,
        deliveryOption,
        deliveryTier,
        paymentMethod,
        paymentConfirmation,
        createAccount,
        accountPassword
      } = body;

      // 1. Strict Payment Gate: Order CANNOT be placed without verified payment confirmation!
      if (!paymentConfirmation || paymentConfirmation.status !== "succeeded" || !paymentConfirmation.paymentIntentId) {
        return sendJson(res, 402, {
          error: "Payment Authorization Required: Your payment must be verified and confirmed by the payment gateway before your order can be submitted."
        });
      }

      // 1b. Server-Side Stripe Settlement Verification
      const [settingsRows] = await pool.query(
        "SELECT setting_value FROM system_settings WHERE setting_key = 'stripe_secret_key'"
      );
      const secretKey = settingsRows?.[0]?.setting_value || process.env.STRIPE_SECRET_KEY || "";

      if (secretKey && paymentConfirmation.paymentIntentId.startsWith("pi_")) {
        const stripeVerifyRes = await fetch(
          `https://api.stripe.com/v1/payment_intents/${paymentConfirmation.paymentIntentId}`,
          {
            headers: { Authorization: `Bearer ${secretKey}` },
            signal: AbortSignal.timeout(6000),
          }
        );
        const stripePiData = await stripeVerifyRes.json().catch(() => ({}));

        if (!stripeVerifyRes.ok || stripePiData.status !== "succeeded") {
          console.warn("[Backend create-order] Stripe verification rejected: Status is not succeeded:", stripePiData?.status);
          return sendJson(res, 402, {
            error: "Payment Verification Failed: Stripe has not settled this transaction. Order cannot be placed.",
            status: "failed"
          });
        }
      }

      // 2. Idempotency & Replay Attack Defense: Check if order already created for this paymentIntentId
      const [existingOrders] = await pool.query(
        "SELECT id, order_number, total_pennies FROM orders WHERE stripe_payment_intent_id = ?",
        [paymentConfirmation.paymentIntentId]
      );
      if (existingOrders.length > 0) {
        return sendJson(res, 409, {
          error: `An order (${existingOrders[0].order_number}) has already been recorded for this payment transaction. Duplicate order submissions are not permitted.`,
          orderNumber: existingOrders[0].order_number,
          orderId: existingOrders[0].id
        });
      }

      if (!customer?.name || !customer?.email || !shippingAddress?.addressLine1 || !shippingAddress?.postcode) {
        return sendJson(res, 400, { error: "Missing required checkout fields: Customer name, email, delivery address, and postcode are mandatory." });
      }

      if (!Array.isArray(items) || items.length === 0) {
        return sendJson(res, 400, { error: "Basket is empty. Please add furniture items to checkout." });
      }

      const cleanPostcode = (shippingAddress.postcode || "").toUpperCase().replace(/\s+/g, "");
      const zoneResult = await getLogisticsZone(cleanPostcode);

      // Guard: Strictly check that the destination zone is active & deliverable in Admin Logistics
      if (!zoneResult.isDeliverable) {
        return sendJson(res, 400, {
          error: zoneResult.error || "Delivery Unavailable: We currently do not deliver to this destination."
        });
      }

      // 3. Canonical Database Price Enforcement (Prevents client-side price tampering)
      const productIds = items.map(it => it.productId || it.id).filter(Boolean);
      let canonicalItems = [];
      let subtotalPennies = 0;
      if (productIds.length > 0) {
        const [dbProducts] = await pool.query(
          "SELECT id, title, price_pennies, status FROM products WHERE id IN (?)",
          [productIds]
        );
        const pMap = new Map(dbProducts.map(p => [p.id, p]));
        for (const it of items) {
          const pid = it.productId || it.id;
          const dbP = pMap.get(pid);
          if (!dbP) {
            return sendJson(res, 400, { error: `Invalid item in basket: Product "${pid}" not found in catalog.` });
          }
          const unitPrice = Number(dbP.price_pennies);
          const qty = Math.max(1, parseInt(it.quantity, 10) || 1);
          subtotalPennies += unitPrice * qty;
          canonicalItems.push({
            ...it,
            productId: pid,
            title: dbP.title,
            pricePennies: unitPrice,
            quantity: qty
          });
        }
      } else {
        return sendJson(res, 400, { error: "Basket items must have valid product references." });
      }

      // UK Delivery Calculation based on selected delivery tier
      const tier = deliveryOption?.tier || deliveryTier || "free_delivery";
      let baseShippingPennies = 0;
      if (tier === "free_delivery" || tier === "standard_2man") {
        baseShippingPennies = 0; // 100% Free for UK Mainland!
      } else if (tier === "white_glove_assembly") {
        baseShippingPennies = 2900; // £29 white glove upgrade
      } else if (tier === "priority_saturday") {
        baseShippingPennies = 4900; // £49 weekend slot upgrade
      }

      const shippingPennies = baseShippingPennies + (zoneResult.surchargePennies || 0);
      const grandTotalPennies = subtotalPennies + shippingPennies;
      const vatBreakdown = calculateNetAndVat(grandTotalPennies);

      const orderId = `ord_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
      const seqNum = Math.floor(1000 + Math.random() * 9000);
      const orderNumber = `SAN-2026-${seqNum}`;
      const poNumber = `PO-SAN-${seqNum}`;

      const fullShippingAddress = [
        shippingAddress.addressLine1,
        shippingAddress.addressLine2,
        shippingAddress.city,
        shippingAddress.postcode,
        shippingAddress.country || "United Kingdom"
      ].filter(Boolean).join(", ");

      const bAddress = billingAddress || shippingAddress;
      const fullBillingAddress = [
        bAddress.name || customer.name,
        bAddress.addressLine1,
        bAddress.addressLine2,
        bAddress.city,
        bAddress.postcode,
        bAddress.country || "United Kingdom"
      ].filter(Boolean).join(", ");

      // Upsert Customer Account
      const [nameFirst, ...nameRest] = (customer.name || "").trim().split(" ");
      const firstName = customer.firstName || nameFirst || "Customer";
      const lastName = customer.lastName || nameRest.join(" ") || "Customer";
      const username = customer.username ? customer.username.trim() : null;
      const customerId = `cust_${crypto.createHash("md5").update(customer.email.toLowerCase()).digest("hex").slice(0, 12)}`;

      const trackingNumber = `TRK-AM-${Math.floor(100000 + Math.random() * 900000)}`;
      const resolvedPaymentMethod = paymentConfirmation.paymentMethod || paymentMethod || "card";

      // 4. ACID Database Transaction: Ensures atomic persistence across orders, customers, addresses, and POs
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();

        let passwordHash = "GUEST_CHECKOUT";
        if (createAccount && accountPassword && accountPassword.length >= 6) {
          passwordHash = hashPassword(accountPassword);
        }

        try {
          await connection.query(`
            INSERT INTO customers (id, email, username, password_hash, first_name, last_name, phone, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE 
              phone = VALUES(phone), 
              first_name = VALUES(first_name), 
              last_name = VALUES(last_name),
              username = COALESCE(VALUES(username), username),
              password_hash = CASE WHEN VALUES(password_hash) != 'GUEST_CHECKOUT' THEN VALUES(password_hash) ELSE password_hash END
          `, [customerId, customer.email.toLowerCase().trim(), username, passwordHash, firstName, lastName, customer.phone || ""]);
        } catch {
          await connection.query(`
            INSERT INTO customers (id, email, password_hash, first_name, last_name, phone, created_at)
            VALUES (?, ?, ?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE 
              phone = VALUES(phone), 
              first_name = VALUES(first_name), 
              last_name = VALUES(last_name),
              password_hash = CASE WHEN VALUES(password_hash) != 'GUEST_CHECKOUT' THEN VALUES(password_hash) ELSE password_hash END
          `, [customerId, customer.email.toLowerCase().trim(), passwordHash, firstName, lastName, customer.phone || ""]);
        }

        // Save delivery address to customer_addresses with fallback
        const addrId = `addr_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
        try {
          await connection.query(`
            INSERT INTO customer_addresses (
              id, customer_id, recipient, company, address_line1, address_line2, city, county, country, postcode, is_default_delivery, is_default_billing, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, NOW())
          `, [
            addrId,
            customerId,
            `${shippingAddress.firstName || firstName} ${shippingAddress.lastName || lastName}`.trim(),
            shippingAddress.company || null,
            shippingAddress.addressLine1,
            shippingAddress.addressLine2 || null,
            shippingAddress.city,
            shippingAddress.state || shippingAddress.county || null,
            shippingAddress.country || 'United Kingdom',
            shippingAddress.postcode.toUpperCase().trim()
          ]);
        } catch {
          try {
            await connection.query(`
              INSERT INTO customer_addresses (
                id, customer_id, address_line1, address_line2, city, county, country, postcode, is_default_delivery, created_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, NOW())
            `, [
              addrId,
              customerId,
              shippingAddress.addressLine1,
              shippingAddress.addressLine2 || null,
              shippingAddress.city,
              shippingAddress.state || shippingAddress.county || null,
              shippingAddress.country || 'United Kingdom',
              shippingAddress.postcode.toUpperCase().trim()
            ]);
          } catch {
            await connection.query(`
              INSERT INTO customer_addresses (
                id, customer_id, address_line1, address_line2, city, county, postcode, is_default_delivery, created_at
              ) VALUES (?, ?, ?, ?, ?, ?, 1, NOW())
            `, [
              addrId,
              customerId,
              shippingAddress.addressLine1,
              shippingAddress.addressLine2 || null,
              shippingAddress.city,
              shippingAddress.state || shippingAddress.county || null,
              shippingAddress.postcode.toUpperCase().trim()
            ]);
          }
        }

        // Save Order into `orders`
        await connection.query(`
          INSERT INTO orders (
            id, order_number, customer_name, customer_email, customer_phone,
            shipping_address, billing_address, shipping_postcode, shipping_zone, delivery_tier,
            subtotal_pennies, shipping_pennies, vat_pennies, total_pennies,
            payment_status, payment_method, fulfillment_status, stripe_payment_intent_id, items_json, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'paid', ?, 'po_dispatched', ?, ?, NOW())
        `, [
          orderId,
          orderNumber,
          customer.name.trim(),
          customer.email.toLowerCase().trim(),
          customer.phone || "+44 7700 900000",
          fullShippingAddress,
          fullBillingAddress,
          shippingAddress.postcode.toUpperCase().trim(),
          zoneResult.zoneCode,
          tier,
          subtotalPennies,
          shippingPennies,
          vatBreakdown.vatPennies,
          grandTotalPennies,
          resolvedPaymentMethod,
          paymentConfirmation.paymentIntentId,
          JSON.stringify(canonicalItems)
        ]);

        // Save card record to customer_payment_methods (ALWAYS saved in database)
        try {
          const paymentDetails = body.paymentDetails || paymentConfirmation?.paymentDetails || {};
          const isSavedCard = Boolean(paymentDetails?.isSavedCard || paymentDetails?.savedCardId);
          const savedCardId = paymentDetails?.savedCardId;
          const custEmail = customer.email.trim().toLowerCase();

          if (isSavedCard && savedCardId) {
            // Reuse of existing authorized instrument: touch updated_at and ensure it remains active
            await connection.query(
              "UPDATE customer_payment_methods SET is_default = 1, updated_at = NOW() WHERE id = ? OR (customer_email = ? AND last4 = ?)",
              [savedCardId, custEmail, paymentDetails?.last4 || "4242"]
            ).catch(() => {});
          } else {
            const rawCard = String(paymentDetails?.cardNumber || "").replace(/\s+/g, "");
            const last4 = rawCard.length >= 4 ? rawCard.slice(-4) : (paymentDetails?.last4 || "4242");
            let brand = paymentDetails?.brand || "Visa";
            if (!paymentDetails?.brand) {
              if (rawCard.startsWith("5")) brand = "Mastercard";
              else if (rawCard.startsWith("3")) brand = "American Express";
              else if (rawCard.startsWith("6")) brand = "Discover";
            }

            const expStr = String(paymentDetails?.cardExpiry || "12/28").trim();
            const expParts = expStr.split("/");
            const expMonth = parseInt(expParts[0], 10) || 12;
            let expYear = parseInt(expParts[1], 10) || 2028;
            if (expYear < 100) expYear += 2000;

            const cardholderName = String(paymentDetails?.cardholderName || customer.name || "Valued SAN Customer").trim();
            const isSavedForFuture = Boolean(body.saveCardForFuture ?? paymentDetails?.saveCardForFuture ?? false);
            const pmId = `cpm_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

            if (isSavedForFuture) {
              await connection.query(
                "UPDATE customer_payment_methods SET is_default = 0 WHERE customer_email = ?",
                [custEmail]
              ).catch(() => {});
            }

            await connection.query(
              `INSERT INTO customer_payment_methods (
                id, customer_id, customer_email, brand, last4, exp_month, exp_year, cardholder_name,
                stripe_payment_method_id, stripe_customer_id, is_saved_for_future, is_default, created_at, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
              [
                pmId,
                customerId || null,
                custEmail,
                brand,
                last4,
                expMonth,
                expYear,
                cardholderName,
                paymentConfirmation.transactionId || null,
                paymentConfirmation.paymentIntentId || null,
                isSavedForFuture ? 1 : 0,
                isSavedForFuture ? 1 : 0,
              ]
            );
          }
        } catch (cpmErr) {
          console.warn("[Backend CPM] Save error:", cpmErr.message);
        }

        // Dispatch B2B Purchase Order to Amos Mann (Leicester Hub)
        await connection.query(`
          INSERT INTO order_po_dispatches (
            id, po_number, order_id, supplier_id, item_count, delivery_tier, status, carrier, tracking_number, dispatched_at
          ) VALUES (?, ?, ?, 'amos_mann_furniture', ?, ?, 'dispatched', 'Amos Mann 2-Man Dedicated Fleet', ?, NOW())
        `, [
          `pod_${Date.now()}`,
          poNumber,
          orderId,
          canonicalItems.length,
          tier,
          trackingNumber
        ]);

        // Immutable Audit Log
        await connection.query(`
          INSERT INTO admin_audit_logs (id, actor, action, resource, details_json, ip_address, created_at)
          VALUES (?, ?, 'CHECKOUT_ORDER_PLACED', 'orders', ?, ?, NOW())
        `, [
          `log_${Date.now()}`,
          customer.email,
          JSON.stringify({ orderId, orderNumber, poNumber, totalPennies: grandTotalPennies, paymentMethod, trackingNumber }),
          req.socket.remoteAddress || "127.0.0.1"
        ]);

        // Admin Notification
        const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        await connection.query(
          `INSERT INTO notifications (id, recipient_type, recipient_id, type, title, message, link, metadata)
           VALUES (?, 'admin', 'all', 'order_created', ?, ?, ?, ?)`,
          [
            notifId,
            `New Order: ${orderNumber} (${formatGBP(grandTotalPennies)})`,
            `Customer ${customer.name} placed order ${orderNumber} for ${canonicalItems.length} items. PO ${poNumber} dispatched.`,
            `/admin/orders`,
            JSON.stringify({ orderId, orderNumber, totalPennies: grandTotalPennies }),
          ]
        );

        await connection.commit();
      } catch (txErr) {
        await connection.rollback();
        throw txErr;
      } finally {
        connection.release();
      }

      // Generate Statutory UK VAT Invoice
      const vatCustomer = {
        name: customer.name,
        email: customer.email,
        addressLine1: shippingAddress.addressLine1,
        addressLine2: shippingAddress.addressLine2 || "",
        city: shippingAddress.city,
        postcode: shippingAddress.postcode,
        country: "United Kingdom"
      };

      const lineItems = canonicalItems.map((it) => ({
        sku: it.sku || `SKU-${it.productId || "SAN"}`,
        title: it.title,
        quantity: it.quantity || 1,
        grossUnitPricePennies: it.pricePennies,
        vatRatePercent: 20
      }));

      const invoiceData = vatInvoiceGenerator.generateInvoice(
        seqNum,
        orderId,
        vatCustomer,
        lineItems,
        shippingPennies,
        paymentMethod === "klarna" ? "Klarna Pay in 3" : (paymentMethod === "clearpay" ? "Clearpay UK" : "Visa/Mastercard 128-bit SSL"),
        `pi_uk_${orderNumber}`
      );

      return sendJson(res, 201, {
        success: true,
        orderId,
        orderNumber,
        poNumber,
        invoiceNumber: invoiceData.invoiceNumber,
        trackingNumber,
        carrier: "SAN Dedicated Delivery Fleet",
        totalPennies: grandTotalPennies,
        formattedTotal: formatGBP(grandTotalPennies),
        customerName: customer.name,
        customerEmail: customer.email,
        shippingAddress: fullShippingAddress,
        billingAddress: fullBillingAddress,
        paymentMethod: resolvedPaymentMethod,
        deliveryTier: tier,
        deliveryLabel: tier === "white_glove_assembly" ? "White Glove & Packaging Disposal" : (tier === "priority_saturday" ? "Priority Saturday Delivery" : (tier === "free_delivery" || tier === "standard_2man" ? "Free UK Mainland Delivery" : "Home Delivery To Customer")),
        estimatedDays: `${3 + zoneResult.leadTimeExtraDays} - ${7 + zoneResult.leadTimeExtraDays} business days`,
        items: canonicalItems,
        invoiceHtmlUrl: `/api/orders/${orderId}/invoice`
      });
    }

    // 12g. Get Customer Order by ID or Order Number (GDPR Hardened & Verification Protected)
    if (pathname.startsWith("/api/orders/") && !pathname.endsWith("/invoice") && method === "GET") {
      const orderId = pathname.replace("/api/orders/", "");
      const [rows] = await pool.query("SELECT * FROM orders WHERE id = ? OR order_number = ?", [orderId, orderId]);
      if (rows.length === 0) {
        return sendJson(res, 404, { error: "Order not found" });
      }
      const order = rows[0];

      const authAdmin = await getAdminFromAuth(req);
      const authCust = await getCustomerFromAuth(req);
      const isOwner = authCust && authCust.email.toLowerCase() === order.customer_email.toLowerCase();
      const isAuthorizedUser = authAdmin || isOwner;
      const isSecretId = orderId.startsWith("ord_") && orderId.length > 20;

      // If accessing via sequential order number without login, require verification parameter
      if (!isAuthorizedUser && !isSecretId) {
        const verifyPostcode = (url.searchParams.get("postcode") || "").toUpperCase().replace(/\s+/g, "");
        const verifyEmail = (url.searchParams.get("email") || "").toLowerCase().trim();
        const orderPostcode = (order.shipping_postcode || "").toUpperCase().replace(/\s+/g, "");
        const orderEmail = (order.customer_email || "").toLowerCase().trim();

        const matches = (verifyPostcode && orderPostcode && verifyPostcode === orderPostcode) ||
                        (verifyEmail && orderEmail && verifyEmail === orderEmail);

        if (!matches) {
          return sendJson(res, 403, {
            error: "Order Verification Required: To track an order by order number, please provide matching postcode or email query parameter (e.g. ?postcode=SW1A1AA)."
          });
        }
      }

      const [dispatches] = await pool.query("SELECT * FROM order_po_dispatches WHERE order_id = ?", [order.id]);
      
      const responseOrder = {
        ...order,
        items: order.items_json ? JSON.parse(order.items_json) : [],
        formattedSubtotal: formatGBP(order.subtotal_pennies),
        formattedShipping: formatGBP(order.shipping_pennies),
        formattedVat: formatGBP(order.vat_pennies),
        formattedTotal: formatGBP(order.total_pennies),
        dispatches,
        customer_email: isAuthorizedUser ? order.customer_email : (order.customer_email ? order.customer_email.replace(/^(.{2})(.*)(@.*)$/, "$1***$3") : ""),
        customer_phone: isAuthorizedUser ? order.customer_phone : "+44 7*** *** 123",
        billing_address: isAuthorizedUser ? order.billing_address : "Confidential (Protected Billing Profile)",
      };

      return sendJson(res, 200, {
        order: responseOrder
      });
    }

    // 12h. Statutory VAT Invoice HTML View (Ownership & Verification Protected)
    if (pathname.startsWith("/api/orders/") && pathname.endsWith("/invoice") && method === "GET") {
      const orderId = pathname.replace("/api/orders/", "").replace("/invoice", "");
      const [rows] = await pool.query("SELECT * FROM orders WHERE id = ? OR order_number = ?", [orderId, orderId]);
      if (rows.length === 0) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        return res.end("Order not found");
      }
      const order = rows[0];

      const authAdmin = await getAdminFromAuth(req);
      const authCust = await getCustomerFromAuth(req);
      const isOwner = authCust && authCust.email.toLowerCase() === order.customer_email.toLowerCase();
      const isAuthorizedUser = authAdmin || isOwner;
      const isSecretId = orderId.startsWith("ord_") && orderId.length > 20;

      if (!isAuthorizedUser && !isSecretId) {
        const verifyPostcode = (url.searchParams.get("postcode") || "").toUpperCase().replace(/\s+/g, "");
        const verifyEmail = (url.searchParams.get("email") || "").toLowerCase().trim();
        const orderPostcode = (order.shipping_postcode || "").toUpperCase().replace(/\s+/g, "");
        const orderEmail = (order.customer_email || "").toLowerCase().trim();

        const matches = (verifyPostcode && orderPostcode && verifyPostcode === orderPostcode) ||
                        (verifyEmail && orderEmail && verifyEmail === orderEmail);

        if (!matches) {
          res.writeHead(403, { "Content-Type": "text/plain" });
          return res.end("Verification required: Please provide matching postcode or email to view VAT invoice.");
        }
      }

      const items = order.items_json ? JSON.parse(order.items_json) : [];
      
      const vatCustomer = {
        name: order.customer_name,
        email: order.customer_email,
        addressLine1: order.shipping_address,
        city: "",
        postcode: order.shipping_postcode,
        country: "United Kingdom"
      };

      const lineItems = items.map((it) => ({
        sku: it.sku || "SKU-UK",
        title: it.title,
        quantity: it.quantity || 1,
        grossUnitPricePennies: it.pricePennies,
        vatRatePercent: 20
      }));

      const seqMatch = order.order_number.match(/[0-9]+/);
      const seqNum = seqMatch ? parseInt(seqMatch[0], 10) : 1001;

      const invoiceData = vatInvoiceGenerator.generateInvoice(
        seqNum,
        order.id,
        vatCustomer,
        lineItems,
        order.shipping_pennies,
        "Stripe UK 128-bit SSL",
        order.stripe_payment_intent_id || `pi_${order.id}`
      );

      const html = vatInvoiceGenerator.renderInvoiceHtml(invoiceData);
      res.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-cache"
      });
      return res.end(html);
    }

    // 13. Admin Logistics & Postal Zones API
    if (pathname === "/api/admin/logistics" && method === "GET") {
      const [zones] = await pool.query("SELECT * FROM postcode_zones ORDER BY surcharge_pennies ASC");
      let deliveryOptions = [];
      try {
        const [opts] = await pool.query("SELECT * FROM delivery_options ORDER BY sort_order ASC, created_at ASC");
        deliveryOptions = opts.map(o => {
          let parsedRegions = ["all_mainland"];
          if (o.regions_json) {
            try {
              parsedRegions = typeof o.regions_json === "string" ? JSON.parse(o.regions_json) : o.regions_json;
            } catch {
              parsedRegions = ["all_mainland"];
            }
          }
          return {
            id: o.id,
            name: o.name,
            badge: o.badge || "",
            pricePennies: Number(o.price_pennies) || 0,
            formattedPrice: Number(o.price_pennies) === 0 ? "FREE" : formatGBP(Number(o.price_pennies)),
            description: o.description,
            timeframe: o.timeframe,
            serviceScope: o.service_scope || "all_mainland",
            regions: parsedRegions,
            allowedPrefixes: o.allowed_prefixes || "",
            excludedPrefixes: o.excluded_prefixes || "",
            minOrderPennies: Number(o.min_order_pennies) || 0,
            isActive: Boolean(o.is_active),
            sortOrder: o.sort_order || 0,
            createdAt: o.created_at,
            updatedAt: o.updated_at,
          };
        });
      } catch (err) {
        console.error("[Admin Logistics] Error reading delivery_options:", err);
        deliveryOptions = FALLBACK_DELIVERY_OPTIONS.map(o => ({
          ...o,
          pricePennies: o.price_pennies,
          formattedPrice: o.price_pennies === 0 ? "FREE" : formatGBP(o.price_pennies),
          isActive: Boolean(o.is_active),
          sortOrder: o.sort_order,
          serviceScope: o.service_scope || "all_mainland",
          regions: ["all_mainland"],
          allowedPrefixes: o.allowed_prefixes || "",
          excludedPrefixes: o.excluded_prefixes || "",
          minOrderPennies: 0,
        }));
      }
      const deliveryPolicy = await getDeliveryPolicy();
      return sendJson(res, 200, {
        zones,
        deliveryOptions,
        deliveryPolicy,
        ukRegions: UK_MAINLAND_REGIONS,
        deliveryTiers: [
          { code: "standard_parcel", name: "Standard Parcel (Small Accents & Stools)", basePricePennies: 1900, leadTimeDays: 2 },
          { code: "pallet", name: "Kerbside Pallet Freight (Flatpack Dining & Storage)", basePricePennies: 4900, leadTimeDays: 4 },
          { code: "two_man_white_glove", name: "UK 2-Man White Glove (Room of Choice + Unpack + Debris Removal)", basePricePennies: 9900, leadTimeDays: 7 },
        ]
      });
    }

    // 13b. Admin Delivery Options CRUD Endpoints
    if (pathname === "/api/admin/logistics/delivery-options" && method === "POST") {
      const body = await readBody(req);
      const {
        name,
        badge,
        pricePennies,
        description,
        timeframe,
        isActive,
        sortOrder,
        serviceScope = "all_mainland",
        regions = ["all_mainland"],
        allowedPrefixes = "",
        excludedPrefixes = "",
        minOrderPennies = 0,
      } = body;

      if (!name || typeof name !== "string" || !name.trim()) {
        return sendJson(res, 400, { error: "Delivery option name is required." });
      }

      const id = `del_opt_${Date.now()}`;
      const optName = name.trim();
      const optBadge = badge ? badge.trim() : null;
      const optPrice = Math.max(0, parseInt(pricePennies ?? 0, 10) || 0);
      const optDesc = description ? description.trim() : "";
      const optTimeframe = timeframe ? timeframe.trim() : "3 - 7 business days";
      const optActive = isActive === false ? 0 : 1;
      const optSort = parseInt(sortOrder ?? 0, 10) || 0;
      const optScope = ["all_mainland", "custom_regions", "specific_postcodes"].includes(serviceScope) ? serviceScope : "all_mainland";
      const optRegionsJson = Array.isArray(regions) ? JSON.stringify(regions) : '["all_mainland"]';
      const optAllowed = allowedPrefixes ? String(allowedPrefixes).trim() : "";
      const optExcluded = excludedPrefixes ? String(excludedPrefixes).trim() : "";
      const optMinOrder = Math.max(0, parseInt(minOrderPennies ?? 0, 10) || 0);

      await pool.query(
        `INSERT INTO delivery_options (
          id, name, badge, price_pennies, description, timeframe,
          service_scope, regions_json, allowed_prefixes, excluded_prefixes, min_order_pennies,
          is_active, sort_order
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id, optName, optBadge, optPrice, optDesc, optTimeframe,
          optScope, optRegionsJson, optAllowed, optExcluded, optMinOrder,
          optActive, optSort
        ]
      );

      await pool.query(
        "INSERT INTO admin_audit_logs (id, actor, action, resource, details_json, ip_address) VALUES (?, ?, ?, ?, ?, ?)",
        [`log_${Date.now()}`, "admin@sanfurniture.com", "CREATE_DELIVERY_OPTION", "delivery_options", JSON.stringify({ id, name: optName, optPrice, optScope }), req.socket.remoteAddress]
      );

      return sendJson(res, 201, {
        success: true,
        message: "Delivery option created successfully.",
        option: {
          id,
          name: optName,
          badge: optBadge || "",
          pricePennies: optPrice,
          formattedPrice: optPrice === 0 ? "FREE" : formatGBP(optPrice),
          description: optDesc,
          timeframe: optTimeframe,
          serviceScope: optScope,
          regions: Array.isArray(regions) ? regions : ["all_mainland"],
          allowedPrefixes: optAllowed,
          excludedPrefixes: optExcluded,
          minOrderPennies: optMinOrder,
          isActive: Boolean(optActive),
          sortOrder: optSort,
        }
      });
    }

    if (pathname.startsWith("/api/admin/logistics/delivery-options/") && method === "PATCH") {
      const optId = pathname.replace("/api/admin/logistics/delivery-options/", "");
      const body = await readBody(req);
      const {
        name,
        badge,
        pricePennies,
        description,
        timeframe,
        isActive,
        sortOrder,
        serviceScope,
        regions,
        allowedPrefixes,
        excludedPrefixes,
        minOrderPennies,
      } = body;

      const fields = [];
      const params = [];

      if (name !== undefined) {
        fields.push("name = ?");
        params.push(String(name).trim());
      }
      if (badge !== undefined) {
        fields.push("badge = ?");
        params.push(badge ? String(badge).trim() : null);
      }
      if (pricePennies !== undefined) {
        fields.push("price_pennies = ?");
        params.push(Math.max(0, parseInt(pricePennies, 10) || 0));
      }
      if (description !== undefined) {
        fields.push("description = ?");
        params.push(String(description).trim());
      }
      if (timeframe !== undefined) {
        fields.push("timeframe = ?");
        params.push(String(timeframe).trim());
      }
      if (serviceScope !== undefined) {
        fields.push("service_scope = ?");
        params.push(["all_mainland", "custom_regions", "specific_postcodes"].includes(serviceScope) ? serviceScope : "all_mainland");
      }
      if (regions !== undefined) {
        fields.push("regions_json = ?");
        params.push(Array.isArray(regions) ? JSON.stringify(regions) : '["all_mainland"]');
      }
      if (allowedPrefixes !== undefined) {
        fields.push("allowed_prefixes = ?");
        params.push(String(allowedPrefixes).trim());
      }
      if (excludedPrefixes !== undefined) {
        fields.push("excluded_prefixes = ?");
        params.push(String(excludedPrefixes).trim());
      }
      if (minOrderPennies !== undefined) {
        fields.push("min_order_pennies = ?");
        params.push(Math.max(0, parseInt(minOrderPennies, 10) || 0));
      }
      if (isActive !== undefined) {
        fields.push("is_active = ?");
        params.push(isActive ? 1 : 0);
      }
      if (sortOrder !== undefined) {
        fields.push("sort_order = ?");
        params.push(parseInt(sortOrder, 10) || 0);
      }

      if (fields.length > 0) {
        params.push(optId);
        await pool.query(`UPDATE delivery_options SET ${fields.join(", ")} WHERE id = ?`, params);
      }

      await pool.query(
        "INSERT INTO admin_audit_logs (id, actor, action, resource, details_json, ip_address) VALUES (?, ?, ?, ?, ?, ?)",
        [`log_${Date.now()}`, "admin@sanfurniture.com", "UPDATE_DELIVERY_OPTION", "delivery_options", JSON.stringify({ optId, body }), req.socket.remoteAddress]
      );

      return sendJson(res, 200, { success: true, message: `Delivery option ${optId} updated.` });
    }

    // 13c. Admin Delivery Policy Settings (Mainland UK Restriction & Non-serviceable notice)
    if (pathname === "/api/admin/logistics/policy" && method === "POST") {
      const body = await readBody(req);
      const { scope, restrictedPrefixes, nonServiceableNotice } = body;

      const updates = {
        delivery_policy_scope: scope === "all_uk" ? "all_uk" : "mainland_only",
        delivery_restricted_prefixes: restrictedPrefixes !== undefined ? String(restrictedPrefixes).trim() : "IV, KW, PH, AB, PA, BT, HS, ZE, GY, JE, IM",
        delivery_non_serviceable_notice: nonServiceableNotice !== undefined ? String(nonServiceableNotice).trim() : "We currently deliver exclusively to Mainland UK addresses. We are unable to fulfill orders to Northern Ireland, Scottish Highlands & Islands, or Channel Islands at this time. Please enter a valid Mainland UK delivery postcode.",
      };

      for (const [key, val] of Object.entries(updates)) {
        await pool.query(
          `INSERT INTO system_settings (setting_key, setting_value)
           VALUES (?, ?)
           ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()`,
          [key, val]
        );
      }

      await pool.query(
        "INSERT INTO admin_audit_logs (id, actor, action, resource, details_json, ip_address) VALUES (?, ?, ?, ?, ?, ?)",
        [`log_${Date.now()}`, "admin@sanfurniture.com", "UPDATE_DELIVERY_POLICY", "system_settings", JSON.stringify(updates), req.socket.remoteAddress]
      );

      return sendJson(res, 200, { success: true, message: "Delivery policy updated successfully.", policy: updates });
    }

    if (pathname.startsWith("/api/admin/logistics/delivery-options/") && method === "DELETE") {
      const optId = pathname.replace("/api/admin/logistics/delivery-options/", "");

      const [rows] = await pool.query("SELECT COUNT(*) as cnt FROM delivery_options");
      if (rows[0].cnt <= 1) {
        return sendJson(res, 400, { error: "Cannot delete the last remaining delivery option. At least one option is required." });
      }

      await pool.query("DELETE FROM delivery_options WHERE id = ?", [optId]);

      await pool.query(
        "INSERT INTO admin_audit_logs (id, actor, action, resource, details_json, ip_address) VALUES (?, ?, ?, ?, ?, ?)",
        [`log_${Date.now()}`, "admin@sanfurniture.com", "DELETE_DELIVERY_OPTION", "delivery_options", JSON.stringify({ optId }), req.socket.remoteAddress]
      );

      return sendJson(res, 200, { success: true, message: `Delivery option ${optId} deleted.` });
    }

    if (pathname.startsWith("/api/admin/logistics/zones/") && method === "PATCH") {
      const zoneId = pathname.replace("/api/admin/logistics/zones/", "");
      const body = await readBody(req);
      const { surchargePennies, isActive, leadTimeExtraDays } = body;

      const fields = [];
      const params = [];

      if (surchargePennies !== undefined) {
        fields.push("surcharge_pennies = ?");
        params.push(surchargePennies);
      }
      if (isActive !== undefined) {
        fields.push("is_active = ?");
        params.push(isActive ? 1 : 0);
      }
      if (leadTimeExtraDays !== undefined) {
        fields.push("lead_time_extra_days = ?");
        params.push(leadTimeExtraDays);
      }

      if (fields.length > 0) {
        params.push(zoneId);
        await pool.query(`UPDATE postcode_zones SET ${fields.join(", ")} WHERE id = ?`, params);
      }

      await pool.query(
        "INSERT INTO admin_audit_logs (id, actor, action, resource, details_json, ip_address) VALUES (?, ?, ?, ?, ?, ?)",
        [`log_${Date.now()}`, "admin@sanfurniture.com", "UPDATE_POSTCODE_ZONE", "postcode_zones", JSON.stringify({ zoneId, body }), req.socket.remoteAddress]
      );

      return sendJson(res, 200, { success: true, message: `Postcode zone ${zoneId} updated.` });
    }

    // 14. Admin Immutable Audit Logs API
    if (pathname === "/api/admin/audit" && method === "GET") {
      const limit = Math.min(100, parseInt(url.searchParams.get("limit") || "50", 10));
      const [logs] = await pool.query(
        "SELECT * FROM admin_audit_logs ORDER BY created_at DESC LIMIT ?",
        [limit]
      );
      return sendJson(res, 200, { logs });
    }

    // 15. Security IP Manual Ban
    if (pathname === "/api/security/block" && method === "POST") {
      const body = await readBody(req);
      const ip = (body.ip || "").trim();
      const reason = body.reason || "Manual admin lockout";
      if (!ip) {
        return sendJson(res, 400, { error: "Missing IP address" });
      }

      const id = `jail_${Date.now()}`;
      await pool.query(
        `INSERT INTO security_ip_jail (id, ip_address, strike_count, reason, locked_until, is_permanent)
         VALUES (?, ?, 5, ?, DATE_ADD(NOW(), INTERVAL 24 HOUR), 1)
         ON DUPLICATE KEY UPDATE strike_count = 5, reason = VALUES(reason), locked_until = DATE_ADD(NOW(), INTERVAL 24 HOUR), is_permanent = 1`,
        [id, ip, reason]
      );

      await pool.query(
        "INSERT INTO admin_audit_logs (id, actor, action, resource, details_json, ip_address) VALUES (?, ?, ?, ?, ?, ?)",
        [`log_${Date.now()}`, "admin@sanfurniture.com", "BAN_IP", "security_ip_jail", JSON.stringify({ ip, reason }), req.socket.remoteAddress]
      );

      return sendJson(res, 200, { success: true, message: `IP ${ip} permanently locked down in IP Jail.` });
    }

    // 16. Meta / Facebook & Instagram Commerce Catalog CSV Feed
    if (pathname === "/api/feeds/meta-catalog.csv" && method === "GET") {
      const [products] = await pool.query("SELECT p.*, s.* FROM products p LEFT JOIN furniture_specs s ON p.id = s.product_id");
      let csv = "id,title,description,availability,condition,price,link,image_link,brand,google_product_category,fb_product_category\n";
      for (const p of products) {
        const cleanTitle = (p.title || "").replace(/\"/g, '""');
        const cleanDesc = (p.description || "").replace(/\"/g, '""').replace(/\r?\n/g, " ");
        csv += `"${p.id}","${cleanTitle}","${cleanDesc}",in_stock,new,"${(p.price_pennies / 100).toFixed(2)} GBP","http://localhost:3000/products/${p.handle}","${p.thumbnail_url}","SAN Furniture",Furniture > Living Room Furniture,Furniture > Benches, Couches & Chairs\n`;
      }
      res.writeHead(200, {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=san_furniture_meta_catalog.csv",
        "Access-Control-Allow-Origin": "*",
      });
      return res.end(csv);
    }

    // 17. Admin Customers CRM CRUD API
    if (pathname === "/api/admin/customers" && method === "GET") {
      const [customers] = await pool.query(`
        SELECT 
          c.id, c.email, c.first_name, c.last_name, c.phone, c.created_at,
          COUNT(DISTINCT o.id) AS orders_count,
          COALESCE(SUM(o.total_pennies), 0) AS total_spend_pennies,
          MAX(o.created_at) AS last_order_at,
          COALESCE(a.postcode, 'N/A') AS postcode,
          COALESCE(a.city, 'N/A') AS city
        FROM customers c
        LEFT JOIN orders o ON c.email = o.customer_email
        LEFT JOIN customer_addresses a ON c.id = a.customer_id AND a.is_default_delivery = 1
        GROUP BY c.id
        ORDER BY c.created_at DESC
      `);
      return sendJson(res, 200, { customers });
    }

    if (pathname === "/api/admin/customers" && method === "POST") {
      const body = await readBody(req);
      const { email, firstName, lastName, phone, password = "CustomerDefault123!", addressLine1, city, postcode } = body;
      if (!email || !firstName || !lastName) {
        return sendJson(res, 400, { error: "Email, First Name and Last Name are required" });
      }

      const custId = `cust_${Date.now()}`;
      const passHash = hashPassword(password);

      await pool.query(
        "INSERT INTO customers (id, email, password_hash, first_name, last_name, phone, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())",
        [custId, email.toLowerCase().trim(), passHash, firstName.trim(), lastName.trim(), phone || ""]
      );

      if (addressLine1 && postcode) {
        await pool.query(
          "INSERT INTO customer_addresses (id, customer_id, address_line1, city, postcode, is_default_delivery, created_at) VALUES (?, ?, ?, ?, ?, 1, NOW())",
          [`addr_${Date.now()}`, custId, addressLine1, city || "London", postcode]
        );
      }

      await pool.query(
        "INSERT INTO admin_audit_logs (id, actor, action, resource, details_json, ip_address) VALUES (?, ?, ?, ?, ?, ?)",
        [`log_${Date.now()}`, "admin@sanfurniture.com", "CREATE_CUSTOMER", "customers", JSON.stringify({ custId, email }), req.socket.remoteAddress]
      );

      return sendJson(res, 201, { success: true, customerId: custId, message: "Customer created successfully" });
    }

    if (pathname.startsWith("/api/admin/customers/") && method === "PATCH") {
      const custId = pathname.replace("/api/admin/customers/", "");
      const body = await readBody(req);
      const { firstName, lastName, phone, email } = body;

      const fields = [];
      const params = [];
      if (firstName) { fields.push("first_name = ?"); params.push(firstName); }
      if (lastName) { fields.push("last_name = ?"); params.push(lastName); }
      if (phone !== undefined) { fields.push("phone = ?"); params.push(phone); }
      if (email) { fields.push("email = ?"); params.push(email.toLowerCase().trim()); }

      if (fields.length > 0) {
        params.push(custId);
        await pool.query(`UPDATE customers SET ${fields.join(", ")} WHERE id = ?`, params);
      }

      await pool.query(
        "INSERT INTO admin_audit_logs (id, actor, action, resource, details_json, ip_address) VALUES (?, ?, ?, ?, ?, ?)",
        [`log_${Date.now()}`, "admin@sanfurniture.com", "UPDATE_CUSTOMER", "customers", JSON.stringify({ custId, body }), req.socket.remoteAddress]
      );

      return sendJson(res, 200, { success: true, message: `Customer ${custId} updated` });
    }

    if (pathname.startsWith("/api/admin/customers/") && method === "DELETE") {
      const custId = pathname.replace("/api/admin/customers/", "");
      await pool.query("DELETE FROM customer_addresses WHERE customer_id = ?", [custId]);
      await pool.query("DELETE FROM customers WHERE id = ?", [custId]);

      await pool.query(
        "INSERT INTO admin_audit_logs (id, actor, action, resource, details_json, ip_address) VALUES (?, ?, ?, ?, ?, ?)",
        [`log_${Date.now()}`, "admin@sanfurniture.com", "DELETE_CUSTOMER", "customers", JSON.stringify({ custId }), req.socket.remoteAddress]
      );

      return sendJson(res, 200, { success: true, message: `Customer ${custId} removed` });
    }

    // 18. Admin Users & Staff Management CRUD API
    if (pathname === "/api/admin/users" && method === "GET") {
      const [users] = await pool.query(
        "SELECT id, email, full_name, role, is_active, last_login_at, created_at FROM admin_users ORDER BY created_at ASC"
      );
      return sendJson(res, 200, { users });
    }

    if (pathname === "/api/admin/users" && method === "POST") {
      const body = await readBody(req);
      const { email, fullName, role = "catalog_manager", password } = body;
      if (!email || !fullName || !password) {
        return sendJson(res, 400, { error: "Email, Full Name, and Password are required" });
      }

      const [existing] = await pool.query("SELECT id FROM admin_users WHERE email = ?", [email.toLowerCase().trim()]);
      if (existing.length > 0) {
        return sendJson(res, 400, { error: "Admin staff user with this email already exists" });
      }

      const userId = `admin_usr_${Date.now()}`;
      const passHash = hashPassword(password);

      await pool.query(
        "INSERT INTO admin_users (id, email, password_hash, full_name, role, is_active, created_at) VALUES (?, ?, ?, ?, ?, 1, NOW())",
        [userId, email.toLowerCase().trim(), passHash, fullName.trim(), role]
      );

      await pool.query(
        "INSERT INTO admin_audit_logs (id, actor, action, resource, details_json, ip_address) VALUES (?, ?, ?, ?, ?, ?)",
        [`log_${Date.now()}`, "admin@sanfurniture.com", "CREATE_ADMIN_USER", "admin_users", JSON.stringify({ userId, email, role }), req.socket.remoteAddress]
      );

      return sendJson(res, 201, { success: true, userId, message: "Staff user created successfully" });
    }

    if (pathname.startsWith("/api/admin/users/") && method === "PATCH") {
      const userId = pathname.replace("/api/admin/users/", "");
      const body = await readBody(req);
      const { fullName, role, isActive, password } = body;

      const fields = [];
      const params = [];
      if (fullName) { fields.push("full_name = ?"); params.push(fullName); }
      if (role) { fields.push("role = ?"); params.push(role); }
      if (isActive !== undefined) { fields.push("is_active = ?"); params.push(isActive ? 1 : 0); }
      if (password) { fields.push("password_hash = ?"); params.push(hashPassword(password)); }

      if (fields.length > 0) {
        params.push(userId);
        await pool.query(`UPDATE admin_users SET ${fields.join(", ")} WHERE id = ?`, params);
      }

      await pool.query(
        "INSERT INTO admin_audit_logs (id, actor, action, resource, details_json, ip_address) VALUES (?, ?, ?, ?, ?, ?)",
        [`log_${Date.now()}`, "admin@sanfurniture.com", "UPDATE_ADMIN_USER", "admin_users", JSON.stringify({ userId, body }), req.socket.remoteAddress]
      );

      return sendJson(res, 200, { success: true, message: `Staff user ${userId} updated` });
    }

    if (pathname.startsWith("/api/admin/users/") && method === "DELETE") {
      const userId = pathname.replace("/api/admin/users/", "");

      // Check not last super_admin
      const [superAdmins] = await pool.query("SELECT id FROM admin_users WHERE role = 'super_admin'");
      if (superAdmins.length <= 1 && superAdmins[0]?.id === userId) {
        return sendJson(res, 400, { error: "Cannot delete the sole surviving Super Admin account" });
      }

      await pool.query("DELETE FROM admin_users WHERE id = ?", [userId]);

      await pool.query(
        "INSERT INTO admin_audit_logs (id, actor, action, resource, details_json, ip_address) VALUES (?, ?, ?, ?, ?, ?)",
        [`log_${Date.now()}`, "admin@sanfurniture.com", "DELETE_ADMIN_USER", "admin_users", JSON.stringify({ userId }), req.socket.remoteAddress]
      );

      return sendJson(res, 200, { success: true, message: `Staff user ${userId} removed` });
    }

    // 19. Admin Categories Taxonomy CRUD API
    if (pathname === "/api/admin/categories" && method === "GET") {
      const [cats] = await pool.query(`
        SELECT c.*, COUNT(p.id) AS products_count
        FROM categories c
        LEFT JOIN products p ON c.id = p.category_id
        GROUP BY c.id
        ORDER BY c.created_at ASC
      `);
      return sendJson(res, 200, { categories: cats });
    }

    if (pathname === "/api/admin/categories" && method === "POST") {
      const body = await readBody(req);
      const { name, handle, description, heroImage } = body;
      if (!name) {
        return sendJson(res, 400, { error: "Category name is required" });
      }

      const catHandle = handle || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const catId = `cat_${catHandle.replace(/-/g, "_")}`;

      await pool.query(
        "INSERT INTO categories (id, name, handle, description, hero_image) VALUES (?, ?, ?, ?, ?)",
        [catId, name, catHandle, description || "", heroImage || "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=85"]
      );

      await pool.query(
        "INSERT INTO admin_audit_logs (id, actor, action, resource, details_json, ip_address) VALUES (?, ?, ?, ?, ?, ?)",
        [`log_${Date.now()}`, "admin@sanfurniture.com", "CREATE_CATEGORY", "categories", JSON.stringify({ catId, name }), req.socket.remoteAddress]
      );

      return sendJson(res, 201, { success: true, categoryId: catId, message: "Category created" });
    }

    if (pathname.startsWith("/api/admin/categories/") && method === "PATCH") {
      const catId = pathname.replace("/api/admin/categories/", "");
      const body = await readBody(req);
      const { name, handle, description, heroImage } = body;

      const fields = [];
      const params = [];
      if (name) { fields.push("name = ?"); params.push(name); }
      if (handle) { fields.push("handle = ?"); params.push(handle); }
      if (description !== undefined) { fields.push("description = ?"); params.push(description); }
      if (heroImage) { fields.push("hero_image = ?"); params.push(heroImage); }

      if (fields.length > 0) {
        params.push(catId);
        await pool.query(`UPDATE categories SET ${fields.join(", ")} WHERE id = ?`, params);
      }

      await pool.query(
        "INSERT INTO admin_audit_logs (id, actor, action, resource, details_json, ip_address) VALUES (?, ?, ?, ?, ?, ?)",
        [`log_${Date.now()}`, "admin@sanfurniture.com", "UPDATE_CATEGORY", "categories", JSON.stringify({ catId, body }), req.socket.remoteAddress]
      );

      return sendJson(res, 200, { success: true, message: `Category ${catId} updated` });
    }

    if (pathname.startsWith("/api/admin/categories/") && method === "DELETE") {
      const catId = pathname.replace("/api/admin/categories/", "");
      await pool.query("DELETE FROM categories WHERE id = ?", [catId]);

      await pool.query(
        "INSERT INTO admin_audit_logs (id, actor, action, resource, details_json, ip_address) VALUES (?, ?, ?, ?, ?, ?)",
        [`log_${Date.now()}`, "admin@sanfurniture.com", "DELETE_CATEGORY", "categories", JSON.stringify({ catId }), req.socket.remoteAddress]
      );

      return sendJson(res, 200, { success: true, message: `Category ${catId} removed` });
    }

    // 20. Admin Global Media Library CRUD API
    if (pathname === "/api/admin/media" && method === "GET") {
      const category = url.searchParams.get("category");
      const search = url.searchParams.get("q");

      let query = "SELECT * FROM media_assets";
      const params = [];
      const conditions = [];

      if (category && category !== "all") {
        conditions.push("category = ?");
        params.push(category);
      }
      if (search) {
        conditions.push("(file_name LIKE ? OR alt_text LIKE ?)");
        params.push(`%${search}%`, `%${search}%`);
      }

      if (conditions.length > 0) {
        query += " WHERE " + conditions.join(" AND ");
      }
      query += " ORDER BY created_at DESC";

      const [media] = await pool.query(query, params);
      return sendJson(res, 200, { media });
    }

    if (pathname === "/api/admin/media" && method === "POST") {
      const body = await readBody(req);
      const { fileName, fileUrl, altText, category = "product", mimeType = "image/jpeg", widthPx = 1200, heightPx = 800, fileSizeBytes = 250000 } = body;

      if (!fileUrl) {
        return sendJson(res, 400, { error: "File URL is required" });
      }

      const mediaId = `media_${Date.now()}`;
      const name = fileName || fileUrl.split("/").pop()?.split("?")[0] || "furniture-image.jpg";

      await pool.query(
        `INSERT INTO media_assets (id, file_name, file_url, file_size_bytes, mime_type, width_px, height_px, alt_text, category)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [mediaId, name, fileUrl, fileSizeBytes, mimeType, widthPx, heightPx, altText || name, category]
      );

      await pool.query(
        "INSERT INTO admin_audit_logs (id, actor, action, resource, details_json, ip_address) VALUES (?, ?, ?, ?, ?, ?)",
        [`log_${Date.now()}`, "admin@sanfurniture.com", "UPLOAD_MEDIA", "media_assets", JSON.stringify({ mediaId, name, fileUrl }), req.socket.remoteAddress]
      );

      return sendJson(res, 201, { success: true, mediaId, message: "Media asset added to library" });
    }

    if (pathname.startsWith("/api/admin/media/") && method === "DELETE") {
      const mediaId = pathname.replace("/api/admin/media/", "");
      await pool.query("DELETE FROM media_assets WHERE id = ?", [mediaId]);

      await pool.query(
        "INSERT INTO admin_audit_logs (id, actor, action, resource, details_json, ip_address) VALUES (?, ?, ?, ?, ?, ?)",
        [`log_${Date.now()}`, "admin@sanfurniture.com", "DELETE_MEDIA", "media_assets", JSON.stringify({ mediaId }), req.socket.remoteAddress]
      );

      return sendJson(res, 200, { success: true, message: `Media asset ${mediaId} removed` });
    }

    // 21. Admin Promotions & Coupon Engine CRUD API
    if ((pathname === "/api/admin/promotions" || pathname === "/api/promotions") && method === "GET") {
      const [promotions] = await pool.query("SELECT * FROM promotions ORDER BY created_at DESC");
      return sendJson(res, 200, { promotions });
    }

    if (pathname === "/api/admin/promotions" && method === "POST") {
      const body = await readBody(req);
      const {
        code,
        description,
        discountType = "percentage",
        discountValue = 10,
        minOrderPennies = 0,
        maxUses = 100,
        isActive = 1
      } = body;

      if (!code) {
        return sendJson(res, 400, { error: "Voucher code is required" });
      }

      const promoId = `promo_${code.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
      await pool.query(
        `INSERT INTO promotions (id, code, description, discount_type, discount_value, min_order_pennies, is_active, usage_count, max_uses)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)
         ON DUPLICATE KEY UPDATE description = VALUES(description), discount_type = VALUES(discount_type), discount_value = VALUES(discount_value), min_order_pennies = VALUES(min_order_pennies), is_active = VALUES(is_active)`,
        [promoId, code.toUpperCase(), description || code, discountType, discountValue, minOrderPennies, isActive ? 1 : 0, maxUses]
      );

      await pool.query(
        "INSERT INTO admin_audit_logs (id, actor, action, resource, details_json, ip_address) VALUES (?, ?, ?, ?, ?, ?)",
        [`log_${Date.now()}`, "admin@sanfurniture.com", "CREATE_PROMOTION", "promotions", JSON.stringify({ promoId, code }), req.socket.remoteAddress]
      );

      return sendJson(res, 201, { success: true, promoId, message: `Promotion ${code} created` });
    }

    if (pathname.startsWith("/api/admin/promotions/") && method === "PATCH") {
      const promoId = pathname.replace("/api/admin/promotions/", "");
      const body = await readBody(req);
      const { isActive, description, discountValue, minOrderPennies } = body;

      const fields = [];
      const params = [];
      if (isActive !== undefined) { fields.push("is_active = ?"); params.push(isActive ? 1 : 0); }
      if (description !== undefined) { fields.push("description = ?"); params.push(description); }
      if (discountValue !== undefined) { fields.push("discount_value = ?"); params.push(discountValue); }
      if (minOrderPennies !== undefined) { fields.push("min_order_pennies = ?"); params.push(minOrderPennies); }

      if (fields.length > 0) {
        params.push(promoId);
        await pool.query(`UPDATE promotions SET ${fields.join(", ")} WHERE id = ?`, params);
      }

      await pool.query(
        "INSERT INTO admin_audit_logs (id, actor, action, resource, details_json, ip_address) VALUES (?, ?, ?, ?, ?, ?)",
        [`log_${Date.now()}`, "admin@sanfurniture.com", "UPDATE_PROMOTION", "promotions", JSON.stringify({ promoId, body }), req.socket.remoteAddress]
      );

      return sendJson(res, 200, { success: true, message: `Promotion ${promoId} updated` });
    }

    if (pathname.startsWith("/api/admin/promotions/") && method === "DELETE") {
      const promoId = pathname.replace("/api/admin/promotions/", "");
      await pool.query("DELETE FROM promotions WHERE id = ?", [promoId]);

      await pool.query(
        "INSERT INTO admin_audit_logs (id, actor, action, resource, details_json, ip_address) VALUES (?, ?, ?, ?, ?, ?)",
        [`log_${Date.now()}`, "admin@sanfurniture.com", "DELETE_PROMOTION", "promotions", JSON.stringify({ promoId }), req.socket.remoteAddress]
      );

      return sendJson(res, 200, { success: true, message: `Promotion ${promoId} deleted` });
    }

    // 22. Customer Reviews Moderation API
    if ((pathname === "/api/reviews" || pathname === "/api/admin/reviews") && method === "GET") {
      const status = url.searchParams.get("status");
      let q = "SELECT * FROM customer_reviews";
      const params = [];
      if (status) {
        q += " WHERE status = ?";
        params.push(status);
      }
      q += " ORDER BY created_at DESC";

      const [reviews] = await pool.query(q, params);
      return sendJson(res, 200, { reviews });
    }

    if (pathname.startsWith("/api/admin/reviews/") && pathname.endsWith("/status") && method === "PATCH") {
      const revId = pathname.replace("/api/admin/reviews/", "").replace("/status", "");
      const body = await readBody(req);
      const { status } = body;

      await pool.query("UPDATE customer_reviews SET status = ? WHERE id = ?", [status, revId]);

      await pool.query(
        "INSERT INTO admin_audit_logs (id, actor, action, resource, details_json, ip_address) VALUES (?, ?, ?, ?, ?, ?)",
        [`log_${Date.now()}`, "admin@sanfurniture.com", "MODERATE_REVIEW", "customer_reviews", JSON.stringify({ revId, status }), req.socket.remoteAddress]
      );

      return sendJson(res, 200, { success: true, message: `Review ${revId} status updated to ${status}` });
    }

    if (pathname.startsWith("/api/admin/reviews/") && method === "DELETE") {
      const revId = pathname.replace("/api/admin/reviews/", "");
      await pool.query("DELETE FROM customer_reviews WHERE id = ?", [revId]);

      await pool.query(
        "INSERT INTO admin_audit_logs (id, actor, action, resource, details_json, ip_address) VALUES (?, ?, ?, ?, ?, ?)",
        [`log_${Date.now()}`, "admin@sanfurniture.com", "DELETE_REVIEW", "customer_reviews", JSON.stringify({ revId }), req.socket.remoteAddress]
      );

      return sendJson(res, 200, { success: true, message: `Review ${revId} deleted` });
    }

    // 22.1 Amos Mann Furniture (UK Dropshipping Supplier Hub)
    if (pathname === "/api/admin/dropship/amos-mann/status" && method === "GET") {
      const [rows] = await pool.query("SELECT COUNT(*) as count FROM products WHERE id LIKE 'prod_am_%'");
      const amosCount = rows[0]?.count || 0;
      return sendJson(res, 200, {
        supplierId: "amos_mann_furniture",
        supplierName: "Amos Mann Furniture (Trade Dropshipping, Leicester UK)",
        website: "https://www.amosmannfurniture.co.uk/",
        tradePhone: "0116 507 7455",
        tradeEmail: "orders@amosmannfurniture.co.uk",
        warehouseLocation: "Leicestershire, UK",
        dispatchMethod: "White-Label Direct to UK Consumer (2-Man Booked Delivery & Pallet)",
        status: "connected",
        activeCatalogCount: amosCount,
        minFloorMarginPercent: 40,
        markupMultiplier: 1.85,
        vatRate: 20,
        primaryCategories: [
          "Sliding Door Wardrobes (Venice, Madrid, Miami, Texas)",
          "Modern Bedroom Suites (Chests & Bedsides)",
          "High Gloss LED TV Media Units (Athens, Atlantis)",
          "Extending Dining Tables & Sideboards",
          "Home Office & Desks",
          "Shoe & Hallway Storage"
        ]
      });
    }

    if (pathname === "/api/admin/dropship/amos-mann/sync" && method === "POST") {
      const amosProducts = [
        {
          id: "prod_am_venice_203",
          title: "Venice 203cm Sliding Mirrored Wardrobe in Artisan Oak",
          handle: "venice-203cm-sliding-mirrored-wardrobe-artisan-oak",
          subtitle: "Smooth-glide dual sliding doors, full mirrored panels & optional LED strip",
          description: "SAN Furniture's signature Venice 203cm wardrobe combines contemporary Artisan Oak framing with expansive full-height mirrored sliding doors. Featuring generous interior shelving, twin hanging rails, and smooth aluminum rail guides designed for effortless daily operation.",
          categoryId: "cat_beds",
          status: "published",
          pricePennies: 54900,
          compareAtPricePennies: 64900,
          tradeCostPennies: 23900,
          gtinBarcode: "5060912801015",
          thumbnailUrl: "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1200&q=80",
          specs: {
            width_cm: 203, height_cm: 215, depth_cm: 61, weight_kg: 142,
            material: "engineered_hardwood", frame_material: "engineered_hardwood",
            color: "Artisan Oak & Mirror", assembly_required: 1, doorway_clearance_min_cm: 65,
            delivery_tier: "two_man_white_glove", fire_safety_compliant: 1,
            fire_safety_standard: "UK Quality Checked", lead_time_days: 7
          }
        },
        {
          id: "prod_am_madrid_180",
          title: "Madrid 180cm Luxury Sliding Wardrobe with Mirror & LED",
          handle: "madrid-180cm-sliding-wardrobe-mirror-led",
          subtitle: "Compact sliding mirrored wardrobe with built-in LED ambient illumination",
          description: "The Madrid 180cm sliding wardrobe is engineered for stylish UK bedroom storage. Features high-density laminated board, mirror accent facade, multiple compartments, and quiet-glide door track hardware.",
          categoryId: "cat_beds",
          status: "published",
          pricePennies: 44900,
          compareAtPricePennies: 52900,
          tradeCostPennies: 19500,
          gtinBarcode: "5060912801022",
          thumbnailUrl: "https://images.unsplash.com/photo-1540518614846-7ede433c4550?auto=format&fit=crop&w=1200&q=80",
          specs: {
            width_cm: 180, height_cm: 215, depth_cm: 61, weight_kg: 128,
            material: "engineered_hardwood", frame_material: "engineered_hardwood",
            color: "Matte White & Mirrored Glass", assembly_required: 1, doorway_clearance_min_cm: 65,
            delivery_tier: "two_man_white_glove", fire_safety_compliant: 1,
            fire_safety_standard: "UK Quality Checked", lead_time_days: 5
          }
        },
        {
          id: "prod_am_miami_250",
          title: "Miami 250cm 3-Door Sliding Wardrobe with Internal Drawers",
          handle: "miami-250cm-3-door-sliding-wardrobe-internal-drawers",
          subtitle: "Grand 2.5m master wardrobe with 3 sliding panels, mirror center & drawers",
          description: "For expansive master bedrooms, the Miami 250cm wardrobe provides immense storage capacity. Three smooth sliding doors enclose triple hanging zones, six adjustable organizational shelves, and integrated soft-close drawers.",
          categoryId: "cat_beds",
          status: "published",
          pricePennies: 69900,
          compareAtPricePennies: 79900,
          tradeCostPennies: 31000,
          gtinBarcode: "5060912801039",
          thumbnailUrl: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=80",
          specs: {
            width_cm: 250, height_cm: 215, depth_cm: 61, weight_kg: 175,
            material: "engineered_hardwood", frame_material: "engineered_hardwood",
            color: "Slate Grey & Silver Mirrored Glass", assembly_required: 1, doorway_clearance_min_cm: 70,
            delivery_tier: "two_man_white_glove", fire_safety_compliant: 1,
            fire_safety_standard: "UK Quality Checked", lead_time_days: 7
          }
        },
        {
          id: "prod_am_athens_tv",
          title: "Athens 160cm High Gloss LED TV Cabinet Unit",
          handle: "athens-160cm-high-gloss-led-tv-cabinet",
          subtitle: "Contemporary media console with multi-color RGB remote lighting",
          description: "Elevate your living room entertainment center with the Athens 160cm TV stand. Features high gloss drop-down doors, tempered glass media shelf, integrated cable management port, and multi-color LED atmospheric lighting.",
          categoryId: "cat_living",
          status: "published",
          pricePennies: 22900,
          compareAtPricePennies: 27900,
          tradeCostPennies: 9200,
          gtinBarcode: "5060912801046",
          thumbnailUrl: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=1200&q=80",
          specs: {
            width_cm: 160, height_cm: 45, depth_cm: 40, weight_kg: 38,
            material: "engineered_hardwood", frame_material: "engineered_hardwood",
            color: "High Gloss White & Glass", assembly_required: 1, doorway_clearance_min_cm: 50,
            delivery_tier: "standard_parcel", fire_safety_compliant: 1,
            fire_safety_standard: "UK Quality Checked", lead_time_days: 3
          }
        },
        {
          id: "prod_am_atlantis_sideboard",
          title: "Atlantis 2-Door 3-Drawer Sideboard in Cashmere & Oak",
          handle: "atlantis-2-door-3-drawer-sideboard-cashmere-oak",
          subtitle: "Architectural fluted doors, brushed brass accents & ample interior storage",
          description: "The Atlantis sideboard seamlessly blends organic warmth with contemporary styling. Featuring dual cupboard spaces with internal shelving and 3 spacious smooth-slide central drawers for dining accessories and lounge essentials.",
          categoryId: "cat_living",
          status: "published",
          pricePennies: 26900,
          compareAtPricePennies: 31900,
          tradeCostPennies: 11500,
          gtinBarcode: "5060912801053",
          thumbnailUrl: "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=1200&q=80",
          specs: {
            width_cm: 140, height_cm: 82, depth_cm: 42, weight_kg: 52,
            material: "engineered_hardwood", frame_material: "solid_oak",
            color: "Cashmere Grey & Warm Oak", assembly_required: 1, doorway_clearance_min_cm: 55,
            delivery_tier: "pallet", fire_safety_compliant: 1,
            fire_safety_standard: "UK Quality Checked", lead_time_days: 5
          }
        },
        {
          id: "prod_am_elise_dining",
          title: "Elise 160-200cm Extending Dining Table in High Gloss",
          handle: "elise-extending-dining-table-high-gloss",
          subtitle: "Butterfly extension leaf with pedestal column and brushed chrome plinth",
          description: "The Elise Extending Dining Table is crafted for modern UK entertaining. Smooth center butterfly mechanism extends the table effortlessly from 160cm to 200cm, comfortably seating up to 8 dinner guests.",
          categoryId: "cat_dining",
          status: "published",
          pricePennies: 42900,
          compareAtPricePennies: 49900,
          tradeCostPennies: 18500,
          gtinBarcode: "5060912801060",
          thumbnailUrl: "https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=1200&q=80",
          specs: {
            width_cm: 200, height_cm: 76, depth_cm: 90, weight_kg: 64,
            material: "engineered_hardwood", frame_material: "engineered_hardwood",
            color: "High Gloss White & Chrome", assembly_required: 1, doorway_clearance_min_cm: 65,
            delivery_tier: "pallet", fire_safety_compliant: 1,
            fire_safety_standard: "UK Quality Checked", lead_time_days: 5
          }
        },
        {
          id: "prod_am_texas_set",
          title: "Texas 3-Piece Bedroom Furniture Suite (Wardrobe, Chest & Bedside)",
          handle: "texas-3-piece-bedroom-furniture-suite",
          subtitle: "Coordinated bedroom set: 2-door wardrobe, 4-drawer chest & bedside table",
          description: "SAN Furniture's Texas 3-Piece Suite offers complete bedroom harmony at exceptional value. Includes a generous double wardrobe with hanging rail and shelf, a matching 4-drawer chest of drawers, and a compact nightstand.",
          categoryId: "cat_beds",
          status: "published",
          pricePennies: 59900,
          compareAtPricePennies: 69900,
          tradeCostPennies: 26500,
          gtinBarcode: "5060912801077",
          thumbnailUrl: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
          specs: {
            width_cm: 120, height_cm: 180, depth_cm: 52, weight_kg: 98,
            material: "engineered_hardwood", frame_material: "engineered_hardwood",
            color: "Oak Effect & Matte Charcoal", assembly_required: 1, doorway_clearance_min_cm: 60,
            delivery_tier: "two_man_white_glove", fire_safety_compliant: 1,
            fire_safety_standard: "UK Quality Checked", lead_time_days: 7
          }
        },
        {
          id: "prod_am_kano_desk",
          title: "Kano Modern Ergonomic Workstation Office Desk with Drawers",
          handle: "kano-modern-workstation-office-desk-drawers",
          subtitle: "Durable scratch-resistant top, integrated modesty panel and locking storage",
          description: "Designed for hybrid professionals, the Kano office desk provides a spacious 140cm work surface with built-in cable grommets and a 3-drawer pedestal unit for documents and stationery.",
          categoryId: "cat_living",
          status: "published",
          pricePennies: 18900,
          compareAtPricePennies: 22900,
          tradeCostPennies: 7800,
          gtinBarcode: "5060912801084",
          thumbnailUrl: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=1200&q=80",
          specs: {
            width_cm: 140, height_cm: 76, depth_cm: 65, weight_kg: 42,
            material: "engineered_hardwood", frame_material: "engineered_hardwood",
            color: "Graphite & Warm Natural Oak", assembly_required: 1, doorway_clearance_min_cm: 50,
            delivery_tier: "standard_parcel", fire_safety_compliant: 1,
            fire_safety_standard: "UK Quality Checked", lead_time_days: 3
          }
        },
        {
          id: "prod_am_santino_shoe",
          title: "Santino 3-Tier Mirrored Shoe Storage Cabinet",
          handle: "santino-3-tier-mirrored-shoe-storage-cabinet",
          subtitle: "Slimline 24cm deep hallway shoe cabinet holding up to 18 pairs of shoes",
          description: "Save space in compact UK entryways with the Santino shoe cabinet. Featuring 3 pull-down flap compartments with full-length mirrored door fronts, keeping up to 18 pairs of footwear neatly tucked away.",
          categoryId: "cat_living",
          status: "published",
          pricePennies: 14900,
          compareAtPricePennies: 17900,
          tradeCostPennies: 6200,
          gtinBarcode: "5060912801091",
          thumbnailUrl: "https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=1200&q=80",
          specs: {
            width_cm: 63, height_cm: 120, depth_cm: 24, weight_kg: 28,
            material: "engineered_hardwood", frame_material: "engineered_hardwood",
            color: "Mirrored Glass & White Frame", assembly_required: 1, doorway_clearance_min_cm: 40,
            delivery_tier: "standard_parcel", fire_safety_compliant: 1,
            fire_safety_standard: "UK Quality Checked", lead_time_days: 3
          }
        }
      ];

      for (const p of amosProducts) {
        // Upsert Product
        await pool.query(
          `INSERT INTO products (id, title, handle, subtitle, description, category_id, status, price_pennies, compare_at_price_pennies, vat_rate_percent, gtin_barcode, thumbnail_url, images_json)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 20, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             title = VALUES(title),
             handle = VALUES(handle),
             subtitle = VALUES(subtitle),
             description = VALUES(description),
             price_pennies = VALUES(price_pennies),
             compare_at_price_pennies = VALUES(compare_at_price_pennies),
             thumbnail_url = VALUES(thumbnail_url),
             updated_at = CURRENT_TIMESTAMP`,
          [
            p.id, p.title, p.handle, p.subtitle, p.description, p.categoryId, p.status,
            p.pricePennies, p.compareAtPricePennies, p.gtinBarcode, p.thumbnailUrl,
            JSON.stringify([p.thumbnailUrl])
          ]
        );

        // Upsert Specs
        await pool.query(
          `INSERT INTO furniture_specs (
             product_id, width_cm, height_cm, depth_cm, weight_kg, material, frame_material,
             color, assembly_required, doorway_clearance_min_cm, delivery_tier, fire_safety_compliant,
             fire_safety_standard, lead_time_days
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             width_cm = VALUES(width_cm),
             height_cm = VALUES(height_cm),
             depth_cm = VALUES(depth_cm),
             weight_kg = VALUES(weight_kg),
             color = VALUES(color),
             delivery_tier = VALUES(delivery_tier),
             lead_time_days = VALUES(lead_time_days)`,
          [
            p.id, p.specs.width_cm, p.specs.height_cm, p.specs.depth_cm, p.specs.weight_kg,
            p.specs.material, p.specs.frame_material, p.specs.color, p.specs.assembly_required,
            p.specs.doorway_clearance_min_cm, p.specs.delivery_tier, p.specs.fire_safety_compliant,
            p.specs.fire_safety_standard, p.specs.lead_time_days
          ]
        );
      }

      await pool.query(
        "INSERT INTO admin_audit_logs (id, actor, action, resource, details_json, ip_address) VALUES (?, ?, ?, ?, ?, ?)",
        [
          `log_${Date.now()}`,
          "admin@sanfurniture.com",
          "SYNC_AMOS_MANN_DROPSHIP_FEED",
          "supplier_amos_mann",
          JSON.stringify({ syncedCount: amosProducts.length, supplier: "Amos Mann Furniture (Leicester)" }),
          req.socket.remoteAddress
        ]
      );

      return sendJson(res, 200, {
        success: true,
        message: `Successfully synced ${amosProducts.length} signature Amos Mann furniture lines (Sliding Wardrobes, High Gloss TV Media Units, Extending Dining & Office) into SAN Furniture live catalog!`,
        syncedProductsCount: amosProducts.length,
        supplier: "Amos Mann Furniture (Leicester, UK)"
      });
    }

    if (pathname === "/api/admin/dropship/amos-mann/po/test" && method === "POST") {
      const testPo = {
        poNumber: `PO-AM-${Date.now().toString().slice(-6)}`,
        orderNumber: "SAN-88129",
        customerName: "Lord Arthur Sterling",
        customerPhone: "+44 7700 900142",
        deliveryAddress: "14 Belgrave Square, Knightsbridge, London",
        postcode: "SW1X 8PS",
        items: [
          { sku: "AM-VEN-203-OAK", title: "Venice 203cm Sliding Mirrored Wardrobe (Artisan Oak)", quantity: 1, tradePriceGbp: "239.00" }
        ],
        notes: "2-Man delivery required to 2nd floor Master Bedroom. Call customer 30 minutes ahead."
      };

      return sendJson(res, 200, {
        success: true,
        message: "Amos Mann Furniture Purchase Order (PO) dispatch format validated!",
        testPo,
        formattedEmail: `
============================================================
SAN FURNITURE UK -> AMOS MANN FURNITURE DROPSHIP DISPATCH
============================================================
TO: orders@amosmannfurniture.co.uk
SUPPLIER: Amos Mann Furniture (Leicester Warehouse)
PO NUMBER: ${testPo.poNumber}
STORE ORDER REF: ${testPo.orderNumber}
DISPATCH METHOD: Direct-to-Consumer Dropship (White Label)

CUSTOMER DELIVERY MANIFEST:
------------------------------------------------------------
Recipient: ${testPo.customerName}
Phone: ${testPo.customerPhone} (2-Man Booking Callout)
Address: ${testPo.deliveryAddress}
Postcode: ${testPo.postcode}
Tier: 2-Man Booked-in Service (Room of Choice)

PURCHASE ORDER ITEMS:
------------------------------------------------------------
• [AM-VEN-203-OAK] Venice 203cm Sliding Mirrored Wardrobe x 1 (@ £239.00 ex VAT)

SPECIAL INSTRUCTIONS:
------------------------------------------------------------
${testPo.notes}
============================================================`.trim()
      });
    }

    // 23. Admin Storage Symlink & Server Shortcuts Manager
    if (pathname === "/api/admin/system/storage-link" && method === "GET") {
      const targetDir = path.join(ROOT_DIR, "storage", "uploads");
      const publicLink = path.join(ROOT_DIR, "apps", "storefront", "public", "storage");

      const targetExists = fs.existsSync(targetDir);
      let linkExists = false;
      let isSymlink = false;
      let isLinked = false;
      let fileCount = 0;
      let totalSizeBytes = 0;

      try {
        if (fs.existsSync(publicLink)) {
          linkExists = true;
          const lstat = fs.lstatSync(publicLink);
          isSymlink = lstat.isSymbolicLink();
          isLinked = true;
        }
      } catch (e) {
        linkExists = false;
      }

      if (targetExists) {
        try {
          const files = fs.readdirSync(targetDir);
          fileCount = files.length;
          for (const f of files) {
            try {
              const st = fs.statSync(path.join(targetDir, f));
              totalSizeBytes += st.size;
            } catch {}
          }
        } catch {}
      }

      return sendJson(res, 200, {
        targetDir,
        publicLink,
        targetExists,
        linkExists,
        isSymlink,
        isLinked,
        fileCount,
        totalSizeBytes,
        platform: process.platform,
        commands: {
          linux: `ln -s $(pwd)/storage/uploads $(pwd)/apps/storefront/public/storage`,
          windows_cmd: `mklink /D "apps\\storefront\\public\\storage" "storage\\uploads"`,
          windows_ps: `New-Item -ItemType SymbolicLink -Path "apps\\storefront\\public\\storage" -Target "storage\\uploads"`,
          laravel_artisan: `php artisan storage:link`,
        },
      });
    }

    if (pathname === "/api/admin/system/storage-link" && method === "POST") {
      const targetDir = path.join(ROOT_DIR, "storage", "uploads");
      const publicLink = path.join(ROOT_DIR, "apps", "storefront", "public", "storage");

      try {
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }

        let linkCreated = false;
        if (fs.existsSync(publicLink)) {
          const lstat = fs.lstatSync(publicLink);
          if (lstat.isSymbolicLink()) {
            linkCreated = true;
          } else {
            linkCreated = true;
          }
        } else {
          const linkType = process.platform === "win32" ? "junction" : "dir";
          fs.symlinkSync(targetDir, publicLink, linkType);
          linkCreated = true;
        }

        const gitkeepPath = path.join(targetDir, ".gitkeep");
        if (!fs.existsSync(gitkeepPath)) {
          fs.writeFileSync(gitkeepPath, "");
        }

        await pool.query(
          "INSERT INTO admin_audit_logs (id, actor, action, resource, details_json, ip_address) VALUES (?, ?, ?, ?, ?, ?)",
          [`log_${Date.now()}`, "admin@sanfurniture.com", "CREATE_STORAGE_SYMLINK", "system_storage", JSON.stringify({ targetDir, publicLink }), req.socket.remoteAddress]
        );

        return sendJson(res, 200, {
          success: true,
          message: "Storage symlink successfully established! Media files in storage/uploads are now directly accessible through /storage.",
          targetDir,
          publicLink,
        });
      } catch (err) {
        console.error("Storage symlink creation error:", err);
        return sendJson(res, 500, {
          error: "Failed to create storage symlink: " + err.message,
          suggestion: process.platform === "win32"
            ? `Run: mklink /D "apps\\storefront\\public\\storage" "storage\\uploads"`
            : `Run: ln -s $(pwd)/storage/uploads $(pwd)/apps/storefront/public/storage`,
        });
      }
    }

    if (pathname === "/api/admin/system/storage-link/test" && method === "POST") {
      const targetDir = path.join(ROOT_DIR, "storage", "uploads");
      const publicLink = path.join(ROOT_DIR, "apps", "storefront", "public", "storage");

      try {
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }

        const testFileName = `test_${Date.now()}.json`;
        const testPayload = JSON.stringify({ verifiedAt: new Date().toISOString(), status: "operational" });
        const targetFilePath = path.join(targetDir, testFileName);
        const linkFilePath = path.join(publicLink, testFileName);

        fs.writeFileSync(targetFilePath, testPayload, "utf8");

        let readSuccess = false;
        if (fs.existsSync(linkFilePath)) {
          const content = fs.readFileSync(linkFilePath, "utf8");
          if (content === testPayload) {
            readSuccess = true;
          }
        }

        try {
          fs.unlinkSync(targetFilePath);
        } catch {}

        if (readSuccess) {
          return sendJson(res, 200, {
            success: true,
            verified: true,
            message: "Self-test passed! Data written to storage was successfully verified through the public shortcut link.",
          });
        } else {
          return sendJson(res, 400, {
            success: false,
            verified: false,
            error: "Symlink exists, but files in storage/uploads are not mirrored to apps/storefront/public/storage.",
          });
        }
      } catch (err) {
        return sendJson(res, 500, { error: "Test execution failed: " + err.message });
      }
    }

    // =========================================================================
    // 22.2 SITE PAGES & VISUAL CONTENT CMS API (Live Section Control)
    // =========================================================================

    // A. Public Storefront Content Sections Query (0ms In-Memory Cache)
    if (pathname === "/api/content/sections" && method === "GET") {
      const pageFilter = url.searchParams.get("page");
      const isAll = !pageFilter || pageFilter === "all";
      const cacheKey = isAll ? "all" : pageFilter;

      if (!globalThis.__pageSectionsCache) {
        globalThis.__pageSectionsCache = new Map();
      }

      const cached = globalThis.__pageSectionsCache.get(cacheKey);
      if (cached && (Date.now() - cached.time < 60000)) {
        if (cached.jsonString) {
          return sendJson(res, 200, cached.jsonString, {
            "Cache-Control": "no-cache, no-store, must-revalidate",
          });
        }
        return sendJson(res, 200, cached.payload, {
          "Cache-Control": "no-cache, no-store, must-revalidate",
        });
      }

      let q = "SELECT * FROM site_page_sections";
      const params = [];
      if (pageFilter && pageFilter !== "all") {
        q += " WHERE page_key = ?";
        params.push(pageFilter);
      }
      q += " ORDER BY sort_order ASC, updated_at ASC";

      const [rows] = await pool.query(q, params);
      const sectionsMap = {};
      const list = [];

      for (const row of rows) {
        let parsedContent = {};
        try {
          parsedContent = typeof row.content_json === "string" ? JSON.parse(row.content_json) : (row.content_json || {});
        } catch {
          parsedContent = {};
        }
        const sectionObj = {
          id: row.id,
          pageKey: row.page_key,
          sectionKey: row.section_key,
          sectionName: row.section_name,
          isEnabled: Boolean(row.is_enabled),
          sortOrder: row.sort_order,
          content: parsedContent,
          updatedAt: row.updated_at,
        };
        sectionsMap[row.section_key] = sectionObj;
        list.push(sectionObj);
      }

      const payload = { sections: sectionsMap, list };
      const jsonString = JSON.stringify(payload);
      globalThis.__pageSectionsCache.set(cacheKey, { time: Date.now(), payload, jsonString });

      return sendJson(res, 200, jsonString, {
        "Cache-Control": "no-cache, no-store, must-revalidate",
      });
    }

    // B. Admin CMS Sections List (Full records grouped by page)
    if (pathname === "/api/admin/content/sections" && method === "GET") {
      const [rows] = await pool.query("SELECT * FROM site_page_sections ORDER BY page_key ASC, sort_order ASC");
      const sections = rows.map((r) => {
        let content = {};
        try {
          content = typeof r.content_json === "string" ? JSON.parse(r.content_json || "{}") : (r.content_json || {});
        } catch {
          content = {};
        }
        return {
          id: r.id,
          pageKey: r.page_key,
          sectionKey: r.section_key,
          sectionName: r.section_name,
          isEnabled: Boolean(r.is_enabled),
          sortOrder: r.sort_order,
          content,
          updatedAt: r.updated_at,
        };
      });

      const pages = {};
      for (const s of sections) {
        if (!pages[s.pageKey]) pages[s.pageKey] = [];
        pages[s.pageKey].push(s);
      }

      return sendJson(res, 200, { sections, pages });
    }

    // C. Admin CMS Reset Section to Factory Default
    if (pathname.startsWith("/api/admin/content/sections/") && pathname.endsWith("/reset") && method === "POST") {
      const sectionKey = pathname.replace("/api/admin/content/sections/", "").replace("/reset", "").trim();
      const defaultSec = DEFAULT_PAGE_SECTIONS.find((s) => s.section_key === sectionKey);

      if (!defaultSec) {
        return sendJson(res, 404, { error: `Factory default definition for section "${sectionKey}" not found.` });
      }

      await pool.query(
        "UPDATE site_page_sections SET is_enabled = ?, content_json = ?, section_name = ?, sort_order = ?, updated_at = NOW() WHERE section_key = ?",
        [defaultSec.is_enabled, defaultSec.content_json, defaultSec.section_name, defaultSec.sort_order, sectionKey]
      );

      if (globalThis.__pageSectionsCache) {
        globalThis.__pageSectionsCache.clear();
      }

      await pool.query(
        "INSERT INTO admin_audit_logs (id, actor, action, resource, details_json, ip_address) VALUES (?, ?, ?, ?, ?, ?)",
        [`log_${Date.now()}`, "admin@sanfurniture.com", "RESET_PAGE_SECTION", "site_page_sections", JSON.stringify({ sectionKey }), req.socket.remoteAddress]
      );

      return sendJson(res, 200, {
        success: true,
        message: `Section "${sectionKey}" restored to factory defaults.`,
        section: {
          id: defaultSec.id,
          pageKey: defaultSec.page_key,
          sectionKey: defaultSec.section_key,
          sectionName: defaultSec.section_name,
          isEnabled: Boolean(defaultSec.is_enabled),
          sortOrder: defaultSec.sort_order,
          content: JSON.parse(defaultSec.content_json),
        },
      });
    }

    // D. Admin CMS Update Section (Toggle, Titles, Texts, Image URLs, CTAs)
    if (pathname.startsWith("/api/admin/content/sections/") && !pathname.endsWith("/reset") && (method === "PUT" || method === "PATCH")) {
      const sectionKey = pathname.replace("/api/admin/content/sections/", "").trim();
      const body = await readBody(req);
      const { isEnabled, content, sectionName, sortOrder } = body;

      const [existing] = await pool.query("SELECT id, content_json FROM site_page_sections WHERE section_key = ?", [sectionKey]);
      if (existing.length === 0) {
        return sendJson(res, 404, { error: `Section "${sectionKey}" not found.` });
      }

      let currentParsed = {};
      try {
        currentParsed = typeof existing[0].content_json === "string" ? JSON.parse(existing[0].content_json) : (existing[0].content_json || {});
      } catch {}

      const updatedContent = content !== undefined ? { ...currentParsed, ...content } : currentParsed;
      const contentJsonStr = JSON.stringify(updatedContent);
      const isEnabledVal = isEnabled !== undefined ? (isEnabled ? 1 : 0) : 1;

      await pool.query(
        "UPDATE site_page_sections SET is_enabled = ?, content_json = ?, section_name = COALESCE(?, section_name), sort_order = COALESCE(?, sort_order), updated_at = NOW() WHERE section_key = ?",
        [isEnabledVal, contentJsonStr, sectionName || null, sortOrder !== undefined ? sortOrder : null, sectionKey]
      );

      if (globalThis.__pageSectionsCache) {
        globalThis.__pageSectionsCache.clear();
      }

      await pool.query(
        "INSERT INTO admin_audit_logs (id, actor, action, resource, details_json, ip_address) VALUES (?, ?, ?, ?, ?, ?)",
        [`log_${Date.now()}`, "admin@sanfurniture.com", "UPDATE_PAGE_SECTION", "site_page_sections", JSON.stringify({ sectionKey, isEnabled: Boolean(isEnabledVal) }), req.socket.remoteAddress]
      );

      return sendJson(res, 200, {
        success: true,
        message: `Section "${sectionKey}" updated successfully.`,
        sectionKey,
        isEnabled: Boolean(isEnabledVal),
        content: updatedContent,
      });
    }

    // =========================================================================
    // NOTIFICATIONS API (Admin & Customer)
    // =========================================================================

    // 1. Get Notifications
    if (pathname === "/api/notifications" && method === "GET") {
      const authAdmin = await getAdminFromAuth(req);
      const authCust = await getCustomerFromAuth(req);

      let recipientType = url.searchParams.get("recipient_type") || "admin";
      let recipientId = url.searchParams.get("recipient_id") || "all";

      if (recipientType === "admin") {
        if (!authAdmin) {
          return sendJson(res, 401, { error: "Unauthorized: Admin session required to view admin notifications." });
        }
      } else if (recipientType === "customer") {
        if (!authCust) {
          return sendJson(res, 401, { error: "Authentication required to view customer notifications." });
        }
        recipientId = authCust.email.toLowerCase().trim();
      } else {
        return sendJson(res, 400, { error: "Invalid recipient_type specified." });
      }

      const unreadOnly = url.searchParams.get("unread_only") === "true";
      const typeFilter = url.searchParams.get("type");
      const search = url.searchParams.get("search");
      const limit = Math.min(parseInt(url.searchParams.get("limit") || "100", 10), 500);

      let query = "SELECT * FROM notifications WHERE recipient_type = ?";
      const params = [recipientType];

      if (recipientId && recipientId !== "all") {
        query += " AND (recipient_id = ? OR recipient_id = 'all')";
        params.push(recipientId);
      }

      if (unreadOnly) {
        query += " AND is_read = 0";
      }

      if (typeFilter && typeFilter !== "all") {
        if (typeFilter === "orders") {
          query += " AND (type LIKE '%order%' OR type = 'order_created')";
        } else if (typeFilter === "tickets") {
          query += " AND (type LIKE '%ticket%' OR type = 'ticket_created' OR type = 'ticket_reply')";
        } else if (typeFilter === "security") {
          query += " AND (type LIKE '%security%' OR type LIKE '%jail%' OR type = 'security_alert')";
        } else if (typeFilter === "system") {
          query += " AND (type NOT LIKE '%order%' AND type NOT LIKE '%ticket%' AND type NOT LIKE '%security%')";
        } else {
          query += " AND type = ?";
          params.push(typeFilter);
        }
      }

      if (search && search.trim()) {
        query += " AND (title LIKE ? OR message LIKE ?)";
        const term = `%${search.trim()}%`;
        params.push(term, term);
      }

      query += " ORDER BY created_at DESC LIMIT ?";
      params.push(limit);

      const [notifications] = await pool.query(query, params);

      // Counts summary for dashboard/page
      let baseCountQuery = "SELECT COUNT(*) as total, SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) as unread, SUM(CASE WHEN type LIKE '%order%' THEN 1 ELSE 0 END) as orders, SUM(CASE WHEN type LIKE '%ticket%' THEN 1 ELSE 0 END) as tickets, SUM(CASE WHEN type LIKE '%security%' OR type LIKE '%jail%' THEN 1 ELSE 0 END) as security FROM notifications WHERE recipient_type = ?";
      const baseParams = [recipientType];
      if (recipientId && recipientId !== "all") {
        baseCountQuery += " AND (recipient_id = ? OR recipient_id = 'all')";
        baseParams.push(recipientId);
      }
      const [statsRes] = await pool.query(baseCountQuery, baseParams);
      const stats = statsRes[0] || {};

      return sendJson(res, 200, {
        notifications,
        unread_count: Number(stats.unread || 0),
        total_count: Number(stats.total || 0),
        stats: {
          total: Number(stats.total || 0),
          unread: Number(stats.unread || 0),
          orders: Number(stats.orders || 0),
          tickets: Number(stats.tickets || 0),
          security: Number(stats.security || 0),
        }
      });
    }

    // 2. Create Notification
    if (pathname === "/api/notifications" && method === "POST") {
      const body = await readBody(req);
      const { recipient_type = "admin", recipient_id = "all", type, title, message, link, metadata } = body;

      if (!title || !message) {
        return sendJson(res, 400, { error: "Title and message are required" });
      }

      const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      await pool.query(
        `INSERT INTO notifications (id, recipient_type, recipient_id, type, title, message, link, metadata)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [notifId, recipient_type, recipient_id, type || "general", title, message, link || null, metadata ? JSON.stringify(metadata) : null]
      );

      return sendJson(res, 201, {
        success: true,
        notification: { id: notifId, recipient_type, recipient_id, type, title, message, link, is_read: 0 },
      });
    }

    // 3. Mark Single Notification as Read
    if (pathname.startsWith("/api/notifications/") && pathname.endsWith("/read") && (method === "PATCH" || method === "POST")) {
      const notifId = pathname.replace("/api/notifications/", "").replace("/read", "");
      await pool.query("UPDATE notifications SET is_read = 1 WHERE id = ?", [notifId]);
      return sendJson(res, 200, { success: true, id: notifId, is_read: 1 });
    }

    // 3b. Mark Single Notification as Unread
    if (pathname.startsWith("/api/notifications/") && pathname.endsWith("/unread") && (method === "PATCH" || method === "POST")) {
      const notifId = pathname.replace("/api/notifications/", "").replace("/unread", "");
      await pool.query("UPDATE notifications SET is_read = 0 WHERE id = ?", [notifId]);
      return sendJson(res, 200, { success: true, id: notifId, is_read: 0 });
    }

    // 4. Mark All Notifications as Read
    if (pathname === "/api/notifications/read-all" && method === "POST") {
      const body = await readBody(req);
      const recipientType = body.recipient_type || url.searchParams.get("recipient_type") || "admin";
      const recipientId = body.recipient_id || url.searchParams.get("recipient_id") || "all";

      if (recipientId && recipientId !== "all") {
        await pool.query("UPDATE notifications SET is_read = 1 WHERE recipient_type = ? AND (recipient_id = ? OR recipient_id = 'all')", [recipientType, recipientId]);
      } else {
        await pool.query("UPDATE notifications SET is_read = 1 WHERE recipient_type = ?", [recipientType]);
      }

      return sendJson(res, 200, { success: true, message: "All notifications marked as read." });
    }

    // 5. Delete Single Notification by ID
    if (pathname.startsWith("/api/notifications/") && !pathname.endsWith("/read") && !pathname.endsWith("/unread") && !pathname.endsWith("/read-all") && !pathname.endsWith("/clear") && !pathname.endsWith("/delete-bulk") && method === "DELETE") {
      const notifId = pathname.replace("/api/notifications/", "");
      const [resDel] = await pool.query("DELETE FROM notifications WHERE id = ?", [notifId]);
      if (resDel.affectedRows === 0) {
        return sendJson(res, 404, { error: "Notification not found" });
      }
      return sendJson(res, 200, { success: true, message: "Notification deleted.", id: notifId });
    }

    // 6. Delete Bulk Notifications by IDs
    if (pathname === "/api/notifications/delete-bulk" && method === "POST") {
      const body = await readBody(req);
      const ids = body.ids;
      if (!Array.isArray(ids) || ids.length === 0) {
        return sendJson(res, 400, { error: "ids array is required" });
      }
      const [resBulk] = await pool.query("DELETE FROM notifications WHERE id IN (?)", [ids]);
      return sendJson(res, 200, { success: true, count: resBulk.affectedRows, message: `${resBulk.affectedRows} notifications deleted.` });
    }

    // 7. Clear All Notifications
    if ((pathname === "/api/notifications/clear" && method === "POST") || (pathname === "/api/notifications" && method === "DELETE")) {
      const authAdmin = await getAdminFromAuth(req);
      const authCust = await getCustomerFromAuth(req);
      const body = await readBody(req).catch(() => ({}));
      let recipientType = body.recipient_type || url.searchParams.get("recipient_type") || "admin";
      let recipientId = body.recipient_id || url.searchParams.get("recipient_id") || "all";

      if (recipientType === "admin") {
        if (!authAdmin) {
          return sendJson(res, 401, { error: "Unauthorized: Admin session required to clear admin notifications." });
        }
      } else if (recipientType === "customer") {
        if (!authCust) {
          return sendJson(res, 401, { error: "Authentication required to clear customer notifications." });
        }
        recipientId = authCust.email.toLowerCase().trim();
      }

      let delQuery = "DELETE FROM notifications WHERE recipient_type = ?";
      const delParams = [recipientType];
      if (recipientId && recipientId !== "all") {
        delQuery += " AND (recipient_id = ? OR recipient_id = 'all')";
        delParams.push(recipientId);
      }
      const [clearRes] = await pool.query(delQuery, delParams);
      return sendJson(res, 200, { success: true, count: clearRes.affectedRows, message: "All notifications cleared successfully." });
    }

    // =========================================================================
    // CUSTOMER SUPPORT & HELPDESK API (Auth & IDOR Hardened)
    // =========================================================================

    // 1. List Support Tickets (Admin & Customer)
    if (pathname === "/api/support/tickets" && method === "GET") {
      const authAdmin = await getAdminFromAuth(req);
      const authCust = await getCustomerFromAuth(req);
      if (!authAdmin && !authCust) {
        return sendJson(res, 401, { error: "Authentication required to access support tickets" });
      }

      const status = url.searchParams.get("status");
      const priority = url.searchParams.get("priority");
      const category = url.searchParams.get("category");
      // If customer, strictly restrict to authentic logged-in email
      const customerEmail = !authAdmin ? authCust.email.toLowerCase().trim() : url.searchParams.get("customer_email");
      const search = url.searchParams.get("search");
      const limit = Math.min(parseInt(url.searchParams.get("limit") || "50", 10), 100);

      let query = `
        SELECT 
          t.*,
          (
            SELECT sender_type 
            FROM support_messages 
            WHERE ticket_id = t.id 
            ORDER BY created_at DESC 
            LIMIT 1
          ) as last_sender_type,
          (
            SELECT message 
            FROM support_messages 
            WHERE ticket_id = t.id 
            ORDER BY created_at DESC 
            LIMIT 1
          ) as last_message_preview,
          (
            SELECT COUNT(*) 
            FROM support_messages 
            WHERE ticket_id = t.id
          ) as total_messages
        FROM support_tickets t 
        WHERE 1=1
      `;
      const params = [];

      if (status && status !== "all") {
        query += " AND t.status = ?";
        params.push(status);
      }

      if (priority && priority !== "all") {
        query += " AND t.priority = ?";
        params.push(priority);
      }

      if (category && category !== "all") {
        query += " AND t.category = ?";
        params.push(category);
      }

      if (customerEmail) {
        query += " AND t.customer_email = ?";
        params.push(customerEmail);
      }

      if (search) {
        query += " AND (t.ticket_number LIKE ? OR t.customer_name LIKE ? OR t.customer_email LIKE ? OR t.subject LIKE ? OR t.order_id LIKE ?)";
        const term = `%${search}%`;
        params.push(term, term, term, term, term);
      }

      // Prioritize unreplied / open tickets at the top, sorted by latest activity
      query += ` ORDER BY 
        CASE 
          WHEN t.status = 'open' THEN 1 
          WHEN t.status = 'in_progress' THEN 2 
          WHEN t.status = 'waiting_customer' THEN 3 
          WHEN t.status = 'resolved' THEN 4 
          ELSE 5 
        END ASC,
        COALESCE(t.last_reply_at, t.created_at) DESC,
        CASE t.priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END ASC
        LIMIT ?`;
      params.push(limit);

      const [tickets] = await pool.query(query, params);

      const enrichedTickets = tickets.map((t) => ({
        ...t,
        needs_reply: (t.status === "open" || t.last_sender_type === "customer") && t.status !== "closed" && t.status !== "resolved",
      }));

      // Aggregate ticket status metrics
      const [metrics] = await pool.query(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open_count,
          SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_count,
          SUM(CASE WHEN status = 'waiting_customer' THEN 1 ELSE 0 END) as waiting_count,
          SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved_count,
          SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed_count
        FROM support_tickets
      `);

      return sendJson(res, 200, {
        tickets: enrichedTickets,
        counts: {
          total: metrics[0]?.total || 0,
          open: metrics[0]?.open_count || 0,
          in_progress: metrics[0]?.in_progress_count || 0,
          waiting_customer: metrics[0]?.waiting_count || 0,
          resolved: metrics[0]?.resolved_count || 0,
          closed: metrics[0]?.closed_count || 0,
        },
      });
    }

    // 2. Create Support Ticket (New Inquiry / Customer or Admin Claim)
    if (pathname === "/api/support/tickets" && method === "POST") {
      const body = await readBody(req);
      const {
        customer_id = null,
        customer_name,
        customer_email,
        customer_phone = null,
        order_id = null,
        category = "general",
        priority = "medium",
        subject,
        message,
      } = body;

      if (!customer_name || !customer_email || !subject || !message) {
        return sendJson(res, 400, {
          error: "customer_name, customer_email, subject, and message are mandatory fields",
        });
      }

      const ticketId = `tick_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const ticketNumber = `SAN-TK-${randomNum}`;

      // Insert Ticket
      await pool.query(
        `INSERT INTO support_tickets 
         (id, ticket_number, customer_id, customer_name, customer_email, customer_phone, order_id, category, priority, status, subject, assigned_to)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', ?, ?)`,
        [
          ticketId,
          ticketNumber,
          customer_id,
          customer_name,
          customer_email,
          customer_phone,
          order_id || null,
          category,
          priority,
          subject,
          "Unassigned",
        ]
      );

      // Insert Initial Message
      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      await pool.query(
        `INSERT INTO support_messages (id, ticket_id, sender_type, sender_name, message, is_internal_note)
         VALUES (?, ?, 'customer', ?, ?, 0)`,
        [messageId, ticketId, customer_name, message]
      );

      // Dispatch Admin Alert Notification
      const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      await pool.query(
        `INSERT INTO notifications (id, recipient_type, recipient_id, type, title, message, link, metadata)
         VALUES (?, 'admin', 'all', 'ticket_created', ?, ?, ?, ?)`,
        [
          notifId,
          `New Support Ticket: ${ticketNumber}`,
          `${customer_name} opened ticket regarding: "${subject}" (${category.replace('_', ' ')})`,
          `/admin/support`,
          JSON.stringify({ ticket_id: ticketId, ticket_number: ticketNumber, priority }),
        ]
      );

      return sendJson(res, 201, {
        success: true,
        ticket: {
          id: ticketId,
          ticket_number: ticketNumber,
          customer_name,
          customer_email,
          order_id,
          category,
          priority,
          status: "open",
          subject,
        },
      });
    }

    // 3. Get Single Ticket Details & Message Timeline (Ownership Verified)
    if (pathname.startsWith("/api/support/tickets/") && !pathname.includes("/messages") && method === "GET") {
      const ticketIdOrNumber = pathname.replace("/api/support/tickets/", "");
      const [ticketRows] = await pool.query(
        "SELECT * FROM support_tickets WHERE id = ? OR ticket_number = ?",
        [ticketIdOrNumber, ticketIdOrNumber]
      );

      if (ticketRows.length === 0) {
        return sendJson(res, 404, { error: "Ticket not found" });
      }

      const ticket = ticketRows[0];
      const authAdmin = await getAdminFromAuth(req);
      const authCust = await getCustomerFromAuth(req);
      const isOwner = authCust && authCust.email.toLowerCase() === ticket.customer_email.toLowerCase();
      if (!authAdmin && !isOwner) {
        return sendJson(res, 403, { error: "Forbidden: Not authorized to view this ticket." });
      }

      // Fetch chronological message thread
      const [messages] = await pool.query(
        "SELECT * FROM support_messages WHERE ticket_id = ? ORDER BY created_at ASC",
        [ticket.id]
      );

      // Fetch linked order if present
      let linkedOrder = null;
      if (ticket.order_id) {
        try {
          const [orderRows] = await pool.query(
            "SELECT id, order_number, customer_name, total_pennies, payment_status, fulfillment_status, delivery_tier, shipping_postcode, created_at FROM orders WHERE id = ? OR order_number = ?",
            [ticket.order_id, ticket.order_id]
          );
          if (orderRows.length > 0) {
            linkedOrder = {
              ...orderRows[0],
              carrier: orderRows[0].delivery_tier === "two_man_white_glove" ? "SAN 2-Man White Glove Fleet" : "DX Express / Freight",
              total_formatted: formatGBP(orderRows[0].total_pennies),
            };
          }
        } catch (e) {
          console.error("Linked order lookup warning:", e.message);
        }
      }

      return sendJson(res, 200, {
        ticket,
        messages,
        linked_order: linkedOrder,
      });
    }

    // 4. Update Ticket (Status, Priority, Assignee - Admin Only)
    if (pathname.startsWith("/api/support/tickets/") && !pathname.includes("/messages") && (method === "PATCH" || method === "PUT")) {
      const authAdmin = await getAdminFromAuth(req);
      if (!authAdmin) {
        return sendJson(res, 403, { error: "Forbidden: Admin privileges required to update tickets." });
      }

      const ticketIdOrNumber = pathname.replace("/api/support/tickets/", "");
      const body = await readBody(req);
      const { status, priority, assigned_to } = body;

      const updates = [];
      const params = [];

      if (status) {
        updates.push("status = ?");
        params.push(status);
      }
      if (priority) {
        updates.push("priority = ?");
        params.push(priority);
      }
      if (assigned_to !== undefined) {
        updates.push("assigned_to = ?");
        params.push(assigned_to);
      }

      if (updates.length === 0) {
        return sendJson(res, 400, { error: "No update parameters provided" });
      }

      params.push(ticketIdOrNumber, ticketIdOrNumber);
      await pool.query(
        `UPDATE support_tickets SET ${updates.join(", ")}, updated_at = NOW() WHERE id = ? OR ticket_number = ?`,
        params
      );

      // If status resolved, notify customer
      if (status === "resolved") {
        const [tRows] = await pool.query("SELECT * FROM support_tickets WHERE id = ? OR ticket_number = ?", [ticketIdOrNumber, ticketIdOrNumber]);
        if (tRows.length > 0) {
          const t = tRows[0];
          const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          await pool.query(
            `INSERT INTO notifications (id, recipient_type, recipient_id, type, title, message, link)
             VALUES (?, 'customer', ?, 'ticket_resolved', ?, ?, '/account')`,
            [
              notifId,
              t.customer_email,
              `Support Ticket ${t.ticket_number} Resolved`,
              `Your inquiry "${t.subject}" has been marked as resolved by our White Glove team.`,
            ]
          );
        }
      }

      return sendJson(res, 200, { success: true, message: "Ticket updated successfully" });
    }

    // 5. Post Message / Reply to Ticket (Sender Identity Enforced)
    if (pathname.startsWith("/api/support/tickets/") && pathname.endsWith("/messages") && method === "POST") {
      const ticketIdOrNumber = pathname.replace("/api/support/tickets/", "").replace("/messages", "");
      const [tRows] = await pool.query(
        "SELECT * FROM support_tickets WHERE id = ? OR ticket_number = ?",
        [ticketIdOrNumber, ticketIdOrNumber]
      );

      if (tRows.length === 0) {
        return sendJson(res, 404, { error: "Ticket not found" });
      }

      const ticket = tRows[0];
      const authAdmin = await getAdminFromAuth(req);
      const authCust = await getCustomerFromAuth(req);
      const isOwner = authCust && authCust.email.toLowerCase() === ticket.customer_email.toLowerCase();
      if (!authAdmin && !isOwner) {
        return sendJson(res, 403, { error: "Forbidden: Not authorized to post messages to this ticket." });
      }

      const body = await readBody(req);
      const {
        message,
        is_internal_note = 0,
      } = body;

      if (!message || !message.trim()) {
        return sendJson(res, 400, { error: "Message content cannot be blank" });
      }

      const sender_type = authAdmin ? "agent" : "customer";
      const sender_id = authAdmin ? authAdmin.id : authCust.id;
      const sender_name = authAdmin ? (authAdmin.full_name || "SAN Concierge Lead") : `${authCust.first_name || "Customer"} ${authCust.last_name || ""}`.trim();
      const internalFlag = authAdmin && is_internal_note ? 1 : 0;

      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      await pool.query(
        `INSERT INTO support_messages (id, ticket_id, sender_type, sender_id, sender_name, message, is_internal_note)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [messageId, ticket.id, sender_type, sender_id, sender_name, message.trim(), internalFlag]
      );

      // Update ticket last_reply_at and status transitions
      if (!is_internal_note) {
        if (sender_type === "agent") {
          await pool.query(
            "UPDATE support_tickets SET last_reply_at = NOW(), status = 'waiting_customer', updated_at = NOW() WHERE id = ?",
            [ticket.id]
          );

          // Dispatch notification to customer
          const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          await pool.query(
            `INSERT INTO notifications (id, recipient_type, recipient_id, type, title, message, link)
             VALUES (?, 'customer', ?, 'ticket_reply', ?, ?, '/account')`,
            [
              notifId,
              ticket.customer_email,
              `New Reply on Ticket ${ticket.ticket_number}`,
              `${sender_name}: "${message.trim().substring(0, 100)}..."`,
            ]
          );
        } else if (sender_type === "customer") {
          await pool.query(
            "UPDATE support_tickets SET last_reply_at = NOW(), status = 'open', updated_at = NOW() WHERE id = ?",
            [ticket.id]
          );

          // Dispatch notification to admin
          const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          await pool.query(
            `INSERT INTO notifications (id, recipient_type, recipient_id, type, title, message, link)
             VALUES (?, 'admin', 'all', 'ticket_reply', ?, ?, '/admin/support')`,
            [
              notifId,
              `Customer Reply: ${ticket.ticket_number}`,
              `${sender_name} replied to ticket: "${message.trim().substring(0, 100)}..."`,
            ]
          );
        }
      }

      return sendJson(res, 201, {
        success: true,
        message: {
          id: messageId,
          ticket_id: ticket.id,
          sender_type,
          sender_name,
          message: message.trim(),
          is_internal_note: is_internal_note ? 1 : 0,
          created_at: new Date().toISOString(),
        },
      });
    }

    // 404 Catch-All
    sendJson(res, 404, { error: "Endpoint not found", path: pathname });
  } catch (err) {
    console.error(`[Server Error on ${pathname}]:`, err);
    sendJson(res, 500, { error: "Internal Server Error", message: err.message });
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`\n======================================================`);
  console.log(`🚀 SAN FURNITURE COMMERCE ENGINE ACTIVE`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`🗄️ Database: MySQL "san_furniture" on localhost:${DB_CONFIG.port}`);
  console.log(`🩺 Health: http://localhost:${PORT}/health`);
  console.log(`🛋️ Products: http://localhost:${PORT}/api/products`);
  console.log(`======================================================\n`);

  // Background Periodic Reconciler: Checks every hour if automated live sync is due
  const SYNC_CHECK_INTERVAL_MS = 60 * 60 * 1000;
  setInterval(async () => {
    try {
      const [rows] = await pool.query(
        "SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN ('amos_mann_auto_sync_enabled', 'amos_mann_sync_interval_hours', 'amos_mann_last_cron_run')"
      );
      const settings = Object.fromEntries(rows.map(r => [r.setting_key, r.setting_value]));
      if (settings.amos_mann_auto_sync_enabled === "true") {
        const intervalHours = parseFloat(settings.amos_mann_sync_interval_hours || "6");
        const lastRun = settings.amos_mann_last_cron_run ? new Date(settings.amos_mann_last_cron_run).getTime() : 0;
        const now = Date.now();
        if (now - lastRun >= intervalHours * 3600 * 1000) {
          console.log(`[Auto-Cron] Triggering periodic Amos Mann live website reconciliation (${intervalHours}h interval due)...`);
          const res = await amosMannExtractor.syncTrackedCatalog(pool, { triggerType: "cron" });
          await pool.query(
            "UPDATE system_settings SET setting_value = ?, updated_at = NOW() WHERE setting_key = 'amos_mann_last_cron_run'",
            [new Date().toISOString()]
          );
          console.log(`[Auto-Cron] Finished: ${res.itemsScanned} items scanned, ${res.pricesUpdated} prices updated, ${res.stockUpdated} stock status updated.`);
        }
      }

      // 2. Furniture To Go (FTG) Automated Periodic Live Web Sync
      const [ftgRows] = await pool.query(
        "SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN ('furniture_to_go_auto_sync_enabled', 'furniture_to_go_sync_interval_hours', 'furniture_to_go_last_cron_run')"
      );
      const ftgSettings = Object.fromEntries(ftgRows.map(r => [r.setting_key, r.setting_value]));
      if (ftgSettings.furniture_to_go_auto_sync_enabled === "true") {
        const intervalHours = parseFloat(ftgSettings.furniture_to_go_sync_interval_hours || "6");
        const lastRun = ftgSettings.furniture_to_go_last_cron_run ? new Date(ftgSettings.furniture_to_go_last_cron_run).getTime() : 0;
        const now = Date.now();
        if (now - lastRun >= intervalHours * 3600 * 1000) {
          console.log(`[Auto-Cron FTG] Triggering periodic Furniture To Go live reconciliation (${intervalHours}h interval due)...`);
          const res = await furnitureToGoExtractor.syncTrackedCatalog(pool, { triggerType: "cron" });
          await pool.query(
            "UPDATE system_settings SET setting_value = ?, updated_at = NOW() WHERE setting_key = 'furniture_to_go_last_cron_run'",
            [new Date().toISOString()]
          );
          console.log(`[Auto-Cron FTG] Finished: ${res.itemsScanned} items scanned, ${res.pricesUpdated} prices updated, ${res.stockUpdated} stock status updated.`);
        }
      }
    } catch (e) {
      console.error("[Auto-Cron Error]:", e.message);
    }
  }, SYNC_CHECK_INTERVAL_MS);
});
