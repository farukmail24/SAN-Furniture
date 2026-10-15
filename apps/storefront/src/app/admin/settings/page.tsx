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
  Globe,
  ImageIcon,
  MessageSquare,
  Send,
  Sparkles,
  ExternalLink
} from "lucide-react";
import { MediaPickerModal } from "@/components/admin/MediaPickerModal";
import { apiUrl } from "@/lib/api-config";
import { fetchWithSwr, invalidateCache } from "@/lib/api-cache";

interface SystemSettingsMap {
  [key: string]: string;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SystemSettingsMap>({
    // Branding
    site_name: "SAN Furniture",
    site_tagline: "Handcrafted Luxury Living • British Excellence",
    site_logo_light: "/SanFurnitureLogo.png",
    site_logo_dark: "/San-Furniture-Logo-Dark.png",
    site_favicon: "/favicon.ico",
    // Legal & Company
    company_name: "SAN Furniture UK Ltd",
    company_number: "14289123",
    vat_number: "GB 438 9123 76",
    registered_address: "48 Grosvenor Square, Mayfair, London W1K 2HP, United Kingdom",
    support_email: "concierge@sanfurniture.co.uk",
    support_phone: "+44 (0) 20 7946 0912",
    // Logistics
    free_shipping_threshold_pennies: "50000",
    standard_delivery_fee_pennies: "4900",
    white_glove_fee_pennies: "9900",
    highlands_surcharge_pennies: "4900",
    // Dropshipping
    dropship_auto_dispatch: "true",
    dropship_min_margin_percent: "30",
    // Email SMTP
    smtp_provider: "smtp",
    smtp_host: "smtp.mailgun.org",
    smtp_port: "587",
    smtp_encryption: "TLS",
    smtp_user: "postmaster@sanfurniture.co.uk",
    smtp_pass: "••••••••••••••••",
    smtp_from_email: "orders@sanfurniture.co.uk",
    smtp_from_name: "SAN Furniture Concierge",
    // SMS Gateway
    sms_provider: "twilio",
    sms_account_sid: "AC_SAN_FURNITURE_LIVE_001",
    sms_auth_token: "••••••••••••••••••••••••",
    sms_sender_id: "SANFURNITURE",
    sms_dispatch_enabled: "true",
    sms_driver_alert_enabled: "true",
    // Payment
    stripe_enabled: "true",
    klarna_enabled: "true",
    klarna_merchant_id: "K1482910_GB",
    // Security
    ip_jail_max_failures: "5",
    ip_jail_duration_mins: "15"
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [testingSms, setTestingSms] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Tabs
  const [activeTab, setActiveTab] = useState<
    "branding" | "legal" | "email" | "sms" | "logistics" | "dropship" | "payments" | "security"
  >("branding");

  // Media picker target
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [activeLogoTarget, setActiveLogoTarget] = useState<"light" | "dark" | "favicon">("light");

  const fetchSettings = async () => {
    try {
      fetchWithSwr(
        apiUrl("/api/admin/settings"),
        (data: any, isCached) => {
          if (data.settings) {
            setSettings((prev) => ({ ...prev, ...data.settings }));
            if (isCached) setLoading(false);
          }
        }
      ).finally(() => setLoading(false));
    } catch (err) {
      console.error("Failed to load settings:", err);
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
      const res = await fetch(apiUrl("/api/admin/settings"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings })
      });
      const data = await res.json();
      if (res.ok) {
        invalidateCache("/api/admin/settings");
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

  const handleTestEmail = async () => {
    setTestingEmail(true);
    try {
      const res = await fetch(apiUrl("/api/admin/settings/test-email"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: settings.support_email }),
      });
      const data = await res.json();
      setSuccessMsg(data.message || "Test email dispatched successfully!");
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg("Failed to dispatch test email: " + err.message);
    } finally {
      setTestingEmail(false);
    }
  };

  const handleTestSms = async () => {
    setTestingSms(true);
    try {
      const res = await fetch(apiUrl("/api/admin/settings/test-sms"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: settings.support_phone }),
      });
      const data = await res.json();
      setSuccessMsg(data.message || "Test SMS alert dispatched successfully!");
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg("Failed to dispatch test SMS: " + err.message);
    } finally {
      setTestingSms(false);
    }
  };

  const handleMediaSelect = (url: string) => {
    if (activeLogoTarget === "light") {
      handleChange("site_logo_light", url);
    } else if (activeLogoTarget === "dark") {
      handleChange("site_logo_dark", url);
    } else {
      handleChange("site_favicon", url);
    }
    setMediaPickerOpen(false);
  };

  return (
    <div className="space-y-6 pb-12 antialiased">
      {/* Page Title & Save Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-sand-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-navy-500 mb-1">
            <span className="font-semibold text-brass-700 tracking-wider uppercase text-[10px]">Core Architecture &amp; Governance</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-navy-950">
            System Configuration &amp; Settings
          </h1>
          <p className="text-xs text-navy-600 mt-1">
            Manage Branding &amp; Logos &bull; HMRC VAT Credentials &bull; Email (SMTP) &bull; SMS Gateway &bull; Dropship Automation
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brass-500 to-brass-600 hover:from-brass-400 hover:to-brass-500 text-navy-950 font-bold text-xs tracking-wide shadow-md shadow-brass-500/20 transition-all disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? "Saving to Database..." : "Save All Configuration"}</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2.5 animate-fade-in shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center gap-2.5 animate-fade-in shadow-xs">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Settings Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-sand-200 text-xs font-semibold scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab("branding")}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === "branding"
              ? "bg-navy-950 text-brass-400 shadow-sm"
              : "text-navy-700 hover:bg-sand-200"
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>Branding, Logos &amp; Favicon</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("legal")}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === "legal"
              ? "bg-navy-950 text-brass-400 shadow-sm"
              : "text-navy-700 hover:bg-sand-200"
          }`}
        >
          <Building className="w-4 h-4" />
          <span>HMRC VAT &amp; Legal Entity</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("email")}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === "email"
              ? "bg-navy-950 text-brass-400 shadow-sm"
              : "text-navy-700 hover:bg-sand-200"
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Email (SMTP) Gateway</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("sms")}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === "sms"
              ? "bg-navy-950 text-brass-400 shadow-sm"
              : "text-navy-700 hover:bg-sand-200"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>SMS &amp; 2-Man Alerts</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("logistics")}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === "logistics"
              ? "bg-navy-950 text-brass-400 shadow-sm"
              : "text-navy-700 hover:bg-sand-200"
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Delivery Rates &amp; Surcharges</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("dropship")}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === "dropship"
              ? "bg-navy-950 text-brass-400 shadow-sm"
              : "text-navy-700 hover:bg-sand-200"
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>Dropship Automation &amp; Margins</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("payments")}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === "payments"
              ? "bg-navy-950 text-brass-400 shadow-sm"
              : "text-navy-700 hover:bg-sand-200"
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>UK Payment Gateways</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("security")}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === "security"
              ? "bg-navy-950 text-brass-400 shadow-sm"
              : "text-navy-700 hover:bg-sand-200"
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Security &amp; IP Lockout</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* TAB 1: BRANDING & LOGOS */}
        {activeTab === "branding" && (
          <div className="p-6 bg-sand-50 border border-sand-300 rounded-2xl shadow-sm space-y-6">
            <div>
              <h2 className="text-base font-bold text-navy-950 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-brass-600" />
                <span>Store Identity, Logos &amp; Favicon</span>
              </h2>
              <p className="text-xs text-navy-600 mt-1">
                Configure your luxury brand marks across light mode, dark mode, browser tabs, and HMRC invoices.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-navy-900 mb-1">Store Brand Name</label>
                <input
                  type="text"
                  value={settings.site_name}
                  onChange={(e) => handleChange("site_name", e.target.value)}
                  className="w-full px-3 py-2 bg-sand-100 border border-sand-300 rounded-lg text-xs font-semibold text-navy-950 focus:outline-none focus:border-brass-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy-900 mb-1">Brand Tagline</label>
                <input
                  type="text"
                  value={settings.site_tagline}
                  onChange={(e) => handleChange("site_tagline", e.target.value)}
                  className="w-full px-3 py-2 bg-sand-100 border border-sand-300 rounded-lg text-xs text-navy-950 focus:outline-none focus:border-brass-500"
                />
              </div>
            </div>

            {/* Logo Setters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              {/* Light Logo */}
              <div className="p-4 rounded-xl bg-white border border-sand-300 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-navy-950">Primary Logo (Light)</span>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveLogoTarget("light");
                      setMediaPickerOpen(true);
                    }}
                    className="text-[11px] text-brass-700 font-semibold hover:underline"
                  >
                    Select from Media
                  </button>
                </div>
                <div className="h-20 bg-sand-100 rounded-lg flex items-center justify-center p-2 border border-sand-200">
                  <img
                    src={settings.site_logo_light}
                    alt="Logo Light"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <input
                  type="text"
                  value={settings.site_logo_light}
                  onChange={(e) => handleChange("site_logo_light", e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-sand-50 border border-sand-300 rounded text-[11px] font-mono text-navy-800"
                />
              </div>

              {/* Dark Logo */}
              <div className="p-4 rounded-xl bg-navy-950 border border-navy-900 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-sand-50">Dark Mode Logo</span>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveLogoTarget("dark");
                      setMediaPickerOpen(true);
                    }}
                    className="text-[11px] text-brass-400 font-semibold hover:underline"
                  >
                    Select from Media
                  </button>
                </div>
                <div className="h-20 bg-navy-900 rounded-lg flex items-center justify-center p-2 border border-navy-800">
                  <img
                    src={settings.site_logo_dark}
                    alt="Logo Dark"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <input
                  type="text"
                  value={settings.site_logo_dark}
                  onChange={(e) => handleChange("site_logo_dark", e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-navy-900 border border-navy-800 rounded text-[11px] font-mono text-sand-100"
                />
              </div>

              {/* Favicon */}
              <div className="p-4 rounded-xl bg-white border border-sand-300 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-navy-950">Site Favicon (.ico / .png)</span>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveLogoTarget("favicon");
                      setMediaPickerOpen(true);
                    }}
                    className="text-[11px] text-brass-700 font-semibold hover:underline"
                  >
                    Select from Media
                  </button>
                </div>
                <div className="h-20 bg-sand-100 rounded-lg flex items-center justify-center p-2 border border-sand-200">
                  <img
                    src={settings.site_favicon}
                    alt="Favicon"
                    className="w-8 h-8 object-contain"
                  />
                </div>
                <input
                  type="text"
                  value={settings.site_favicon}
                  onChange={(e) => handleChange("site_favicon", e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-sand-50 border border-sand-300 rounded text-[11px] font-mono text-navy-800"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: LEGAL & HMRC VAT */}
        {activeTab === "legal" && (
          <div className="p-6 bg-sand-50 border border-sand-300 rounded-2xl shadow-sm space-y-4">
            <h2 className="text-base font-bold text-navy-950 flex items-center gap-2">
              <Building className="w-5 h-5 text-brass-600" />
              <span>UK Legal Entity &amp; HMRC VAT Registration</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-navy-900 mb-1">Registered Company Name</label>
                <input
                  type="text"
                  value={settings.company_name}
                  onChange={(e) => handleChange("company_name", e.target.value)}
                  className="w-full px-3 py-2 bg-sand-100 border border-sand-300 rounded-lg text-xs font-semibold text-navy-950"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-navy-900 mb-1">Companies House Number</label>
                <input
                  type="text"
                  value={settings.company_number}
                  onChange={(e) => handleChange("company_number", e.target.value)}
                  className="w-full px-3 py-2 bg-sand-100 border border-sand-300 rounded-lg text-xs font-mono text-navy-950"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-navy-900 mb-1">HMRC VAT Number</label>
                <input
                  type="text"
                  value={settings.vat_number}
                  onChange={(e) => handleChange("vat_number", e.target.value)}
                  className="w-full px-3 py-2 bg-sand-100 border border-sand-300 rounded-lg text-xs font-mono font-bold text-navy-950"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy-900 mb-1">Registered Office Address</label>
              <input
                type="text"
                value={settings.registered_address}
                onChange={(e) => handleChange("registered_address", e.target.value)}
                className="w-full px-3 py-2 bg-sand-100 border border-sand-300 rounded-lg text-xs text-navy-950"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-navy-900 mb-1">Concierge Email</label>
                <input
                  type="email"
                  value={settings.support_email}
                  onChange={(e) => handleChange("support_email", e.target.value)}
                  className="w-full px-3 py-2 bg-sand-100 border border-sand-300 rounded-lg text-xs text-navy-950"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-navy-900 mb-1">Concierge Phone Line</label>
                <input
                  type="text"
                  value={settings.support_phone}
                  onChange={(e) => handleChange("support_phone", e.target.value)}
                  className="w-full px-3 py-2 bg-sand-100 border border-sand-300 rounded-lg text-xs text-navy-950"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: EMAIL (SMTP) GATEWAY */}
        {activeTab === "email" && (
          <div className="p-6 bg-sand-50 border border-sand-300 rounded-2xl shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-navy-950 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-brass-600" />
                  <span>Email (SMTP) Gateway Configuration</span>
                </h2>
                <p className="text-xs text-navy-600 mt-1">
                  Connect your transactional email provider to send VAT invoices, order updates, and reset links.
                </p>
              </div>

              <button
                type="button"
                onClick={handleTestEmail}
                disabled={testingEmail}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-navy-950 hover:bg-navy-900 text-sand-50 font-semibold text-xs shadow-xs transition-colors disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5 text-brass-400" />
                <span>{testingEmail ? "Sending Test Email..." : "Send Test Verification Email"}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-navy-900 mb-1">Email Provider</label>
                <select
                  value={settings.smtp_provider}
                  onChange={(e) => handleChange("smtp_provider", e.target.value)}
                  className="w-full px-3 py-2 bg-sand-100 border border-sand-300 rounded-lg text-xs text-navy-950"
                >
                  <option value="smtp">Custom SMTP Server</option>
                  <option value="resend">Resend API</option>
                  <option value="sendgrid">SendGrid API</option>
                  <option value="ses">Amazon SES</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy-900 mb-1">SMTP Host</label>
                <input
                  type="text"
                  value={settings.smtp_host}
                  onChange={(e) => handleChange("smtp_host", e.target.value)}
                  placeholder="smtp.mailgun.org"
                  className="w-full px-3 py-2 bg-sand-100 border border-sand-300 rounded-lg text-xs font-mono text-navy-950"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy-900 mb-1">SMTP Port &amp; Encryption</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={settings.smtp_port}
                    onChange={(e) => handleChange("smtp_port", e.target.value)}
                    placeholder="587"
                    className="w-full px-3 py-2 bg-sand-100 border border-sand-300 rounded-lg text-xs font-mono text-navy-950"
                  />
                  <select
                    value={settings.smtp_encryption}
                    onChange={(e) => handleChange("smtp_encryption", e.target.value)}
                    className="w-full px-2 py-2 bg-sand-100 border border-sand-300 rounded-lg text-xs text-navy-950"
                  >
                    <option value="TLS">STARTTLS</option>
                    <option value="SSL">SSL</option>
                    <option value="None">None</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-navy-900 mb-1">SMTP Username</label>
                <input
                  type="text"
                  value={settings.smtp_user}
                  onChange={(e) => handleChange("smtp_user", e.target.value)}
                  className="w-full px-3 py-2 bg-sand-100 border border-sand-300 rounded-lg text-xs text-navy-950"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy-900 mb-1">SMTP Password</label>
                <input
                  type="password"
                  value={settings.smtp_pass}
                  onChange={(e) => handleChange("smtp_pass", e.target.value)}
                  className="w-full px-3 py-2 bg-sand-100 border border-sand-300 rounded-lg text-xs font-mono text-navy-950"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-navy-900 mb-1">From Email Address</label>
                <input
                  type="email"
                  value={settings.smtp_from_email}
                  onChange={(e) => handleChange("smtp_from_email", e.target.value)}
                  placeholder="orders@sanfurniture.co.uk"
                  className="w-full px-3 py-2 bg-sand-100 border border-sand-300 rounded-lg text-xs text-navy-950"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy-900 mb-1">Sender Name (Friendly Name)</label>
                <input
                  type="text"
                  value={settings.smtp_from_name}
                  onChange={(e) => handleChange("smtp_from_name", e.target.value)}
                  placeholder="SAN Furniture Concierge"
                  className="w-full px-3 py-2 bg-sand-100 border border-sand-300 rounded-lg text-xs text-navy-950"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SMS & 2-MAN WHATSAPP GATEWAY */}
        {activeTab === "sms" && (
          <div className="p-6 bg-sand-50 border border-sand-300 rounded-2xl shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-navy-950 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-brass-600" />
                  <span>SMS &amp; 2-Man Delivery Dispatch Alerts</span>
                </h2>
                <p className="text-xs text-navy-600 mt-1">
                  Automate SMS alerts for 2-hour pre-booked delivery slots and driver 30-minute arrival warnings.
                </p>
              </div>

              <button
                type="button"
                onClick={handleTestSms}
                disabled={testingSms}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-navy-950 hover:bg-navy-900 text-sand-50 font-semibold text-xs shadow-xs transition-colors disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5 text-brass-400" />
                <span>{testingSms ? "Sending Test SMS..." : "Send Test 2-Man Alert SMS"}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-navy-900 mb-1">SMS Provider</label>
                <select
                  value={settings.sms_provider}
                  onChange={(e) => handleChange("sms_provider", e.target.value)}
                  className="w-full px-3 py-2 bg-sand-100 border border-sand-300 rounded-lg text-xs text-navy-950"
                >
                  <option value="twilio">Twilio UK</option>
                  <option value="aws_sns">AWS SNS</option>
                  <option value="messagebird">MessageBird</option>
                  <option value="infobip">Infobip</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy-900 mb-1">Alphanumeric Sender ID</label>
                <input
                  type="text"
                  maxLength={11}
                  value={settings.sms_sender_id}
                  onChange={(e) => handleChange("sms_sender_id", e.target.value)}
                  placeholder="SANFURNITURE"
                  className="w-full px-3 py-2 bg-sand-100 border border-sand-300 rounded-lg text-xs font-mono font-bold text-navy-950 uppercase"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-navy-900 mb-1">Account SID / API Key</label>
                <input
                  type="text"
                  value={settings.sms_account_sid}
                  onChange={(e) => handleChange("sms_account_sid", e.target.value)}
                  className="w-full px-3 py-2 bg-sand-100 border border-sand-300 rounded-lg text-xs font-mono text-navy-950"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy-900 mb-1">Auth Token / Secret</label>
                <input
                  type="password"
                  value={settings.sms_auth_token}
                  onChange={(e) => handleChange("sms_auth_token", e.target.value)}
                  className="w-full px-3 py-2 bg-sand-100 border border-sand-300 rounded-lg text-xs font-mono text-navy-950"
                />
              </div>
            </div>

            {/* Notification Toggles */}
            <div className="pt-2 border-t border-sand-200 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer text-xs text-navy-900">
                <input
                  type="checkbox"
                  checked={settings.sms_dispatch_enabled === "true"}
                  onChange={(e) => handleChange("sms_dispatch_enabled", e.target.checked ? "true" : "false")}
                  className="w-4 h-4 rounded text-brass-500 focus:ring-0"
                />
                <span className="font-semibold">Auto-send SMS when 2-Man Carrier Manifest is Booked</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer text-xs text-navy-900">
                <input
                  type="checkbox"
                  checked={settings.sms_driver_alert_enabled === "true"}
                  onChange={(e) => handleChange("sms_driver_alert_enabled", e.target.checked ? "true" : "false")}
                  className="w-4 h-4 rounded text-brass-500 focus:ring-0"
                />
                <span className="font-semibold">Send driver 30-minute arrival callout SMS on day of delivery</span>
              </label>
            </div>
          </div>
        )}

        {/* TAB 5: LOGISTICS */}
        {activeTab === "logistics" && (
          <div className="p-6 bg-sand-50 border border-sand-300 rounded-2xl shadow-sm space-y-4">
            <h2 className="text-base font-bold text-navy-950 flex items-center gap-2">
              <Truck className="w-5 h-5 text-brass-600" />
              <span>UK Mainland Delivery &amp; Regional Surcharges</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-navy-900 mb-1">Free Delivery Threshold (Pennies)</label>
                <input
                  type="number"
                  value={settings.free_shipping_threshold_pennies}
                  onChange={(e) => handleChange("free_shipping_threshold_pennies", e.target.value)}
                  className="w-full px-3 py-2 bg-sand-100 border border-sand-300 rounded-lg text-xs font-mono text-navy-950"
                />
                <p className="text-[10px] text-navy-500 mt-1">50000 = £500.00 spend threshold</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy-900 mb-1">Standard Parcel Rate (Pennies)</label>
                <input
                  type="number"
                  value={settings.standard_delivery_fee_pennies}
                  onChange={(e) => handleChange("standard_delivery_fee_pennies", e.target.value)}
                  className="w-full px-3 py-2 bg-sand-100 border border-sand-300 rounded-lg text-xs font-mono text-navy-950"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy-900 mb-1">White Glove Room Fee (Pennies)</label>
                <input
                  type="number"
                  value={settings.white_glove_fee_pennies}
                  onChange={(e) => handleChange("white_glove_fee_pennies", e.target.value)}
                  className="w-full px-3 py-2 bg-sand-100 border border-sand-300 rounded-lg text-xs font-mono text-navy-950"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy-900 mb-1">Highlands Surcharge (Pennies)</label>
                <input
                  type="number"
                  value={settings.highlands_surcharge_pennies}
                  onChange={(e) => handleChange("highlands_surcharge_pennies", e.target.value)}
                  className="w-full px-3 py-2 bg-sand-100 border border-sand-300 rounded-lg text-xs font-mono text-navy-950"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: DROPSHIP */}
        {activeTab === "dropship" && (
          <div className="p-6 bg-sand-50 border border-sand-300 rounded-2xl shadow-sm space-y-4">
            <h2 className="text-base font-bold text-navy-950 flex items-center gap-2">
              <Zap className="w-5 h-5 text-brass-600" />
              <span>Dropship Wholesale EDI &amp; Floor Margins</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-navy-900 mb-1">Minimum Floor Margin (%)</label>
                <input
                  type="number"
                  value={settings.dropship_min_margin_percent}
                  onChange={(e) => handleChange("dropship_min_margin_percent", e.target.value)}
                  className="w-full px-3 py-2 bg-sand-100 border border-sand-300 rounded-lg text-xs font-bold text-navy-950"
                />
              </div>

              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-navy-900 font-semibold">
                  <input
                    type="checkbox"
                    checked={settings.dropship_auto_dispatch === "true"}
                    onChange={(e) => handleChange("dropship_auto_dispatch", e.target.checked ? "true" : "false")}
                    className="w-4 h-4 rounded text-brass-500 focus:ring-0"
                  />
                  <span>Automatically dispatch PO to UK suppliers on Stripe payment confirmation</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: PAYMENTS */}
        {activeTab === "payments" && (
          <div className="p-6 bg-sand-50 border border-sand-300 rounded-2xl shadow-sm space-y-4">
            <h2 className="text-base font-bold text-navy-950 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-brass-600" />
              <span>Payment Gateway Integrations</span>
            </h2>

            <div className="space-y-4">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-navy-900 font-semibold">
                <input
                  type="checkbox"
                  checked={settings.stripe_enabled === "true"}
                  onChange={(e) => handleChange("stripe_enabled", e.target.checked ? "true" : "false")}
                  className="w-4 h-4 rounded text-brass-500 focus:ring-0"
                />
                <span>Enable Stripe (UK Credit/Debit Cards, Apple Pay, Google Pay)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-navy-900 font-semibold">
                <input
                  type="checkbox"
                  checked={settings.klarna_enabled === "true"}
                  onChange={(e) => handleChange("klarna_enabled", e.target.checked ? "true" : "false")}
                  className="w-4 h-4 rounded text-brass-500 focus:ring-0"
                />
                <span>Enable Klarna Pay in 3 &amp; Financing</span>
              </label>

              <div>
                <label className="block text-xs font-semibold text-navy-900 mb-1">Klarna Merchant ID</label>
                <input
                  type="text"
                  value={settings.klarna_merchant_id}
                  onChange={(e) => handleChange("klarna_merchant_id", e.target.value)}
                  className="w-full px-3 py-2 bg-sand-100 border border-sand-300 rounded-lg text-xs font-mono text-navy-950"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 8: SECURITY */}
        {activeTab === "security" && (
          <div className="p-6 bg-sand-50 border border-sand-300 rounded-2xl shadow-sm space-y-4">
            <h2 className="text-base font-bold text-navy-950 flex items-center gap-2">
              <Lock className="w-5 h-5 text-brass-600" />
              <span>Security, Rate Limiting &amp; IP Jail Rules</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-navy-900 mb-1">Max Failed Attempts Before Lockout</label>
                <input
                  type="number"
                  value={settings.ip_jail_max_failures}
                  onChange={(e) => handleChange("ip_jail_max_failures", e.target.value)}
                  className="w-full px-3 py-2 bg-sand-100 border border-sand-300 rounded-lg text-xs font-mono text-navy-950"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy-900 mb-1">Lockout Duration (Minutes)</label>
                <input
                  type="number"
                  value={settings.ip_jail_duration_mins}
                  onChange={(e) => handleChange("ip_jail_duration_mins", e.target.value)}
                  className="w-full px-3 py-2 bg-sand-100 border border-sand-300 rounded-lg text-xs font-mono text-navy-950"
                />
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="pt-4 border-t border-sand-200 flex items-center justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-brass-500 to-brass-600 hover:from-brass-400 hover:to-brass-500 text-navy-950 font-bold text-xs tracking-wide shadow-md shadow-brass-500/20 transition-all disabled:opacity-50"
          >
            {saving ? "Saving Configuration..." : "Save Configuration to MySQL"}
          </button>
        </div>
      </form>

      {/* WordPress Media Picker Modal for Logos & Favicon */}
      <MediaPickerModal
        isOpen={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        onSelect={handleMediaSelect}
        title="Select Brand Asset from WordPress Media Library"
        buttonLabel="Use as Brand Asset"
      />
    </div>
  );
}
