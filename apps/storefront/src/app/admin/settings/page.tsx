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
  ExternalLink,
  FolderGit2,
  HardDrive,
  Copy,
  Check,
  Terminal,
  ArrowRight,
  Loader2,
  Link2
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

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [testingSms, setTestingSms] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Tabs
  const [activeTab, setActiveTab] = useState<
    "branding" | "legal" | "email" | "sms" | "logistics" | "dropship" | "payments" | "security" | "storage"
  >("branding");

  // Storage Symlink State
  const [storageStatus, setStorageStatus] = useState<any>(null);
  const [loadingStorage, setLoadingStorage] = useState(false);
  const [creatingStorageLink, setCreatingStorageLink] = useState(false);
  const [testingStorageLink, setTestingStorageLink] = useState(false);
  const [storageTestResult, setStorageTestResult] = useState<any>(null);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  // Media picker target
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [activeLogoTarget, setActiveLogoTarget] = useState<"light" | "dark" | "favicon">("light");

  const fetchStorageStatus = async () => {
    setLoadingStorage(true);
    try {
      const res = await fetch(apiUrl("/api/admin/system/storage-link"));
      const data = await res.json();
      setStorageStatus(data);
    } catch (err) {
      console.error("Storage status error:", err);
    } finally {
      setLoadingStorage(false);
    }
  };

  const handleCreateStorageLink = async () => {
    setCreatingStorageLink(true);
    setStorageTestResult(null);
    try {
      const res = await fetch(apiUrl("/api/admin/system/storage-link"), { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(data.message || "Storage symlink successfully created!");
        setTimeout(() => setSuccessMsg(null), 4000);
        await fetchStorageStatus();
      } else {
        setErrorMsg(data.error || "Failed to create storage symlink");
      }
    } catch (err: any) {
      setErrorMsg("Error: " + err.message);
    } finally {
      setCreatingStorageLink(false);
    }
  };

  const handleTestStorageLink = async () => {
    setTestingStorageLink(true);
    setStorageTestResult(null);
    try {
      const res = await fetch(apiUrl("/api/admin/system/storage-link/test"), { method: "POST" });
      const data = await res.json();
      setStorageTestResult(data);
      if (res.ok) {
        setSuccessMsg(data.message || "Self-test passed! Public HTTP access confirmed.");
        setTimeout(() => setSuccessMsg(null), 4000);
      } else {
        setErrorMsg(data.error || "Storage test failed");
      }
    } catch (err: any) {
      setErrorMsg("Test error: " + err.message);
    } finally {
      setTestingStorageLink(false);
    }
  };

  const handleCopyCommand = (cmd: string, key: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(key);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

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

  useEffect(() => {
    if (activeTab === "storage") {
      fetchStorageStatus();
    }
  }, [activeTab]);

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

        <button
          type="button"
          onClick={() => setActiveTab("storage")}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === "storage"
              ? "bg-navy-950 text-brass-400 shadow-sm"
              : "text-navy-700 hover:bg-sand-200"
          }`}
        >
          <FolderGit2 className="w-4 h-4 text-brass-400" />
          <span>Storage Symlink &amp; Shortcuts</span>
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

        {/* TAB 9: STORAGE SYMLINK & SHORTCUTS */}
        {activeTab === "storage" && (
          <div className="space-y-6">
            {/* Header Showcase Card */}
            <div className="bg-gradient-to-br from-navy-950 via-[#0B132B] to-[#1C2541] rounded-2xl p-6 sm:p-8 text-sand-50 shadow-xl border border-navy-800">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brass-500/20 text-brass-300 border border-brass-500/30 text-xs font-semibold uppercase tracking-wider mb-3">
                    <FolderGit2 className="w-3.5 h-3.5 text-brass-400" />
                    Storage &amp; Server Infrastructure
                  </div>
                  <h2 className="font-display text-2xl font-bold text-sand-50">
                    Storage Symlink &amp; Directory Shortcut Manager
                  </h2>
                  <p className="text-sand-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
                    Create and manage symbolic links to map persistent backend storage (<code className="text-brass-300 font-mono">storage/uploads</code>) to the public web root (<code className="text-brass-300 font-mono">apps/storefront/public/storage</code>). Essential for zero-downtime uploads, cPanel, Nginx, and cloud CDN hosting.
                  </p>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <div className={`px-4 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                    storageStatus?.isLinked
                      ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-lg shadow-emerald-950/40"
                      : "bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-lg shadow-amber-950/40"
                  }`}>
                    <span className={`w-2.5 h-2.5 rounded-full ${storageStatus?.isLinked ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
                    <span>{storageStatus?.isLinked ? "Symlink Operational (Active)" : "Symlink Not Linked"}</span>
                  </div>
                  <span className="text-[11px] text-sand-400 font-mono">
                    OS: {storageStatus?.platform === "win32" ? "Windows (NTFS Junction)" : "Linux / Unix (POSIX Symlink)"}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Metrics & Path Mapping */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 bg-sand-50 border border-sand-300 rounded-2xl shadow-sm space-y-2">
                <div className="flex items-center justify-between text-xs text-navy-600 font-medium">
                  <span>Source Storage Folder</span>
                  <HardDrive className="w-4 h-4 text-brass-600" />
                </div>
                <div className="text-xs font-mono font-bold text-navy-950 break-all bg-sand-100 p-2.5 rounded-lg border border-sand-200">
                  {storageStatus?.targetDir || "storage/uploads"}
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Target directory is writable</span>
                </div>
              </div>

              <div className="p-5 bg-sand-50 border border-sand-300 rounded-2xl shadow-sm space-y-2">
                <div className="flex items-center justify-between text-xs text-navy-600 font-medium">
                  <span>Public Symlink Shortcut</span>
                  <Link2 className="w-4 h-4 text-brass-600" />
                </div>
                <div className="text-xs font-mono font-bold text-navy-950 break-all bg-sand-100 p-2.5 rounded-lg border border-sand-200">
                  {storageStatus?.publicLink || "apps/storefront/public/storage"}
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-navy-700">
                  <Globe className="w-3.5 h-3.5 text-brass-600" />
                  <span>Web accessible via <code className="font-mono text-navy-950 font-bold">/storage/*</code></span>
                </div>
              </div>

              <div className="p-5 bg-sand-50 border border-sand-300 rounded-2xl shadow-sm space-y-2">
                <div className="flex items-center justify-between text-xs text-navy-600 font-medium">
                  <span>Storage Stats</span>
                  <RefreshCw className="w-4 h-4 text-brass-600" />
                </div>
                <div className="grid grid-cols-2 gap-2 text-center pt-1">
                  <div className="bg-sand-100 p-2 rounded-lg border border-sand-200">
                    <span className="text-[10px] uppercase tracking-wider text-navy-500 font-bold block">Total Files</span>
                    <span className="text-sm font-bold text-navy-950 font-mono">{storageStatus?.fileCount ?? 0}</span>
                  </div>
                  <div className="bg-sand-100 p-2 rounded-lg border border-sand-200">
                    <span className="text-[10px] uppercase tracking-wider text-navy-500 font-bold block">Disk Usage</span>
                    <span className="text-sm font-bold text-navy-950 font-mono">
                      {((storageStatus?.totalSizeBytes || 0) / 1024).toFixed(1)} KB
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons & Self-Test */}
            <div className="p-6 bg-sand-50 border border-sand-300 rounded-2xl shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-navy-950 flex items-center gap-2">
                <Zap className="w-4 h-4 text-brass-600" />
                <span>1-Click Symlink Automation</span>
              </h3>
              <p className="text-xs text-navy-600">
                Execute automated creation, validation, or repair of the storage shortcut directory directly on the host server.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  disabled={creatingStorageLink}
                  onClick={handleCreateStorageLink}
                  className="px-5 py-2.5 rounded-xl bg-navy-950 hover:bg-navy-900 text-sand-50 font-bold text-xs flex items-center gap-2 shadow-md transition-all disabled:opacity-50"
                >
                  {creatingStorageLink ? (
                    <Loader2 className="w-4 h-4 animate-spin text-brass-400" />
                  ) : (
                    <FolderGit2 className="w-4 h-4 text-brass-400" />
                  )}
                  <span>{storageStatus?.isLinked ? "Repair / Re-link Storage Symlink" : "Generate Storage Symlink"}</span>
                </button>

                <button
                  type="button"
                  disabled={testingStorageLink}
                  onClick={handleTestStorageLink}
                  className="px-5 py-2.5 rounded-xl bg-brass-500 hover:bg-brass-400 text-navy-950 font-bold text-xs flex items-center gap-2 shadow-md transition-all disabled:opacity-50"
                >
                  {testingStorageLink ? (
                    <Loader2 className="w-4 h-4 animate-spin text-navy-950" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-navy-950" />
                  )}
                  <span>Run Read/Write Self-Test</span>
                </button>

                <button
                  type="button"
                  disabled={loadingStorage}
                  onClick={fetchStorageStatus}
                  className="px-4 py-2.5 rounded-xl bg-sand-200 hover:bg-sand-300 text-navy-900 font-bold text-xs flex items-center gap-1.5 transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingStorage ? "animate-spin" : ""}`} />
                  <span>Refresh Status</span>
                </button>
              </div>

              {storageTestResult && (
                <div className={`p-4 rounded-xl border text-xs flex items-start gap-3 mt-4 ${
                  storageTestResult.verified
                    ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                    : "bg-red-50 border-red-200 text-red-900"
                }`}>
                  {storageTestResult.verified ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="font-bold">{storageTestResult.message || (storageTestResult.verified ? "Storage link verified successfully" : "Verification failed")}</p>
                    <p className="text-[11px] mt-0.5 opacity-90">
                      {storageTestResult.verified
                        ? "Test file was written to storage/uploads and successfully read through apps/storefront/public/storage."
                        : storageTestResult.error}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Manual Server & cPanel Commands Card */}
            <div className="p-6 bg-sand-50 border border-sand-300 rounded-2xl shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-navy-950 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-brass-600" />
                  <span>Terminal &amp; cPanel Deployment Commands</span>
                </h3>
                <span className="text-[10px] font-semibold text-sand-500 uppercase tracking-wider">
                  Copy &amp; Paste Ready
                </span>
              </div>
              <p className="text-xs text-navy-600 leading-relaxed">
                If deploying on cPanel, Linux VPS, or Apache/Nginx, you can also create the storage shortcut via SSH terminal, cron job, or Windows Command Prompt.
              </p>

              <div className="space-y-3 pt-2">
                {/* Linux / cPanel */}
                <div className="bg-[#070D1E] rounded-xl p-4 border border-navy-800 text-sand-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-sand-300 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      Linux / cPanel / Ubuntu SSH Terminal:
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyCommand(storageStatus?.commands?.linux || "ln -s $(pwd)/storage/uploads $(pwd)/apps/storefront/public/storage", "linux")}
                      className="px-2.5 py-1 rounded bg-navy-800 hover:bg-navy-700 text-[11px] font-semibold text-sand-200 flex items-center gap-1 transition-colors"
                    >
                      {copiedCmd === "linux" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedCmd === "linux" ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                  <pre className="text-xs font-mono text-sand-200 overflow-x-auto whitespace-pre-wrap select-all">
                    {storageStatus?.commands?.linux || "ln -s $(pwd)/storage/uploads $(pwd)/apps/storefront/public/storage"}
                  </pre>
                </div>

                {/* Windows CMD */}
                <div className="bg-[#070D1E] rounded-xl p-4 border border-navy-800 text-sand-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-sand-300 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-400" />
                      Windows Command Prompt (XAMPP / Local):
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyCommand(storageStatus?.commands?.windows_cmd || `mklink /D "apps\\storefront\\public\\storage" "storage\\uploads"`, "win")}
                      className="px-2.5 py-1 rounded bg-navy-800 hover:bg-navy-700 text-[11px] font-semibold text-sand-200 flex items-center gap-1 transition-colors"
                    >
                      {copiedCmd === "win" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedCmd === "win" ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                  <pre className="text-xs font-mono text-sand-200 overflow-x-auto whitespace-pre-wrap select-all">
                    {storageStatus?.commands?.windows_cmd || `mklink /D "apps\\storefront\\public\\storage" "storage\\uploads"`}
                  </pre>
                </div>

                {/* Laravel Artisan Style */}
                <div className="bg-[#070D1E] rounded-xl p-4 border border-navy-800 text-sand-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-sand-300 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-400" />
                      Laravel / Fullstack Equivalent:
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyCommand("php artisan storage:link", "artisan")}
                      className="px-2.5 py-1 rounded bg-navy-800 hover:bg-navy-700 text-[11px] font-semibold text-sand-200 flex items-center gap-1 transition-colors"
                    >
                      {copiedCmd === "artisan" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedCmd === "artisan" ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                  <pre className="text-xs font-mono text-sand-200 overflow-x-auto whitespace-pre-wrap select-all">
                    php artisan storage:link
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Save Button (for settings tabs) */}
        {activeTab !== "storage" && (
          <div className="pt-4 border-t border-sand-200 flex items-center justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-brass-500 to-brass-600 hover:from-brass-400 hover:to-brass-500 text-navy-950 font-bold text-xs tracking-wide shadow-md shadow-brass-500/20 transition-all disabled:opacity-50"
            >
              {saving ? "Saving Configuration..." : "Save Configuration to MySQL"}
            </button>
          </div>
        )}
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
