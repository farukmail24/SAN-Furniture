import { CustomerRegistrationSchema } from "@san-furniture/types";
import test from "node:test";
import assert from "node:assert/strict";

import { SlidingWindowRateLimiter } from "../dist/src/modules/security/services/rate-limiter.js";
import { IpJailService } from "../dist/src/modules/security/services/ip-jail-service.js";
import { CloudflareTurnstileService } from "../dist/src/modules/security/services/turnstile-service.js";

test("SlidingWindowRateLimiter: Blocks excess requests under sliding log algorithm", () => {
  const limiter = new SlidingWindowRateLimiter();
  const testIp = "192.168.1.100";

  // Tier 'auth': allows 5 requests / 15 minutes
  for (let i = 1; i <= 5; i++) {
    const res = limiter.checkLimit("auth", testIp);
    assert.equal(res.allowed, true);
    assert.equal(res.currentCount, i);
  }

  // 6th attempt should be blocked
  const blockedRes = limiter.checkLimit("auth", testIp);
  assert.equal(blockedRes.allowed, false);
  assert.equal(blockedRes.remaining, 0);
  assert.ok(blockedRes.resetSeconds > 0);

  // Reset limit
  limiter.resetLimit("auth", testIp);
  const afterReset = limiter.checkLimit("auth", testIp);
  assert.equal(afterReset.allowed, true);

  // Tier 'checkout': allows 3 attempts / 10 minutes (carding attack mitigation)
  const checkoutIp = "192.168.1.101";
  assert.equal(limiter.checkLimit("checkout", checkoutIp).allowed, true);
  assert.equal(limiter.checkLimit("checkout", checkoutIp).allowed, true);
  assert.equal(limiter.checkLimit("checkout", checkoutIp).allowed, true);
  assert.equal(limiter.checkLimit("checkout", checkoutIp).allowed, false);
});

test("IpJailService: Escalates lockouts and permits admin unblock overrides", () => {
  const jailService = new IpJailService();
  const attackerIp = "203.0.113.42";

  // 1 to 4 failed attempts: not jailed yet
  for (let i = 1; i <= 4; i++) {
    const jailRecord = jailService.recordFailure(attackerIp);
    assert.equal(jailRecord, null);
    const status = jailService.isIpJailed(attackerIp);
    assert.equal(status.jailed, false);
  }

  // 5th failed attempt: Strike 1 -> 15 min lock
  const strike1 = jailService.recordFailure(attackerIp);
  assert.ok(strike1);
  assert.equal(strike1.strikeCount, 1);
  assert.equal(strike1.isPermanent, false);

  const check1 = jailService.isIpJailed(attackerIp);
  assert.equal(check1.jailed, true);
  assert.ok(check1.remainingSeconds > 800); // approx 900s
  assert.equal(check1.strikeCount, 1);

  // Active records listing includes attacker
  const activeRecords = jailService.listActiveJailRecords();
  assert.ok(activeRecords.some((r) => r.ip === attackerIp));

  // Admin releases IP
  const unblocked = jailService.releaseIp(attackerIp);
  assert.equal(unblocked, true);
  assert.equal(jailService.isIpJailed(attackerIp).jailed, false);

  // Repeated offense after unblock: Strike 2 -> 1 hour lockout
  for (let i = 1; i <= 5; i++) {
    jailService.recordFailure(attackerIp);
  }
  const check2 = jailService.isIpJailed(attackerIp);
  assert.equal(check2.jailed, true);
  assert.equal(check2.strikeCount, 2); // escalated strike 2
});

test("CloudflareTurnstileService: Accurately validates test tokens and handles mock modes", async () => {
  const turnstile = new CloudflareTurnstileService();

  // Test pass token
  const passResult = await turnstile.verifyToken(CloudflareTurnstileService.DUMMY_PASS_TOKEN);
  assert.equal(passResult.success, true);
  assert.equal(passResult.hostname, "sanfurniture.com");

  // Test fail token
  const failResult = await turnstile.verifyToken(CloudflareTurnstileService.DUMMY_FAIL_TOKEN);
  assert.equal(failResult.success, false);
  assert.ok(failResult.errorCodes?.includes("invalid-input-response"));

  // Empty token
  const emptyResult = await turnstile.verifyToken("");
  assert.equal(emptyResult.success, false);
  assert.ok(emptyResult.errorCodes?.includes("missing-input-response"));
});


test("Customer Registration Validation: Requires valid mobile phone number for UK delivery", () => {
  const payloadMissingPhone = {
    firstName: "Arthur",
    lastName: "Dent",
    email: "arthur.dent@example.co.uk",
    password: "Password123!"
  };
  const missingRes = CustomerRegistrationSchema.safeParse(payloadMissingPhone);
  assert.equal(missingRes.success, false);

  const payloadShortPhone = {
    ...payloadMissingPhone,
    phone: "07700"
  };
  const shortRes = CustomerRegistrationSchema.safeParse(payloadShortPhone);
  assert.equal(shortRes.success, false);

  const payloadValid = {
    ...payloadMissingPhone,
    phone: "+44 7700 900123"
  };
  const validRes = CustomerRegistrationSchema.safeParse(payloadValid);
  assert.equal(validRes.success, true);
  if (validRes.success) {
    assert.equal(validRes.data.phone, "+44 7700 900123");
  }
});
