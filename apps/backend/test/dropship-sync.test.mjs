import test from "node:test";
import assert from "node:assert/strict";
import { CsvSupplierAdapter } from "../dist/src/modules/dropship/adapters/csv-supplier-adapter.js";
import { JsonSupplierAdapter } from "../dist/src/modules/dropship/adapters/json-supplier-adapter.js";
import { MarginGuardService } from "../dist/src/modules/dropship/services/margin-guard.js";
import { StockReconciliationEngine } from "../dist/src/modules/dropship/services/stock-reconciler.js";
import { OrderFulfillmentDispatcher } from "../dist/src/modules/dropship/services/order-dispatcher.js";
import { POST } from "../dist/src/api/webhooks/supplier-tracking/route.js";

test("CSV Supplier Feed Adapter: Parses UK supplier CSV and converts prices to pennies", async () => {
  const csvData = `
SKU,Title,Cost Price,Carriage,Stock,Lead Time
SOFA-OAT-01,The Kensington 3-Seater Sofa,£680.00,£45.00,12,7
ARM-CRM-02,The Regent Swivel Armchair,280.00,25.00,0,4
DIN-OAK-03,The Henley Extendable Dining Table,£620.00,,18,5
BAD-ROW-04,,£100.00,£10.00,5,3
  `.trim();

  const adapter = new CsvSupplierAdapter(
    "uk_craft_sofas",
    "UK Craft Sofas Ltd",
    {
      sku: "SKU",
      title: "Title",
      costPrice: "Cost Price",
      carriageCost: "Carriage",
      stockLevel: "Stock",
      leadTimeDays: "Lead Time"
    }
  );

  const result = await adapter.parse(csvData);

  assert.equal(result.supplierId, "uk_craft_sofas");
  assert.equal(result.items.length, 3); // 3 valid items, 1 invalid row (missing title)
  assert.equal(result.invalidItemsCount, 1);

  // Check item 1
  const item1 = result.items[0];
  assert.ok(item1);
  assert.equal(item1.supplier_sku, "SOFA-OAT-01");
  assert.equal(item1.cost_price_pennies, 68000);
  assert.equal(item1.carriage_cost_pennies, 4500);
  assert.equal(item1.stock_level, 12);
  assert.equal(item1.lead_time_days, 7);

  // Check item 2 (zero stock)
  const item2 = result.items[1];
  assert.ok(item2);
  assert.equal(item2.supplier_sku, "ARM-CRM-02");
  assert.equal(item2.stock_level, 0);

  // Check item 3 (optional carriage defaults to 0)
  const item3 = result.items[2];
  assert.ok(item3);
  assert.equal(item3.carriage_cost_pennies, 0);
});

test("JSON Supplier Feed Adapter: Parses REST API payload", async () => {
  const jsonData = JSON.stringify([
    {
      id: "BED-BAL-01",
      name: "The Balmoral King Ottoman Bed",
      wholesale_cost: 710.00,
      shipping: 55.00,
      inventory: 8,
      dispatch_days: 7
    }
  ]);

  const adapter = new JsonSupplierAdapter(
    "uk_slumber_beds",
    "UK Slumber Beds",
    {
      sku: "id",
      title: "name",
      costPrice: "wholesale_cost",
      carriageCost: "shipping",
      stockLevel: "inventory",
      leadTimeDays: "dispatch_days"
    }
  );

  const result = await adapter.parse(jsonData);
  assert.equal(result.items.length, 1);
  const item = result.items[0];
  assert.ok(item);
  assert.equal(item.supplier_sku, "BED-BAL-01");
  assert.equal(item.cost_price_pennies, 71000);
  assert.equal(item.carriage_cost_pennies, 5500);
  assert.equal(item.stock_level, 8);
});

test("Margin Guard Service: Enforces floor margin and prevents price degradation", () => {
  const guard = new MarginGuardService({
    targetMarginPercent: 35.0,
    floorMarginPercent: 20.0,
    paymentFeePercent: 1.5,
    paymentFixedPennies: 20
  });

  // Standard case: cost £200.00, carriage £20.00
  const eval1 = guard.evaluatePrice(20000, 2000);
  assert.ok(eval1.pricing.retailGrossPennies > 22000);
  assert.equal(eval1.alert, undefined);
  assert.ok(eval1.pricing.actualGrossMarginPercent >= 20.0);

  // Severe supplier price spike causing margin to dip below 20% floor
  // If target margin was set artificially low or floor is 30%
  const strictGuard = new MarginGuardService({
    targetMarginPercent: 10.0, // target is lower than floor
    floorMarginPercent: 25.0
  });

  const evalSpike = strictGuard.evaluatePrice(20000, 2000, 45000); // Current retail is £450.00
  assert.ok(evalSpike.alert, "Must generate a MarginAlert when margin < floor");
  // Recommended price should preserve £450.00 rather than dropping
  assert.equal(evalSpike.recommendedRetailGrossPennies, 45000);
});

