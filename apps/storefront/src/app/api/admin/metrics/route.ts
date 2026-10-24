import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { formatGBP } from "@san-furniture/types";
import { autoSeedDatabaseIfNeeded } from "@/lib/auto-seed";
import { getAdminFromRequest } from "@/lib/auth-token";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const pool = getDbPool();

    // Check if products count is 0, auto-seed if needed
    const [initialCheck]: any = await pool
      .query("SELECT COUNT(*) as cnt FROM products")
      .catch(() => [[{ cnt: 0 }]]);

    if (!initialCheck?.[0]?.cnt || Number(initialCheck[0].cnt) === 0) {
      await autoSeedDatabaseIfNeeded();
    }

    // 1. Live Orders & Revenue metrics
    let totalOrders = 0;
    let grossRevenuePennies = 0;
    let awaitingDispatchOrders = 0;

    try {
      const [orderRows]: any = await pool.query(`
        SELECT 
          COUNT(*) as total_orders,
          COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total_pennies ELSE 0 END), 0) as gross_revenue,
          COALESCE(SUM(CASE WHEN fulfillment_status NOT IN ('delivered', 'cancelled') THEN 1 ELSE 0 END), 0) as awaiting_dispatch
        FROM orders
      `);
      if (orderRows && orderRows[0]) {
        totalOrders = Number(orderRows[0].total_orders) || 0;
        grossRevenuePennies = Number(orderRows[0].gross_revenue) || 0;
        awaitingDispatchOrders = Number(orderRows[0].awaiting_dispatch) || 0;
      }
    } catch (orderErr) {
      console.warn("Metrics order query error:", orderErr);
    }

    // 2. Live Catalog Products Count
    let totalCatalogProducts = 0;
    try {
      const [prodRows]: any = await pool.query(
        "SELECT COUNT(*) as cnt FROM products WHERE status = 'published'"
      );
      if (prodRows && prodRows[0]) {
        totalCatalogProducts = Number(prodRows[0].cnt) || 0;
      }
    } catch (prodErr) {
      console.warn("Metrics product query error:", prodErr);
    }

    // 3. Jailed IPs Count
    let jailedIpsCount = 0;
    try {
      const [jailRows]: any = await pool.query(
        "SELECT COUNT(*) as cnt FROM security_ip_jail WHERE locked_until > NOW() OR is_permanent = 1"
      );
      if (jailRows && jailRows[0]) {
        jailedIpsCount = Number(jailRows[0].cnt) || 0;
      }
    } catch (jailErr) {
      console.warn("Metrics security jail query error:", jailErr);
    }

    // Estimated supplier wholesale cost (approx 58% of gross revenue)
    const dropshipSupplierCostPennies = Math.round(grossRevenuePennies * 0.58);
    const grossMarginPennies = grossRevenuePennies - dropshipSupplierCostPennies;
    const grossMarginPercent =
      grossRevenuePennies > 0
        ? Number(((grossMarginPennies / grossRevenuePennies) * 100).toFixed(1))
        : 42.0;
    const avgOrderValue =
      totalOrders > 0 ? Math.round(grossRevenuePennies / totalOrders) : 0;

    return NextResponse.json({
      success: true,
      overview: {
        totalOrders,
        awaitingDispatchOrders,
        grossRevenuePennies,
        grossRevenueFormatted: formatGBP(grossRevenuePennies),
        grossMarginPennies,
        grossMarginFormatted: formatGBP(grossMarginPennies),
        grossMarginPercent,
        totalCatalogProducts,
        averageOrderValueFormatted: formatGBP(avgOrderValue),
        jailedIpsCount,
      },
    });
  } catch (err: any) {
    console.error("Critical error in /api/admin/metrics:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to load metrics",
        details: err?.message || String(err),
      },
      { status: 500 }
    );
  }
}
