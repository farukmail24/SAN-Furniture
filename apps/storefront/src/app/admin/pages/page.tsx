"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  LayoutTemplate,
  Save,
  RotateCcw,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  Search,
  Sliders,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Layers,
  Home,
  Menu,
  ShieldCheck,
  Truck,
  CreditCard,
  FileText,
  Clock,
  ArrowRight,
  RefreshCw,
  Info,
  Plus,
  Trash2,
  Code2,
  Check,
  X,
  HelpCircle,
  User,
  ShoppingBag,
  ListFilter,
  Tag,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { apiUrl } from "@/lib/api-config";
import { invalidateCache } from "@/lib/api-cache";
import { DEFAULT_STOREFRONT_SECTIONS } from "@/lib/cms-defaults";
import { MediaPickerModal } from "@/components/admin/MediaPickerModal";
import { MegaMenuEditor } from "@/components/admin/MegaMenuEditor";
import type { CatalogProduct } from "@/lib/catalog";

function getAdminAuthHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("san_admin_token") : null;
  const headers: Record<string, string> = { ...extraHeaders };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

interface SectionRecord {
  id: string;
  pageKey: string;
  sectionKey: string;
  sectionName: string;
  isEnabled: boolean;
  sortOrder: number;
  content: Record<string, any>;
  updatedAt?: string;
}

interface PageTabDef {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  desc: string;
  liveUrl: string;
  color: string;
}

const PAGE_TABS: PageTabDef[] = [
  {
    key: "home",
    label: "Homepage",
    icon: Home,
    desc: "Hero showcase, trust strip, room filters, curated living suite, promotional deals & homeowners reviews",
    liveUrl: "/",
    color: "brass",
  },
  {
    key: "header",
    label: "Header & Sticky Controls",
    icon: Menu,
    desc: "Sticky navigation behavior, desktop & mobile mega menu, delivery announcement strip, phone hotline & search prompts",
    liveUrl: "/",
    color: "brass",
  },
  {
    key: "footer",
    label: "Footer & Assurance",
    icon: ShieldCheck,
    desc: "Customer trust pillars, brand bio story, customer care hours & verified payment badges",
    liveUrl: "/",
    color: "navy",
  },
  {
    key: "catalog",
    label: "Catalog & Collections",
    icon: Layers,
    desc: "Catalog page banner, architectural curations, zero-state messaging & facet filter labels",
    liveUrl: "/catalog",
    color: "forest",
  },
  {
    key: "product_detail",
    label: "Product Detail (PDP)",
    icon: ShoppingBag,
    desc: "Product value badges, delivery timeframe notice, room clearance guidelines & warranty perks",
    liveUrl: "/products/sandringham-large-sofa",
    color: "navy",
  },
  {
    key: "cart",
    label: "Basket & Cart Drawer",
    icon: ShoppingBag,
    desc: "Free Mainland UK delivery progress threshold banner & quality trust guarantees",
    liveUrl: "/catalog",
    color: "brass",
  },
  {
    key: "checkout",
    label: "UK Secure Checkout",
    icon: CreditCard,
    desc: "Safe & secure checkout header assurance, Stripe SSL encryption & delivery guidance",
    liveUrl: "/checkout",
    color: "forest",
  },
  {
    key: "about",
    label: "About Us & Heritage",
    icon: Sparkles,
    desc: "Heritage story, durable craftsmanship studio notes & FSC certified sustainable timber commitments",
    liveUrl: "/about",
    color: "navy",
  },
  {
    key: "delivery_returns",
    label: "Delivery & Returns",
    icon: Truck,
    desc: "3-tier delivery logistics guide, Mainland UK dispatch & customer satisfaction terms",
    liveUrl: "/delivery",
    color: "forest",
  },
  {
    key: "contact_faq",
    label: "Contact & FAQs",
    icon: HelpCircle,
    desc: "Concierge contact numbers, Leicester warehouse address & searchable UK furniture FAQ accordions",
    liveUrl: "/contact",
    color: "brass",
  },
  {
    key: "account",
    label: "Client Account Portal",
    icon: User,
    desc: "Client portal greeting banner, VIP client privileges, and delivery booking help shortcut",
    liveUrl: "/account",
    color: "navy",
  },
];

// Helper to turn snake_case or camelCase into clean human readable Title
function formatFieldLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