test("Stock Reconciler: Auto-unpublishes out-of-stock items and restores restocked ones", () => {
  const reconciler = new StockReconciliationEngine();

  const catalogMap = new Map([
    [
      "SOFA-OAT-01",
      {
        id: "prod_001",
        sku: "SOFA-OAT-01",
        currentStatus: "published",
        currentPricePennies: 129900,
        currentStock: 5
      }
    ],
    [
      "ARM-CRM-02",
      {
        id: "prod_002",
        sku: "ARM-CRM-02",
        currentStatus: "out_of_stock",
        currentPricePennies: 54900,
        currentStock: 0
      }
    ]
  ]);

  const feedItems = [
    {
      supplier_id: "supplier_1",
      supplier_sku: "SOFA-OAT-01",
      product_title: "Sofa",
      cost_price_pennies: 68000,
      carriage_cost_pennies: 4500,
      stock_level: 0, // Stock dropped to 0!
      lead_time_days: 7,
      discontinued: false
    },
    {
      supplier_id: "supplier_1",
      supplier_sku: "ARM-CRM-02",
      product_title: "Armchair",
      cost_price_pennies: 28000,
      carriage_cost_pennies: 2500,
      stock_level: 10, // Stock restored!
      lead_time_days: 4,
      discontinued: false
    }
  ];

  const report = reconciler.reconcileBatch("supplier_1", feedItems, catalogMap);

  assert.equal(report.unpublishedCount, 1);
  assert.equal(report.restoredCount, 1);

  const unpublishAction = report.actions.find((a) => a.action === "unpublish_stock");
  assert.ok(unpublishAction);
  assert.equal(unpublishAction.productId, "prod_001");
  assert.equal(unpublishAction.newStatus, "out_of_stock");

  const restoreAction = report.actions.find((a) => a.action === "restore_stock");
  assert.ok(restoreAction);
  assert.equal(restoreAction.productId, "prod_002");
  assert.equal(restoreAction.newStatus, "published");
});

test("Order Fulfillment Dispatcher: Creates PO and ingests tracking webhook", async () => {
  const dispatcher = new OrderFulfillmentDispatcher();

  const po = dispatcher.generatePurchaseOrder({
    orderId: "ord_uk_9981",
    poNumber: "PO-SAN-2026-001",
    supplierId: "uk_craft_sofas",
    deliveryTier: "two_man_white_glove",
    customerDeliveryAddress: {
      recipient_name: "Eleanor Vance",
      line_1: "14 Belgrave Square",
      city: "London",
      postcode: "SW1X 8PS",
      country_code: "GB",
      phone: "07700900123"
    },
    items: [
      {
        sku: "SAN-SOFA-OAT",
        supplierSku: "SOFA-OAT-01",
        title: "The Kensington 3-Seater Sofa",
        quantity: 1,
        costPricePennies: 68000
      }
    ],
    createdAt: new Date().toISOString()
  });

  assert.equal(po.status, "dispatched");
  assert.equal(po.poNumber, "PO-SAN-2026-001");

  // Ingest tracking update via webhook handler
  let webhookStatus = 0;
  let webhookResponse = null;

  const mockReq = {
    body: {
      supplierId: "uk_craft_sofas",
      poNumber: "PO-SAN-2026-001",
      orderId: "ord_uk_9981",
      courierName: "ArrowXL 2-Man",
      trackingNumber: "AXL-882910394GB",
      trackingUrl: "https://track.arrowxl.co.uk/AXL-882910394GB"
    }
  };

  const mockRes = {
    status(code) {
      webhookStatus = code;
      return this;
    },
    json(data) {
      webhookResponse = data;
      return this;
    }
  };

  await POST(mockReq, mockRes);

  assert.equal(webhookStatus, 200);
  assert.equal(webhookResponse.success, true);
  assert.equal(webhookResponse.record.status, "shipped");
  assert.equal(webhookResponse.record.trackingNumber, "AXL-882910394GB");
  assert.equal(webhookResponse.record.courierName, "ArrowXL 2-Man");
});

test("Unified Dropship Pricing Formula: Computes Landed Cost + 40% Margin + 20% VAT with Free UK Delivery guarantee", async () => {
  const { amosMannExtractor } = await import("../src/modules/dropship/services/amos-mann-extractor.mjs");
  const { furnitureToGoExtractor } = await import("../src/modules/dropship/services/furniture-to-go-extractor.mjs");

  // Case 1: Amos Mann Standard Parcel (Trade £70.00 + Carriage £19.95)
  // Landed = £89.95. Net Retail = £89.95 * 1.40 = £125.93. Gross Retail (inc 20% VAT) = £125.93 * 1.20 = £151.12
  const amosStandard = amosMannExtractor.calculateRetailPrice(7000, 1995, 40);
  assert.equal(amosStandard.landedCost, 8995);
  assert.equal(amosStandard.netRetail, 12593);
  assert.equal(amosStandard.retailPricePennies, 15112); // £151.12
  assert.equal(amosStandard.compareAtPennies, 18890); // £188.90

  // Case 2: Amos Mann Pallet Wardrobe (Trade £239.00 + Carriage £69.00)
  // Landed = £308.00. Net Retail = £308.00 * 1.40 = £431.20. Gross Retail = £431.20 * 1.20 = £517.44
  const amosPallet = amosMannExtractor.calculateRetailPrice(23900, 6900, 40);
  assert.equal(amosPallet.landedCost, 30800);
  assert.equal(amosPallet.netRetail, 43120);
  assert.equal(amosPallet.retailPricePennies, 51744); // £517.44

  // Case 3: Furniture To Go (FTG includes UK Mainland Home Delivery in trade price = £0.00 carriage)
  // Trade £100.00 + Carriage £0.00. Landed = £100.00. Net Retail = £100.00 * 1.40 = £140.00. Gross Retail = £140.00 * 1.20 = £168.00
  const ftgItem = furnitureToGoExtractor.calculateRetailPrice(10000, 0, 40);
  assert.equal(ftgItem.landedCost, 10000);
  assert.equal(ftgItem.netRetail, 14000);
  assert.equal(ftgItem.retailPricePennies, 16800); // £168.00
});
