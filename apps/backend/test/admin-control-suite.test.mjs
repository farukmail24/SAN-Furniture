import test from "node:test";
import assert from "node:assert/strict";

import { AdminControlService } from "../dist/src/modules/admin/services/admin-control-service.js";
import { IpJailService } from "../dist/src/modules/security/services/ip-jail-service.js";

test("AdminControlService: Accurately aggregates dropship sales and gross margins", () => {
  const service = new AdminControlService();

  const orders = [
    { amountPennies: 129900, supplierCostPennies: 83100 }, // Kensington Sofa
    { amountPennies: 115000, supplierCostPennies: 71300 }, // Henley Table
  ];

  const analytics = service.getSalesAnalytics(orders);
  assert.equal(analytics.totalOrdersCount, 2);
  assert.equal(analytics.grossSalesPennies, 244900); // £2,449.00
  assert.equal(analytics.supplierCostPennies, 154400); // £1,544.00
  assert.equal(analytics.grossProfitPennies, 90500); // £905.00
  assert.equal(analytics.profitMarginPercent, 37.0);
  assert.equal(analytics.formattedGrossSales, "£2,449.00");
  assert.equal(analytics.formattedGrossProfit, "£905.00");
});

test("AdminControlService: Updates logistics configuration and records immutable audit logs", () => {
  const service = new AdminControlService();
  const adminId = "admin_eleanor_01";

  // Initial threshold is 50000 (£500)
  assert.equal(service.getLogisticsConfig().freeDeliveryThresholdPennies, 50000);

  // Update threshold to £600
  const updated = service.updateLogisticsConfig(adminId, {
    freeDeliveryThresholdPennies: 60000,
  });
  assert.equal(updated.freeDeliveryThresholdPennies, 60000);

  // Verify Audit Log entry
  const logs = service.getAuditLogs();
  assert.ok(logs.length >= 1);
  assert.equal(logs[0].adminId, adminId);
  assert.equal(logs[0].action, "UPDATE_LOGISTICS_CONFIG");
  assert.ok(logs[0].details.includes("£600.00"));
});

test("AdminControlService: Manages IP Jail releases and 301 redirects with audit trail", () => {
  const jail = new IpJailService();
  const testIp = "198.51.100.99";

  // Lock IP
  for (let i = 1; i <= 5; i++) {
    jail.recordFailure(testIp);
  }
  assert.equal(jail.isIpJailed(testIp).jailed, true);

  const adminService = new AdminControlService(jail);
  const jailedList = adminService.listJailedIps();
  assert.ok(jailedList.some((r) => r.ip === testIp));

  // Admin 1-click unblock
  const unblocked = adminService.unblockIp("superadmin", testIp);
  assert.equal(unblocked, true);
  assert.equal(jail.isIpJailed(testIp).jailed, false);

  // 301 Redirect management
  const rule = adminService.addRedirect(
    "superadmin",
    "/legacy-sofas/vintage-boucle",
    "/collections/boucle-sofas"
  );
  assert.equal(rule.sourcePath, "/legacy-sofas/vintage-boucle");
  assert.equal(rule.statusCode, 301);

  const redirects = adminService.listRedirects();
  assert.ok(redirects.some((r) => r.id === rule.id));
});
