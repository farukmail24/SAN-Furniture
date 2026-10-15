import test from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";

import { ShippingRateService } from "../dist/src/modules/logistics/services/shipping-rate-service.js";
import { PostcodeLookupService } from "../dist/src/modules/logistics/services/postcode-lookup-service.js";
import { StripeWebhookHandler } from "../dist/src/modules/payments/services/stripe-webhook-handler.js";
import { VatInvoiceGenerator } from "../dist/src/modules/vat/services/vat-invoice-generator.js";

test("ShippingRateService: Accurately calculates UK rates, free threshold and regional surcharges", () => {
  const service = new ShippingRateService();

  // 1. Mainland UK under £500 -> charges base 2-man rate £49.00 (4900 pennies)
  const mainlandSmall = service.calculateQuote({
    postcode: "SW1A 1AA",
    delivery_tier: "two_man_white_glove",
    order_subtotal_pennies: 45000, // £450
  });
  assert.equal(mainlandSmall.zone, "zone_1_mainland");
  assert.equal(mainlandSmall.base_rate_pennies, 4900);
  assert.equal(mainlandSmall.surcharge_pennies, 0);
  assert.equal(mainlandSmall.total_shipping_pennies, 4900);
  assert.equal(mainlandSmall.is_deliverable, true);

  // 2. Mainland UK over £500 -> FREE base rate (£0)
  const mainlandLarge = service.calculateQuote({
    postcode: "SW1A 1AA",
    delivery_tier: "two_man_white_glove",
    order_subtotal_pennies: 129900, // £1,299
  });
  assert.equal(mainlandLarge.base_rate_pennies, 0);
  assert.equal(mainlandLarge.surcharge_pennies, 0);
  assert.equal(mainlandLarge.total_shipping_pennies, 0);

  // 3. Scottish Highlands (IV1) over £500 -> free base rate + £49 surcharge = £49.00
  const highlandsQuote = service.calculateQuote({
    postcode: "IV1 1AA",
    delivery_tier: "two_man_white_glove",
    order_subtotal_pennies: 89900,
  });
  assert.equal(highlandsQuote.zone, "zone_2_scottish_highlands");
  assert.equal(highlandsQuote.base_rate_pennies, 0);
  assert.equal(highlandsQuote.surcharge_pennies, 4900);
  assert.equal(highlandsQuote.total_shipping_pennies, 4900);

  // 4. Northern Ireland (BT1) -> £59 surcharge
  const niQuote = service.calculateQuote({
    postcode: "BT1 1AA",
    delivery_tier: "pallet",
    order_subtotal_pennies: 60000,
  });
  assert.equal(niQuote.zone, "zone_4_northern_ireland");
  assert.equal(niQuote.surcharge_pennies, 5900);

  // 5. Channel Islands (JE2) -> is_deliverable = false
  const ciQuote = service.calculateQuote({
    postcode: "JE2 3RP",
    delivery_tier: "two_man_white_glove",
    order_subtotal_pennies: 150000,
  });
  assert.equal(ciQuote.is_deliverable, false);
});

test("PostcodeLookupService: Resolves authentic UK addresses", async () => {
  const service = new PostcodeLookupService();

  const results = await service.lookupPostcode("SW1A 1AA");
  assert.ok(results.length > 0);
  assert.equal(results[0].line_1, "Buckingham Palace");
  assert.equal(results[0].city, "London");

  const mcResults = await service.lookupPostcode("M1 1AE");
  assert.ok(mcResults.length >= 2);
  assert.equal(mcResults[0].city, "Manchester");
});

test("StripeWebhookHandler: Verifies signatures and enforces strict idempotency", async () => {
  const secret = "whsec_test_secret_key_12345";
  const handler = new StripeWebhookHandler(secret);

  // Test signature verification
  const payload = JSON.stringify({ id: "evt_test_001" });
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${payload}`)
    .digest("hex");
  const header = `t=${timestamp},v1=${signature}`;

  assert.equal(handler.verifySignature(payload, header), true);
  assert.equal(handler.verifySignature(payload, "invalid_header"), false);

  // Test event handling
  const event = {
    id: "evt_payment_succeeded_991",
    type: "payment_intent.succeeded",
    created: Date.now(),
    data: {
      object: {
        id: "pi_test_abc123",
        amount: 129900,
        currency: "gbp",
        status: "succeeded",
        customer_email: "eleanor@example.co.uk",
        metadata: {
          order_id: "ord_uk_7721",
          customer_name: "Eleanor Vance",
          shipping_postcode: "SW1A 1AA",
          product_title: "The Kensington 3-Seater Sofa",
        },
      },
    },
  };

  // First time: processed & purchase order dispatched
  const firstRun = await handler.handleEvent(event);
  assert.equal(firstRun.success, true);
  assert.equal(firstRun.duplicate, false);
  assert.equal(firstRun.actionTaken, "PAYMENT_CONFIRMED_ORDER_DISPATCHED");
  assert.ok(firstRun.poNumber?.startsWith("PO-SAN-"));

  // Second time with identical eventId: rejected as duplicate (idempotent)
  const secondRun = await handler.handleEvent(event);
  assert.equal(secondRun.success, true);
  assert.equal(secondRun.duplicate, true);
  assert.equal(secondRun.actionTaken, "IGNORED_DUPLICATE");
});

test("VatInvoiceGenerator: Produces HMRC compliant UK VAT invoices", () => {
  const generator = new VatInvoiceGenerator();

  const customer = {
    name: "James Harrington",
    email: "james@example.co.uk",
    addressLine1: "15 Victoria Road",
    city: "London",
    postcode: "SW1A 1AA",
    country: "United Kingdom",
  };

  const items = [
    {
      sku: "SAN-SOFA-001",
      title: "The Kensington 3-Seater Sofa",
      quantity: 1,
      grossUnitPricePennies: 129900, // £1,299.00
      vatRatePercent: 20.0,
    },
  ];

  const invoice = generator.generateInvoice(1, "ord_7721", customer, items, 0);

  // HMRC Legal Compliance Checks
  assert.equal(invoice.invoiceNumber, "INV-2026-00001");
  assert.equal(invoice.companyVatNumber, "GB 421 9823 45");
  assert.equal(invoice.companyName, "SAN Furniture Ltd");
  assert.equal(invoice.customer.name, "James Harrington");

  // VAT Math: Net = round(129900 / 1.20) = 108250 (£1,082.50)
  // VAT = 129900 - 108250 = 21650 (£216.50)
  assert.equal(invoice.breakdown.grossPennies, 129900);
  assert.equal(invoice.breakdown.netPennies, 108250);
  assert.equal(invoice.breakdown.vatPennies, 21650);
  assert.equal(invoice.breakdown.formattedGross, "£1,299.00");
  assert.equal(invoice.breakdown.formattedNet, "£1,082.50");
  assert.equal(invoice.breakdown.formattedVat, "£216.50");

  // Render HTML check
  const html = generator.renderInvoiceHtml(invoice);
  assert.ok(html.includes("GB 421 9823 45"));
  assert.ok(html.includes("INV-2026-00001"));
  assert.ok(html.includes("Value Added Tax Act 1994"));
});
