import { getDbPool } from "./db";

declare global {
  // eslint-disable-next-line no-var
  var __san2FASchemaEnsured: boolean | undefined;
}

/**
 * Self-healing schema migrator for Admin Two-Factor Authentication (2FA).
 * Verifies and applies missing 2FA columns to `admin_users` table in MySQL.
 */
export async function ensure2FASchema(force = false): Promise<{ success: boolean; changes: string[] }> {
  if (globalThis.__san2FASchemaEnsured && !force) {
    return { success: true, changes: ["already_verified"] };
  }

  const pool = getDbPool();
  const changes: string[] = [];

  try {
    // 1. Inspect existing columns in admin_users
    const [cols]: any = await pool.query("DESCRIBE admin_users");
    const existingCols = new Set<string>((cols || []).map((c: any) => c.Field));

    // 2. Add two_factor_enabled if missing
    if (!existingCols.has("two_factor_enabled")) {
      await pool.query(
        "ALTER TABLE admin_users ADD COLUMN two_factor_enabled TINYINT(1) NOT NULL DEFAULT 0 AFTER is_active"
      );
      changes.push("added_two_factor_enabled");
    }

    // 3. Add two_factor_method if missing (app or email)
    if (!existingCols.has("two_factor_method")) {
      await pool.query(
        "ALTER TABLE admin_users ADD COLUMN two_factor_method VARCHAR(20) NOT NULL DEFAULT 'app' AFTER two_factor_enabled"
      );
      changes.push("added_two_factor_method");
    }

    // 4. Add two_factor_secret (for TOTP apps)
    if (!existingCols.has("two_factor_secret")) {
      await pool.query(
        "ALTER TABLE admin_users ADD COLUMN two_factor_secret VARCHAR(255) NULL AFTER two_factor_method"
      );
      changes.push("added_two_factor_secret");
    }

    // 5. Add two_factor_temp_secret (for pending setup verification)
    if (!existingCols.has("two_factor_temp_secret")) {
      await pool.query(
        "ALTER TABLE admin_users ADD COLUMN two_factor_temp_secret VARCHAR(255) NULL AFTER two_factor_secret"
      );
      changes.push("added_two_factor_temp_secret");
    }

    // 6. Add two_factor_verified_at
    if (!existingCols.has("two_factor_verified_at")) {
      await pool.query(
        "ALTER TABLE admin_users ADD COLUMN two_factor_verified_at DATETIME NULL AFTER two_factor_temp_secret"
      );
      changes.push("added_two_factor_verified_at");
    }

    // 7. Add email_otp_code (for email-based 2FA)
    if (!existingCols.has("email_otp_code")) {
      await pool.query(
        "ALTER TABLE admin_users ADD COLUMN email_otp_code VARCHAR(10) NULL AFTER two_factor_verified_at"
      );
      changes.push("added_email_otp_code");
    }

    // 8. Add email_otp_expires_at
    if (!existingCols.has("email_otp_expires_at")) {
      await pool.query(
        "ALTER TABLE admin_users ADD COLUMN email_otp_expires_at DATETIME NULL AFTER email_otp_code"
      );
      changes.push("added_email_otp_expires_at");
    }

    // 9. Add two_factor_recovery_codes (JSON array of backup recovery codes)
    if (!existingCols.has("two_factor_recovery_codes")) {
      await pool.query(
        "ALTER TABLE admin_users ADD COLUMN two_factor_recovery_codes TEXT NULL AFTER email_otp_expires_at"
      );
      changes.push("added_two_factor_recovery_codes");
    }

    globalThis.__san2FASchemaEnsured = true;
    return { success: true, changes };
  } catch (err: any) {
    console.error("[ensure2FASchema Error]:", err);
    return { success: false, changes: [err?.message || String(err)] };
  }
}
