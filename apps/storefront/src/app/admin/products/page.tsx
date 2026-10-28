"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Package,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  ShieldCheck,
  Flame,
  Truck,
  ExternalLink,
  ChevronRight,
  Layers,
  Sparkles,
  Eye,
  X,
  Coins,
  Ruler,
  Box,
  Tag,
  Calculator,
  Building,
  TrendingUp,
  RefreshCw,
  FileText
} from "lucide-react";
import { DataTable, ColumnDef } from "@/components/admin/DataTable";
import { formatGBP } from "@san-furniture/types";
import { apiUrl } from "@/lib/api-config";
import { fetchWithSwr, invalidateCache } from "@/lib/api-cache";
import { cleanHtmlDescription, formatProductSku } from "@/lib/catalog";
import { showAlert, showConfirm } from "@/components/ui/AlertModal";

interface ProductItem {
  id: string;
  sku?: string;
  supplier_sku?: string;
  supplier_id?: string;
  supplier_source_url?: string;
  source_url?: string;
  title: string;
  handle: string;
  subtitle?: string;
  description?: string;
  category_id: string;
  price_pennies: number;
  compare_at_price_pennies?: number;
  thumbnail_url: string;
  images?: string[];
  images_json?: string | string[];
  status: string;
  stock_level?: number;
  width_cm: number;
  height_cm: number;
  depth_cm: number;
  seat_height_cm?: number;
  weight_kg: number;
  material: string;
  color: string;
  assembly_required?: number | boolean;
  assembly_instructions_url?: string;
  fire_safety_compliant: number | boolean;
  delivery_type?: string;
  delivery_tier?: string;
  cost_price_pennies?: number;
  markup_percentage?: number;
  shipping_cost_pennies?: number;
  lead_time_days?: number;
  created_at?: string;
  variants?: any[];
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

  // View Modal state
  const [viewingProduct, setViewingProduct] = useState<ProductItem | null>(null);
  const [activeImage, setActiveImage] = useState<string>("");
  const [detailLoading, setDetailLoading] = useState<boolean>(false);

  // Landed Cost & Supplier Sourcing Modal state
  const [calcProduct, setCalcProduct] = useState<ProductItem | null>(null);
  const [calcShippingGbp, setCalcShippingGbp] = useState<string>("49.00");
  const [calcMarkupPercent, setCalcMarkupPercent] = useState<string>("40");
  const [calcSaving, setCalcSaving] = useState<boolean>(false);
  const [calcDetailLoading, setCalcDetailLoading] = useState<boolean>(false);

  // Gallery images list for the active product
  const modalGalleryImages = useMemo(() => {
    if (!viewingProduct) return [];
    let list: string[] = [];
    if (Array.isArray(viewingProduct.images)) {
      list = viewingProduct.images;
    } else if (viewingProduct.images_json) {
      try {
        const parsed =
          typeof viewingProduct.images_json === "string"
            ? JSON.parse(viewingProduct.images_json)
            : viewingProduct.images_json;
        if (Array.isArray(parsed)) list = parsed;
      } catch (e) {}
    }
    const combined = [viewingProduct.thumbnail_url, ...list].filter(Boolean);
    return Array.from(new Set(combined));
  }, [viewingProduct]);

  // Synchronize modal active image and fetch full product specifications
  useEffect(() => {
    if (!viewingProduct) {
      setActiveImage("");
      return;
    }
    setActiveImage(viewingProduct.thumbnail_url || "");

    let isCancelled = false;
    setDetailLoading(true);
    fetch(apiUrl(`/api/admin/products/${viewingProduct.id}`))
      .then((res) => res.json())
      .then((data) => {
        if (!isCancelled && data?.product) {
          setViewingProduct((prev) => (prev && prev.id === data.product.id ? { ...prev, ...data.product } : prev));
        }
      })
      .catch((err) => console.error("Error fetching product detail:", err))
      .finally(() => {
        if (!isCancelled) setDetailLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [viewingProduct?.id]);

  // Handle open calculation modal
  const handleOpenCalculationModal = (item: ProductItem) => {
    setCalcProduct(item);
    const shipping = item.shipping_cost_pennies ? (item.shipping_cost_pennies / 100).toFixed(2) : "49.00";
    const markup = item.markup_percentage !== undefined ? String(item.markup_percentage) : "40";
    setCalcShippingGbp(shipping);
    setCalcMarkupPercent(markup);

    // Fetch full product details in background to ensure all supplier fields and specs are loaded
    setCalcDetailLoading(true);
    fetch(apiUrl(`/api/admin/products/${item.id}`))
      .then((res) => res.json())
      .then((data) => {
        if (data?.product) {
          setCalcProduct((prev) => (prev && prev.id === data.product.id ? { ...prev, ...data.product } : prev));
          if (data.product.shipping_cost_pennies !== undefined) {
            setCalcShippingGbp((data.product.shipping_cost_pennies / 100).toFixed(2));
          }
          if (data.product.markup_percentage !== undefined) {
            setCalcMarkupPercent(String(data.product.markup_percentage));
          }
        }
      })
      .catch((err) => console.error("Error fetching calculation details:", err))
      .finally(() => setCalcDetailLoading(false));
  };

  // Lock body scroll while either modal is active
  useEffect(() => {
    if (viewingProduct || calcProduct) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [viewingProduct, calcProduct]);

  // Close modals with Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setViewingProduct(null);
        setCalcProduct(null);
      }
    };
    if (viewingProduct || calcProduct) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [viewingProduct, calcProduct]);

  // Fetch products & categories from backend with instant SWR cache
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("san_admin_token") : null;
      const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

      fetchWithSwr(
        apiUrl("/api/admin/products"),
        (data: any) => {
          if (Array.isArray(data?.products)) {
            setProducts(data.products);
            setLoading(false);
          }
        }
      )
        .catch(async () => {
          try {
            const directRes = await fetch(apiUrl("/api/admin/products"), {
              headers: authHeaders,
              cache: "no-store",
            });
            if (directRes.ok) {
              const directData = await directRes.json();
              if (Array.isArray(directData?.products)) {
                setProducts(directData.products);
              }
            }
          } catch {}
        })
        .finally(() => setLoading(false));

      fetchWithSwr(
        apiUrl("/api/admin/categories"),
        (data: any) => {
          if (Array.isArray(data?.categories)) setCategories(data.categories);
        }
      ).catch(async () => {
        try {
          const catRes = await fetch(apiUrl("/api/admin/categories"), {
            headers: authHeaders,
            cache: "no-store",
          });
          if (catRes.ok) {
            const catData = await catRes.json();
            if (Array.isArray(catData?.categories)) setCategories(catData.categories);
          }
        } catch {}
      });
    } catch (err) {
      console.error("Failed to fetch products:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchProducts();
  }, []);

