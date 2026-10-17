"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Truck,
  ShieldAlert,
  Rss,
  History,
  CheckCircle2,
  Lock,
  RefreshCw,
  ChevronRight,
  Package,
  ShoppingBag,
  Building2,
  Zap,
} from "lucide-react";
import { formatGBP } from "@san-furniture/types";
import { apiUrl } from "@/lib/api-config";
import { fetchWithSwr, getCachedData } from "@/lib/api-cache";

interface MetricsOverview {
  totalOrders: number;
  grossRevenuePennies: number;
  grossRevenueFormatted: string;
  grossMarginPennies: number;
  grossMarginFormatted: string;
  grossMarginPercent: number;
  totalCatalogProducts: number;
  averageOrderValueFormatted: string;
  jailedIpsCount: number;
}

interface OrderRecord {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  postcode?: string;
  delivery_tier: string;
  total_pennies: number;
  status: string;
  po_number?: string;
  carrier?: string;
  created_at: string;
  items_json?: string;
}

interface JailedIpRecord {
  id: string;
  ip_address: string;
  strike_count: number;
  reason: string;
  locked_until?: string;
  is_permanent?: number;
  created_at: string;
}

interface AuditRecord {
  id: string;
  actor: string;
  action: string;
  resource: string;
  details_json?: string;
  ip_address?: string;
  created_at: string;
}

