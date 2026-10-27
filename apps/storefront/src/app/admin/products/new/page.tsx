"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Package,
  ArrowLeft,
  Save,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  ImageIcon,
  Flame,
  Truck,
  Sparkles,
  ChevronRight,
  TrendingUp,
  DollarSign,
  Plus,
  Trash2,
  Layers,
  Star,
  Check,
  Calculator,
  Receipt,
  HelpCircle,
  RefreshCw,
  Info
} from "lucide-react";
import { MediaPickerModal } from "@/components/admin/MediaPickerModal";
import { apiUrl } from "@/lib/api-config";
import { formatGBP, type ProductVariant } from "@san-furniture/types";

interface VariantRow {
  id: string;
  title: string;
  sku: string;
  priceModifierGbp: string;
  stockQuantity: number;
}

interface DynamicDeliveryOption {
  id: string;
  name: string;
  badge?: string;
  pricePennies?: number;
  baseFeePennies?: number;
  formattedPrice?: string;
  timeframe?: string;
  isActive?: boolean;
}

export default function AdminNewProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [deliveryOptions, setDeliveryOptions] = useState<DynamicDeliveryOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  // Media Picker state
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [mediaPickerTarget, setMediaPickerTarget] = useState<"thumbnail" | "gallery">("thumbnail");

  // Form State - Basics
  const [title, setTitle] = useState("");
  const [handle, setHandle] = useState("");
  const [categoryId, setCategoryId] = useState("cat_beds");
  const [priceGbp, setPriceGbp] = useState("449.00");
  const [costGbp, setCostGbp] = useState("249.00");
  const [shippingGbp, setShippingGbp] = useState("15.00");
  const [markupPercent, setMarkupPercent] = useState("40");
  const [showFormulaExplanation, setShowFormulaExplanation] = useState(false);
  const [material, setMaterial] = useState("engineered_hardwood");
  const [color, setColor] = useState("Alpine White Gloss & Mirror");
  const [widthCm, setWidthCm] = useState("180");
  const [heightCm, setHeightCm] = useState("206");
  const [depthCm, setDepthCm] = useState("66");
  const [weightKg, setWeightKg] = useState("165");
  const [fireSafety, setFireSafety] = useState(true);
  const [deliveryTier, setDeliveryTier] = useState("two_man_white_glove");
  const [status, setStatus] = useState("published");

  // Form State - Multi-Image Gallery
  const [thumbnailUrl, setThumbnailUrl] = useState(
    "https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=1200&q=85"
  );
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState("");

  // Form State - Product Variations
  const [variants, setVariants] = useState<VariantRow[]>([
    {
      id: "var_1",
      title: "180cm / Alpine White Gloss (Centre Mirrored)",
      sku: "AM-MAD-180-WHT",
      priceModifierGbp: "0.00",
      stockQuantity: 15,
    },
    {
      id: "var_2",
      title: "203cm / Alpine White Gloss (Centre Mirrored)",
      sku: "AM-MAD-203-WHT",
      priceModifierGbp: "70.00",
      stockQuantity: 8,
    },
  ]);

  useEffect(() => {
    async function loadData() {
      try {
        const [resCat, resLogistics] = await Promise.all([
          fetch(apiUrl("/api/admin/categories")),
          fetch(apiUrl("/api/admin/logistics")).catch(() => null),
        ]);

        const dataCat = await resCat.json();
        if (dataCat.categories) setCategories(dataCat.categories);

        if (resLogistics && resLogistics.ok) {
          const logData = await resLogistics.json();
          if (Array.isArray(logData?.deliveryOptions) && logData.deliveryOptions.length > 0) {
            setDeliveryOptions(logData.deliveryOptions);
            const activeOpt = logData.deliveryOptions.find((o: any) => o.isActive !== false) || logData.deliveryOptions[0];
            if (activeOpt) {
              setDeliveryTier(activeOpt.id);
            }
            return;
          }
        }

        // Fallback to public shipping options
        const resShip = await fetch(apiUrl("/api/shipping/options")).catch(() => null);
        if (resShip && resShip.ok) {
          const shipData = await resShip.json();
          if (Array.isArray(shipData?.options) && shipData.options.length > 0) {
            setDeliveryOptions(shipData.options);
            const activeOpt = shipData.options.find((o: any) => o.isActive !== false) || shipData.options[0];
            if (activeOpt) {
              setDeliveryTier(activeOpt.id);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load initial form data:", err);
      }
    }
    loadData();
  }, []);

  // Auto-generate handle
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!handle || handle.startsWith("the-")) {
      setHandle(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)+/g, "")
      );
    }
  };

  // Pricing & Margin Calculations (UK Dropshipping Formula)
  const retailVal = parseFloat(priceGbp) || 0; // Customer retail price inc 20% VAT
  const costVal = parseFloat(costGbp) || 0; // Supplier wholesale trade cost ex VAT
  const shippingVal = parseFloat(shippingGbp) || 0; // Supplier inbound freight
  const targetMarkupVal = parseFloat(markupPercent) || 40; // Target markup percentage

  // Total Landed Cost (Trade Cost + Inbound Shipping)
  const landedCost = costVal + shippingVal;

  // Net Retail Price ex VAT (Retail / 1.20)
  const netRetailVal = retailVal > 0 ? retailVal / 1.20 : 0;

  // UK 20% VAT portion
  const vatAmountVal = retailVal > 0 ? retailVal - netRetailVal : 0;

  // Effective Markup on Landed Cost based on current customer price
  const effectiveMarkupPercent = landedCost > 0 ? (((netRetailVal - landedCost) / landedCost) * 100).toFixed(1) : "0.0";

  // Gross profit & margin (Customer price - Trade cost)
  const grossProfit = retailVal - costVal;
  const grossMarginPercent = retailVal > 0 ? ((grossProfit / retailVal) * 100).toFixed(1) : "0";

  // Net Commercial Profit (Net Retail ex VAT - Landed Cost)
  const netCommercialProfit = netRetailVal - landedCost;
  const netCommercialMarginPercent = netRetailVal > 0 ? ((netCommercialProfit / netRetailVal) * 100).toFixed(1) : "0";

  // Compare-At / Strike-through Anchor Price (Standard 25% above customer price)
  const compareAtVal = retailVal > 0 ? retailVal * 1.25 : 0;

  // Auto-calculated prices based on target markup formula:
  const autoNetRetail = landedCost * (1 + targetMarkupVal / 100);
  const autoRetailIncVat = autoNetRetail * 1.20;

  const handleApplySuggestedPrice = (customMarkup?: number) => {
    const markupToApply = customMarkup !== undefined ? customMarkup : targetMarkupVal;
    if (customMarkup !== undefined) {
      setMarkupPercent(String(customMarkup));
    }
    const net = landedCost * (1 + markupToApply / 100);
    const incVat = net * 1.20;
    setPriceGbp(incVat.toFixed(2));
  };

  // Gallery handlers
  const handleAddImageUrl = () => {
    if (!newImageUrl.trim()) return;
    if (!galleryImages.includes(newImageUrl.trim())) {
      setGalleryImages([...galleryImages, newImageUrl.trim()]);
    }
    setNewImageUrl("");
  };

  const handleRemoveGalleryImage = (idx: number) => {
    setGalleryImages(galleryImages.filter((_, i) => i !== idx));
  };

  const handleSetPrimaryImage = (url: string) => {
    if (!url) return;
    const oldThumb = thumbnailUrl;
    setThumbnailUrl(url);
    if (oldThumb && !galleryImages.includes(oldThumb)) {
      setGalleryImages([oldThumb, ...galleryImages.filter((img) => img !== url)]);
    } else {
      setGalleryImages(galleryImages.filter((img) => img !== url));
    }
  };

  // Variation handlers
  const handleAddVariant = () => {
    const newId = `var_${Date.now()}`;
    setVariants([
      ...variants,
      {
        id: newId,
        title: "Standard Option",
        sku: `SKU-${Date.now().toString().slice(-4)}`,
        priceModifierGbp: "0.00",
        stockQuantity: 10,
      },
    ]);
  };

  const handleRemoveVariant = (id: string) => {
    setVariants(variants.filter((v) => v.id !== id));
  };

  const handleUpdateVariant = (id: string, field: keyof VariantRow, value: any) => {
    setVariants(
      variants.map((v) => (v.id === id ? { ...v, [field]: value } : v))
    );
  };

  // Quick Presets
  const applyAmosMannWardrobePresets = () => {
    setVariants([
      { id: `var_120`, title: "120cm Width / 2 Sliding Doors", sku: "AM-MAD-120-MIR", priceModifierGbp: "-80.00", stockQuantity: 10 },
      { id: `var_150`, title: "150cm Width / 2 Sliding Doors", sku: "AM-MAD-150-MIR", priceModifierGbp: "-40.00", stockQuantity: 12 },
      { id: `var_180`, title: "180cm Width / Centre Mirrored Door", sku: "AM-MAD-180-MIR", priceModifierGbp: "0.00", stockQuantity: 20 },
      { id: `var_203`, title: "203cm Width / Centre Mirrored Door", sku: "AM-MAD-203-MIR", priceModifierGbp: "60.00", stockQuantity: 8 },
      { id: `var_250`, title: "250cm Width / 3 Sliding Mirrored Doors", sku: "AM-MAD-250-MIR", priceModifierGbp: "150.00", stockQuantity: 5 },
    ]);
  };

  const applyFinishPresets = () => {
    setVariants([
      { id: `var_wht`, title: "Alpine White Gloss", sku: "AM-WHT-GLOSS", priceModifierGbp: "0.00", stockQuantity: 15 },
      { id: `var_blk`, title: "Black Ash Effect & White Glass", sku: "AM-BLK-ASH", priceModifierGbp: "20.00", stockQuantity: 10 },
      { id: `var_oak`, title: "Natural Oak Effect & Mirror", sku: "AM-OAK-MIR", priceModifierGbp: "30.00", stockQuantity: 12 },
      { id: `var_gry`, title: "Cashmere Grey High Gloss", sku: "AM-GRY-GLS", priceModifierGbp: "20.00", stockQuantity: 8 },
    ]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const pricePennies = Math.round(retailVal * 100);
      const supplierCostPennies = Math.round(costVal * 100);
      const shippingCostPennies = Math.round(shippingVal * 100);
      const markupPercentage = targetMarkupVal;
      const compareAtPricePennies = Math.round(compareAtVal * 100);

      // Consolidate images
      const allImages = [thumbnailUrl, ...galleryImages.filter((img) => img && img !== thumbnailUrl)];

      // Format variants
      const formattedVariants: ProductVariant[] = variants.map((v) => ({
        id: v.id,
        title: v.title,
        sku: v.sku,
        price_modifier_pennies: Math.round((parseFloat(v.priceModifierGbp) || 0) * 100),
        price_pennies: Math.round((retailVal + (parseFloat(v.priceModifierGbp) || 0)) * 100),
        stock_quantity: Number(v.stockQuantity) || 0,
      }));

      const payload = {
        title,
        handle: handle || title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        categoryId,
        pricePennies,
        compareAtPricePennies,
        supplierCostPennies,
        shippingCostPennies,
        markupPercentage,
        thumbnailUrl,
        images: allImages,
        variants: formattedVariants,
        material,
        color,
        widthCm: parseFloat(widthCm) || 0,
        heightCm: parseFloat(heightCm) || 0,
        depthCm: parseFloat(depthCm) || 0,
        weightKg: parseFloat(weightKg) || 0,
        fireSafetyCompliant: fireSafety,
        deliveryType: deliveryTier,
        status,
      };

      const res = await fetch(apiUrl("/api/admin/products"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create product");

      setSuccessMsg(`Furniture item "${title}" successfully published to MySQL with ${allImages.length} images & ${formattedVariants.length} variants!`);
      setTimeout(() => {
        router.push("/admin/products");
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred while creating product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 antialiased">
      {/* Header with Navigation Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-sand-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-navy-500 mb-1">
            <Link href="/admin" className="hover:text-navy-950">Operations Suite</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href="/admin/products" className="hover:text-navy-950">Products &amp; Inventory</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="font-semibold text-navy-900">Add New Furniture Item</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-navy-950">
            Create Luxury Furniture Record
          </h1>
          <p className="text-xs text-navy-600 mt-0.5">
            Full Multi-Image Gallery &bull; Product Variations &bull; Direct MySQL 3306 &bull; UK Quality Checked
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-sand-300 text-xs font-semibold text-navy-700 bg-sand-50 hover:bg-sand-100 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Catalog</span>
          </Link>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-brass-500 to-brass-600 hover:from-brass-400 hover:to-brass-500 text-navy-950 font-bold text-xs tracking-wide shadow-md shadow-brass-500/20 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? "Publishing to MySQL..." : "Publish Furniture Item"}</span>
          </button>
        </div>
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

      {/* Main Two-Column Layout */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 cols): Core Specifications */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Product Basics */}
          <div className="p-6 bg-sand-50 border border-sand-300 rounded-2xl shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-navy-950 uppercase tracking-wider flex items-center gap-2">
              <Package className="w-4 h-4 text-brass-600" />
              <span>1. General Product Information</span>
            </h2>

            <div>
              <label className="block text-xs font-semibold text-navy-900 mb-1">
                Product Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. Madrid 180cm Luxury Sliding Door Wardrobe with Mirror"
                className="w-full px-3.5 py-2.5 bg-sand-100 border border-sand-300 rounded-xl text-sm font-semibold text-navy-950 focus:outline-none focus:border-brass-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-navy-900 mb-1">
                  URL Handle / Slug
                </label>
                <input
                  type="text"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  placeholder="madrid-180cm-sliding-door-wardrobe"
                  className="w-full px-3 py-2 bg-sand-100 border border-sand-300 rounded-lg text-xs font-mono text-navy-900 focus:outline-none focus:border-brass-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy-900 mb-1">
                  Category
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2 bg-sand-100 border border-sand-300 rounded-lg text-xs text-navy-950 focus:outline-none focus:border-brass-500"
                >
                  {categories.length > 0 ? (
                    categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="cat_beds">Bedroom</option>
                      <option value="cat_living">Living Room</option>
                      <option value="cat_dining">Dining Room</option>
                      <option value="cat_sofas">Sofas &amp; Seating</option>
                      <option value="cat_office">Home Office</option>
                    </>
                  )}
                </select>
              </div>
            </div>
          </div>

          {/* Card 2: Wholesale & Retail Financials */}
          <div className="p-6 bg-sand-50 border border-sand-300 rounded-2xl shadow-sm space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-sm font-bold text-navy-950 uppercase tracking-wider flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>2. Wholesale Cost &amp; Retail Pricing (Inc 20% UK VAT)</span>
              </h2>
              <button
                type="button"
                onClick={() => setShowFormulaExplanation(!showFormulaExplanation)}
                className="inline-flex items-center gap-1.5 text-xs text-brass-700 hover:text-brass-800 font-semibold underline underline-offset-2 transition-colors cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>{showFormulaExplanation ? "Hide Formula Guide" : "How is Price Calculated?"}</span>
              </button>
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Customer Price */}
              <div className="sm:col-span-1">
                <label className="block text-xs font-semibold text-navy-900 mb-1">
                  Customer Price (£ Inc VAT) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-navy-700 text-sm">£</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={priceGbp}
                    onChange={(e) => setPriceGbp(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 bg-sand-100 border border-sand-300 rounded-lg text-sm font-bold text-navy-950 focus:outline-none focus:border-brass-500"
                  />
                </div>
                <p className="text-[11px] text-navy-500 mt-1">
                  Includes 20% UK VAT (£{vatAmountVal.toFixed(2)} statutory VAT).
                </p>
              </div>

              {/* Wholesale Trade Cost */}
              <div className="sm:col-span-1">
                <label className="block text-xs font-semibold text-navy-900 mb-1">
                  Wholesale Cost (£ ex VAT) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-navy-700 text-sm">£</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={costGbp}
                    onChange={(e) => setCostGbp(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 bg-sand-100 border border-sand-300 rounded-lg text-sm font-mono text-navy-950 focus:outline-none focus:border-brass-500"
                  />
                </div>
                <p className="text-[11px] text-navy-500 mt-1">
                  Supplier trade unit cost.
                </p>
              </div>

              {/* Inbound Shipping / Carriage */}
              <div className="sm:col-span-1">
                <label className="block text-xs font-semibold text-navy-900 mb-1">
                  Supplier Carriage (£)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-navy-700 text-sm">£</span>
                  <input
                    type="number"
                    step="0.01"
                    value={shippingGbp}
                    onChange={(e) => setShippingGbp(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 bg-sand-100 border border-sand-300 rounded-lg text-sm font-mono text-navy-950 focus:outline-none focus:border-brass-500"
                  />
                </div>
                <p className="text-[11px] text-navy-500 mt-1">
                  Inbound dropship freight.
                </p>
              </div>

              {/* Target Markup % & Presets */}
              <div className="sm:col-span-1">
                <label className="block text-xs font-semibold text-navy-900 mb-1">
                  Target Markup (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="1"
                    value={markupPercent}
                    onChange={(e) => setMarkupPercent(e.target.value)}
                    className="w-full pr-8 pl-3 py-2 bg-sand-100 border border-sand-300 rounded-lg text-sm font-bold text-navy-950 focus:outline-none focus:border-brass-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-navy-500 text-xs">%</span>
                </div>
                <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                  {[30, 35, 40, 45, 50].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => handleApplySuggestedPrice(pct)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                        Math.round(targetMarkupVal) === pct
                          ? "bg-navy-950 text-white"
                          : "bg-sand-200 text-navy-800 hover:bg-sand-300"
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Auto-calculate Helper Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-sand-100/90 border border-sand-300/80">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-brass-100 border border-brass-300/60 flex items-center justify-center flex-shrink-0">
                  <Calculator className="w-3.5 h-3.5 text-brass-700" />
                </div>
                <div className="text-xs text-navy-800">
                  <span>
                    Formula Retail at <strong className="text-navy-950">{targetMarkupVal}% markup</strong>:{" "}
                    <strong className="text-emerald-800 font-mono text-sm">£{autoRetailIncVat.toFixed(2)}</strong>{" "}
                    <span className="text-navy-500 text-[11px]">(Inc 20% VAT)</span>
                  </span>
                  <span className="block text-[11px] text-navy-500">
                    Landed Cost (£{landedCost.toFixed(2)}) × {(1 + targetMarkupVal / 100).toFixed(2)} Net × 1.20 VAT
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleApplySuggestedPrice()}
                className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 shadow-xs transition-colors flex-shrink-0 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Apply Formula Price</span>
              </button>
            </div>

            {/* LIVE PRICE BREAKDOWN FORMULA CARD */}
            <div className="p-4 rounded-xl bg-white border border-sand-300 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-sand-200 pb-2.5">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-navy-800" />
                  <span className="text-xs font-bold text-navy-950 uppercase tracking-wider">
                    Interactive Price Calculation &amp; UK Tax Breakdown
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-navy-100 text-navy-900 border border-navy-200">
                  HMRC 20% VAT Compliant
                </span>
              </div>

              {/* Step-by-Step Mathematical Flow */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-2.5 text-center items-stretch">
                {/* Step 1 */}
                <div className="p-2.5 bg-sand-50 rounded-xl border border-sand-200 flex flex-col justify-between">
                  <span className="text-[10px] uppercase font-bold text-navy-500">1. Trade Cost</span>
                  <p className="text-base font-mono font-bold text-navy-900 my-1">
                    £{costVal.toFixed(2)}
                  </p>
                  <span className="text-[10px] text-navy-500">Wholesale ex VAT</span>
                </div>

                {/* Step 2 */}
                <div className="p-2.5 bg-sand-50 rounded-xl border border-sand-200 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-navy-500">2. Freight</span>
                    <span className="text-[10px] font-bold text-navy-400">+</span>
                  </div>
                  <p className="text-base font-mono font-bold text-navy-900 my-1">
                    £{shippingVal.toFixed(2)}
                  </p>
                  <span className="text-[10px] text-navy-500">Supplier Carriage</span>
                </div>

                {/* Step 3 */}
                <div className="p-2.5 bg-sand-100/70 rounded-xl border border-sand-300 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-navy-700">3. Landed Cost</span>
                    <span className="text-[10px] font-bold text-navy-400">=</span>
                  </div>
                  <p className="text-base font-mono font-bold text-navy-950 my-1">
                    £{landedCost.toFixed(2)}
                  </p>
                  <span className="text-[10px] text-navy-600">Base Unit COGS</span>
                </div>

                {/* Step 4 */}
                <div className="p-2.5 bg-sand-50 rounded-xl border border-sand-200 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-navy-500">4. Net Retail</span>
                    <span className="text-[10px] font-bold text-brass-600">+{effectiveMarkupPercent}%</span>
                  </div>
                  <p className="text-base font-mono font-bold text-navy-900 my-1">
                    £{netRetailVal.toFixed(2)}
                  </p>
                  <span className="text-[10px] text-navy-500">Selling Price ex VAT</span>
                </div>

                {/* Step 5 */}
                <div className="p-2.5 bg-sand-50 rounded-xl border border-sand-200 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-navy-500">5. UK 20% VAT</span>
                    <span className="text-[10px] font-bold text-navy-400">+</span>
                  </div>
                  <p className="text-base font-mono font-bold text-amber-900 my-1">
                    £{vatAmountVal.toFixed(2)}
                  </p>
                  <span className="text-[10px] text-amber-700">Statutory Tax</span>
                </div>

                {/* Step 6 */}
                <div className="p-2.5 bg-emerald-50/80 rounded-xl border border-emerald-300 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-emerald-800">6. Customer Price</span>
                    <span className="text-[10px] font-bold text-emerald-700">=</span>
                  </div>
                  <p className="text-base font-mono font-bold text-emerald-950 my-1">
                    £{retailVal.toFixed(2)}
                  </p>
                  <span className="text-[10px] text-emerald-700 font-semibold">Storefront Retail</span>
                </div>
              </div>

              {/* Key Financial Margins Summary Bar */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-sand-200 text-xs">
                <div className="p-2.5 rounded-lg bg-sand-100/60 border border-sand-200">
                  <span className="text-[10px] font-bold uppercase text-navy-600 block">Gross Profit</span>
                  <p className="text-base font-mono font-bold text-emerald-800">
                    £{grossProfit.toFixed(2)}
                  </p>
                  <span className="text-[10px] text-navy-500">Retail (£{retailVal.toFixed(2)}) − Trade (£{costVal.toFixed(2)})</span>
                </div>

                <div className="p-2.5 rounded-lg bg-sand-100/60 border border-sand-200">
                  <span className="text-[10px] font-bold uppercase text-navy-600 block">Gross Margin</span>
                  <p className="text-base font-display font-bold text-emerald-700">
                    {grossMarginPercent}%
                  </p>
                  <span className="text-[10px] text-navy-500">Percentage of customer retail</span>
                </div>

                <div className="p-2.5 rounded-lg bg-sand-100/60 border border-sand-200">
                  <span className="text-[10px] font-bold uppercase text-navy-600 block">Net Operating Profit</span>
                  <p className="text-base font-mono font-bold text-navy-950">
                    £{netCommercialProfit.toFixed(2)}
                  </p>
                  <span className="text-[10px] text-navy-500">Net ex VAT (£{netRetailVal.toFixed(2)}) − Landed (£{landedCost.toFixed(2)})</span>
                </div>

                <div className="p-2.5 rounded-lg bg-sand-100/60 border border-sand-200">
                  <span className="text-[10px] font-bold uppercase text-navy-600 block">Anchor RRP / Strike-Price</span>
                  <p className="text-base font-mono font-bold text-navy-800">
                    £{compareAtVal.toFixed(2)}
                  </p>
                  <span className="text-[10px] text-navy-500">Compare-at price (+25% strike-through)</span>
                </div>
              </div>

              {/* Formula Explanation Guide Dropdown / Card */}
              {showFormulaExplanation && (
                <div className="p-4 rounded-xl bg-navy-950 text-sand-100 space-y-2.5 text-xs animate-fade-in border border-navy-800">
                  <div className="flex items-center gap-1.5 font-bold text-brass-400">
                    <Info className="w-4 h-4" />
                    <span>SAN Furniture UK Dropshipping Pricing Formula</span>
                  </div>
                  <div className="space-y-1.5 text-sand-200 text-[11px] leading-relaxed">
                    <p>
                      <strong>1. Landed Cost:</strong> Wholesale Trade Cost (£{costVal.toFixed(2)}) + Supplier Carriage (£{shippingVal.toFixed(2)}) = <strong>£{landedCost.toFixed(2)}</strong>
                    </p>
                    <p>
                      <strong>2. Net Selling Price (ex VAT):</strong> Landed Cost (£{landedCost.toFixed(2)}) × (1 + {targetMarkupVal}%) = <strong>£{autoNetRetail.toFixed(2)}</strong>
                    </p>
                    <p>
                      <strong>3. UK Statutory VAT (20%):</strong> Net Selling Price (£{autoNetRetail.toFixed(2)}) × 0.20 = <strong>£{(autoNetRetail * 0.20).toFixed(2)}</strong>
                    </p>
                    <p>
                      <strong>4. Customer Retail Price (Inc 20% VAT):</strong> Net Price (£{autoNetRetail.toFixed(2)}) + VAT (£{(autoNetRetail * 0.20).toFixed(2)}) = <strong>£{autoRetailIncVat.toFixed(2)}</strong>
                    </p>
                    <p>
                      <strong>5. Compare-At / Strike Price (RRP):</strong> Customer Price (£{retailVal.toFixed(2)}) × 1.25 = <strong>£{compareAtVal.toFixed(2)}</strong>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Card 3: Multi-Image Gallery Manager */}
          <div className="p-6 bg-sand-50 border border-sand-300 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-sm font-bold text-navy-950 uppercase tracking-wider flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-brass-600" />
                <span>3. Product Photography &amp; Multi-Image Gallery</span>
              </h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMediaPickerTarget("thumbnail");
                    setIsMediaPickerOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sand-200 hover:bg-sand-300 text-navy-900 font-semibold text-xs transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-brass-600" />
                  <span>Choose Thumbnail</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMediaPickerTarget("gallery");
                    setIsMediaPickerOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy-950 hover:bg-navy-900 text-sand-50 font-semibold text-xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-brass-400" />
                  <span>Add to Gallery</span>
                </button>
              </div>
            </div>

            {/* Primary Thumbnail */}
            <div className="p-4 rounded-xl bg-sand-100 border border-sand-300 space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-navy-900 flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-brass-500 fill-brass-500" />
                <span>Primary Cover Thumbnail</span>
              </span>
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                <div className="w-24 h-24 rounded-lg bg-sand-200 border border-sand-300 overflow-hidden flex-shrink-0 shadow-xs relative">
                  {thumbnailUrl ? (
                    <img src={thumbnailUrl} alt="Thumbnail preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-navy-400">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                  )}
                </div>
                <div className="flex-1 w-full space-y-1.5">
                  <input
                    type="url"
                    required
                    value={thumbnailUrl}
                    onChange={(e) => setThumbnailUrl(e.target.value)}
                    placeholder="https://... or /images/..."
                    className="w-full px-3 py-2 bg-sand-50 border border-sand-300 rounded-lg text-xs font-mono text-navy-950 focus:outline-none focus:border-brass-500"
                  />
                  <p className="text-[11px] text-navy-500">
                    Main photo shown on catalog grid and Google Shopping feed.
                  </p>
                </div>
              </div>
            </div>

            {/* Additional Gallery Images */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-navy-900">
                  Additional Gallery Images &amp; Layout Diagrams ({galleryImages.length})
                </span>
              </div>

              {/* Add by URL input */}
              <div className="flex gap-2">
                <input
                  type="url"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddImageUrl();
                    }
                  }}
                  placeholder="Paste additional image URL (e.g. room view, internal wardrobe diagram, close up)..."
                  className="flex-1 px-3 py-2 bg-sand-100 border border-sand-300 rounded-lg text-xs font-mono text-navy-950 focus:outline-none focus:border-brass-500"
                />
                <button
                  type="button"
                  onClick={handleAddImageUrl}
                  className="px-3.5 py-2 rounded-lg bg-sand-200 hover:bg-sand-300 text-navy-950 font-bold text-xs flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add URL</span>
                </button>
              </div>

              {/* Gallery Thumbnails List */}
              {galleryImages.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 pt-2">
                  {galleryImages.map((imgUrl, idx) => (
                    <div
                      key={idx}
                      className="group relative aspect-square rounded-xl bg-sand-200 border border-sand-300 overflow-hidden shadow-xs hover:border-brass-500 transition-colors"
                    >
                      <img src={imgUrl} alt={`Gallery item ${idx + 1}`} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-navy-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 p-2">
                        <button
                          type="button"
                          onClick={() => handleSetPrimaryImage(imgUrl)}
                          className="w-full py-1 text-[10px] font-bold text-sand-50 bg-brass-600 hover:bg-brass-500 rounded text-center transition-colors"
                        >
                          Set Primary
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveGalleryImage(idx)}
                          className="w-full py-1 text-[10px] font-bold text-white bg-red-600 hover:bg-red-500 rounded text-center transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                      <span className="absolute bottom-1 left-1 bg-navy-950/80 text-sand-50 text-[9px] px-1.5 py-0.5 rounded font-mono">
                        #{idx + 2}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-dashed border-sand-300 text-center text-xs text-navy-500">
                  No additional images in gallery yet. Add wardrobe layout diagrams, room scenes, or detail shots above.
                </div>
              )}
            </div>
          </div>

          {/* Card 4: Product Variations & Options (Sizes, Finishes & Mirror Choices) */}
          <div className="p-6 bg-sand-50 border border-sand-300 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h2 className="text-sm font-bold text-navy-950 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-brass-600" />
                  <span>4. Product Variations &amp; Options</span>
                </h2>
                <p className="text-xs text-navy-500 mt-0.5">
                  Allows customers on the storefront to select Sizes, Finishes &amp; Door options with dynamic pricing.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={applyAmosMannWardrobePresets}
                  className="px-2.5 py-1.5 rounded-lg border border-sand-300 bg-sand-100 hover:bg-sand-200 text-navy-900 text-[11px] font-semibold transition-colors"
                  title="Populate 120cm, 150cm, 180cm, 203cm, 250cm variants"
                >
                  Wardrobe Sizes Preset
                </button>
                <button
                  type="button"
                  onClick={applyFinishPresets}
                  className="px-2.5 py-1.5 rounded-lg border border-sand-300 bg-sand-100 hover:bg-sand-200 text-navy-900 text-[11px] font-semibold transition-colors"
                  title="Populate White, Black, Oak, Cashmere finishes"
                >
                  Finishes Preset
                </button>
                <button
                  type="button"
                  onClick={handleAddVariant}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-navy-950 hover:bg-navy-900 text-sand-50 font-semibold text-xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-brass-400" />
                  <span>Add Option</span>
                </button>
              </div>
            </div>

            {/* Variations Table */}
            {variants.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-sand-300 bg-sand-100/60">
                <table className="w-full text-left text-xs">
                  <thead className="bg-sand-200/70 border-b border-sand-300 text-navy-900 font-bold">
                    <tr>
                      <th className="py-2.5 px-3">Option Title / Description</th>
                      <th className="py-2.5 px-3">Supplier SKU</th>
                      <th className="py-2.5 px-3">Price Modifier (£)</th>
                      <th className="py-2.5 px-3">Final Customer Price</th>
                      <th className="py-2.5 px-3">Stock</th>
                      <th className="py-2.5 px-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sand-300">
                    {variants.map((v) => {
                      const mod = parseFloat(v.priceModifierGbp) || 0;
                      const finalPrice = Math.max(0, retailVal + mod);

                      return (
                        <tr key={v.id} className="hover:bg-sand-200/40 transition-colors">
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={v.title}
                              onChange={(e) => handleUpdateVariant(v.id, "title", e.target.value)}
                              placeholder="e.g. 180cm / White Gloss"
                              className="w-full px-2 py-1 bg-white border border-sand-300 rounded text-xs font-semibold text-navy-950 focus:outline-none focus:border-brass-500"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={v.sku}
                              onChange={(e) => handleUpdateVariant(v.id, "sku", e.target.value)}
                              placeholder="AM-SKU-01"
                              className="w-28 px-2 py-1 bg-white border border-sand-300 rounded text-xs font-mono text-navy-950 focus:outline-none focus:border-brass-500"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <div className="relative w-24">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-navy-600 font-bold">£</span>
                              <input
                                type="number"
                                step="1"
                                value={v.priceModifierGbp}
                                onChange={(e) => handleUpdateVariant(v.id, "priceModifierGbp", e.target.value)}
                                className="w-full pl-5 pr-1 py-1 bg-white border border-sand-300 rounded text-xs font-bold text-navy-950 focus:outline-none focus:border-brass-500"
                              />
                            </div>
                          </td>
                          <td className="py-2 px-3 font-bold text-navy-950">
                            £{finalPrice.toFixed(2)}
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              value={v.stockQuantity}
                              onChange={(e) => handleUpdateVariant(v.id, "stockQuantity", parseInt(e.target.value) || 0)}
                              className="w-16 px-2 py-1 bg-white border border-sand-300 rounded text-xs font-mono text-navy-950 focus:outline-none focus:border-brass-500"
                            />
                          </td>
                          <td className="py-2 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveVariant(v.id)}
                              className="p-1 rounded text-red-600 hover:bg-red-50 transition-colors"
                              title="Delete variation"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-dashed border-sand-300 text-center text-xs text-navy-500">
                Single standard item with no variations. Click &ldquo;Add Option&rdquo; or a preset above to configure variations.
              </div>
            )}
          </div>

          {/* Card 5: UK Furniture Specifications & Dimensions */}
          <div className="p-6 bg-sand-50 border border-sand-300 rounded-2xl shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-navy-950 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-brass-600" />
              <span>5. Dimensions, Materials &amp; Quality Specs</span>
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-navy-800 mb-1">Width (cm)</label>
                <input
                  type="number"
                  value={widthCm}
                  onChange={(e) => setWidthCm(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-sand-100 border border-sand-300 rounded-lg text-xs text-navy-950"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-navy-800 mb-1">Height (cm)</label>
                <input
                  type="number"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-sand-100 border border-sand-300 rounded-lg text-xs text-navy-950"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-navy-800 mb-1">Depth (cm)</label>
                <input
                  type="number"
                  value={depthCm}
                  onChange={(e) => setDepthCm(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-sand-100 border border-sand-300 rounded-lg text-xs text-navy-950"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-navy-800 mb-1">Weight (kg)</label>
                <input
                  type="number"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-sand-100 border border-sand-300 rounded-lg text-xs text-navy-950"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-navy-900 mb-1">Primary Material</label>
                <select
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  className="w-full px-3 py-2 bg-sand-100 border border-sand-300 rounded-lg text-xs text-navy-950 focus:outline-none focus:border-brass-500"
                >
                  <option value="engineered_hardwood">High Density Laminated MDF &amp; Glass</option>
                  <option value="solid_oak">Solid European White Oak</option>
                  <option value="boucle">Textured Bouclé</option>
                  <option value="velvet">Luxury Matte Velvet</option>
                  <option value="leather">Full-Grain Aniline Leather</option>
                  <option value="none">Timber / Glass Laminate</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy-900 mb-1">Color / Finish</label>
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="e.g. Alpine White Gloss & Mirror"
                  className="w-full px-3 py-2 bg-sand-100 border border-sand-300 rounded-lg text-xs text-navy-950 focus:outline-none focus:border-brass-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-navy-900">
                    UK Delivery Tier &amp; Logistics System
                  </label>
                  <Link
                    href="/admin/logistics"
                    target="_blank"
                    className="text-[10px] text-brass-700 hover:text-brass-800 font-semibold flex items-center gap-1 hover:underline"
                    title="Manage dynamic store delivery options in Logistics"
                  >
                    <Truck className="w-3 h-3 text-brass-600" />
                    <span>Manage Options</span>
                  </Link>
                </div>
                <select
                  value={deliveryTier}
                  onChange={(e) => setDeliveryTier(e.target.value)}
                  className="w-full px-3 py-2 bg-sand-100 border border-sand-300 rounded-lg text-xs text-navy-950 focus:outline-none focus:border-brass-500 font-medium"
                >
                  {deliveryOptions.length > 0 ? (
                    deliveryOptions.map((opt) => {
                      const feeStr =
                        opt.formattedPrice ||
                        (typeof opt.pricePennies === "number"
                          ? opt.pricePennies === 0
                            ? "FREE"
                            : formatGBP(opt.pricePennies)
                          : typeof opt.baseFeePennies === "number"
                          ? opt.baseFeePennies === 0
                            ? "FREE"
                            : formatGBP(opt.baseFeePennies)
                          : "");
                      return (
                        <option key={opt.id} value={opt.id}>
                          {opt.name} {feeStr ? `(${feeStr})` : ""}{opt.badge ? ` • ${opt.badge}` : ""}
                        </option>
                      );
                    })
                  ) : (
                    <option value="">No delivery options configured in Logistics</option>
                  )}
                </select>
                <p className="text-[10px] text-navy-500 mt-1">
                  Synchronized dynamically with Admin Logistics options and UK postcode surcharge zones.
                </p>
              </div>

              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-navy-800">
                  <input
                    type="checkbox"
                    checked={fireSafety}
                    onChange={(e) => setFireSafety(e.target.checked)}
                    className="w-4 h-4 rounded text-brass-500 focus:ring-0"
                  />
                  <span className="font-semibold">UK Quality Checked</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (1 col): Publish Status & Live Storefront Preview */}
        <div className="space-y-6">
          {/* Publish Box */}
          <div className="p-6 bg-sand-50 border border-sand-300 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-navy-900">
              Publish Settings
            </h3>

            <div>
              <label className="block text-xs font-semibold text-navy-800 mb-1">Catalog Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 bg-sand-100 border border-sand-300 rounded-lg text-xs font-semibold text-navy-950 focus:outline-none focus:border-brass-500"
              >
                <option value="published">Published (Live on UK Storefront)</option>
                <option value="draft">Draft (Hidden)</option>
              </select>
            </div>

            <div className="pt-3 border-t border-sand-200 flex items-center justify-between text-xs">
              <span className="text-navy-600">Total Images:</span>
              <span className="font-mono font-semibold text-navy-900">
                {1 + galleryImages.length} photos
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-navy-600">Active Variants:</span>
              <span className="font-mono font-semibold text-navy-900">
                {variants.length} options
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-brass-500 to-brass-600 hover:from-brass-400 hover:to-brass-500 text-navy-950 font-bold text-xs tracking-wide shadow-md shadow-brass-500/20 transition-all disabled:opacity-50"
            >
              {loading ? "Publishing to MySQL..." : "Publish Furniture Item"}
            </button>
          </div>

          {/* Live Storefront Card Preview */}
          <div className="p-6 bg-sand-50 border border-sand-300 rounded-2xl shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-navy-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-brass-600" />
              <span>Live Storefront Preview</span>
            </h3>

            <div className="rounded-xl overflow-hidden border border-sand-300 bg-white shadow-xs">
              <div className="aspect-[4/3] bg-sand-200 relative overflow-hidden">
                <img
                  src={thumbnailUrl || "https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=1200&q=85"}
                  alt={title || "Preview"}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 bg-navy-950 text-brass-400 text-[9px] font-bold uppercase px-2 py-0.5 rounded tracking-wider">
                  UK Handcrafted
                </div>
                {galleryImages.length > 0 && (
                  <div className="absolute bottom-2 right-2 bg-navy-950/80 text-sand-50 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    +{galleryImages.length} images
                  </div>
                )}
              </div>
              <div className="p-4 space-y-1.5">
                <p className="text-[10px] text-brass-700 font-semibold uppercase tracking-wider">
                  {categoryId.replace("cat_", "")}
                </p>
                <h4 className="font-display text-sm font-bold text-navy-950 truncate">
                  {title || "Madrid 180cm Luxury Sliding Wardrobe"}
                </h4>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-sm font-bold text-navy-950">
                    £{parseFloat(priceGbp || "0").toFixed(2)}
                  </span>
                  <span className="text-[10px] text-emerald-800 bg-emerald-100 font-semibold px-2 py-0.5 rounded-full">
                    Verified
                  </span>
                </div>

                {variants.length > 0 && (
                  <div className="pt-2 border-t border-sand-100 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-navy-500">Options:</span>
                    {variants.slice(0, 3).map((v) => (
                      <span key={v.id} className="text-[9px] px-1.5 py-0.5 bg-sand-100 border border-sand-200 rounded text-navy-700">
                        {v.title.split("/")[0].trim()}
                      </span>
                    ))}
                    {variants.length > 3 && (
                      <span className="text-[9px] text-navy-400">+{variants.length - 3} more</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* WordPress Media Picker Modal */}
      <MediaPickerModal
        isOpen={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        onSelect={(url) => {
          if (mediaPickerTarget === "thumbnail") {
            setThumbnailUrl(url);
          } else {
            if (!galleryImages.includes(url)) {
              setGalleryImages([...galleryImages, url]);
            }
          }
          setIsMediaPickerOpen(false);
        }}
        currentUrl={mediaPickerTarget === "thumbnail" ? thumbnailUrl : undefined}
        title={mediaPickerTarget === "thumbnail" ? "Select Cover Thumbnail" : "Select Gallery Image"}
        buttonLabel={mediaPickerTarget === "thumbnail" ? "Set as Cover Thumbnail" : "Add to Image Gallery"}
      />
    </div>
  );
}