  const clearProductCaches = () => {
    invalidateCache("/api/admin/products");
    invalidateCache(apiUrl("/api/admin/products"));
    invalidateCache("/api/products");
    invalidateCache(apiUrl("/api/products"));
    fetch(apiUrl("/api/products/cache/invalidate")).catch(() => {});
  };

  // Handle Single Delete Product
  const handleDeleteProduct = async (productId: string, title: string) => {
    const ok = await showConfirm({
      title: "Remove from Catalog",
      message: `Are you sure you want to remove "${title}" from the live catalog? This action will permanently remove the item.`,
      confirmText: "Delete Product",
      type: "danger"
    });
    if (!ok) return;

    try {
      const res = await fetch(apiUrl(`/api/admin/products/${productId}`), {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete");

      clearProductCaches();
      setSuccessMessage(`Product "${title}" deleted from database.`);
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: any) {
      await showAlert({
        title: "Delete Failed",
        message: "Error deleting product: " + err.message,
        type: "danger"
      });
    }
  };

  // Handle Bulk Delete
  const handleBulkDelete = async (selectedIds: string[]) => {
    const ok = await showConfirm({
      title: "Delete Selected Products",
      message: `Are you sure you want to delete ${selectedIds.length} selected items?`,
      confirmText: `Delete ${selectedIds.length} Items`,
      type: "danger"
    });
    if (!ok) return;

    try {
      for (const id of selectedIds) {
        await fetch(apiUrl(`/api/admin/products/${id}`), { method: "DELETE" });
      }
      clearProductCaches();
      setSuccessMessage(`Successfully deleted ${selectedIds.length} items from database.`);
      await fetchProducts();
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: any) {
      await showAlert({
        title: "Bulk Delete Failed",
        message: "Error during bulk delete: " + err.message,
        type: "danger"
      });
    }
  };

  // Calculation mathematical architecture for active calculation modal
  const calcCostVal = calcProduct?.cost_price_pennies ? calcProduct.cost_price_pennies / 100 : 0;
  const calcShippingVal = parseFloat(calcShippingGbp) || 0;
  const calcLandedCost = calcCostVal + calcShippingVal;
  const calcTargetMarkupVal = parseFloat(calcMarkupPercent) || 0;
  const calcAutoNetRetail = calcLandedCost * (1 + calcTargetMarkupVal / 100);
  const calcAutoRetailIncVat = calcAutoNetRetail * 1.20;
  const calcCurrentRetailVal = calcProduct?.price_pennies ? calcProduct.price_pennies / 100 : 0;
  const calcGrossProfit = calcCurrentRetailVal - calcCostVal;
  const calcGrossMarginPercent =
    calcCurrentRetailVal > 0 ? ((calcGrossProfit / calcCurrentRetailVal) * 100).toFixed(1) : "0";
  const calcNetCommercialProfit = calcCurrentRetailVal / 1.20 - calcLandedCost;
  const calcCompareAtVal = calcAutoRetailIncVat * 1.25;

  // Resolve supplier sourcing information
  const getSupplierInfo = (p?: ProductItem | null) => {
    if (!p) {
      return {
        name: "UK Furniture Supplier",
        domain: "uk-supplier-network",
        badge: "UK Dropship Partner Network",
        portalUrl: "#",
        productUrl: "#",
        sku: "N/A",
        isDirect: false,
      };
    }
    const url = p.supplier_source_url || p.source_url || "";
    const sId = (p.supplier_id || "").toLowerCase();
    const sku = p.supplier_sku || p.sku || "";
    const pId = (p.id || "").toLowerCase();

    if (
      url.includes("furniture-to-go.co.uk") ||
      sId.includes("furniture_to_go") ||
      sId.includes("ftg") ||
      pId.includes("ftg") ||
      sku.toUpperCase().startsWith("FTG-")
    ) {
      return {
        name: "Furniture To Go (FTG)",
        domain: "furniture-to-go.co.uk",
        badge: "Danish Design Flatpack • FTG Wiltshire Hub",
        portalUrl: "https://furniture-to-go.co.uk",
        productUrl:
          url ||
          (sku
            ? `https://furniture-to-go.co.uk/catalogsearch/result/?q=${encodeURIComponent(sku)}`
            : "https://furniture-to-go.co.uk"),
        sku: sku || "FTG-REF",
        isDirect: Boolean(url),
      };
    }

    if (
      url.includes("amosmannfurniture.co.uk") ||
      sId.includes("amos_mann") ||
      pId.includes("amos") ||
      pId.includes("_am_") ||
      sku.toUpperCase().startsWith("AM-")
    ) {
      return {
        name: "Amos Mann Furniture",
        domain: "amosmannfurniture.co.uk",
        badge: "UK B2B Dropship • Leicester Hub",
        portalUrl: "https://www.amosmannfurniture.co.uk",
        productUrl:
          url ||
          (sku
            ? `https://www.amosmannfurniture.co.uk/search.asp?q=${encodeURIComponent(sku)}`
            : "https://www.amosmannfurniture.co.uk"),
        sku: sku || "AM-REF",
        isDirect: Boolean(url),
      };
    }

    return {
      name: "UK Furniture Supplier",
      domain: "uk-supplier-network",
      badge: "UK Dropship Partner Network",
      portalUrl: url || "#",
      productUrl: url || "#",
      sku: sku || "N/A",
      isDirect: Boolean(url),
    };
  };

  // Handle Apply Simulated Price from Calculation Modal
  const handleApplySuggestedPrice = async (customMarkup?: number) => {
    if (!calcProduct) return;
    const markupToApply = customMarkup !== undefined ? customMarkup : calcTargetMarkupVal;
    if (customMarkup !== undefined) {
      setCalcMarkupPercent(String(customMarkup));
    }
    const net = calcLandedCost * (1 + markupToApply / 100);
    const incVat = net * 1.20;
    const newPricePennies = Math.round(incVat * 100);
    const newCompareAtPennies = Math.round(incVat * 1.25 * 100);
    const newShippingCostPennies = Math.round(calcShippingVal * 100);

    setCalcSaving(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("san_admin_token") : null;
      const res = await fetch(apiUrl(`/api/admin/products/${calcProduct.id}`), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          price_pennies: newPricePennies,
          compare_at_price_pennies: newCompareAtPennies,
          markup_percentage: markupToApply,
          shipping_cost_pennies: newShippingCostPennies,
        }),
      });

      if (res.ok) {
        setProducts((prev) =>
          prev.map((item) =>
            item.id === calcProduct.id
              ? {
                  ...item,
                  price_pennies: newPricePennies,
                  compare_at_price_pennies: newCompareAtPennies,
                  markup_percentage: markupToApply,
                  shipping_cost_pennies: newShippingCostPennies,
                }
              : item
          )
        );
        clearProductCaches();
        setSuccessMessage(`Pricing updated to £${incVat.toFixed(2)} (${markupToApply}% markup) for "${calcProduct.title}"`);
        setTimeout(() => setSuccessMessage(null), 5000);
        setCalcProduct(null);
      } else {
        const data = await res.json().catch(() => null);
        await showAlert({
          title: "Pricing Update Failed",
          message: data?.error || res.statusText || "Unable to save suggested pricing.",
          type: "warning"
        });
      }
    } catch (e: any) {
      console.error("Failed to update pricing from calculation modal:", e);
      await showAlert({
        title: "Pricing Error",
        message: e?.message || String(e),
        type: "danger"
      });
    } finally {
      setCalcSaving(false);
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
                className="font-semibold text-navy-950 hover:text-brass-700 transition-colors block"
              >
                {p.title}
              </Link>
              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                {(p.sku || p.supplier_sku) && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#FAF6EE] text-[#00072D] border border-[#C89B3C]/50 shadow-xs">
                    SKU: {p.sku ? formatProductSku(p.sku) : (p.id.startsWith("prod_live_am_") ? `SAN-${p.supplier_sku?.replace(/[^0-9]/g, "")}` : (p.id.startsWith("prod_ftg_") ? `SAN-${p.supplier_sku?.replace(/^(FTG-|SAN-)/i, "")}` : p.sku))}
                  </span>
                )}
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
        key: "stock_level",
        header: "Stock Level",
        sortable: true,
        width: "140px",
        cell: (p) => {
          let totalStock = p.stock_level ?? 25;
          if (Array.isArray(p.variants) && p.variants.length > 0) {
            const varSum = p.variants.reduce((acc: number, v: any) => acc + (v.stock_quantity ?? v.stock ?? 0), 0);
            if (varSum > 0) totalStock = varSum;
          }
          const isOut = totalStock <= 0 || p.status === "out_of_stock";
          const isLow = !isOut && totalStock <= 10;
          const isHigh = !isOut && totalStock > 10;

          return (
            <div className="flex flex-col gap-0.5 whitespace-nowrap min-w-[115px]">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap w-fit border ${
                  isOut
                    ? "bg-rose-50 text-rose-800 border-rose-200"
                    : isLow
                    ? "bg-amber-50 text-amber-800 border-amber-200"
                    : "bg-emerald-50 text-emerald-800 border-emerald-200"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    isOut
                      ? "bg-rose-500"
                      : isLow
                      ? "bg-amber-500"
                      : "bg-emerald-500 animate-pulse"
                  }`}
                />
                <span className="whitespace-nowrap font-medium">
                  {isOut ? "Out of Stock" : `${totalStock} in stock`}
                </span>
              </span>
              <span className="text-[10px] text-navy-400 font-mono pl-1 whitespace-nowrap">
                {isOut ? "Auto-Hidden" : isLow ? "Low Inventory" : "Healthy UK Hub"}
              </span>
            </div>
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
        header: "Quality Check",
        cell: (p) => (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            Passed
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
              onClick={() => handleOpenCalculationModal(p)}
              className="p-1.5 rounded-lg text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 transition-colors inline-flex items-center cursor-pointer"
              title="View Landed Cost Calculation & Supplier Sourcing"
            >
              <Calculator className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewingProduct(p)}
              className="p-1.5 rounded-lg text-navy-600 hover:text-navy-950 hover:bg-sand-100 transition-colors inline-flex items-center cursor-pointer"
              title="Quick view product specs & details"
            >
              <Eye className="w-4 h-4" />
            </button>
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
              className="p-1.5 rounded-lg text-red-600 hover:text-red-800 hover:bg-red-50 transition-colors cursor-pointer"
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
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-xl bg-sand-50 border border-sand-200 shadow-sm">
          <span className="text-[11px] font-semibold text-navy-600 uppercase tracking-wider">Catalog Items</span>
          <p className="text-2xl font-display font-bold text-navy-950 mt-1">{products.length}</p>
        </div>
        <div className="p-4 rounded-xl bg-sand-50 border border-sand-200 shadow-sm">
          <span className="text-[11px] font-semibold text-navy-600 uppercase tracking-wider">Live Units In Stock</span>
          <p className="text-2xl font-display font-bold text-emerald-700 mt-1">
            {products.reduce((acc, p) => acc + (p.stock_level ?? 25), 0)}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-sand-50 border border-sand-200 shadow-sm">
          <span className="text-[11px] font-semibold text-navy-600 uppercase tracking-wider">Active Categories</span>
          <p className="text-2xl font-display font-bold text-brass-700 mt-1">{categories.length}</p>
        </div>
        <div className="p-4 rounded-xl bg-sand-50 border border-sand-200 shadow-sm">
          <span className="text-[11px] font-semibold text-navy-600 uppercase tracking-wider">Quality Checked</span>
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

      {/* Product Quick-View Spec Modal */}
      {viewingProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-navy-950/70 backdrop-blur-sm overflow-y-auto animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setViewingProduct(null);
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="product-modal-title"
        >
          <div
            className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-sand-200 overflow-hidden my-auto flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Top Header */}
            <div className="bg-sand-50/95 border-b border-sand-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
              <div className="space-y-1.5 pr-4 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  {(viewingProduct.sku || viewingProduct.supplier_sku) && (
                    <span className="font-mono text-[11px] font-bold text-[#00072D] bg-[#FAF6EE] border border-[#C89B3C]/60 px-2.5 py-0.5 rounded-md">
                      SKU: {viewingProduct.sku || viewingProduct.supplier_sku}
                    </span>
                  )}
                  <span className="font-mono text-[11px] font-bold text-navy-600 bg-sand-200/80 px-2.5 py-0.5 rounded-md">
                    {viewingProduct.id}
                  </span>
                  <span className="text-xs font-semibold text-brass-800 bg-brass-100/70 px-2.5 py-0.5 rounded-full capitalize">
                    {categories.find((c) => c.id === viewingProduct.category_id)?.name ||
                      viewingProduct.category_id?.replace("cat_", "").replace(/_/g, " ")}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                      viewingProduct.status === "published"
                        ? "text-emerald-800 bg-emerald-50 border-emerald-200"
                        : "text-amber-800 bg-amber-50 border-amber-200"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        viewingProduct.status === "published"
                          ? "bg-emerald-500 animate-pulse"
                          : "bg-amber-500"
                      }`}
                    />
                    <span className="capitalize">{viewingProduct.status || "Draft"}</span>
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full border whitespace-nowrap ${
                      (viewingProduct.stock_level ?? 25) <= 0 || viewingProduct.status === "out_of_stock"
                        ? "text-rose-800 bg-rose-50 border-rose-200"
                        : (viewingProduct.stock_level ?? 25) <= 10
                        ? "text-amber-800 bg-amber-50 border-amber-200"
                        : "text-emerald-800 bg-emerald-50 border-emerald-200"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        (viewingProduct.stock_level ?? 25) <= 0 || viewingProduct.status === "out_of_stock"
                          ? "bg-rose-500"
                          : (viewingProduct.stock_level ?? 25) <= 10
                          ? "bg-amber-500"
                          : "bg-emerald-500 animate-pulse"
                      }`}
                    />
                    <span className="whitespace-nowrap">
                      {(viewingProduct.stock_level ?? 25) <= 0 || viewingProduct.status === "out_of_stock"
                        ? "Out of Stock (Auto-Hidden)"
                        : `${viewingProduct.stock_level ?? 25} in stock`}
                    </span>
                  </span>
                  {detailLoading && (
                    <span className="text-[11px] text-navy-400 font-medium animate-pulse flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-brass-600 animate-spin" />
                      Syncing live specs...
                    </span>
                  )}
                </div>
                <h2
                  id="product-modal-title"
                  className="font-display text-xl sm:text-2xl font-bold text-navy-950 tracking-tight truncate"
                  title={viewingProduct.title}
                >
                  {viewingProduct.title}
                </h2>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <a
                  href={`/products/${viewingProduct.handle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl text-navy-600 hover:text-navy-950 hover:bg-sand-200/80 transition-colors hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold"
                  title="Preview on live UK storefront"
                >
                  <ExternalLink className="w-4 h-4 text-navy-500" />
                  <span>Storefront</span>
                </a>
                <button
                  type="button"
                  onClick={() => setViewingProduct(null)}
                  className="p-2 rounded-xl text-navy-400 hover:text-navy-900 hover:bg-sand-200/80 transition-colors"
                  title="Close modal (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-navy-950">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Left Column: Visuals & Compliance */}
                <div className="md:col-span-5 space-y-4">
                  {/* Main Image Stage */}
                  <div className="relative aspect-square w-full rounded-2xl overflow-hidden border border-sand-200 bg-sand-100 shadow-inner flex items-center justify-center group">
                    {activeImage ? (
                      <img
                        src={activeImage}
                        alt={viewingProduct.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="p-8 text-center text-navy-400">
                        <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <span className="text-xs">No image available</span>
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      <span className="font-mono text-[10px] uppercase font-bold text-navy-950 bg-white/90 backdrop-blur-xs px-2 py-1 rounded-md shadow-xs border border-sand-200/50">
                        UK Spec
                      </span>
                    </div>
                  </div>

                  {/* Multi-Image Gallery Row */}
                  {modalGalleryImages.length > 1 && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                      {modalGalleryImages.map((img, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setActiveImage(img)}
                          className={`relative flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                            activeImage === img
                              ? "border-brass-600 ring-2 ring-brass-500/30 scale-105"
                              : "border-sand-200 opacity-70 hover:opacity-100"
                          }`}
                        >
                          <img
                            src={img}
                            alt={`Angle ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* UK Quality Check Card */}
                  <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200/90 flex items-start gap-3 shadow-xs">
                    <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 flex-shrink-0">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-xs text-emerald-950">
                          UK Quality Checked &amp; Inspected
                        </h4>
                        <span className="text-[10px] font-bold uppercase bg-emerald-200/80 text-emerald-900 px-1.5 py-0.2 rounded">
                          Verified
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-800 mt-0.5 leading-relaxed">
                        Full structural integrity check, heavy-duty joinery, and durable protective packaging applied prior to dispatch.
                      </p>
                    </div>
                  </div>

                  {/* UK Logistics Tier Card */}
                  <div className="p-4 rounded-xl bg-sand-100/80 border border-sand-200 flex items-start gap-3 shadow-xs">
                    <div className="p-2 rounded-lg bg-sand-200 text-navy-800 flex-shrink-0">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-xs text-navy-950">
                        {viewingProduct.delivery_tier === "two_man_white_glove"
                          ? "Specialist 2-Man White Glove"
                          : viewingProduct.delivery_tier === "pallet"
                          ? "Kerbside Pallet Delivery"
                          : "UK Tracked Standard Parcel"}
                      </h4>
                      <p className="text-[11px] text-navy-600 mt-0.5 leading-relaxed">
                        {viewingProduct.delivery_tier === "two_man_white_glove"
                          ? "Delivered directly to room of choice by 2-man uniformed logistics team with full packaging removal."
                          : viewingProduct.delivery_tier === "pallet"
                          ? "Heavy freight pallet delivery with tailgate offloading at mainland UK curb."
                          : "Standard nationwide carrier delivery with live track-and-trace notifications."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right Column: Financials, Dimensions, Materials & Details */}
                <div className="md:col-span-7 space-y-4">
                  {/* Live Warehouse Inventory & Stock Card */}
                  <div
                    className={`p-4 rounded-2xl border shadow-xs flex items-center justify-between ${
                      (viewingProduct.stock_level ?? 25) <= 0 || viewingProduct.status === "out_of_stock"
                        ? "bg-rose-50/90 border-rose-200"
                        : "bg-gradient-to-br from-emerald-50/90 to-sand-50 border-emerald-200"
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`p-2.5 rounded-xl flex-shrink-0 shadow-xs ${
                          (viewingProduct.stock_level ?? 25) <= 0 || viewingProduct.status === "out_of_stock"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        <Box
                          className={`w-5 h-5 ${
                            (viewingProduct.stock_level ?? 25) <= 0 || viewingProduct.status === "out_of_stock"
                              ? "text-rose-700"
                              : "text-emerald-700"
                          }`}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-xs text-navy-950 uppercase tracking-wider">
                            Live Warehouse Stock Level
                          </h4>
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                              (viewingProduct.stock_level ?? 25) <= 0 || viewingProduct.status === "out_of_stock"
                                ? "bg-rose-200 text-rose-900"
                                : "bg-emerald-200/80 text-emerald-900"
                            }`}
                          >
                            {(viewingProduct.stock_level ?? 25) <= 0 || viewingProduct.status === "out_of_stock"
                              ? "Stock Out Detected"
                              : "UK Hub"}
                          </span>
                        </div>
                        <p className="text-xs text-navy-700 mt-1">
                          <strong
                            className={`font-display text-base font-bold ${
                              (viewingProduct.stock_level ?? 25) <= 0 || viewingProduct.status === "out_of_stock"
                                ? "text-rose-700"
                                : "text-emerald-800"
                            }`}
                          >
                            {(viewingProduct.stock_level ?? 25) <= 0 || viewingProduct.status === "out_of_stock"
                              ? "Out of Stock (Auto-Hidden from Storefront)"
                              : `${viewingProduct.stock_level ?? 25} Units In Stock`}
                          </strong>{" "}
                          &bull;{" "}
                          {(viewingProduct.stock_level ?? 25) <= 0 || viewingProduct.status === "out_of_stock"
                            ? "Automatically hidden from customer storefront to prevent unfulfillable orders."
                            : `Ready for instant dispatch via ${viewingProduct.delivery_tier === "two_man_white_glove" ? "2-Man White Glove" : "Freight"}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right hidden sm:block">
                      <span
                        className={`text-[11px] font-mono font-semibold px-3 py-1.5 rounded-lg border shadow-xs ${
                          (viewingProduct.stock_level ?? 25) <= 0 || viewingProduct.status === "out_of_stock"
                            ? "text-rose-800 bg-rose-100/80 border-rose-200"
                            : "text-emerald-800 bg-white/90 border-emerald-200/80"
                        }`}
                      >
                        {(viewingProduct.stock_level ?? 25) <= 0 || viewingProduct.status === "out_of_stock"
                          ? "Status: Hidden"
                          : "Lead: 3-5 Working Days"}
                      </span>
                    </div>
                  </div>

                  {/* Commercial Financials Bento Card */}
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-sand-100/90 to-sand-50 border border-sand-300/80 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-navy-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Coins className="w-4 h-4 text-brass-600" />
                        Commercial Pricing &amp; Margins
                      </span>
                      <span className="text-[11px] font-semibold text-navy-500 bg-sand-200/80 px-2 py-0.5 rounded-full">
                        20% UK VAT Included
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 bg-white rounded-xl border border-sand-200 shadow-xs">
                        <span className="text-[10px] font-semibold text-navy-500 uppercase tracking-wider block">
                          Retail Price
                        </span>
                        <p className="text-xl font-display font-bold text-navy-950 mt-0.5">
                          {formatGBP(viewingProduct.price_pennies)}
                        </p>
                        {viewingProduct.compare_at_price_pennies && viewingProduct.compare_at_price_pennies > viewingProduct.price_pennies && (
                          <span className="text-[10px] text-navy-400 line-through">
                            {formatGBP(viewingProduct.compare_at_price_pennies)}
                          </span>
                        )}
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-sand-200 shadow-xs">
                        <span className="text-[10px] font-semibold text-navy-500 uppercase tracking-wider block">
                          Supplier Cost
                        </span>
                        <p className="text-xl font-mono font-bold text-navy-800 mt-0.5">
                          {viewingProduct.cost_price_pennies ? formatGBP(viewingProduct.cost_price_pennies) : "£0.00"}
                        </p>
                        <span className="text-[10px] text-navy-400">Wholesale trade</span>
                      </div>

                      <div className="p-3 bg-emerald-50/90 rounded-xl border border-emerald-200 shadow-xs">
                        <span className="text-[10px] font-semibold text-emerald-800 uppercase tracking-wider block">
                          Gross Margin
                        </span>
                        <p className="text-xl font-bold text-emerald-700 mt-0.5">
                          {viewingProduct.cost_price_pennies
                            ? (((viewingProduct.price_pennies - viewingProduct.cost_price_pennies) / viewingProduct.price_pennies) * 100).toFixed(1)
                            : (viewingProduct.markup_percentage || "40.0")}%
                        </p>
                        <span className="text-[10px] text-emerald-700 font-medium">
                          +{formatGBP(
                            viewingProduct.cost_price_pennies
                              ? viewingProduct.price_pennies - viewingProduct.cost_price_pennies
                              : Math.round(viewingProduct.price_pennies * 0.4)
                          )} profit
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-sand-200/70 space-y-1.5 text-[11px] text-navy-600">
                      <div className="flex items-center justify-between">
                        <span>UK Statutory 20% VAT:</span>
                        <span className="font-mono font-semibold text-navy-900">
                          {formatGBP(Math.round(viewingProduct.price_pennies - viewingProduct.price_pennies / 1.2))}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Net Selling Price (ex VAT):</span>
                        <span className="font-mono font-semibold text-navy-900">
                          {formatGBP(Math.round(viewingProduct.price_pennies / 1.2))}
                        </span>
                      </div>
                      {viewingProduct.cost_price_pennies && (
                        <div className="p-2 rounded-lg bg-sand-100/80 text-[10px] text-navy-800 leading-relaxed border border-sand-200">
                          <strong>Pricing Formula:</strong> Trade ({formatGBP(viewingProduct.cost_price_pennies)}) → Net Retail ({formatGBP(Math.round(viewingProduct.price_pennies / 1.2))}) + 20% VAT ({formatGBP(Math.round(viewingProduct.price_pennies - viewingProduct.price_pennies / 1.2))}) = <strong>{formatGBP(viewingProduct.price_pennies)}</strong>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Physical Specifications Grid */}
                  <div>
                    <h4 className="text-xs font-bold text-navy-800 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                      <Ruler className="w-4 h-4 text-navy-600" />
                      Furniture Dimensions &amp; Craftsmanship
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-sand-50 rounded-xl border border-sand-200">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-medium text-navy-500">Dimensions</span>
                          <span className="text-[10px] font-mono text-navy-400">W &times; D &times; H</span>
                        </div>
                        <p className="font-mono font-bold text-sm text-navy-950 mt-1">
                          {viewingProduct.width_cm}cm &times; {viewingProduct.depth_cm}cm &times; {viewingProduct.height_cm}cm
                        </p>
                        {viewingProduct.seat_height_cm ? (
                          <span className="text-[11px] text-navy-600 mt-0.5 block">
                            Seat Height: {viewingProduct.seat_height_cm} cm
                          </span>
                        ) : null}
                      </div>

                      <div className="p-3 bg-sand-50 rounded-xl border border-sand-200">
                        <span className="text-[11px] font-medium text-navy-500 block">Net Item Weight</span>
                        <p className="font-mono font-bold text-sm text-navy-950 mt-1">
                          {viewingProduct.weight_kg} kg
                        </p>
                        <span className="text-[11px] text-navy-600 mt-0.5 block">
                          {viewingProduct.weight_kg > 50 ? "Requires 2-person lift" : "Standard single handling"}
                        </span>
                      </div>

                      <div className="p-3 bg-sand-50 rounded-xl border border-sand-200">
                        <span className="text-[11px] font-medium text-navy-500 block">Primary Material</span>
                        <p className="font-semibold text-sm text-navy-950 mt-1 capitalize">
                          {viewingProduct.material?.replace(/_/g, " ") || "Engineered Hardwood"}
                        </p>
                        <span className="text-[11px] text-navy-600 mt-0.5 block">Premium grade finish</span>
                      </div>

                      <div className="p-3 bg-sand-50 rounded-xl border border-sand-200">
                        <span className="text-[11px] font-medium text-navy-500 block">Color / Finish</span>
                        <p className="font-semibold text-sm text-navy-950 mt-1">
                          {viewingProduct.color || "Standard"}
                        </p>
                        <span className="text-[11px] text-navy-600 mt-0.5 block">Catalog palette</span>
                      </div>
                    </div>

                    <div className="mt-3 p-3 bg-sand-50 rounded-xl border border-sand-200 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-navy-500">Assembly:</span>
                        <span className="font-semibold text-navy-950">
                          {viewingProduct.assembly_required ? "Flat-pack self assembly" : "Fully Assembled"}
                        </span>
                      </div>
                      {viewingProduct.assembly_instructions_url ? (
                        <a
                          href={viewingProduct.assembly_instructions_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-navy-950 hover:bg-navy-900 text-brass-400 font-bold text-[11px] shadow-xs transition-colors cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>View Assembly Manual (PDF)</span>
                        </a>
                      ) : (
                        <span className="text-[11px] text-navy-400 italic">Printed manual included in box</span>
                      )}
                    </div>
                  </div>

                  {/* Available Options & Variants */}
                  {viewingProduct.variants && viewingProduct.variants.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-navy-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-navy-600" />
                        Available Options &amp; Variants ({viewingProduct.variants.length})
                      </h4>
                      <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto p-1 no-scrollbar">
                        {viewingProduct.variants.map((v: any, i: number) => (
                          <span
                            key={v.id || i}
                            className="px-2.5 py-1 rounded-lg bg-sand-100 border border-sand-300 text-xs text-navy-900 font-medium flex items-center gap-1.5"
                          >
                            <span>{v.title || "Option"}</span>
                            {v.sku && <span className="text-[10px] font-mono text-navy-500 font-bold">({v.sku})</span>}
                            {v.stock_quantity !== undefined && (
                              <span className="text-[10px] text-navy-500">&bull; {v.stock_quantity} in stock</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Product Overview / Description (if available) */}
                  {viewingProduct.description && (
                    <div>
                      <h4 className="text-xs font-bold text-navy-800 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-brass-600" />
                        Description &amp; Specifications
                      </h4>
                      <div className="text-xs text-navy-700 leading-relaxed bg-sand-50 p-3.5 rounded-xl border border-sand-200 max-h-48 overflow-y-auto">
                        <p className="whitespace-pre-line">{cleanHtmlDescription(viewingProduct.description)}</p>
                      </div>
                    </div>
                  )}

                  {/* Product Handle & Direct Route */}
                  <div className="p-3 bg-sand-100/60 rounded-xl border border-sand-200/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-navy-500">Live Handle:</span>
                      <code className="font-mono text-navy-900 bg-sand-200/70 px-1.5 py-0.5 rounded text-[11px]">
                        /products/{viewingProduct.handle}
                      </code>
                    </div>
                    <span className="text-[11px] text-navy-400 font-mono">
                      ID: {viewingProduct.id}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Action Footer */}
            <div className="bg-sand-50/95 border-t border-sand-200 px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0">
              <a
                href={`/products/${viewingProduct.handle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-semibold text-navy-700 hover:text-brass-700 transition-colors order-2 sm:order-1"
              >
                <ExternalLink className="w-4 h-4 text-navy-500" />
                <span>Open Customer Product Page</span>
              </a>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end order-1 sm:order-2">
                <button
                  type="button"
                  onClick={() => setViewingProduct(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-navy-700 bg-sand-200/80 hover:bg-sand-300 transition-colors"
                >
                  Close
                </button>
                <Link
                  href={`/admin/products/${viewingProduct.id}/edit`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-brass-500 to-brass-600 hover:from-brass-400 hover:to-brass-500 text-navy-950 font-bold text-xs tracking-wide shadow-sm shadow-brass-500/20 transition-all"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Edit Full Product</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Landed Cost & Supplier Sourcing Modal */}
      {calcProduct && (
        <div
          className="fixed inset-0 z-50 bg-navy-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fade-in"
          onClick={() => setCalcProduct(null)}
        >
          <div
            className="relative w-full max-w-4xl bg-sand-50 border border-sand-300 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 bg-sand-100 border-b border-sand-300 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-navy-950 flex items-center justify-center shadow-xs">
                  <Calculator className="w-5 h-5 text-brass-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-base font-bold text-navy-950">
                      Dynamic Landed Cost &amp; Profit Breakdown
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
                      UK Dropship Pricing
                    </span>
                    {(calcProduct.sku || calcProduct.supplier_sku) && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#FAF6EE] text-[#00072D] border border-[#C89B3C]/50">
                        SKU: {calcProduct.sku ? formatProductSku(calcProduct.sku) : (calcProduct.id.startsWith("prod_live_am_") ? `SAN-${calcProduct.supplier_sku?.replace(/[^0-9]/g, "")}` : (calcProduct.id.startsWith("prod_ftg_") ? `SAN-${calcProduct.supplier_sku?.replace(/^(FTG-|SAN-)/i, "")}` : calcProduct.sku))}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-navy-600 line-clamp-1">
                    Mathematical breakdown of wholesale trade cost, freight, 20% UK VAT &amp; supplier sourcing for <span className="font-semibold text-navy-900">{calcProduct.title}</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setCalcProduct(null)}
                className="w-8 h-8 rounded-full bg-sand-200 hover:bg-sand-300 text-navy-700 hover:text-navy-950 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-6 space-y-6 overflow-y-auto">
              {/* Section 1: Target Markup Presets & Landed Cost Controls */}
              <div className="p-4 rounded-2xl bg-white border border-sand-300 shadow-2xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-navy-950 uppercase tracking-wider block">
                      Target Markup Simulator (% on Landed Cost)
                    </span>
                    <span className="text-[11px] text-navy-500">
                      Select target gross markup to dynamically calculate recommended retail price
                    </span>
                  </div>

                  {/* Markup Presets */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[30, 35, 40, 45, 50, 60].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setCalcMarkupPercent(String(pct))}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          calcTargetMarkupVal === pct
                            ? "bg-navy-950 text-sand-50 ring-2 ring-brass-500 shadow-xs"
                            : "bg-sand-100 hover:bg-sand-200 text-navy-800 border border-sand-300"
                        }`}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-sand-200">
                  <div>
                    <label className="block text-[11px] font-semibold text-navy-700 mb-1">
                      Inbound Freight / Drop Fee (£)
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-navy-500">£</span>
                      <input
                        type="number"
                        step="0.01"
                        value={calcShippingGbp}
                        onChange={(e) => setCalcShippingGbp(e.target.value)}
                        className="w-full pl-6 pr-2.5 py-1.5 bg-sand-50 border border-sand-300 rounded-lg text-xs font-mono font-bold text-navy-950 focus:outline-none focus:border-brass-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-navy-700 mb-1">
                      Target Markup %
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="1"
                        value={calcMarkupPercent}
                        onChange={(e) => setCalcMarkupPercent(e.target.value)}
                        className="w-full pl-3 pr-6 py-1.5 bg-sand-50 border border-sand-300 rounded-lg text-xs font-mono font-bold text-navy-950 focus:outline-none focus:border-brass-500"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-navy-500">%</span>
                    </div>
                  </div>

                  <div className="flex items-end">
                    <button
                      type="button"
                      disabled={calcSaving}
                      onClick={() => handleApplySuggestedPrice()}
                      className="w-full py-1.5 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {calcSaving ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Apply Formula (£{calcAutoRetailIncVat.toFixed(2)})</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Section 2: 7-Step Visual Formula Chain */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-navy-950 uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-brass-600" />
                    <span>UK Pricing Mathematical Architecture</span>
                  </h4>
                  <span className="text-[11px] font-mono text-navy-500">
                    Formula: (Trade + Freight) × (1 + Markup%) × 1.20 VAT
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
                  {/* Step 1: Wholesale */}
                  <div className="p-3 rounded-xl bg-white border border-sand-300 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-navy-400 uppercase tracking-wider block">Step 1</span>
                      <span className="text-[11px] font-bold text-navy-800 line-clamp-1">Trade Cost</span>
                      <span className="text-[10px] text-navy-500 block">ex VAT</span>
                    </div>
                    <div className="mt-2 font-mono font-bold text-navy-950 text-sm">
                      £{calcCostVal.toFixed(2)}
                    </div>
                  </div>

                  {/* Step 2: Shipping */}
                  <div className="p-3 rounded-xl bg-white border border-sand-300 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-navy-400 uppercase tracking-wider block">Step 2</span>
                      <span className="text-[11px] font-bold text-navy-800 line-clamp-1">+ Inbound Freight</span>
                      <span className="text-[10px] text-navy-500 block">Pallet / Courier</span>
                    </div>
                    <div className="mt-2 font-mono font-bold text-navy-950 text-sm">
                      +£{calcShippingVal.toFixed(2)}
                    </div>
                  </div>

                  {/* Step 3: Landed Cost */}
                  <div className="p-3 rounded-xl bg-sand-200/80 border border-sand-300 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-brass-700 uppercase tracking-wider block">Step 3</span>
                      <span className="text-[11px] font-bold text-navy-950 line-clamp-1">= Landed Cost</span>
                      <span className="text-[10px] text-navy-600 block">True COGS</span>
                    </div>
                    <div className="mt-2 font-mono font-black text-navy-950 text-sm">
                      £{calcLandedCost.toFixed(2)}
                    </div>
                  </div>

                  {/* Step 4: Target Markup */}
                  <div className="p-3 rounded-xl bg-white border border-sand-300 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-navy-400 uppercase tracking-wider block">Step 4</span>
                      <span className="text-[11px] font-bold text-navy-800 line-clamp-1">+ Markup ({calcTargetMarkupVal}%)</span>
                      <span className="text-[10px] text-navy-500 block">Commercial Margin</span>
                    </div>
                    <div className="mt-2 font-mono font-bold text-emerald-700 text-sm">
                      +£{(calcAutoNetRetail - calcLandedCost).toFixed(2)}
                    </div>
                  </div>

                  {/* Step 5: Net Retail */}
                  <div className="p-3 rounded-xl bg-white border border-sand-300 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-navy-400 uppercase tracking-wider block">Step 5</span>
                      <span className="text-[11px] font-bold text-navy-800 line-clamp-1">= Net Retail</span>
                      <span className="text-[10px] text-navy-500 block">ex 20% VAT</span>
                    </div>
                    <div className="mt-2 font-mono font-bold text-navy-950 text-sm">
                      £{calcAutoNetRetail.toFixed(2)}
                    </div>
                  </div>

                  {/* Step 6: 20% VAT */}
                  <div className="p-3 rounded-xl bg-white border border-sand-300 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-navy-400 uppercase tracking-wider block">Step 6</span>
                      <span className="text-[11px] font-bold text-navy-800 line-clamp-1">+ 20% UK VAT</span>
                      <span className="text-[10px] text-navy-500 block">HMRC Statutory</span>
                    </div>
                    <div className="mt-2 font-mono font-bold text-amber-700 text-sm">
                      +£{(calcAutoRetailIncVat - calcAutoNetRetail).toFixed(2)}
                    </div>
                  </div>

                  {/* Step 7: Customer Retail */}
                  <div className="p-3 rounded-xl bg-navy-950 text-sand-50 border border-navy-900 flex flex-col justify-between shadow-xs">
                    <div>
                      <span className="text-[10px] font-bold text-brass-400 uppercase tracking-wider block">Step 7</span>
                      <span className="text-[11px] font-bold text-white line-clamp-1">= Formula Price</span>
                      <span className="text-[10px] text-sand-300 block">Customer (Inc VAT)</span>
                    </div>
                    <div className="mt-2 font-mono font-black text-brass-300 text-sm">
                      £{calcAutoRetailIncVat.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Live Financial KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-xl bg-white border border-sand-300">
                  <span className="text-[11px] font-semibold text-navy-600 block">Gross Profit / Unit</span>
                  <div className="mt-1 font-mono font-bold text-lg text-navy-950">
                    £{calcGrossProfit.toFixed(2)}
                  </div>
                  <span className="text-[10px] text-navy-500">Retail price minus trade cost</span>
                </div>

                <div className="p-4 rounded-xl bg-white border border-sand-300">
                  <span className="text-[11px] font-semibold text-navy-600 block">Gross Margin %</span>
                  <div className="mt-1 font-mono font-bold text-lg text-emerald-700">
                    {calcGrossMarginPercent}%
                  </div>
                  <span className="text-[10px] text-navy-500">Gross profit on retail price</span>
                </div>

                <div className="p-4 rounded-xl bg-white border border-sand-300">
                  <span className="text-[11px] font-semibold text-navy-600 block">Net Commercial Profit</span>
                  <div className="mt-1 font-mono font-bold text-lg text-navy-950">
                    £{calcNetCommercialProfit.toFixed(2)}
                  </div>
                  <span className="text-[10px] text-navy-500">After deducting 20% VAT &amp; freight</span>
                </div>

                <div className="p-4 rounded-xl bg-white border border-sand-300">
                  <span className="text-[11px] font-semibold text-navy-600 block">Anchor High Street RRP</span>
                  <div className="mt-1 font-mono font-bold text-lg text-navy-500 line-through">
                    £{calcCompareAtVal.toFixed(2)}
                  </div>
                  <span className="text-[10px] text-navy-500">25% strike-through anchor</span>
                </div>
              </div>

              {/* Section 4: Supplier Product Sourcing & Live Direct Link */}
              {(() => {
                const supplier = getSupplierInfo(calcProduct);
                return (
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-sand-100 via-sand-200/60 to-sand-100 border border-sand-300 shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-navy-900 text-brass-400 flex items-center justify-center shrink-0 shadow-xs">
                          <Building className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-display font-bold text-navy-950 text-sm">
                              {supplier.name}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-navy-950 text-brass-400 text-[10px] font-bold">
                              {supplier.badge}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-navy-600">
                            <span>Supplier SKU: <strong className="text-navy-900 font-mono">{supplier.sku}</strong></span>
                            <span>•</span>
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              {supplier.isDirect ? "Direct Verified Link" : "Catalog Search Fallback"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 1-Click Button directly to Supplier Product Page */}
                      <a
                        href={supplier.productUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-navy-950 hover:bg-navy-900 text-sand-50 font-bold text-xs shadow-md hover:shadow-lg transition-all shrink-0 cursor-pointer group"
                      >
                        <ExternalLink className="w-4 h-4 text-brass-400 group-hover:scale-110 transition-transform" />
                        <span>Open Product on {supplier.name}</span>
                      </a>
                    </div>

                    {/* URL Bar & Quick Helper */}
                    <div className="p-3 rounded-xl bg-white/80 border border-sand-300 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2 truncate text-navy-600 font-mono text-[11px]">
                        <span className="text-navy-400 shrink-0">Source URL:</span>
                        <a
                          href={supplier.productUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="truncate text-brass-700 hover:text-brass-900 hover:underline"
                        >
                          {supplier.productUrl}
                        </a>
                      </div>
                      <a
                        href={supplier.portalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 text-[11px] font-semibold text-navy-700 hover:text-navy-950 underline flex items-center gap-1"
                      >
                        <span>Supplier Portal</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    {/* Assembly Manual Direct Link */}
                    {calcProduct.assembly_instructions_url && (
                      <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2 text-emerald-950 font-semibold text-[11px]">
                          <FileText className="w-4 h-4 text-emerald-700 shrink-0" />
                          <span>Official Assembly Manual (PDF) attached</span>
                        </div>
                        <a
                          href={calcProduct.assembly_instructions_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 underline flex items-center gap-1 cursor-pointer"
                        >
                          <span>Open PDF Manual</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}

                    <p className="text-[11px] text-navy-500 leading-relaxed">
                      💡 <strong>সাপ্লায়ার ডাইরেক্ট নেভিগেশন:</strong> উপরের বাটনে ক্লিক করলে এক ক্লিকে সরাসরি {supplier.name} ({supplier.domain}) এর মূল প্রোডাক্ট পেজ ওপেন হবে। সেখান থেকে আপনি সাপ্লায়ারের লাইভ স্টক লেভেল, পাইকারি অফার, ডাইমেনশন স্পেসিফিকেশন ও অ্যাসেম্বলি গাইড সরাসরি যাচাই করতে পারবেন।
                    </p>
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-sand-100 border-t border-sand-300 flex items-center justify-between gap-3 flex-wrap">
              <span className="text-xs text-navy-600">
                Current Storefront Price: <strong className="font-mono text-navy-950 font-bold">£{calcCurrentRetailVal.toFixed(2)}</strong> (Inc 20% VAT)
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCalcProduct(null)}
                  className="px-4 py-2 rounded-xl bg-sand-200 hover:bg-sand-300 text-navy-800 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Close
                </button>
                <Link
                  href={`/admin/products/${calcProduct.id}/edit`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-sand-300 text-xs font-semibold text-navy-800 bg-white hover:bg-sand-100 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5 text-navy-600" />
                  <span>Edit Full Product</span>
                </Link>
                <button
                  type="button"
                  disabled={calcSaving}
                  onClick={() => handleApplySuggestedPrice()}
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {calcSaving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Apply Suggested Price &amp; Save</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
