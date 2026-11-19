"use client";

import React, { useState, useEffect } from "react";
import {
  Rss,
  Share2,
  Copy,
  CheckCircle2,
  ExternalLink,
  Download,
  ShoppingBag,
  Sparkles,
  Layers,
  ArrowUpRight,
  TrendingUp,
  Tag,
  Globe,
  Settings,
  ShieldCheck,
  Save,
  RefreshCw,
  AlertCircle,
  Check,
  Eye,
  EyeOff,
  Code2,
  Activity,
  Sliders,
  CheckCheck,
} from "lucide-react";
import { apiUrl } from "@/lib/api-config";

interface TrackingFormData {
  // Google Tag Manager
  gtm_enabled: boolean;
  gtm_container_id: string;

  // Google Search Console
  google_site_verification: string;

  // Google Analytics 4
  ga4_enabled: boolean;
  ga4_measurement_id: string;

  // Meta Pixel & CAPI
  meta_pixel_enabled: boolean;
  meta_pixel_id: string;
  meta_capi_token: string;

  // Feeds Configuration
  google_merchant_brand: string;
  google_merchant_shipping_service: string;
  google_merchant_shipping_cost: string;
  google_merchant_free_shipping_threshold: string;
  google_merchant_feed_enabled: boolean;
  meta_catalog_brand: string;
  meta_catalog_feed_enabled: boolean;
}

const DEFAULT_FORM: TrackingFormData = {
  gtm_enabled: false,
  gtm_container_id: "",
  google_site_verification: "",
  ga4_enabled: false,
  ga4_measurement_id: "",
  meta_pixel_enabled: false,
  meta_pixel_id: "",
  meta_capi_token: "",
  google_merchant_brand: "SAN Furniture",
  google_merchant_shipping_service: "UK Room of Choice Delivery",
  google_merchant_shipping_cost: "49.00",
  google_merchant_free_shipping_threshold: "500",
  google_merchant_feed_enabled: true,
  meta_catalog_brand: "SAN Furniture",
  meta_catalog_feed_enabled: true,
};

