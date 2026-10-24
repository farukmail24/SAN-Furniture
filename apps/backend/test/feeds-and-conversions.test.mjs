import test from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";

import { GoogleMerchantFeedGenerator } from "../dist/src/modules/feeds/services/google-merchant-feed.js";
import { MetaCatalogFeedGenerator } from "../dist/src/modules/feeds/services/meta-catalog-feed.js";
import { MetaConversionsApiService } from "../dist/src/modules/feeds/services/meta-conversions-api.js";

const TEST_PRODUCTS = [
  {
    id: "prod_sofa_001",
    title: "The Kensington 3-Seater Sofa in Oat Bouclé",
    handle: "kensington-3-seater-sofa-oat-boucle",
    description: "Architectural profile with solid oak plinth & textured bouclé.",
    pricePennies: 129900,
    thumbnailUrl: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc",
    images: [
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc",
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7",
    ],
    status: "published",
    categoryHandle: "sofas",
    gtinBarcode: "5060123456010",
    specs: {
      material: "bouclé",
      color: "Oat Cream",
      delivery_tier: "two_man_white_glove",
      fire_safety: {
        compliant: true,
        standard: "BS 5852: Part 1",
      },
    },
  },
  {
    id: "prod_stool_002",
    title: "The Chelsea Velvet Footstool",
    handle: "chelsea-velvet-footstool",
    description: "Compact accent footstool with walnut tapered legs.",
    pricePennies: 19900, // Under £500
    thumbnailUrl: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7",
    images: ["https://images.unsplash.com/photo-1586023492125-27b2c045efd7"],
    status: "published",
    categoryHandle: "armchairs",
    gtinBarcode: "5060123456027",
    specs: {
      material: "velvet",
      color: "Ink Navy",
      delivery_tier: "standard_parcel",
      fire_safety: {
        compliant: true,
        standard: "BS 5852: Part 1",
      },
    },
  },
];

test("GoogleMerchantFeedGenerator: Produces fully compliant RSS 2.0 XML with Google Shopping tags", () => {
  const generator = new GoogleMerchantFeedGenerator("https://sanfurniture.com");
  const xml = generator.generateFeedXml(TEST_PRODUCTS);

  // Structural checks
  assert.ok(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
  assert.ok(xml.includes('<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">'));
  assert.ok(xml.includes("<title>SAN Furniture UK Product Feed</title>"));

  // Mandatory Google Attributes checks
  assert.ok(xml.includes("<g:id>prod_sofa_001</g:id>"));
  assert.ok(xml.includes("<g:title>The Kensington 3-Seater Sofa in Oat Bouclé</g:title>"));
  assert.ok(xml.includes("<g:link>https://sanfurniture.com/products/kensington-3-seater-sofa-oat-boucle</g:link>"));
  assert.ok(xml.includes("<g:availability>in_stock</g:availability>"));
  assert.ok(xml.includes("<g:price>1299.00 GBP</g:price>"));
  assert.ok(xml.includes("<g:brand>SAN Furniture</g:brand>"));
  assert.ok(xml.includes("<g:gtin>5060123456010</g:gtin>"));
  assert.ok(xml.includes("<g:condition>new</g:condition>"));
  assert.ok(xml.includes("<g:google_product_category>Home &amp; Garden &gt; Furniture &gt; Sofas</g:google_product_category>"));

  // UK Shipping Rates checks
  // Sofa >= £500 qualifies for free shipping
  assert.ok(xml.includes("<g:price>0.00 GBP</g:price>"));
  // Stool < £500 incurs £49 delivery
  assert.ok(xml.includes("<g:price>49.00 GBP</g:price>"));

  // Custom Labels checks
  assert.ok(xml.includes("<g:custom_label_0>two_man_white_glove</g:custom_label_0>"));
  assert.ok(xml.includes("<g:custom_label_1>UK Quality Checked</g:custom_label_1>"));
  assert.ok(xml.includes("<g:custom_label_2>Free Delivery Eligible</g:custom_label_2>"));
});

test("MetaCatalogFeedGenerator: Generates RFC 4180 CSV for Meta Commerce Manager", () => {
  const generator = new MetaCatalogFeedGenerator("https://sanfurniture.com");
  const csv = generator.generateFeedCsv(TEST_PRODUCTS);

  const lines = csv.split("\n");
  assert.ok(lines.length >= 3);

  // Header check
  const header = lines[0];
  assert.ok(header.includes("id,title,description,availability,condition,price,link,image_link,brand"));

  // Row content check
  assert.ok(csv.includes("prod_sofa_001"));
  assert.ok(csv.includes("1299.00 GBP"));
  assert.ok(csv.includes("https://sanfurniture.com/products/kensington-3-seater-sofa-oat-boucle"));
  assert.ok(csv.includes("in stock"));
  assert.ok(csv.includes("SAN Furniture"));
});

test("MetaConversionsApiService: SHA-256 normalizes PII and generates compliant CAPI payload", async () => {
  const capi = new MetaConversionsApiService();

  // Test raw PII normalization & hashing
  const rawEmail = "  Eleanor.Vance@EXAMPLE.co.uk  ";
  const expectedHash = crypto.createHash("sha256").update("eleanor.vance@example.co.uk").digest("hex");
  assert.equal(capi.hashPii(rawEmail), expectedHash);

  // Test Event Payload Construction
  const payload = capi.buildEventPayload(
    "Purchase",
    "https://sanfurniture.com/checkout/success",
    "evt_test_dedup_001",
    {
      email: "eleanor.vance@example.co.uk",
      phone: "+44 7700 900123",
      city: "London",
      postcode: "SW1A 1AA",
      clientIpAddress: "86.14.22.100",
      clientUserAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
    },
    {
      currency: "GBP",
      value: 1299.0,
      order_id: "SAN-998811",
      num_items: 1,
    }
  );

  assert.equal(payload.event_name, "Purchase");
  assert.equal(payload.event_id, "evt_test_dedup_001");
  assert.equal(payload.action_source, "website");
  assert.equal(payload.user_data.em?.[0], expectedHash);
  assert.equal(payload.custom_data?.currency, "GBP");
  assert.equal(payload.custom_data?.value, 1299.0);

  // Test dispatch in dev/mock mode
  const sendResult = await capi.sendEvent(payload);
  assert.equal(sendResult.success, true);
  assert.equal(sendResult.eventId, "evt_test_dedup_001");
});
