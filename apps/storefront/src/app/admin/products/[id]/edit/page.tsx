"use client";

import React, { useState, useEffect, use } from "react";
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
  DollarSign,
  Trash2,
  ExternalLink,
  Plus,
  Layers,
  Star
} from "lucide-react";
import { MediaPickerModal } from "@/components/admin/MediaPickerModal";
import { apiUrl } from "@/lib/api-config";
import { formatGBP, type ProductVariant } from "@san-furniture/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

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

export default function AdminEditProductPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const productId = resolvedParams.id;
  const router = useRouter();

  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [deliveryOptions, setDeliveryOptions] = useState<DynamicDeliveryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState("");

  // Form State - Variations
  const [variants, setVariants] = useState<VariantRow[]>([]);

  // Load product, categories & dynamic delivery tiers
  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        const [resProd, resCat, resLogistics] = await Promise.all([
          fetch(apiUrl(`/api/admin/products/${productId}`)),
          fetch(apiUrl("/api/admin/categories")),
          fetch(apiUrl("/api/admin/logistics")).catch(() => null),
        ]);

        const dataProd = await resProd.json();
        const dataCat = await resCat.json();

        if (dataCat.categories) setCategories(dataCat.categories);

        if (resLogistics && resLogistics.ok) {
          const logData = await resLogistics.json();
          if (Array.isArray(logData?.deliveryOptions) && logData.deliveryOptions.length > 0) {
            setDeliveryOptions(logData.deliveryOptions);
          }
        } else {
          // Fallback to public shipping options
          const resShip = await fetch(apiUrl("/api/shipping/options")).catch(() => null);
          if (resShip && resShip.ok) {
            const shipData = await resShip.json();
            if (Array.isArray(shipData?.options)) {
              setDeliveryOptions(shipData.options);
            }
          }
        }

        if (dataProd.product) {
          const p = dataProd.product;
          setTitle(p.title || "");
          setHandle(p.handle || "");
          setCategoryId(p.category_id || "cat_beds");
          setPriceGbp((p.price_pennies / 100).toFixed(2));
          setCostGbp(p.cost_price_pennies ? (p.cost_price_pennies / 100).toFixed(2) : "0.00");
          setThumbnailUrl(p.thumbnail_url || "");
          setMaterial(p.material || "engineered_hardwood");
          setColor(p.color || "Alpine White Gloss");
          setWidthCm(p.width_cm ? String(p.width_cm) : "180");
          setHeightCm(p.height_cm ? String(p.height_cm) : "206");
          setDepthCm(p.depth_cm ? String(p.depth_cm) : "66");
          setWeightKg(p.weight_kg ? String(p.weight_kg) : "165");
          setFireSafety(Boolean(p.fire_safety_compliant));
          setDeliveryTier(p.delivery_tier || "two_man_white_glove");
          setStatus(p.status || "published");

          // Load gallery images
          const rawImages: string[] = p.images || (p.images_json ? (typeof p.images_json === "string" ? JSON.parse(p.images_json) : p.images_json) : []);
          setGalleryImages(rawImages.filter((img) => img && img !== p.thumbnail_url));

          // Load variants
          const rawVariants: any[] = p.variants || (p.variants_json ? (typeof p.variants_json === "string" ? JSON.parse(p.variants_json) : p.variants_json) : []);
          if (Array.isArray(rawVariants) && rawVariants.length > 0) {
            setVariants(
              rawVariants.map((v, i) => ({
                id: v.id || `var_${i}`,
                title: v.title || "Option",
                sku: v.sku || "",
                priceModifierGbp: v.price_modifier_pennies !== undefined
                  ? (v.price_modifier_pennies / 100).toFixed(2)
                  : (v.price_pennies ? ((v.price_pennies - p.price_pennies) / 100).toFixed(2) : "0.00"),
                stockQuantity: v.stock_quantity ?? 10,
              }))
            );
          }
        } else {
          setErrorMsg("Product not found in MySQL database");
        }
      } catch (err: any) {
        setErrorMsg(err.message || "Failed to load product details");
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [productId]);

  // Margin calculation
  const retailVal = parseFloat(priceGbp) || 0;
  const costVal = parseFloat(costGbp) || 0;
  const grossProfit = retailVal - costVal;
  const grossMarginPercent = retailVal > 0 ? ((grossProfit / retailVal) * 100).toFixed(1) : "0";

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
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const pricePennies = Math.round(retailVal * 100);
      const supplierCostPennies = Math.round(costVal * 100);

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
        categoryId,
        pricePennies,
        supplierCostPennies,
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
      };

      const res = await fetch(apiUrl(`/api/admin/products/${productId}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update product");

      setSuccessMsg(`Furniture item "${title}" successfully updated with ${allImages.length} images & ${formattedVariants.length} variants!`);
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred while updating product");
    } finally {
      setSaving(false);
    }
  };
  if (loading) {
    return (
      <div className="space-y-6 pb-12 antialiased animate-pulse">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-sand-200">
          <div className="space-y-2">
            <div className="h-4 w-48 bg-sand-200 rounded shimmer-skeleton" />
            <div className="h-8 w-72 bg-sand-200 rounded-lg shimmer-skeleton" />
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-28 bg-sand-200 rounded-xl shimmer-skeleton" />
            <div className="h-10 w-32 bg-sand-200 rounded-xl shimmer-skeleton" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 bg-sand-50 border border-sand-300 rounded-2xl h-64 shimmer-skeleton" />
            <div className="p-6 bg-sand-50 border border-sand-300 rounded-2xl h-48 shimmer-skeleton" />
          </div>
          <div className="space-y-6">
            <div className="p-6 bg-sand-50 border border-sand-300 rounded-2xl h-72 shimmer-skeleton" />
          </div>
        </div>
      </div>
    );
  }

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
            <span className="font-semibold text-navy-900 truncate max-w-xs">{title}</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-navy-950">
            Edit Furniture: {title}
          </h1>
          <p className="text-xs text-navy-600 mt-0.5">
            Full Multi-Image Gallery &bull; Product Variations &bull; Direct MySQL 3306 &bull; UK Quality Checked
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/products/${handle}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-sand-300 text-xs font-semibold text-navy-700 bg-sand-50 hover:bg-sand-100 transition-colors"
          >
            <span>View Live on Storefront</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/admin/products"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-sand-300 text-xs font-semibold text-navy-700 bg-sand-50 hover:bg-sand-100 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </Link>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-brass-500 to-brass-600 hover:from-brass-400 hover:to-brass-500 text-navy-950 font-bold text-xs tracking-wide shadow-md shadow-brass-500/20 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Saving Changes..." : "Save Product Changes"}</span>
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
                onChange={(e) => setTitle(e.target.value)}
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
                  disabled
                  value={handle}
                  className="w-full px-3 py-2 bg-sand-200 border border-sand-300 rounded-lg text-xs font-mono text-navy-600 cursor-not-allowed"
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
                      <option value="cat_beds">Luxury Beds &amp; Wardrobes</option>
                      <option value="cat_living">Living Room &amp; TV Storage</option>
                      <option value="cat_dining">Dining Tables &amp; Chairs</option>
                      <option value="cat_sofas">Sofas &amp; Lounges</option>
                      <option value="cat_armchairs">Accent Armchairs</option>
                    </>
                  )}
                </select>
              </div>
            </div>
          </div>

          {/* Card 2: Wholesale & Retail Financials */}
          <div className="p-6 bg-sand-50 border border-sand-300 rounded-2xl shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-navy-950 uppercase tracking-wider flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>2. Wholesale Cost &amp; Retail Pricing (Inc 20% UK VAT)</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-navy-900 mb-1">
                  Customer Price (£ GBP, Inc 20% VAT) <span className="text-red-500">*</span>
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
                  Includes 20% UK VAT (£{((retailVal / 1.2) * 0.2).toFixed(2)} statutory VAT).
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy-900 mb-1">
                  Supplier Wholesale Trade Cost (£ GBP ex VAT)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-navy-700 text-sm">£</span>
                  <input
                    type="number"
                    step="0.01"
                    value={costGbp}
                    onChange={(e) => setCostGbp(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 bg-sand-100 border border-sand-300 rounded-lg text-sm font-mono text-navy-950 focus:outline-none focus:border-brass-500"
                  />
                </div>
                <p className="text-[11px] text-navy-500 mt-1">
                  Trade cost price from Amos Mann trade sheet.
                </p>
              </div>
            </div>

            {/* Profit Margin Widget */}
            <div className="p-3.5 rounded-xl bg-sand-200/50 border border-sand-300 flex items-center justify-between text-xs">
              <div>
                <span className="text-navy-600">Estimated Gross Margin:</span>
                <span className="ml-2 font-display font-bold text-emerald-700 text-sm">
                  {grossMarginPercent}%
                </span>
              </div>
              <div>
                <span className="text-navy-600">Gross Profit / Unit:</span>
                <span className="ml-2 font-mono font-bold text-navy-950 text-sm">
                  £{grossProfit.toFixed(2)}
                </span>
              </div>
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

          {/* Card 4: Product Variations & Options */}
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

                  {/* Fallback to preserve legacy saved tier on existing product if not in dynamic list */}
                  {deliveryTier && !deliveryOptions.some((o) => o.id === deliveryTier) && (
                    <option value={deliveryTier}>
                      {deliveryTier === "two_man_white_glove"
                        ? "2-Man White Glove (Current Saved)"
                        : deliveryTier === "pallet"
                        ? "Pallet Freight (Current Saved)"
                        : deliveryTier === "standard_parcel"
                        ? "Standard Parcel (Current Saved)"
                        : `${deliveryTier} (Current Saved)`}
                    </option>
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
              disabled={saving}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-brass-500 to-brass-600 hover:from-brass-400 hover:to-brass-500 text-navy-950 font-bold text-xs tracking-wide shadow-md shadow-brass-500/20 transition-all disabled:opacity-50"
            >
              {saving ? "Saving Changes..." : "Save Product Changes"}
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
                  {title || "Product Title"}
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
