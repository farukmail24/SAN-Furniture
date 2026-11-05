import { getDbPool } from "./db";
import crypto from "node:crypto";

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 mins
const MAX_FAILED_ATTEMPTS = 5;

// In-memory sliding log for high-performance immediate checks
const ipAttempts = new Map<string, number[]>();

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "127.0.0.1";
}

/**
 * Check if the IP is currently locked out in MySQL `security_ip_jail` or sliding window
 */
export async function checkIpSecurity(ip: string): Promise<{ allowed: boolean; message?: string }> {
  try {
    const pool = getDbPool();
    const [rows]: any = await pool.query(
      `SELECT ip_address, strike_count, reason, locked_until, is_permanent 
       FROM security_ip_jail 
       WHERE ip_address = ? 
       LIMIT 1`,
      [ip]
    ).catch(() => [[]]);

    if (Array.isArray(rows) && rows.length > 0) {
      const record = rows[0];
      if (record.is_permanent) {
        return {
          allowed: false,
          message: "Access permanently restricted due to repeated security violations.",
        };
      }
      if (record.locked_until) {
        const lockTime = new Date(record.locked_until).getTime();
        const now = Date.now();
        if (lockTime > now) {
          const remainingMins = Math.ceil((lockTime - now) / (60 * 1000));
          return {
            allowed: false,
            message: `Account temporarily locked due to consecutive failed attempts. Please retry in ${remainingMins} minute(s).`,
          };
        }
      }
    }
  } catch (err) {
    console.warn("[SecurityGuard] DB Jail check warning:", err);
  }

  // Sliding window memory check
  const now = Date.now();
  const timestamps = (ipAttempts.get(ip) || []).filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);
  ipAttempts.set(ip, timestamps);

  if (timestamps.length >= MAX_FAILED_ATTEMPTS) {
    return {
      allowed: false,
      message: "Too many authentication attempts. Please wait 15 minutes before trying again.",
    };
  }

  return { allowed: true };
}

/**
 * Record a failed authentication attempt.
 * If 5 consecutive failures are reached, auto-insert / escalate in `security_ip_jail`.
 */
export async function recordFailedAuth(ip: string, reason = "failed_login"): Promise<void> {
  const now = Date.now();
  const timestamps = (ipAttempts.get(ip) || []).filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);
  timestamps.push(now);
  ipAttempts.set(ip, timestamps);

  if (timestamps.length >= MAX_FAILED_ATTEMPTS) {
    try {
      const pool = getDbPool();
      const [existing]: any = await pool.query(
        "SELECT id, strike_count FROM security_ip_jail WHERE ip_address = ? LIMIT 1",
        [ip]
      ).catch(() => [[]]);

      const currentStrikes = Array.isArray(existing) && existing.length > 0 ? (existing[0].strike_count || 1) + 1 : 1;
      let durationMins = 15;
      let isPermanent = 0;

      if (currentStrikes === 2) durationMins = 60;
      else if (currentStrikes === 3) durationMins = 1440; // 24 hours
      else if (currentStrikes >= 4) isPermanent = 1;

      const lockedUntil = new Date(now + durationMins * 60 * 1000);
      const jailId = existing?.[0]?.id || `jail_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

      await pool.query(
        `INSERT INTO security_ip_jail (id, ip_address, strike_count, reason, locked_until, is_permanent, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE 
           strike_count = strike_count + 1,
           reason = VALUES(reason),
           locked_until = VALUES(locked_until),
           is_permanent = VALUES(is_permanent),
           updated_at = NOW()`,
        [jailId, ip, currentStrikes, `${reason} (${timestamps.length} failed attempts)`, lockedUntil, isPermanent]
      ).catch(() => {});
    } catch (err) {
      console.warn("[SecurityGuard] Failed to record IP Jail strike:", err);
    }
  }
}

/**
 * Clear failed attempts upon successful authentication
 */
export async function recordSuccessfulAuth(ip: string): Promise<void> {
  ipAttempts.delete(ip);
}
