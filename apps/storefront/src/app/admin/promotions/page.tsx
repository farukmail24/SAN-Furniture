"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Tag,
  Plus,
  CheckCircle2,
  Trash2,
  Percent,
  DollarSign,
  Calendar,
  ChevronRight,
  X,
  ToggleLeft,
  ToggleRight,
  TrendingUp,
  Sparkles
} from "lucide-react";
import { DataTable, ColumnDef } from "@/components/admin/DataTable";
import { formatGBP } from "@san-furniture/types";
import { apiUrl } from "@/lib/api-config";
import { fetchWithSwr, invalidateCache, getCachedData } from "@/lib/api-cache";

interface PromotionItem {
  id: string;
  code: string;
  description: string;
  discount_type: "percentage" | "fixed_pennies";
  discount_value: number;
  min_order_pennies: number;
  is_active: number;
  usage_count: number;
  max_uses: number;
  created_at: string;
}

export default function AdminPromotionsPage() {
  const cachedPromos = getCachedData<{ promotions: PromotionItem[] }>(apiUrl("/api/admin/promotions"));
  const [promotions, setPromotions] = useState<PromotionItem[]>(() => cachedPromos?.promotions || []);
  const [loading, setLoading] = useState<boolean>(() => !cachedPromos?.promotions?.length);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [formCode, setFormCode] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formDiscountType, setFormDiscountType] = useState<"percentage" | "fixed_pennies">("percentage");
  const [formDiscountValue, setFormDiscountValue] = useState("15");
  const [formMinOrderGbp, setFormMinOrderGbp] = useState("350.00");
  const [formMaxUses, setFormMaxUses] = useState("200");

  const fetchPromotions = async () => {
    try {
      fetchWithSwr(
        apiUrl("/api/admin/promotions"),
        (data: any, isCached) => {
          if (data.promotions) {
            setPromotions(data.promotions);
            setLoading(false);
          }
        }
      ).finally(() => setLoading(false));
    } catch (err) {
      console.error("Failed to fetch promotions:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  const handleCreatePromotion = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const minPennies = Math.round(parseFloat(formMinOrderGbp || "0") * 100);
      let discVal = parseFloat(formDiscountValue);
      if (formDiscountType === "fixed_pennies") {
        discVal = Math.round(discVal * 100);
      }

      const res = await fetch(apiUrl("/api/admin/promotions"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: formCode,
          description: formDescription,
          discountType: formDiscountType,
          discountValue: discVal,
          minOrderPennies: minPennies,
          maxUses: parseInt(formMaxUses, 10) || 100,
          isActive: 1,
        }),
      });

      if (!res.ok) throw new Error("Failed to create promotion");

      invalidateCache("/api/admin/promotions");
      setSuccessMessage(`Promotion "${formCode.toUpperCase()}" created successfully!`);
      setIsAddModalOpen(false);
      setFormCode("");
      setFormDescription("");
      await fetchPromotions();
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: any) {
      alert("Error creating promotion: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (promo: PromotionItem) => {
    const nextState = promo.is_active ? 0 : 1;
    try {
      const res = await fetch(apiUrl(`/api/admin/promotions/${promo.id}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: nextState }),
      });
      if (!res.ok) throw new Error("Failed to update status");

      invalidateCache("/api/admin/promotions");
      setPromotions((prev) =>
        prev.map((p) => (p.id === promo.id ? { ...p, is_active: nextState } : p))
      );
      setSuccessMessage(`Voucher "${promo.code}" is now ${nextState ? "ACTIVE" : "PAUSED"}.`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      alert("Error toggling status: " + err.message);
    }
  };

  const handleDeletePromotion = async (promoId: string, code: string) => {
    if (!confirm(`Are you sure you want to delete coupon "${code}"?`)) return;
    try {
      const res = await fetch(apiUrl(`/api/admin/promotions/${promoId}`), {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");

      invalidateCache("/api/admin/promotions");
      setPromotions((prev) => prev.filter((p) => p.id !== promoId));
      setSuccessMessage(`Promotion "${code}" removed from database.`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      alert("Error deleting: " + err.message);
    }
  };

  const columns: ColumnDef<PromotionItem>[] = useMemo(
    () => [
      {
        key: "code",
        header: "Voucher Code",
        sortable: true,
        cell: (p) => (
          <div className="flex items-center gap-2">
            <Tag className="w-3.5 h-3.5 text-brass-600 flex-shrink-0" />
            <span className="font-mono font-bold text-navy-950 bg-sand-200/60 px-2 py-0.5 rounded text-xs tracking-wider">
              {p.code}
            </span>
          </div>
        ),
      },
      {
        key: "description",
        header: "Offer Description",
        cell: (p) => (
          <p className="text-xs text-navy-800 font-medium max-w-sm line-clamp-2">
            {p.description}
          </p>
        ),
      },
      {
        key: "benefit",
        header: "Discount Value",
        sortable: true,
        cell: (p) => {
          const isPercent = p.discount_type === "percentage";
          const label = isPercent ? `${p.discount_value}% OFF` : `${formatGBP(p.discount_value)} OFF`;
          return (
            <span className="font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-xs">
              {label}
            </span>
          );
        },
      },
      {
        key: "min_order_pennies",
        header: "Min Spend",
        sortable: true,
        cell: (p) => (
          <span className="text-navy-900 font-semibold text-xs">
            {formatGBP(p.min_order_pennies)}
          </span>
        ),
      },
      {
        key: "usage_count",
        header: "Redemptions",
        sortable: true,
        cell: (p) => (
          <div className="text-xs">
            <span className="font-bold text-navy-950">{p.usage_count}</span>
            <span className="text-navy-400"> / {p.max_uses || "∞"}</span>
          </div>
        ),
      },
      {
        key: "is_active",
        header: "Status",
        sortable: true,
        cell: (p) => (
          <button
            type="button"
            onClick={() => handleToggleStatus(p)}
            className="inline-flex items-center gap-1.5 focus:outline-none"
            title="Click to toggle status"
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
          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={() => handleDeletePromotion(p.id, p.code)}
              className="p-1.5 rounded-lg text-red-600 hover:text-red-800 hover:bg-red-50 transition-colors"
              title="Delete promotion"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
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
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brass-500 to-brass-600 hover:from-brass-400 hover:to-brass-500 text-navy-950 font-bold text-xs tracking-wide shadow-md shadow-brass-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Voucher</span>
        </button>
      </div>

      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2.5 animate-fade-in shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-sand-50 border border-sand-200 shadow-sm">
          <span className="text-[11px] font-semibold text-navy-600 uppercase tracking-wider">Total Vouchers</span>
          <p className="text-2xl font-display font-bold text-navy-950 mt-1">{promotions.length}</p>
        </div>
        <div className="p-4 rounded-xl bg-sand-50 border border-sand-200 shadow-sm">
          <span className="text-[11px] font-semibold text-navy-600 uppercase tracking-wider">Active Campaigns</span>
          <p className="text-2xl font-display font-bold text-emerald-700 mt-1">
            {promotions.filter((p) => p.is_active).length}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-sand-50 border border-sand-200 shadow-sm">
          <span className="text-[11px] font-semibold text-navy-600 uppercase tracking-wider">Total Redeemed</span>
          <p className="text-2xl font-display font-bold text-brass-700 mt-1">
            {promotions.reduce((sum, p) => sum + (p.usage_count || 0), 0)}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-sand-50 border border-sand-200 shadow-sm">
          <span className="text-[11px] font-semibold text-navy-600 uppercase tracking-wider">Engine Storage</span>
          <p className="text-sm font-mono font-bold text-navy-900 mt-2">MySQL / promotions</p>
        </div>
      </div>

      {/* Advanced DataTable */}
      <DataTable
        data={promotions}
        columns={columns}
        keyExtractor={(p) => p.id}
        title="Promotional Discount Codes"
        subtitle="Real-time voucher rules evaluated during checkout order calculations"
        searchPlaceholder="Search code, description..."
        loading={loading}
        onRefresh={fetchPromotions}
        exportFileName="san_furniture_promotions"
      />

      {/* Add Voucher Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-sand-50 border border-sand-300 rounded-2xl max-w-lg w-full p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-sand-200">
              <div>
                <h3 className="font-display text-lg font-bold text-navy-950">Create New UK Voucher</h3>
                <p className="text-xs text-navy-600">Adds discount rule directly to MySQL promotions table</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-navy-400 hover:text-navy-700 hover:bg-sand-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePromotion} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-semibold text-navy-900 mb-1">Voucher Code (uppercase)</label>
                <input
                  type="text"
                  required
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                  placeholder="e.g. SUMMER25"
                  className="w-full px-3 py-2 bg-sand-100 border border-sand-300 rounded-lg text-xs font-mono font-bold text-navy-950 focus:outline-none focus:border-brass-500 uppercase tracking-wider"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy-900 mb-1">Public Description / Promo Banner</label>
                <input
                  type="text"
                  required
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="e.g. Summer Solstice Special: 25% off all handcrafted dining tables"
                  className="w-full px-3 py-2 bg-sand-100 border border-sand-300 rounded-lg text-xs text-navy-950 focus:outline-none focus:border-brass-500"
                />
              </div>

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
                    value={formDiscountValue}
                    onChange={(e) => setFormDiscountValue(e.target.value)}
                    className="w-full px-3 py-2 bg-sand-100 border border-sand-300 rounded-lg text-xs text-navy-950 focus:outline-none focus:border-brass-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-navy-900 mb-1">Min Spend Required (£ GBP)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formMinOrderGbp}
                    onChange={(e) => setFormMinOrderGbp(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-sand-100 border border-sand-300 rounded-lg text-xs text-navy-950 focus:outline-none focus:border-brass-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-navy-900 mb-1">Max Redemptions Cap</label>
                  <input
                    type="number"
                    value={formMaxUses}
                    onChange={(e) => setFormMaxUses(e.target.value)}
                    placeholder="100"
                    className="w-full px-3 py-2 bg-sand-100 border border-sand-300 rounded-lg text-xs text-navy-950 focus:outline-none focus:border-brass-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-sand-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-sand-300 text-xs font-semibold text-navy-700 hover:bg-sand-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg bg-gradient-to-r from-brass-500 to-brass-600 hover:from-brass-400 hover:to-brass-500 text-navy-950 font-bold text-xs shadow-md transition-all disabled:opacity-50"
                >
                  {isSubmitting ? "Creating..." : "Save Voucher to MySQL"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
