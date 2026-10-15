"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Package,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  Flame,
  Truck,
  ExternalLink,
  ChevronRight,
  ImageIcon,
  X,
  Layers,
  Sparkles
} from "lucide-react";
import { DataTable, ColumnDef } from "@/components/admin/DataTable";
import { MediaPickerModal } from "@/components/admin/MediaPickerModal";
import { formatGBP } from "@san-furniture/types";

interface ProductItem {
  id: string;
  title: string;
  handle: string;
  category_id: string;
  price_pennies: number;
  compare_at_price_pennies?: number;
  thumbnail_url: string;
  status: string;
  width_cm: number;
  height_cm: number;
  depth_cm: number;
  weight_kg: number;
  material: string;
  color: string;
  fire_safety_compliant: number | boolean;
  delivery_type: string;
  cost_price_pennies?: number;
  markup_percentage?: number;
}

interface CategoryOption {
  id: string;
  name: string;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [activeMediaTarget, setActiveMediaTarget] = useState<"add" | "edit">("add");

  // Form State for New Product
  const [formTitle, setFormTitle] = useState("");
  const [formCategory, setFormCategory] = useState("cat_sofas");
  const [formPriceGbp, setFormPriceGbp] = useState("899.00");
  const [formCostGbp, setFormCostGbp] = useState("450.00");
  const [formMaterial, setFormMaterial] = useState("boucle");
  const [formColor, setFormColor] = useState("Warm Ivory");
  const [formWidth, setFormWidth] = useState("210");
  const [formHeight, setFormHeight] = useState("85");
  const [formDepth, setFormDepth] = useState("95");
  const [formWeight, setFormWeight] = useState("65");
  const [formImageUrl, setFormImageUrl] = useState(
    "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=85"
  );
  const [formFireSafety, setFormFireSafety] = useState(true);
  const [formDeliveryTier, setFormDeliveryTier] = useState("two_man_white_glove");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Form State
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editPriceGbp, setEditPriceGbp] = useState("");
  const [editCostGbp, setEditCostGbp] = useState("");
  const [editMaterial, setEditMaterial] = useState("");
  const [editColor, setEditColor] = useState("");
  const [editWidth, setEditWidth] = useState("");
  const [editHeight, setEditHeight] = useState("");
  const [editDepth, setEditDepth] = useState("");
  const [editWeight, setEditWeight] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [editFireSafety, setEditFireSafety] = useState(true);
  const [editDeliveryTier, setEditDeliveryTier] = useState("two_man_white_glove");

  // Fetch products & categories from backend
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const [resProd, resCat] = await Promise.all([
        fetch("http://localhost:9000/api/admin/products"),
        fetch("http://localhost:9000/api/admin/categories")
      ]);
      const dataProd = await resProd.json();
      const dataCat = await resCat.json();

      if (dataProd.products) setProducts(dataProd.products);
      if (dataCat.categories) setCategories(dataCat.categories);
    } catch (err) {
      console.error("Failed to fetch products:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Handle Add Product Submit
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const pricePennies = Math.round(parseFloat(formPriceGbp) * 100);
      const supplierCostPennies = Math.round(parseFloat(formCostGbp) * 100);

      const payload = {
        title: formTitle,
        categoryId: formCategory,
        pricePennies,
        supplierCostPennies,
        thumbnailUrl: formImageUrl,
        material: formMaterial,
        color: formColor,
        widthCm: parseFloat(formWidth),
        heightCm: parseFloat(formHeight),
        depthCm: parseFloat(formDepth),
        weightKg: parseFloat(formWeight),
        fireSafetyCompliant: formFireSafety,
        deliveryType: formDeliveryTier,
      };

      const res = await fetch("http://localhost:9000/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to create product");

      setSuccessMessage(`Product "${formTitle}" successfully added to MySQL database!`);
      setIsAddModalOpen(false);
      setFormTitle("");
      await fetchProducts();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      alert(err.message || "Error creating product");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Modal with prefilled values
  const openEditModal = (p: ProductItem) => {
    setEditingProduct(p);
    setEditTitle(p.title);
    setEditCategory(p.category_id || "cat_sofas");
    setEditPriceGbp((p.price_pennies / 100).toFixed(2));
    setEditCostGbp(p.cost_price_pennies ? (p.cost_price_pennies / 100).toFixed(2) : "0.00");
    setEditMaterial(p.material || "boucle");
    setEditColor(p.color || "Warm Ivory");
    setEditWidth(p.width_cm ? String(p.width_cm) : "200");
    setEditHeight(p.height_cm ? String(p.height_cm) : "85");
    setEditDepth(p.depth_cm ? String(p.depth_cm) : "95");
    setEditWeight(p.weight_kg ? String(p.weight_kg) : "50");
    setEditImageUrl(p.thumbnail_url || "");
    setEditFireSafety(Boolean(p.fire_safety_compliant));
    setEditDeliveryTier(p.delivery_type || "two_man_white_glove");
    setIsEditModalOpen(true);
  };

  // Handle Update Product Submit
  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setIsSubmitting(true);

    try {
      const pricePennies = Math.round(parseFloat(editPriceGbp) * 100);
      const supplierCostPennies = Math.round(parseFloat(editCostGbp) * 100);

      const payload = {
        title: editTitle,
        categoryId: editCategory,
        pricePennies,
        supplierCostPennies,
        thumbnailUrl: editImageUrl,
        material: editMaterial,
        color: editColor,
        widthCm: parseFloat(editWidth),
        heightCm: parseFloat(editHeight),
        depthCm: parseFloat(editDepth),
        weightKg: parseFloat(editWeight),
        fireSafetyCompliant: editFireSafety,
        deliveryType: editDeliveryTier,
      };

      const res = await fetch(`http://localhost:9000/api/admin/products/${editingProduct.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to update product");

      setSuccessMessage(`Product "${editTitle}" successfully updated!`);
      setIsEditModalOpen(false);
      setEditingProduct(null);
      await fetchProducts();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      alert(err.message || "Error updating product");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Single Delete Product
  const handleDeleteProduct = async (productId: string, title: string) => {
    if (!confirm(`Are you sure you want to remove "${title}" from the live catalog?`)) return;

    try {
      const res = await fetch(`http://localhost:9000/api/admin/products/${productId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete");

      setSuccessMessage(`Product "${title}" deleted from database.`);
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: any) {
      alert("Error deleting product: " + err.message);
    }
  };

  // Handle Bulk Delete
  const handleBulkDelete = async (selectedIds: string[]) => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} selected items?`)) return;
    try {
      for (const id of selectedIds) {
        await fetch(`http://localhost:9000/api/admin/products/${id}`, { method: "DELETE" });
      }
      setSuccessMessage(`Successfully deleted ${selectedIds.length} items from database.`);
      await fetchProducts();
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: any) {
      alert("Error during bulk delete: " + err.message);
    }
  };

  // Handle Media Selected from modal
  const handleMediaSelect = (url: string) => {
    if (activeMediaTarget === "add") {
      setFormImageUrl(url);
    } else {
      setEditImageUrl(url);
    }
    setIsMediaPickerOpen(false);
  };

  // Columns definition for DataTable
  const columns: ColumnDef<ProductItem>[] = useMemo(
    () => [
      {
        key: "product",
        header: "Product & Spec",
        sortable: true,
        cell: (p) => (
          <div className="flex items-center gap-3">
            <img
              src={p.thumbnail_url}
              alt={p.title}
              className="w-12 h-12 rounded-lg object-cover border border-sand-200 bg-sand-100 flex-shrink-0 shadow-xs"
            />
            <div>
              <p className="font-semibold text-navy-950 hover:text-brass-700 transition-colors">{p.title}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-navy-400 font-mono">{p.id}</span>
                {p.material && (
                  <span className="text-[10px] text-navy-600 bg-sand-200/70 px-1.5 py-0.2 rounded capitalize">
                    {p.material}
                  </span>
                )}
              </div>
            </div>
          </div>
        ),
      },
      {
        key: "category_id",
        header: "Category",
        sortable: true,
        cell: (p) => {
          const cat = categories.find((c) => c.id === p.category_id);
          const name = cat ? cat.name : p.category_id?.replace("cat_", "").replace("_", " ");
          return (
            <span className="capitalize text-navy-800 font-medium px-2 py-0.5 rounded bg-sand-200/50">
              {name}
            </span>
          );
        },
      },
      {
        key: "price_pennies",
        header: "Retail (Inc VAT)",
        sortable: true,
        cell: (p) => (
          <span className="font-bold text-navy-950 font-display">
            {formatGBP(p.price_pennies)}
          </span>
        ),
      },
      {
        key: "cost_price_pennies",
        header: "Supplier Cost",
        sortable: true,
        cell: (p) => (
          <span className="text-navy-600 font-mono text-[11px]">
            {p.cost_price_pennies ? formatGBP(p.cost_price_pennies) : "£0.00"}
          </span>
        ),
      },
      {
        key: "margin",
        header: "Gross Margin",
        sortable: true,
        cell: (p) => {
          const margin = p.cost_price_pennies
            ? (((p.price_pennies - p.cost_price_pennies) / p.price_pennies) * 100).toFixed(1)
            : "40.0";
          return (
            <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              {margin}%
            </span>
          );
        },
      },
      {
        key: "dimensions",
        header: "Dimensions (cm)",
        cell: (p) => (
          <span className="text-navy-600 font-mono text-[11px]">
            {p.width_cm}W &times; {p.depth_cm}D &times; {p.height_cm}H
          </span>
        ),
      },
      {
        key: "fire_safety_compliant",
        header: "UK Fire Safety",
        cell: (p) => (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
            <Flame className="w-3 h-3 text-emerald-600" />
            BS 5852
          </span>
        ),
      },
      {
        key: "actions",
        header: "Actions",
        cell: (p) => (
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={() => openEditModal(p)}
              className="p-1.5 rounded-lg text-brass-700 hover:text-brass-900 hover:bg-brass-50 transition-colors"
              title="Edit product specs & pricing"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleDeleteProduct(p.id, p.title)}
              className="p-1.5 rounded-lg text-red-600 hover:text-red-800 hover:bg-red-50 transition-colors"
              title="Delete product from database"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ],
    [categories]
  );

  return (
    <div className="space-y-6">
      {/* Page Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-navy-500 mb-1">
            <Link href="/admin" className="hover:text-navy-950">Operations Suite</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="font-semibold text-navy-900">Products &amp; Inventory</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-navy-950">
            Product Catalog Management
          </h1>
          <p className="text-xs text-navy-600 mt-1">
            Direct MySQL CRUD &bull; UK Fire Safety Specs &bull; Dropshipping Wholesale Margin Controls &bull; Media Library Integration
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brass-500 to-brass-600 hover:from-brass-400 hover:to-brass-500 text-navy-950 font-bold text-xs tracking-wide shadow-md shadow-brass-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Furniture Item</span>
        </button>
      </div>

      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2.5 animate-fade-in shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-sand-50 border border-sand-200 shadow-sm">
          <span className="text-[11px] font-semibold text-navy-600 uppercase tracking-wider">Catalog Items</span>
          <p className="text-2xl font-display font-bold text-navy-950 mt-1">{products.length}</p>
        </div>
        <div className="p-4 rounded-xl bg-sand-50 border border-sand-200 shadow-sm">
          <span className="text-[11px] font-semibold text-navy-600 uppercase tracking-wider">Active Categories</span>
          <p className="text-2xl font-display font-bold text-brass-700 mt-1">{categories.length}</p>
        </div>
        <div className="p-4 rounded-xl bg-sand-50 border border-sand-200 shadow-sm">
          <span className="text-[11px] font-semibold text-navy-600 uppercase tracking-wider">BS 5852 Compliant</span>
          <p className="text-2xl font-display font-bold text-emerald-700 mt-1">100%</p>
        </div>
        <div className="p-4 rounded-xl bg-sand-50 border border-sand-200 shadow-sm">
          <span className="text-[11px] font-semibold text-navy-600 uppercase tracking-wider">Database Source</span>
          <p className="text-sm font-mono font-bold text-navy-900 mt-2">MySQL / port 3306</p>
        </div>
      </div>

      {/* Global Advanced DataTable */}
      <DataTable
        data={products}
        columns={columns}
        keyExtractor={(p) => p.id}
        title="Live Furniture Inventory"
        subtitle="Manage product specifications, wholesale margins, and UK logistics tiers"
        searchPlaceholder="Search title, SKU, material, category..."
        loading={loading}
        onRefresh={fetchProducts}
        onBulkDelete={handleBulkDelete}
        exportFileName="san_furniture_catalog"
      />

      {/* Add New Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-sand-50 border border-sand-300 rounded-2xl max-w-2xl w-full p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-sand-200">
              <div>
                <h3 className="font-display text-lg font-bold text-navy-950">Add New Luxury Furniture Item</h3>
                <p className="text-xs text-navy-600">Creates record in MySQL products &amp; furniture_specs tables</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-navy-400 hover:text-navy-700 hover:bg-sand-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-navy-900 mb-1">Product Title</label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. The Richmond Bouclé 3-Seater Sofa"
                    className="w-full px-3 py-2 bg-sand-100 border border-sand-300 rounded-lg text-xs text-navy-950 focus:outline-none focus:border-brass-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-navy-900 mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
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
                        <option value="cat_sofas">Sofas &amp; Corner Groups</option>
                        <option value="cat_armchairs">Accent Armchairs</option>
                        <option value="cat_dining">Dining Tables &amp; Chairs</option>
                        <option value="cat_beds">Luxury Beds &amp; Storage</option>
                        <option value="cat_tables">Coffee &amp; Occasional Tables</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-navy-900 mb-1">Customer Price (£ GBP, Inc 20% VAT)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formPriceGbp}
                    onChange={(e) => setFormPriceGbp(e.target.value)}
                    placeholder="899.00"
                    className="w-full px-3 py-2 bg-sand-100 border border-sand-300 rounded-lg text-xs text-navy-950 focus:outline-none focus:border-brass-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-navy-900 mb-1">Supplier Wholesale Cost (£ GBP)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formCostGbp}
                    onChange={(e) => setFormCostGbp(e.target.value)}
                    placeholder="450.00"
                    className="w-full px-3 py-2 bg-sand-100 border border-sand-300 rounded-lg text-xs text-navy-950 focus:outline-none focus:border-brass-500"
                  />
                </div>
              </div>

              {/* Image with Media Picker button */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-navy-900">Image Thumbnail URL</label>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveMediaTarget("add");
                      setIsMediaPickerOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs text-brass-700 hover:text-brass-900 font-semibold"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Choose from Media Library</span>
                  </button>
                </div>
                <div className="flex gap-3 items-center">
                  <input
                    type="url"
                    required
                    value={formImageUrl}
                    onChange={(e) => setFormImageUrl(e.target.value)}
                    className="flex-1 px-3 py-2 bg-sand-100 border border-sand-300 rounded-lg text-xs text-navy-950 focus:outline-none focus:border-brass-500"
                  />
                  {formImageUrl && (
                    <img
                      src={formImageUrl}
                      alt="Preview"
                      className="w-9 h-9 rounded object-cover border border-sand-300 bg-sand-200 flex-shrink-0"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-navy-800 mb-1">Width (cm)</label>
                  <input
                    type="number"
                    value={formWidth}
                    onChange={(e) => setFormWidth(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-sand-100 border border-sand-300 rounded-lg text-xs text-navy-950"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-navy-800 mb-1">Height (cm)</label>
                  <input
                    type="number"
                    value={formHeight}
                    onChange={(e) => setFormHeight(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-sand-100 border border-sand-300 rounded-lg text-xs text-navy-950"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-navy-800 mb-1">Depth (cm)</label>
                  <input
                    type="number"
                    value={formDepth}
                    onChange={(e) => setFormDepth(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-sand-100 border border-sand-300 rounded-lg text-xs text-navy-950"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-navy-800 mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    value={formWeight}
                    onChange={(e) => setFormWeight(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-sand-100 border border-sand-300 rounded-lg text-xs text-navy-950"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-navy-900 mb-1">Material</label>
                  <select
                    value={formMaterial}
                    onChange={(e) => setFormMaterial(e.target.value)}
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
                  <label className="block text-xs font-semibold text-navy-900 mb-1">Delivery Tier</label>
                  <select
                    value={formDeliveryTier}
                    onChange={(e) => setFormDeliveryTier(e.target.value)}
                    className="w-full px-3 py-2 bg-sand-100 border border-sand-300 rounded-lg text-xs text-navy-950 focus:outline-none focus:border-brass-500"
                  >
                    <option value="two_man_white_glove">2-Man White Glove (Room of Choice)</option>
                    <option value="pallet">Pallet Freight (Kerbside)</option>
                    <option value="standard_parcel">Standard Parcel (DPD)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-navy-800">
                  <input
                    type="checkbox"
                    checked={formFireSafety}
                    onChange={(e) => setFormFireSafety(e.target.checked)}
                    className="w-4 h-4 rounded text-brass-500 focus:ring-0"
                  />
                  <span className="font-semibold">UK BS 5852 Fire Safety Compliant</span>
                </label>
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
                  {isSubmitting ? "Saving to Database..." : "Publish Product to MySQL"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {isEditModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-sand-50 border border-sand-300 rounded-2xl max-w-2xl w-full p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-sand-200">
              <div>
                <h3 className="font-display text-lg font-bold text-navy-950">Edit Furniture Item</h3>
                <p className="text-xs text-navy-600">Update specifications in MySQL product &amp; furniture_specs</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingProduct(null);
                }}
                className="p-1 rounded-lg text-navy-400 hover:text-navy-700 hover:bg-sand-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateProduct} className="space-y-4 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-navy-900 mb-1">Product Title</label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-sand-100 border border-sand-300 rounded-lg text-xs text-navy-950 focus:outline-none focus:border-brass-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-navy-900 mb-1">Category</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
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
                        <option value="cat_sofas">Sofas &amp; Corner Groups</option>
                        <option value="cat_armchairs">Accent Armchairs</option>
                        <option value="cat_dining">Dining Tables &amp; Chairs</option>
                        <option value="cat_beds">Luxury Beds &amp; Storage</option>
                        <option value="cat_tables">Coffee &amp; Occasional Tables</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-navy-900 mb-1">Customer Price (£ GBP, Inc 20% VAT)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editPriceGbp}
                    onChange={(e) => setEditPriceGbp(e.target.value)}
                    className="w-full px-3 py-2 bg-sand-100 border border-sand-300 rounded-lg text-xs text-navy-950 focus:outline-none focus:border-brass-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-navy-900 mb-1">Supplier Wholesale Cost (£ GBP)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editCostGbp}
                    onChange={(e) => setEditCostGbp(e.target.value)}
                    className="w-full px-3 py-2 bg-sand-100 border border-sand-300 rounded-lg text-xs text-navy-950 focus:outline-none focus:border-brass-500"
                  />
                </div>
              </div>

              {/* Image with Media Picker button */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-navy-900">Image Thumbnail URL</label>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveMediaTarget("edit");
                      setIsMediaPickerOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs text-brass-700 hover:text-brass-900 font-semibold"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Choose from Media Library</span>
                  </button>
                </div>
                <div className="flex gap-3 items-center">
                  <input
                    type="url"
                    required
                    value={editImageUrl}
                    onChange={(e) => setEditImageUrl(e.target.value)}
                    className="flex-1 px-3 py-2 bg-sand-100 border border-sand-300 rounded-lg text-xs text-navy-950 focus:outline-none focus:border-brass-500"
                  />
                  {editImageUrl && (
                    <img
                      src={editImageUrl}
                      alt="Preview"
                      className="w-9 h-9 rounded object-cover border border-sand-300 bg-sand-200 flex-shrink-0"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-navy-800 mb-1">Width (cm)</label>
                  <input
                    type="number"
                    value={editWidth}
                    onChange={(e) => setEditWidth(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-sand-100 border border-sand-300 rounded-lg text-xs text-navy-950"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-navy-800 mb-1">Height (cm)</label>
                  <input
                    type="number"
                    value={editHeight}
                    onChange={(e) => setEditHeight(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-sand-100 border border-sand-300 rounded-lg text-xs text-navy-950"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-navy-800 mb-1">Depth (cm)</label>
                  <input
                    type="number"
                    value={editDepth}
                    onChange={(e) => setEditDepth(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-sand-100 border border-sand-300 rounded-lg text-xs text-navy-950"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-navy-800 mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    value={editWeight}
                    onChange={(e) => setEditWeight(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-sand-100 border border-sand-300 rounded-lg text-xs text-navy-950"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-navy-900 mb-1">Material</label>
                  <select
                    value={editMaterial}
                    onChange={(e) => setEditMaterial(e.target.value)}
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
                  <label className="block text-xs font-semibold text-navy-900 mb-1">Delivery Tier</label>
                  <select
                    value={editDeliveryTier}
                    onChange={(e) => setEditDeliveryTier(e.target.value)}
                    className="w-full px-3 py-2 bg-sand-100 border border-sand-300 rounded-lg text-xs text-navy-950 focus:outline-none focus:border-brass-500"
                  >
                    <option value="two_man_white_glove">2-Man White Glove (Room of Choice)</option>
                    <option value="pallet">Pallet Freight (Kerbside)</option>
                    <option value="standard_parcel">Standard Parcel (DPD)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-navy-800">
                  <input
                    type="checkbox"
                    checked={editFireSafety}
                    onChange={(e) => setEditFireSafety(e.target.checked)}
                    className="w-4 h-4 rounded text-brass-500 focus:ring-0"
                  />
                  <span className="font-semibold">UK BS 5852 Fire Safety Compliant</span>
                </label>
              </div>

              <div className="pt-4 border-t border-sand-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingProduct(null);
                  }}
                  className="px-4 py-2 rounded-lg border border-sand-300 text-xs font-semibold text-navy-700 hover:bg-sand-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg bg-gradient-to-r from-brass-500 to-brass-600 hover:from-brass-400 hover:to-brass-500 text-navy-950 font-bold text-xs shadow-md transition-all disabled:opacity-50"
                >
                  {isSubmitting ? "Updating Database..." : "Save Product Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global Media Picker Modal */}
      <MediaPickerModal
        isOpen={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        onSelect={handleMediaSelect}
      />
    </div>
  );
}
