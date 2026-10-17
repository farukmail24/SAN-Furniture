"use client";

import React, { useState, useEffect } from "react";
import {
  Building2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Truck,
  Phone,
  Mail,
  MapPin,
  Layers,
  Clock,
  ArrowUpRight,
  PauseCircle,
  PlayCircle,
  Filter,
  Eye,
  X,
  Upload,
  FileSpreadsheet,
  Check,
  ExternalLink,
  Globe,
  History,
  PlusCircle,
  Sparkles,
  Search,
  CheckSquare,
  Square,
  ListPlus
} from "lucide-react";
import { apiUrl } from "@/lib/api-config";
import { fetchWithSwr, invalidateCache, getCachedData } from "@/lib/api-cache";

interface Supplier {
  id: string;
  name: string;
  code: string;
  location: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  feed_type: string;
  feed_url: string;
  lead_time_days: number;
  is_active: number;
  last_sync_at: string;
  sync_status: string;
  mapped_products_count?: number;
}

interface FeedItem {
  id: string;
  supplier_id: string;
  supplier_sku: string;
  product_id: string;
  source_url?: string;
  cost_price_pennies: number;
  shipping_cost_pennies: number;
  markup_percentage: string;
  retail_price_pennies: number;
  stock_level: number;
  lead_time_days: number;
  last_synced_at: string;
  title: string;
  handle: string;
  thumbnail_url: string;
  status?: string;
}

interface SyncLogItem {
  id: string;
  supplier_id: string;
  trigger_type: string;
  items_scanned: number;
  prices_updated: number;
  stock_updated: number;
  status: string;
  duration_ms: number;
  created_at: string;
  diff_summary?: any[];
}

