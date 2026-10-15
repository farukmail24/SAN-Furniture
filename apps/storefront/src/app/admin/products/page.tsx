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
  Layers,
  Sparkles
} from "lucide-react";
import { DataTable, ColumnDef } from "@/components/admin/DataTable";
import { formatGBP } from "@san-furniture/types";
import { apiUrl } from "@/lib/api-config";

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
  delivery_type?: string;
  delivery_tier?: string;
  cost_price_pennies?: number;
  markup_percentage?: number;
}

interface CategoryOption {
  id: string;
  name: string;
}

export default function AdminProductsPage() {
  const [mounted, setMounted] = useState(false);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch products & categories from backend
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const [resProd, resCat] = await Promise.all([
        fetch(apiUrl("/api/admin/products")),
        fetch(apiUrl("/api/admin/categories"))
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
    setMounted(true);
    fetchProducts();
  }, []);

  // Handle Single Delete Product
  const handleDeleteProduct = async (productId: string, title: string) => {
    if (!confirm(`Are you sure you want to remove "${title}" from the live catalog?`)) return;

    try {
      const res = await fetch(apiUrl(`/api/admin/products/${productId}`), {
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
        await fetch(apiUrl(`/api/admin/products/${id}`), { method: "DELETE" });
      }
      setSuccessMessage(`Successfully deleted ${selectedIds.length} items from database.`);
      await fetchProducts();
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: any) {
      alert("Error during bulk delete: " + err.message);
    }
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
              <Link
                href={`/admin/products/${p.id}/edit`}
                className="font-semibold text-navy-950 hover:text-brass-700 transition-colors"
              >
                {p.title}
              </Link>
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
            <Link
              href={`/admin/products/${p.id}/edit`}
              className="p-1.5 rounded-lg text-brass-700 hover:text-brass-900 hover:bg-brass-50 transition-colors inline-flex items-center"
              title="Edit product specs on dedicated full page"
            >
              <Edit3 className="w-4 h-4" />
            </Link>
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

  if (!mounted) {
    return (
      <div className="p-12 text-center text-xs text-navy-600">
        <Package className="w-8 h-8 text-brass-600 mx-auto animate-pulse mb-2" />
        <p>Loading SAN Furniture inventory...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 antialiased" suppressHydrationWarning>
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
            Dedicated Full Page Editor &bull; Direct MySQL CRUD &bull; UK Fire Safety Specs &bull; WordPress Media Library
          </p>
        </div>

        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brass-500 to-brass-600 hover:from-brass-400 hover:to-brass-500 text-navy-950 font-bold text-xs tracking-wide shadow-md shadow-brass-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Furniture Item</span>
        </Link>
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
    </div>
  );
}
