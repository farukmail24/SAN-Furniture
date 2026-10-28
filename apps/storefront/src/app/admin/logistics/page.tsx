"use client";

import React, { useState, useEffect } from "react";
import {
  Truck,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Save,
  Package,
  Plus,
  Pencil,
  Trash2,
  X,
  Tag,
  Check,
  Globe,
  Info,
  MapPin,
  Layers,
} from "lucide-react";
import { formatGBP, UK_MAINLAND_REGIONS, UKRegionItem } from "@san-furniture/types";
import { apiUrl } from "@/lib/api-config";
import { fetchWithSwr, invalidateCache } from "@/lib/api-cache";
import { showConfirm } from "@/components/ui/AlertModal";

interface DeliveryPolicy {
  scope: "mainland_only" | "all_uk";
  restrictedPrefixes: string;
  nonServiceableNotice: string;
}

interface StorefrontDeliveryOption {
  id: string;
  name: string;
  badge?: string;
  pricePennies: number;
  formattedPrice?: string;
  description: string;
  timeframe: string;
  serviceScope: "all_mainland" | "custom_regions" | "specific_postcodes";
  regions: string[];
  allowedPrefixes?: string;
  excludedPrefixes?: string;
  minOrderPennies?: number;
  isActive: boolean;
  sortOrder: number;
}

