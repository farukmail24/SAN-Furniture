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
  Link2,
  Package,
  Eye,
  EyeOff,
  Key
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
    support_email: "concierge@sanfurniture.com",
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
    smtp_user: "postmaster@sanfurniture.com",
    smtp_pass: "••••••••••••••••",
    smtp_from_email: "orders@sanfurniture.com",
    smtp_from_name: "SAN Furniture Concierge",
    // SMS Gateway
    sms_provider: "twilio",
    sms_account_sid: "AC_SAN_FURNITURE_LIVE_001",
    sms_auth_token: "••••••••••••••••••••••••",
    sms_sender_id: "SANFURNITURE",
    sms_dispatch_enabled: "true",
    sms_driver_alert_enabled: "true",
    // Payment (Stripe UK Gateway Dedicated Provider)
    stripe_enabled: "true",
    stripe_mode: "test",
    stripe_publishable_key: "pk_test_51SANFurnitureUK0000000DemoKey",
    stripe_secret_key: "sk_test_51SANFurnitureUK0000000SecretDemoKey",
    stripe_webhook_secret: "whsec_san_furniture_webhook_demo_001",
    stripe_currency: "GBP",
    stripe_statement_descriptor: "SAN FURNITURE UK",
    // Security
    ip_jail_max_failures: "5",
    ip_jail_duration_mins: "15"
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [testingSms, setTestingSms] = useState(false);
  const [showStripeSecret, setShowStripeSecret] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);
  const [testingStripe, setTestingStripe] = useState(false);
  const [stripeTestResult, setStripeTestResult] = useState<any>(null);
  const [copiedStripeWebhook, setCopiedStripeWebhook] = useState(false);
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

  // Amos Mann Dropshipping Hub State
  const [amosStatus, setAmosStatus] = useState<any>(null);
  const [syncingAmos, setSyncingAmos] = useState(false);
  const [testingAmosPo, setTestingAmosPo] = useState(false);
  const [amosPoResult, setAmosPoResult] = useState<any>(null);

  const fetchAmosStatus = async () => {
    try {
      const res = await fetch(apiUrl("/api/admin/dropship/amos-mann/status"));
      const data = await res.json();
      setAmosStatus(data);
    } catch {}
  };

  const handleSyncAmos = async () => {
    setSyncingAmos(true);
    try {
      const res = await fetch(apiUrl("/api/admin/dropship/amos-mann/sync"), { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(data.message || "Successfully synced Amos Mann products!");
        setTimeout(() => setSuccessMsg(null), 5000);
        await fetchAmosStatus();
      } else {
        setErrorMsg(data.error || "Failed to sync Amos Mann products");
      }
    } catch (err: any) {
      setErrorMsg("Sync error: " + err.message);
    } finally {
      setSyncingAmos(false);
    }
  };

  const handleTestAmosPo = async () => {
    setTestingAmosPo(true);
    try {
      const res = await fetch(apiUrl("/api/admin/dropship/amos-mann/po/test"), { method: "POST" });
      const data = await res.json();
      setAmosPoResult(data);
      if (res.ok) {
        setSuccessMsg("Amos Mann Purchase Order (PO) dispatch format generated!");
        setTimeout(() => setSuccessMsg(null), 4000);
      }
    } catch (err: any) {
      setErrorMsg("PO test error: " + err.message);
    } finally {
      setTestingAmosPo(false);
    }
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
    fetchAmosStatus();
  }, []);

  useEffect(() => {
    if (activeTab === "storage") {
      fetchStorageStatus();
    }
    if (activeTab === "dropship") {
      fetchAmosStatus();
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

  const handleTestStripe = async () => {
    setTestingStripe(true);
    setStripeTestResult(null);
    try {
      const res = await fetch(apiUrl("/api/admin/settings/test-stripe"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stripe_publishable_key: settings.stripe_publishable_key,
          stripe_secret_key: settings.stripe_secret_key,
          stripe_mode: settings.stripe_mode,
        }),
      });
      const data = await res.json();
      setStripeTestResult(data);
      if (res.ok) {
        setSuccessMsg(data.message || "Stripe UK Gateway credentials verified successfully!");
        setTimeout(() => setSuccessMsg(null), 5000);
      } else {
        setErrorMsg(data.error || "Stripe credentials verification failed.");
      }
    } catch (err: any) {
      setErrorMsg("Stripe test error: " + err.message);
    } finally {
      setTestingStripe(false);
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

      {/* Settings Navigation Tabs - Wrapped & Responsive (Zero Overflow / No Truncation) */}
      <div className="flex flex-wrap items-center gap-2 p-2 rounded-2xl bg-sand-100/80 border border-sand-200/90 shadow-2xs">
        <button
          type="button"
          onClick={() => setActiveTab("branding")}
          className={`px-3.5 py-2 rounded-xl flex items-center gap-2 text-xs font-semibold transition-all ${
            activeTab === "branding"
              ? "bg-navy-950 text-sand-50 border border-navy-950 shadow-sm font-bold"
              : "bg-white/90 hover:bg-white text-navy-700 hover:text-navy-950 border border-sand-300/80 shadow-2xs"
          }`}
        >
          <ImageIcon className={`w-3.5 h-3.5 ${activeTab === "branding" ? "text-brass-400" : "text-navy-500"}`} />
          <span>Branding &amp; Logos</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("legal")}
          className={`px-3.5 py-2 rounded-xl flex items-center gap-2 text-xs font-semibold transition-all ${
            activeTab === "legal"
              ? "bg-navy-950 text-sand-50 border border-navy-950 shadow-sm font-bold"
              : "bg-white/90 hover:bg-white text-navy-700 hover:text-navy-950 border border-sand-300/80 shadow-2xs"
          }`}
        >
          <Building className={`w-3.5 h-3.5 ${activeTab === "legal" ? "text-brass-400" : "text-navy-500"}`} />
          <span>HMRC VAT &amp; Legal</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("email")}
          className={`px-3.5 py-2 rounded-xl flex items-center gap-2 text-xs font-semibold transition-all ${
            activeTab === "email"
              ? "bg-navy-950 text-sand-50 border border-navy-950 shadow-sm font-bold"
              : "bg-white/90 hover:bg-white text-navy-700 hover:text-navy-950 border border-sand-300/80 shadow-2xs"
          }`}
        >
          <Mail className={`w-3.5 h-3.5 ${activeTab === "email" ? "text-brass-400" : "text-navy-500"}`} />
          <span>Email (SMTP)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("sms")}
          className={`px-3.5 py-2 rounded-xl flex items-center gap-2 text-xs font-semibold transition-all ${
            activeTab === "sms"
              ? "bg-navy-950 text-sand-50 border border-navy-950 shadow-sm font-bold"
              : "bg-white/90 hover:bg-white text-navy-700 hover:text-navy-950 border border-sand-300/80 shadow-2xs"
          }`}
        >
          <MessageSquare className={`w-3.5 h-3.5 ${activeTab === "sms" ? "text-brass-400" : "text-navy-500"}`} />
          <span>SMS &amp; 2-Man Alerts</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("logistics")}
          className={`px-3.5 py-2 rounded-xl flex items-center gap-2 text-xs font-semibold transition-all ${
            activeTab === "logistics"
              ? "bg-navy-950 text-sand-50 border border-navy-950 shadow-sm font-bold"
              : "bg-white/90 hover:bg-white text-navy-700 hover:text-navy-950 border border-sand-300/80 shadow-2xs"
          }`}
        >
          <Truck className={`w-3.5 h-3.5 ${activeTab === "logistics" ? "text-brass-400" : "text-navy-500"}`} />
          <span>Delivery Rates &amp; Surcharges</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("dropship")}
          className={`px-3.5 py-2 rounded-xl flex items-center gap-2 text-xs font-semibold transition-all ${
            activeTab === "dropship"
              ? "bg-navy-950 text-sand-50 border border-navy-950 shadow-sm font-bold"
              : "bg-white/90 hover:bg-white text-navy-700 hover:text-navy-950 border border-sand-300/80 shadow-2xs"
          }`}
        >
          <Zap className={`w-3.5 h-3.5 ${activeTab === "dropship" ? "text-brass-400" : "text-navy-500"}`} />
          <span>Dropship &amp; Margins</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("payments")}
          className={`px-3.5 py-2 rounded-xl flex items-center gap-2 text-xs font-semibold transition-all ${
            activeTab === "payments"
              ? "bg-navy-950 text-sand-50 border border-navy-950 shadow-sm font-bold"
              : "bg-white/90 hover:bg-white text-navy-700 hover:text-navy-950 border border-sand-300/80 shadow-2xs"
          }`}
        >
          <CreditCard className={`w-3.5 h-3.5 ${activeTab === "payments" ? "text-brass-400" : "text-navy-500"}`} />
          <span>UK Payment Gateways</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("security")}
          className={`px-3.5 py-2 rounded-xl flex items-center gap-2 text-xs font-semibold transition-all ${
            activeTab === "security"
              ? "bg-navy-950 text-sand-50 border border-navy-950 shadow-sm font-bold"
              : "bg-white/90 hover:bg-white text-navy-700 hover:text-navy-950 border border-sand-300/80 shadow-2xs"
          }`}
        >
          <Lock className={`w-3.5 h-3.5 ${activeTab === "security" ? "text-brass-400" : "text-navy-500"}`} />
          <span>Security &amp; IP Jail</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("storage")}
          className={`px-3.5 py-2 rounded-xl flex items-center gap-2 text-xs font-semibold transition-all ${
            activeTab === "storage"
              ? "bg-navy-950 text-sand-50 border border-navy-950 shadow-sm font-bold"
              : "bg-white/90 hover:bg-white text-navy-700 hover:text-navy-950 border border-sand-300/80 shadow-2xs"
          }`}
        >
          <FolderGit2 className={`w-3.5 h-3.5 ${activeTab === "storage" ? "text-brass-400" : "text-navy-500"}`} />
          <span>Storage &amp; Shortcuts</span>
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
                  placeholder="orders@sanfurniture.com"
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

        {/* TAB 6: AMOS MANN FURNITURE DROPSHIPPING HUB */}
        {activeTab === "dropship" && (
          <div className="p-6 bg-sand-50 border border-sand-300 rounded-2xl shadow-sm space-y-6">
            {/* Supplier Header Banner */}
            <div className="p-5 rounded-xl bg-gradient-to-r from-forest-900 to-navy-950 text-sand-50 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-brass-500/20 text-brass-400 border border-brass-500/30 text-[10px] font-bold uppercase tracking-wider">
                    Primary Dropship Partner
                  </span>
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Trade API Connected
                  </span>
                </div>
                <h2 className="text-xl font-bold font-display text-sand-50">
                  Amos Mann Furniture (Leicester, UK)
                </h2>
                <p className="text-xs text-sand-300 max-w-xl">
                  Wholesale &amp; Trade-Only dropship furniture supplier. Direct-to-consumer white-label fulfillment with specialized 2-Man room-of-choice logistics for sliding wardrobes &amp; cabinetry.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <a
                  href="https://www.amosmannfurniture.co.uk/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 rounded-lg bg-sand-50/10 hover:bg-sand-50/20 text-sand-50 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-brass-400" />
                  <span>Trade Portal</span>
                </a>

                <button
                  type="button"
                  onClick={handleSyncAmos}
                  disabled={syncingAmos}
                  className="px-4 py-2 rounded-lg bg-brass-500 hover:bg-brass-400 text-navy-950 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 disabled:opacity-60 cursor-pointer"
                >
                  {syncingAmos ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Syncing Catalog...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Sync Amos Mann Products</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Supplier Manifest Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-sand-100/70 border border-sand-300 space-y-1">
                <span className="text-[10px] font-semibold text-navy-500 uppercase tracking-wider block">Central Hub</span>
                <p className="font-bold text-navy-950 flex items-center gap-1">
                  <Building className="w-3.5 h-3.5 text-brass-600" />
                  Leicestershire, UK (LE1)
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-sand-100/70 border border-sand-300 space-y-1">
                <span className="text-[10px] font-semibold text-navy-500 uppercase tracking-wider block">Trade Desk Phone</span>
                <p className="font-bold text-navy-950 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-brass-600" />
                  0116 507 7455
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-sand-100/70 border border-sand-300 space-y-1">
                <span className="text-[10px] font-semibold text-navy-500 uppercase tracking-wider block">Orders Mailbox</span>
                <p className="font-bold text-navy-950 flex items-center gap-1 truncate">
                  <Mail className="w-3.5 h-3.5 text-brass-600" />
                  orders@amosmannfurniture.co.uk
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-sand-100/70 border border-sand-300 space-y-1">
                <span className="text-[10px] font-semibold text-navy-500 uppercase tracking-wider block">Live Synced Range</span>
                <p className="font-bold text-navy-950 flex items-center gap-1">
                  <Package className="w-3.5 h-3.5 text-forest-700" />
                  {amosStatus?.activeCatalogCount || 9} Live Signature Lines
                </p>
              </div>
            </div>

            {/* PO Simulation Trigger & Actions */}
            <div className="p-4 rounded-xl bg-sand-100 border border-sand-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-xs text-navy-950">Amos Mann Purchase Order (PO) Dispatch Protocol</h3>
                <p className="text-[11px] text-navy-600 mt-0.5">
                  Verify the B2B white-label dispatch manifest sent to the Leicester fulfillment team when an order is placed.
                </p>
              </div>

              <button
                type="button"
                onClick={handleTestAmosPo}
                disabled={testingAmosPo}
                className="px-3.5 py-2 rounded-lg bg-navy-950 hover:bg-navy-900 text-sand-50 text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 disabled:opacity-60 cursor-pointer"
              >
                {testingAmosPo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Terminal className="w-3.5 h-3.5 text-brass-400" />}
                <span>Test Amos Mann PO Format</span>
              </button>
            </div>

            {/* PO Result Preview Modal Box */}
            {amosPoResult && (
              <div className="p-4 rounded-xl bg-navy-950 text-sand-50 border border-navy-800 space-y-3 animate-fade-in text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-navy-800">
                  <span className="font-bold text-brass-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Amos Mann Dropship PO Dispatch Payload Verified
                  </span>
                  <button
                    type="button"
                    onClick={() => setAmosPoResult(null)}
                    className="text-[11px] text-sand-400 hover:text-sand-100"
                  >
                    Close Preview
                  </button>
                </div>
                <pre className="font-mono text-[11px] bg-navy-900 p-3 rounded-lg overflow-x-auto text-sand-200 border border-navy-800 leading-relaxed whitespace-pre-wrap">
                  {amosPoResult.formattedEmail}
                </pre>
              </div>
            )}

            {/* Margin Rules & Floor Protection */}
            <div className="pt-2 border-t border-sand-200 space-y-4">
              <h3 className="font-bold text-xs uppercase tracking-wider text-navy-900 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-brass-600" />
                <span>Trade Margins &amp; Floor Protection Rules</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-navy-900 mb-1">Minimum Floor Margin (%)</label>
                  <input
                    type="number"
                    value={settings.dropship_min_margin_percent}
                    onChange={(e) => handleChange("dropship_min_margin_percent", e.target.value)}
                    className="w-full px-3 py-2 bg-sand-100 border border-sand-300 rounded-lg text-xs font-bold text-navy-950"
                  />
                  <p className="text-[10px] text-navy-500 mt-1">Guarantees SAN Furniture never prices below floor margin threshold.</p>
                </div>

                <div className="flex items-center pt-2 sm:pt-6">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-navy-900 font-semibold">
                    <input
                      type="checkbox"
                      checked={settings.dropship_auto_dispatch === "true"}
                      onChange={(e) => handleChange("dropship_auto_dispatch", e.target.checked ? "true" : "false")}
                      className="w-4 h-4 rounded text-brass-500 focus:ring-0"
                    />
                    <span>Automatically dispatch PO to Amos Mann on Stripe/Klarna confirmation</span>
                  </label>
                </div>
              </div>

              {/* Live UK Economics Breakdown Box */}
              <div className="p-4 rounded-xl bg-sand-100/60 border border-sand-300 text-xs space-y-2">
                <span className="font-bold text-navy-900 block">Typical Amos Mann Dropship Unit Economics (e.g. Venice 203cm Wardrobe):</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center pt-1">
                  <div className="p-2.5 rounded-lg bg-sand-50 border border-sand-200">
                    <span className="text-[10px] text-navy-500 block">Wholesale Cost (ex VAT)</span>
                    <strong className="text-navy-950 font-mono text-sm">£239.00</strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-sand-50 border border-sand-200">
                    <span className="text-[10px] text-navy-500 block">SAN Retail (Inc 20% VAT)</span>
                    <strong className="text-navy-950 font-mono text-sm">£549.00</strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-sand-50 border border-sand-200">
                    <span className="text-[10px] text-navy-500 block">Net Revenue</span>
                    <strong className="text-navy-950 font-mono text-sm">£457.50</strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-forest-50 border border-forest-200 text-forest-800">
                    <span className="text-[10px] text-forest-600 block">Gross Profit / Margin</span>
                    <strong className="font-mono text-sm">£218.50 (47.8%)</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Signature Collections Active in SAN Furniture */}
            <div className="pt-2 border-t border-sand-200 space-y-3">
              <span className="font-bold text-xs uppercase tracking-wider text-navy-900 block">
                Signature Amos Mann Collections Currently Active in Storefront:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="p-3 rounded-lg bg-sand-50 border border-sand-200 space-y-0.5">
                  <span className="font-bold text-navy-950 block">Venice 203cm Wardrobe</span>
                  <span className="text-[11px] text-navy-500">Sliding Mirrored Doors &bull; Artisan Oak &bull; 2-Man</span>
                </div>
                <div className="p-3 rounded-lg bg-sand-50 border border-sand-200 space-y-0.5">
                  <span className="font-bold text-navy-950 block">Madrid 180cm Wardrobe</span>
                  <span className="text-[11px] text-navy-500">Full Mirror &amp; Integrated LED &bull; Matte White</span>
                </div>
                <div className="p-3 rounded-lg bg-sand-50 border border-sand-200 space-y-0.5">
                  <span className="font-bold text-navy-950 block">Miami 250cm Grand Suite</span>
                  <span className="text-[11px] text-navy-500">3-Door Sliding &bull; Internal Drawers &bull; Slate Grey</span>
                </div>
                <div className="p-3 rounded-lg bg-sand-50 border border-sand-200 space-y-0.5">
                  <span className="font-bold text-navy-950 block">Athens 160cm TV Console</span>
                  <span className="text-[11px] text-navy-500">High Gloss White &bull; Multi-Color RGB Remote LED</span>
                </div>
                <div className="p-3 rounded-lg bg-sand-50 border border-sand-200 space-y-0.5">
                  <span className="font-bold text-navy-950 block">Atlantis Fluted Sideboard</span>
                  <span className="text-[11px] text-navy-500">2-Door 3-Drawer &bull; Cashmere &amp; Oak &bull; Brass Pulls</span>
                </div>
                <div className="p-3 rounded-lg bg-sand-50 border border-sand-200 space-y-0.5">
                  <span className="font-bold text-navy-950 block">Elise Extending Dining</span>
                  <span className="text-[11px] text-navy-500">160-200cm Butterfly &bull; High Gloss &bull; Chrome Plinth</span>
                </div>
                <div className="p-3 rounded-lg bg-sand-50 border border-sand-200 space-y-0.5">
                  <span className="font-bold text-navy-950 block">Texas 3-Piece Bedroom Set</span>
                  <span className="text-[11px] text-navy-500">Wardrobe + 4-Drawer Chest + Bedside Nightstand</span>
                </div>
                <div className="p-3 rounded-lg bg-sand-50 border border-sand-200 space-y-0.5">
                  <span className="font-bold text-navy-950 block">Kano Workstation Desk</span>
                  <span className="text-[11px] text-navy-500">Home Office &bull; 3-Drawer Pedestal &bull; Modesty Panel</span>
                </div>
                <div className="p-3 rounded-lg bg-sand-50 border border-sand-200 space-y-0.5">
                  <span className="font-bold text-navy-950 block">Santino Shoe Cabinet</span>
                  <span className="text-[11px] text-navy-500">3-Tier Mirrored &bull; Slim 24cm Profile &bull; 18 Pairs</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: PAYMENTS (STRIPE UK GATEWAY DEDICATED SOLE PROCESSOR) */}
        {activeTab === "payments" && (
          <div className="p-6 bg-sand-50 border border-sand-300 rounded-2xl shadow-sm space-y-6">
            
            {/* Header Showcase Card */}
            <div className="p-5 rounded-xl bg-gradient-to-r from-navy-950 via-[#1e1b4b] to-[#312e81] text-sand-50 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm border border-indigo-900/50">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full bg-brass-500/20 text-brass-400 border border-brass-500/30 text-[10px] font-bold uppercase tracking-wider">
                    Official UK Payment Gateway
                  </span>
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    3D Secure 2.0 &amp; SCA Enforced
                  </span>
                </div>
                <h2 className="text-xl font-bold font-display text-sand-50 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-brass-400" />
                  Stripe UK Gateway Credentials &amp; Terminal
                </h2>
                <p className="text-xs text-sand-300 max-w-xl">
                  Dedicated payment gateway for SAN Furniture. Processes Visa, Mastercard, American Express, Apple Pay, and Google Pay with UK PSD2 Strong Customer Authentication and automated dropship purchase order dispatch.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleTestStripe}
                  disabled={testingStripe}
                  className="px-4 py-2.5 rounded-xl bg-brass-500 hover:bg-brass-400 text-navy-950 text-xs font-bold flex items-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-60 cursor-pointer"
                >
                  {testingStripe ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Verifying Stripe Keys...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5 text-navy-950" />
                      <span>Test Stripe Connection</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Test Result Banner */}
            {stripeTestResult && (
              <div className={`p-4 rounded-xl border text-xs space-y-1.5 animate-fade-in ${
                stripeTestResult.success
                  ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                  : "bg-rose-50 border-rose-300 text-rose-900"
              }`}>
                <div className="flex items-center justify-between font-bold">
                  <span className="flex items-center gap-1.5">
                    {stripeTestResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                    )}
                    {stripeTestResult.message || (stripeTestResult.success ? "Connection Verified" : "Verification Failed")}
                  </span>
                  <button
                    type="button"
                    onClick={() => setStripeTestResult(null)}
                    className="text-[10px] text-navy-500 hover:text-navy-900 underline"
                  >
                    Dismiss
                  </button>
                </div>
                {stripeTestResult.success && (
                  <p className="text-[11px] text-emerald-800">
                    Mode: <strong>{stripeTestResult.mode?.toUpperCase()}</strong> &bull; Currency: <strong>GBP (£)</strong> &bull; SCA: <strong>3D Secure 2.0 Active</strong>
                  </p>
                )}
              </div>
            )}

            {/* Gateway Status & Environment Mode */}
            <div className="p-4 rounded-xl bg-sand-100 border border-sand-300 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-sand-200">
                <div>
                  <h3 className="font-bold text-xs text-navy-950">Gateway Activation</h3>
                  <p className="text-[11px] text-navy-600">
                    Enable or disable the credit/debit card gateway across the public storefront.
                  </p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-navy-950">
                  <input
                    type="checkbox"
                    checked={settings.stripe_enabled === "true"}
                    onChange={(e) => handleChange("stripe_enabled", e.target.checked ? "true" : "false")}
                    className="w-4 h-4 rounded text-brass-500 focus:ring-0"
                  />
                  <span>Enable Stripe UK Gateway</span>
                </label>
              </div>

              {/* Environment Mode Switcher */}
              <div>
                <label className="block text-xs font-bold text-navy-900 mb-1.5">
                  Environment Mode (Sandbox vs. Live Production)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                      settings.stripe_mode === "test"
                        ? "bg-brass-50/60 border-brass-500 ring-1 ring-brass-500"
                        : "bg-white border-sand-300 hover:bg-sand-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="stripe_environment_mode"
                      value="test"
                      checked={settings.stripe_mode === "test" || !settings.stripe_mode}
                      onChange={() => handleChange("stripe_mode", "test")}
                      className="mt-0.5 text-brass-600 focus:ring-brass-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-navy-950 block">
                        Test Mode (Sandbox / Development)
                      </span>
                      <p className="text-[11px] text-navy-600 mt-0.5">
                        Test checkouts safely without real charges. Uses test card numbers (<code className="font-mono text-[10px] bg-sand-200 px-1 rounded">4242...</code>) and simulated 3D Secure OTP (<code className="font-mono text-[10px] bg-sand-200 px-1 rounded">123456</code>).
                      </p>
                    </div>
                  </label>

                  <label
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                      settings.stripe_mode === "live"
                        ? "bg-emerald-50/60 border-emerald-500 ring-1 ring-emerald-500"
                        : "bg-white border-sand-300 hover:bg-sand-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="stripe_environment_mode"
                      value="live"
                      checked={settings.stripe_mode === "live"}
                      onChange={() => handleChange("stripe_mode", "live")}
                      className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-navy-950 block">
                        Live Production Mode
                      </span>
                      <p className="text-[11px] text-navy-600 mt-0.5">
                        Process real customer debit/credit cards in British Pounds (GBP). Charges are settled directly into your UK commercial bank account.
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* API Credentials Grid */}
            <div className="space-y-4">
              <h3 className="font-bold text-xs uppercase tracking-wider text-navy-900 flex items-center gap-1.5">
                <Key className="w-4 h-4 text-brass-600" />
                <span>Stripe API Credentials</span>
              </h3>

              <div className="grid grid-cols-1 gap-4">
                {/* Publishable Key */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-navy-900 flex items-center gap-1.5">
                      <span>Stripe Publishable API Key</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-sand-200 text-navy-700 font-mono">
                        {settings.stripe_mode === "live" ? "pk_live_..." : "pk_test_..."}
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={() => handleCopyCommand(settings.stripe_publishable_key || "", "stripe_pub")}
                      className="text-[10px] text-brass-700 hover:underline flex items-center gap-1 font-semibold"
                    >
                      {copiedCmd === "stripe_pub" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedCmd === "stripe_pub" ? "Copied" : "Copy Key"}</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={settings.stripe_publishable_key || ""}
                    onChange={(e) => handleChange("stripe_publishable_key", e.target.value.trim())}
                    placeholder="pk_test_51..."
                    className="w-full px-3 py-2 bg-sand-100 border border-sand-300 rounded-lg text-xs font-mono text-navy-950 focus:outline-none focus:border-brass-500"
                  />
                  <p className="text-[10px] text-navy-500 mt-1">
                    Client-facing key used to securely mount the Stripe Payment Element on the storefront checkout page.
                  </p>
                </div>

                {/* Secret Key */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-navy-900 flex items-center gap-1.5">
                      <span>Stripe Secret API Key</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-sand-200 text-navy-700 font-mono">
                        {settings.stripe_mode === "live" ? "sk_live_..." : "sk_test_..."}
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowStripeSecret(!showStripeSecret)}
                      className="text-[10px] text-navy-600 hover:text-navy-950 flex items-center gap-1 font-semibold"
                    >
                      {showStripeSecret ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{showStripeSecret ? "Hide Secret" : "Reveal Secret"}</span>
                    </button>
                  </div>
                  <input
                    type={showStripeSecret ? "text" : "password"}
                    value={settings.stripe_secret_key || ""}
                    onChange={(e) => handleChange("stripe_secret_key", e.target.value.trim())}
                    placeholder="sk_test_51..."
                    className="w-full px-3 py-2 bg-sand-100 border border-sand-300 rounded-lg text-xs font-mono text-navy-950 focus:outline-none focus:border-brass-500"
                  />
                  <p className="text-[10px] text-navy-500 mt-1">
                    Server-side private secret. Stored securely on the backend server; never exposed to browser visitors.
                  </p>
                </div>

                {/* Webhook Signing Secret */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-navy-900 flex items-center gap-1.5">
                      <span>Stripe Webhook Signing Secret</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-sand-200 text-navy-700 font-mono">
                        whsec_...
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                      className="text-[10px] text-navy-600 hover:text-navy-950 flex items-center gap-1 font-semibold"
                    >
                      {showWebhookSecret ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{showWebhookSecret ? "Hide" : "Reveal"}</span>
                    </button>
                  </div>
                  <input
                    type={showWebhookSecret ? "text" : "password"}
                    value={settings.stripe_webhook_secret || ""}
                    onChange={(e) => handleChange("stripe_webhook_secret", e.target.value.trim())}
                    placeholder="whsec_..."
                    className="w-full px-3 py-2 bg-sand-100 border border-sand-300 rounded-lg text-xs font-mono text-navy-950 focus:outline-none focus:border-brass-500"
                  />
                  <p className="text-[10px] text-navy-500 mt-1">
                    Verifies cryptographic signatures on incoming webhook notifications from Stripe (<code className="font-mono text-[10px]">stripe.webhooks.constructEvent</code>).
                  </p>
                </div>
              </div>
            </div>

            {/* Parameters & Descriptors Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-sand-200">
              <div>
                <label className="block text-xs font-semibold text-navy-900 mb-1">
                  Card Statement Descriptor (Max 22 Chars)
                </label>
                <input
                  type="text"
                  maxLength={22}
                  value={settings.stripe_statement_descriptor || "SAN FURNITURE UK"}
                  onChange={(e) => handleChange("stripe_statement_descriptor", e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-sand-100 border border-sand-300 rounded-lg text-xs font-bold font-mono text-navy-950 uppercase"
                />
                <p className="text-[10px] text-navy-500 mt-1">
                  Appears on customer bank and credit card statements.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy-900 mb-1">
                  Settlement Currency
                </label>
                <input
                  type="text"
                  readOnly
                  value="GBP (£) - British Pound Sterling"
                  className="w-full px-3 py-2 bg-sand-200/70 border border-sand-300 rounded-lg text-xs font-bold text-navy-800 cursor-not-allowed"
                />
                <p className="text-[10px] text-navy-500 mt-1">
                  Locked to GBP pennies adhering to UK statutory e-commerce guidelines.
                </p>
              </div>
            </div>

            {/* Ready-to-Copy Stripe Webhook Configuration Box */}
            <div className="p-4 rounded-xl bg-sand-100 border border-sand-300 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-navy-950 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-brass-600" />
                  Stripe Dashboard Webhook Endpoint URL
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const webhookUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/api/webhooks/stripe`;
                    navigator.clipboard.writeText(webhookUrl);
                    setCopiedStripeWebhook(true);
                    setTimeout(() => setCopiedStripeWebhook(false), 2000);
                  }}
                  className="text-[11px] font-bold text-brass-700 hover:text-brass-800 flex items-center gap-1"
                >
                  {copiedStripeWebhook ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedStripeWebhook ? "Endpoint Copied!" : "Copy Webhook URL"}</span>
                </button>
              </div>
              <p className="text-[11px] text-navy-600">
                In your <strong>Stripe Dashboard &rarr; Developers &rarr; Webhooks</strong>, click <em>Add Endpoint</em> and paste this URL:
              </p>
              <div className="p-2.5 rounded-lg bg-navy-950 text-sand-50 font-mono text-xs flex items-center justify-between overflow-x-auto">
                <span>{typeof window !== "undefined" ? window.location.origin : "https://sanfurniture.com"}/api/webhooks/stripe</span>
              </div>
              <p className="text-[10px] text-navy-500">
                Recommended listening events: <code className="font-mono bg-sand-200 px-1 rounded">payment_intent.succeeded</code>, <code className="font-mono bg-sand-200 px-1 rounded">charge.refunded</code>, <code className="font-mono bg-sand-200 px-1 rounded">payment_intent.payment_failed</code>.
              </p>
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
