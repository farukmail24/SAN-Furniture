"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Plus,
  Trash2,
  ExternalLink,
  Image as ImageIcon,
  Layers,
  Tag,
  Sparkles,
  MoveUp,
  MoveDown,
  ChevronRight,
  Info,
  ShoppingBag,
  CreditCard,
  Truck,
  ShieldCheck,
  RotateCcw,
  Clock,
  Star,
  Eye,
  Sliders,
} from "lucide-react";
import type {
  MegaMenuContent,
  MegaMenuTab,
  MegaMenuColumn,
  MegaMenuLink,
  MegaMenuPerk,
} from "@/lib/cms-defaults";

const AVAILABLE_PERK_ICONS = [
  { value: "Truck", label: "Truck (Delivery & Shipping)" },
  { value: "ShieldCheck", label: "ShieldCheck (Fire Safety & Quality)" },
  { value: "RotateCcw", label: "RotateCcw (14-Day Returns)" },
  { value: "CreditCard", label: "CreditCard (Klarna & Payments)" },
  { value: "Sparkles", label: "Sparkles (Handcrafted / Luxury)" },
  { value: "Clock", label: "Clock (Dispatch & Lead Times)" },
  { value: "Tag", label: "Tag (Discounts & Clearances)" },
  { value: "Star", label: "Star (Trustpilot / Reviews)" },
];

interface MegaMenuEditorProps {
  content: MegaMenuContent;
  onChange: (updatedContent: MegaMenuContent) => void;
  onOpenMediaPicker?: (targetField: { tabIndex: number; field: "promo" | "product" }) => void;
}

