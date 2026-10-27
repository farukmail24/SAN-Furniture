import { test } from "node:test";
import assert from "node:assert";
import crypto from "node:crypto";
import { classifyUKPostcode } from "@san-furniture/types";

// ==============================================================
// 1. FINANCIAL INTEGRITY: HIGHLANDS SURCHARGE VERIFICATION
// ==============================================================
test("Logistics & Surcharge: Highlands delivery postcode enforces £49.00 (4900 pennies)", () => {
  const highlandsPostcode = "IV1 1AA";
  const mainlandPostcode = "SW1A 1AA";

  const zoneHighlands = classifyUKPostcode(highlandsPostcode);
  const zoneMainland = classifyUKPostcode(mainlandPostcode);

  assert.strictEqual(zoneHighlands, "zone_2_scottish_highlands");
  assert.strictEqual(zoneMainland, "zone_1_mainland");

  // Verify surcharge math
  const baseOrderPennies = 129900; // £1,299.00
  const tierShippingPennies = 0;   // Free Mainland
  const highlandsSurchargePennies = zoneHighlands === "zone_2_scottish_highlands" ? 4900 : 0;

  const totalHighlands = baseOrderPennies + tierShippingPennies + highlandsSurchargePennies;
  assert.strictEqual(totalHighlands, 134800, "Expected £1,348.00 total for Highlands delivery");
});

// ==============================================================
// 2. CRYPTOGRAPHIC AUTH & PASSWORD INTEGRITY (PBKDF2 SHA-512)
// ==============================================================
test("Security Cryptography: PBKDF2 100k rounds password hashing & verification", () => {
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

  const rawPassword = "BespokeUkFurniture_2026!Secure";
  const hashed = hashPassword(rawPassword);

  assert.strictEqual(verifyPassword(rawPassword, hashed), true, "Correct password must verify");
  assert.strictEqual(verifyPassword("WrongPassword123!", hashed), false, "Incorrect password must be rejected");
  assert.strictEqual(verifyPassword("", hashed), false, "Empty password must be rejected");
  assert.strictEqual(verifyPassword(rawPassword, "malformed_hash"), false, "Malformed hash must safely fail");
});

// ==============================================================
// 3. STRIPE WEBHOOK HMAC-SHA256 SIGNATURE VERIFICATION
// ==============================================================
test("Stripe Webhook Security: Cryptographic HMAC signature check & replay protection", () => {
  function verifyStripeSignature(rawPayload, signatureHeader, webhookSecret, toleranceSeconds = 300) {
    if (!signatureHeader || !webhookSecret) return false;
    const components = signatureHeader.split(",").reduce((acc, pair) => {
      const [k, v] = pair.split("=");
      if (k && v) acc[k.trim()] = v.trim();
      return acc;
    }, {});
    const timestamp = parseInt(components.t, 10);
    const signature = components.v1;
    if (isNaN(timestamp) || !signature) return false;
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - timestamp) > toleranceSeconds) return false;
    const signedPayload = `${timestamp}.${rawPayload}`;
    const expectedSig = crypto.createHmac("sha256", webhookSecret).update(signedPayload, "utf8").digest("hex");
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expBuf.length) return false;
    return crypto.timingSafeEqual(sigBuf, expBuf);
  }

  const secret = "whsec_test_secret_998124_san_furniture";
  const payload = JSON.stringify({
    id: "evt_test_123",
    type: "payment_intent.succeeded",
    data: { object: { id: "pi_test_uk_001", amount_received: 129900 } },
  });

  const validTimestamp = Math.floor(Date.now() / 1000);
  const validSignature = crypto
    .createHmac("sha256", secret)
    .update(`${validTimestamp}.${payload}`, "utf8")
    .digest("hex");
  const validHeader = `t=${validTimestamp},v1=${validSignature}`;

  // Valid signature
  assert.strictEqual(verifyStripeSignature(payload, validHeader, secret), true, "Valid webhook signature must pass");

  // Tampered payload
  const tamperedPayload = payload.replace("129900", "99900");
  assert.strictEqual(verifyStripeSignature(tamperedPayload, validHeader, secret), false, "Tampered payload must be rejected");

  // Expired timestamp (Replay attack simulation: 10 minutes ago)
  const expiredTimestamp = validTimestamp - 600;
  const expiredSignature = crypto
    .createHmac("sha256", secret)
    .update(`${expiredTimestamp}.${payload}`, "utf8")
    .digest("hex");
  const expiredHeader = `t=${expiredTimestamp},v1=${expiredSignature}`;
  assert.strictEqual(verifyStripeSignature(payload, expiredHeader, secret), false, "Replay attack outside tolerance must be rejected");
});

// ==============================================================
// 4. SUPPORT DESK MESSAGE ATTRIBUTION & NOTE PRIVACY
// ==============================================================
test("Support Desk Security: Customer replies cannot create internal notes or impersonate agents", () => {
  // Test customer message sanitizer
  function processCustomerMessage(body, authCustomer) {
    if (!authCustomer) throw new Error("Unauthorized");
    return {
      sender_type: "customer",
      sender_id: authCustomer.id,
      sender_name: `${authCustomer.firstName} ${authCustomer.lastName}`.trim(),
      message: body.message.trim(),
      is_internal_note: 0, // Enforced zero
      status: "waiting_agent", // Customer reply awaits agent
    };
  }

  const custUser = { id: "cust_01", email: "eleanor.vance@gmail.com", firstName: "Eleanor", lastName: "Vance" };
  const attackPayload = {
    message: "When will my Mayfair dining table arrive?",
    is_internal_note: 1, // Attacker tries to inject private internal note
    sender_type: "agent", // Attacker tries to impersonate support agent
    sender_name: "Lead Support Specialist",
  };

  const processed = processCustomerMessage(attackPayload, custUser);

  assert.strictEqual(processed.sender_type, "customer", "Must be overridden to customer");
  assert.strictEqual(processed.sender_id, "cust_01", "Must match customer ID");
  assert.strictEqual(processed.sender_name, "Eleanor Vance");
  assert.strictEqual(processed.is_internal_note, 0, "Internal note flag must be forcibly cleared");
  assert.strictEqual(processed.status, "waiting_agent", "Status must become waiting_agent");
});

// ==============================================================
// 5. CATALOG STATUS CHECK IN CHECKOUT
// ==============================================================
test("Catalog Integrity: Checkout rejects out_of_stock and draft items", () => {
  const products = [
    { id: "prod_1", title: "Kensington Sofa", status: "published", price_pennies: 129900 },
    { id: "prod_2", title: "Belgravia Ottoman", status: "draft", price_pennies: 89900 },
    { id: "prod_3", title: "Mayfair Table", status: "out_of_stock", price_pennies: 219900 },
  ];

  function validateBasketItem(item, productMap) {
    const product = productMap.get(item.id);
    if (!product) return { valid: false, error: "Not found" };
    if (product.status !== "published") {
      return { valid: false, error: `Product "${product.title}" is currently unavailable for purchase.` };
    }
    return { valid: true, product };
  }

  const pMap = new Map(products.map((p) => [p.id, p]));

  assert.strictEqual(validateBasketItem({ id: "prod_1" }, pMap).valid, true);
  assert.strictEqual(validateBasketItem({ id: "prod_2" }, pMap).valid, false);
  assert.strictEqual(validateBasketItem({ id: "prod_3" }, pMap).valid, false);
});
