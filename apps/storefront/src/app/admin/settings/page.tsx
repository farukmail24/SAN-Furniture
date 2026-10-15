"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Building,
  ShieldCheck,
  Truck,
  CreditCard,
  Lock,
  Save,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  Phone,
  Mail,
  Zap,
  Globe
} from "lucide-react";

interface SystemSettingsMap {
  [key: string]: string;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SystemSettingsMap>({
    company_name: "SAN Furniture UK Ltd",
    company_number: "14289123",
    vat_number: "GB 438 9123 76",
    registered_address: "48 Grosvenor Square, Mayfair, London W1K 2HP, United Kingdom",
    support_email: "concierge@sanfurniture.co.uk",
    support_phone: "+44 (0) 20 7946 0912",
    free_shipping_threshold_pennies: "50000",
    standard_delivery_fee_pennies: "4900",
    white_glove_fee_pennies: "9900",
    highlands_surcharge_pennies: "4900",
    dropship_auto_dispatch: "true",
    dropship_min_margin_percent: "30",
    stripe_enabled: "true",
    klarna_enabled: "true",
    klarna_merchant_id: "K1482910_GB",
    ip_jail_max_failures: "5",
    ip_jail_duration_mins: "15"
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"legal" | "logistics" | "dropship" | "payments" | "security">("legal");

  const fetchSettings = async () => {
    try {
      const res = await fetch("http://localhost:9000/api/admin/settings");
      const data = await res.json();
      if (data.settings) {
        setSettings((prev) => ({ ...prev, ...data.settings }));
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await fetch("http://localhost:9000/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg("System configuration successfully saved and persisted to database!");
        setTimeout(() => setSuccessMsg(null), 4000);
      } else {
        setErrorMsg(data.error || "Failed to update configuration.");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error connecting to server";
      setErrorMsg(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E8E2D5]">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#C89B3C] mb-1">
            <Settings className="w-4 h-4" />
            <span>Core Architecture & Governance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif text-[#0B132B]">
            System Configuration & Settings
          </h1>
          <p className="text-sm text-[#4F6D7A] mt-1">
            Manage legal HMRC VAT credentials, UK delivery thresholds, dropship EDI automation, and security limits.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#0B132B] hover:bg-[#1C2541] text-[#FAF8F5] rounded-md text-sm font-medium transition-all shadow-md hover:shadow-lg disabled:opacity-50"
        >
          {saving ? (
            <RefreshCw className="w-4 h-4 animate-spin text-[#C89B3C]" />
          ) : (
            <Save className="w-4 h-4 text-[#C89B3C]" />
          )}
          <span>{saving ? "Saving Changes..." : "Save Configuration"}</span>
        </button>
      </div>

      {/* Success / Error Notification */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-md text-sm flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-900 rounded-md text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[#E8E2D5] pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("legal")}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-md text-sm font-medium transition-colors ${
            activeTab === "legal"
              ? "bg-[#0B132B] text-white shadow-sm"
              : "text-[#4F6D7A] hover:text-[#0B132B] hover:bg-[#E8E2D5]/50"
          }`}
        >
          <Building className="w-4 h-4" />
          <span>HMRC VAT & Legal Entity</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("logistics")}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-md text-sm font-medium transition-colors ${
            activeTab === "logistics"
              ? "bg-[#0B132B] text-white shadow-sm"
              : "text-[#4F6D7A] hover:text-[#0B132B] hover:bg-[#E8E2D5]/50"
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Delivery Rates & Surcharges</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("dropship")}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-md text-sm font-medium transition-colors ${
            activeTab === "dropship"
              ? "bg-[#0B132B] text-white shadow-sm"
              : "text-[#4F6D7A] hover:text-[#0B132B] hover:bg-[#E8E2D5]/50"
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>Dropship Automation & Margins</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("payments")}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-md text-sm font-medium transition-colors ${
            activeTab === "payments"
              ? "bg-[#0B132B] text-white shadow-sm"
              : "text-[#4F6D7A] hover:text-[#0B132B] hover:bg-[#E8E2D5]/50"
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>UK Payment Gateways</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("security")}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-md text-sm font-medium transition-colors ${
            activeTab === "security"
              ? "bg-[#0B132B] text-white shadow-sm"
              : "text-[#4F6D7A] hover:text-[#0B132B] hover:bg-[#E8E2D5]/50"
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Security & IP Lockout</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center items-center">
          <RefreshCw className="w-8 h-8 animate-spin text-[#C89B3C]" />
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {/* TAB 1: Legal & HMRC */}
          {activeTab === "legal" && (
            <div className="bg-white rounded-xl p-6 sm:p-8 border border-[#E8E2D5] shadow-sm space-y-6">
              <div>
                <h2 className="text-lg font-serif font-bold text-[#0B132B] flex items-center gap-2">
                  <Building className="w-5 h-5 text-[#C89B3C]" />
                  UK Legal Entity & HMRC VAT Registration
                </h2>
                <p className="text-xs text-[#4F6D7A] mt-1">
                  Required by UK law on every invoice, order confirmation, and legal footer.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-[#0B132B] uppercase tracking-wider mb-1.5">
                    Registered Company Name
                  </label>
                  <input
                    type="text"
                    value={settings.company_name || ""}
                    onChange={(e) => handleChange("company_name", e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E8E2D5] focus:outline-none focus:ring-2 focus:ring-[#0B132B] text-sm text-[#0B132B]"
                    placeholder="SAN Furniture UK Ltd"
                  />
                  <p className="text-[11px] text-[#4F6D7A] mt-1">Incorporated in England and Wales.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0B132B] uppercase tracking-wider mb-1.5">
                    Companies House Number
                  </label>
                  <input
                    type="text"
                    value={settings.company_number || ""}
                    onChange={(e) => handleChange("company_number", e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E8E2D5] focus:outline-none focus:ring-2 focus:ring-[#0B132B] text-sm text-[#0B132B]"
                    placeholder="14289123"
                  />
                  <p className="text-[11px] text-[#4F6D7A] mt-1">8-digit official registered identifier.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0B132B] uppercase tracking-wider mb-1.5">
                    HMRC VAT Registration Number
                  </label>
                  <input
                    type="text"
                    value={settings.vat_number || ""}
                    onChange={(e) => handleChange("vat_number", e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E8E2D5] focus:outline-none focus:ring-2 focus:ring-[#0B132B] text-sm text-[#0B132B]"
                    placeholder="GB 438 9123 76"
                  />
                  <p className="text-[11px] text-[#4F6D7A] mt-1">Prefix with &apos;GB&apos; followed by 9 digits.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0B132B] uppercase tracking-wider mb-1.5">
                    Standard VAT Rate (%)
                  </label>
                  <input
                    type="text"
                    disabled
                    value="20.00% (UK Standard Rate)"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E8E2D5] bg-[#F4F1EA] text-sm text-[#4F6D7A] cursor-not-allowed"
                  />
                  <p className="text-[11px] text-[#4F6D7A] mt-1">Calculated using exact UK penny arithmetic.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0B132B] uppercase tracking-wider mb-1.5">
                    Concierge Support Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#4F6D7A] absolute left-3 top-3" />
                    <input
                      type="email"
                      value={settings.support_email || ""}
                      onChange={(e) => handleChange("support_email", e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-[#E8E2D5] focus:outline-none focus:ring-2 focus:ring-[#0B132B] text-sm text-[#0B132B]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0B132B] uppercase tracking-wider mb-1.5">
                    Concierge Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-[#4F6D7A] absolute left-3 top-3" />
                    <input
                      type="text"
                      value={settings.support_phone || ""}
                      onChange={(e) => handleChange("support_phone", e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-[#E8E2D5] focus:outline-none focus:ring-2 focus:ring-[#0B132B] text-sm text-[#0B132B]"
                    />
                  </div>
                </div>

                <div className="md:col-span-2 lg:col-span-3">
                  <label className="block text-xs font-semibold text-[#0B132B] uppercase tracking-wider mb-1.5">
                    Official Registered Office Address
                  </label>
                  <input
                    type="text"
                    value={settings.registered_address || ""}
                    onChange={(e) => handleChange("registered_address", e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E8E2D5] focus:outline-none focus:ring-2 focus:ring-[#0B132B] text-sm text-[#0B132B]"
                    placeholder="48 Grosvenor Square, Mayfair, London W1K 2HP, United Kingdom"
                  />
                  <p className="text-[11px] text-[#4F6D7A] mt-1">Must match registered office on Companies House filings.</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Logistics & Surcharges */}
          {activeTab === "logistics" && (
            <div className="bg-white rounded-xl p-6 sm:p-8 border border-[#E8E2D5] shadow-sm space-y-6">
              <div>
                <h2 className="text-lg font-serif font-bold text-[#0B132B] flex items-center gap-2">
                  <Truck className="w-5 h-5 text-[#C89B3C]" />
                  Delivery Pricing & Postcode Surcharge Rules
                </h2>
                <p className="text-xs text-[#4F6D7A] mt-1">
                  Thresholds stored internally in pennies to eliminate rounding errors.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-[#0B132B] uppercase tracking-wider mb-1.5">
                    Free Delivery Threshold (Pennies)
                  </label>
                  <input
                    type="number"
                    value={settings.free_shipping_threshold_pennies || "50000"}
                    onChange={(e) => handleChange("free_shipping_threshold_pennies", e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E8E2D5] focus:outline-none focus:ring-2 focus:ring-[#0B132B] text-sm text-[#0B132B]"
                  />
                  <p className="text-[11px] text-[#4F6D7A] mt-1">
                    Current: <strong>£{(parseInt(settings.free_shipping_threshold_pennies || "50000", 10) / 100).toFixed(2)}</strong>. Orders above this receive complimentary 2-man room-of-choice delivery.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0B132B] uppercase tracking-wider mb-1.5">
                    Standard Pallet Delivery Fee (Pennies)
                  </label>
                  <input
                    type="number"
                    value={settings.standard_delivery_fee_pennies || "4900"}
                    onChange={(e) => handleChange("standard_delivery_fee_pennies", e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E8E2D5] focus:outline-none focus:ring-2 focus:ring-[#0B132B] text-sm text-[#0B132B]"
                  />
                  <p className="text-[11px] text-[#4F6D7A] mt-1">
                    Current: <strong>£{(parseInt(settings.standard_delivery_fee_pennies || "4900", 10) / 100).toFixed(2)}</strong> (Flatpack tables, dining chairs).
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0B132B] uppercase tracking-wider mb-1.5">
                    2-Man White Glove Standard Fee (Pennies)
                  </label>
                  <input
                    type="number"
                    value={settings.white_glove_fee_pennies || "9900"}
                    onChange={(e) => handleChange("white_glove_fee_pennies", e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E8E2D5] focus:outline-none focus:ring-2 focus:ring-[#0B132B] text-sm text-[#0B132B]"
                  />
                  <p className="text-[11px] text-[#4F6D7A] mt-1">
                    Current: <strong>£{(parseInt(settings.white_glove_fee_pennies || "9900", 10) / 100).toFixed(2)}</strong> (Assembled sofas, sectionals).
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0B132B] uppercase tracking-wider mb-1.5">
                    Scottish Highlands Surcharge (Pennies)
                  </label>
                  <input
                    type="number"
                    value={settings.highlands_surcharge_pennies || "4900"}
                    onChange={(e) => handleChange("highlands_surcharge_pennies", e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E8E2D5] focus:outline-none focus:ring-2 focus:ring-[#0B132B] text-sm text-[#0B132B]"
                  />
                  <p className="text-[11px] text-[#4F6D7A] mt-1">
                    Current: <strong>£{(parseInt(settings.highlands_surcharge_pennies || "4900", 10) / 100).toFixed(2)}</strong> for IV, KW, PH, AB, PA postcodes.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Dropshipping Automation */}
          {activeTab === "dropship" && (
            <div className="bg-white rounded-xl p-6 sm:p-8 border border-[#E8E2D5] shadow-sm space-y-6">
              <div>
                <h2 className="text-lg font-serif font-bold text-[#0B132B] flex items-center gap-2">
                  <Zap className="w-5 h-5 text-[#C89B3C]" />
                  UK Dropshipping Automation & Profit Margin Guard
                </h2>
                <p className="text-xs text-[#4F6D7A] mt-1">
                  Control EDI transmission to Nottinghamshire & Essex wholesale suppliers.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-[#F4F1EA] rounded-lg border border-[#E8E2D5]">
                  <div>
                    <div className="text-sm font-semibold text-[#0B132B]">
                      Automated Purchase Order (PO) Dispatch
                    </div>
                    <div className="text-xs text-[#4F6D7A] mt-0.5">
                      Automatically transmit webhook/EDI order to suppliers when customer pays.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleChange(
                        "dropship_auto_dispatch",
                        settings.dropship_auto_dispatch === "true" ? "false" : "true"
                      )
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.dropship_auto_dispatch === "true" ? "bg-emerald-600" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.dropship_auto_dispatch === "true" ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0B132B] uppercase tracking-wider mb-1.5">
                    Minimum Gross Margin Floor Protection (%)
                  </label>
                  <input
                    type="number"
                    value={settings.dropship_min_margin_percent || "30"}
                    onChange={(e) => handleChange("dropship_min_margin_percent", e.target.value)}
                    className="w-full max-w-xs px-3.5 py-2.5 rounded-lg border border-[#E8E2D5] focus:outline-none focus:ring-2 focus:ring-[#0B132B] text-sm text-[#0B132B]"
                  />
                  <p className="text-[11px] text-[#4F6D7A] mt-1">
                    System prevents product price drops below <strong>{settings.dropship_min_margin_percent || 30}%</strong> profit margin over supplier wholesale cost.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Payments */}
          {activeTab === "payments" && (
            <div className="bg-white rounded-xl p-6 sm:p-8 border border-[#E8E2D5] shadow-sm space-y-6">
              <div>
                <h2 className="text-lg font-serif font-bold text-[#0B132B] flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[#C89B3C]" />
                  UK Payment Gateways & Merchant Accounts
                </h2>
                <p className="text-xs text-[#4F6D7A] mt-1">
                  Manage active payment rails supporting GBP transactions and 3-D Secure.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-5 border border-[#E8E2D5] rounded-xl flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#0B132B] text-[#C89B3C] flex items-center justify-center font-bold text-xs">
                      STRIPE
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-[#0B132B]">Stripe UK Payments</div>
                      <div className="text-xs text-[#4F6D7A]">Visa, Mastercard, Amex, Apple Pay, Google Pay</div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-medium">
                    Active & Operational
                  </span>
                </div>

                <div className="p-5 border border-[#E8E2D5] rounded-xl space-y-3 bg-slate-50/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-pink-100 text-pink-700 flex items-center justify-center font-bold text-xs">
                        KLARNA
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-[#0B132B]">Klarna UK (Pay in 3 & Financing)</div>
                        <div className="text-xs text-[#4F6D7A]">High conversion BNPL for luxury British upholstery</div>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-medium">
                      Active
                    </span>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#0B132B] uppercase tracking-wider mb-1">
                      Klarna UK Merchant ID
                    </label>
                    <input
                      type="text"
                      value={settings.klarna_merchant_id || ""}
                      onChange={(e) => handleChange("klarna_merchant_id", e.target.value)}
                      className="w-full px-3.5 py-2 rounded-lg border border-[#E8E2D5] text-sm text-[#0B132B]"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Security */}
          {activeTab === "security" && (
            <div className="bg-white rounded-xl p-6 sm:p-8 border border-[#E8E2D5] shadow-sm space-y-6">
              <div>
                <h2 className="text-lg font-serif font-bold text-[#0B132B] flex items-center gap-2">
                  <Lock className="w-5 h-5 text-[#C89B3C]" />
                  Brute-Force & IP Jail Governance
                </h2>
                <p className="text-xs text-[#4F6D7A] mt-1">
                  Protects checkout and admin authentication from automated bot assaults.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-[#0B132B] uppercase tracking-wider mb-1.5">
                    Max Failed Attempts Before Lockout
                  </label>
                  <input
                    type="number"
                    value={settings.ip_jail_max_failures || "5"}
                    onChange={(e) => handleChange("ip_jail_max_failures", e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E8E2D5] focus:outline-none focus:ring-2 focus:ring-[#0B132B] text-sm text-[#0B132B]"
                  />
                  <p className="text-[11px] text-[#4F6D7A] mt-1">
                    Exceeding this count automatically registers the IP into <code>security_ip_jail</code>.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0B132B] uppercase tracking-wider mb-1.5">
                    Lockout Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    value={settings.ip_jail_duration_mins || "15"}
                    onChange={(e) => handleChange("ip_jail_duration_mins", e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E8E2D5] focus:outline-none focus:ring-2 focus:ring-[#0B132B] text-sm text-[#0B132B]"
                  />
                  <p className="text-[11px] text-[#4F6D7A] mt-1">
                    Duration the IP is blocked from checkout & auth endpoints.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Save Bar */}
          <div className="pt-4 border-t border-[#E8E2D5] flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-8 py-3 bg-[#0B132B] hover:bg-[#1C2541] text-[#FAF8F5] rounded-md text-sm font-medium transition-all shadow-md hover:shadow-lg disabled:opacity-50"
            >
              {saving ? (
                <RefreshCw className="w-4 h-4 animate-spin text-[#C89B3C]" />
              ) : (
                <Save className="w-4 h-4 text-[#C89B3C]" />
              )}
              <span>{saving ? "Saving Changes..." : "Save All Configuration"}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
