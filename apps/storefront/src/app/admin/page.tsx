"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Truck,
  ShieldAlert,
  Rss,
  History,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  DollarSign,
  Package,
} from "lucide-react";
import { formatGBP } from "@san-furniture/types";

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<"analytics" | "logistics" | "security" | "feeds" | "audit">("analytics");

  // State for logistics editor
  const [freeThreshold, setFreeThreshold] = useState(500);
  const [twoManBase, setTwoManBase] = useState(49);
  const [highlandsSurcharge, setHighlandsSurcharge] = useState(49);
  const [isLogisticsSaved, setIsLogisticsSaved] = useState(false);

  // State for IP Jail
  const [jailedIps, setJailedIps] = useState([
    {
      ip: "185.220.101.5",
      strikeCount: 2,
      reason: "Carding attack attempt (5 consecutive checkout failures)",
      expiresIn: "48 mins",
      isPermanent: false,
    },
    {
      ip: "194.26.29.112",
      strikeCount: 4,
      reason: "Credential stuffing on admin login (Permanent Ban)",
      expiresIn: "Permanent",
      isPermanent: true,
    },
  ]);

  // State for Audit Logs
  const [auditLogs, setAuditLogs] = useState([
    {
      id: "aud_01",
      timestamp: "Today at 11:42",
      admin: "superadmin@sanfurniture.co.uk",
      action: "UPDATE_LOGISTICS",
      details: "Set UK Free Delivery Threshold to £500.00",
    },
    {
      id: "aud_02",
      timestamp: "Today at 10:15",
      admin: "superadmin@sanfurniture.co.uk",
      action: "FEED_REGENERATE",
      details: "Triggered manual Google Merchant Center XML feed cache flush",
    },
    {
      id: "aud_03",
      timestamp: "Yesterday at 17:30",
      admin: "ops@sanfurniture.co.uk",
      action: "UNBLOCK_IP",
      details: "Pardoned IP 86.14.22.100 after customer verification",
    },
  ]);

  const handleSaveLogistics = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLogisticsSaved(true);
    setAuditLogs((prev) => [
      {
        id: `aud_${Date.now()}`,
        timestamp: "Just now",
        admin: "current_admin@sanfurniture.co.uk",
        action: "UPDATE_LOGISTICS",
        details: `Updated Free Delivery Threshold to £${freeThreshold}, 2-Man Base £${twoManBase}, Highlands £${highlandsSurcharge}`,
      },
      ...prev,
    ]);
    setTimeout(() => setIsLogisticsSaved(false), 2500);
  };

  const handleUnblockIp = (ipToUnblock: string) => {
    setJailedIps((prev) => prev.filter((r) => r.ip !== ipToUnblock));
    setAuditLogs((prev) => [
      {
        id: `aud_${Date.now()}`,
        timestamp: "Just now",
        admin: "current_admin@sanfurniture.co.uk",
        action: "UNBLOCK_IP",
        details: `Pardoned and released IP ${ipToUnblock}`,
      },
      ...prev,
    ]);
  };

  return (
    <div className="space-y-6">
      {/* Top Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-navy-500 mb-1">
            <span>Operations Center</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="font-semibold text-navy-900">Executive Overview</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-navy-950">
            SAN Furniture Operations &amp; Margins
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="text-xs font-semibold px-3.5 py-2 rounded-lg bg-brass-500 hover:bg-brass-400 text-navy-950 transition-colors flex items-center gap-2 shadow-sm font-bold"
          >
            <Package className="w-4 h-4" />
            <span>Manage Products (CRUD)</span>
          </Link>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-sand-200 bg-sand-100/30">
        <div className="w-full px-4 sm:px-6 flex items-center gap-1 sm:gap-4 overflow-x-auto scrollbar-none text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("analytics")}
            className={`py-3.5 px-3 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === "analytics"
                ? "border-navy-950 text-navy-950 font-bold"
                : "border-transparent text-navy-600 hover:text-navy-950"
            }`}
          >
            <TrendingUp className="w-4 h-4 text-brass-600" />
            <span>Sales &amp; Margins</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("logistics")}
            className={`py-3.5 px-3 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === "logistics"
                ? "border-navy-950 text-navy-950 font-bold"
                : "border-transparent text-navy-600 hover:text-navy-950"
            }`}
          >
            <Truck className="w-4 h-4 text-brass-600" />
            <span>UK Logistics &amp; Postcodes</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("security")}
            className={`py-3.5 px-3 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === "security"
                ? "border-navy-950 text-navy-950 font-bold"
                : "border-transparent text-navy-600 hover:text-navy-950"
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-brass-600" />
            <span>Security &amp; IP Jail ({jailedIps.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("feeds")}
            className={`py-3.5 px-3 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === "feeds"
                ? "border-navy-950 text-navy-950 font-bold"
                : "border-transparent text-navy-600 hover:text-navy-950"
            }`}
          >
            <Rss className="w-4 h-4 text-brass-600" />
            <span>Google &amp; Meta Feeds</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("audit")}
            className={`py-3.5 px-3 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === "audit"
                ? "border-navy-950 text-navy-950 font-bold"
                : "border-transparent text-navy-600 hover:text-navy-950"
            }`}
          >
            <History className="w-4 h-4 text-brass-600" />
            <span>Audit Trail &amp; Logs</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full py-6 sm:py-8">
        
        {/* TAB 1: Sales & Margins */}
        {activeTab === "analytics" && (
          <div className="space-y-8 animate-fade-in">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-xl bg-sand-100/70 border border-sand-200">
                <span className="text-[11px] font-bold text-navy-500 uppercase tracking-wider block">
                  Gross UK Revenue
                </span>
                <span className="font-display text-2xl font-bold text-navy-950 block mt-1">
                  £42,850.00
                </span>
                <span className="text-[11px] text-forest-700 font-medium block mt-1">
                  +18.4% vs last week
                </span>
              </div>

              <div className="p-5 rounded-xl bg-sand-100/70 border border-sand-200">
                <span className="text-[11px] font-bold text-navy-500 uppercase tracking-wider block">
                  Dropship Supplier Cost
                </span>
                <span className="font-display text-2xl font-bold text-navy-950 block mt-1">
                  £27,420.00
                </span>
                <span className="text-[11px] text-navy-600 font-medium block mt-1">
                  Carriage &amp; packaging included
                </span>
              </div>

              <div className="p-5 rounded-xl bg-sand-100/70 border border-sand-200">
                <span className="text-[11px] font-bold text-navy-500 uppercase tracking-wider block">
                  Net Profit Margin
                </span>
                <span className="font-display text-2xl font-bold text-forest-700 block mt-1">
                  36.0%
                </span>
                <span className="text-[11px] text-forest-700 font-medium block mt-1">
                  Safely above 15% floor guard
                </span>
              </div>

              <div className="p-5 rounded-xl bg-sand-100/70 border border-sand-200">
                <span className="text-[11px] font-bold text-navy-500 uppercase tracking-wider block">
                  Average Order Value (AOV)
                </span>
                <span className="font-display text-2xl font-bold text-navy-950 block mt-1">
                  £1,190.28
                </span>
                <span className="text-[11px] text-navy-600 font-medium block mt-1">
                  36 orders fulfilled
                </span>
              </div>
            </div>

            {/* Orders Fulfillment Summary Table */}
            <div className="rounded-xl bg-sand-100/50 border border-sand-200 overflow-hidden">
              <div className="p-5 border-b border-sand-200 flex items-center justify-between">
                <div>
                  <h3 className="font-display text-base font-bold text-navy-950">
                    Recent Customer Orders &amp; Supplier POs
                  </h3>
                  <p className="text-xs text-navy-600">
                    Automated Purchase Order forwarding via BullMQ queue
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-forest-100 text-forest-800">
                  Auto-Dispatch: ON
                </span>
              </div>

              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left">
                  <thead className="bg-sand-200/50 text-navy-700 uppercase font-semibold">
                    <tr>
                      <th className="p-3.5">Order ID</th>
                      <th className="p-3.5">Customer &amp; Postcode</th>
                      <th className="p-3.5">Items</th>
                      <th className="p-3.5">Delivery Tier</th>
                      <th className="p-3.5">Gross Total</th>
                      <th className="p-3.5">Supplier PO Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sand-200 text-navy-800">
                    <tr>
                      <td className="p-3.5 font-mono font-bold text-navy-950">SAN-998811</td>
                      <td className="p-3.5">Eleanor Vance (London SW1A)</td>
                      <td className="p-3.5">The Kensington 3-Seater Sofa</td>
                      <td className="p-3.5">2-Man White Glove</td>
                      <td className="p-3.5 font-bold">£1,299.00</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded bg-forest-100 text-forest-800 font-semibold">
                          PO Dispatched (PO-SAN-2026-001)
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3.5 font-mono font-bold text-navy-950">SAN-998812</td>
                      <td className="p-3.5">James Harrington (Edinburgh EH1)</td>
                      <td className="p-3.5">The Henley Dining Table</td>
                      <td className="p-3.5">Pallet Freight</td>
                      <td className="p-3.5 font-bold">£1,150.00</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded bg-forest-100 text-forest-800 font-semibold">
                          PO Dispatched (PO-SAN-2026-002)
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Logistics & Postcode Matrix */}
        {activeTab === "logistics" && (
          <div className="w-full space-y-6 animate-fade-in">
            <div className="p-6 rounded-xl bg-sand-100/60 border border-sand-200 space-y-4">
              <div>
                <h3 className="font-display text-lg font-bold text-navy-950">
                  UK Delivery Thresholds &amp; Courier Surcharges
                </h3>
                <p className="text-xs text-navy-600 mt-0.5">
                  Changes take effect immediately across all storefront checkout sessions and PDP widgets.
                </p>
              </div>

              <form onSubmit={handleSaveLogistics} className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-navy-900 mb-1">
                    Free White Glove Delivery Threshold (£ GBP)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-500 text-xs font-bold">£</span>
                    <input
                      type="number"
                      value={freeThreshold}
                      onChange={(e) => setFreeThreshold(Number(e.target.value))}
                      className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-sand-300 bg-sand-50 text-navy-950 focus:ring-2 focus:ring-brass-500 outline-none"
                    />
                  </div>
                  <p className="text-[11px] text-navy-500 mt-1">Orders at or above this value qualify for Free 2-Man delivery in Mainland UK.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-navy-900 mb-1">
                      Mainland Base 2-Man Courier Fee (£ GBP)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-500 text-xs font-bold">£</span>
                      <input
                        type="number"
                        value={twoManBase}
                        onChange={(e) => setTwoManBase(Number(e.target.value))}
                        className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-sand-300 bg-sand-50 text-navy-950 focus:ring-2 focus:ring-brass-500 outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-navy-900 mb-1">
                      Scottish Highlands Surcharge (£ GBP)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-500 text-xs font-bold">£</span>
                      <input
                        type="number"
                        value={highlandsSurcharge}
                        onChange={(e) => setHighlandsSurcharge(Number(e.target.value))}
                        className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-sand-300 bg-sand-50 text-navy-950 focus:ring-2 focus:ring-brass-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-lg bg-navy-950 text-sand-50 font-bold text-xs hover:bg-brass-600 transition-colors shadow-sm flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Logistics Configuration</span>
                </button>

                {isLogisticsSaved && (
                  <p className="text-xs text-forest-700 font-semibold animate-fade-in">
                    ✓ Logistics rules updated successfully!
                  </p>
                )}
              </form>
            </div>
          </div>
        )}

        {/* TAB 3: Security & IP Jail */}
        {activeTab === "security" && (
          <div className="space-y-6 animate-fade-in">
            <div className="p-6 rounded-xl bg-sand-100/60 border border-sand-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-display text-lg font-bold text-navy-950">
                    Active Security Locks (IP Jail)
                  </h3>
                  <p className="text-xs text-navy-600">
                    Automated lockout triggers after 5 failed attempts. Strikes escalate from 15m to 24h and permanent.
                  </p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded bg-amber-100 text-amber-900 border border-amber-300">
                  {jailedIps.length} Active Jailed IPs
                </span>
              </div>

              {jailedIps.length === 0 ? (
                <div className="py-8 text-center text-xs text-forest-700 font-semibold">
                  ✓ No IP addresses are currently in the security jail.
                </div>
              ) : (
                <div className="overflow-x-auto text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-sand-200/50 text-navy-700 uppercase font-semibold">
                      <tr>
                        <th className="p-3">IP Address</th>
                        <th className="p-3">Strike Level</th>
                        <th className="p-3">Lockout Reason</th>
                        <th className="p-3">Time Remaining</th>
                        <th className="p-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-sand-200 text-navy-800">
                      {jailedIps.map((record) => (
                        <tr key={record.ip}>
                          <td className="p-3 font-mono font-bold text-navy-950">{record.ip}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded bg-sand-200 text-navy-800 font-semibold">
                              Strike {record.strikeCount}
                            </span>
                          </td>
                          <td className="p-3 max-w-xs">{record.reason}</td>
                          <td className="p-3 font-semibold text-brick-700">{record.expiresIn}</td>
                          <td className="p-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleUnblockIp(record.ip)}
                              className="px-3 py-1 bg-navy-950 text-sand-50 rounded text-[11px] font-semibold hover:bg-forest-700 transition-colors inline-flex items-center gap-1"
                            >
                              <Unlock className="w-3 h-3" />
                              <span>Pardon &amp; Unblock</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: Google & Meta Feeds */}
        {activeTab === "feeds" && (
          <div className="space-y-6 w-full animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Google Merchant Feed Card */}
              <div className="p-6 rounded-xl bg-sand-100/60 border border-sand-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-display font-bold text-base text-navy-950">
                    Google Merchant Center Feed
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-forest-100 text-forest-800">
                    Active (RSS 2.0 XML)
                  </span>
                </div>
                <p className="text-xs text-navy-600">
                  Compliant with Google Shopping and Performance Max. Includes prices with 20% UK VAT, GTIN barcodes, and 2-man shipping costs.
                </p>
                <div className="p-2.5 rounded bg-sand-200/60 font-mono text-[11px] text-navy-900 break-all select-all">
                  https://sanfurniture.co.uk/api/feeds/google-merchant.xml
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <a
                    href="/api/feeds/google-merchant.xml"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-navy-950 hover:text-brass-600 transition-colors"
                  >
                    <span>Inspect Raw XML</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Meta Commerce Manager Feed Card */}
              <div className="p-6 rounded-xl bg-sand-100/60 border border-sand-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-display font-bold text-base text-navy-950">
                    Meta Catalog Feed
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-forest-100 text-forest-800">
                    Active (CSV)
                  </span>
                </div>
                <p className="text-xs text-navy-600">
                  RFC 4180 CSV feed for Facebook &amp; Instagram Shop with real-time stock sync and Conversions API (CAPI) deduplication.
                </p>
                <div className="p-2.5 rounded bg-sand-200/60 font-mono text-[11px] text-navy-900 break-all select-all">
                  https://sanfurniture.co.uk/api/feeds/meta-catalog.csv
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <a
                    href="/api/feeds/meta-catalog.csv"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-navy-950 hover:text-brass-600 transition-colors"
                  >
                    <span>Download CSV Feed</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: Audit Logs */}
        {activeTab === "audit" && (
          <div className="space-y-6 animate-fade-in">
            <div className="p-6 rounded-xl bg-sand-100/60 border border-sand-200">
              <h3 className="font-display text-lg font-bold text-navy-950 mb-1">
                Immutable Operations Audit Trail
              </h3>
              <p className="text-xs text-navy-600 mb-4">
                Every sensitive admin action, pricing adjustment, and security pardon is recorded with timestamp and admin ID.
              </p>

              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left">
                  <thead className="bg-sand-200/50 text-navy-700 uppercase font-semibold">
                    <tr>
                      <th className="p-3">Timestamp</th>
                      <th className="p-3">Admin Operator</th>
                      <th className="p-3">Action Type</th>
                      <th className="p-3">Audit Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sand-200 text-navy-800">
                    {auditLogs.map((log) => (
                      <tr key={log.id}>
                        <td className="p-3 font-mono text-navy-500 whitespace-nowrap">{log.timestamp}</td>
                        <td className="p-3 font-semibold text-navy-950">{log.admin}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded bg-sand-200 text-navy-900 font-mono text-[11px]">
                            {log.action}
                          </span>
                        </td>
                        <td className="p-3">{log.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
