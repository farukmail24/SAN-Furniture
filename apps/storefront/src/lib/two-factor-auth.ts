import crypto from "node:crypto";
import QRCode from "qrcode";
import { sendRawEmail } from "./notifications-dispatcher";

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

const AUTH_SECRET =
  process.env.SAN_AUTH_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  "san_furniture_super_secret_master_key_2026";

/**
 * Generate a cryptographically random Base32 string (default 20 bytes = 32 chars)
 * for RFC 6238 TOTP Authenticator apps.
 */
export function generateBase32Secret(byteLength = 20): string {
  const bytes = crypto.randomBytes(byteLength);
  let bits = 0;
  let value = 0;
  let output = "";

  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i];
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

/**
 * Decode a Base32 string into a Buffer
 */
export function base32Decode(str: string): Buffer {
  const cleanStr = str.toUpperCase().replace(/=+$/, "").replace(/\s+/g, "");
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (let i = 0; i < cleanStr.length; i++) {
    const val = BASE32_ALPHABET.indexOf(cleanStr[i]);
    if (val === -1) continue;
    value = (value << 5) | val;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

/**
 * Generate a standard 6-digit TOTP code for a given secret and timestamp
 */
export function generateTOTP(secret: string, time = Date.now(), stepSeconds = 30): string {
  const counter = Math.floor(time / 1000 / stepSeconds);
  const buf = Buffer.alloc(8);
  buf.writeBigInt64BE(BigInt(counter), 0);

  const key = base32Decode(secret);
  const hmac = crypto.createHmac("sha1", key).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;

  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  return (binary % 1000000).toString().padStart(6, "0");
}

/**
 * Verify a 6-digit TOTP code against a secret with clock drift window (±1 step = 30s)
 */
export function verifyTOTP(secret: string, token: string, window = 1): boolean {
  const cleanToken = String(token || "").trim();
  if (!/^\d{6}$/.test(cleanToken)) return false;

  const now = Date.now();
  for (let step = -window; step <= window; step++) {
    const expected = generateTOTP(secret, now + step * 30000);
    if (cleanToken === expected) return true;
  }
  return false;
}

/**
 * Generate standard otpauth URL for QR code scanning in Google Authenticator, etc.
 */
export function generateOtpauthUri(
  email: string,
  secret: string,
  issuer = "SAN Furniture UK"
): string {
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedAccount = encodeURIComponent(email);
  return `otpauth://totp/${encodedIssuer}:${encodedAccount}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
}

/**
 * Generate QR code Data URL image for mobile scanning
 */
export async function generateQRCodeDataUrl(otpauthUri: string): Promise<string> {
  return QRCode.toDataURL(otpauthUri, {
    width: 256,
    margin: 2,
    color: {
      dark: "#00072D", // SAN Navy
      light: "#FFFFFF",
    },
    errorCorrectionLevel: "M",
  });
}

/**
 * Generate a cryptographically secure 6-digit numeric OTP for Email 2FA
 */
export function generateEmailOTP(): string {
  const num = crypto.randomInt(100000, 999999);
  return num.toString();
}

/**
 * Generate backup recovery codes (e.g. 8 single-use codes)
 */
export function generateRecoveryCodes(count = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const part1 = crypto.randomBytes(2).toString("hex").toUpperCase();
    const part2 = crypto.randomBytes(2).toString("hex").toUpperCase();
    codes.push(`${part1}-${part2}`);
  }
  return codes;
}

/**
 * SHA-256 hash a recovery code for secure database storage
 */
export function hashRecoveryCode(code: string): string {
  const normalized = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

/**
 * Verify a submitted recovery code against stored hashed recovery codes
 */
export function verifyAndConsumeRecoveryCode(
  submittedCode: string,
  storedHashedCodes: string[]
): { valid: boolean; remainingHashedCodes: string[] } {
  const submittedHash = hashRecoveryCode(submittedCode);
  const index = storedHashedCodes.indexOf(submittedHash);

  if (index === -1) {
    return { valid: false, remainingHashedCodes: storedHashedCodes };
  }

  // Consume the code
  const remaining = [...storedHashedCodes];
  remaining.splice(index, 1);
  return { valid: true, remainingHashedCodes: remaining };
}

/**
 * Mask an email address for safe display (e.g. a***r@sanfurniture.co.uk)
 */
export function maskEmail(email: string): string {
  const parts = email.split("@");
  if (parts.length !== 2) return email;
  const name = parts[0];
  const domain = parts[1];
  if (name.length <= 2) {
    return `${name[0]}*@${domain}`;
  }
  return `${name[0]}${"*".repeat(Math.min(name.length - 2, 4))}${name[name.length - 1]}@${domain}`;
}

/**
 * Sign a short-lived (5 min) 2FA verification ticket for Step 2 of login
 */
export function sign2FATicket(userId: string, email: string): string {
  const payload = {
    uid: userId,
    em: email,
    exp: Date.now() + 5 * 60 * 1000, // 5 minutes
    act: "2fa_challenge",
  };
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", AUTH_SECRET).update(data).digest("base64url");
  return `${data}.${sig}`;
}

/**
 * Verify and decode a 2FA verification ticket
 */
export function verify2FATicket(ticket: string): { valid: boolean; userId?: string; email?: string; error?: string } {
  if (!ticket || typeof ticket !== "string" || !ticket.includes(".")) {
    return { valid: false, error: "Invalid verification ticket format." };
  }

  const [data, sig] = ticket.split(".");
  const expectedSig = crypto.createHmac("sha256", AUTH_SECRET).update(data).digest("base64url");

  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) {
    return { valid: false, error: "Verification ticket signature is invalid." };
  }

  try {
    const jsonStr = Buffer.from(data, "base64url").toString("utf8");
    const payload = JSON.parse(jsonStr);

    if (payload.act !== "2fa_challenge") {
      return { valid: false, error: "Invalid ticket type." };
    }

    if (Date.now() > payload.exp) {
      return { valid: false, error: "Verification ticket has expired. Please log in again." };
    }

    return { valid: true, userId: payload.uid, email: payload.em };
  } catch {
    return { valid: false, error: "Corrupted verification ticket." };
  }
}

/**
 * Send branded 2FA verification code to Admin email
 */
export async function send2FAEmailCode(
  email: string,
  name: string,
  code: string,
  ipAddress?: string
): Promise<{ success: boolean; error?: string }> {
  const subject = `Your SAN Furniture Admin Verification Code: ${code}`;
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>SAN Furniture UK - Admin Verification Code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #00072D; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #F7F5F0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #00072D; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="560" cellpadding="0" cellspacing="0" style="max-width: 560px; background-color: #000F3A; border: 1px solid #1C2D5A; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px 32px; text-align: center; border-bottom: 1px solid #1C2D5A;">
              <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #C5A880; letter-spacing: 1px;">SAN FURNITURE UK</h1>
              <p style="margin: 6px 0 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #8FA2C4;">Corporate Operations Security</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 16px 0; font-size: 14px; color: #E0DCD3;">Hello <strong style="color: #FFFFFF;">${name || "Staff Member"}</strong>,</p>
              <p style="margin: 0 0 24px 0; font-size: 13px; line-height: 1.6; color: #B0C0DA;">
                A sign-in attempt was initiated for your SAN Furniture Administrative Account. Please use the following 6-digit Two-Factor Authentication (2FA) verification code to complete your login:
              </p>

              <!-- Code Box -->
              <div style="background-color: #00072D; border: 2px dashed #C5A880; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
                <span style="font-family: monospace, Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #FFFFFF; display: inline-block;">
                  ${code}
                </span>
                <p style="margin: 8px 0 0 0; font-size: 11px; color: #C5A880; font-weight: 600;">
                  Valid for 10 minutes &bull; Single-use only
                </p>
              </div>

              <!-- Context Details -->
              <table width="100%" cellpadding="6" cellspacing="0" style="font-size: 11px; color: #8FA2C4; background-color: #00072D; border-radius: 8px; margin-bottom: 24px;">
                <tr>
                  <td width="30%"><strong>Timestamp:</strong></td>
                  <td>${new Date().toUTCString()}</td>
                </tr>
                ${
                  ipAddress
                    ? `<tr>
                  <td><strong>Client IP:</strong></td>
                  <td><code>${ipAddress}</code></td>
                </tr>`
                    : ""
                }
              </table>

              <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #9B3828; font-weight: 500;">
                🔒 If you did not initiate this sign-in attempt, please immediately contact SAN IT Security or change your master staff password.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; background-color: #00072D; border-top: 1px solid #1C2D5A; text-align: center; font-size: 10px; color: #5B7298;">
              SAN Furniture Limited &bull; 112 Coventry Road, Exhall, CV7 9EU &bull; Registered in England & Wales
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return sendRawEmail({
    to: email,
    subject,
    html,
    text: `Your SAN Furniture Admin Verification Code is: ${code}. This code expires in 10 minutes. If you did not request this, please contact IT Security immediately.`,
  });
}