export default function AdminSuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [mounted, setMounted] = useState<boolean>(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<"active" | "all" | "paused">("active");
  const [toastMsg, setToastMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Feed Inspector Modal State
  const [inspectSupplier, setInspectSupplier] = useState<Supplier | null>(null);
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [loadingFeedItems, setLoadingFeedItems] = useState<boolean>(false);
  const [feedSearch, setFeedSearch] = useState<string>("");
  const [uploadModalOpen, setUploadModalOpen] = useState<boolean>(false);
  const [uploadContent, setUploadContent] = useState<string>("");
  const [uploading, setUploading] = useState<boolean>(false);

  // Dedicated Amos Mann Live Extraction & Reconciler State
  const [amosMannLogs, setAmosMannLogs] = useState<SyncLogItem[]>([]);
  const [amosMannSyncing, setAmosMannSyncing] = useState<boolean>(false);
  const [importUrlModalOpen, setImportUrlModalOpen] = useState<boolean>(false);
  const [importMode, setImportMode] = useState<"sitemap" | "manual">("sitemap");
  const [newAmosUrl, setNewAmosUrl] = useState<string>("");
  const [newAmosCategory, setNewAmosCategory] = useState<string>("cat_beds");
  const [newAmosDeliveryTier, setNewAmosDeliveryTier] = useState<string>("two_man_white_glove");
  const [importingUrl, setImportingUrl] = useState<boolean>(false);
  const [activeModalTab, setActiveModalTab] = useState<"items" | "logs">("items");

  // Sitemap Discovery State
  const [sitemapData, setSitemapData] = useState<{
    totalInSitemap: number;
    alreadyImportedCount: number;
    availableToImportCount: number;
    products: Array<{
      url: string;
      slug: string;
      category_id: string;
      delivery_tier: string;
      category_label: string;
      is_imported: boolean;
    }>;
  } | null>(null);
  const [loadingSitemap, setLoadingSitemap] = useState<boolean>(false);
  const [sitemapCategoryFilter, setSitemapCategoryFilter] = useState<string>("all");
  const [selectedSitemapUrls, setSelectedSitemapUrls] = useState<string[]>([]);
  const [sitemapSearch, setSitemapSearch] = useState<string>("");

  const fetchSuppliers = async () => {
    try {
      fetchWithSwr(
        apiUrl("/api/admin/suppliers"),
        (data: any) => {
          if (data.suppliers) {
            setSuppliers(data.suppliers);
            setLoading(false);
          }
        }
      ).finally(() => setLoading(false));
    } catch (err) {
      console.error("Failed to load suppliers:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    const cached = getCachedData<{ suppliers: Supplier[] }>(apiUrl("/api/admin/suppliers"));
    if (cached?.suppliers?.length) {
      setSuppliers(cached.suppliers);
      setLoading(false);
    }
    fetchSuppliers();
  }, []);

  const handleTriggerSync = async (supplierId: string) => {
    setSyncingId(supplierId);
    setToastMsg(null);
    try {
      const res = await fetch(apiUrl("/api/admin/suppliers/sync"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supplierId }),
      });
      const data = await res.json();
      if (res.ok) {
        setToastMsg({ type: "success", text: data.message || "EDI catalog synchronized successfully." });
        invalidateCache(apiUrl("/api/admin/suppliers"));
        fetchSuppliers();
      } else {
        setToastMsg({ type: "error", text: data.error || "Sync failed" });
      }
    } catch {
      setToastMsg({ type: "error", text: "Network error triggering supplier EDI sync." });
    } finally {
      setSyncingId(null);
      setTimeout(() => setToastMsg(null), 4000);
    }
  };

  const handleToggleStatus = async (supplier: Supplier) => {
    setTogglingId(supplier.id);
    setToastMsg(null);
    const targetStatus = supplier.is_active === 1 ? 0 : 1;

    try {
      const res = await fetch(apiUrl(`/api/admin/suppliers/${supplier.id}/toggle`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();

      if (res.ok) {
        setSuppliers((prev) =>
          prev.map((s) =>
            s.id === supplier.id
              ? {
                  ...s,
                  is_active: targetStatus,
                  sync_status: targetStatus === 1 ? "operational" : "paused",
                }
              : s
          )
        );
        invalidateCache(apiUrl("/api/admin/suppliers"));
        setToastMsg({
          type: "success",
          text: data.message || `${supplier.name} is now ${targetStatus === 1 ? "Active" : "Deactivated"}.`,
        });
      } else {
        setToastMsg({ type: "error", text: data.error || "Failed to update supplier status." });
      }
    } catch {
      setToastMsg({ type: "error", text: "Network error toggling supplier status." });
    } finally {
      setTogglingId(null);
      setTimeout(() => setToastMsg(null), 4000);
    }
  };

  const handleOpenFeedInspector = async (supplier: Supplier) => {
    setInspectSupplier(supplier);
    setLoadingFeedItems(true);
    setFeedSearch("");
    setActiveModalTab("items");
    try {
      let endpoint = "";
      if (supplier.code === "amos_mann_furniture") {
        endpoint = "/api/admin/dropship/amos-mann/status";
      } else if (supplier.code === "furniture_to_go") {
        endpoint = "/api/admin/dropship/furniture-to-go/status";
      }

      if (endpoint) {
        const res = await fetch(apiUrl(endpoint));
        const data = await res.json();
        setFeedItems(data.items || []);
        if (data.recentLogs) {
          setAmosMannLogs(data.recentLogs);
        }
      } else {
        setFeedItems([]);
      }
    } catch (err) {
      console.error("Failed to load feed items:", err);
      setFeedItems([]);
    } finally {
      setLoadingFeedItems(false);
    }
  };

  const handleAmosMannSync = async () => {
    setAmosMannSyncing(true);
    try {
      const res = await fetch(apiUrl("/api/admin/dropship/amos-mann/sync"), { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setToastMsg({
          type: "success",
          text: `Amos Mann live site reconciled: ${data.itemsScanned} items scanned in ${(data.durationMs / 1000).toFixed(1)}s (${data.pricesUpdated} prices updated, ${data.stockUpdated} stock status updated).`
        });
        if (inspectSupplier) {
          handleOpenFeedInspector(inspectSupplier);
        }
        fetchSuppliers();
      } else {
        setToastMsg({ type: "error", text: data.error || "Sync failed" });
      }
    } catch {
      setToastMsg({ type: "error", text: "Network error triggering live reconcile." });
    } finally {
      setAmosMannSyncing(false);
      setTimeout(() => setToastMsg(null), 5000);
    }
  };

  const handleImportAmosUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAmosUrl.trim()) return;
    setImportingUrl(true);
    try {
      const res = await fetch(apiUrl("/api/admin/dropship/amos-mann/import-url"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: newAmosUrl.trim(),
          categoryId: newAmosCategory,
          deliveryTier: newAmosDeliveryTier
        })
      });
      const data = await res.json();
      if (res.ok) {
        setToastMsg({
          type: "success",
          text: data.message || "Product imported successfully from live website!"
        });
        setImportUrlModalOpen(false);
        setNewAmosUrl("");
        if (inspectSupplier) {
          handleOpenFeedInspector(inspectSupplier);
        }
        fetchSuppliers();
      } else {
        setToastMsg({ type: "error", text: data.error || "Failed to extract product." });
      }
    } catch {
      setToastMsg({ type: "error", text: "Network error extracting product." });
    } finally {
      setImportingUrl(false);
      setTimeout(() => setToastMsg(null), 5000);
    }
  };

  const fetchSitemapCatalog = async (category = "all") => {
    setLoadingSitemap(true);
    try {
      const res = await fetch(apiUrl(`/api/admin/dropship/amos-mann/sitemap-catalog?category=${category}`));
      const data = await res.json();
      setSitemapData(data);
    } catch (err) {
      console.error("Failed to load sitemap catalog:", err);
    } finally {
      setLoadingSitemap(false);
    }
  };

  const handleBatchImportSitemap = async () => {
    if (selectedSitemapUrls.length === 0) return;
    setImportingUrl(true);
    try {
      const res = await fetch(apiUrl("/api/admin/dropship/amos-mann/import-url"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          urls: selectedSitemapUrls,
          categoryId: newAmosCategory,
          deliveryTier: newAmosDeliveryTier,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setToastMsg({
          type: "success",
          text: data.message || `Successfully batch-imported ${data.importedCount || selectedSitemapUrls.length} products!`,
        });
        setSelectedSitemapUrls([]);
        setImportUrlModalOpen(false);
        fetchSuppliers();
        if (inspectSupplier) {
          handleOpenFeedInspector(inspectSupplier);
        }
      } else {
        setToastMsg({ type: "error", text: data.error || "Batch import failed." });
      }
    } catch {
      setToastMsg({ type: "error", text: "Network error during batch import." });
    } finally {
      setImportingUrl(false);
      setTimeout(() => setToastMsg(null), 5000);
    }
  };

  const handleFileUpload = async () => {
    if (!inspectSupplier || !uploadContent.trim()) return;
    setUploading(true);
    try {
      const res = await fetch(apiUrl(`/api/admin/suppliers/${inspectSupplier.id}/upload-feed`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedContent: uploadContent }),
      });
      const data = await res.json();
      if (res.ok) {
        setToastMsg({ type: "success", text: data.message || "Feed processed successfully." });
        setUploadModalOpen(false);
        setUploadContent("");
        handleOpenFeedInspector(inspectSupplier);
        fetchSuppliers();
      } else {
        setToastMsg({ type: "error", text: data.error || "Failed to parse feed file." });
      }
    } catch {
      setToastMsg({ type: "error", text: "Network error uploading feed file." });
    } finally {
      setUploading(false);
    }
  };

  const activeSuppliers = suppliers.filter((s) => s.is_active === 1);
  const pausedSuppliers = suppliers.filter((s) => s.is_active !== 1);

  const displayedSuppliers =
    filterTab === "active"
      ? activeSuppliers
      : filterTab === "paused"
      ? pausedSuppliers
      : suppliers;

  const filteredFeedItems = feedItems.filter(
    (item) =>
      item.title.toLowerCase().includes(feedSearch.toLowerCase()) ||
      item.supplier_sku.toLowerCase().includes(feedSearch.toLowerCase())
  );

  return (
    <div className="space-y-6 w-full">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E8E2D5]">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#C89B3C] mb-1">
            <Building2 className="w-4 h-4" />
            <span>Supply Chain & B2B EDI Network</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif text-[#0B132B]">
            UK Wholesale Dropship Suppliers
          </h1>
          <p className="text-sm text-[#4F6D7A] mt-1">
            Activate, pause, or inspect inventory feeds, lead times, and purchase order EDI pipelines.
          </p>
        </div>

        <button
          onClick={() => handleTriggerSync("all")}
          disabled={syncingId !== null}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#0B132B] hover:bg-[#1C2541] text-[#FAF8F5] rounded-md text-sm font-medium transition-all shadow-md hover:shadow-lg disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 text-[#C89B3C] ${syncingId ? "animate-spin" : ""}`} />
          <span>Sync Active Live Feeds</span>
        </button>
      </div>

      {/* Toast Notification */}
      {toastMsg && (
        <div
          className={`p-4 rounded-md text-sm flex items-center gap-2 animate-in fade-in ${
            toastMsg.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-900"
              : "bg-rose-50 border border-rose-200 text-rose-900"
          }`}
        >
          {toastMsg.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white border border-[#E8E2D5] rounded-xl shadow-sm">
          <div className="text-xs uppercase tracking-wider font-semibold text-[#4F6D7A]">
            Active Dropship Partners
          </div>
          <div className="text-3xl font-serif text-[#0B132B] mt-2 flex items-baseline gap-2">
            <span>{activeSuppliers.length} Active</span>
            <span className="text-xs font-sans text-[#7A8B99]">
              ({pausedSuppliers.length} Paused)
            </span>
          </div>
          <div className="text-xs text-emerald-700 font-medium mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> 100% BS 5852 Fire Certified UK Hubs
          </div>
        </div>

        <div className="p-5 bg-white border border-[#E8E2D5] rounded-xl shadow-sm">
          <div className="text-xs uppercase tracking-wider font-semibold text-[#4F6D7A]">
            Active Catalog SKUs Synced
          </div>
          <div className="text-3xl font-serif text-[#0B132B] mt-2">
            {activeSuppliers.reduce((acc, s) => acc + (s.mapped_products_count || 0), 0)} SKUs
          </div>
          <div className="text-xs text-[#4F6D7A] mt-1">Live stock reservation & trade price guard</div>
        </div>

        <div className="p-5 bg-white border border-[#E8E2D5] rounded-xl shadow-sm">
          <div className="text-xs uppercase tracking-wider font-semibold text-[#4F6D7A]">
            Avg Active Dispatch Lead Time
          </div>
          <div className="text-3xl font-serif text-[#0B132B] mt-2">
            3 - 5 Days
          </div>
          <div className="text-xs text-[#C89B3C] font-medium mt-1 flex items-center gap-1">
            <Truck className="w-3.5 h-3.5" /> Direct UK end-customer delivery
          </div>
        </div>
      </div>

      {/* Tabs Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-[#E8E2D5]">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setFilterTab("active")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              filterTab === "active"
                ? "bg-[#0B132B] text-white shadow-sm"
                : "bg-transparent text-[#4F6D7A] hover:bg-slate-100"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Active Partners ({activeSuppliers.length})</span>
          </button>

          <button
            onClick={() => setFilterTab("all")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              filterTab === "all"
                ? "bg-[#0B132B] text-white shadow-sm"
                : "bg-transparent text-[#4F6D7A] hover:bg-slate-100"
            }`}
          >
            <span>All Suppliers ({suppliers.length})</span>
          </button>

          <button
            onClick={() => setFilterTab("paused")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              filterTab === "paused"
                ? "bg-[#0B132B] text-white shadow-sm"
                : "bg-transparent text-[#4F6D7A] hover:bg-slate-100"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Paused / Inactive ({pausedSuppliers.length})</span>
          </button>
        </div>

        <div className="text-xs text-[#7A8B99] px-2 flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-[#C89B3C]" />
          <span>
            {filterTab === "active"
              ? "Showing: Amos Mann Furniture & Furniture To Go"
              : filterTab === "paused"
              ? "Showing: Paused manufacturers"
              : "Showing: All suppliers"}
          </span>
        </div>
      </div>

      {/* Suppliers Directory Cards */}
      {loading ? (
        <div className="py-20 flex justify-center items-center">
          <RefreshCw className="w-8 h-8 animate-spin text-[#C89B3C]" />
        </div>
      ) : displayedSuppliers.length === 0 ? (
        <div className="py-16 text-center bg-white border border-[#E8E2D5] rounded-xl p-8">
          <AlertCircle className="w-10 h-10 text-[#C89B3C] mx-auto mb-3" />
          <h3 className="text-lg font-serif font-bold text-[#0B132B]">No Suppliers Found</h3>
          <p className="text-sm text-[#4F6D7A] mt-1">There are no suppliers matching the selected filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {displayedSuppliers.map((s) => {
            const isActive = s.is_active === 1;

            return (
              <div
                key={s.id}
                className={`bg-white border rounded-xl p-6 shadow-sm transition-all ${
                  isActive
                    ? "border-[#E8E2D5] hover:shadow-md"
                    : "border-slate-200 bg-slate-50/60 opacity-80 hover:opacity-100"
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#0B132B] text-[#FAF8F5]">
                        {s.code.toUpperCase()}
                      </span>

                      {isActive ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                          <span>Active & Operational</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 flex items-center gap-1.5">
                          <PauseCircle className="w-3.5 h-3.5 text-amber-600" />
                          <span>Deactivated / Paused</span>
                        </span>
                      )}

                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#F4F1EA] text-[#0B132B] uppercase">
                        EDI: {s.feed_type}
                      </span>
                    </div>

                    <h2 className="text-xl font-serif font-bold text-[#0B132B] flex items-center gap-2">
                      <span>{s.name}</span>
                      {!isActive && (
                        <span className="text-xs font-sans font-normal text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          Not dropshipping
                        </span>
                      )}
                    </h2>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-[#4F6D7A]">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#C89B3C]" />
                        {s.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#C89B3C]" />
                        Dispatch Lead Time: {s.lead_time_days} days
                      </span>
                      <span className="flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-[#C89B3C]" />
                        {s.mapped_products_count || 0} Catalog SKUs
                      </span>
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* Add Amos Mann URL Dedicated Action */}
                    {s.code === "amos_mann_furniture" && (
                      <button
                        onClick={() => {
                          setInspectSupplier(s);
                          setImportUrlModalOpen(true);
                          fetchSitemapCatalog("all");
                        }}
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-[#C89B3C] hover:bg-[#B38728] text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
                        title="Auto-discover 310+ products from live sitemap or import by URL"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>+ Add Amos Mann URL / Batch</span>
                      </button>
                    )}

                    {/* View Live Feed Data Button */}
                    <button
                      onClick={() => handleOpenFeedInspector(s)}
                      className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-[#0B132B] hover:bg-[#1C2541] text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
                      title="View synchronized wholesale SKUs, costs, stock levels & margins"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#C89B3C]" />
                      <span>View Live Feed ({s.mapped_products_count || 0} SKUs)</span>
                    </button>

                    {/* Sync Button */}
                    <button
                      onClick={() => handleTriggerSync(s.id)}
                      disabled={syncingId === s.id || !isActive}
                      className="inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-[#F4F1EA] hover:bg-[#E8E2D5] text-[#0B132B] rounded-lg text-xs font-semibold transition-colors disabled:opacity-40"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${syncingId === s.id ? "animate-spin" : ""}`} />
                      <span>{syncingId === s.id ? "Syncing..." : "Sync Catalog"}</span>
                    </button>

                    {/* Authentic B2B Trade Portal Link */}
                    <a
                      href={s.feed_url || "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-1 px-3.5 py-2 border border-[#E8E2D5] hover:bg-slate-50 text-[#0B132B] rounded-lg text-xs font-medium transition-colors"
                      title="Access official supplier B2B trade account & stock downloads"
                    >
                      <span>B2B Portal</span>
                      <ExternalLink className="w-3.5 h-3.5 text-[#C89B3C]" />
                    </a>

                    {/* Toggle Status Button */}
                    <button
                      onClick={() => handleToggleStatus(s)}
                      disabled={togglingId === s.id}
                      className={`inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 ${
                        isActive
                          ? "bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200"
                          : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                      }`}
                      title={isActive ? "Deactivate dropshipping for this supplier" : "Activate dropshipping for this supplier"}
                    >
                      {togglingId === s.id ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : isActive ? (
                        <PauseCircle className="w-3.5 h-3.5" />
                      ) : (
                        <PlayCircle className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {togglingId === s.id
                          ? "..."
                          : isActive
                          ? "Pause"
                          : "Activate"}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Contact & Meta Bar */}
                <div className="mt-5 pt-4 border-t border-[#E8E2D5] flex flex-wrap items-center justify-between gap-3 text-xs text-[#4F6D7A]">
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="font-medium text-[#0B132B]">
                      Primary Contact: {s.contact_name || "Factory Dispatch Team"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-[#C89B3C]" />
                      <a href={`mailto:${s.contact_email}`} className="hover:underline">
                        {s.contact_email}
                      </a>
                    </span>
                    {s.contact_phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-[#C89B3C]" />
                        <span>{s.contact_phone}</span>
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] text-[#4F6D7A]">
                    Last Feed Sync:{" "}
                    <strong suppressHydrationWarning>
                      {s.last_sync_at && mounted ? new Date(s.last_sync_at).toLocaleString("en-GB") : "Recently"}
                    </strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FEED INSPECTOR MODAL */}
      {inspectSupplier && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-[#E8E2D5] rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-[#E8E2D5] flex items-center justify-between bg-[#FAF8F5]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#0B132B] text-[#FAF8F5]">
                    {inspectSupplier.code.toUpperCase()}
                  </span>
                  <span className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Live Wholesale Inventory Feed
                  </span>
                </div>
                <h2 className="text-xl font-serif font-bold text-[#0B132B] mt-1">
                  {inspectSupplier.name}
                </h2>
                <p className="text-xs text-[#4F6D7A]">
                  Hub: {inspectSupplier.location} • Lead Time: {inspectSupplier.lead_time_days} days
                </p>
              </div>

              <div className="flex items-center gap-2">
                {inspectSupplier.code === "amos_mann_furniture" ? (
                  <>
                    <button
                      onClick={() => setImportUrlModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#C89B3C] hover:bg-[#B38728] text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                      title="Add a new live product URL from amosmannfurniture.co.uk"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Add Amos Mann URL</span>
                    </button>

                    <button
                      onClick={handleAmosMannSync}
                      disabled={amosMannSyncing}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
                      title="Run live background crawler across all tracked products"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${amosMannSyncing ? "animate-spin" : ""}`} />
                      <span>{amosMannSyncing ? "Reconciling..." : "Run Live Reconcile"}</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setUploadModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Feed File</span>
                  </button>
                )}

                <button
                  onClick={() => setInspectSupplier(null)}
                  className="p-2 text-[#4F6D7A] hover:text-[#0B132B] hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Tabs for Amos Mann */}
            {inspectSupplier.code === "amos_mann_furniture" && (
              <div className="px-6 pt-3 border-b border-[#E8E2D5] bg-[#FAF8F5] flex items-center gap-4 text-xs font-medium">
                <button
                  onClick={() => setActiveModalTab("items")}
                  className={`pb-2.5 border-b-2 flex items-center gap-1.5 transition-colors ${
                    activeModalTab === "items"
                      ? "border-[#0B132B] text-[#0B132B] font-bold"
                      : "border-transparent text-[#4F6D7A] hover:text-[#0B132B]"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 text-[#C89B3C]" />
                  <span>Tracked Live Products ({feedItems.length})</span>
                </button>

                <button
                  onClick={() => setActiveModalTab("logs")}
                  className={`pb-2.5 border-b-2 flex items-center gap-1.5 transition-colors ${
                    activeModalTab === "logs"
                      ? "border-[#0B132B] text-[#0B132B] font-bold"
                      : "border-transparent text-[#4F6D7A] hover:text-[#0B132B]"
                  }`}
                >
                  <History className="w-3.5 h-3.5 text-[#C89B3C]" />
                  <span>Auto-Sync History & Diffs ({amosMannLogs.length})</span>
                </button>
              </div>
            )}

            {/* Modal Search & Stats */}
            {activeModalTab === "items" && (
              <div className="p-4 border-b border-[#E8E2D5] bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <input
                  type="text"
                  placeholder="Search by SKU or product title..."
                  value={feedSearch}
                  onChange={(e) => setFeedSearch(e.target.value)}
                  className="px-3.5 py-2 border border-[#E8E2D5] rounded-lg text-xs w-full sm:w-80 focus:outline-none focus:border-[#C89B3C]"
                />

                <div className="text-xs text-[#4F6D7A]">
                  Showing <strong>{filteredFeedItems.length}</strong> of <strong>{feedItems.length}</strong> synchronized SKUs
                </div>
              </div>
            )}

            {/* Modal Body / Table */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {loadingFeedItems ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3">
                  <RefreshCw className="w-8 h-8 animate-spin text-[#C89B3C]" />
                  <span className="text-xs text-[#4F6D7A]">Loading wholesale feed data...</span>
                </div>
              ) : activeModalTab === "logs" && inspectSupplier.code === "amos_mann_furniture" ? (
                <div>
                  {amosMannLogs.length === 0 ? (
                    <div className="py-12 text-center text-sm text-[#4F6D7A]">
                      No previous extraction logs found. Click &quot;Run Live Reconcile&quot; to execute your first background sync.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-[#E8E2D5] text-[#4F6D7A] uppercase tracking-wider text-[10px]">
                            <th className="pb-3 font-semibold">Execution Time</th>
                            <th className="pb-3 font-semibold">Trigger</th>
                            <th className="pb-3 font-semibold">Items Scanned</th>
                            <th className="pb-3 font-semibold">Prices Updated</th>
                            <th className="pb-3 font-semibold">Stock Updated</th>
                            <th className="pb-3 font-semibold">Duration</th>
                            <th className="pb-3 font-semibold">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E8E2D5]">
                          {amosMannLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                              <td className="py-3 font-medium text-[#0B132B]">
                                {new Date(log.created_at).toLocaleString("en-GB")}
                              </td>
                              <td className="py-3">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                  log.trigger_type === "cron" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"
                                }`}>
                                  {log.trigger_type.toUpperCase()}
                                </span>
                              </td>
                              <td className="py-3 font-bold text-[#0B132B]">{log.items_scanned}</td>
                              <td className="py-3">
                                <span className={log.prices_updated > 0 ? "text-amber-700 font-bold" : "text-[#4F6D7A]"}>
                                  {log.prices_updated}
                                </span>
                              </td>
                              <td className="py-3">
                                <span className={log.stock_updated > 0 ? "text-rose-700 font-bold" : "text-[#4F6D7A]"}>
                                  {log.stock_updated}
                                </span>
                              </td>
                              <td className="py-3 text-[#4F6D7A]">
                                {(log.duration_ms / 1000).toFixed(1)}s
                              </td>
                              <td className="py-3">
                                <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> {log.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : filteredFeedItems.length === 0 ? (
                <div className="py-12 text-center text-sm text-[#4F6D7A]">
                  No feed items found. Click &quot;Add Amos Mann URL&quot; or &quot;Run Live Reconcile&quot; to populate.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[#E8E2D5] text-[#4F6D7A] uppercase tracking-wider text-[10px]">
                        <th className="pb-3 font-semibold">SKU / Item</th>
                        {inspectSupplier.code === "amos_mann_furniture" && (
                          <th className="pb-3 font-semibold">Live Website</th>
                        )}
                        <th className="pb-3 font-semibold">Trade Cost (Ex VAT)</th>
                        <th className="pb-3 font-semibold">Carriage</th>
                        <th className="pb-3 font-semibold">Retail Price</th>
                        <th className="pb-3 font-semibold">Margin %</th>
                        <th className="pb-3 font-semibold">Stock</th>
                        <th className="pb-3 font-semibold">Lead Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8E2D5]">
                      {filteredFeedItems.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-3">
                              {item.thumbnail_url && (
                                <img
                                  src={item.thumbnail_url}
                                  alt={item.title}
                                  className="w-10 h-10 object-cover rounded-md border border-[#E8E2D5] shrink-0"
                                />
                              )}
                              <div>
                                <div className="font-bold text-[#0B132B]">{item.supplier_sku}</div>
                                <div className="text-[#4F6D7A] truncate max-w-xs">{item.title}</div>
                              </div>
                            </div>
                          </td>

                          {inspectSupplier.code === "amos_mann_furniture" && (
                            <td className="py-3 pr-2">
                              {item.source_url ? (
                                <a
                                  href={item.source_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#F4F1EA] hover:bg-[#E8E2D5] text-[#0B132B] text-[11px] font-medium transition-colors"
                                  title="View product on amosmannfurniture.co.uk"
                                >
                                  <Globe className="w-3 h-3 text-[#C89B3C]" />
                                  <span>View Site</span>
                                  <ExternalLink className="w-3 h-3 text-[#4F6D7A]" />
                                </a>
                              ) : (
                                <span className="text-gray-400 text-[10px]">—</span>
                              )}
                            </td>
                          )}

                          <td className="py-3 font-semibold text-[#0B132B]">
                            £{((item.cost_price_pennies || 0) / 100).toFixed(2)}
                          </td>
                          <td className="py-3 text-[#4F6D7A]">
                            £{((item.shipping_cost_pennies || 0) / 100).toFixed(2)}
                          </td>
                          <td className="py-3 font-bold text-[#0B132B]">
                            £{((item.retail_price_pennies || 0) / 100).toFixed(2)}
                          </td>
                          <td className="py-3">
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                              {item.markup_percentage || 45}%
                            </span>
                          </td>
                          <td className="py-3">
                            <span
                              className={`font-semibold ${
                                (item.stock_level ?? 0) > 10
                                  ? "text-emerald-700"
                                  : (item.stock_level ?? 0) > 0
                                  ? "text-amber-700"
                                  : "text-rose-700"
                              }`}
                            >
                              {(item.stock_level ?? 0) > 0 ? `${item.stock_level} units` : "Out of Stock"}
                            </span>
                          </td>
                          <td className="py-3 text-[#4F6D7A]">{item.lead_time_days || 5} days</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#E8E2D5] bg-[#FAF8F5] flex items-center justify-between text-xs text-[#4F6D7A]">
              <span>Automated B2B Purchase Order dispatch active for this supplier</span>
              <button
                onClick={() => setInspectSupplier(null)}
                className="px-4 py-2 bg-[#0B132B] hover:bg-[#1C2541] text-white rounded-lg text-xs font-semibold transition-colors"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UPLOAD FEED MODAL (FOR CSV SUPPLIERS) */}
      {uploadModalOpen && inspectSupplier && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white border border-[#E8E2D5] rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D5]">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <h3 className="font-serif font-bold text-lg text-[#0B132B]">
                  Import Feed for {inspectSupplier.name}
                </h3>
              </div>
              <button
                onClick={() => setUploadModalOpen(false)}
                className="text-[#4F6D7A] hover:text-[#0B132B]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#4F6D7A]">
              Paste raw CSV or JSON data downloaded from your {inspectSupplier.name} B2B Trade Portal. The system will automatically reconcile wholesale costs, update stock levels, and enforce Margin Guard.
            </p>

            <div>
              <label className="block text-xs font-semibold text-[#0B132B] mb-1.5">
                Feed Content (CSV or JSON)
              </label>
              <textarea
                rows={10}
                value={uploadContent}
                onChange={(e) => setUploadContent(e.target.value)}
                placeholder="sku,title,trade_cost_gbp,stock_quantity,lead_time_days&#10;AM-MAD-180-MIR,Madrid 180cm Wardrobe,249.00,15,5..."
                className="w-full font-mono text-xs p-3 border border-[#E8E2D5] rounded-lg focus:outline-none focus:border-[#C89B3C]"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E8E2D5]">
              <button
                type="button"
                onClick={() => setUploadModalOpen(false)}
                className="px-4 py-2 border border-[#E8E2D5] text-[#4F6D7A] hover:bg-slate-50 rounded-lg text-xs font-medium"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleFileUpload}
                disabled={uploading || !uploadContent.trim()}
                className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50 transition-colors shadow-sm"
              >
                {uploading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>{uploading ? "Processing Feed..." : "Process & Update Catalog"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AMOS MANN AUTO-IMPORT & SITEMAP BATCH CATALOG MODAL */}
      {importUrlModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white border border-[#E8E2D5] rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-4 max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D5]">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-[#C89B3C]" />
                <h3 className="font-serif font-bold text-lg text-[#0B132B]">
                  Amos Mann Dropship Catalog Importer
                </h3>
              </div>
              <button
                onClick={() => setImportUrlModalOpen(false)}
                className="text-[#4F6D7A] hover:text-[#0B132B]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Switch Tabs */}
            <div className="flex border-b border-[#E8E2D5] gap-2">
              <button
                type="button"
                onClick={() => setImportMode("sitemap")}
                className={`flex items-center gap-2 pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all ${
                  importMode === "sitemap"
                    ? "border-[#C89B3C] text-[#0B132B]"
                    : "border-transparent text-[#7A8B99] hover:text-[#0B132B]"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-[#C89B3C]" />
                <span>⚡ Auto-Discover Live Sitemap ({sitemapData?.totalInSitemap || 310} SKUs)</span>
              </button>

              <button
                type="button"
                onClick={() => setImportMode("manual")}
                className={`flex items-center gap-2 pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all ${
                  importMode === "manual"
                    ? "border-[#C89B3C] text-[#0B132B]"
                    : "border-transparent text-[#7A8B99] hover:text-[#0B132B]"
                }`}
              >
                <ListPlus className="w-3.5 h-3.5 text-[#C89B3C]" />
                <span>🔗 Paste URLs (Single or Multiple)</span>
              </button>
            </div>

            {/* TAB 1: SITEMAP AUTO-DISCOVERY */}
            {importMode === "sitemap" && (
              <div className="flex-1 flex flex-col overflow-hidden space-y-3">
                {/* Stats Bar */}
                <div className="grid grid-cols-3 gap-2 bg-[#FAF8F5] p-3 rounded-lg border border-[#E8E2D5] text-center text-xs">
                  <div>
                    <div className="text-[11px] text-[#4F6D7A]">Live on Supplier Site</div>
                    <div className="font-serif font-bold text-base text-[#0B132B]">
                      {sitemapData ? sitemapData.totalInSitemap : "310"} Products
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-emerald-700">Already in Catalog</div>
                    <div className="font-serif font-bold text-base text-emerald-800">
                      {sitemapData ? sitemapData.alreadyImportedCount : "—"} SKUs
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-[#C89B3C]">Available to Import</div>
                    <div className="font-serif font-bold text-base text-[#C89B3C]">
                      {sitemapData ? sitemapData.availableToImportCount : "—"} New
                    </div>
                  </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <div className="relative flex-1 w-full">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#7A8B99]" />
                    <input
                      type="text"
                      placeholder="Filter by product name or slug..."
                      value={sitemapSearch}
                      onChange={(e) => setSitemapSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs border border-[#E8E2D5] rounded-lg focus:outline-none focus:border-[#C89B3C]"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => {
                        const available = (sitemapData?.products || [])
                          .filter((p) => !p.is_imported)
                          .filter((p) =>
                            sitemapSearch ? p.slug.toLowerCase().includes(sitemapSearch.toLowerCase()) : true
                          )
                          .map((p) => p.url);
                        setSelectedSitemapUrls(available);
                      }}
                      className="text-xs px-2.5 py-1.5 bg-[#FAF8F5] hover:bg-[#E8E2D5] border border-[#E8E2D5] rounded-lg font-medium text-[#0B132B]"
                    >
                      Select All New
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedSitemapUrls([])}
                      className="text-xs px-2.5 py-1.5 text-[#7A8B99] hover:text-[#0B132B]"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Product List Scroll Area */}
                <div className="flex-1 overflow-y-auto border border-[#E8E2D5] rounded-lg divide-y divide-[#E8E2D5] max-h-56 bg-white">
                  {loadingSitemap ? (
                    <div className="p-8 text-center text-xs text-[#7A8B99] flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-[#C89B3C]" />
                      <span>Scanning live amosmannfurniture.co.uk sitemap...</span>
                    </div>
                  ) : !sitemapData || sitemapData.products.length === 0 ? (
                    <div className="p-8 text-center text-xs text-[#7A8B99]">
                      No products found.
                    </div>
                  ) : (
                    sitemapData.products
                      .filter((p) =>
                        sitemapCategoryFilter === "all" ? true : p.category_id === sitemapCategoryFilter
                      )
                      .filter((p) =>
                        sitemapSearch ? p.slug.toLowerCase().includes(sitemapSearch.toLowerCase()) : true
                      )
                      .map((p) => {
                        const isSelected = selectedSitemapUrls.includes(p.url);
                        const cleanName = p.slug
                          .replace(/---[0-9]+(-[0-9]+)?-p\.asp$/i, "")
                          .replace(/-/g, " ")
                          .replace(/\b\w/g, (c) => c.toUpperCase());

                        return (
                          <label
                            key={p.url}
                            className={`flex items-center justify-between p-2.5 hover:bg-slate-50 cursor-pointer text-xs transition-colors ${
                              p.is_imported ? "bg-slate-50/60 opacity-60" : isSelected ? "bg-amber-50/50" : ""
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0 pr-2">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                disabled={p.is_imported}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedSitemapUrls((prev) => [...prev, p.url]);
                                  } else {
                                    setSelectedSitemapUrls((prev) => prev.filter((u) => u !== p.url));
                                  }
                                }}
                                className="rounded text-[#C89B3C] focus:ring-[#C89B3C]"
                              />
                              <div className="truncate">
                                <div className="font-medium text-[#0B132B] truncate">{cleanName}</div>
                                <div className="text-[10px] text-[#7A8B99] truncate font-mono">{p.url}</div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#F4F1EA] text-[#0B132B]">
                                {p.category_label}
                              </span>
                              {p.is_imported ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-800 flex items-center gap-1">
                                  <Check className="w-3 h-3" /> Already Imported
                                </span>
                              ) : (
                                <span className="text-[10px] text-[#C89B3C] font-medium">Ready</span>
                              )}
                            </div>
                          </label>
                        );
                      })
                  )}
                </div>

                {/* Batch Options */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#0B132B] mb-1">
                      Target Store Category
                    </label>
                    <select
                      value={newAmosCategory}
                      onChange={(e) => setNewAmosCategory(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-[#E8E2D5] rounded-lg text-xs focus:outline-none focus:border-[#C89B3C]"
                    >
                      <option value="cat_beds">Luxury Beds & Wardrobes</option>
                      <option value="cat_living">Living & Tables</option>
                      <option value="cat_dining">Dining Tables & Chairs</option>
                      <option value="cat_sofas">Sofas & Lounges</option>
                      <option value="cat_armchairs">Accent Armchairs</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#0B132B] mb-1">
                      UK White-Glove Delivery Tier
                    </label>
                    <select
                      value={newAmosDeliveryTier}
                      onChange={(e) => setNewAmosDeliveryTier(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-[#E8E2D5] rounded-lg text-xs focus:outline-none focus:border-[#C89B3C]"
                    >
                      <option value="two_man_white_glove">Two-Man White Glove (£45)</option>
                      <option value="pallet">Pallet Delivery (£30)</option>
                      <option value="standard_parcel">Standard Parcel (£15)</option>
                    </select>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-[#E8E2D5]">
                  <div className="text-xs text-[#4F6D7A]">
                    <strong>{selectedSitemapUrls.length}</strong> products selected
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setImportUrlModalOpen(false)}
                      className="px-3.5 py-1.5 border border-[#E8E2D5] text-[#4F6D7A] hover:bg-slate-50 rounded-lg text-xs font-medium"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={handleBatchImportSitemap}
                      disabled={importingUrl || selectedSitemapUrls.length === 0}
                      className="inline-flex items-center gap-2 px-5 py-2 bg-[#C89B3C] hover:bg-[#B38728] text-white rounded-lg text-xs font-semibold disabled:opacity-50 transition-colors shadow-sm"
                    >
                      {importingUrl ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {importingUrl
                          ? `Extracting (${selectedSitemapUrls.length})...`
                          : `Batch Import (${selectedSitemapUrls.length}) Products`}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: MANUAL URL(S) PASTE */}
            {importMode === "manual" && (
              <form onSubmit={handleImportAmosUrl} className="space-y-4">
                <p className="text-xs text-[#4F6D7A]">
                  Paste one or more Amos Mann URLs (one per line). The engine will extract live CDN images, dimensions, trade prices, calculate retail prices with 20% VAT, and add them to your catalog.
                </p>

                <div>
                  <label className="block text-xs font-semibold text-[#0B132B] mb-1.5">
                    Amos Mann URLs (One per line or single URL)
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="https://www.amosmannfurniture.co.uk/venice-alpine-white-bedside---2394-2394-p.asp&#10;https://www.amosmannfurniture.co.uk/madrid-wardrobe-internal-drawers---2428-2428-p.asp"
                    value={newAmosUrl}
                    onChange={(e) => setNewAmosUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E8E2D5] rounded-lg font-mono text-xs focus:outline-none focus:border-[#C89B3C]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#0B132B] mb-1.5">
                      Category
                    </label>
                    <select
                      value={newAmosCategory}
                      onChange={(e) => setNewAmosCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-[#E8E2D5] rounded-lg text-xs focus:outline-none focus:border-[#C89B3C]"
                    >
                      <option value="cat_beds">Luxury Beds & Wardrobes</option>
                      <option value="cat_living">Living & Tables</option>
                      <option value="cat_dining">Dining Tables & Chairs</option>
                      <option value="cat_sofas">Sofas & Lounges</option>
                      <option value="cat_armchairs">Accent Armchairs</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#0B132B] mb-1.5">
                      UK Delivery Tier
                    </label>
                    <select
                      value={newAmosDeliveryTier}
                      onChange={(e) => setNewAmosDeliveryTier(e.target.value)}
                      className="w-full px-3 py-2 border border-[#E8E2D5] rounded-lg text-xs focus:outline-none focus:border-[#C89B3C]"
                    >
                      <option value="two_man_white_glove">Two-Man White Glove (£45)</option>
                      <option value="pallet">Pallet Delivery (£30)</option>
                      <option value="standard_parcel">Standard Parcel (£15)</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E8E2D5]">
                  <button
                    type="button"
                    onClick={() => setImportUrlModalOpen(false)}
                    className="px-4 py-2 border border-[#E8E2D5] text-[#4F6D7A] hover:bg-slate-50 rounded-lg text-xs font-medium"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={importingUrl || !newAmosUrl.trim()}
                    className="inline-flex items-center gap-2 px-5 py-2 bg-[#C89B3C] hover:bg-[#B38728] text-white rounded-lg text-xs font-semibold disabled:opacity-50 transition-colors shadow-sm"
                  >
                    {importingUrl ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    <span>{importingUrl ? "Extracting & Importing..." : "Extract & Add to Catalog"}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
