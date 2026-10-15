import test from "node:test";
import assert from "node:assert/strict";
import { AmosMannDropshipAdapter } from "../dist/src/modules/dropship/adapters/amos-mann-adapter.js";

test("AmosMannDropshipAdapter: Parses Amos Mann JSON feed with trade pricing & UK logistics", async () => {
  const adapter = new AmosMannDropshipAdapter();

  const mockJsonFeed = JSON.stringify([
    {
      sku: "AM-VEN-203-WHT",
      range_name: "Venice Luxury Sliding Wardrobe",
      product_title: "Venice 203cm 2-Door Mirrored Sliding Wardrobe - Alpine White",
      category: "wardrobes",
      trade_cost_gbp: 239.00,
      stock_quantity: 18,
      width_cm: 203,
      height_cm: 215,
      depth_cm: 61,
      weight_kg: 145,
      delivery_tier: "two_man_white_glove",
      lead_time_days: 5,
      barcode: "5060912800101"
    },
    {
      sku: "AM-ATH-TV-BLK",
      range_name: "Athens LED TV Stand",
      product_title: "Athens 160cm High-Gloss TV Console with RGB LED - Obsidian Black",
      category: "lounge",
      trade_cost_gbp: 110.00,
      stock_quantity: 24,
      width_cm: 160,
      height_cm: 45,
      depth_cm: 35,
      weight_kg: 32,
      delivery_tier: "standard_parcel",
      lead_time_days: 3,
      barcode: "5060912800104"
    }
  ]);

  const result = await adapter.parse(mockJsonFeed);

  assert.equal(result.supplierId, "amos_mann_furniture");
  assert.equal(result.items.length, 2);
  assert.equal(result.invalidItemsCount, 0);

  // Item 1: Venice wardrobe
  const item1 = result.items[0];
  assert.ok(item1);
  assert.equal(item1.supplier_sku, "AM-VEN-203-WHT");
  assert.equal(item1.cost_price_pennies, 23900); // £239.00
  assert.equal(item1.carriage_cost_pennies, 4500); // 2-man carriage £45.00
  assert.equal(item1.stock_level, 18);
  assert.equal(item1.lead_time_days, 5);
  assert.equal(item1.barcode_gtin, "5060912800101");

  // Item 2: Athens TV Stand
  const item2 = result.items[1];
  assert.ok(item2);
  assert.equal(item2.supplier_sku, "AM-ATH-TV-BLK");
  assert.equal(item2.cost_price_pennies, 11000); // £110.00
  assert.equal(item2.carriage_cost_pennies, 2500); // parcel carriage £25.00
  assert.equal(item2.stock_level, 24);
});

test("AmosMannDropshipAdapter: Formats compliant B2B Purchase Order email for Leicester dispatch", () => {
  const adapter = new AmosMannDropshipAdapter();

  const emailText = adapter.formatPurchaseOrderEmail({
    poNumber: "PO-SAN-AM-9901",
    orderNumber: "ORD-UK-2026-4412",
    customerName: "Dr. Eleanor Vance",
    customerPhone: "07700 900341",
    deliveryAddress: "Apartment 14, St. John's Residences, 12 Bishopsgate",
    postcode: "EC2N 4AY",
    items: [
      {
        sku: "AM-VEN-203-WHT",
        title: "Venice 203cm Sliding Wardrobe with LED & Mirror",
        quantity: 1,
        tradePriceGbp: "239.00"
      }
    ],
    notes: "White-glove 2-man room-of-choice placement requested."
  });

  assert.match(emailText, /orders@amosmannfurniture\.co\.uk/);
  assert.match(emailText, /PO-SAN-AM-9901/);
  assert.match(emailText, /ORD-UK-2026-4412/);
  assert.match(emailText, /Dr\. Eleanor Vance/);
  assert.match(emailText, /EC2N 4AY/);
  assert.match(emailText, /AM-VEN-203-WHT/);
  assert.match(emailText, /2-Man Booked-in Service/);
});