export function MegaMenuEditor({
  content,
  onChange,
  onOpenMediaPicker,
}: MegaMenuEditorProps) {
  const tabs = content?.tabs || [];
  const bottomPerks = content?.bottom_perks || [];
  const [selectedTabIndex, setSelectedTabIndex] = useState<number>(0);

  const activeTab: MegaMenuTab | undefined = tabs[selectedTabIndex] || tabs[0];

  // Helper to update tabs array immutably
  const updateTabs = (newTabs: MegaMenuTab[]) => {
    onChange({
      ...content,
      tabs: newTabs,
    });
  };

  // Helper to update bottom perks
  const updateBottomPerks = (newPerks: MegaMenuPerk[]) => {
    onChange({
      ...content,
      bottom_perks: newPerks,
    });
  };

  // 1. Tab CRUD
  const handleAddTab = () => {
    const newTabId = `tab_${Date.now()}`;
    const newTab: MegaMenuTab = {
      id: newTabId,
      label: "New Category",
      href: "/catalog",
      badge: "",
      columns: [
        {
          title: "Subcategories",
          links: [
            { label: "All Items", href: "/catalog" },
            { label: "Featured Selection", href: "/catalog", badge: "NEW" },
          ],
        },
      ],
      featured_promo: {
        badge: "NEW COLLECTION",
        title: "Exclusive Living Range",
        subtitle: "Handcrafted comfort and modern British silhouettes.",
        image_url:
          "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80",
        cta_label: "Discover Range",
        cta_href: "/catalog",
      },
    };
    const newTabs = [...tabs, newTab];
    updateTabs(newTabs);
    setSelectedTabIndex(newTabs.length - 1);
  };

  const handleRemoveTab = (index: number) => {
    if (tabs.length <= 1) {
      alert("At least one navigation tab must remain active in the mega menu.");
      return;
    }
    const newTabs = tabs.filter((_, i) => i !== index);
    updateTabs(newTabs);
    setSelectedTabIndex(Math.max(0, index - 1));
  };

  const handleMoveTab = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= tabs.length) return;
    const newTabs = [...tabs];
    const [moved] = newTabs.splice(index, 1);
    newTabs.splice(targetIndex, 0, moved);
    updateTabs(newTabs);
    setSelectedTabIndex(targetIndex);
  };

  const handleTabChange = <K extends keyof MegaMenuTab>(
    field: K,
    value: MegaMenuTab[K]
  ) => {
    if (!activeTab) return;
    const newTabs = tabs.map((tab, idx) => {
      if (idx === selectedTabIndex) {
        return { ...tab, [field]: value };
      }
      return tab;
    });
    updateTabs(newTabs);
  };

  // 2. Column CRUD
  const handleAddColumn = () => {
    if (!activeTab) return;
    const newColumns: MegaMenuColumn[] = [
      ...(activeTab.columns || []),
      {
        title: "New Group",
        links: [{ label: "View Collection", href: activeTab.href || "/catalog" }],
      },
    ];
    handleTabChange("columns", newColumns);
  };

  const handleRemoveColumn = (colIdx: number) => {
    if (!activeTab) return;
    const newColumns = activeTab.columns.filter((_, i) => i !== colIdx);
    handleTabChange("columns", newColumns);
  };

  const handleColumnTitleChange = (colIdx: number, title: string) => {
    if (!activeTab) return;
    const newColumns = activeTab.columns.map((col, i) =>
      i === colIdx ? { ...col, title } : col
    );
    handleTabChange("columns", newColumns);
  };

  // 3. Link CRUD
  const handleAddLink = (colIdx: number) => {
    if (!activeTab) return;
    const newColumns = activeTab.columns.map((col, i) => {
      if (i === colIdx) {
        return {
          ...col,
          links: [
            ...col.links,
            { label: "New Item", href: activeTab.href || "/catalog" },
          ],
        };
      }
      return col;
    });
    handleTabChange("columns", newColumns);
  };

  const handleRemoveLink = (colIdx: number, linkIdx: number) => {
    if (!activeTab) return;
    const newColumns = activeTab.columns.map((col, i) => {
      if (i === colIdx) {
        return {
          ...col,
          links: col.links.filter((_, li) => li !== linkIdx),
        };
      }
      return col;
    });
    handleTabChange("columns", newColumns);
  };

  const handleLinkChange = (
    colIdx: number,
    linkIdx: number,
    field: keyof MegaMenuLink,
    value: string
  ) => {
    if (!activeTab) return;
    const newColumns = activeTab.columns.map((col, i) => {
      if (i === colIdx) {
        const newLinks = col.links.map((link, li) => {
          if (li === linkIdx) {
            return { ...link, [field]: value };
          }
          return link;
        });
        return { ...col, links: newLinks };
      }
      return col;
    });
    handleTabChange("columns", newColumns);
  };

  // 4. Promo Banner Update
  const handlePromoChange = (field: string, value: string) => {
    if (!activeTab) return;
    const currentPromo = activeTab.featured_promo || {
      badge: "FEATURED",
      title: "",
      subtitle: "",
      image_url: "",
      cta_label: "Explore",
      cta_href: "/catalog",
    };
    handleTabChange("featured_promo", {
      ...currentPromo,
      [field]: value,
    });
  };

  // 5. Featured Product Update
  const handleProductChange = (field: string, value: string) => {
    if (!activeTab) return;
    const currentProduct = activeTab.featured_product || {
      tag: "IN STOCK",
      title: "",
      price_str: "£0.00",
      image_url: "",
      href: "/catalog",
    };
    handleTabChange("featured_product", {
      ...currentProduct,
      [field]: value,
    });
  };

  // 6. Bottom Perks CRUD
  const handleAddPerk = () => {
    const newPerk: MegaMenuPerk = {
      icon: "ShieldCheck",
      text: "UK Statutory Quality Tested & Inspected",
    };
    updateBottomPerks([...bottomPerks, newPerk]);
  };

  const handleRemovePerk = (index: number) => {
    updateBottomPerks(bottomPerks.filter((_, i) => i !== index));
  };

  const handlePerkChange = (
    index: number,
    field: keyof MegaMenuPerk,
    value: string
  ) => {
    const newPerks = bottomPerks.map((p, i) =>
      i === index ? { ...p, [field]: value } : p
    );
    updateBottomPerks(newPerks);
  };

  return (
    <div className="space-y-8">
      {/* Overview Info Banner */}
      <div className="p-4 rounded-xl bg-sand-50 border border-sand-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brass-100 flex items-center justify-center text-brass-700 shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-navy-950">
              Interactive Mega Menu Manager
            </h4>
            <p className="text-[11px] text-navy-600">
              Configure top-level navigation categories, multi-column sub-links, promotional cards, and featured product badges.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded bg-sand-200 text-navy-800 border border-sand-300">
            {tabs.length} Menu Categories
          </span>
        </div>
      </div>

      {/* Primary Category Tabs Switcher */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-navy-900 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-brass-600" />
            <span>Navigation Tabs</span>
          </label>
          <button
            type="button"
            onClick={handleAddTab}
            className="px-3 py-1.5 rounded-lg bg-navy-950 hover:bg-brass-700 text-sand-50 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Category Tab</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {tabs.map((tab, idx) => {
            const isSelected = idx === selectedTabIndex;
            return (
              <div
                key={tab.id || idx}
                className={`flex items-center rounded-xl border transition-all ${
                  isSelected
                    ? "bg-sand-100 border-brass-600 ring-2 ring-brass-400/40 shadow-xs"
                    : "bg-white border-sand-300 hover:border-sand-400"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setSelectedTabIndex(idx)}
                  className="px-3 py-2 text-xs font-bold text-navy-950 flex items-center gap-2 cursor-pointer"
                >
                  <span className="w-4 h-4 rounded-full bg-sand-200 text-navy-700 text-[10px] flex items-center justify-center font-mono">
                    {idx + 1}
                  </span>
                  <span>{tab.label || "Untitled Tab"}</span>
                  {tab.badge && (
                    <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-brass-500 text-navy-950">
                      {tab.badge}
                    </span>
                  )}
                </button>

                <div className="flex items-center pr-1.5 pl-0.5 border-l border-sand-200/80 gap-0.5">
                  <button
                    type="button"
                    onClick={() => handleMoveTab(idx, "up")}
                    disabled={idx === 0}
                    title="Move tab left"
                    className="p-1 text-navy-500 hover:text-navy-900 disabled:opacity-30 cursor-pointer"
                  >
                    <MoveUp className="w-3 h-3 rotate-270" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveTab(idx, "down")}
                    disabled={idx === tabs.length - 1}
                    title="Move tab right"
                    className="p-1 text-navy-500 hover:text-navy-900 disabled:opacity-30 cursor-pointer"
                  >
                    <MoveDown className="w-3 h-3 rotate-270" />
                  </button>
                  {tabs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveTab(idx)}
                      title="Remove category tab"
                      className="p-1 text-terracotta-600 hover:text-terracotta-800 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Tab Detailed Form */}
      {activeTab && (
        <div className="p-5 sm:p-6 rounded-2xl border border-sand-300 bg-sand-50/40 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-sand-200">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-brass-600" />
              <h3 className="text-sm font-bold text-navy-950">
                Tab #{selectedTabIndex + 1}: {activeTab.label}
              </h3>
            </div>
            <Link
              href={activeTab.href || "/catalog"}
              target="_blank"
              className="text-xs text-brass-700 hover:text-brass-900 flex items-center gap-1 font-semibold"
            >
              <span>Preview Link</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          {/* Tab Settings Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-navy-900 block">Tab Label (Nav Text)</label>
              <input
                type="text"
                value={activeTab.label || ""}
                onChange={(e) => handleTabChange("label", e.target.value)}
                placeholder="e.g. Sofas & Seating"
                className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-sand-300 focus:outline-none focus:border-brass-600 font-semibold text-navy-950"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-navy-900 block">Target URL (Href)</label>
              <input
                type="text"
                value={activeTab.href || ""}
                onChange={(e) => handleTabChange("href", e.target.value)}
                placeholder="e.g. /categories/sofas"
                className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-sand-300 focus:outline-none focus:border-brass-600 font-mono text-navy-900"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-navy-900 block">
                Top Nav Badge <span className="text-navy-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={activeTab.badge || ""}
                onChange={(e) => handleTabChange("badge", e.target.value)}
                placeholder="e.g. SALE, HOT, NEW"
                className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-sand-300 focus:outline-none focus:border-brass-600 uppercase font-semibold text-navy-900"
              />
            </div>
          </div>

          {/* Subcategory Columns & Links Manager */}
          <div className="space-y-4 pt-4 border-t border-sand-200">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-navy-950 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-brass-600" />
                  <span>Subcategory Columns ({activeTab.columns?.length || 0})</span>
                </h4>
                <p className="text-[11px] text-navy-600">
                  Organize links under styled column headings. Up to 3 or 4 columns per tab.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddColumn}
                className="px-3 py-1.5 rounded-lg bg-sand-200 hover:bg-sand-300 text-navy-900 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-brass-700" />
                <span>Add Column</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeTab.columns?.map((column, colIdx) => (
                <div
                  key={colIdx}
                  className="p-4 rounded-xl bg-white border border-sand-300 space-y-3.5 shadow-2xs"
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between gap-2 border-b border-sand-200 pb-2">
                    <input
                      type="text"
                      value={column.title}
                      onChange={(e) => handleColumnTitleChange(colIdx, e.target.value)}
                      placeholder="Column Title (e.g. By Style)"
                      className="text-xs font-bold uppercase tracking-wider text-navy-950 bg-sand-50/70 px-2 py-1 rounded border border-sand-200 focus:outline-none focus:border-brass-600 w-full"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveColumn(colIdx)}
                      title="Remove column"
                      className="p-1 rounded text-terracotta-600 hover:bg-terracotta-50 shrink-0 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Links List in Column */}
                  <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                    {column.links.map((link, lIdx) => (
                      <div
                        key={lIdx}
                        className="p-2 rounded-lg bg-sand-50 border border-sand-200/80 space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <input
                            type="text"
                            value={link.label}
                            onChange={(e) =>
                              handleLinkChange(colIdx, lIdx, "label", e.target.value)
                            }
                            placeholder="Link label"
                            className="text-xs font-semibold text-navy-950 bg-white px-2 py-1 rounded border border-sand-200 focus:outline-none focus:border-brass-600 flex-1"
                          />
                          <input
                            type="text"
                            value={link.badge || ""}
                            onChange={(e) =>
                              handleLinkChange(colIdx, lIdx, "badge", e.target.value)
                            }
                            placeholder="Badge"
                            title="Badge e.g. HOT, NEW, SALE"
                            className="text-[10px] font-bold uppercase text-navy-800 bg-white px-1.5 py-1 rounded border border-sand-200 focus:outline-none focus:border-brass-600 w-16 text-center"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveLink(colIdx, lIdx)}
                            title="Remove link"
                            className="p-1 text-terracotta-500 hover:text-terracotta-800 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                        <input
                          type="text"
                          value={link.href}
                          onChange={(e) =>
                            handleLinkChange(colIdx, lIdx, "href", e.target.value)
                          }
                          placeholder="/categories/..."
                          className="w-full text-[11px] font-mono text-navy-700 bg-white px-2 py-0.5 rounded border border-sand-200 focus:outline-none focus:border-brass-600"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Add Link Button */}
                  <button
                    type="button"
                    onClick={() => handleAddLink(colIdx)}
                    className="w-full py-1.5 rounded-lg border border-dashed border-sand-300 hover:border-brass-500 text-navy-700 hover:text-navy-950 text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer bg-sand-50/50"
                  >
                    <Plus className="w-3 h-3 text-brass-700" />
                    <span>Add Link</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Visual Showcase: Promo Banner & Featured Product Cards */}
          <div className="pt-4 border-t border-sand-200 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brass-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-navy-950">
                Visual Showcase Cards (Promo Banner & Highlight Product)
              </h4>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 1. Promotional Banner Card Editor */}
              <div className="p-4 rounded-xl bg-white border border-sand-300 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between border-b border-sand-200 pb-2">
                  <span className="text-xs font-bold text-navy-950 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-brass-600" />
                    <span>Promotional Showcase Banner</span>
                  </span>
                  <span className="text-[10px] text-navy-500 font-mono">Dark Hero Card</span>
                </div>

                <div className="space-y-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-navy-900 block">Badge Tag</label>
                      <input
                        type="text"
                        value={activeTab.featured_promo?.badge || ""}
                        onChange={(e) => handlePromoChange("badge", e.target.value)}
                        placeholder="e.g. HANDCRAFTED UK"
                        className="w-full px-2.5 py-1.5 text-xs bg-sand-50 rounded-lg border border-sand-300 focus:outline-none focus:border-brass-600"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-navy-900 block">CTA Label</label>
                      <input
                        type="text"
                        value={activeTab.featured_promo?.cta_label || ""}
                        onChange={(e) => handlePromoChange("cta_label", e.target.value)}
                        placeholder="e.g. Explore Sandringham"
                        className="w-full px-2.5 py-1.5 text-xs bg-sand-50 rounded-lg border border-sand-300 focus:outline-none focus:border-brass-600"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-navy-900 block">Banner Title</label>
                    <input
                      type="text"
                      value={activeTab.featured_promo?.title || ""}
                      onChange={(e) => handlePromoChange("title", e.target.value)}
                      placeholder="e.g. The Sandringham Bouclé Sofa"
                      className="w-full px-2.5 py-1.5 text-xs bg-sand-50 rounded-lg border border-sand-300 focus:outline-none focus:border-brass-600 font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-navy-900 block">Subtitle / Description</label>
                    <textarea
                      rows={2}
                      value={activeTab.featured_promo?.subtitle || ""}
                      onChange={(e) => handlePromoChange("subtitle", e.target.value)}
                      placeholder="Short editorial description..."
                      className="w-full px-2.5 py-1.5 text-xs bg-sand-50 rounded-lg border border-sand-300 focus:outline-none focus:border-brass-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-navy-900 block">CTA Destination URL</label>
                    <input
                      type="text"
                      value={activeTab.featured_promo?.cta_href || ""}
                      onChange={(e) => handlePromoChange("cta_href", e.target.value)}
                      placeholder="/products/..."
                      className="w-full px-2.5 py-1.5 text-xs bg-sand-50 rounded-lg border border-sand-300 focus:outline-none focus:border-brass-600 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-navy-900 block">Banner Image URL</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={activeTab.featured_promo?.image_url || ""}
                        onChange={(e) => handlePromoChange("image_url", e.target.value)}
                        placeholder="https://..."
                        className="w-full px-2.5 py-1.5 text-xs bg-sand-50 rounded-lg border border-sand-300 focus:outline-none focus:border-brass-600 font-mono text-navy-700"
                      />
                      {activeTab.featured_promo?.image_url && (
                        <div className="w-10 h-9 rounded bg-sand-200 overflow-hidden shrink-0 border border-sand-300">
                          <img
                            src={activeTab.featured_promo.image_url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Featured Product Card Editor */}
              <div className="p-4 rounded-xl bg-white border border-sand-300 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between border-b border-sand-200 pb-2">
                  <span className="text-xs font-bold text-navy-950 flex items-center gap-1.5">
                    <ShoppingBag className="w-3.5 h-3.5 text-brass-600" />
                    <span>Featured Product Highlight</span>
                  </span>
                  <span className="text-[10px] text-navy-500 font-mono">Product Card</span>
                </div>

                <div className="space-y-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-navy-900 block">Badge Tag</label>
                      <input
                        type="text"
                        value={activeTab.featured_product?.tag || ""}
                        onChange={(e) => handleProductChange("tag", e.target.value)}
                        placeholder="e.g. 2-Man Delivery"
                        className="w-full px-2.5 py-1.5 text-xs bg-sand-50 rounded-lg border border-sand-300 focus:outline-none focus:border-brass-600"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-navy-900 block">Price String</label>
                      <input
                        type="text"
                        value={activeTab.featured_product?.price_str || ""}
                        onChange={(e) => handleProductChange("price_str", e.target.value)}
                        placeholder="e.g. £1,495.00"
                        className="w-full px-2.5 py-1.5 text-xs bg-sand-50 rounded-lg border border-sand-300 focus:outline-none focus:border-brass-600 font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-navy-900 block">Product Title</label>
                      <input
                        type="text"
                        value={activeTab.featured_product?.title || ""}
                        onChange={(e) => handleProductChange("title", e.target.value)}
                        placeholder="Product Name"
                        className="w-full px-2.5 py-1.5 text-xs bg-sand-50 rounded-lg border border-sand-300 focus:outline-none focus:border-brass-600 font-semibold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-navy-900 block">
                        Original Price <span className="text-navy-400 font-normal">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        value={activeTab.featured_product?.original_price_str || ""}
                        onChange={(e) =>
                          handleProductChange("original_price_str", e.target.value)
                        }
                        placeholder="e.g. £1,795.00"
                        className="w-full px-2.5 py-1.5 text-xs bg-sand-50 rounded-lg border border-sand-300 focus:outline-none focus:border-brass-600 font-mono text-navy-600"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-navy-900 block">Product Page Link</label>
                    <input
                      type="text"
                      value={activeTab.featured_product?.href || ""}
                      onChange={(e) => handleProductChange("href", e.target.value)}
                      placeholder="/products/..."
                      className="w-full px-2.5 py-1.5 text-xs bg-sand-50 rounded-lg border border-sand-300 focus:outline-none focus:border-brass-600 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-navy-900 block">Product Image URL</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={activeTab.featured_product?.image_url || ""}
                        onChange={(e) => handleProductChange("image_url", e.target.value)}
                        placeholder="https://..."
                        className="w-full px-2.5 py-1.5 text-xs bg-sand-50 rounded-lg border border-sand-300 focus:outline-none focus:border-brass-600 font-mono text-navy-700"
                      />
                      {activeTab.featured_product?.image_url && (
                        <div className="w-10 h-9 rounded bg-sand-200 overflow-hidden shrink-0 border border-sand-300">
                          <img
                            src={activeTab.featured_product.image_url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Bottom Trust & Statutory Perks Strip */}
      <div className="p-5 rounded-2xl border border-sand-300 bg-sand-50/60 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-navy-950 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-brass-600" />
              <span>Bottom Reassurance & Trust Bar ({bottomPerks.length} Perks)</span>
            </h4>
            <p className="text-[11px] text-navy-600">
              Displayed in the bottom strip across all mega menu dropdowns and the mobile sheet.
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddPerk}
            className="px-3 py-1.5 rounded-lg bg-sand-200 hover:bg-sand-300 text-navy-900 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-brass-700" />
            <span>Add Perk</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {bottomPerks.map((perk, pIdx) => (
            <div
              key={pIdx}
              className="p-3 rounded-xl bg-white border border-sand-200 flex items-center gap-2.5 shadow-2xs"
            >
              <select
                value={perk.icon}
                onChange={(e) => handlePerkChange(pIdx, "icon", e.target.value)}
                className="px-2 py-1 text-xs bg-sand-50 rounded border border-sand-300 font-medium text-navy-900 focus:outline-none focus:border-brass-600"
              >
                {AVAILABLE_PERK_ICONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={perk.text}
                onChange={(e) => handlePerkChange(pIdx, "text", e.target.value)}
                placeholder="Statutory perk text..."
                className="w-full px-2.5 py-1 text-xs bg-sand-50 rounded border border-sand-300 font-medium text-navy-950 focus:outline-none focus:border-brass-600"
              />
              <button
                type="button"
                onClick={() => handleRemovePerk(pIdx)}
                title="Remove perk"
                className="p-1 text-terracotta-500 hover:text-terracotta-800 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
