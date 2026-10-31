"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Tag,
  Plus,
  CheckCircle2,
  Trash2,
  Percent,
  Calendar,
  ChevronRight,
  X,
  Sparkles,
  Copy,
  Edit2,
  Clock,
  UserCheck,
  ShieldAlert,
  ArrowRight,
  Check,
  PoundSterling,
  AlertCircle
} from "lucide-react";
import { DataTable, ColumnDef } from "@/components/admin/DataTable";
import { formatGBP } from "@san-furniture/types";
import { apiUrl } from "@/lib/api-config";
import { showAlert, showConfirm } from "@/components/ui/AlertModal";
import { fetchWithSwr, invalidateCache } from "@/lib/api-cache";

interface PromotionItem {
  id: string;
  code: string;
  description: string;
  discount_type: "percentage" | "fixed_pennies";
  discount_value: number;
  max_discount_pennies?: number | null;
  min_order_pennies: number;
  is_active: number;
  starts_at?: string | null;
  expires_at?: string | null;
  usage_count: number;
  max_uses: number;
  per_customer_limit?: number;
  first_order_only?: number;
  total_savings_pennies?: number;
  created_at: string;
}

type TabFilter = "all" | "active" | "paused" | "expired";

export default function AdminPromotionsPage() {
  const [promotions, setPromotions] = useState<PromotionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabFilter>("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromotionItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [formCode, setFormCode] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formDiscountType, setFormDiscountType] = useState<"percentage" | "fixed_pennies">("percentage");
  const [formDiscountValue, setFormDiscountValue] = useState("15");
  const [formMaxDiscountGbp, setFormMaxDiscountGbp] = useState("");
  const [formMinOrderGbp, setFormMinOrderGbp] = useState("300.00");
  const [formMaxUses, setFormMaxUses] = useState("1000");
  const [formPerCustomerLimit, setFormPerCustomerLimit] = useState("1");
  const [formFirstOrderOnly, setFormFirstOrderOnly] = useState(false);
  const [formStartsAt, setFormStartsAt] = useState("");
  const [formExpiresAt, setFormExpiresAt] = useState("");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const getAuthHeaders = useCallback((includeJson = true) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("san_admin_token") : null;
    const headers: Record<string, string> = {};
    if (includeJson) headers["Content-Type"] = "application/json";
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return headers;
  }, []);

  const fetchPromotions = useCallback(async () => {
    try {
      setLoading(true);
      const authHeaders = getAuthHeaders(false);
      await fetchWithSwr(
        apiUrl("/api/admin/promotions"),
        (data: any) => {
          if (data && data.promotions) {
            setPromotions(data.promotions);
            setLoading(false);
          }
        },
        { headers: authHeaders, credentials: "include" }
      );
    } catch (err) {
      console.error("Failed to fetch promotions:", err);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    fetchPromotions();
  }, [fetchPromotions]);

  const handleCopyCode = (code: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedCode(code);
      showToast(`Voucher code "${code}" copied to clipboard!`);
      setTimeout(() => setCopiedCode(null), 2500);
    }
  };

  const handleGenerateRandomCode = () => {
    const prefixes = ["SAN", "VIP", "LUXURY", "HERITAGE", "SUMMER", "AUTUMN", "WINTER", "SPRING"];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const val = formDiscountType === "percentage" ? (formDiscountValue || "20") : "50";
    const randSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    setFormCode(`${prefix}${val}-${randSuffix}`);
  };

  const resetForm = () => {
    setFormCode("");
    setFormDescription("");
    setFormDiscountType("percentage");
    setFormDiscountValue("15");
    setFormMaxDiscountGbp("");
    setFormMinOrderGbp("300.00");
    setFormMaxUses("1000");
    setFormPerCustomerLimit("1");
    setFormFirstOrderOnly(false);
    setFormStartsAt("");
    setFormExpiresAt("");
    setEditingPromo(null);
  };

  const openCreateModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const openEditModal = (promo: PromotionItem) => {
    setEditingPromo(promo);
    setFormCode(promo.code);
    setFormDescription(promo.description);
    setFormDiscountType(promo.discount_type);
    setFormDiscountValue(
      promo.discount_type === "percentage"
        ? String(promo.discount_value)
        : (promo.discount_value / 100).toFixed(2)
    );
    setFormMaxDiscountGbp(
      promo.max_discount_pennies ? (promo.max_discount_pennies / 100).toFixed(2) : ""
    );
    setFormMinOrderGbp(
      promo.min_order_pennies ? (promo.min_order_pennies / 100).toFixed(2) : "0.00"
    );
    setFormMaxUses(String(promo.max_uses || 1000));
    setFormPerCustomerLimit(String(promo.per_customer_limit || 1));
    setFormFirstOrderOnly(Boolean(promo.first_order_only));
    setFormStartsAt(promo.starts_at ? new Date(promo.starts_at).toISOString().slice(0, 16) : "");
    setFormExpiresAt(promo.expires_at ? new Date(promo.expires_at).toISOString().slice(0, 16) : "");
    setIsAddModalOpen(true);
  };

  const handleSavePromotion = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const minPennies = Math.round(parseFloat(formMinOrderGbp || "0") * 100);
      let discVal = parseFloat(formDiscountValue);
      if (formDiscountType === "fixed_pennies") {
        discVal = Math.round(discVal * 100);
      }
      const maxDiscPennies = formMaxDiscountGbp ? Math.round(parseFloat(formMaxDiscountGbp) * 100) : null;

      const payload = {
        code: formCode,
        description: formDescription,
        discountType: formDiscountType,
        discountValue: discVal,
        maxDiscountPennies: maxDiscPennies,
        minOrderPennies: minPennies,
        maxUses: parseInt(formMaxUses, 10) || 1000,
        perCustomerLimit: parseInt(formPerCustomerLimit, 10) || 1,
        firstOrderOnly: formFirstOrderOnly ? 1 : 0,
        startsAt: formStartsAt ? new Date(formStartsAt).toISOString() : null,
        expiresAt: formExpiresAt ? new Date(formExpiresAt).toISOString() : null,
        isActive: 1,
      };

      let res: Response;
      if (editingPromo) {
        res = await fetch(apiUrl(`/api/admin/promotions/${editingPromo.id}`), {
          method: "PATCH",
          headers: getAuthHeaders(true),
          credentials: "include",
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(apiUrl("/api/admin/promotions"), {
          method: "POST",
          headers: getAuthHeaders(true),
          credentials: "include",
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to save promotion");
      }

      invalidateCache("/api/admin/promotions");
      showToast(
        editingPromo
          ? `Voucher "${formCode.toUpperCase()}" updated successfully!`
          : `Voucher "${formCode.toUpperCase()}" created and active!`
      );
      setIsAddModalOpen(false);
      resetForm();
      await fetchPromotions();
    } catch (err: any) {
      await showAlert({ title: "Promotion Error", message: err.message, type: "danger" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (promo: PromotionItem) => {
    const nextState = promo.is_active ? 0 : 1;
    try {
      const res = await fetch(apiUrl(`/api/admin/promotions/${promo.id}`), {
        method: "PATCH",
        headers: getAuthHeaders(true),
        credentials: "include",
        body: JSON.stringify({ isActive: nextState }),
      });
      if (!res.ok) throw new Error("Failed to update status");

      invalidateCache("/api/admin/promotions");
      setPromotions((prev) =>
        prev.map((p) => (p.id === promo.id ? { ...p, is_active: nextState } : p))
      );
      showToast(`Voucher "${promo.code}" is now ${nextState ? "ACTIVE" : "PAUSED"}.`);
    } catch (err: any) {
      await showAlert({ title: "Status Error", message: err.message, type: "danger" });
    }
  };

  const handleDeletePromotion = async (promoId: string, code: string) => {
    const ok = await showConfirm({
      title: "Delete Coupon",
      message: `Are you sure you want to permanently delete voucher "${code}"? Customers will no longer be able to redeem it.`,
      confirmText: "Delete Voucher",
      type: "danger",
    });
    if (!ok) return;

    try {
      const res = await fetch(apiUrl(`/api/admin/promotions/${promoId}`), {
        method: "DELETE",
        headers: getAuthHeaders(false),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete voucher");

      invalidateCache("/api/admin/promotions");
      setPromotions((prev) => prev.filter((p) => p.id !== promoId));
      showToast(`Voucher "${code}" removed from database.`);
    } catch (err: any) {
      await showAlert({ title: "Delete Error", message: err.message, type: "danger" });
    }
  };

  // Filtered promotions
  const filteredPromotions = useMemo(() => {
    const now = new Date();
    return promotions.filter((p) => {
      const isExpired = p.expires_at ? new Date(p.expires_at) < now : false;
      if (activeTab === "active") return p.is_active && !isExpired;
      if (activeTab === "paused") return !p.is_active;
      if (activeTab === "expired") return isExpired;
      return true;
    });
  }, [promotions, activeTab]);

  // Aggregate stats
  const stats = useMemo(() => {
    const now = new Date();
    const total = promotions.length;
    const active = promotions.filter((p) => p.is_active && (!p.expires_at || new Date(p.expires_at) >= now)).length;
    const redeemed = promotions.reduce((sum, p) => sum + (Number(p.usage_count) || 0), 0);
    const savings = promotions.reduce((sum, p) => sum + (Number(p.total_savings_pennies) || 0), 0);
    return { total, active, redeemed, savings };
  }, [promotions]);

  const columns: ColumnDef<PromotionItem>[] = useMemo(
    () => [
      {
        key: "code",
        header: "Voucher Code",
        sortable: true,
        cell: (p) => {
          const isCopied = copiedCode === p.code;
          return (
            <div className="flex items-center gap-1.5 group">
              <span className="font-mono font-bold text-navy-950 bg-sand-200/80 border border-sand-300 px-2 py-0.5 rounded text-xs tracking-wider">
                {p.code}
              </span>
              <button
                type="button"
                onClick={() => handleCopyCode(p.code)}
                className="p-1 rounded text-navy-400 hover:text-brass-700 hover:bg-sand-200 transition-colors opacity-70 group-hover:opacity-100"
                title="Copy voucher code"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          );
        },
      },
      {
        key: "description",
        header: "Offer & Rules",
        cell: (p) => (
          <div className="space-y-1 max-w-sm">
            <p className="text-xs text-navy-900 font-medium line-clamp-1">{p.description}</p>
            <div className="flex flex-wrap gap-1 text-[10px]">
              {Boolean(p.first_order_only) && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-semibold border border-amber-200">
                  <UserCheck className="w-2.5 h-2.5" /> 1st Order Only
                </span>
              )}
              {p.per_customer_limit && p.per_customer_limit > 0 && (
                <span className="px-1.5 py-0.2 rounded bg-sand-200 text-navy-700 font-medium">
                  Max {p.per_customer_limit} / customer
                </span>
              )}
            </div>
          </div>
        ),
      },
      {
        key: "discount_value",
        header: "Discount Value",
        sortable: true,
        cell: (p) => {
          const isPercent = p.discount_type === "percentage";
          const label = isPercent ? `${p.discount_value}% OFF` : `${formatGBP(p.discount_value)} OFF`;
          return (
            <div>
              <span className="font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full text-xs">
                {label}
              </span>
              {isPercent && p.max_discount_pennies && p.max_discount_pennies > 0 && (
                <span className="block text-[10px] text-navy-500 mt-0.5">
                  Max {formatGBP(p.max_discount_pennies)}
                </span>
              )}
            </div>
          );
        },
      },
      {
        key: "min_order_pennies",
        header: "Min Spend",
        sortable: true,
        cell: (p) => (
          <span className="text-navy-900 font-semibold text-xs">
            {p.min_order_pennies > 0 ? formatGBP(p.min_order_pennies) : "No minimum"}
          </span>
        ),
      },
      {
        key: "usage_count",
        header: "Redemptions",
        sortable: true,
        cell: (p) => {
          const cap = p.max_uses || 1000;
          const pct = Math.min(100, Math.round(((p.usage_count || 0) / cap) * 100));
          return (
            <div className="w-24">
              <div className="flex justify-between text-[11px] mb-1">
                <span className="font-bold text-navy-950">{p.usage_count || 0}</span>
                <span className="text-navy-400">/ {cap}</span>
              </div>
              <div className="w-full h-1.5 bg-sand-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${pct >= 90 ? "bg-red-500" : "bg-brass-500"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        },
      },
      {
        key: "validity",
        header: "Validity Window",
        cell: (p) => {
          const now = new Date();
          const isExpired = p.expires_at ? new Date(p.expires_at) < now : false;
          const isUpcoming = p.starts_at ? new Date(p.starts_at) > now : false;

          if (isExpired) {
            return (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                <Clock className="w-2.5 h-2.5" /> Expired
              </span>
            );
          }
          if (isUpcoming) {
            return (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                <Calendar className="w-2.5 h-2.5" /> Starts Soon
              </span>
            );
          }
          if (p.expires_at) {
            const exp = new Date(p.expires_at).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
            });
            return <span className="text-[11px] text-navy-700 font-medium">Until {exp}</span>;
          }
          return <span className="text-[11px] text-emerald-700 font-semibold">Always Active</span>;
        },
      },
      {
        key: "is_active",
        header: "Status",
        sortable: true,
        cell: (p) => (
          <button
            type="button"
            onClick={() => handleToggleStatus(p)}
            className="inline-flex items-center gap-1.5 focus:outline-none cursor-pointer"
            title="Click to toggle active status"
          >
            {p.is_active ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full hover:bg-emerald-200 transition-colors">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-navy-500 bg-sand-200 px-2.5 py-0.5 rounded-full hover:bg-sand-300 transition-colors">
                Paused
              </span>
            )}
          </button>
        ),
      },
      {
        key: "actions",
        header: "Actions",
        cell: (p) => (
          <div className="flex items-center justify-end gap-1">
            <button
              type="button"
              onClick={() => openEditModal(p)}
              className="p-1.5 rounded-lg text-navy-600 hover:text-navy-950 hover:bg-sand-200 transition-colors"
              title="Edit voucher parameters"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleDeletePromotion(p.id, p.code)}
              className="p-1.5 rounded-lg text-red-600 hover:text-red-800 hover:bg-red-50 transition-colors"
              title="Delete voucher"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ),
      },
    ],
    [copiedCode]
  );

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-navy-950 text-sand-50 text-xs font-semibold flex items-center gap-3 shadow-2xl animate-fade-in border border-sand-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-navy-500 mb-1">
            <Link href="/admin" className="hover:text-navy-950">Operations Suite</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="font-semibold text-navy-900">Promotions &amp; Coupons</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-navy-950">
            UK Seasonal Promotions &amp; Voucher Engine
          </h1>
          <p className="text-xs text-navy-600 mt-1">
            Configure Bank Holiday codes, percentage discounts, minimum order thresholds, and usage caps
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brass-500 to-brass-600 hover:from-brass-400 hover:to-brass-500 text-navy-950 font-bold text-xs tracking-wide shadow-md shadow-brass-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Voucher</span>
        </button>
      </div>

      {/* Metric KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-sand-50 border border-sand-200 shadow-sm">
          <span className="text-[11px] font-semibold text-navy-600 uppercase tracking-wider">Total Vouchers</span>
          <p className="text-2xl font-display font-bold text-navy-950 mt-1">{stats.total}</p>
        </div>
        <div className="p-4 rounded-xl bg-sand-50 border border-sand-200 shadow-sm">
          <span className="text-[11px] font-semibold text-navy-600 uppercase tracking-wider">Active Campaigns</span>
          <p className="text-2xl font-display font-bold text-emerald-700 mt-1">{stats.active}</p>
        </div>
        <div className="p-4 rounded-xl bg-sand-50 border border-sand-200 shadow-sm">
          <span className="text-[11px] font-semibold text-navy-600 uppercase tracking-wider">Total Redeemed</span>
          <p className="text-2xl font-display font-bold text-brass-700 mt-1">{stats.redeemed}</p>
        </div>
        <div className="p-4 rounded-xl bg-sand-50 border border-sand-200 shadow-sm">
          <span className="text-[11px] font-semibold text-navy-600 uppercase tracking-wider">Customer Savings</span>
          <p className="text-2xl font-display font-bold text-emerald-800 mt-1">{formatGBP(stats.savings)}</p>
        </div>
      </div>

      {/* Tabs Filter Bar */}
      <div className="flex items-center gap-2 border-b border-sand-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === "all" ? "bg-navy-950 text-sand-50 shadow-xs" : "text-navy-600 hover:bg-sand-200"
          }`}
        >
          All Vouchers ({promotions.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("active")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === "active" ? "bg-navy-950 text-sand-50 shadow-xs" : "text-navy-600 hover:bg-sand-200"
          }`}
        >
          Active ({stats.active})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("paused")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === "paused" ? "bg-navy-950 text-sand-50 shadow-xs" : "text-navy-600 hover:bg-sand-200"
          }`}
        >
          Paused ({promotions.filter((p) => !p.is_active).length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("expired")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === "expired" ? "bg-navy-950 text-sand-50 shadow-xs" : "text-navy-600 hover:bg-sand-200"
          }`}
        >
          Expired ({promotions.filter((p) => p.expires_at && new Date(p.expires_at) < new Date()).length})
        </button>
      </div>

      {/* Advanced DataTable */}
      <DataTable
        data={filteredPromotions}
        columns={columns}
        keyExtractor={(p) => p.id}
        title="Promotional Discount Codes"
        subtitle="Real-time voucher rules evaluated during checkout order calculations"
        searchPlaceholder="Search code, description..."
        loading={loading}
        onRefresh={fetchPromotions}
        exportFileName="san_furniture_promotions"
      />

      {/* Create / Edit Voucher Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-sand-50 border border-sand-300 rounded-2xl max-w-xl w-full p-6 shadow-2xl my-8 animate-fade-in">
            <div className="flex items-center justify-between pb-4 border-b border-sand-200">
              <div>
                <h3 className="font-display text-lg font-bold text-navy-950">
                  {editingPromo ? `Edit Voucher: ${editingPromo.code}` : "Create New UK Voucher"}
                </h3>
                <p className="text-xs text-navy-600">
                  {editingPromo
                    ? "Update voucher rules and eligibility requirements"
                    : "Configure a promotional discount code with custom parameters"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  resetForm();
                }}
                className="p-1 rounded-lg text-navy-400 hover:text-navy-700 hover:bg-sand-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePromotion} className="space-y-4 pt-4">
              {/* Voucher Code & Generator */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-navy-900">
                    Voucher Code (uppercase alphanumeric)
                  </label>
                  {!editingPromo && (
                    <button
                      type="button"
                      onClick={handleGenerateRandomCode}
                      className="text-[11px] font-bold text-brass-700 hover:text-brass-800 flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" /> Generate Code
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  required
                  value={formCode}
                  disabled={Boolean(editingPromo)}
                  onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                  placeholder="e.g. SUMMER25"
                  className="w-full px-3 py-2 bg-sand-100 border border-sand-300 rounded-lg text-xs font-mono font-bold text-navy-950 focus:outline-none focus:border-brass-500 uppercase tracking-wider disabled:opacity-60"
                />
              </div>

              {/* Offer Description */}
              <div>
                <label className="block text-xs font-semibold text-navy-900 mb-1">
                  Public Description / Customer Banner
                </label>
                <input
                  type="text"
                  required
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="e.g. Bank Holiday Special: £50 off handcrafted orders over £300"
                  className="w-full px-3 py-2 bg-sand-100 border border-sand-300 rounded-lg text-xs text-navy-950 focus:outline-none focus:border-brass-500"
                />
              </div>

              {/* Discount Type & Value */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-navy-900 mb-1">Discount Type</label>
                  <select
                    value={formDiscountType}
                    onChange={(e) => setFormDiscountType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-sand-100 border border-sand-300 rounded-lg text-xs text-navy-950 focus:outline-none focus:border-brass-500"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed_pennies">Fixed Amount (£ GBP)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-navy-900 mb-1">
                    {formDiscountType === "percentage" ? "Percentage Value (%)" : "Discount Amount (£)"}
                  </label>
                  <input
                    type="number"
                    step={formDiscountType === "percentage" ? "1" : "0.01"}
                    required
                    min="1"
                    value={formDiscountValue}
                    onChange={(e) => setFormDiscountValue(e.target.value)}
                    className="w-full px-3 py-2 bg-sand-100 border border-sand-300 rounded-lg text-xs text-navy-950 focus:outline-none focus:border-brass-500"
                  />
                </div>
              </div>

              {/* Min Spend & Max Discount Cap (for %) */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-navy-900 mb-1">
                    Min Spend Required (£ GBP)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formMinOrderGbp}
                    onChange={(e) => setFormMinOrderGbp(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-sand-100 border border-sand-300 rounded-lg text-xs text-navy-950 focus:outline-none focus:border-brass-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-navy-900 mb-1">
                    {formDiscountType === "percentage" ? "Max Discount Cap (£, optional)" : "Fixed Savings"}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    disabled={formDiscountType !== "percentage"}
                    value={formMaxDiscountGbp}
                    onChange={(e) => setFormMaxDiscountGbp(e.target.value)}
                    placeholder={formDiscountType === "percentage" ? "No limit" : "N/A for fixed"}
                    className="w-full px-3 py-2 bg-sand-100 border border-sand-300 rounded-lg text-xs text-navy-950 focus:outline-none focus:border-brass-500 disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Usage Caps & Limits */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-navy-900 mb-1">
                    Total Global Redemptions Cap
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formMaxUses}
                    onChange={(e) => setFormMaxUses(e.target.value)}
                    placeholder="1000"
                    className="w-full px-3 py-2 bg-sand-100 border border-sand-300 rounded-lg text-xs text-navy-950 focus:outline-none focus:border-brass-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-navy-900 mb-1">
                    Per-Customer Limit
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formPerCustomerLimit}
                    onChange={(e) => setFormPerCustomerLimit(e.target.value)}
                    placeholder="1"
                    className="w-full px-3 py-2 bg-sand-100 border border-sand-300 rounded-lg text-xs text-navy-950 focus:outline-none focus:border-brass-500"
                  />
                </div>
              </div>

              {/* Validity Dates (Start & Expiry) */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-navy-900 mb-1">
                    Starts On (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={formStartsAt}
                    onChange={(e) => setFormStartsAt(e.target.value)}
                    className="w-full px-3 py-2 bg-sand-100 border border-sand-300 rounded-lg text-xs text-navy-950 focus:outline-none focus:border-brass-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-navy-900 mb-1">
                    Expires On (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={formExpiresAt}
                    onChange={(e) => setFormExpiresAt(e.target.value)}
                    className="w-full px-3 py-2 bg-sand-100 border border-sand-300 rounded-lg text-xs text-navy-950 focus:outline-none focus:border-brass-500"
                  />
                </div>
              </div>

              {/* First Order Only Checkbox */}
              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-sand-200/50 border border-sand-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formFirstOrderOnly}
                  onChange={(e) => setFormFirstOrderOnly(e.target.checked)}
                  className="rounded text-brass-600 focus:ring-brass-500"
                />
                <div>
                  <span className="text-xs font-bold text-navy-950 block">First-Time Customers Only</span>
                  <span className="text-[11px] text-navy-600">
                    Restricts voucher exclusively to new shoppers who have never completed an order
                  </span>
                </div>
              </label>

              {/* Live Preview Card */}
              <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs">
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block mb-1">
                  Customer Checkout Preview
                </span>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-navy-950 bg-sand-200 px-2 py-0.5 rounded text-xs">
                      {formCode || "CODE"}
                    </span>
                    <span className="text-emerald-800 font-bold">
                      {formDiscountType === "percentage" ? `${formDiscountValue || 0}% OFF` : `£${parseFloat(formDiscountValue || "0").toFixed(2)} OFF`}
                    </span>
                  </div>
                  <span className="text-[11px] text-navy-600">
                    Min spend: £{parseFloat(formMinOrderGbp || "0").toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Form Actions */}
              <div className="pt-4 border-t border-sand-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    resetForm();
                  }}
                  className="px-4 py-2 rounded-lg border border-sand-300 text-xs font-semibold text-navy-700 hover:bg-sand-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg bg-gradient-to-r from-brass-500 to-brass-600 hover:from-brass-400 hover:to-brass-500 text-navy-950 font-bold text-xs shadow-md transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting
                    ? "Saving..."
                    : editingPromo
                    ? "Update Voucher"
                    : "Save Voucher to MySQL"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