export default function AdminPagesCustomizer() {
  const [activePage, setActivePage] = useState<string>("home");

  // Sync tab with URL query parameter ?tab=... (e.g. /admin/pages?tab=header or ?tab=footer)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const checkTab = () => {
        const params = new URLSearchParams(window.location.search);
        const tabParam = params.get("tab") || params.get("page");
        if (tabParam && PAGE_TABS.some((t) => t.key === tabParam)) {
          setActivePage(tabParam);
        }
      };
      checkTab();
      window.addEventListener("popstate", checkTab);
      return () => window.removeEventListener("popstate", checkTab);
    }
  }, []);

  const handleSelectPage = (key: string) => {
    setActivePage(key);
    if (typeof window !== "undefined" && window.history.pushState) {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", key);
      window.history.pushState({}, "", url.toString());
    }
  };

  const [sections, setSections] = useState<SectionRecord[]>([]);
  const [originalSections, setOriginalSections] = useState<Record<string, SectionRecord>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [resettingKey, setResettingKey] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});
  const [rawJsonModal, setRawJsonModal] = useState<{ sectionKey: string; jsonText: string } | null>(null);
  const [addingFieldTo, setAddingFieldTo] = useState<string | null>(null);
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldType, setNewFieldType] = useState<"text" | "textarea" | "number" | "boolean">("text");
  const [heroProducts, setHeroProducts] = useState<CatalogProduct[]>([]);
  const [heroProductsLoading, setHeroProductsLoading] = useState(true);
  const [heroProductsError, setHeroProductsError] = useState<string | null>(null);
  const [isHeroBackgroundPickerOpen, setIsHeroBackgroundPickerOpen] = useState(false);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadHeroProducts = async () => {
    setHeroProductsLoading(true);
    setHeroProductsError(null);
    try {
      let productList: CatalogProduct[] = [];

      // Primary attempt: /api/products?refresh=true&all=true
      try {
        const res = await fetch(apiUrl("/api/products?refresh=true&all=true"));
        if (res.ok) {
          const text = await res.text();
          const data = JSON.parse(text);
          if (Array.isArray(data.products) && data.products.length > 0) {
            productList = data.products;
          }
        }
      } catch {}

      // Fallback attempt: /api/admin/products
      if (productList.length === 0) {
        try {
          const adminRes = await fetch(apiUrl("/api/admin/products"), {
            headers: getAdminAuthHeaders(),
            credentials: "include",
          });
          if (adminRes.ok) {
            const adminText = await adminRes.text();
            const adminData = JSON.parse(adminText);
            if (Array.isArray(adminData.products) && adminData.products.length > 0) {
              productList = adminData.products.map((p: any) => ({
                id: p.id,
                title: p.title,
                handle: p.handle,
                thumbnailUrl: p.thumbnailUrl || p.thumbnail_url || "",
                pricePennies: Number(p.pricePennies || p.price_pennies) || 0,
                status: p.status,
              } as CatalogProduct));
            }
          }
        } catch {}
      }

      if (productList.length > 0) {
        setHeroProducts(productList);
      } else {
        setHeroProductsError("No products found in catalog. Verify database connection.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setHeroProductsError(message);
    } finally {
      setHeroProductsLoading(false);
    }
  };

  const loadSections = async () => {
    try {
      setLoading(true);
      const res = await fetch(apiUrl("/api/admin/content/sections"), {
        headers: getAdminAuthHeaders(),
        credentials: "include",
      });
      const text = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(text.replace(/<[^>]+>/g, " ").trim().slice(0, 120) || `Server error (${res.status})`);
      }

      if (!res.ok) {
        throw new Error(data.error || `CMS sections request failed (${res.status})`);
      }
      if (!Array.isArray(data.sections)) {
        throw new Error("CMS sections response is invalid");
      }

      const normalizedSections = data.sections.map((section: SectionRecord) => {
        const defaultSec = DEFAULT_STOREFRONT_SECTIONS[section.sectionKey];
        const isHeaderMain = section.sectionKey === "header_main";
        return {
          ...section,
          sectionName: isHeaderMain
            ? "Header Navigation & Sticky Controls"
            : defaultSec?.sectionName || section.sectionName,
          content: {
            ...(defaultSec?.content || {}),
            ...(section.content || {}),
          },
        };
      });
      setSections(normalizedSections);
      // Keep a baseline copy for dirty tracking
      const origMap: Record<string, SectionRecord> = {};
      const initialExpanded: Record<string, boolean> = {};
      normalizedSections.forEach((s: SectionRecord) => {
        origMap[s.sectionKey] = JSON.parse(JSON.stringify(s));
        initialExpanded[s.sectionKey] = true;
      });
      setOriginalSections(origMap);
      setExpandedKeys(initialExpanded);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      showToast("Failed to load page sections: " + message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSections();
    loadHeroProducts();
  }, []);

  const toggleExpand = (sectionKey: string) => {
    setExpandedKeys((prev) => ({ ...prev, [sectionKey]: !prev[sectionKey] }));
  };

  const handleExpandAll = (expand: boolean) => {
    const next: Record<string, boolean> = {};
    sections.forEach((s) => {
      if (s.pageKey === activePage) {
        next[s.sectionKey] = expand;
      }
    });
    setExpandedKeys((prev) => ({ ...prev, ...next }));
  };

  // Check if section is dirty
  const isSectionDirty = (sec: SectionRecord) => {
    const orig = originalSections[sec.sectionKey];
    if (!orig) return false;
    return (
      sec.isEnabled !== orig.isEnabled ||
      sec.sectionName !== orig.sectionName ||
      sec.sortOrder !== orig.sortOrder ||
      JSON.stringify(sec.content) !== JSON.stringify(orig.content)
    );
  };

  const handleToggleEnabled = async (sec: SectionRecord) => {
    const nextEnabled = !sec.isEnabled;
    setSections((prev) =>
      prev.map((s) => (s.sectionKey === sec.sectionKey ? { ...s, isEnabled: nextEnabled } : s))
    );

    try {
      const res = await fetch(apiUrl(`/api/admin/content/sections/${sec.sectionKey}`), {
        method: "PUT",
        headers: getAdminAuthHeaders({ "Content-Type": "application/json" }),
        credentials: "include",
        body: JSON.stringify({ isEnabled: nextEnabled, content: sec.content }),
      });
      const text = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch {
        data = { error: text.replace(/<[^>]+>/g, " ").trim().slice(0, 120) || `Server error (${res.status})` };
      }

      if (res.ok && data.success !== false) {
        setOriginalSections((prev) => ({
          ...prev,
          [sec.sectionKey]: {
            ...prev[sec.sectionKey],
            isEnabled: nextEnabled,
          },
        }));
        showToast(
          `Section "${sec.sectionName}" is now ${nextEnabled ? "PUBLISHED on storefront" : "HIDDEN (Draft mode)"}`
        );
      } else {
        throw new Error(data.error || "Server rejected visibility update");
      }
    } catch (err: any) {
      setSections((prev) =>
        prev.map((s) => (s.sectionKey === sec.sectionKey ? { ...s, isEnabled: sec.isEnabled } : s))
      );
      showToast("Error updating visibility: " + (err?.message || "Unknown error"), "error");
    }
  };

  const handleFieldChange = (sectionKey: string, fieldKey: string, value: any) => {
    setSections((prev) =>
      prev.map((s) => {
        if (s.sectionKey === sectionKey) {
          return {
            ...s,
            content: {
              ...s.content,
              [fieldKey]: value,
            },
          };
        }
        return s;
      })
    );
  };

  const handleNestedArrayItemChange = (
    sectionKey: string,
    arrayKey: string,
    index: number,
    subField: string,
    value: any
  ) => {
    setSections((prev) =>
      prev.map((s) => {
        if (s.sectionKey === sectionKey) {
          const arr = Array.isArray(s.content[arrayKey]) ? [...s.content[arrayKey]] : [];
          if (arr[index]) {
            arr[index] = { ...arr[index], [subField]: value };
          }
          return {
            ...s,
            content: {
              ...s.content,
              [arrayKey]: arr,
            },
          };
        }
        return s;
      })
    );
  };

  const handleAddArrayItem = (sectionKey: string, arrayKey: string) => {
    setSections((prev) =>
      prev.map((s) => {
        if (s.sectionKey === sectionKey) {
          const arr = Array.isArray(s.content[arrayKey]) ? [...s.content[arrayKey]] : [];
          // Clone structure from first item if exists, with blank values
          let newItem: any = {};
          if (arr.length > 0 && typeof arr[0] === "object" && arr[0] !== null) {
            for (const k of Object.keys(arr[0])) {
              newItem[k] = "";
            }
            if ("title" in newItem) newItem.title = "New Item Title";
          } else {
            newItem = { title: "New Item", description: "" };
          }
          arr.push(newItem);
          return {
            ...s,
            content: {
              ...s.content,
              [arrayKey]: arr,
            },
          };
        }
        return s;
      })
    );
  };

  const handleRemoveArrayItem = (sectionKey: string, arrayKey: string, index: number) => {
    if (!window.confirm(`Delete item #${index + 1}?`)) return;
    setSections((prev) =>
      prev.map((s) => {
        if (s.sectionKey === sectionKey) {
          const arr = Array.isArray(s.content[arrayKey]) ? [...s.content[arrayKey]] : [];
          arr.splice(index, 1);
          return {
            ...s,
            content: {
              ...s.content,
              [arrayKey]: arr,
            },
          };
        }
        return s;
      })
    );
  };

  const handleStringArrayItemChange = (
    sectionKey: string,
    arrayKey: string,
    index: number,
    value: string
  ) => {
    setSections((prev) =>
      prev.map((s) => {
        if (s.sectionKey === sectionKey) {
          const arr = Array.isArray(s.content[arrayKey]) ? [...s.content[arrayKey]] : [];
          arr[index] = value;
          return {
            ...s,
            content: {
              ...s.content,
              [arrayKey]: arr,
            },
          };
        }
        return s;
      })
    );
  };

  const handleAddStringArrayItem = (sectionKey: string, arrayKey: string) => {
    setSections((prev) =>
      prev.map((s) => {
        if (s.sectionKey === sectionKey) {
          const arr = Array.isArray(s.content[arrayKey]) ? [...s.content[arrayKey]] : [];
          arr.push("New Entry");
          return {
            ...s,
            content: {
              ...s.content,
              [arrayKey]: arr,
            },
          };
        }
        return s;
      })
    );
  };

  const handleRemoveStringArrayItem = (sectionKey: string, arrayKey: string, index: number) => {
    setSections((prev) =>
      prev.map((s) => {
        if (s.sectionKey === sectionKey) {
          const arr = Array.isArray(s.content[arrayKey]) ? [...s.content[arrayKey]] : [];
          arr.splice(index, 1);
          return {
            ...s,
            content: {
              ...s.content,
              [arrayKey]: arr,
            },
          };
        }
        return s;
      })
    );
  };

  const handleAddFieldSubmit = (sectionKey: string) => {
    if (!newFieldName.trim()) return;
    const key = newFieldName.trim().toLowerCase().replace(/\s+/g, "_");
    let initialVal: any = "";
    if (newFieldType === "number") initialVal = 0;
    if (newFieldType === "boolean") initialVal = true;
    if (newFieldType === "textarea") initialVal = "";

    handleFieldChange(sectionKey, key, initialVal);
    setNewFieldName("");
    setAddingFieldTo(null);
    showToast(`Added custom field "${key}" to ${sectionKey}`);
  };

  const handleSaveSection = async (sec: SectionRecord) => {
    setSavingKey(sec.sectionKey);
    try {
      const res = await fetch(apiUrl(`/api/admin/content/sections/${sec.sectionKey}`), {
        method: "PUT",
        headers: getAdminAuthHeaders({ "Content-Type": "application/json" }),
        credentials: "include",
        body: JSON.stringify({
          isEnabled: sec.isEnabled,
          content: sec.content,
          sectionName: sec.sectionName,
          sortOrder: sec.sortOrder,
        }),
      });
      const text = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch {
        const cleanPreview = text.replace(/<[^>]+>/g, " ").trim().slice(0, 120);
        data = { error: cleanPreview || `Server error (${res.status})` };
      }

      if (res.ok && data.success !== false) {
        setOriginalSections((prev) => ({
          ...prev,
          [sec.sectionKey]: JSON.parse(JSON.stringify(sec)),
        }));
        // Invalidate all SWR memory and session caches immediately
        invalidateCache("/api/content/sections");
        invalidateCache("/api/admin/content/sections");
        if (typeof window !== "undefined") {
          try {
            for (let i = sessionStorage.length - 1; i >= 0; i--) {
              const k = sessionStorage.key(i);
              if (k && k.includes("content/sections")) {
                sessionStorage.removeItem(k);
              }
            }
            localStorage.setItem("san_cms_last_update", String(Date.now()));
            window.dispatchEvent(new CustomEvent("san_cms_updated", { detail: sec }));
          } catch {}
        }
        showToast(`"${sec.sectionName}" saved and live on storefront!`);
      } else {
        showToast(data.error || data.details || "Failed to save section.", "error");
      }
    } catch (err: any) {
      showToast("Error saving section: " + (err?.message || "Unknown error"), "error");
    } finally {
      setSavingKey(null);
    }
  };

  const handleResetSection = async (sec: SectionRecord) => {
    if (
      !window.confirm(
        `Restore "${sec.sectionName}" to official factory defaults? Any custom modifications will be reverted.`
      )
    ) {
      return;
    }
    setResettingKey(sec.sectionKey);
    try {
      const res = await fetch(apiUrl(`/api/admin/content/sections/${sec.sectionKey}/reset`), {
        method: "POST",
        headers: getAdminAuthHeaders(),
        credentials: "include",
      });
      const text = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch {
        const cleanPreview = text.replace(/<[^>]+>/g, " ").trim().slice(0, 120);
        data = { error: cleanPreview || `Server error (${res.status})` };
      }

      if (res.ok && data.section) {
        setSections((prev) =>
          prev.map((s) =>
            s.sectionKey === sec.sectionKey
              ? { ...s, content: data.section.content, isEnabled: data.section.isEnabled }
              : s
          )
        );
        setOriginalSections((prev) => ({
          ...prev,
          [sec.sectionKey]: {
            ...sec,
            content: data.section.content,
            isEnabled: data.section.isEnabled,
          },
        }));
        invalidateCache("/api/content/sections");
        invalidateCache("/api/admin/content/sections");
        if (typeof window !== "undefined") {
          try {
            for (let i = sessionStorage.length - 1; i >= 0; i--) {
              const k = sessionStorage.key(i);
              if (k && k.includes("content/sections")) {
                sessionStorage.removeItem(k);
              }
            }
            localStorage.setItem("san_cms_last_update", String(Date.now()));
            window.dispatchEvent(new CustomEvent("san_cms_updated", { detail: sec }));
          } catch {}
        }
        showToast(`"${sec.sectionName}" restored to factory defaults.`);
      } else {
        showToast(data.error || "Failed to reset section.", "error");
      }
    } catch (err: any) {
      showToast("Error resetting section: " + (err?.message || "Unknown error"), "error");
    } finally {
      setResettingKey(null);
    }
  };

  const handleSaveRawJson = (sectionKey: string, jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr);
      setSections((prev) =>
        prev.map((s) => (s.sectionKey === sectionKey ? { ...s, content: parsed } : s))
      );
      setRawJsonModal(null);
      showToast(`Updated content from raw JSON for "${sectionKey}". Click Save to persist.`);
    } catch (err: any) {
      alert("Invalid JSON: " + err.message);
    }
  };

  // Filter sections for display
  const pageSections = useMemo(() => {
    return sections.filter((s) => {
      const matchesPage = s.pageKey === activePage;
      if (!matchesPage) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        s.sectionName.toLowerCase().includes(q) ||
        s.sectionKey.toLowerCase().includes(q) ||
        JSON.stringify(s.content).toLowerCase().includes(q)
      );
    });
  }, [sections, activePage, searchQuery]);

  // Counts per page
  const pageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    PAGE_TABS.forEach((t) => {
      counts[t.key] = sections.filter((s) => s.pageKey === t.key).length;
    });
    return counts;
  }, [sections]);

  // Check if all visible sections on current page are expanded
  const areAllExpanded = useMemo(() => {
    if (pageSections.length === 0) return true;
    return pageSections.every((s) => expandedKeys[s.sectionKey] !== false);
  }, [pageSections, expandedKeys]);

  const currentTab = PAGE_TABS.find((t) => t.key === activePage) || PAGE_TABS[0];

  return (
    <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6 antialiased text-[#00072D]">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 text-xs font-semibold animate-fade-in border ${
            toastMessage.type === "success"
              ? "bg-[#00072D] text-sand-50 border-brass-500/50"
              : "bg-terracotta-900 text-white border-terracotta-700"
          }`}
        >
          {toastMessage.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-terracotta-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Raw JSON Modal */}
      {rawJsonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-sand-300 shadow-2xl max-w-2xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-sand-200">
              <div className="flex items-center gap-2">
                <Code2 className="w-5 h-5 text-brass-600" />
                <h3 className="text-sm font-bold text-navy-950">
                  Raw JSON Inspector • {rawJsonModal.sectionKey}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRawJsonModal(null)}
                className="p-1 rounded-lg text-navy-500 hover:bg-sand-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-navy-600">
              Directly edit or copy this section&apos;s JSON payload. Changes will apply immediately to the form.
            </p>
            <textarea
              rows={16}
              value={rawJsonModal.jsonText}
              onChange={(e) =>
                setRawJsonModal((prev) => (prev ? { ...prev, jsonText: e.target.value } : null))
              }
              className="w-full p-3 font-mono text-xs bg-sand-50 border border-sand-300 rounded-xl focus:outline-none focus:border-brass-600 text-navy-900"
            />
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRawJsonModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-navy-700 hover:bg-sand-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveRawJson(rawJsonModal.sectionKey, rawJsonModal.jsonText)}
                className="px-5 py-2 rounded-xl bg-navy-950 hover:bg-brass-700 text-sand-50 text-xs font-bold transition-all shadow"
              >
                Apply JSON to Form
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page Title & Mission Control Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-sand-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-brass-100 text-brass-700 flex items-center justify-center font-bold">
              <LayoutTemplate className="w-4 h-4" />
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-navy-950">
              Frontend Page Management (CMS)
            </h1>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-sage-50 text-sage-800 border border-sage-600/30 ml-2">
              Live DB Synced
            </span>
          </div>
          <p className="text-xs text-navy-600 max-w-2xl">
            Complete page-by-page control over all 11 storefront views. Edit copy, delivery claims, trust
            badges, guarantees, images, and CTAs live with 0ms in-memory cache.
          </p>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadSections}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl border border-sand-300 text-navy-800 hover:text-navy-950 hover:bg-sand-100 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-brass-600" : ""}`} />
            <span>Refresh All</span>
          </button>

          <a
            href={currentTab.liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl bg-brass-500 hover:bg-brass-400 text-navy-950 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
          >
            <span>View Live Page</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* All 11 Page Selector Tabs (Responsive Multi-Row Flex Layout) */}
      <div className="bg-sand-100/70 p-2 rounded-2xl border border-sand-200">
        <div className="text-[11px] font-bold text-navy-500 uppercase tracking-wider px-2 py-1 mb-1">
          Select Page / View ({PAGE_TABS.length} Active Modules):
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {PAGE_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activePage === tab.key;
            const count = pageCounts[tab.key] ?? 0;
            const isGlobal = tab.key === "header" || tab.key === "footer";
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleSelectPage(tab.key)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#00072D] text-sand-50 shadow-md ring-1 ring-brass-500/40"
                    : "text-navy-700 hover:text-navy-950 hover:bg-white/80 bg-white/40"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-brass-400" : isGlobal ? "text-brass-600" : "text-navy-500"}`} />
                <span>{tab.label}</span>
                {isGlobal && (
                  <span
                    className={`text-[8px] font-black uppercase px-1 rounded tracking-wider ${
                      isActive ? "bg-brass-400 text-navy-950" : "bg-amber-100 text-amber-800 border border-amber-300"
                    }`}
                  >
                    Global
                  </span>
                )}
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? "bg-brass-500/20 text-brass-300" : "bg-sand-200 text-navy-600"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Tab Info & Section Quick Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-sand-300 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-sand-100 text-brass-700 shrink-0">
            {React.createElement(currentTab.icon, { className: "w-5 h-5" })}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-navy-950">{currentTab.label} Components</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sand-100 text-navy-700">
                page_key: &quot;{currentTab.key}&quot;
              </span>
            </div>
            <p className="text-xs text-navy-500 mt-0.5">{currentTab.desc}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Search Within Page */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-navy-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search components & text..."
              className="pl-8 pr-3 py-1.5 text-xs bg-sand-50 rounded-xl border border-sand-300 focus:outline-none focus:border-brass-600 focus:bg-white w-56 font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-navy-400 hover:text-navy-900"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Single Dynamic Expand / Collapse Toggle Button */}
          <div className="flex items-center border-l border-sand-200 pl-3">
            <button
              type="button"
              onClick={() => handleExpandAll(!areAllExpanded)}
              title={areAllExpanded ? "Collapse All Sections" : "Expand All Sections"}
              aria-label={areAllExpanded ? "Collapse All Sections" : "Expand All Sections"}
              className={`p-2 rounded-xl transition-all cursor-pointer border ${
                areAllExpanded
                  ? "text-navy-700 hover:text-navy-950 hover:bg-sand-100 border-sand-300 bg-sand-50"
                  : "text-brass-800 bg-brass-50 hover:bg-brass-100 border-brass-200 shadow-xs"
              }`}
            >
              {areAllExpanded ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Homepage Quick Helper to Sticky Controls */}
      {activePage === "home" && !loading && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-brass-50 via-sand-50 to-white border border-brass-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-navy-950 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#00072D] text-brass-400 flex items-center justify-center shrink-0">
              <Sliders className="w-4 h-4 text-brass-400" />
            </div>
            <div>
              <span className="font-bold block text-navy-950">Looking to configure Header Sticky Navigation or Mega Menu?</span>
              <span className="text-[11px] text-navy-600">
                You can toggle sticky scroll pinning, smart reveal on scroll, and the top delivery strip under the Header tab.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleSelectPage("header")}
            className="px-4 py-2 rounded-xl bg-[#00072D] text-sand-50 font-bold hover:bg-brass-700 transition-colors shrink-0 text-xs flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <span>Open Header &amp; Sticky Controls</span>
            <ArrowRight className="w-3.5 h-3.5 text-brass-400" />
          </button>
        </div>
      )}

      {/* Top Prominent Sticky Header Navigation Executive Panel (Active on Header Tab) */}
      {activePage === "header" && !loading && (() => {
        const headerMainSec = sections.find((s) => s.sectionKey === "header_main");
        if (!headerMainSec) return null;
        const isSticky = headerMainSec.content.is_sticky ?? true;
        const stickyBehavior = headerMainSec.content.sticky_behavior || "always";
        const isSaving = savingKey === "header_main";
        const isDirty = isSectionDirty(headerMainSec);

        return (
          <div className="rounded-2xl border-2 border-brass-400 bg-white p-5 sm:p-6 shadow-md space-y-5 animate-fade-in ring-1 ring-brass-500/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-sand-200">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#00072D] text-brass-400 flex items-center justify-center shrink-0 shadow-sm">
                  <Sliders className="w-5 h-5 text-brass-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-navy-950">
                      Header Sticky Navigation Controls
                    </h3>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase ${
                        isSticky && stickyBehavior !== "static"
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : "bg-sand-200 text-navy-700 border border-sand-300"
                      }`}
                    >
                      {isSticky && stickyBehavior !== "static"
                        ? stickyBehavior === "scroll_up"
                          ? "Smart Reveal Sticky"
                          : "Always Pinned Sticky"
                        : "Static Header (No Sticky)"}
                    </span>
                    {isDirty && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        Unsaved Edits
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-navy-600 mt-0.5">
                    Configure how the storefront top navigation bar behaves as customers scroll through catalogs and product collections.
                  </p>
                </div>
              </div>

              {/* Direct Save Button */}
              <button
                type="button"
                onClick={() => handleSaveSection(headerMainSec)}
                disabled={isSaving}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer shrink-0 ${
                  isDirty
                    ? "bg-brass-600 hover:bg-brass-700 text-navy-950 ring-2 ring-brass-400"
                    : "bg-[#00072D] hover:bg-brass-700 text-sand-50"
                }`}
              >
                <Save className={`w-4 h-4 ${isSaving ? "animate-spin" : isDirty ? "text-navy-950" : "text-brass-400"}`} />
                <span>{isSaving ? "Saving..." : isDirty ? "Save Sticky Settings" : "Saved Live"}</span>
              </button>
            </div>

            {/* 1. Master Sticky Toggle */}
            <div className="p-4 rounded-xl bg-sand-50 border border-sand-200 flex items-center justify-between shadow-xs">
              <div>
                <span className="text-xs font-bold text-navy-950 block">
                  Enable Sticky Header Navigation
                </span>
                <span className="text-[11px] text-navy-600">
                  Keep the header navigation bar visible at top as shoppers scroll down the page
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const nextVal = !isSticky;
                  handleFieldChange("header_main", "is_sticky", nextVal);
                  if (!nextVal) {
                    handleFieldChange("header_main", "sticky_behavior", "static");
                  } else if (stickyBehavior === "static") {
                    handleFieldChange("header_main", "sticky_behavior", "always");
                  }
                }}
                role="switch"
                aria-checked={isSticky}
                aria-label="Enable Sticky Header Navigation"
                className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                  isSticky ? "bg-emerald-600" : "bg-sand-400"
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    isSticky ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* 2. Scroll Behavior Modes */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-navy-950 block">Sticky Scroll Behavior Mode</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    id: "always",
                    title: "Always Sticky",
                    desc: "Continuously pinned at top of viewport during upward & downward scrolling",
                  },
                  {
                    id: "scroll_up",
                    title: "Smart Reveal",
                    desc: "Hides on downward scroll to view products; slides down when scrolling up",
                  },
                  {
                    id: "static",
                    title: "Static Flow",
                    desc: "Normal document flow; header scrolls away with page content",
                  },
                ].map((mode) => {
                  const currentMode = !isSticky ? "static" : stickyBehavior;
                  const isSelected = currentMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => {
                        if (mode.id === "static") {
                          handleFieldChange("header_main", "is_sticky", false);
                          handleFieldChange("header_main", "sticky_behavior", "static");
                        } else {
                          handleFieldChange("header_main", "is_sticky", true);
                          handleFieldChange("header_main", "sticky_behavior", mode.id);
                        }
                      }}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? "border-navy-950 bg-navy-950 text-sand-50 shadow-sm"
                          : "border-sand-200 bg-white text-navy-900 hover:border-sand-400"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold">{mode.title}</span>
                        <div
                          className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                            isSelected ? "border-brass-400 bg-brass-400" : "border-sand-300"
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-navy-950" />}
                        </div>
                      </div>
                      <p className={`text-[11px] leading-tight ${isSelected ? "text-sand-200" : "text-navy-600"}`}>
                        {mode.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Top Announcement Bar Collapse */}
            <div className="p-4 rounded-xl bg-sand-50 border border-sand-200 flex items-center justify-between shadow-xs">
              <div>
                <span className="text-xs font-bold text-navy-950 block">Auto-Collapse Top Proposition Bar on Scroll</span>
                <span className="text-[11px] text-navy-600">
                  Hides the dark delivery announcement strip when scrolling to keep header slim on mobile and desktop
                </span>
              </div>
              <button
                type="button"
                onClick={() =>
                  handleFieldChange(
                    "header_main",
                    "hide_topbar_on_scroll",
                    !headerMainSec.content.hide_topbar_on_scroll
                  )
                }
                role="switch"
                aria-checked={Boolean(headerMainSec.content.hide_topbar_on_scroll)}
                aria-label="Auto-Collapse Top Proposition Bar on Scroll"
                className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                  Boolean(headerMainSec.content.hide_topbar_on_scroll) ? "bg-emerald-600" : "bg-sand-400"
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    Boolean(headerMainSec.content.hide_topbar_on_scroll) ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        );
      })()}

      {/* Sections List */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-sand-300 p-12 text-center text-navy-600">
          <RefreshCw className="w-8 h-8 text-brass-600 animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-navy-950">Loading page layout components...</p>
        </div>
      ) : pageSections.length === 0 ? (
        <div className="bg-white rounded-2xl border border-sand-300 p-12 text-center text-navy-600">
          <Info className="w-8 h-8 text-brass-600 mx-auto mb-2 opacity-60" />
          <h3 className="text-sm font-bold text-navy-950">No sections found</h3>
          <p className="text-xs text-navy-500 mt-1">
            Try clearing your search query or selecting another page tab.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {pageSections.map((sec) => {
            const isExpanded = expandedKeys[sec.sectionKey] !== false;
            const isSaving = savingKey === sec.sectionKey;
            const isResetting = resettingKey === sec.sectionKey;
            const isDirty = isSectionDirty(sec);

            return (
              <div
                key={sec.sectionKey}
                className={`bg-white rounded-2xl border transition-all shadow-sm ${
                  sec.isEnabled ? "border-sand-300" : "border-sand-200 bg-sand-50/40 opacity-85"
                } ${isDirty ? "ring-2 ring-amber-400/50" : ""}`}
              >
                {/* Section Top Header */}
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-sand-200 bg-sand-50/40">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => toggleExpand(sec.sectionKey)}
                      aria-label="Toggle section expansion"
                      className="p-1.5 rounded-lg bg-sand-200/70 hover:bg-sand-300 text-navy-700 transition-colors cursor-pointer"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-navy-950">{sec.sectionName}</h3>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sand-200 text-navy-700 border border-sand-300">
                          {sec.sectionKey}
                        </span>
                        {isDirty && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            Unsaved edits
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-navy-500 mt-0.5">
                        Page: <span className="font-semibold capitalize text-navy-700">{sec.pageKey}</span> • Sequence: #{sec.sortOrder}
                      </p>
                    </div>
                  </div>

                  {/* Quick Controls: Toggle & Action Buttons */}
                  <div className="flex items-center gap-2.5 flex-wrap">
                    {/* Active Switch */}
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-sand-300">
                      <span
                        className={`text-[11px] font-semibold ${
                          sec.isEnabled ? "text-sage-800" : "text-navy-500"
                        }`}
                      >
                        {sec.isEnabled ? "Published" : "Hidden"}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleEnabled(sec)}
                        role="switch"
                        aria-checked={sec.isEnabled}
                        aria-label={`Section ${sec.isEnabled ? "published" : "hidden"}`}
                        className={`w-9 h-5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors ${
                          sec.isEnabled ? "bg-sage-700" : "bg-sand-400"
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                            sec.isEnabled ? "translate-x-4" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>

                    {/* Raw JSON Button */}
                    <button
                      type="button"
                      onClick={() =>
                        setRawJsonModal({
                          sectionKey: sec.sectionKey,
                          jsonText: JSON.stringify(sec.content, null, 2),
                        })
                      }
                      title="Inspect / Edit Raw JSON Payload"
                      className="px-2.5 py-1.5 rounded-xl border border-sand-300 text-navy-700 hover:text-navy-950 hover:bg-sand-100 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Code2 className="w-3.5 h-3.5 text-navy-600" />
                      <span className="hidden sm:inline">JSON</span>
                    </button>

                    {/* Reset Button */}
                    <button
                      type="button"
                      onClick={() => handleResetSection(sec)}
                      disabled={isResetting}
                      title="Reset section to factory default content"
                      className="px-2.5 py-1.5 rounded-xl border border-sand-300 text-navy-700 hover:text-navy-950 hover:bg-sand-100 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? "animate-spin" : ""}`} />
                      <span className="hidden sm:inline">Reset</span>
                    </button>

                    {/* Save Button */}
                    <button
                      type="button"
                      onClick={() => handleSaveSection(sec)}
                      disabled={isSaving}
                      className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass-600 focus-visible:ring-offset-2 ${
                        isDirty
                          ? "bg-sage-700 hover:bg-sage-800 text-white"
                          : "bg-navy-950 hover:bg-brass-700 text-sand-50"
                      }`}
                    >
                      <Save className={`w-3.5 h-3.5 ${isSaving ? "animate-spin" : isDirty ? "text-white" : "text-brass-400"}`} />
                      <span>{isSaving ? "Saving..." : isDirty ? "Save Changes" : "Saved"}</span>
                    </button>
                  </div>
                </div>

                {/* Section Form Fields (Collapsible Body) */}
                {isExpanded && (
                  <div className="p-5 sm:p-6 space-y-6 bg-white">
                    {sec.sectionKey === "header_mega_menu" ? (
                      <MegaMenuEditor
                        content={sec.content as any}
                        onChange={(updatedContent) => {
                          setSections((prev) =>
                            prev.map((s) =>
                              s.sectionKey === "header_mega_menu"
                                ? { ...s, content: updatedContent }
                                : s
                            )
                          );
                        }}
                      />
                    ) : (
                      <>
                        {sec.sectionKey === "header_main" && (
                          <div className="space-y-5 rounded-2xl border border-brass-300 bg-sand-50/80 p-4 sm:p-5 shadow-xs">
                            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-sand-200">
                              <div>
                                <div className="flex items-center gap-2">
                                  <Sliders className="w-4 h-4 text-brass-600" />
                                  <h4 className="text-sm font-bold text-navy-950">Header Sticky Navigation Controls</h4>
                                  <span
                                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase ${
                                      (sec.content.is_sticky ?? true) && (sec.content.sticky_behavior || "always") !== "static"
                                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                        : "bg-sand-200 text-navy-700 border border-sand-300"
                                    }`}
                                  >
                                    {(sec.content.is_sticky ?? true) && (sec.content.sticky_behavior || "always") !== "static"
                                      ? sec.content.sticky_behavior === "scroll_up"
                                        ? "Smart Reveal Sticky"
                                        : "Always Pinned Sticky"
                                      : "Static Header (No Sticky)"}
                                  </span>
                                </div>
                                <p className="mt-1 text-xs text-navy-600">
                                  Configure how the main SAN Furniture navigation bar behaves as customers scroll through the storefront.
                                </p>
                              </div>
                            </div>

                            {/* 1. Master Sticky Toggle */}
                            <div className="p-3.5 rounded-xl bg-white border border-sand-200 flex items-center justify-between shadow-xs">
                              <div>
                                <span className="text-xs font-bold text-navy-950 block">Enable Sticky Header Navigation</span>
                                <span className="text-[11px] text-navy-600">
                                  Keep the header navigation bar visible at top as shoppers scroll down the page
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const nextVal = !(sec.content.is_sticky ?? true);
                                  handleFieldChange(sec.sectionKey, "is_sticky", nextVal);
                                  if (!nextVal) {
                                    handleFieldChange(sec.sectionKey, "sticky_behavior", "static");
                                  } else if (sec.content.sticky_behavior === "static") {
                                    handleFieldChange(sec.sectionKey, "sticky_behavior", "always");
                                  }
                                }}
                                role="switch"
                                aria-checked={sec.content.is_sticky ?? true}
                                aria-label="Enable Sticky Header Navigation"
                                className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                                  (sec.content.is_sticky ?? true) ? "bg-emerald-600" : "bg-sand-400"
                                }`}
                              >
                                <div
                                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                                    (sec.content.is_sticky ?? true) ? "translate-x-6" : "translate-x-0"
                                  }`}
                                />
                              </button>
                            </div>

                            {/* 2. Scroll Behavior Modes */}
                            <div className="space-y-2">
                              <label className="text-xs font-bold text-navy-950 block">Sticky Scroll Behavior Mode</label>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {[
                                  {
                                    id: "always",
                                    title: "Always Sticky",
                                    desc: "Continuously pinned at top of viewport during upward & downward scrolling",
                                  },
                                  {
                                    id: "scroll_up",
                                    title: "Smart Reveal",
                                    desc: "Hides on downward scroll to view products; slides down when scrolling up",
                                  },
                                  {
                                    id: "static",
                                    title: "Static Flow",
                                    desc: "Normal document flow; header scrolls away with page content",
                                  },
                                ].map((mode) => {
                                  const currentMode =
                                    !(sec.content.is_sticky ?? true)
                                      ? "static"
                                      : sec.content.sticky_behavior || "always";
                                  const isSelected = currentMode === mode.id;
                                  return (
                                    <button
                                      key={mode.id}
                                      type="button"
                                      onClick={() => {
                                        if (mode.id === "static") {
                                          handleFieldChange(sec.sectionKey, "is_sticky", false);
                                          handleFieldChange(sec.sectionKey, "sticky_behavior", "static");
                                        } else {
                                          handleFieldChange(sec.sectionKey, "is_sticky", true);
                                          handleFieldChange(sec.sectionKey, "sticky_behavior", mode.id);
                                        }
                                      }}
                                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                                        isSelected
                                          ? "border-navy-950 bg-navy-950 text-sand-50 shadow-sm"
                                          : "border-sand-200 bg-white text-navy-900 hover:border-sand-400"
                                      }`}
                                    >
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs font-bold">{mode.title}</span>
                                        <div
                                          className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                                            isSelected ? "border-brass-400 bg-brass-400" : "border-sand-300"
                                          }`}
                                        >
                                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-navy-950" />}
                                        </div>
                                      </div>
                                      <p className={`text-[11px] leading-tight ${isSelected ? "text-sand-200" : "text-navy-600"}`}>
                                        {mode.desc}
                                      </p>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* 3. Top Announcement Bar Collapse */}
                            <div className="p-3.5 rounded-xl bg-white border border-sand-200 flex items-center justify-between shadow-xs">
                              <div>
                                <span className="text-xs font-bold text-navy-950 block">Auto-Collapse Top Proposition Bar on Scroll</span>
                                <span className="text-[11px] text-navy-600">
                                  Hides the dark delivery announcement strip when scrolling to keep header slim on mobile and desktop
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  handleFieldChange(
                                    sec.sectionKey,
                                    "hide_topbar_on_scroll",
                                    !sec.content.hide_topbar_on_scroll
                                  )
                                }
                                role="switch"
                                aria-checked={Boolean(sec.content.hide_topbar_on_scroll)}
                                aria-label="Auto-Collapse Top Proposition Bar on Scroll"
                                className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                                  sec.content.hide_topbar_on_scroll ? "bg-emerald-600" : "bg-sand-400"
                                }`}
                              >
                                <div
                                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                                    sec.content.hide_topbar_on_scroll ? "translate-x-6" : "translate-x-0"
                                  }`}
                                />
                              </button>
                            </div>
                          </div>
                        )}

                        {sec.sectionKey === "home_hero" && (
                      <div className="space-y-5 rounded-2xl border border-sand-200 bg-sand-50/70 p-4 sm:p-5">
                        <div>
                          <h4 className="text-sm font-bold text-navy-950">Hero product showcase</h4>
                          <p className="mt-1 text-xs text-navy-600">
                            Choose the three products shown in the homepage hero. Empty slots automatically use the next available product.
                          </p>
                        </div>

                        {heroProductsError && (
                          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-terracotta-200 bg-terracotta-50 px-3 py-2.5 text-xs text-terracotta-900">
                            <span>Could not load product choices: {heroProductsError}</span>
                            <button
                              type="button"
                              onClick={loadHeroProducts}
                              disabled={heroProductsLoading}
                              className="rounded-lg border border-terracotta-300 px-3 py-1.5 font-semibold hover:bg-white disabled:opacity-50"
                            >
                              {heroProductsLoading ? "Loading..." : "Retry"}
                            </button>
                          </div>
                        )}

                        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                          {[1, 2, 3].map((slot) => {
                            const fieldKey = `hero_product_${slot}_id`;
                            const selectedId = sec.content[fieldKey] || "";
                            const selectedProduct = heroProducts.find((product) => product.id === selectedId);
                            return (
                              <label key={fieldKey} className="block space-y-2 rounded-xl border border-sand-200 bg-white p-3">
                                <span className="text-xs font-bold text-navy-900">Hero product {slot}</span>
                                <select
                                  value={selectedId}
                                  onChange={(event) =>
                                    handleFieldChange(sec.sectionKey, fieldKey, event.target.value)
                                  }
                                  disabled={heroProductsLoading}
                                  className="w-full rounded-lg border border-sand-300 bg-sand-50 px-3 py-2 text-xs text-navy-900 focus:border-brass-600 focus:outline-none disabled:opacity-60"
                                >
                                  <option value="">Automatic (next available product)</option>
                                  {selectedId && !selectedProduct && (
                                    <option value={selectedId}>Selected product unavailable</option>
                                  )}
                                  {heroProducts.map((product) => (
                                    <option key={product.id} value={product.id}>
                                      {product.title}
                                    </option>
                                  ))}
                                </select>
                                {selectedProduct ? (
                                  <div className="flex items-center gap-2">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={selectedProduct.thumbnailUrl}
                                      alt=""
                                      className="h-11 w-11 rounded-lg border border-sand-200 object-cover"
                                    />
                                    <span className="line-clamp-2 text-[11px] font-medium text-navy-700">
                                      {selectedProduct.title}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="block text-[10px] text-navy-500">
                                    {heroProductsLoading ? "Loading products..." : "Uses the next available product"}
                                  </span>
                                )}
                              </label>
                            );
                          })}
                        </div>

                        <div className="border-t border-sand-200 pt-5">
                          <div className="mb-3">
                            <h4 className="text-sm font-bold text-navy-950">Hero background</h4>
                            <p className="mt-1 text-xs text-navy-600">
                              Adjust the background image and colour opacity to create a subtle watermark effect behind the content.
                            </p>
                          </div>
                          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                            <div className="space-y-2 lg:col-span-2">
                              <label className="text-xs font-bold text-navy-900">Background image</label>
                              <div className="flex flex-col gap-2 sm:flex-row">
                                <input
                                  type="url"
                                  value={sec.content.background_image_url || ""}
                                  onChange={(event) =>
                                    handleFieldChange(sec.sectionKey, "background_image_url", event.target.value)
                                  }
                                  placeholder="https://..."
                                  className="min-w-0 flex-1 rounded-lg border border-sand-300 bg-white px-3 py-2 text-xs focus:border-brass-600 focus:outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => setIsHeroBackgroundPickerOpen(true)}
                                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-sand-300 bg-white px-3 py-2 text-xs font-semibold text-navy-800 hover:bg-sand-100"
                                >
                                  <ImageIcon className="h-3.5 w-3.5 text-brass-600" />
                                  Choose from Media
                                </button>
                                {sec.content.background_image_url && (
                                  <button
                                    type="button"
                                    onClick={() => handleFieldChange(sec.sectionKey, "background_image_url", "")}
                                    className="rounded-lg border border-sand-300 bg-white px-3 py-2 text-xs font-semibold text-navy-700 hover:bg-sand-100"
                                  >
                                    Remove
                                  </button>
                                )}
                              </div>
                            </div>

                            <label className="space-y-2">
                              <span className="flex items-center justify-between text-xs font-bold text-navy-900">
                                Background image opacity
                                <span className="font-mono text-navy-600">
                                  {Math.min(100, Math.max(0, Number(sec.content.background_image_opacity) || 0))}%
                                </span>
                              </span>
                              <input
                                type="range"
                                min="0"
                                max="100"
                                step="1"
                                value={Math.min(100, Math.max(0, Number(sec.content.background_image_opacity) || 0))}
                                onChange={(event) =>
                                  handleFieldChange(sec.sectionKey, "background_image_opacity", Number(event.target.value))
                                }
                                className="w-full accent-[#b08d57]"
                              />
                            </label>

                            <div className="grid grid-cols-[auto_1fr] items-end gap-3">
                              <label className="space-y-2">
                                <span className="block text-xs font-bold text-navy-900">Background colour</span>
                                <input
                                  type="color"
                                  value={/^#[0-9a-f]{6}$/i.test(sec.content.background_color || "")
                                    ? sec.content.background_color
                                    : "#f5f1e9"}
                                  onChange={(event) =>
                                    handleFieldChange(sec.sectionKey, "background_color", event.target.value)
                                  }
                                  className="h-10 w-14 cursor-pointer rounded-lg border border-sand-300 bg-white p-1"
                                />
                              </label>
                              <label className="space-y-2">
                                <span className="flex items-center justify-between text-xs font-bold text-navy-900">
                                  Colour opacity
                                  <span className="font-mono text-navy-600">
                                    {Math.min(100, Math.max(0, Number(sec.content.background_color_opacity) || 0))}%
                                  </span>
                                </span>
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  step="1"
                                  value={Math.min(100, Math.max(0, Number(sec.content.background_color_opacity) || 0))}
                                  onChange={(event) =>
                                    handleFieldChange(sec.sectionKey, "background_color_opacity", Number(event.target.value))
                                  }
                                  className="w-full accent-[#b08d57]"
                                />
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Dynamic Schema Fields Inspector */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(sec.content).map(([fieldKey, value]) => {
                        if (
                          sec.sectionKey === "home_hero" &&
                          [
                            "hero_product_1_id",
                            "hero_product_2_id",
                            "hero_product_3_id",
                            "background_image_url",
                            "background_image_opacity",
                            "background_color",
                            "background_color_opacity",
                          ].includes(fieldKey)
                        ) {
                          return null;
                        }

                        if (
                          sec.sectionKey === "header_main" &&
                          ["is_sticky", "sticky_behavior", "hide_topbar_on_scroll"].includes(fieldKey)
                        ) {
                          return null;
                        }

                        // 1. Arrays of objects or strings
                        if (Array.isArray(value)) {
                          return null; // Rendered below in dedicated repeatable array section
                        }

                        // 2. Nested plain objects
                        if (typeof value === "object" && value !== null) {
                          return null; // Rendered in dedicated sub-object section
                        }

                        // 3. Booleans
                        if (typeof value === "boolean") {
                          return (
                            <div
                              key={fieldKey}
                              className="p-3.5 rounded-xl bg-sand-50 border border-sand-200 flex items-center justify-between"
                            >
                              <div>
                                <span className="text-xs font-bold text-navy-900 block">
                                  {formatFieldLabel(fieldKey)}
                                </span>
                                <span className="text-[10px] font-mono text-navy-500">
                                  {fieldKey} (toggle)
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleFieldChange(sec.sectionKey, fieldKey, !value)}
                                role="switch"
                                aria-checked={value}
                                aria-label={formatFieldLabel(fieldKey)}
                                className={`w-10 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                                  value ? "bg-sage-700" : "bg-sand-400"
                                }`}
                              >
                                <div
                                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                                    value ? "translate-x-4" : "translate-x-0"
                                  }`}
                                />
                              </button>
                            </div>
                          );
                        }

                        // 4. Numbers
                        if (typeof value === "number") {
                          const isProductsPerPage =
                            sec.sectionKey === "home_catalog_filter" &&
                            fieldKey === "products_per_page";
                          return (
                            <div key={fieldKey} className="space-y-1">
                              <label className="text-xs font-bold text-navy-900 block">
                                {formatFieldLabel(fieldKey)}
                              </label>
                              <div className="relative">
                                <input
                                  type="number"
                                  min={isProductsPerPage ? 1 : undefined}
                                  max={isProductsPerPage ? 100 : undefined}
                                  step={isProductsPerPage ? 1 : undefined}
                                  value={value}
                                  onChange={(e) =>
                                    handleFieldChange(
                                      sec.sectionKey,
                                      fieldKey,
                                      isProductsPerPage
                                        ? Math.min(100, Math.max(1, parseInt(e.target.value, 10) || 1))
                                        : parseFloat(e.target.value) || 0
                                    )
                                  }
                                  className="w-full px-3.5 py-2 text-xs bg-sand-50/50 rounded-xl border border-sand-300 focus:outline-none focus:border-brass-600 focus:bg-white font-mono"
                                />
                              </div>
                              <span className="text-[10px] text-navy-400 font-mono">
                                {isProductsPerPage
                                  ? "Products to show initially and in each View More batch (1-100)"
                                  : fieldKey}
                              </span>
                            </div>
                          );
                        }

                        if (
                          sec.sectionKey === "home_catalog_filter" &&
                          fieldKey === "product_sort_order"
                        ) {
                          return (
                            <div key={fieldKey} className="space-y-1">
                              <label className="text-xs font-bold text-navy-900 block">
                                Product Sort Order
                              </label>
                              <select
                                value={value}
                                onChange={(e) =>
                                  handleFieldChange(sec.sectionKey, fieldKey, e.target.value)
                                }
                                className="w-full px-3.5 py-2 text-xs bg-sand-50/50 rounded-xl border border-sand-300 focus:outline-none focus:border-brass-600 focus:bg-white"
                              >
                                <option value="desc">DESC - Newest first</option>
                                <option value="asc">ASC - Oldest first</option>
                                <option value="random">Random on each page load</option>
                              </select>
                              <span className="text-[10px] text-navy-400">
                                Newest/oldest is based on the product creation date.
                              </span>
                            </div>
                          );
                        }

                        // 5. Strings: Image URLs
                        const isImageUrl =
                          typeof value === "string" &&
                          (fieldKey.includes("image") ||
                            fieldKey.includes("img") ||
                            fieldKey.includes("thumbnail") ||
                            value.match(/\.(jpeg|jpg|gif|png|webp)($|\?)/i) ||
                            value.includes("unsplash") ||
                            value.includes("ekmcdn"));

                        if (isImageUrl) {
                          return (
                            <div
                              key={fieldKey}
                              className="space-y-2 md:col-span-2 p-4 rounded-xl bg-sand-50 border border-sand-200"
                            >
                              <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-navy-900 flex items-center gap-1.5">
                                  <ImageIcon className="w-4 h-4 text-brass-600" />
                                  <span>{formatFieldLabel(fieldKey)}</span>
                                </label>
                                <span className="text-[10px] text-navy-500 font-mono">
                                  {fieldKey} (Image CDN)
                                </span>
                              </div>
                              <div className="flex flex-col sm:flex-row items-center gap-4">
                                <input
                                  type="text"
                                  value={value || ""}
                                  onChange={(e) =>
                                    handleFieldChange(sec.sectionKey, fieldKey, e.target.value)
                                  }
                                  placeholder="https://..."
                                  className="w-full px-3.5 py-2 text-xs bg-white rounded-xl border border-sand-300 focus:outline-none focus:border-brass-600 font-mono"
                                />
                                {value && (
                                  <div className="w-20 h-14 rounded-lg overflow-hidden bg-sand-200 shrink-0 border border-sand-300 shadow-sm relative group">
                                    <img
                                      src={value}
                                      alt="Preview"
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src =
                                          "https://placehold.co/100x70?text=Invalid+Image";
                                      }}
                                    />
                                    <a
                                      href={value}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="absolute inset-0 bg-navy-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        }

                        // 6. Strings: Multi-line descriptions & long text
                        const isMultiline =
                          typeof value === "string" &&
                          (value.length > 70 ||
                            value.includes("\n") ||
                            fieldKey.includes("description") ||
                            fieldKey.includes("bio") ||
                            fieldKey.includes("lead") ||
                            fieldKey.includes("quote") ||
                            fieldKey.includes("note") ||
                            fieldKey.includes("address") ||
                            fieldKey.includes("subtext") ||
                            fieldKey.includes("clauses"));

                        if (isMultiline) {
                          return (
                            <div key={fieldKey} className="space-y-1 md:col-span-2">
                              <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-navy-900 block">
                                  {formatFieldLabel(fieldKey)}
                                </label>
                                <span className="text-[10px] text-navy-400 font-mono">
                                  {fieldKey}
                                </span>
                              </div>
                              <textarea
                                rows={3}
                                value={value || ""}
                                onChange={(e) =>
                                  handleFieldChange(sec.sectionKey, fieldKey, e.target.value)
                                }
                                className="w-full px-3.5 py-2 text-xs bg-sand-50/50 rounded-xl border border-sand-300 focus:outline-none focus:border-brass-600 focus:bg-white leading-relaxed font-sans"
                              />
                            </div>
                          );
                        }

                        // 7. Strings: Links
                        const isLink =
                          fieldKey.includes("link") ||
                          fieldKey.includes("url") ||
                          fieldKey.includes("href");

                        // 8. Standard single line text input
                        return (
                          <div
                            key={fieldKey}
                            className={`space-y-1 ${
                              fieldKey.includes("title") ||
                              fieldKey.includes("heading") ||
                              fieldKey.includes("claim")
                                ? "md:col-span-2"
                                : ""
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-bold text-navy-900 block">
                                {formatFieldLabel(fieldKey)}
                              </label>
                              <span className="text-[10px] text-navy-400 font-mono">
                                {fieldKey}
                              </span>
                            </div>
                            <input
                              type="text"
                              value={value || ""}
                              onChange={(e) =>
                                handleFieldChange(sec.sectionKey, fieldKey, e.target.value)
                              }
                              className={`w-full px-3.5 py-2 text-xs bg-sand-50/50 rounded-xl border border-sand-300 focus:outline-none focus:border-brass-600 focus:bg-white font-medium ${
                                isLink ? "font-mono" : ""
                              }`}
                            />
                          </div>
                        );
                      })}
                    </div>

                    {/* Dedicated Repeatable Array Manager (Cards, Pillars, Badges, Tiers, FAQs, Tips, Guarantees) */}
                    {Object.entries(sec.content).map(([arrayKey, arrValue]) => {
                      if (!Array.isArray(arrValue)) return null;

                      // A. Array of plain strings (e.g. story_paragraphs, policy_clauses, features)
                      if (arrValue.length === 0 || typeof arrValue[0] === "string") {
                        return (
                          <div
                            key={arrayKey}
                            className="space-y-3 pt-4 border-t border-sand-200"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Tag className="w-4 h-4 text-brass-600" />
                                <h4 className="text-xs font-bold uppercase tracking-wider text-navy-900">
                                  {formatFieldLabel(arrayKey)} ({arrValue.length} items)
                                </h4>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleAddStringArrayItem(sec.sectionKey, arrayKey)}
                                className="px-2.5 py-1 rounded-lg bg-sand-100 hover:bg-sand-200 text-navy-800 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                              >
                                <Plus className="w-3 h-3 text-brass-700" />
                                <span>Add Item</span>
                              </button>
                            </div>

                            <div className="space-y-2">
                              {arrValue.map((itemStr: string, sIdx: number) => (
                                <div key={sIdx} className="flex items-center gap-2">
                                  <span className="text-[11px] font-mono text-navy-400 w-6 text-right shrink-0">
                                    #{sIdx + 1}
                                  </span>
                                  {itemStr.length > 80 ? (
                                    <textarea
                                      rows={2}
                                      value={itemStr}
                                      onChange={(e) =>
                                        handleStringArrayItemChange(
                                          sec.sectionKey,
                                          arrayKey,
                                          sIdx,
                                          e.target.value
                                        )
                                      }
                                      className="w-full px-3 py-1.5 text-xs bg-sand-50/50 rounded-lg border border-sand-300"
                                    />
                                  ) : (
                                    <input
                                      type="text"
                                      value={itemStr}
                                      onChange={(e) =>
                                        handleStringArrayItemChange(
                                          sec.sectionKey,
                                          arrayKey,
                                          sIdx,
                                          e.target.value
                                        )
                                      }
                                      className="w-full px-3 py-1.5 text-xs bg-sand-50/50 rounded-lg border border-sand-300"
                                    />
                                  )}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleRemoveStringArrayItem(sec.sectionKey, arrayKey, sIdx)
                                    }
                                    className="p-1.5 rounded-lg text-terracotta-700 hover:bg-terracotta-50 shrink-0"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }

                      // B. Array of objects (Pillars, Cards, FAQs, Badges, Tiers, Guarantees)
                      return (
                        <div
                          key={arrayKey}
                          className="space-y-3 pt-4 border-t border-sand-200"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Layers className="w-4 h-4 text-brass-600" />
                              <h4 className="text-xs font-bold uppercase tracking-wider text-navy-900">
                                {formatFieldLabel(arrayKey)} ({arrValue.length} items)
                              </h4>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleAddArrayItem(sec.sectionKey, arrayKey)}
                              className="px-3 py-1 rounded-xl bg-sand-100 hover:bg-sand-200 text-navy-900 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5 text-brass-700" />
                              <span>Add New {formatFieldLabel(arrayKey).slice(0, -1) || "Item"}</span>
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {arrValue.map((itemObj: any, idx: number) => {
                              const itemTitle =
                                itemObj.title ||
                                itemObj.name ||
                                itemObj.question ||
                                itemObj.label ||
                                itemObj.tier ||
                                itemObj.zone ||
                                `Item #${idx + 1}`;

                              return (
                                <div
                                  key={idx}
                                  className="p-4 rounded-xl bg-sand-50/70 border border-sand-200 space-y-3 relative group"
                                >
                                  {/* Item Header */}
                                  <div className="flex items-center justify-between border-b border-sand-200/80 pb-2">
                                    <span className="text-[11px] font-bold text-navy-900 truncate">
                                      #{idx + 1} • {itemTitle}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleRemoveArrayItem(sec.sectionKey, arrayKey, idx)
                                      }
                                      className="p-1 rounded-md text-navy-400 hover:text-terracotta-700 hover:bg-terracotta-50 transition-colors"
                                      title="Remove this item"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>

                                  {/* Item Subfields */}
                                  <div className="space-y-2">
                                    {Object.entries(itemObj).map(([subK, subV]) => {
                                      const isSubDesc =
                                        subK === "description" ||
                                        subK === "answer" ||
                                        subK === "story";
                                      return (
                                        <div key={subK} className="space-y-0.5">
                                          <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold uppercase text-navy-500">
                                              {formatFieldLabel(subK)}
                                            </span>
                                            <span className="text-[9px] font-mono text-navy-400">
                                              {subK}
                                            </span>
                                          </div>
                                          {isSubDesc ? (
                                            <textarea
                                              rows={2}
                                              value={(subV as string) || ""}
                                              onChange={(e) =>
                                                handleNestedArrayItemChange(
                                                  sec.sectionKey,
                                                  arrayKey,
                                                  idx,
                                                  subK,
                                                  e.target.value
                                                )
                                              }
                                              className="w-full px-2.5 py-1.5 text-xs bg-white rounded-lg border border-sand-300 focus:outline-none focus:border-brass-600"
                                            />
                                          ) : (
                                            <input
                                              type="text"
                                              value={(subV as string) || ""}
                                              onChange={(e) =>
                                                handleNestedArrayItemChange(
                                                  sec.sectionKey,
                                                  arrayKey,
                                                  idx,
                                                  subK,
                                                  e.target.value
                                                )
                                              }
                                              className="w-full px-2.5 py-1.5 text-xs bg-white rounded-lg border border-sand-300 focus:outline-none focus:border-brass-600 font-medium"
                                            />
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}

                    {/* Add Custom Field Popover / Action */}
                    <div className="pt-2 border-t border-sand-200">
                      {addingFieldTo === sec.sectionKey ? (
                        <div className="p-3.5 rounded-xl bg-sand-100/60 border border-sand-300 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-navy-950">
                              Add Custom Field to &quot;{sec.sectionName}&quot;
                            </span>
                            <button
                              type="button"
                              onClick={() => setAddingFieldTo(null)}
                              className="text-navy-500 hover:text-navy-950"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="flex flex-col sm:flex-row items-center gap-2">
                            <input
                              type="text"
                              value={newFieldName}
                              onChange={(e) => setNewFieldName(e.target.value)}
                              placeholder="Field key name (e.g. promo_banner_text)"
                              className="w-full sm:flex-1 px-3 py-1.5 text-xs bg-white rounded-lg border border-sand-300"
                            />
                            <select
                              value={newFieldType}
                              onChange={(e) => setNewFieldType(e.target.value as any)}
                              className="w-full sm:w-32 px-3 py-1.5 text-xs bg-white rounded-lg border border-sand-300"
                            >
                              <option value="text">Text</option>
                              <option value="textarea">Textarea</option>
                              <option value="number">Number</option>
                              <option value="boolean">Toggle</option>
                            </select>
                            <button
                              type="button"
                              onClick={() => handleAddFieldSubmit(sec.sectionKey)}
                              className="w-full sm:w-auto px-4 py-1.5 rounded-lg bg-navy-950 text-sand-50 text-xs font-semibold hover:bg-brass-700"
                            >
                              Confirm
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setAddingFieldTo(sec.sectionKey);
                            setNewFieldName("");
                          }}
                          className="text-[11px] font-semibold text-brass-700 hover:text-brass-800 flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Custom Content Field</span>
                        </button>
                      )}
                    </div>
                  </>
                )}

                    {/* Bottom Save Bar inside section */}
                    <div className="pt-4 border-t border-sand-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="text-[11px] text-navy-500 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          Last updated:{" "}
                          {sec.updatedAt
                            ? new Date(sec.updatedAt).toLocaleTimeString("en-GB", {
                                hour: "2-digit",
                                minute: "2-digit",
                                day: "numeric",
                                month: "short",
                              })
                            : "Factory default"}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleSaveSection(sec)}
                          disabled={isSaving}
                          className={`w-full sm:w-auto px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass-600 focus-visible:ring-offset-2 ${
                            isDirty
                              ? "bg-sage-700 hover:bg-sage-800 text-white"
                              : "bg-[#00072D] hover:bg-brass-700 text-sand-50"
                          }`}
                        >
                          <Save
                            className={`w-3.5 h-3.5 ${
                              isSaving ? "animate-spin" : isDirty ? "text-white" : "text-brass-400"
                            }`}
                          />
                          <span>
                            {isSaving
                              ? "Publishing to Storefront..."
                              : isDirty
                              ? "Publish Section Updates *"
                              : "Published to Storefront"}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      <MediaPickerModal
        isOpen={isHeroBackgroundPickerOpen}
        onClose={() => setIsHeroBackgroundPickerOpen(false)}
        onSelect={(url) => handleFieldChange("home_hero", "background_image_url", url)}
        currentUrl={
          sections.find((section) => section.sectionKey === "home_hero")?.content.background_image_url
        }
        title="Select Hero Background Image"
        buttonLabel="Use as Hero Background"
      />
    </div>
  );
}
