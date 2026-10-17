import test from "node:test";
import assert from "node:assert/strict";
import { FurnitureToGoDropshipAdapter } from "../dist/src/modules/dropship/adapters/furniture-to-go-adapter.js";

test("FurnitureToGoDropshipAdapter: Parses FTG JSON feed with Danish ranges & UK logistics", async () => {
  const adapter = new FurnitureToGoDropshipAdapter();

  const mockJsonFeed = JSON.stringify([
    {
      sku: "FTG-CPH-4DR-OAK",
      range_name: "Copenhagen",
      product_title: "Copenhagen 4-Drawer Chest of Drawers - Solid Danish Oak Effect",
      category: "bedroom",
      trade_cost_gbp: 85.50,
      stock_quantity: 45,
      weight_kg: 32,
      delivery_tier: "standard_parcel",
      lead_time_days: 2,
      ean: "5707310349821"
    },
    {
      sku: "FTG-PAR-WRD-WHT",
      range_name: "Paris",
      product_title: "Paris 3-Door 2-Drawer Classic Wardrobe - Matt White",
      category: "bedroom",
      trade_cost_gbp: 215.00,
      stock_quantity: 12,
      weight_kg: 88,
      delivery_tier: "two_man_white_glove",
      lead_time_days: 3,
      ean: "5707310349838"
    }
  ]);

  const result = await adapter.parse(mockJsonFeed);

  assert.equal(result.supplierId, "furniture_to_go");
  assert.equal(result.items.length, 2);
  assert.equal(result.invalidItemsCount, 0);

  // Item 1: Copenhagen 4-Drawer
  const item1 = result.items[0];
  assert.ok(item1);
  assert.equal(item1.supplier_sku, "FTG-CPH-4DR-OAK");
  assert.equal(item1.cost_price_pennies, 8550); // £85.50
  assert.equal(item1.carriage_cost_pennies, 1500); // Standard parcel £15.00
  assert.equal(item1.stock_level, 45);
  assert.equal(item1.lead_time_days, 2);
  assert.equal(item1.barcode_gtin, "5707310349821");

  // Item 2: Paris 3-Door Wardrobe (Heavy > 40kg)
  const item2 = result.items[1];
  assert.ok(item2);
  assert.equal(item2.supplier_sku, "FTG-PAR-WRD-WHT");
  assert.equal(item2.cost_price_pennies, 21500); // £215.00
  assert.equal(item2.carriage_cost_pennies, 4000); // Two man delivery £40.00
  assert.equal(item2.stock_level, 12);
  assert.equal(item2.lead_time_days, 3);
  assert.equal(item2.barcode_gtin, "5707310349838");
});

test("FurnitureToGoDropshipAdapter: Parses FTG CSV feed accurately", async () => {
  const adapter = new FurnitureToGoDropshipAdapter();

  const mockCsv = `sku,product_title,trade_cost_gbp,stock_quantity,lead_time_days,weight_kg
FTG-OSL-DSK-GRY,Oslo Scandinavian Desk with 3 Drawers - Charcoal,94.00,28,3,29
FTG-MIL-EXT-TAB,Milan Extending 6-8 Seater Dining Table - Walnut,165.00,10,4,52`;

  const result = await adapter.parse(mockCsv);

  assert.equal(result.supplierId, "furniture_to_go");
  assert.equal(result.items.length, 2);
  assert.equal(result.invalidItemsCount, 0);

  const desk = result.items[0];
  assert.equal(desk.supplier_sku, "FTG-OSL-DSK-GRY");
  assert.equal(desk.cost_price_pennies, 9400);
  assert.equal(desk.carriage_cost_pennies, 1500);
  assert.equal(desk.stock_level, 28);

  const table = result.items[1];
  assert.equal(table.supplier_sku, "FTG-MIL-EXT-TAB");
  assert.equal(table.cost_price_pennies, 16500);
  assert.equal(table.carriage_cost_pennies, 4000); // > 40kg -> two-man carriage £40.00
  assert.equal(table.stock_level, 10);
});

test("FurnitureToGoDropshipAdapter: Formats B2B Purchase Order email for Wiltshire dispatch", () => {
  const adapter = new FurnitureToGoDropshipAdapter();

  const email = adapter.formatPurchaseOrderEmail({
    poNumber: "PO-SAN-FTG-8801",
    orderNumber: "ORD-UK-2026-9921",
    customerName: "Mrs. Charlotte Sterling",
    shippingAddress: {
      addressLine1: "15 High Street",
      city: "Swindon",
      postcode: "SN1 3EU",
      country: "United Kingdom",
      phone: "07700 900512"
    },
    lineItems: [
      {
        sku: "FTG-CPH-4DR-OAK",
        title: "Copenhagen 4-Drawer Chest of Drawers",
        quantity: 1,
        unitCostPennies: 8550
      }
    ],
    deliveryNotes: "Plain packaging required. Call customer 30 mins before arrival."
  });

  assert.equal(email.to, "orders@furniture-to-go.co.uk");
  assert.match(email.subject, /PO-SAN-FTG-8801/);
  assert.match(email.subject, /SN1 3EU/);
  assert.match(email.bodyText, /PO-SAN-FTG-8801/);
  assert.match(email.bodyText, /ORD-UK-2026-9921/);
  assert.match(email.bodyText, /Mrs\. Charlotte Sterling/);
  assert.match(email.bodyText, /15 High Street/);
  assert.match(email.bodyText, /SN1 3EU/);
  assert.match(email.bodyText, /FTG-CPH-4DR-OAK/);
  assert.match(email.bodyText, /Total Trade Cost \(Ex\. VAT\): £85\.50/);
});
