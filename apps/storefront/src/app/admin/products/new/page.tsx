"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Package,
  ArrowLeft,
  Save,
  CheckCircle2,
  AlertCircle,
  ImageIcon,
  Flame,
  Truck,
  Sparkles,
  ChevronRight,
  TrendingUp,
  DollarSign
} from "lucide-react";
import { MediaPickerModal } from "@/components/admin/MediaPickerModal";
import { formatGBP } from "@san-furniture/types";

export default function AdminNewProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [handle, setHandle] = useState("");
  const [categoryId, setCategoryId] = useState("cat_sofas");
  const [priceGbp, setPriceGbp] = useState("899.00");
  const [costGbp, setCostGbp] = useState("450.00");
  const [thumbnailUrl, setThumbnailUrl] = useState(
    "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=85"
  );
  const [material, setMaterial] = useState("boucle");
  const [color, setColor] = useState("Warm Ivory");
  const [widthCm, setWidthCm] = useState("210");
  const [heightCm, setHeightCm] = useState("85");
  const [depthCm, setDepthCm] = useState("95");
  const [weightKg, setWeightKg] = useState("65");
  const [fireSafety, setFireSafety] = useState(true);
  const [deliveryTier, setDeliveryTier] = useState("two_man_white_glove");
  const [status, setStatus] = useState("published");

  useEffect(() => {
    fetch("http://localhost:9000/api/admin/categories")
      .then((res) => res.json())
      .then((data) => {
        if (data.categories) setCategories(data.categories);
      })
      .catch((err) => console.error("Failed to load categories:", err));
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

  // Margin calculation
  const retailVal = parseFloat(priceGbp) || 0;
  const costVal = parseFloat(costGbp) || 0;
  const grossProfit = retailVal - costVal;
  const grossMarginPercent = retailVal > 0 ? ((grossProfit / retailVal) * 100).toFixed(1) : "0";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const pricePennies = Math.round(retailVal * 100);
      const supplierCostPennies = Math.round(costVal * 100);

      const payload = {
        title,
        handle: handle || title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        categoryId,
        pricePennies,
        supplierCostPennies,
        thumbnailUrl,
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

      const res = await fetch("http://localhost:9000/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create product");

      setSuccessMsg(`Furniture item "${title}" successfully published to MySQL!`);
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
            Dedicated Full Page Editor &bull; Direct MySQL &bull; 20% VAT Calculations &bull; BS 5852 Compliance
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
                placeholder="e.g. The Richmond Bouclé 3-Seater Sofa"
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
                  placeholder="the-richmond-boucle-3-seater-sofa"
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
                      <option value="cat_sofas">Sofas &amp; Lounges</option>
                      <option value="cat_armchairs">Accent Armchairs</option>
                      <option value="cat_dining">Dining Tables &amp; Chairs</option>
                      <option value="cat_beds">Luxury Beds &amp; Wardrobes</option>
                      <option value="cat_tables">Coffee &amp; Side Tables</option>
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
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy-900 mb-1">
                  Supplier Wholesale Cost (£ GBP) <span className="text-red-500">*</span>
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

          {/* Card 3: Media & WordPress Integration */}
          <div className="p-6 bg-sand-50 border border-sand-300 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-navy-950 uppercase tracking-wider flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-brass-600" />
                <span>3. Product Photography &amp; Assets</span>
              </h2>
              <button
                type="button"
                onClick={() => setIsMediaPickerOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy-950 hover:bg-navy-900 text-sand-50 font-semibold text-xs transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-brass-400" />
                <span>Choose from WordPress Media Library</span>
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <div className="w-28 h-28 rounded-xl bg-sand-200 border border-sand-300 overflow-hidden flex-shrink-0 shadow-xs">
                {thumbnailUrl ? (
                  <img src={thumbnailUrl} alt="Thumbnail preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-navy-400">
                    <ImageIcon className="w-8 h-8" />
                  </div>
                )}
              </div>

              <div className="flex-1 w-full space-y-2">
                <label className="block text-xs font-semibold text-navy-900">
                  Primary Thumbnail URL
                </label>
                <input
                  type="url"
                  required
                  value={thumbnailUrl}
                  onChange={(e) => setThumbnailUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 bg-sand-100 border border-sand-300 rounded-lg text-xs font-mono text-navy-950 focus:outline-none focus:border-brass-500"
                />
                <p className="text-[11px] text-navy-500">
                  High-resolution square or 4:3 ratio photo recommended for Retina screens.
                </p>
              </div>
            </div>
          </div>

          {/* Card 4: UK Furniture Specifications & Dimensions */}
          <div className="p-6 bg-sand-50 border border-sand-300 rounded-2xl shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-navy-950 uppercase tracking-wider flex items-center gap-2">
              <Flame className="w-4 h-4 text-brass-600" />
              <span>4. Dimensions, Materials &amp; Fire Safety Specs</span>
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
                  <option value="boucle">Textured Bouclé</option>
                  <option value="velvet">Luxury Matte Velvet</option>
                  <option value="solid_oak">Solid European White Oak</option>
                  <option value="leather">Full-Grain Aniline Leather</option>
                  <option value="marble">Italian Carrara Marble</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy-900 mb-1">Color / Finish</label>
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="e.g. Warm Ivory / Natural Oiled"
                  className="w-full px-3 py-2 bg-sand-100 border border-sand-300 rounded-lg text-xs text-navy-950 focus:outline-none focus:border-brass-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-navy-900 mb-1">UK Delivery Tier</label>
                <select
                  value={deliveryTier}
                  onChange={(e) => setDeliveryTier(e.target.value)}
                  className="w-full px-3 py-2 bg-sand-100 border border-sand-300 rounded-lg text-xs text-navy-950 focus:outline-none focus:border-brass-500"
                >
                  <option value="two_man_white_glove">2-Man White Glove (Room of Choice)</option>
                  <option value="pallet">Pallet Freight (Kerbside)</option>
                  <option value="standard_parcel">Standard Parcel (DPD)</option>
                </select>
              </div>

              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-navy-800">
                  <input
                    type="checkbox"
                    checked={fireSafety}
                    onChange={(e) => setFireSafety(e.target.checked)}
                    className="w-4 h-4 rounded text-brass-500 focus:ring-0"
                  />
                  <span className="font-semibold">UK BS 5852 Fire Safety Compliant</span>
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
              <span className="text-navy-600">Target Database:</span>
              <span className="font-mono font-semibold text-navy-900">MySQL 3306</span>
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
                  src={thumbnailUrl || "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=85"}
                  alt={title || "Preview"}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 bg-navy-950 text-brass-400 text-[9px] font-bold uppercase px-2 py-0.5 rounded tracking-wider">
                  UK Handcrafted
                </div>
              </div>
              <div className="p-4 space-y-1.5">
                <p className="text-[10px] text-brass-700 font-semibold uppercase tracking-wider">
                  {categoryId.replace("cat_", "")}
                </p>
                <h4 className="font-display text-sm font-bold text-navy-950 truncate">
                  {title || "The Richmond Bouclé 3-Seater Sofa"}
                </h4>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-sm font-bold text-navy-950">
                    £{parseFloat(priceGbp || "0").toFixed(2)}
                  </span>
                  <span className="text-[10px] text-emerald-800 bg-emerald-100 font-semibold px-2 py-0.5 rounded-full">
                    BS 5852
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* WordPress Media Picker Modal */}
      <MediaPickerModal
        isOpen={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        onSelect={(url) => setThumbnailUrl(url)}
        currentUrl={thumbnailUrl}
        title="Select Product Image from WordPress Media Library"
        buttonLabel="Set as Product Thumbnail"
      />
    </div>
  );
}