export default function AdminLogisticsPage() {
  const [deliveryOptions, setDeliveryOptions] = useState<StorefrontDeliveryOption[]>([]);
  const [deliveryPolicy, setDeliveryPolicy] = useState<DeliveryPolicy>({
    scope: "mainland_only",
    restrictedPrefixes: "IV, KW, PH, AB, PA, BT, HS, ZE, GY, JE, IM",
    nonServiceableNotice:
      "We currently deliver exclusively to Mainland UK addresses. We are unable to fulfill orders to Northern Ireland, Scottish Highlands & Islands, or Channel Islands at this time. Please enter a valid Mainland UK delivery postcode.",
  });
  const [loading, setLoading] = useState(true);
  const [isSavingPolicy, setIsSavingPolicy] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Delivery Option Create/Edit Modal State
  const [isOptionModalOpen, setIsOptionModalOpen] = useState(false);
  const [editingOption, setEditingOption] = useState<StorefrontDeliveryOption | null>(null);
  const [optionForm, setOptionForm] = useState({
    name: "",
    badge: "",
    pricePounds: "0.00",
    timeframe: "3 - 7 business days",
    description: "",
    serviceScope: "all_mainland" as "all_mainland" | "custom_regions" | "specific_postcodes",
    regions: ["all_mainland"] as string[],
    allowedPrefixes: "",
    excludedPrefixes: "",
    minOrderPounds: "0.00",
    isActive: true,
    sortOrder: 1,
  });
  const [isSavingOption, setIsSavingOption] = useState(false);
  const [deletingOptionId, setDeletingOptionId] = useState<string | null>(null);

  const handleToggleRegion = (key: string) => {
    setOptionForm((prev) => {
      const isSelected = prev.regions.includes(key);
      const nextRegions = isSelected
        ? prev.regions.filter((k) => k !== key && k !== "all_mainland")
        : [...prev.regions.filter((k) => k !== "all_mainland"), key];
      return { ...prev, regions: nextRegions.length === 0 ? [key] : nextRegions };
    });
  };

  const handleSelectAllRegions = () => {
    setOptionForm((prev) => ({
      ...prev,
      regions: UK_MAINLAND_REGIONS.map((r: UKRegionItem) => r.key),
    }));
  };

  const handleDeselectAllRegions = () => {
    setOptionForm((prev) => ({
      ...prev,
      regions: [],
    }));
  };

  const fetchLogistics = async () => {
    try {
      fetchWithSwr(
        apiUrl("/api/admin/logistics"),
        (data: any, isCached) => {
          if (Array.isArray(data.deliveryOptions)) {
            setDeliveryOptions(data.deliveryOptions);
          }
          if (data.deliveryPolicy) {
            setDeliveryPolicy({
              scope: data.deliveryPolicy.scope || "mainland_only",
              restrictedPrefixes:
                data.deliveryPolicy.restrictedPrefixes || "IV, KW, PH, AB, PA, BT, HS, ZE, GY, JE, IM",
              nonServiceableNotice: data.deliveryPolicy.nonServiceableNotice || "",
            });
          }
          if (isCached) setLoading(false);
        }
      ).finally(() => setLoading(false));
    } catch (err) {
      console.error("Failed to load logistics:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogistics();
  }, []);

  // Save Delivery Policy (Mainland exclusivity & non-serviceable alert)
  const handleSavePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPolicy(true);
    setToastMsg(null);
    try {
      const res = await fetch(apiUrl("/api/admin/logistics/policy"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(deliveryPolicy),
      });
      const data = await res.json();
      if (res.ok) {
        invalidateCache("/api/admin/logistics");
        invalidateCache("/api/shipping/options");
        setToastMsg({ type: "success", text: "UK Delivery Policy saved successfully!" });
      } else {
        setToastMsg({ type: "error", text: data.error || "Failed to save delivery policy." });
      }
    } catch {
      setToastMsg({ type: "error", text: "Network error saving delivery policy." });
    } finally {
      setIsSavingPolicy(false);
      setTimeout(() => setToastMsg(null), 3500);
    }
  };

  // Open Create Modal
  const handleOpenCreateOption = () => {
    setEditingOption(null);
    setOptionForm({
      name: "",
      badge: "FREE DELIVERY",
      pricePounds: "0.00",
      timeframe: "3 - 7 business days",
      description: "Complimentary room of choice delivery across mainland UK with a 2-hour pre-delivery booking call.",
      serviceScope: "all_mainland",
      regions: ["all_mainland"],
      allowedPrefixes: "All Mainland UK",
      excludedPrefixes: "",
      minOrderPounds: "0.00",
      isActive: true,
      sortOrder: deliveryOptions.length + 1,
    });
    setIsOptionModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditOption = (opt: StorefrontDeliveryOption) => {
    setEditingOption(opt);
    setOptionForm({
      name: opt.name,
      badge: opt.badge || "",
      pricePounds: (opt.pricePennies / 100).toFixed(2),
      timeframe: opt.timeframe || "3 - 7 business days",
      description: opt.description || "",
      serviceScope: opt.serviceScope || "all_mainland",
      regions: Array.isArray(opt.regions) && opt.regions.length > 0 ? opt.regions : ["all_mainland"],
      allowedPrefixes: opt.allowedPrefixes || "",
      excludedPrefixes: opt.excludedPrefixes || "",
      minOrderPounds: ((opt.minOrderPennies || 0) / 100).toFixed(2),
      isActive: opt.isActive,
      sortOrder: opt.sortOrder ?? 1,
    });
    setIsOptionModalOpen(true);
  };

  // Save (Create or Update) Delivery Option
  const handleSaveOption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!optionForm.name.trim()) {
      setToastMsg({ type: "error", text: "Please provide a delivery option name." });
      return;
    }

    const priceFloat = parseFloat(optionForm.pricePounds || "0");
    const pricePennies = Math.max(0, Math.round(priceFloat * 100));
    const minOrderFloat = parseFloat(optionForm.minOrderPounds || "0");
    const minOrderPennies = Math.max(0, Math.round(minOrderFloat * 100));

    setIsSavingOption(true);
    try {
      const isEdit = Boolean(editingOption?.id);
      const url = isEdit
        ? apiUrl(`/api/admin/logistics/delivery-options/${editingOption!.id}`)
        : apiUrl("/api/admin/logistics/delivery-options");
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: optionForm.name.trim(),
          badge: optionForm.badge.trim() || null,
          pricePennies,
          description: optionForm.description.trim(),
          timeframe: optionForm.timeframe.trim(),
          serviceScope: optionForm.serviceScope,
          regions: optionForm.serviceScope === "all_mainland" ? ["all_mainland"] : optionForm.regions,
          allowedPrefixes: optionForm.allowedPrefixes.trim(),
          excludedPrefixes: optionForm.excludedPrefixes.trim(),
          minOrderPennies,
          isActive: optionForm.isActive,
          sortOrder: parseInt(String(optionForm.sortOrder), 10) || 0,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        invalidateCache("/api/admin/logistics");
        invalidateCache("/api/shipping/options");
        setToastMsg({
          type: "success",
          text: isEdit
            ? `Delivery option "${optionForm.name}" updated successfully!`
            : `New delivery option "${optionForm.name}" created successfully!`,
        });
        setIsOptionModalOpen(false);
        fetchLogistics();
      } else {
        setToastMsg({ type: "error", text: data.error || "Failed to save delivery option." });
      }
    } catch {
      setToastMsg({ type: "error", text: "Network error saving delivery option." });
    } finally {
      setIsSavingOption(false);
      setTimeout(() => setToastMsg(null), 3500);
    }
  };

  // 1-Click Toggle Active / Inactive Status
  const handleToggleOptionActive = async (opt: StorefrontDeliveryOption) => {
    const updatedStatus = !opt.isActive;
    setDeliveryOptions((prev) =>
      prev.map((o) => (o.id === opt.id ? { ...o, isActive: updatedStatus } : o))
    );

    try {
      const res = await fetch(apiUrl(`/api/admin/logistics/delivery-options/${opt.id}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: updatedStatus }),
      });
      if (res.ok) {
        invalidateCache("/api/admin/logistics");
        invalidateCache("/api/shipping/options");
        setToastMsg({
          type: "success",
          text: `"${opt.name}" is now ${updatedStatus ? "Active (Visible on Checkout)" : "Inactive (Hidden from Checkout)"}.`,
        });
      } else {
        setDeliveryOptions((prev) =>
          prev.map((o) => (o.id === opt.id ? { ...o, isActive: opt.isActive } : o))
        );
        setToastMsg({ type: "error", text: "Failed to update option status." });
      }
    } catch {
      setDeliveryOptions((prev) =>
        prev.map((o) => (o.id === opt.id ? { ...o, isActive: opt.isActive } : o))
      );
      setToastMsg({ type: "error", text: "Network error updating status." });
    } finally {
      setTimeout(() => setToastMsg(null), 3500);
    }
  };

  // Delete Delivery Option
  const handleDeleteOption = async (optId: string, optName: string) => {
    const ok = await showConfirm({
      title: "Delete Delivery Tier",
      message: `Are you sure you want to permanently delete delivery option "${optName}"? Checkout rates will recalculate.`,
      confirmText: "Delete Tier",
      type: "danger"
    });
    if (!ok) return;

    setDeletingOptionId(optId);
    try {
      const res = await fetch(apiUrl(`/api/admin/logistics/delivery-options/${optId}`), {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        invalidateCache("/api/admin/logistics");
        invalidateCache("/api/shipping/options");
        setToastMsg({ type: "success", text: `Delivery option "${optName}" deleted.` });
        fetchLogistics();
      } else {
        setToastMsg({ type: "error", text: data.error || "Failed to delete delivery option." });
      }
    } catch {
      setToastMsg({ type: "error", text: "Network error deleting delivery option." });
    } finally {
      setDeletingOptionId(null);
      setTimeout(() => setToastMsg(null), 3500);
    }
  };

  return (
    <div className="space-y-8 w-full">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E8E2D5]">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#C89B3C] mb-1">
            <Truck className="w-4 h-4" />
            <span>British Logistics & Fulfillment Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif text-[#00072D]">
            UK Delivery Options & Logistics Policy
          </h1>
          <p className="text-sm text-[#4F6D7A] mt-1">
            Configure checkout shipping methods, Mainland UK exclusive delivery policy, and non-serviceable customer notifications.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchLogistics}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-[#E8E2D5] hover:bg-[#F4F1EA] text-[#00072D] rounded-md text-xs font-semibold transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Rates</span>
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

      {/* SECTION 1: UK Delivery Policy & Destination Controls */}
      <div className="bg-white rounded-xl border border-[#E8E2D5] shadow-xs overflow-hidden">
        <div className="p-5 border-b border-[#E8E2D5] bg-[#FAF8F5] flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-sand-200 rounded-lg text-brass-700 shrink-0 mt-0.5">
              <Globe className="w-5 h-5 text-[#C89B3C]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-serif font-bold text-[#00072D]">
                  UK Delivery Policy & Destination Boundaries
                </h2>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded-full border border-emerald-300">
                  Global Policy
                </span>
              </div>
              <p className="text-xs text-[#4F6D7A] mt-1 leading-relaxed">
                Define whether your store delivers exclusively to Mainland UK or all UK territories. If a customer enters an unserviceable postcode, checkout will automatically display your custom notice and halt payment until a valid address is entered.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSavePolicy} className="p-6 space-y-6">
          {/* Policy Scope Selector */}
          <div>
            <label className="block text-xs font-bold text-[#00072D] uppercase tracking-wider mb-2">
              Dispatch Territory Scope
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label
                className={`relative flex items-start gap-3.5 p-4 rounded-xl border transition-all cursor-pointer ${
                  deliveryPolicy.scope === "mainland_only"
                    ? "bg-[#FAF8F5] border-[#C89B3C] ring-2 ring-[#C89B3C]/20 shadow-xs"
                    : "bg-white border-[#E8E2D5] hover:border-sand-400"
                }`}
              >
                <input
                  type="radio"
                  name="policy_scope"
                  value="mainland_only"
                  checked={deliveryPolicy.scope === "mainland_only"}
                  onChange={() => setDeliveryPolicy({ ...deliveryPolicy, scope: "mainland_only" })}
                  className="mt-1 w-4 h-4 text-[#00072D] focus:ring-[#C89B3C]"
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#00072D]">
                      Mainland UK Exclusively
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sand-200 text-[#00072D]">
                      Recommended
                    </span>
                  </div>
                  <p className="text-xs text-[#4F6D7A] leading-relaxed">
                    Orders are accepted exclusively for mainland UK addresses. Remote offshore islands, Highlands, and Northern Ireland are restricted with a warning message.
                  </p>
                </div>
              </label>

              <label
                className={`relative flex items-start gap-3.5 p-4 rounded-xl border transition-all cursor-pointer ${
                  deliveryPolicy.scope === "all_uk"
                    ? "bg-[#FAF8F5] border-[#C89B3C] ring-2 ring-[#C89B3C]/20 shadow-xs"
                    : "bg-white border-[#E8E2D5] hover:border-sand-400"
                }`}
              >
                <input
                  type="radio"
                  name="policy_scope"
                  value="all_uk"
                  checked={deliveryPolicy.scope === "all_uk"}
                  onChange={() => setDeliveryPolicy({ ...deliveryPolicy, scope: "all_uk" })}
                  className="mt-1 w-4 h-4 text-[#00072D] focus:ring-[#C89B3C]"
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#00072D]">
                      All United Kingdom (Mainland + Remote)
                    </span>
                  </div>
                  <p className="text-xs text-[#4F6D7A] leading-relaxed">
                    Accept orders across all valid UK postcodes, including Scottish Highlands, Northern Ireland, Isle of Man, and Channel Islands.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Customer Warning Notice */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-[#00072D] uppercase tracking-wider">
                Customer Notice (When Address Is Outside Mainland Service Area)
              </label>
              <span className="text-[11px] text-[#4F6D7A]">
                Displayed live on the Checkout page
              </span>
            </div>
            <textarea
              required
              rows={3}
              value={deliveryPolicy.nonServiceableNotice}
              onChange={(e) =>
                setDeliveryPolicy({ ...deliveryPolicy, nonServiceableNotice: e.target.value })
              }
              placeholder="Enter customer message explaining delivery is only available for mainland UK..."
              className="w-full px-3.5 py-2.5 text-xs border border-[#E8E2D5] rounded-lg bg-white text-[#00072D] focus:ring-2 focus:ring-[#C89B3C] outline-none leading-relaxed"
            />
            <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-[#4F6D7A]">
              <Info className="w-3.5 h-3.5 text-[#C89B3C] shrink-0" />
              <span>
                This alert automatically halts checkout payment buttons if the customer types a restricted postal outcode.
              </span>
            </div>
          </div>

          {/* Restricted Postcode Prefixes */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-[#00072D] uppercase tracking-wider">
                Restricted Postal Outcodes / Prefixes (Comma-Separated)
              </label>
              <span className="text-[11px] text-[#4F6D7A]">
                Applies when Mainland Exclusively is selected
              </span>
            </div>
            <input
              type="text"
              required
              value={deliveryPolicy.restrictedPrefixes}
              onChange={(e) =>
                setDeliveryPolicy({ ...deliveryPolicy, restrictedPrefixes: e.target.value })
              }
              placeholder="e.g. IV, KW, PH, AB, PA, BT, HS, ZE, GY, JE, IM"
              className="w-full px-3.5 py-2.5 text-xs font-mono font-semibold border border-[#E8E2D5] rounded-lg bg-white text-[#00072D] focus:ring-2 focus:ring-[#C89B3C] outline-none"
            />
            <p className="text-[11px] text-[#4F6D7A] mt-1.5 leading-relaxed">
              Standard non-mainland prefixes: <strong>IV, KW, PH, AB, PA</strong> (Scottish Highlands), <strong>BT</strong> (Northern Ireland), <strong>HS, ZE</strong> (Scottish Islands), <strong>GY, JE</strong> (Channel Islands), <strong>IM</strong> (Isle of Man).
            </p>
          </div>

          {/* Save Button */}
          <div className="pt-2 flex items-center justify-end">
            <button
              type="submit"
              disabled={isSavingPolicy}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#00072D] hover:bg-[#C89B3C] hover:text-[#00072D] text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isSavingPolicy ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving Policy...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Delivery Policy</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* SECTION 2: Storefront Delivery Options (Full CRUD for Checkout Page) */}
      <div className="bg-white rounded-xl border border-[#E8E2D5] shadow-sm overflow-hidden">
        <div className="p-5 border-b border-[#E8E2D5] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FAF8F5]">
          <div>
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-[#C89B3C]" />
              <h2 className="text-base font-serif font-bold text-[#00072D]">
                Storefront Delivery Options (Checkout Methods)
              </h2>
            </div>
            <p className="text-xs text-[#4F6D7A] mt-1">
              Active options below are displayed directly on the customer checkout page. Options set to £0.00 appear as <strong>FREE</strong>.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenCreateOption}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#00072D] text-white hover:bg-[#C89B3C] hover:text-[#00072D] font-bold text-xs rounded-lg transition-all shadow-xs cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Delivery Option</span>
          </button>
        </div>

        {loading ? (
          <div className="py-16 flex justify-center items-center">
            <RefreshCw className="w-8 h-8 animate-spin text-[#C89B3C]" />
          </div>
        ) : deliveryOptions.length === 0 ? (
          <div className="py-12 text-center text-sm text-[#4F6D7A]">
            <Package className="w-8 h-8 text-[#B8AD99] mx-auto mb-2 opacity-50" />
            <p className="font-semibold text-navy-900">No delivery options configured</p>
            <p className="text-xs text-[#4F6D7A] mt-1">
              Click &quot;Add Delivery Option&quot; above to create your first checkout method.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm table-fixed border-collapse">
              <colgroup>
                <col className="w-[26%]" />
                <col className="w-[12%]" />
                <col className="w-[20%]" />
                <col className="w-[14%]" />
                <col className="w-[16%]" />
                <col className="w-[6%]" />
                <col className="w-[6%]" />
              </colgroup>
              <thead className="bg-[#F4F1EA] text-[#00072D] text-xs uppercase font-bold tracking-wider border-b border-[#E8E2D5]">
                <tr>
                  <th className="py-3.5 px-5">Method Name & Badge</th>
                  <th className="py-3.5 px-4">Base Fee (£ GBP)</th>
                  <th className="py-3.5 px-4">Coverage & Zones</th>
                  <th className="py-3.5 px-4">Estimated Transit</th>
                  <th className="py-3.5 px-4">Customer-Facing Description</th>
                  <th className="py-3.5 px-3 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2D5]">
                {deliveryOptions.map((opt) => (
                  <tr key={opt.id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                    {/* 1. Method Name & Badge */}
                    <td className="py-4 px-5 align-top">
                      <div className="flex items-start gap-2.5">
                        <span
                          className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-sand-200 text-[#00072D] text-[10px] font-bold shrink-0 mt-0.5"
                          title={`Display Order: ${opt.sortOrder}`}
                        >
                          {opt.sortOrder}
                        </span>
                        <div className="space-y-1">
                          <div className="font-bold text-sm text-[#00072D] leading-snug">
                            {opt.name}
                          </div>
                          {opt.badge && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-brass-100/80 text-brass-900 border border-brass-300">
                              <Tag className="w-2.5 h-2.5 text-brass-700" />
                              {opt.badge}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* 2. Base Fee */}
                    <td className="py-4 px-4 align-top">
                      {opt.pricePennies === 0 ? (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 font-bold text-xs border border-emerald-300 shadow-2xs">
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            FREE
                          </span>
                          <span className="text-[11px] text-[#4F6D7A] block font-mono">£0.00 base</span>
                        </div>
                      ) : (
                        <div className="space-y-0.5">
                          <span className="text-sm font-bold text-[#00072D] font-mono block">
                            {formatGBP(opt.pricePennies)}
                          </span>
                          <span className="text-[11px] text-[#4F6D7A] block">inc. 20% VAT</span>
                        </div>
                      )}
                    </td>

                    {/* 3. Coverage & Zones */}
                    <td className="py-4 px-4 align-top">
                      {opt.serviceScope === "all_mainland" ? (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-800 text-[11px] font-bold border border-blue-200">
                            <Globe className="w-3.5 h-3.5 text-blue-600" />
                            All UK Mainland
                          </span>
                          <p className="text-[10px] text-[#4F6D7A]">All 11 Mainland Regions</p>
                        </div>
                      ) : opt.serviceScope === "custom_regions" ? (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-50 text-purple-800 text-[11px] font-bold border border-purple-200">
                            <MapPin className="w-3.5 h-3.5 text-purple-600" />
                            {Array.isArray(opt.regions) && opt.regions.length > 0
                              ? `${opt.regions.length} Regions`
                              : "Regional"}
                          </span>
                          <p className="text-[10px] text-[#4F6D7A] truncate max-w-[170px]" title={Array.isArray(opt.regions) ? opt.regions.join(", ") : ""}>
                            {Array.isArray(opt.regions)
                              ? opt.regions
                                  .map((r: string) => UK_MAINLAND_REGIONS.find((reg: UKRegionItem) => reg.key === r)?.name || r)
                                  .slice(0, 2)
                                  .join(", ") + (opt.regions.length > 2 ? ` +${opt.regions.length - 2}` : "")
                              : "Custom"}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 text-[11px] font-bold border border-amber-200">
                            <Layers className="w-3.5 h-3.5 text-amber-600" />
                            Specific Prefixes
                          </span>
                          <p className="text-[10px] text-[#4F6D7A] font-mono truncate max-w-[170px]" title={opt.allowedPrefixes || "All"}>
                            {opt.allowedPrefixes || "All"}
                          </p>
                        </div>
                      )}
                    </td>

                    {/* 4. Estimated Transit */}
                    <td className="py-4 px-4 align-top">
                      <div className="inline-flex items-center gap-1.5 text-xs text-[#00072D] font-medium bg-[#FAF8F5] px-2.5 py-1.5 rounded-md border border-[#E8E2D5]">
                        <Clock className="w-3.5 h-3.5 text-[#C89B3C] shrink-0" />
                        <span>{opt.timeframe}</span>
                      </div>
                    </td>

                    {/* 5. Customer-Facing Description */}
                    <td className="py-4 px-4 align-top">
                      <p className="text-xs text-[#4F6D7A] leading-relaxed break-words">
                        {opt.description || "—"}
                      </p>
                    </td>

                    {/* 6. Status Toggle */}
                    <td className="py-4 px-3 align-top text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleOptionActive(opt)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                          opt.isActive
                            ? "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 shadow-2xs"
                            : "bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-300"
                        }`}
                        title="Click to toggle Active / Inactive"
                      >
                        {opt.isActive ? (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                            <span>Active</span>
                          </>
                        ) : (
                          <>
                            <X className="w-3 h-3 text-slate-400" />
                            <span>Inactive</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* 7. Actions (Icon Only) */}
                    <td className="py-4 px-4 align-top text-right">
                      <div className="flex items-center justify-end gap-1.5 shrink-0 flex-nowrap">
                        <button
                          type="button"
                          onClick={() => handleOpenEditOption(opt)}
                          className="p-2 bg-white hover:bg-[#FAF8F5] text-[#00072D] hover:text-[#C89B3C] rounded-lg border border-[#E8E2D5] hover:border-[#C89B3C]/50 transition-colors cursor-pointer shadow-2xs shrink-0"
                          title="Edit this option"
                          aria-label="Edit this option"
                        >
                          <Pencil className="w-3.5 h-3.5 text-[#C89B3C]" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteOption(opt.id, opt.name)}
                          disabled={deletingOptionId === opt.id || deliveryOptions.length <= 1}
                          className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg border border-rose-200 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs shrink-0"
                          title={deliveryOptions.length <= 1 ? "At least one option must remain" : "Delete option"}
                          aria-label="Delete option"
                        >
                          {deletingOptionId === opt.id ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Compliance Note */}
      <div className="p-4 bg-sand-100 border border-sand-300 rounded-xl flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-brass-600 shrink-0 mt-0.5" />
        <div className="text-xs text-navy-900 leading-relaxed">
          <strong>Furniture Quality &amp; Mainland Dispatch Protocol:</strong> All furniture dispatches undergo packaging inspection prior to carrier handover to ensure safe transit across Mainland UK. Clear assembly guides and protective transit packaging are included with each piece.
        </div>
      </div>

      {/* CREATE / EDIT DELIVERY OPTION MODAL */}
      {isOptionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-xs">
          <div className="bg-[#FAF8F5] rounded-2xl border border-sand-300 shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-fade-in">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#00072D] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-brass-400" />
                <h3 className="font-serif font-bold text-base text-sand-50">
                  {editingOption ? "Edit Delivery Option" : "Add New Delivery Option"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOptionModalOpen(false)}
                className="p-1 rounded-lg text-sand-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveOption} className="p-6 space-y-4 overflow-y-auto max-h-[calc(92vh-70px)]">
              <div>
                <label className="block text-xs font-bold text-navy-900 uppercase tracking-wider mb-1">
                  Delivery Option Name *
                </label>
                <input
                  type="text"
                  required
                  value={optionForm.name}
                  onChange={(e) => setOptionForm({ ...optionForm, name: e.target.value })}
                  placeholder="e.g. Free UK Mainland Delivery"
                  className="w-full px-3 py-2 text-xs border border-sand-300 rounded-lg bg-white text-navy-950 focus:ring-2 focus:ring-brass-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-navy-900 uppercase tracking-wider mb-1">
                    Base Delivery Fee (£ GBP) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs font-bold text-navy-500">£</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={optionForm.pricePounds}
                      onChange={(e) => setOptionForm({ ...optionForm, pricePounds: e.target.value })}
                      placeholder="0.00"
                      className="w-full pl-7 pr-3 py-2 text-xs font-bold border border-sand-300 rounded-lg bg-white text-navy-950 focus:ring-2 focus:ring-brass-500 outline-none"
                    />
                  </div>
                  <span className="text-[10px] text-emerald-700 font-semibold block mt-1">
                    Value 0.00 will show as FREE on checkout.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-navy-900 uppercase tracking-wider mb-1">
                    Promotional Badge (Optional)
                  </label>
                  <div className="relative">
                    <Tag className="w-3.5 h-3.5 text-navy-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={optionForm.badge}
                      onChange={(e) => setOptionForm({ ...optionForm, badge: e.target.value })}
                      placeholder="e.g. FREE DELIVERY, Assembly Included"
                      className="w-full pl-8 pr-3 py-2 text-xs border border-sand-300 rounded-lg bg-white text-navy-950 focus:ring-2 focus:ring-brass-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-navy-900 uppercase tracking-wider mb-1">
                    Estimated Transit Time *
                  </label>
                  <input
                    type="text"
                    required
                    value={optionForm.timeframe}
                    onChange={(e) => setOptionForm({ ...optionForm, timeframe: e.target.value })}
                    placeholder="e.g. 3 - 7 business days"
                    className="w-full px-3 py-2 text-xs border border-sand-300 rounded-lg bg-white text-navy-950 focus:ring-2 focus:ring-brass-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-navy-900 uppercase tracking-wider mb-1">
                    Min. Order Value (£ GBP)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs font-bold text-navy-500">£</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={optionForm.minOrderPounds}
                      onChange={(e) => setOptionForm({ ...optionForm, minOrderPounds: e.target.value })}
                      placeholder="0.00"
                      className="w-full pl-7 pr-3 py-2 text-xs font-bold border border-sand-300 rounded-lg bg-white text-navy-950 focus:ring-2 focus:ring-brass-500 outline-none"
                    />
                  </div>
                  <span className="text-[10px] text-[#4F6D7A] block mt-1">
                    0.00 = no minimum required
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-navy-900 uppercase tracking-wider mb-1">
                    Display Sort Order
                  </label>
                  <input
                    type="number"
                    value={optionForm.sortOrder}
                    onChange={(e) =>
                      setOptionForm({ ...optionForm, sortOrder: parseInt(e.target.value || "1", 10) })
                    }
                    className="w-full px-3 py-2 text-xs border border-sand-300 rounded-lg bg-white text-navy-950 focus:ring-2 focus:ring-brass-500 outline-none"
                  />
                </div>
              </div>

              {/* Geographic Service Scope & Regional Selection */}
              <div className="p-4 bg-white rounded-xl border border-[#E8E2D5] space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-[#00072D] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-[#C89B3C]" />
                    <span>Geographic Service Territory & Postcode Rules</span>
                  </label>
                  <p className="text-[11px] text-[#4F6D7A] leading-relaxed">
                    Specify which UK mainland territories qualify for this delivery method.
                  </p>
                </div>

                {/* 3 Scope Options */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setOptionForm({ ...optionForm, serviceScope: "all_mainland" })}
                    className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                      optionForm.serviceScope === "all_mainland"
                        ? "bg-[#FAF8F5] border-[#C89B3C] ring-2 ring-[#C89B3C]/20 text-[#00072D]"
                        : "bg-white border-[#E8E2D5] hover:border-sand-400 text-[#4F6D7A]"
                    }`}
                  >
                    <div className="text-xs font-bold text-[#00072D] flex items-center justify-between">
                      <span>All UK Mainland</span>
                      {optionForm.serviceScope === "all_mainland" && <Check className="w-3.5 h-3.5 text-[#C89B3C]" />}
                    </div>
                    <p className="text-[10px] text-[#4F6D7A] mt-0.5">
                      All 11 mainland UK regions
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOptionForm({ ...optionForm, serviceScope: "custom_regions" })}
                    className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                      optionForm.serviceScope === "custom_regions"
                        ? "bg-[#FAF8F5] border-[#C89B3C] ring-2 ring-[#C89B3C]/20 text-[#00072D]"
                        : "bg-white border-[#E8E2D5] hover:border-sand-400 text-[#4F6D7A]"
                    }`}
                  >
                    <div className="text-xs font-bold text-[#00072D] flex items-center justify-between">
                      <span>Selected Regions</span>
                      {optionForm.serviceScope === "custom_regions" && <Check className="w-3.5 h-3.5 text-[#C89B3C]" />}
                    </div>
                    <p className="text-[10px] text-[#4F6D7A] mt-0.5">
                      Choose from 11 regions
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOptionForm({ ...optionForm, serviceScope: "specific_postcodes" })}
                    className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                      optionForm.serviceScope === "specific_postcodes"
                        ? "bg-[#FAF8F5] border-[#C89B3C] ring-2 ring-[#C89B3C]/20 text-[#00072D]"
                        : "bg-white border-[#E8E2D5] hover:border-sand-400 text-[#4F6D7A]"
                    }`}
                  >
                    <div className="text-xs font-bold text-[#00072D] flex items-center justify-between">
                      <span>Specific Prefixes</span>
                      {optionForm.serviceScope === "specific_postcodes" && <Check className="w-3.5 h-3.5 text-[#C89B3C]" />}
                    </div>
                    <p className="text-[10px] text-[#4F6D7A] mt-0.5">
                      Exact outcodes (e.g. CV, B)
                    </p>
                  </button>
                </div>

                {/* Regional Checkbox Grid (shown when custom_regions is selected) */}
                {optionForm.serviceScope === "custom_regions" && (
                  <div className="space-y-2.5 pt-2 border-t border-[#E8E2D5]">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-[#00072D] uppercase tracking-wider">
                        UK Mainland Regions ({optionForm.regions.length} of {UK_MAINLAND_REGIONS.length} selected)
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleSelectAllRegions}
                          className="text-[11px] font-semibold text-[#00072D] hover:text-[#C89B3C] cursor-pointer"
                        >
                          Select All
                        </button>
                        <span className="text-slate-300">|</span>
                        <button
                          type="button"
                          onClick={handleDeselectAllRegions}
                          className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 cursor-pointer"
                        >
                          Deselect All
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-1 border border-[#E8E2D5] rounded-lg bg-[#FAF8F5]">
                      {UK_MAINLAND_REGIONS.map((region: UKRegionItem) => {
                        const checked = optionForm.regions.includes(region.key);
                        return (
                          <label
                            key={region.key}
                            className={`flex items-start gap-2.5 p-2 rounded-md border transition-all cursor-pointer ${
                              checked
                                ? "bg-white border-[#C89B3C] shadow-2xs"
                                : "bg-white/60 border-transparent hover:border-[#E8E2D5]"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => handleToggleRegion(region.key)}
                              className="mt-0.5 w-3.5 h-3.5 text-[#00072D] rounded border-[#E8E2D5] focus:ring-[#C89B3C]"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-bold text-[#00072D] leading-none">
                                {region.name}
                              </div>
                              <div className="text-[10px] text-[#4F6D7A] font-mono mt-1 truncate" title={region.prefixes.join(", ")}>
                                {region.prefixes.slice(0, 7).join(", ")}{region.prefixes.length > 7 ? "..." : ""}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Specific Outcode Prefixes (shown when specific_postcodes is selected) */}
                {optionForm.serviceScope === "specific_postcodes" && (
                  <div className="space-y-1 pt-2 border-t border-[#E8E2D5]">
                    <label className="block text-[11px] font-bold text-[#00072D] uppercase tracking-wider">
                      Allowed Postal Outcode Prefixes (Comma-Separated)
                    </label>
                    <input
                      type="text"
                      value={optionForm.allowedPrefixes}
                      onChange={(e) => setOptionForm({ ...optionForm, allowedPrefixes: e.target.value })}
                      placeholder="e.g. CV, B, WS, DY, WR, ST, TF"
                      className="w-full px-3 py-2 text-xs font-mono font-semibold border border-[#E8E2D5] rounded-lg bg-[#FAF8F5] text-[#00072D] focus:ring-2 focus:ring-[#C89B3C] outline-none"
                    />
                    <p className="text-[10px] text-[#4F6D7A]">
                      Customers entering postcodes matching these prefixes will be eligible for this delivery tier.
                    </p>
                  </div>
                )}

                {/* Excluded Prefixes (optional for any scope) */}
                <div className="pt-2 border-t border-[#E8E2D5]">
                  <label className="block text-[11px] font-bold text-[#00072D] uppercase tracking-wider mb-1">
                    Excluded Postal Outcodes (Optional Exceptions)
                  </label>
                  <input
                    type="text"
                    value={optionForm.excludedPrefixes}
                    onChange={(e) => setOptionForm({ ...optionForm, excludedPrefixes: e.target.value })}
                    placeholder="e.g. KW15, ZE1 (leave blank if none)"
                    className="w-full px-3 py-1.5 text-xs font-mono border border-[#E8E2D5] rounded-lg bg-white text-[#00072D] focus:ring-2 focus:ring-[#C89B3C] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-navy-900 uppercase tracking-wider mb-1">
                  Customer-Facing Description *
                </label>
                <textarea
                  required
                  rows={2}
                  value={optionForm.description}
                  onChange={(e) => setOptionForm({ ...optionForm, description: e.target.value })}
                  placeholder="Explain what is included (room of choice delivery, unboxing, booking call, packaging disposal, etc.)..."
                  className="w-full px-3 py-2 text-xs border border-sand-300 rounded-lg bg-white text-navy-950 focus:ring-2 focus:ring-brass-500 outline-none leading-relaxed"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="optIsActive"
                  checked={optionForm.isActive}
                  onChange={(e) => setOptionForm({ ...optionForm, isActive: e.target.checked })}
                  className="w-4 h-4 text-[#00072D] rounded border-sand-300 focus:ring-brass-500"
                />
                <label htmlFor="optIsActive" className="text-xs font-semibold text-navy-900 cursor-pointer">
                  Active (Display this choice to customers on checkout page)
                </label>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-sand-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsOptionModalOpen(false)}
                  disabled={isSavingOption}
                  className="px-4 py-2 border border-sand-300 rounded-lg text-xs font-semibold text-navy-700 hover:bg-sand-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingOption}
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-[#00072D] text-white hover:bg-[#C89B3C] hover:text-[#00072D] font-bold text-xs rounded-lg transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSavingOption ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Delivery Option</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
