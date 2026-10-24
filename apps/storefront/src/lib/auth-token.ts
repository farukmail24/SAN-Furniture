import crypto from "node:crypto";
import { getDbPool } from "./db";

const AUTH_SECRET =
  process.env.SAN_AUTH_SECRET ||
  process.env.JWT_SECRET ||
  process.env.AUTH_SECRET ||
  "san_furniture_uk_master_jwt_secret_998124_prod";

export interface AuthPayload {
  type: string;
  id: string;
  ts: number;
  nonce: string;
}

export function signAuthToken(type: "adm" | "cust", id: string): string {
  const timestamp = Date.now();
  const nonce = crypto.randomBytes(8).toString("hex");
  const payloadStr = JSON.stringify({ type, id, ts: timestamp, nonce });
  const payloadB64 = Buffer.from(payloadStr).toString("base64url");
  const signature = crypto.createHmac("sha256", AUTH_SECRET).update(payloadB64).digest("hex");
  return `san_${type}.${payloadB64}.${signature}`;
}

export function verifyAuthToken(
  token: string | null | undefined,
  expectedType: "adm" | "cust"
): AuthPayload | null {
  if (!token || typeof token !== "string") return null;
  const parts = token.trim().split(".");
  if (parts.length !== 3) return null;
  const [prefix, payloadB64, signature] = parts;
  if (prefix !== `san_${expectedType}`) return null;

  const expectedSig = crypto.createHmac("sha256", AUTH_SECRET).update(payloadB64).digest("hex");
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length) return null;
  if (!crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8")) as AuthPayload;
    if (payload.type !== expectedType || !payload.id) return null;
    const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days TTL
    if (Date.now() - payload.ts > MAX_AGE_MS) return null;
    return payload;
  } catch {
    return null;
  }
}

export function extractBearerOrCookieToken(
  request: Request,
  cookieName: "san_admin_token" | "san_customer_token"
): string | null {
  const authHeader = request.headers.get("authorization") || "";
  if (authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7).trim();
  }

  const cookieHeader = request.headers.get("cookie") || "";
  if (cookieHeader) {
    const cookies = cookieHeader.split(";").reduce<Record<string, string>>((acc, pair) => {
      const [k, v] = pair.trim().split("=");
      if (k && v) acc[k] = decodeURIComponent(v);
      return acc;
    }, {});
    if (cookies[cookieName]) {
      return cookies[cookieName];
    }
  }

  return null;
}

export async function getAdminFromRequest(
  request: Request
): Promise<{ id: string; email: string; fullName: string; role: string } | null> {
  const token = extractBearerOrCookieToken(request, "san_admin_token");
  if (!token) return null;

  const payload = verifyAuthToken(token, "adm");
  if (!payload || !payload.id) return null;

  try {
    const pool = getDbPool();
    const [rows]: any = await pool.query(
      "SELECT id, email, full_name, role, is_active FROM admin_users WHERE id = ? LIMIT 1",
      [payload.id]
    );

    if (!rows || rows.length === 0 || !rows[0].is_active) {
      return null;
    }

    return {
      id: rows[0].id,
      email: rows[0].email,
      fullName: rows[0].full_name,
      role: rows[0].role,
    };
  } catch (err) {
    console.error("[getAdminFromRequest] DB error:", err);
    return null;
  }
}

export async function getCustomerFromRequest(
  request: Request
): Promise<{ id: string; email: string; firstName: string; lastName: string; phone?: string } | null> {
  const token = extractBearerOrCookieToken(request, "san_customer_token");
  if (!token) return null;

  const payload = verifyAuthToken(token, "cust");
  if (!payload || !payload.id) return null;

  try {
    const pool = getDbPool();
    const [rows]: any = await pool.query(
      "SELECT id, email, first_name, last_name, phone FROM customers WHERE id = ? LIMIT 1",
      [payload.id]
    );

    if (!rows || rows.length === 0) {
      return null;
    }

    return {
      id: rows[0].id,
      email: rows[0].email,
      firstName: rows[0].first_name,
      lastName: rows[0].last_name,
      phone: rows[0].phone,
    };
  } catch (err) {
    console.error("[getCustomerFromRequest] DB error:", err);
    return null;
  }
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash || !storedHash.includes(":")) return false;
  const [salt, originalHash] = storedHash.split(":");
  const testHash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  const origBuf = Buffer.from(originalHash);
  const testBuf = Buffer.from(testHash);
  if (origBuf.length !== testBuf.length) return false;
  return crypto.timingSafeEqual(origBuf, testBuf);
}