export default function AdminMarketingPage() {
  const [activeTab, setActiveTab] = useState<"catalogs" | "google" | "meta">("catalogs");
  const [formData, setFormData] = useState<TrackingFormData>(DEFAULT_FORM);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [copiedFeed, setCopiedFeed] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showCapiToken, setShowCapiToken] = useState<boolean>(false);

  const googleFeedUrl = apiUrl("/api/feeds/google-merchant.xml");
  const metaFeedUrl = apiUrl("/api/feeds/meta-catalog.csv");

  const getAuthHeaders = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("san_admin_token") : null;
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  // 1. Fetch current settings from database
  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      try {
        const res = await fetch(apiUrl("/api/admin/settings"), {
          headers: getAuthHeaders(),
          credentials: "include",
        });
        const data = await res.json();
        if (res.ok && data.settings) {
          const s = data.settings;
          setFormData({
            gtm_enabled: s.gtm_enabled === "true" || s.gtm_enabled === "1",
            gtm_container_id: s.gtm_container_id || "",
            google_site_verification: s.google_site_verification || "",
            ga4_enabled: s.ga4_enabled === "true" || s.ga4_enabled === "1",
            ga4_measurement_id: s.ga4_measurement_id || "",
            meta_pixel_enabled: s.meta_pixel_enabled === "true" || s.meta_pixel_enabled === "1",
            meta_pixel_id: s.meta_pixel_id || "",
            meta_capi_token: s.meta_capi_token || "",
            google_merchant_brand: s.google_merchant_brand || "SAN Furniture",
            google_merchant_shipping_service: s.google_merchant_shipping_service || "UK Room of Choice Delivery",
            google_merchant_shipping_cost: s.google_merchant_shipping_cost || "49.00",
            google_merchant_free_shipping_threshold: s.google_merchant_free_shipping_threshold || "500",
            google_merchant_feed_enabled: s.google_merchant_feed_enabled !== "false" && s.google_merchant_feed_enabled !== "0",
            meta_catalog_brand: s.meta_catalog_brand || "SAN Furniture",
            meta_catalog_feed_enabled: s.meta_catalog_feed_enabled !== "false" && s.meta_catalog_feed_enabled !== "0",
          });
        }
      } catch (err) {
        console.error("Failed to fetch settings:", err);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  // 2. Save settings to database
  const handleSaveSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setToastMsg(null);

    // Auto-clean verification tag if user pasted full <meta ... />
    let cleanVerification = formData.google_site_verification.trim();
    if (cleanVerification.includes("content=")) {
      const match = cleanVerification.match(/content=["']([^"']+)["']/i);
      if (match && match[1]) {
        cleanVerification = match[1];
      }
    }

    // Auto-clean GTM ID if user pasted full script snippet
    let cleanGtm = formData.gtm_container_id.trim();
    if (cleanGtm.includes("GTM-")) {
      const gtmMatch = cleanGtm.match(/GTM-[A-Z0-9]+/i);
      if (gtmMatch) {
        cleanGtm = gtmMatch[0].toUpperCase();
      }
    }

    // Auto-clean Meta Pixel ID if user pasted full script code
    let cleanMetaPixel = formData.meta_pixel_id.trim();
    if (cleanMetaPixel.includes("fbq") || cleanMetaPixel.includes("<script>")) {
      const pixelMatch = cleanMetaPixel.match(/fbq\s*\(\s*['"]init['"]\s*,\s*['"](\d+)['"]\s*\)/i) || cleanMetaPixel.match(/\b\d{14,17}\b/);
      if (pixelMatch) {
        cleanMetaPixel = pixelMatch[1] || pixelMatch[0];
      }
    } else {
      const directMatch = cleanMetaPixel.match(/\b\d{14,17}\b/);
      if (directMatch) cleanMetaPixel = directMatch[0];
    }

    const payload = {
      settings: {
        gtm_enabled: String(formData.gtm_enabled),
        gtm_container_id: cleanGtm,
        google_site_verification: cleanVerification,
        ga4_enabled: String(formData.ga4_enabled),
        ga4_measurement_id: formData.ga4_measurement_id.trim(),
        meta_pixel_enabled: String(formData.meta_pixel_enabled),
        meta_pixel_id: cleanMetaPixel,
        meta_capi_token: formData.meta_capi_token.trim(),
        google_merchant_brand: formData.google_merchant_brand.trim() || "SAN Furniture",
        google_merchant_shipping_service: formData.google_merchant_shipping_service.trim() || "UK Room of Choice Delivery",
        google_merchant_shipping_cost: formData.google_merchant_shipping_cost.trim() || "49.00",
        google_merchant_free_shipping_threshold: formData.google_merchant_free_shipping_threshold.trim() || "500",
        google_merchant_feed_enabled: String(formData.google_merchant_feed_enabled),
        meta_catalog_brand: formData.meta_catalog_brand.trim() || "SAN Furniture",
        meta_catalog_feed_enabled: String(formData.meta_catalog_feed_enabled),
      },
    };

    try {
      const res = await fetch(apiUrl("/api/admin/settings"), {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save settings.");

      setFormData((prev) => ({
        ...prev,
        google_site_verification: cleanVerification,
        gtm_container_id: cleanGtm,
        meta_pixel_id: cleanMetaPixel,
      }));

      setToastMsg({
        type: "success",
        text: "Marketing, Google Tag Manager & Search Console settings successfully saved and deployed live!",
      });
      setTimeout(() => setToastMsg(null), 5000);
    } catch (err: any) {
      setToastMsg({
        type: "error",
        text: err.message || "Failed to persist settings to database.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFeed(id);
    setTimeout(() => setCopiedFeed(null), 3000);
  };

  return (
    <div className="space-y-6 w-full pb-12">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[#E8E2D5]">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#C89B3C] mb-1">
            <Share2 className="w-4 h-4" />
            <span>Growth, Social Commerce & Analytics</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif text-[#00072D]">
            Google & Meta Product Catalogs & Tracking
          </h1>
          <p className="text-sm text-[#4F6D7A] mt-1">
            Configure automated product feeds, Google Tag Manager (GTM), Google Search Console verification, GA4, and Meta Pixel.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleSaveSettings()}
            disabled={saving || loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#00072D] hover:bg-[#1C2541] text-white rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-50"
          >
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-[#C89B3C]" />
                <span>Saving to MySQL...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 text-[#C89B3C]" />
                <span>Save All Settings</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Toast Alert */}
      {toastMsg && (
        <div
          className={`p-4 rounded-xl text-xs font-medium flex items-center justify-between gap-3 border transition-all ${
            toastMsg.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {toastMsg.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{toastMsg.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMsg(null)}
            className="text-xs opacity-70 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Top Level Metric Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-[#E8E2D5] shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#4F6D7A]">
            <span>Google Shopping UK</span>
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                formData.google_merchant_feed_enabled ? "bg-emerald-500 animate-pulse" : "bg-neutral-300"
              }`}
            />
          </div>
          <div className="text-xl font-serif text-[#00072D] mt-2">
            {formData.google_merchant_feed_enabled ? "XML RSS 2.0 (Active)" : "Feed Inactive"}
          </div>
          <div className="text-xs text-emerald-700 font-medium mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Live VAT & GTIN-13 Barcodes
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#E8E2D5] shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#4F6D7A]">
            <span>Meta Commerce (IG/FB)</span>
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                formData.meta_catalog_feed_enabled ? "bg-emerald-500 animate-pulse" : "bg-neutral-300"
              }`}
            />
          </div>
          <div className="text-xl font-serif text-[#00072D] mt-2">
            {formData.meta_catalog_feed_enabled ? "CSV Catalog (Active)" : "Catalog Inactive"}
          </div>
          <div className="text-xs text-emerald-700 font-medium mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Advantage+ DPA Ready
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#E8E2D5] shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#4F6D7A]">
            <span>Google Tag Manager</span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                formData.gtm_enabled && formData.gtm_container_id
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-neutral-100 text-neutral-600"
              }`}
            >
              {formData.gtm_enabled && formData.gtm_container_id ? "INSTALLED" : "OFF"}
            </span>
          </div>
          <div className="text-xl font-serif text-[#00072D] mt-2">
            {formData.gtm_container_id || "Not Configured"}
          </div>
          <div className="text-xs text-[#4F6D7A] mt-1">
            {formData.gtm_enabled ? "Injected into Storefront" : "Disabled"}
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#E8E2D5] shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#4F6D7A]">
            <span>Google Search Console</span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                formData.google_site_verification
                  ? "bg-blue-100 text-blue-800"
                  : "bg-neutral-100 text-neutral-600"
              }`}
            >
              {formData.google_site_verification ? "VERIFIED" : "PENDING"}
            </span>
          </div>
          <div className="text-xl font-serif text-[#00072D] mt-2">
            {formData.google_site_verification ? "Meta Tag Active" : "No Token"}
          </div>
          <div className="text-xs text-[#4F6D7A] mt-1">
            Sitemap: /sitemap.xml
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-[#E8E2D5] pb-2 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab("catalogs")}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === "catalogs"
              ? "bg-[#00072D] text-white shadow-xs"
              : "bg-white text-navy-700 border border-[#E8E2D5] hover:bg-[#F4F1EA]"
          }`}
        >
          <Rss className="w-3.5 h-3.5" />
          <span>Product Feed Endpoints & Config</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("google")}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === "google"
              ? "bg-[#00072D] text-white shadow-xs"
              : "bg-white text-navy-700 border border-[#E8E2D5] hover:bg-[#F4F1EA]"
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>Google Tag Manager & Search Console</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("meta")}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === "meta"
              ? "bg-[#00072D] text-white shadow-xs"
              : "bg-white text-navy-700 border border-[#E8E2D5] hover:bg-[#F4F1EA]"
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Meta Pixel & Social Tracking</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PRODUCT FEED ENDPOINTS & CUSTOMIZATION */}
      {/* ========================================================================= */}
      {activeTab === "catalogs" && (
        <div className="space-y-6">
          {/* Feed Detail Cards */}
          <div className="grid grid-cols-1 gap-5">
            {/* Google Merchant Center */}
            <div className="bg-white p-6 rounded-2xl border border-[#E8E2D5] shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-base shadow-xs">
                    G
                  </div>
                  <div>
                    <h2 className="text-lg font-serif font-bold text-[#00072D]">
                      Google Merchant Center Feed (XML RSS 2.0)
                    </h2>
                    <p className="text-xs text-[#4F6D7A]">
                      Primary feed format for Google Free Listings, Performance Max & Shopping Campaigns in Great Britain.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopy(googleFeedUrl, "google")}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-[#E8E2D5] hover:bg-[#F4F1EA] text-[#00072D] rounded-xl text-xs font-semibold transition-colors"
                  >
                    {copiedFeed === "google" ? (
                      <>
                        <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy URL</span>
                      </>
                    )}
                  </button>

                  <a
                    href={googleFeedUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#00072D] hover:bg-[#1C2541] text-white rounded-xl text-xs font-semibold transition-colors"
                  >
                    <span>Open XML Feed</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E8E2D5] font-mono text-xs text-[#00072D] break-all">
                {googleFeedUrl}
              </div>

              {/* Feed Controls */}
              <div className="pt-3 border-t border-[#E8E2D5] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-navy-900 mb-1">Brand Name in Feed</label>
                  <input
                    type="text"
                    value={formData.google_merchant_brand}
                    onChange={(e) => setFormData({ ...formData, google_merchant_brand: e.target.value })}
                    className="w-full px-3 py-2 bg-sand-50 border border-sand-300 rounded-xl text-xs text-navy-950 focus:outline-none focus:border-navy-900"
                    placeholder="SAN Furniture"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-navy-900 mb-1">UK Delivery Service Label</label>
                  <input
                    type="text"
                    value={formData.google_merchant_shipping_service}
                    onChange={(e) => setFormData({ ...formData, google_merchant_shipping_service: e.target.value })}
                    className="w-full px-3 py-2 bg-sand-50 border border-sand-300 rounded-xl text-xs text-navy-950 focus:outline-none focus:border-navy-900"
                    placeholder="UK Room of Choice Delivery"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-navy-900 mb-1">Default Freight Cost (£)</label>
                  <input
                    type="text"
                    value={formData.google_merchant_shipping_cost}
                    onChange={(e) => setFormData({ ...formData, google_merchant_shipping_cost: e.target.value })}
                    className="w-full px-3 py-2 bg-sand-50 border border-sand-300 rounded-xl text-xs text-navy-950 focus:outline-none focus:border-navy-900"
                    placeholder="49.00"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-navy-900 mb-1">Free Shipping Threshold (£)</label>
                  <input
                    type="text"
                    value={formData.google_merchant_free_shipping_threshold}
                    onChange={(e) => setFormData({ ...formData, google_merchant_free_shipping_threshold: e.target.value })}
                    className="w-full px-3 py-2 bg-sand-50 border border-sand-300 rounded-xl text-xs text-navy-950 focus:outline-none focus:border-navy-900"
                    placeholder="500"
                  />
                </div>
              </div>
            </div>

            {/* Meta / Instagram Catalog */}
            <div className="bg-white p-6 rounded-2xl border border-[#E8E2D5] shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-base shadow-xs">
                    M
                  </div>
                  <div>
                    <h2 className="text-lg font-serif font-bold text-[#00072D]">
                      Meta / Instagram Commerce Catalog (CSV)
                    </h2>
                    <p className="text-xs text-[#4F6D7A]">
                      Scheduled catalog feed for Instagram Shop product tagging and Facebook Advantage+ Catalog campaigns.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopy(metaFeedUrl, "meta")}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-[#E8E2D5] hover:bg-[#F4F1EA] text-[#00072D] rounded-xl text-xs font-semibold transition-colors"
                  >
                    {copiedFeed === "meta" ? (
                      <>
                        <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy URL</span>
                      </>
                    )}
                  </button>

                  <a
                    href={metaFeedUrl}
                    download="san_furniture_meta_catalog.csv"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#00072D] hover:bg-[#1C2541] text-white rounded-xl text-xs font-semibold transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download CSV</span>
                  </a>
                </div>
              </div>

              <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E8E2D5] font-mono text-xs text-[#00072D] break-all">
                {metaFeedUrl}
              </div>

              <div className="pt-3 border-t border-[#E8E2D5] grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-navy-900 mb-1">Brand Name in Meta Catalog</label>
                  <input
                    type="text"
                    value={formData.meta_catalog_brand}
                    onChange={(e) => setFormData({ ...formData, meta_catalog_brand: e.target.value })}
                    className="w-full px-3 py-2 bg-sand-50 border border-sand-300 rounded-xl text-xs text-navy-950 focus:outline-none focus:border-navy-900"
                    placeholder="SAN Furniture"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-[#FAF8F5] border border-[#E8E2D5] rounded-xl">
                  <div>
                    <span className="block text-xs font-semibold text-navy-950">Active Catalog Status</span>
                    <span className="text-[11px] text-navy-600">Enable automatic endpoint responses for Meta bots</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.meta_catalog_feed_enabled}
                      onChange={(e) => setFormData({ ...formData, meta_catalog_feed_enabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-sand-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-sand-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-navy-900" />
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: GOOGLE TAG MANAGER & SEARCH CONSOLE */}
      {/* ========================================================================= */}
      {activeTab === "google" && (
        <div className="space-y-6">
          {/* Google Search Console */}
          <div className="bg-white p-6 rounded-2xl border border-[#E8E2D5] shadow-xs space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-base shadow-xs">
                  <Globe className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-lg font-serif font-bold text-[#00072D]">
                    Google Search Console (GSC) Ownership Verification
                  </h2>
                  <p className="text-xs text-[#4F6D7A]">
                    Verify site ownership in Google Search Console to monitor rankings, search impressions, and sitemap crawling.
                  </p>
                </div>
              </div>

              <a
                href="https://search.google.com/search-console"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-[#C89B3C] hover:text-[#00072D] font-semibold underline"
              >
                <span>Open Search Console</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="p-4 bg-sand-50 rounded-xl border border-sand-300 space-y-3">
              <div>
                <label className="block text-xs font-bold text-navy-950 mb-1">
                  Google Site Verification Key or Meta Tag
                </label>
                <input
                  type="text"
                  value={formData.google_site_verification}
                  onChange={(e) => setFormData({ ...formData, google_site_verification: e.target.value })}
                  placeholder="e.g. google-site-verification=AbCdEf12345... or paste full <meta name='google-site-verification' content='...' />"
                  className="w-full px-3.5 py-2.5 bg-white border border-sand-300 rounded-xl text-xs text-navy-950 focus:outline-none focus:border-navy-900 font-mono"
                />
              </div>

              <div className="text-[11px] text-navy-600 leading-relaxed flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>
                  When saved, this will automatically inject{" "}
                  <code className="px-1.5 py-0.5 bg-white border border-sand-300 rounded text-navy-950 font-mono">
                    &lt;meta name=&quot;google-site-verification&quot; content=&quot;{formData.google_site_verification || "YOUR_KEY"}&quot; /&gt;
                  </code>{" "}
                  into the storefront &lt;head&gt;.
                </span>
              </div>
            </div>

            {/* Sitemap Submission Quick Reference */}
            <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-blue-950">
              <div>
                <strong className="block font-bold">Your Live Sitemap for Google Search Console:</strong>
                <span className="font-mono text-[11px] text-blue-900">https://sanfurniture.com/sitemap.xml</span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy("https://sanfurniture.com/sitemap.xml", "sitemap")}
                className="px-3 py-1.5 bg-white border border-blue-300 hover:bg-blue-50 text-blue-900 rounded-lg text-xs font-semibold shrink-0"
              >
                {copiedFeed === "sitemap" ? "Copied Sitemap URL!" : "Copy Sitemap URL"}
              </button>
            </div>
          </div>

          {/* Google Tag Manager */}
          <div className="bg-white p-6 rounded-2xl border border-[#E8E2D5] shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-base shadow-xs">
                  <Code2 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-serif font-bold text-[#00072D]">
                    Google Tag Manager (GTM)
                  </h2>
                  <p className="text-xs text-[#4F6D7A]">
                    Deploy tracking tags, Google Ads conversion tracking, and event listeners dynamically without modifying code.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-navy-900">Enable GTM:</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.gtm_enabled}
                    onChange={(e) => setFormData({ ...formData, gtm_enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-sand-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-sand-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-navy-900" />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-navy-950 mb-1">
                  GTM Container ID
                </label>
                <input
                  type="text"
                  value={formData.gtm_container_id}
                  onChange={(e) => setFormData({ ...formData, gtm_container_id: e.target.value })}
                  placeholder="e.g. GTM-XXXXXXX"
                  className="w-full px-3.5 py-2.5 bg-sand-50 border border-sand-300 rounded-xl text-xs text-navy-950 focus:outline-none focus:border-navy-900 font-mono"
                />
                <span className="text-[11px] text-navy-600 mt-1 block">
                  Found in your Google Tag Manager workspace top right header.
                </span>
              </div>

              <div className="p-3.5 bg-sand-50 border border-sand-300 rounded-xl text-xs text-navy-800 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-navy-950">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>GDPR & Performance Certified</span>
                </div>
                <p className="text-[11px] text-navy-600 leading-relaxed">
                  GTM container is automatically loaded using Next.js optimized Script engine (`strategy=&quot;afterInteractive&quot;`) with &lt;noscript&gt; fallback iframe.
                </p>
              </div>
            </div>
          </div>

          {/* Google Analytics 4 (GA4) Direct */}
          <div className="bg-white p-6 rounded-2xl border border-[#E8E2D5] shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-base shadow-xs">
                  <Activity className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-lg font-serif font-bold text-[#00072D]">
                    Google Analytics 4 (GA4 Direct Tag)
                  </h2>
                  <p className="text-xs text-[#4F6D7A]">
                    Optional direct gtag.js integration (use if you do not use Google Tag Manager for analytics).
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-navy-900">Enable GA4:</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.ga4_enabled}
                    onChange={(e) => setFormData({ ...formData, ga4_enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-sand-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-sand-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-navy-900" />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-navy-950 mb-1">
                  GA4 Measurement ID
                </label>
                <input
                  type="text"
                  value={formData.ga4_measurement_id}
                  onChange={(e) => setFormData({ ...formData, ga4_measurement_id: e.target.value })}
                  placeholder="e.g. G-XXXXXXXXXX"
                  className="w-full px-3.5 py-2.5 bg-sand-50 border border-sand-300 rounded-xl text-xs text-navy-950 focus:outline-none focus:border-navy-900 font-mono"
                />
              </div>

              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Tip: If you configure GA4 inside Google Tag Manager, you can leave direct GA4 disabled to prevent duplicate pageview counts.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: META & SOCIAL PIXEL */}
      {/* ========================================================================= */}
      {activeTab === "meta" && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-[#E8E2D5] shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-base shadow-xs">
                  <Activity className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-lg font-serif font-bold text-[#00072D]">
                    Meta (Facebook & Instagram) Pixel
                  </h2>
                  <p className="text-xs text-[#4F6D7A]">
                    Track purchases, add-to-carts, and pageviews for high-performing Meta Advantage+ and retargeting ads.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-navy-900">Enable Meta Pixel:</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.meta_pixel_enabled}
                    onChange={(e) => setFormData({ ...formData, meta_pixel_enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-sand-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-sand-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-navy-900" />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-navy-950 mb-1">
                  Meta Pixel Dataset / ID
                </label>
                <input
                  type="text"
                  value={formData.meta_pixel_id}
                  onChange={(e) => setFormData({ ...formData, meta_pixel_id: e.target.value })}
                  placeholder="e.g. 123456789012345"
                  className="w-full px-3.5 py-2.5 bg-sand-50 border border-sand-300 rounded-xl text-xs text-navy-950 focus:outline-none focus:border-navy-900 font-mono"
                />
                <span className="text-[11px] text-navy-600 mt-1 block">
                  Found in Meta Events Manager &gt; Data Sources &gt; Settings.
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-navy-950">
                    Conversions API (CAPI) Access Token
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowCapiToken((prev) => !prev)}
                    className="text-[11px] text-navy-600 hover:text-navy-950 flex items-center gap-1"
                  >
                    {showCapiToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showCapiToken ? "Hide" : "Show"}</span>
                  </button>
                </div>
                <input
                  type={showCapiToken ? "text" : "password"}
                  value={formData.meta_capi_token}
                  onChange={(e) => setFormData({ ...formData, meta_capi_token: e.target.value })}
                  placeholder="EAAG..."
                  className="w-full px-3.5 py-2.5 bg-sand-50 border border-sand-300 rounded-xl text-xs text-navy-950 focus:outline-none focus:border-navy-900 font-mono"
                />
                <span className="text-[11px] text-navy-600 mt-1 block">
                  Enables server-side purchase event dispatch with hashed user parameters.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Sticky Action Bar */}
      <div className="p-4 bg-white border border-[#E8E2D5] rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="text-xs text-navy-700">
          <span>Persisted directly to MySQL <code className="font-mono bg-sand-100 px-1.5 py-0.5 rounded text-navy-950">system_settings</code>. Instantly applies across storefront layout.</span>
        </div>

        <button
          type="button"
          onClick={() => handleSaveSettings()}
          disabled={saving || loading}
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#00072D] hover:bg-[#1C2541] text-white rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-50"
        >
          {saving ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-[#C89B3C]" />
              <span>Saving Configurations...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4 text-[#C89B3C]" />
              <span>Save Changes</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