export default function AdminDashboardPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 1. Live Metrics from MySQL
  const cachedMetrics = getCachedData<{ overview: MetricsOverview }>(apiUrl("/api/admin/metrics"));
  const [metrics, setMetrics] = useState<MetricsOverview | null>(() => cachedMetrics?.overview || null);

  // 2. Live Recent Orders from MySQL
  const cachedOrders = getCachedData<{ orders: OrderRecord[] }>(apiUrl("/api/admin/orders"));
  const [recentOrders, setRecentOrders] = useState<OrderRecord[]>(() => cachedOrders?.orders || []);

  // 3. Live Logistics Settings from MySQL
  const [freeThreshold, setFreeThreshold] = useState(500);
  const [twoManBase, setTwoManBase] = useState(49);
  const [highlandsSurcharge, setHighlandsSurcharge] = useState(49);

  // 4. Live Jailed IPs from MySQL
  const cachedJail = getCachedData<{ jailedIps: JailedIpRecord[] }>(apiUrl("/api/security/ip-jail"));
  const [jailedIps, setJailedIps] = useState<JailedIpRecord[]>(() => cachedJail?.jailedIps || []);

  // 5. Live Audit Logs from MySQL
  const [auditLogs, setAuditLogs] = useState<AuditRecord[]>([]);

  const loadData = () => {
    setIsRefreshing(true);

    // Fetch Metrics
    fetchWithSwr<{ overview: MetricsOverview }>(apiUrl("/api/admin/metrics"), (data) => {
      if (data?.overview) setMetrics(data.overview);
    }).catch(() => {});

    // Fetch Recent Orders
    fetchWithSwr<{ orders: OrderRecord[] }>(apiUrl("/api/admin/orders"), (data) => {
      if (Array.isArray(data?.orders)) setRecentOrders(data.orders);
    }).catch(() => {});

    // Fetch Jailed IPs
    fetchWithSwr<{ jailedIps: JailedIpRecord[] }>(apiUrl("/api/security/ip-jail"), (data) => {
      if (Array.isArray(data?.jailedIps)) setJailedIps(data.jailedIps);
    }).catch(() => {});

    // Fetch Logistics Settings
    fetchWithSwr<{ settings: Record<string, string> }>(apiUrl("/api/admin/settings"), (data) => {
      if (data?.settings) {
        if (data.settings.free_shipping_threshold_pennies) {
          setFreeThreshold(Math.round(Number(data.settings.free_shipping_threshold_pennies) / 100));
        }
        if (data.settings.standard_delivery_fee_pennies) {
          setTwoManBase(Math.round(Number(data.settings.standard_delivery_fee_pennies) / 100));
        }
        if (data.settings.highlands_surcharge_pennies) {
          setHighlandsSurcharge(Math.round(Number(data.settings.highlands_surcharge_pennies) / 100));
        }
      }
    }).catch(() => {});

    // Fetch Audit Trail
    fetch(apiUrl("/api/admin/audit?limit=25"))
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d?.logs)) setAuditLogs(d.logs);
      })
      .catch(() => {})
      .finally(() => {
        setTimeout(() => setIsRefreshing(false), 500);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-sand-200/80">
        <div>
          <div className="flex items-center gap-2 text-xs text-navy-500 mb-1">
            <span>Operations Center</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="font-semibold text-navy-950">Executive Cockpit</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-navy-950 tracking-tight">
            SAN Furniture Operations &amp; Margins
          </h1>
          <p className="text-xs sm:text-sm text-navy-600 mt-1">
            Real-time pulse of UK revenue, gross margins, automated dropship fulfillment, and courier logistics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="text-xs font-bold px-4 py-2.5 rounded-xl bg-brass-500 hover:bg-brass-400 text-navy-950 transition-all flex items-center gap-2 shadow-sm"
          >
            <Package className="w-4 h-4" />
            <span>Manage Products ({metrics?.totalCatalogProducts ?? "..."})</span>
          </Link>
          <button
            type="button"
            onClick={loadData}
            aria-label="Refresh database metrics"
            className="p-2.5 rounded-xl border border-sand-300 bg-white hover:bg-sand-100 text-navy-700 transition-colors shadow-xs active:scale-95"
            title="Refresh database metrics"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-brass-600" : ""}`} />
          </button>
        </div>
      </div>

      {/* 2. Top Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Gross UK Revenue */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white border border-sand-200/90 shadow-xs relative overflow-hidden group hover:border-brass-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-navy-500 uppercase tracking-wider">
              Gross UK Revenue
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <span className="font-display text-2xl sm:text-3xl font-bold text-navy-950 block">
            {metrics?.grossRevenueFormatted || "£0.00"}
          </span>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-forest-700 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-forest-600 animate-pulse"></span>
            <span>Live from orders table (inc. 20% VAT)</span>
          </div>
        </div>

        {/* Dropship Supplier Cost */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white border border-sand-200/90 shadow-xs relative overflow-hidden group hover:border-brass-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-navy-500 uppercase tracking-wider">
              Dropship Supplier Cost
            </span>
            <div className="w-8 h-8 rounded-lg bg-sand-100 text-navy-700 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <span className="font-display text-2xl sm:text-3xl font-bold text-navy-950 block">
            {formatGBP(
              metrics?.grossRevenuePennies
                ? Math.round(metrics.grossRevenuePennies * 0.58)
                : 0
            )}
          </span>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-navy-600 font-medium">
            <span>Carriage &amp; packaging estimated</span>
          </div>
        </div>

        {/* Net Profit Margin */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white border border-sand-200/90 shadow-xs relative overflow-hidden group hover:border-brass-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-navy-500 uppercase tracking-wider">
              Net Profit Margin
            </span>
            <div className="w-8 h-8 rounded-lg bg-brass-50 text-brass-700 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <span className="font-display text-2xl sm:text-3xl font-bold text-forest-700 block">
            {metrics?.grossMarginPercent != null ? `${metrics.grossMarginPercent}%` : "42.0%"}
          </span>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-forest-700 font-semibold">
            <span className="px-1.5 py-0.5 rounded bg-forest-100 text-[10px]">Protected</span>
            <span>Margin Guard Active</span>
          </div>
        </div>

        {/* Average Order Value (AOV) */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white border border-sand-200/90 shadow-xs relative overflow-hidden group hover:border-brass-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-navy-500 uppercase tracking-wider">
              Average Order Value (AOV)
            </span>
            <div className="w-8 h-8 rounded-lg bg-sand-100 text-navy-700 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <span className="font-display text-2xl sm:text-3xl font-bold text-navy-950 block">
            {metrics?.averageOrderValueFormatted || "£0.00"}
          </span>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-navy-600 font-medium">
            <span>{metrics?.totalOrders ?? 0} customer orders recorded</span>
          </div>
        </div>
      </div>

      {/* 3. Middle Section: Dual-Column Operations Cockpit (No Tabs!) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* Left Column (8 cols): Recent Customer Orders & Supplier POs */}
        <div className="lg:col-span-8 rounded-2xl bg-white border border-sand-200/90 shadow-xs overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-sand-200/80 flex items-center justify-between bg-sand-50/50">
            <div>
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-brass-600" />
                <h3 className="font-display text-base sm:text-lg font-bold text-navy-950">
                  Recent Customer Orders &amp; Supplier POs
                </h3>
              </div>
              <p className="text-xs text-navy-600 mt-0.5">
                Live orders from MySQL with automated B2B dropship dispatch records
              </p>
            </div>
            <Link
              href="/admin/orders"
              className="text-xs font-bold px-3 py-1.5 rounded-xl bg-sand-100 hover:bg-sand-200 text-navy-950 border border-sand-300 transition-colors flex items-center gap-1.5"
            >
              <span>View All Orders</span>
              <ChevronRight className="w-3.5 h-3.5 text-navy-600" />
            </Link>
          </div>

          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead className="bg-sand-100/70 text-navy-700 uppercase font-semibold text-[11px] tracking-wider border-b border-sand-200">
                <tr>
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Customer &amp; Postcode</th>
                  <th className="py-3 px-4">Delivery Tier</th>
                  <th className="py-3 px-4">Gross Total</th>
                  <th className="py-3 px-4">Supplier PO Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-200/70 text-navy-800">
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-navy-500">
                      No customer orders recorded in database yet.
                    </td>
                  </tr>
                ) : (
                  recentOrders.slice(0, 8).map((order) => {
                    const tierName =
                      order.delivery_tier === "two_man_white_glove"
                        ? "2-Man White Glove"
                        : order.delivery_tier === "pallet"
                        ? "Pallet Freight"
                        : "Standard Parcel";

                    const statusText =
                      order.status === "delivered"
                        ? "Delivered"
                        : order.status === "po_dispatched" || order.status === "in_transit"
                        ? `PO Dispatched (${order.po_number || "Active"})`
                        : "Order Confirmed";

                    return (
                      <tr key={order.id} className="hover:bg-sand-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-navy-950">
                          {order.order_number || order.id}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-navy-900 block">{order.customer_name}</span>
                          <span className="text-[11px] text-navy-500 font-mono">{order.postcode || "UK Mainland"}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sand-100 text-navy-800 border border-sand-300/80">
                            {tierName}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-navy-950">
                          {formatGBP(order.total_pennies || 0)}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-forest-50 text-forest-800 font-semibold border border-forest-200/60 text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-forest-600"></span>
                            <span>{statusText}</span>
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column (4 cols): Operations Command Cards */}
        <div className="lg:col-span-4 space-y-5">
          {/* 1. Dropship Automation Card */}
          <div className="p-5 rounded-2xl bg-white border border-sand-200/90 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-brass-600" />
                <h4 className="font-display text-sm font-bold text-navy-950">UK Dropship Network</h4>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Live Sync</span>
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-sand-50/80 border border-sand-200/70 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-navy-900">Amos Mann Furniture</span>
                <span className="font-mono text-[10px] text-navy-500">Leicester UK Hub</span>
              </div>
              <p className="text-[11px] text-navy-600 leading-relaxed">
                Automated Schema.org catalog sync. Auto-reconciles wholesale costs, applies 45% markup + 20% VAT, and <strong>auto-hides out-of-stock items</strong>.
              </p>
            </div>

            <Link
              href="/admin/suppliers"
              className="w-full py-2 px-3 rounded-xl bg-sand-100 hover:bg-sand-200 text-navy-950 text-xs font-bold transition-colors flex items-center justify-between border border-sand-300/80"
            >
              <span>Manage Dropship Suppliers</span>
              <ChevronRight className="w-3.5 h-3.5 text-navy-600" />
            </Link>
          </div>

          {/* 2. UK Logistics Matrix Status */}
          <div className="p-5 rounded-2xl bg-white border border-sand-200/90 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-brass-600" />
                <h4 className="font-display text-sm font-bold text-navy-950">UK Delivery Thresholds</h4>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sand-100 text-navy-800 border border-sand-300">
                Rule Active
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-sand-100">
                <span className="text-navy-600">Free White Glove Threshold:</span>
                <span className="font-bold text-navy-950">£{freeThreshold}.00</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-sand-100">
                <span className="text-navy-600">Mainland 2-Man Base:</span>
                <span className="font-bold text-navy-950">£{twoManBase}.00</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-navy-600">Highlands Surcharge:</span>
                <span className="font-bold text-navy-950">+£{highlandsSurcharge}.00</span>
              </div>
            </div>

            <Link
              href="/admin/logistics"
              className="w-full py-2 px-3 rounded-xl bg-sand-100 hover:bg-sand-200 text-navy-950 text-xs font-bold transition-colors flex items-center justify-between border border-sand-300/80"
            >
              <span>Configure Postcode Zones Matrix</span>
              <ChevronRight className="w-3.5 h-3.5 text-navy-600" />
            </Link>
          </div>

          {/* 3. Security & Marketing Syndication */}
          <div className="p-5 rounded-2xl bg-white border border-sand-200/90 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-brass-600" />
                <h4 className="font-display text-sm font-bold text-navy-950">Security &amp; Marketing Feeds</h4>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-sand-50 border border-sand-200/60">
                <div className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-navy-600" />
                  <span className="text-navy-700">WAF / IP Jail:</span>
                </div>
                <Link href="/admin/security" className="font-bold text-forest-700 hover:underline">
                  {jailedIps.length === 0 ? "0 Jailed (Clean)" : `${jailedIps.length} Jailed IPs`}
                </Link>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-sand-50 border border-sand-200/60">
                <div className="flex items-center gap-1.5">
                  <Rss className="w-3.5 h-3.5 text-navy-600" />
                  <span className="text-navy-700">Google &amp; Meta Feeds:</span>
                </div>
                <Link href="/admin/marketing" className="font-bold text-navy-950 hover:underline">
                  Active (XML/CSV)
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Bottom Section: Live Operations Audit Trail */}
      <div className="rounded-2xl bg-white border border-sand-200/90 shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-sand-200/80 flex items-center justify-between bg-sand-50/50">
          <div>
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-brass-600" />
              <h3 className="font-display text-base sm:text-lg font-bold text-navy-950">
                Recent System Audit Trail
              </h3>
            </div>
            <p className="text-xs text-navy-600 mt-0.5">
              Live immutable system events recorded in MySQL admin_audit_logs
            </p>
          </div>
          <Link
            href="/admin/audit"
            className="text-xs font-bold px-3 py-1.5 rounded-xl bg-sand-100 hover:bg-sand-200 text-navy-950 border border-sand-300 transition-colors flex items-center gap-1.5"
          >
            <span>View Full Audit Log ({auditLogs.length})</span>
            <ChevronRight className="w-3.5 h-3.5 text-navy-600" />
          </Link>
        </div>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left">
            <thead className="bg-sand-100/70 text-navy-700 uppercase font-semibold text-[11px] tracking-wider border-b border-sand-200">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Operator</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Audit Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-200/70 text-navy-800">
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-navy-500">
                    No recent audit logs recorded yet.
                  </td>
                </tr>
              ) : (
                auditLogs.slice(0, 6).map((log) => {
                  let detailsStr = log.resource;
                  if (log.details_json) {
                    try {
                      const parsed =
                        typeof log.details_json === "string"
                          ? JSON.parse(log.details_json)
                          : log.details_json;
                      detailsStr = JSON.stringify(parsed);
                    } catch {
                      detailsStr = String(log.details_json);
                    }
                  }

                  return (
                    <tr key={log.id} className="hover:bg-sand-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono text-navy-500 whitespace-nowrap">
                        {log.created_at
                          ? new Date(log.created_at).toLocaleString("en-GB")
                          : "Recent"}
                      </td>
                      <td className="py-3 px-4 font-semibold text-navy-950">{log.actor}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-sand-100 border border-sand-300/80 text-navy-900 font-mono text-[10px] font-semibold">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-md truncate text-navy-600" title={detailsStr}>
                        {detailsStr}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
