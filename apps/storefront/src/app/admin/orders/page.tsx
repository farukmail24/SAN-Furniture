"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Truck,
  CheckCircle2,
  Clock,
  FileText,
  Download,
  Search,
  Filter,
  ChevronRight,
  ExternalLink,
  Printer,
  Calendar,
  MapPin,
  Phone,
  Mail,
  User,
  ShieldCheck,
  X,
  AlertCircle,
  Sparkles,
  Plus,
  Eye,
  Layers,
  Box,
  SlidersHorizontal,
  RotateCw,
  Building2,
  ClipboardCheck,
  Trash2,
  Check,
  Copy,
  ChevronDown,
  Ban,
  AlertTriangle
} from "lucide-react";
import { DataTable, ColumnDef } from "@/components/admin/DataTable";
import { formatGBP } from "@san-furniture/types";
import { apiUrl } from "@/lib/api-config";
import { showAlert, showConfirm } from "@/components/ui/AlertModal";
import { fetchWithSwr, invalidateCache } from "@/lib/api-cache";

interface OrderLineItem {
  productId?: string;
  sku?: string;
  title: string;
  finish?: string;
  pricePennies: number;
  quantity: number;
  thumbnailUrl?: string;
}

interface OrderItem {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  shipping_address?: string;
  postcode: string;
  shipping_zone?: string;
  delivery_tier: string;
  status: string;
  fulfillment_status?: string;
  total_pennies: number;
  subtotal_pennies?: number;
  shipping_pennies?: number;
  vat_pennies?: number;
  payment_status?: string;
  payment_method?: string;
  billing_address?: string;
  items_json?: string | null;
  carrier?: string;
  tracking_number?: string;
  po_number?: string;
  cancellation_reason?: string | null;
  cancelled_by?: string | null;
  cancelled_at?: string | null;
  created_at: string;
}

interface CatalogProduct {
  id: string;
  title: string;
  handle: string;
  price_pennies: number;
  thumbnail_url: string;
  sku_code?: string;
}

type StatusFilterTab = "all" | "awaiting_dispatch" | "in_transit" | "delivered" | "cancelled" | "white_glove" | "pallet";

export default function AdminOrdersPage() {
  const [mounted, setMounted] = useState(false);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Status Filter Tabs (Defaults to All Orders to ensure newest orders are immediately visible)
  const [activeTab, setActiveTab] = useState<StatusFilterTab>("all");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "7d" | "30d">("all");

  // Multi-Selection State for Bulk Actions
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  // Modals & Drawers State
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null); // Drill-down slide-over
  const [dispatchOrder, setDispatchOrder] = useState<OrderItem | null>(null); // 2-Man dispatch modal
  const [invoiceOrder, setInvoiceOrder] = useState<OrderItem | null>(null); // VAT invoice modal
  const [manifestOrder, setManifestOrder] = useState<OrderItem | null>(null); // 2-Man Carrier Manifest modal
  const [isManualOrderModalOpen, setIsManualOrderModalOpen] = useState(false); // Manual order modal

  // Cancel & Delete Confirmation States
  const [cancellingOrder, setCancellingOrder] = useState<OrderItem | null>(null);
  const [cancelReason, setCancelReason] = useState("Customer requested cancellation before dispatch");
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);

  const [deletingOrder, setDeletingOrder] = useState<OrderItem | null>(null);
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);

  // Dispatch Form State
  const [carrier, setCarrier] = useState("SAN Dedicated Delivery Fleet");
  const [trackingCode, setTrackingCode] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("2026-10-20");
  const [deliverySlot, setDeliverySlot] = useState("10:00 - 12:00 BST");
  const [roomNotes, setRoomNotes] = useState("");
  const [statusVal, setStatusVal] = useState("in_transit");
  const [isSubmittingDispatch, setIsSubmittingDispatch] = useState(false);

  // Manual Order Form State
  const [catalogProducts, setCatalogProducts] = useState<CatalogProduct[]>([]);
  const [manualForm, setManualForm] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "+44 20 7946 0912",
    shipping_address: "",
    postcode: "SW1A 1AA",
    delivery_tier: "two_man_white_glove",
    payment_method: "Stripe Manual (Telephone MOTO)",
    selectedProductId: "",
    quantity: 1,
    notes: "Room of choice: Ground floor Living Room. White Glove assembly required.",
  });
  const [isSubmittingManualOrder, setIsSubmittingManualOrder] = useState(false);
  const [dynamicDeliveryOptions, setDynamicDeliveryOptions] = useState<any[]>([]);

  // Internal Notes State (for slide-over drawer)
  const [internalNoteText, setInternalNoteText] = useState("");
  const [orderNotesList, setOrderNotesList] = useState<{ [orderId: string]: Array<{ text: string; date: string }> }>({});

  const showToast = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 4500);
  };

  const fetchOrders = useCallback(async (isSilent = false) => {
    setRefreshing(true);
    try {
      await fetchWithSwr<{ orders: OrderItem[] }>(
        apiUrl("/api/admin/orders"),
        (data) => {
          if (data && data.orders) {
            setOrders(data.orders);
            setLoading(false);
          }
        }
      );
    } catch (err) {
      console.error("Failed to load orders", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders(true);
    // Load catalog products for manual order modal with instant cache
    fetchWithSwr<{ products: CatalogProduct[] }>(
      apiUrl("/api/products"),
      (d) => {
        const list = d?.products || [];
        setCatalogProducts(list);
        if (list.length > 0 && !manualForm.selectedProductId) {
          setManualForm((prev) => ({ ...prev, selectedProductId: list[0].id }));
        }
      }
    ).catch(() => {});
    // Load dynamic delivery tiers for manual orders
    fetchWithSwr(apiUrl("/api/shipping/options"), (d: any) => {
      if (Array.isArray(d?.options)) {
        setDynamicDeliveryOptions(d.options);
      }
    }).catch(() => {});
  }, [fetchOrders]);

  // Copy tracking number to clipboard
  const handleCopyTracking = (code: string) => {
    navigator.clipboard.writeText(code);
    showToast(`Copied tracking code ${code} to clipboard.`);
  };

  // Open Dispatch Modal
  const openDispatchModal = (o: OrderItem) => {
    setDispatchOrder(o);
    const tier = (o.delivery_tier || "").toLowerCase();
    const defaultCarrier = tier.includes("pallet")
      ? "Palletways UK Freight"
      : tier.includes("white_glove")
      ? "SAN 2-Man Dedicated Fleet"
      : "SAN Dedicated Delivery Fleet";
    setCarrier(o.carrier && !o.carrier.includes("Awaiting") ? o.carrier : defaultCarrier);
    setTrackingCode(o.tracking_number && o.tracking_number !== "Awaiting allocation" ? o.tracking_number : `TRX-SAN-${Date.now().toString().slice(-6)}`);
    setStatusVal(o.status === "delivered" ? "delivered" : "in_transit");
  };

  // Save 2-Man Carrier Dispatch
  const handleSaveDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispatchOrder) return;
    setIsSubmittingDispatch(true);

    try {
      const res = await fetch(apiUrl(`/api/admin/orders/${dispatchOrder.id}/dispatch`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: statusVal,
          carrier,
          trackingNumber: trackingCode,
          deliverySlot,
          deliveryDate,
          notes: roomNotes,
        }),
      });

      if (!res.ok) throw new Error("Failed to dispatch order");

      invalidateCache("/api/admin/orders");
      showToast(`Order ${dispatchOrder.order_number || dispatchOrder.id} successfully dispatched via ${carrier}!`);
      setDispatchOrder(null);
      await fetchOrders(true);
    } catch (err: any) {
      await showAlert({ title: "Dispatch Failed", message: err.message, type: "danger" });
    } finally {
      setIsSubmittingDispatch(false);
    }
  };

  // 1-Click Status Updater
  const handleQuickStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(apiUrl(`/api/admin/orders/${orderId}/status`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        );
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
        }
        showToast(`Order status updated to ${newStatus.replace("_", " ").toUpperCase()}.`);
      }
    } catch {
      showToast("Failed to update order status.");
    }
  };

  // Bulk Status Update (e.g. Mark Selected In-Transit or Delivered)
  const handleBulkStatusChange = async (targetStatus: string) => {
    if (selectedOrderIds.length === 0) return;
    setIsBulkUpdating(true);
    try {
      const res = await fetch(apiUrl("/api/admin/orders/bulk-status"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedOrderIds, status: targetStatus }),
      });
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) =>
            selectedOrderIds.includes(o.id) ? { ...o, status: targetStatus } : o
          )
        );
        showToast(`${selectedOrderIds.length} orders updated to ${targetStatus.replace("_", " ")}.`);
        setSelectedOrderIds([]);
      }
    } catch {
      showToast("Bulk status update failed.");
    } finally {
      setIsBulkUpdating(false);
    }
  };

  // Create Manual Phone/Concierge Order
  const handleCreateManualOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const product = catalogProducts.find((p) => p.id === manualForm.selectedProductId);
    if (!product) {
      await showAlert({ title: "Product Required", message: "Please select a valid product.", type: "warning" });
      return;
    }

    setIsSubmittingManualOrder(true);
    try {
      const orderPayload = {
        customer_name: manualForm.customer_name,
        customer_email: manualForm.customer_email,
        customer_phone: manualForm.customer_phone,
        shipping_address: manualForm.shipping_address,
        postcode: manualForm.postcode,
        delivery_tier: manualForm.delivery_tier,
        payment_method: manualForm.payment_method,
        notes: manualForm.notes,
        items: [
          {
            productId: product.id,
            sku: product.sku_code || `SKU-${product.id.slice(-5)}`,
            title: product.title,
            pricePennies: product.price_pennies,
            quantity: manualForm.quantity,
            thumbnailUrl: product.thumbnail_url,
          },
        ],
      };

      const res = await fetch(apiUrl("/api/admin/orders"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });

      if (res.ok) {
        const data = await res.json();
        showToast(`Manual order ${data.orderNumber} created successfully!`);
        setIsManualOrderModalOpen(false);
        setManualForm({
          customer_name: "",
          customer_email: "",
          customer_phone: "+44 20 7946 0912",
          shipping_address: "",
          postcode: "SW1A 1AA",
          delivery_tier: "two_man_white_glove",
          payment_method: "Stripe Manual (Telephone MOTO)",
          selectedProductId: catalogProducts[0]?.id || "",
          quantity: 1,
          notes: "Room of choice: Ground floor Living Room. White Glove assembly required.",
        });
        await fetchOrders(true);
      } else {
        const err = await res.json();
        await showAlert({ title: "Order Creation Failed", message: err.error || "Failed to create manual order.", type: "danger" });
      }
    } catch (err: any) {
      await showAlert({ title: "Order Error", message: err.message, type: "danger" });
    } finally {
      setIsSubmittingManualOrder(false);
    }
  };

  // Internal Note Submission for Slide-Over Drawer
  const handleAddInternalNote = (orderId: string) => {
    if (!internalNoteText.trim()) return;
    const newNote = {
      text: internalNoteText.trim(),
      date: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) + " BST",
    };
    setOrderNotesList((prev) => ({
      ...prev,
      [orderId]: [...(prev[orderId] || []), newNote],
    }));
    setInternalNoteText("");
    showToast("Internal staff note recorded.");
  };

  const handlePrint = () => {
    window.print();
  };

  const handleConfirmCancelOrder = async () => {
    if (!cancellingOrder) return;
    setIsSubmittingCancel(true);
    try {
      const res = await fetch(apiUrl(`/api/admin/orders/${cancellingOrder.id}/cancel`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancelReason }),
      });
      const data = await res.json();
      if (res.ok) {
        const nowIso = new Date().toISOString();
        setOrders((prev) =>
          prev.map((o) =>
            o.id === cancellingOrder.id
              ? {
                  ...o,
                  status: "cancelled",
                  fulfillment_status: "cancelled",
                  payment_status: "refund_pending",
                  cancellation_reason: cancelReason,
                  cancelled_by: "Staff (Admin)",
                  cancelled_at: nowIso,
                }
              : o
          )
        );
        if (selectedOrder?.id === cancellingOrder.id) {
          setSelectedOrder((prev) =>
            prev
              ? {
                  ...prev,
                  status: "cancelled",
                  fulfillment_status: "cancelled",
                  payment_status: "refund_pending",
                  cancellation_reason: cancelReason,
                  cancelled_by: "Staff (Admin)",
                  cancelled_at: nowIso,
                }
              : null
          );
        }
        invalidateCache("/api/admin/orders");
        invalidateCache("/api/admin/metrics");
        showToast(`Order ${cancellingOrder.order_number || cancellingOrder.id} cancelled. Refund scheduled.`);
        setCancellingOrder(null);
      } else {
        await showAlert({ title: "Order Cancel Failed", message: data.error || "Failed to cancel order.", type: "danger" });
      }
    } catch (err: any) {
      await showAlert({ title: "Cancel Error", message: err?.message || "Network error", type: "danger" });
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  const handleConfirmDeleteOrder = async () => {
    if (!deletingOrder) return;
    setIsSubmittingDelete(true);
    try {
      const res = await fetch(apiUrl(`/api/admin/orders/${deletingOrder.id}`), {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        setOrders((prev) => prev.filter((o) => o.id !== deletingOrder.id));
        if (selectedOrder?.id === deletingOrder.id) {
          setSelectedOrder(null);
        }
        invalidateCache("/api/admin/orders");
        invalidateCache("/api/admin/metrics");
        showToast(`Order ${deletingOrder.order_number || deletingOrder.id} permanently deleted.`);
        setDeletingOrder(null);
      } else {
        await showAlert({ title: "Delete Order Failed", message: data.error || "Failed to delete order.", type: "danger" });
      }
    } catch (err: any) {
      await showAlert({ title: "Delete Order Error", message: err?.message || "Network error", type: "danger" });
    } finally {
      setIsSubmittingDelete(false);
    }
  };

  // Key KPI Calculations
  const totalRevenuePennies = useMemo(
    () => orders.reduce((sum, o) => sum + (o.total_pennies || 0), 0),
    [orders]
  );
  const cancelledCount = useMemo(
    () => orders.filter((o) => o.status === "cancelled" || o.fulfillment_status === "cancelled").length,
    [orders]
  );
  const pendingDispatchCount = useMemo(
    () =>
      orders.filter(
        (o) =>
          o.status !== "cancelled" &&
          o.fulfillment_status !== "cancelled" &&
          (o.status === "unfulfilled" || o.status === "paid" || o.status === "po_dispatched")
      ).length,
    [orders]
  );
  const inTransitCount = useMemo(
    () =>
      orders.filter(
        (o) =>
          o.status !== "cancelled" &&
          o.fulfillment_status !== "cancelled" &&
          (o.status === "in_transit" || o.status === "in_transit_two_man")
      ).length,
    [orders]
  );
  const deliveredCount = useMemo(
    () =>
      orders.filter(
        (o) =>
          o.status !== "cancelled" &&
          o.fulfillment_status !== "cancelled" &&
          o.status === "delivered"
      ).length,
    [orders]
  );
  const whiteGloveCount = useMemo(
    () => orders.filter((o) => o.delivery_tier === "two_man_white_glove").length,
    [orders]
  );
  const palletCount = useMemo(
    () => orders.filter((o) => o.delivery_tier === "pallet").length,
    [orders]
  );

  // Filtered Orders for the Table
  const filteredOrders = useMemo(() => {
    const list = orders.filter((o) => {
      // Status tab filter
      if (activeTab === "awaiting_dispatch") {
        if (o.status === "cancelled" || o.fulfillment_status === "cancelled") {
          return false;
        }
        if (o.status !== "unfulfilled" && o.status !== "paid" && o.status !== "po_dispatched") {
          return false;
        }
      } else if (activeTab === "in_transit") {
        if (o.status === "cancelled" || o.fulfillment_status === "cancelled") {
          return false;
        }
        if (o.status !== "in_transit" && o.status !== "in_transit_two_man") {
          return false;
        }
      } else if (activeTab === "delivered") {
        if (o.status === "cancelled" || o.fulfillment_status === "cancelled") {
          return false;
        }
        if (o.status !== "delivered") return false;
      } else if (activeTab === "cancelled") {
        if (o.status !== "cancelled" && o.fulfillment_status !== "cancelled") {
          return false;
        }
      } else if (activeTab === "white_glove") {
        if (o.delivery_tier !== "two_man_white_glove") return false;
      } else if (activeTab === "pallet") {
        if (o.delivery_tier !== "pallet") return false;
      }

      // Date filter
      if (dateFilter !== "all") {
        const orderDate = new Date(o.created_at).getTime();
        const now = Date.now();
        if (dateFilter === "today" && now - orderDate > 24 * 60 * 60 * 1000) return false;
        if (dateFilter === "7d" && now - orderDate > 7 * 24 * 60 * 60 * 1000) return false;
        if (dateFilter === "30d" && now - orderDate > 30 * 24 * 60 * 60 * 1000) return false;
      }

      return true;
    });

    // Strictly sort newest orders at the very top (ORDER BY created_at DESC)
    return [...list].sort((a, b) => {
      const timeA = new Date(a.created_at).getTime() || 0;
      const timeB = new Date(b.created_at).getTime() || 0;
      return timeB - timeA;
    });
  }, [orders, activeTab, dateFilter]);

  // Parse items from JSON safely
  const parseItems = (itemsJson?: string | null): OrderLineItem[] => {
    if (!itemsJson) return [];
    try {
      const parsed = JSON.parse(itemsJson);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  // Table Columns Definition
  const columns: ColumnDef<OrderItem>[] = useMemo(
    () => [
      {
        key: "order_number",
        header: "Order & Reference",
        sortable: true,
        cell: (o) => (
          <div
            onClick={() => setSelectedOrder(o)}
            className="cursor-pointer group py-0.5"
            title="Click to view full order drawer"
          >
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-bold text-navy-950 text-xs group-hover:text-brass-700 group-hover:underline">
                {o.order_number || o.id}
              </span>
              <Eye className="w-3 h-3 text-navy-400 group-hover:text-brass-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-navy-500 font-mono" suppressHydrationWarning>
                {new Date(o.created_at).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-sand-200 text-navy-700 uppercase">
                {o.id.startsWith("ord_manual") ? "Concierge" : "Online"}
              </span>
            </div>
          </div>
        ),
      },
      {
        key: "customer_name",
        header: "Customer & Postcode",
        sortable: true,
        cell: (o) => (
          <div
            onClick={() => setSelectedOrder(o)}
            className="cursor-pointer group"
          >
            <p className="font-semibold text-navy-950 text-xs group-hover:text-brass-700">
              {o.customer_name}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="font-mono text-[10px] font-bold text-brass-800 bg-sand-200/70 border border-sand-300 px-1.5 py-0.2 rounded">
                {o.postcode || "UK Mainland"}
              </span>
              <span className="text-[10px] text-navy-500 truncate max-w-[130px]">
                {o.customer_email}
              </span>
            </div>
          </div>
        ),
      },
      {
        key: "items_preview",
        header: "Furniture Pieces",
        cell: (o) => {
          const items = parseItems(o.items_json);
          const firstItem = items[0];
          return (
            <div
              onClick={() => setSelectedOrder(o)}
              className="flex items-center gap-2 cursor-pointer group"
            >
              {firstItem?.thumbnailUrl ? (
                <img
                  src={firstItem.thumbnailUrl}
                  alt={firstItem.title}
                  className="w-8 h-8 rounded-lg object-cover border border-sand-300 shadow-2xs group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-sand-200 border border-sand-300 flex items-center justify-center text-navy-600">
                  <Box className="w-4 h-4" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-medium text-navy-900 truncate max-w-[160px]">
                  {firstItem?.title || "Bespoke Living Room Piece"}
                </p>
                <span className="text-[10px] text-navy-500 block">
                  {items.length > 1 ? `+${items.length - 1} more item(s)` : "1 piece"}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        key: "delivery_tier",
        header: "Delivery Tier",
        sortable: true,
        cell: (o) => (
          <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border ${
            o.delivery_tier === "two_man_white_glove"
              ? "bg-sand-200/80 text-navy-950 border-sand-300"
              : "bg-sand-100 text-navy-800 border-sand-200"
          }`}>
            <Truck className="w-3.5 h-3.5 text-brass-700" />
            {o.delivery_tier === "two_man_white_glove" ? "2-Man White Glove" : o.delivery_tier === "pallet" ? "Pallet Freight" : "Standard Delivery"}
          </span>
        ),
      },
      {
        key: "total_pennies",
        header: "Gross Total (Inc VAT)",
        sortable: true,
        cell: (o) => {
          const gross = o.total_pennies || 0;
          const vat = o.vat_pennies || Math.round(gross - gross / 1.2);
          const net = gross - vat;
          return (
            <div>
              <span className="font-bold text-navy-950 text-sm font-display block">
                {formatGBP(gross)}
              </span>
              <span className="text-[10px] text-navy-500 block font-mono">
                Net: {formatGBP(net)}
              </span>
            </div>
          );
        },
      },
      {
        key: "carrier_tracking",
        header: "Carrier & Manifest",
        cell: (o) => (
          <div>
            <p className="text-xs font-semibold text-navy-900 truncate max-w-[150px]">
              {o.carrier || (o.delivery_tier === "two_man_white_glove" ? "SAN 2-Man Fleet" : o.delivery_tier === "pallet" ? "Palletways UK" : "SAN Delivery Fleet")}
            </p>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="font-mono text-[10px] font-bold text-brass-800 bg-brass-100/70 border border-brass-200 px-1.5 py-0.2 rounded truncate max-w-[120px]">
                {o.tracking_number || "Unassigned"}
              </span>
              {o.tracking_number && (
                <button
                  type="button"
                  onClick={() => handleCopyTracking(o.tracking_number!)}
                  className="p-0.5 rounded text-navy-400 hover:text-navy-950 cursor-pointer"
                  title="Copy tracking number"
                >
                  <Copy className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        ),
      },
      {
        key: "status",
        header: "Fulfillment Status",
        sortable: true,
        cell: (o) => {
          if (o.status === "cancelled" || o.fulfillment_status === "cancelled") {
            return (
              <div className="space-y-0.5">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-rose-800 bg-rose-100 border border-rose-300 px-2.5 py-0.5 rounded-full shadow-2xs">
                  <Ban className="w-3 h-3 text-rose-600" />
                  Cancelled
                </span>
                <span
                  className="text-[10px] text-rose-800 font-semibold block max-w-[150px] truncate"
                  title={o.cancellation_reason ? `${o.cancelled_by || "Customer"}: ${o.cancellation_reason}` : (o.cancelled_by || "Customer")}
                >
                  By: {o.cancelled_by || "Customer"}
                </span>
              </div>
            );
          }
          if (o.status === "delivered") {
            return (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 rounded-full shadow-2xs">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Delivered
              </span>
            );
          }
          if (o.status === "in_transit" || o.status === "in_transit_two_man" || o.status === "dispatched") {
            return (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-navy-950 bg-brass-200 border border-brass-300 px-2.5 py-0.5 rounded-full shadow-2xs">
                <Truck className="w-3 h-3 text-brass-800" />
                In Transit
              </span>
            );
          }
          if (o.status === "po_dispatched") {
            return (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-800 bg-sky-100 border border-sky-200 px-2.5 py-0.5 rounded-full shadow-2xs">
                <Clock className="w-3 h-3 text-sky-600" />
                Processing
              </span>
            );
          }
          return (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100 border border-amber-200 px-2.5 py-0.5 rounded-full shadow-2xs">
              Order Confirmed (Awaiting Dispatch)
            </span>
          );
        },
      },
      {
        key: "actions",
        header: "Actions",
        cell: (o) => {
          const isCancelled = o.status === "cancelled" || o.fulfillment_status === "cancelled";
          return (
            <div className="flex items-center justify-end gap-1">
              <button
                type="button"
                onClick={() => setSelectedOrder(o)}
                className="p-1.5 rounded-lg border border-sand-300 text-navy-800 hover:bg-sand-200 transition-colors cursor-pointer"
                title="Inspect Order Details & Timeline"
              >
                <Eye className="w-3.5 h-3.5 text-navy-700" />
              </button>
              {isCancelled ? (
                <span className="px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-semibold text-xs flex items-center gap-1 select-none">
                  <Ban className="w-3 h-3 text-rose-500" />
                  <span>Cancelled</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => openDispatchModal(o)}
                  className="px-2.5 py-1 rounded-lg bg-navy-950 hover:bg-navy-900 text-sand-50 font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                  title="Assign Carrier & Tracking"
                >
                  <Truck className="w-3 h-3 text-brass-400" />
                  <span>Dispatch</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setInvoiceOrder(o)}
                className="p-1.5 rounded-lg border border-sand-300 text-navy-700 hover:bg-sand-200 transition-colors cursor-pointer"
                title="View Order Receipt"
              >
                <FileText className="w-3.5 h-3.5 text-brass-700" />
              </button>
              <button
                type="button"
                onClick={() => setManifestOrder(o)}
                className="p-1.5 rounded-lg border border-sand-300 text-navy-700 hover:bg-sand-200 transition-colors cursor-pointer"
                title="Print Carrier Manifest / Delivery Slip"
              >
                <Printer className="w-3.5 h-3.5 text-navy-600" />
              </button>
              {!isCancelled && o.status !== "delivered" && (
                <button
                  type="button"
                  onClick={() => setCancellingOrder(o)}
                  className="p-1.5 rounded-lg border border-amber-300 text-amber-700 hover:bg-amber-100 hover:text-amber-900 transition-colors cursor-pointer"
                  title="Cancel Customer Order"
                >
                  <Ban className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setDeletingOrder(o)}
                className="p-1.5 rounded-lg border border-rose-300 text-rose-600 hover:bg-rose-100 hover:text-rose-800 transition-colors cursor-pointer"
                title="Permanently Delete Order Record"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        },
      },
    ],
    []
  );

  return (
    <>
      <div className={`space-y-6 antialiased pb-12 ${(manifestOrder || invoiceOrder) ? "print:hidden" : ""}`} suppressHydrationWarning>
      {/* Toast Feedback */}
      {successMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#00072D] text-sand-50 px-4 py-3 rounded-xl shadow-2xl border border-navy-700 flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-brass-400 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-navy-500 mb-1">
            <Link href="/admin" className="hover:text-navy-950 transition-colors">
              Operations Suite
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="font-semibold text-navy-900">Orders &amp; Logistics OMS</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-navy-950 flex items-center gap-2.5">
            <ShoppingBag className="w-6 h-6 text-brass-600" />
            <span>Customer Orders Queue &amp; Carrier Logistics</span>
          </h1>
          <p className="text-xs text-navy-600 mt-1">
            Direct EDI supplier dispatch, 2-hour delivery window booking, multi-zone surcharge management, and itemised billing receipts.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => fetchOrders(false)}
            disabled={refreshing}
            className="p-2.5 rounded-xl border border-sand-300 bg-white hover:bg-sand-100 text-navy-800 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs"
            title="Refresh order feed"
          >
            <RotateCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-brass-600" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <a
            href={apiUrl("/api/admin/accounting/export.csv")}
            download="san_furniture_accounting.csv"
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-sand-300 bg-white hover:bg-sand-100 text-navy-950 font-bold text-xs shadow-2xs transition-all"
          >
            <Download className="w-3.5 h-3.5 text-navy-700" />
            <span>Export CSV</span>
          </a>

          <button
            type="button"
            onClick={() => setIsManualOrderModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-navy-950 hover:bg-navy-900 text-sand-50 font-bold text-xs shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-brass-400" />
            <span>Create Manual Order</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid (5 Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-sand-300 shadow-sm">
          <span className="text-[11px] font-semibold text-navy-500 uppercase tracking-wider block">
            Total Orders
          </span>
          <p className="text-2xl font-display font-bold text-navy-950 mt-1">{orders.length}</p>
          <span className="text-[10px] text-navy-400 block mt-0.5">All customer orders</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-sand-300 shadow-sm">
          <span className="text-[11px] font-semibold text-navy-500 uppercase tracking-wider block">
            Gross Revenue
          </span>
          <p className="text-2xl font-display font-bold text-emerald-700 mt-1">
            {formatGBP(totalRevenuePennies)}
          </p>
          <span className="text-[10px] text-navy-400 block mt-0.5">Inc. 20% UK VAT</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-sand-300 shadow-sm">
          <span className="text-[11px] font-semibold text-navy-500 uppercase tracking-wider block">
            Awaiting Dispatch
          </span>
          <p className="text-2xl font-display font-bold text-amber-700 mt-1 flex items-center gap-2">
            <span>{pendingDispatchCount}</span>
            {pendingDispatchCount > 0 && <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />}
          </p>
          <span className="text-[10px] text-amber-800 font-medium block mt-0.5">PO transmitted</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-sand-300 shadow-sm">
          <span className="text-[11px] font-semibold text-navy-500 uppercase tracking-wider block">
            In-Transit
          </span>
          <p className="text-2xl font-display font-bold text-brass-700 mt-1">{inTransitCount}</p>
          <span className="text-[10px] text-navy-400 block mt-0.5">On road with carrier</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-sand-300 shadow-sm col-span-2 sm:col-span-1">
          <span className="text-[11px] font-semibold text-navy-500 uppercase tracking-wider block">
            Delivered &amp; Complete
          </span>
          <p className="text-2xl font-display font-bold text-forest-700 mt-1">{deliveredCount}</p>
          <span className="text-[10px] text-forest-700 font-medium block mt-0.5">POD confirmed</span>
        </div>
      </div>

      {/* Status Filter Tab Pills & Quick Date Range */}
      <div className="p-3 bg-white border border-sand-300 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 md:pb-0">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "all"
                ? "bg-navy-950 text-sand-50 font-bold shadow-xs"
                : "bg-sand-100 text-navy-700 hover:bg-sand-200 border border-sand-200"
            }`}
          >
            <span>All Orders</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              activeTab === "all" ? "bg-brass-500 text-navy-950 font-bold" : "bg-sand-200 text-navy-800"
            }`}>
              {orders.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("awaiting_dispatch")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "awaiting_dispatch"
                ? "bg-navy-950 text-sand-50 font-bold shadow-xs"
                : "bg-sand-100 text-navy-700 hover:bg-sand-200 border border-sand-200"
            }`}
          >
            <Clock className="w-3 h-3 text-amber-600" />
            <span>Awaiting Dispatch</span>
            <span className="text-[10px] text-amber-800 font-bold">({pendingDispatchCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("in_transit")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "in_transit"
                ? "bg-navy-950 text-sand-50 font-bold shadow-xs"
                : "bg-sand-100 text-navy-700 hover:bg-sand-200 border border-sand-200"
            }`}
          >
            <Truck className="w-3 h-3 text-brass-600" />
            <span>In Transit</span>
            <span className="text-[10px] text-brass-800 font-bold">({inTransitCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("delivered")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "delivered"
                ? "bg-navy-950 text-sand-50 font-bold shadow-xs"
                : "bg-sand-100 text-navy-700 hover:bg-sand-200 border border-sand-200"
            }`}
          >
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Delivered</span>
            <span className="text-[10px] text-emerald-800 font-bold">({deliveredCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("cancelled")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "cancelled"
                ? "bg-rose-950 text-rose-50 font-bold shadow-xs"
                : "bg-sand-100 text-rose-800 hover:bg-rose-50 border border-sand-200"
            }`}
          >
            <Ban className="w-3 h-3 text-rose-600" />
            <span>Cancelled</span>
            <span className={`text-[10px] font-bold ${activeTab === "cancelled" ? "text-rose-200" : "text-rose-700"}`}>
              ({cancelledCount})
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("white_glove")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "white_glove"
                ? "bg-navy-950 text-sand-50 font-bold shadow-xs"
                : "bg-sand-100 text-navy-700 hover:bg-sand-200 border border-sand-200"
            }`}
          >
            <span>White Glove ({whiteGloveCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("pallet")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "pallet"
                ? "bg-navy-950 text-sand-50 font-bold shadow-xs"
                : "bg-sand-100 text-navy-700 hover:bg-sand-200 border border-sand-200"
            }`}
          >
            <span>Pallet Freight ({palletCount})</span>
          </button>
        </div>

        {/* Date Filter Quick Selector */}
        <div className="flex items-center gap-2 self-end md:self-auto text-xs text-navy-600">
          <Calendar className="w-3.5 h-3.5 text-navy-400" />
          <span className="text-[11px] font-semibold">Range:</span>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as any)}
            className="px-2.5 py-1 bg-sand-100 border border-sand-300 rounded-lg text-xs font-semibold text-navy-900 focus:outline-none focus:ring-1 focus:ring-brass-500"
          >
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
        </div>
      </div>

      {/* Bulk Action Bar (When rows are checked) */}
      {selectedOrderIds.length > 0 && (
        <div className="p-3 bg-navy-950 text-sand-50 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-lg animate-in fade-in duration-150">
          <div className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-brass-400" />
            <span className="font-bold">{selectedOrderIds.length} orders selected</span>
            <button
              type="button"
              onClick={() => setSelectedOrderIds([])}
              className="text-[11px] text-sand-300 hover:text-white underline ml-2 cursor-pointer"
            >
              Clear selection
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isBulkUpdating}
              onClick={() => handleBulkStatusChange("in_transit")}
              className="px-3 py-1.5 rounded-lg bg-brass-500 hover:bg-brass-400 text-navy-950 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Truck className="w-3.5 h-3.5 text-navy-950" />
              <span>Mark In-Transit ({selectedOrderIds.length})</span>
            </button>
            <button
              type="button"
              disabled={isBulkUpdating}
              onClick={() => handleBulkStatusChange("delivered")}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Mark Delivered ({selectedOrderIds.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Advanced DataTable */}
      <DataTable
        data={filteredOrders}
        columns={columns}
        keyExtractor={(o) => o.id}
        title="Customer Orders Queue"
        subtitle="Live order feed synced directly from MySQL orders and order_po_dispatches tables"
        searchPlaceholder="Search order ID, customer name, postcode, carrier..."
        loading={loading}
        onRefresh={() => fetchOrders(false)}
        exportFileName="san_furniture_orders_dispatch"
      />
      </div>

      {/* ========================================================================= */}
      {/* 1. SLIDE-OVER DRILL-DOWN ORDER DETAILS DRAWER */}
      {/* ========================================================================= */}
      {selectedOrder && (
        <div className={`fixed inset-0 z-50 flex justify-end bg-navy-950/60 backdrop-blur-xs animate-in fade-in duration-200 ${(manifestOrder || invoiceOrder) ? "print:hidden" : ""}`}>
          <div className="bg-sand-50 border-l border-sand-300 w-full max-w-2xl h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-250">
            {/* Drawer Header */}
            <div className="p-6 bg-white border-b border-sand-200 flex items-start justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="font-mono font-bold text-lg text-navy-950">
                    {selectedOrder.order_number || selectedOrder.id}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-sand-200 text-navy-800">
                    {selectedOrder.delivery_tier === "two_man_white_glove" ? "2-Man White Glove" : selectedOrder.delivery_tier === "pallet" ? "Pallet Freight" : "Standard Delivery"}
                  </span>
                  {selectedOrder.status === "cancelled" ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-rose-100 text-rose-800 border border-rose-200">
                      Cancelled (Refund Pending)
                    </span>
                  ) : selectedOrder.status === "delivered" ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Delivered
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-amber-100 text-amber-800 border border-amber-200">
                      Awaiting Dispatch
                    </span>
                  )}
                </div>
                <p className="text-xs text-navy-600">
                  Ordered on {new Date(selectedOrder.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })} &bull; Customer: <strong className="text-navy-900">{selectedOrder.customer_name}</strong>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="p-2 rounded-xl text-navy-400 hover:text-navy-950 hover:bg-sand-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-navy-800">
              {/* Cancellation & Refund Audit Card */}
              {(selectedOrder.status === "cancelled" || selectedOrder.fulfillment_status === "cancelled") && (
                <div className="p-4 rounded-2xl bg-rose-50/80 border border-rose-200 shadow-2xs space-y-2.5">
                  <div className="flex items-center justify-between pb-2 border-b border-rose-200">
                    <span className="font-bold text-rose-950 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <Ban className="w-4 h-4 text-rose-600" />
                      Cancellation &amp; Refund Audit
                    </span>
                    <span className="font-mono text-[10px] font-bold text-rose-700 bg-rose-100/90 border border-rose-300 px-2 py-0.5 rounded-md">
                      Refund Scheduled
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-navy-500 text-[10px] uppercase font-bold tracking-wider block">Cancelled By</span>
                      <strong className="text-navy-950 font-semibold block text-xs mt-0.5">
                        {selectedOrder.cancelled_by || "Customer"}
                      </strong>
                    </div>
                    <div>
                      <span className="text-navy-500 text-[10px] uppercase font-bold tracking-wider block">Cancelled At</span>
                      <strong className="text-navy-950 font-semibold block text-xs mt-0.5">
                        {selectedOrder.cancelled_at
                          ? new Date(selectedOrder.cancelled_at).toLocaleString("en-GB", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Recorded"}
                      </strong>
                    </div>
                  </div>
                  <div className="pt-1">
                    <span className="text-navy-500 text-[10px] uppercase font-bold tracking-wider block mb-1">
                      Reason Recorded
                    </span>
                    <p className="text-xs font-medium text-rose-950 bg-white/90 p-2.5 rounded-xl border border-rose-200/80 leading-relaxed shadow-2xs">
                      &ldquo;{selectedOrder.cancellation_reason || "Customer requested cancellation before courier dispatch"}&rdquo;
                    </p>
                  </div>
                </div>
              )}

              {/* Stepper Milestone Timeline */}
              <div className="p-4 rounded-2xl bg-white border border-sand-300 shadow-2xs space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-navy-500 block">
                  Logistics &amp; Delivery Progress Stepper
                </span>

                <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
                  <div className="space-y-1">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto font-bold border border-emerald-300">
                      ✓
                    </div>
                    <span className="font-semibold block text-navy-900">Order Confirmed</span>
                  </div>

                  <div className="space-y-1">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center mx-auto font-bold border ${
                      selectedOrder.status === "po_dispatched" || selectedOrder.status === "dispatched" || selectedOrder.status === "in_transit" || selectedOrder.status === "in_transit_two_man" || selectedOrder.status === "delivered"
                        ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                        : "bg-sand-200 text-navy-500 border-sand-300"
                    }`}>
                      {selectedOrder.status === "po_dispatched" || selectedOrder.status === "dispatched" || selectedOrder.status === "in_transit" || selectedOrder.status === "in_transit_two_man" || selectedOrder.status === "delivered" ? "✓" : "2"}
                    </div>
                    <span className="font-semibold block text-navy-900">Processing</span>
                  </div>

                  <div className="space-y-1">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center mx-auto font-bold border ${
                      selectedOrder.status === "dispatched" || selectedOrder.status === "in_transit" || selectedOrder.status === "in_transit_two_man" || selectedOrder.status === "delivered"
                        ? "bg-brass-500 text-navy-950 border-brass-600"
                        : "bg-sand-200 text-navy-500 border-sand-300"
                    }`}>
                      {selectedOrder.status === "dispatched" || selectedOrder.status === "in_transit" || selectedOrder.status === "in_transit_two_man" || selectedOrder.status === "delivered" ? "✓" : "3"}
                    </div>
                    <span className="font-semibold block text-navy-900">Dispatched</span>
                  </div>

                  <div className="space-y-1">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center mx-auto font-bold border ${
                      selectedOrder.status === "delivered"
                        ? "bg-emerald-600 text-white border-emerald-700"
                        : "bg-sand-200 text-navy-500 border-sand-300"
                    }`}>
                      {selectedOrder.status === "delivered" ? "✓" : "4"}
                    </div>
                    <span className="font-semibold block text-navy-900">Delivered</span>
                  </div>
                </div>
              </div>

              {/* Ordered Items List */}
              <div className="p-4 rounded-2xl bg-white border border-sand-300 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-sand-200 pb-2">
                  <h4 className="font-bold text-navy-950 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Box className="w-4 h-4 text-brass-700" />
                    <span>Ordered Furniture Pieces</span>
                  </h4>
                  <span className="text-[10px] text-navy-500">
                    UK Quality Checked Furniture
                  </span>
                </div>

                <div className="space-y-3">
                  {parseItems(selectedOrder.items_json).map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-sand-50 border border-sand-200 flex items-start gap-3"
                    >
                      {item.thumbnailUrl ? (
                        <img
                          src={item.thumbnailUrl}
                          alt={item.title}
                          className="w-14 h-14 rounded-lg object-cover border border-sand-300 shadow-xs flex-shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-lg bg-sand-200 flex items-center justify-center text-navy-600 flex-shrink-0">
                          <Box className="w-6 h-6" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <h5 className="font-bold text-navy-950 text-xs truncate">{item.title}</h5>
                        <p className="text-[11px] text-navy-600 mt-0.5">
                          SKU: <span className="font-mono">{item.sku || "SAN-PIECE"}</span> &bull; Finish: {item.finish || "Standard UK Specification"}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-bold text-forest-800 bg-forest-100 border border-forest-200 px-1.5 py-0.2 rounded flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-forest-600" />
                            UK Quality Checked
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-bold text-navy-950 text-xs block">
                          {formatGBP(item.pricePennies * item.quantity)}
                        </span>
                        <span className="text-[10px] text-navy-500 block">
                          Qty: {item.quantity} &times; {formatGBP(item.pricePennies)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Destination & Customer Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white border border-sand-300 shadow-2xs space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-navy-500 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-navy-600" />
                    Customer Contact
                  </span>
                  <p className="font-bold text-navy-950 text-sm">{selectedOrder.customer_name}</p>
                  <p className="text-navy-600 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-navy-400" />
                    <a href={`mailto:${selectedOrder.customer_email}`} className="hover:underline truncate">
                      {selectedOrder.customer_email}
                    </a>
                  </p>
                  <p className="text-navy-600 flex items-center gap-1.5 font-mono">
                    <Phone className="w-3.5 h-3.5 text-navy-400" />
                    <a href={`tel:${selectedOrder.customer_phone || "+442079460912"}`} className="hover:underline">
                      {selectedOrder.customer_phone || "+44 (0) 20 7946 0912"}
                    </a>
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-sand-300 shadow-2xs space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-navy-500 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-navy-600" />
                    UK Delivery Destination
                  </span>
                  <p className="font-semibold text-navy-950">
                    {selectedOrder.shipping_address || "14 Kensington Palace Gardens, London"}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono font-bold text-xs text-brass-800 bg-sand-200 px-2 py-0.5 rounded">
                      {selectedOrder.postcode || "SW1A 1AA"}
                    </span>
                    <span className="text-[11px] text-navy-600">
                      Zone: {selectedOrder.shipping_zone || "Mainland UK"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Carrier & Manifest Card */}
              <div className="p-4 rounded-2xl bg-white border border-sand-300 shadow-2xs space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-navy-500 block">
                  Carrier Dispatch &amp; Tracking Manifest
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-[10px] text-navy-500 block">Carrier Partner:</span>
                    <strong className="text-navy-950 block mt-0.5">
                      {selectedOrder.carrier || (selectedOrder.delivery_tier === "two_man_white_glove" ? "SAN 2-Man Dedicated Fleet" : selectedOrder.delivery_tier === "pallet" ? "Palletways UK Freight" : "SAN Dedicated Delivery Fleet")}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-navy-500 block">Consignment Tracking:</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <strong className="font-mono text-brass-800 text-xs">
                        {selectedOrder.tracking_number || "Unassigned"}
                      </strong>
                      {selectedOrder.tracking_number && (
                        <button
                          type="button"
                          onClick={() => handleCopyTracking(selectedOrder.tracking_number!)}
                          className="text-navy-400 hover:text-navy-950"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-navy-500 block">Supplier PO:</span>
                    <strong className="font-mono text-navy-950 text-xs block mt-0.5">
                      {selectedOrder.po_number || "PO-SAN-TRANSMITTED"}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Financial & VAT Breakdown */}
              <div className="p-4 rounded-2xl bg-white border border-sand-300 shadow-2xs space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-navy-500 block">
                  Itemised Financial Breakdown
                </span>
                {(() => {
                  const gross = selectedOrder.total_pennies || 0;
                  const vat = selectedOrder.vat_pennies || Math.round(gross - gross / 1.2);
                  const net = gross - vat;
                  return (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-navy-600">
                        <span>Net Goods Subtotal:</span>
                        <span className="font-mono">{formatGBP(net)}</span>
                      </div>
                      <div className="flex justify-between text-navy-600">
                        <span>UK Delivery Logistics:</span>
                        <span className="font-mono text-forest-700 font-semibold">
                          {selectedOrder.shipping_pennies ? formatGBP(selectedOrder.shipping_pennies) : "FREE"}
                        </span>
                      </div>
                      <div className="flex justify-between text-navy-600">
                        <span>Standard 20% UK VAT:</span>
                        <span className="font-mono">{formatGBP(vat)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-bold text-navy-950 pt-2 border-t border-sand-200">
                        <span>Total Paid (GBP):</span>
                        <span className="font-display text-base text-brass-800">{formatGBP(gross)}</span>
                      </div>
                      <div className="text-[10px] text-navy-400 text-right pt-0.5">
                        Payment Instrument: {selectedOrder.payment_method || "Stripe UK 128-bit SSL"}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Internal Staff Notes */}
              <div className="p-4 rounded-2xl bg-white border border-sand-300 shadow-2xs space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-navy-500 block">
                  Operations Staff Notes &amp; Handover Instructions
                </span>

                {(orderNotesList[selectedOrder.id] || []).length > 0 && (
                  <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                    {(orderNotesList[selectedOrder.id] || []).map((note, idx) => (
                      <div key={idx} className="p-2 rounded-lg bg-sand-100/70 border border-sand-200 text-xs">
                        <div className="flex justify-between text-[10px] text-navy-500 mb-0.5">
                          <span>Staff Note</span>
                          <span>{note.date}</span>
                        </div>
                        <p className="text-navy-800">{note.text}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={internalNoteText}
                    onChange={(e) => setInternalNoteText(e.target.value)}
                    placeholder="e.g. Access confirmed for spiral staircase..."
                    className="flex-1 px-3 py-1.5 text-xs bg-sand-50 border border-sand-300 rounded-lg text-navy-950 focus:outline-none focus:ring-1 focus:ring-brass-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddInternalNote(selectedOrder.id)}
                    className="px-3 py-1.5 rounded-lg bg-navy-950 hover:bg-navy-900 text-sand-50 text-xs font-semibold cursor-pointer"
                  >
                    Add Note
                  </button>
                </div>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 bg-white border-t border-sand-200 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                {selectedOrder.status !== "cancelled" && selectedOrder.fulfillment_status !== "cancelled" && (
                  <button
                    type="button"
                    onClick={() => openDispatchModal(selectedOrder)}
                    className="px-3 py-2 rounded-xl bg-navy-950 hover:bg-navy-900 text-sand-50 font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Truck className="w-3.5 h-3.5 text-brass-400" />
                    <span>Update Dispatch</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setManifestOrder(selectedOrder)}
                  className="px-3 py-2 rounded-xl border border-sand-300 bg-sand-100 hover:bg-sand-200 text-navy-900 font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-navy-700" />
                  <span>Carrier Manifest</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInvoiceOrder(selectedOrder)}
                  className="px-3 py-2 rounded-xl border border-sand-300 bg-white hover:bg-sand-100 text-navy-900 font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-brass-700" />
                  <span>VAT Invoice</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {selectedOrder.status !== "delivered" && selectedOrder.status !== "cancelled" && selectedOrder.fulfillment_status !== "cancelled" && (
                  <button
                    type="button"
                    onClick={() => handleQuickStatusChange(selectedOrder.id, "delivered")}
                    className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1 cursor-pointer shadow-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mark Delivered</span>
                  </button>
                )}
                {selectedOrder.status !== "cancelled" && selectedOrder.fulfillment_status !== "cancelled" && (
                  <button
                    type="button"
                    onClick={() => setCancellingOrder(selectedOrder)}
                    className="px-3 py-2 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                  >
                    <Ban className="w-3.5 h-3.5 text-amber-600" />
                    <span>Cancel Order</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setDeletingOrder(selectedOrder)}
                  className="px-3 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. CARRIER DISPATCH & TRACKING MODAL */}
      {/* ========================================================================= */}
      {dispatchOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-navy-950/70 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150 print:hidden m-0">
          <div className="bg-sand-50 border border-sand-300 rounded-2xl max-w-xl w-full p-6 shadow-2xl my-auto">
            <div className="flex items-center justify-between pb-4 border-b border-sand-200">
              <div>
                <h3 className="font-display text-lg font-bold text-navy-950">
                  {dispatchOrder.delivery_tier === "two_man_white_glove"
                    ? "Assign 2-Man White Glove Dispatch"
                    : dispatchOrder.delivery_tier === "pallet"
                    ? "Assign Pallet Freight Dispatch"
                    : "Assign Carrier Dispatch & Tracking"}
                </h3>
                <p className="text-xs text-navy-600">
                  Order: <span className="font-mono font-bold text-navy-900">{dispatchOrder.order_number || dispatchOrder.id}</span> &bull; Customer: {dispatchOrder.customer_name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDispatchOrder(null)}
                className="p-1 rounded-lg text-navy-400 hover:text-navy-700 hover:bg-sand-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDispatch} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-navy-900 mb-1">
                  Carrier / Delivery Partner
                </label>
                <select
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  className="w-full px-3 py-2 bg-sand-100 border border-sand-300 rounded-lg text-xs text-navy-950 focus:outline-none focus:border-brass-500"
                >
                  <option value="SAN Dedicated Delivery Fleet">SAN Dedicated Delivery Fleet (UK Hub)</option>
                  <option value="Palletways UK Freight">Palletways UK Freight</option>
                  <option value="Amos Mann Logistics">Amos Mann Logistics</option>
                  <option value="BJS Home Delivery">BJS Home Delivery (Specialist 2-Man White Glove)</option>
                  <option value="ArrowXL 2-Man White Glove">ArrowXL 2-Man White Glove</option>
                  <option value="Furdeco Delivery">Furdeco (Room of Choice Delivery)</option>
                  <option value="DPD Heavy Freight">DPD Heavy Freight / Express</option>
                  <option value="DX Freight">DX Freight &amp; Logistics</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-navy-900">
                    Carrier Consignment / Tracking Code
                  </label>
                  <button
                    type="button"
                    onClick={() => setTrackingCode(`TRX-SAN-${Date.now().toString().slice(-6)}`)}
                    className="text-[11px] text-brass-700 hover:underline font-semibold cursor-pointer"
                  >
                    Auto-Generate Tracking
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={trackingCode}
                  onChange={(e) => setTrackingCode(e.target.value)}
                  placeholder="e.g. TRX-SAN-446575"
                  className="w-full px-3 py-2 bg-sand-100 border border-sand-300 rounded-lg text-xs font-mono font-bold text-navy-950 focus:outline-none focus:border-brass-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-navy-900 mb-1">
                    Scheduled Delivery Date
                  </label>
                  <input
                    type="date"
                    required
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="w-full px-3 py-2 bg-sand-100 border border-sand-300 rounded-lg text-xs font-mono text-navy-950 focus:outline-none focus:border-brass-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-navy-900 mb-1">
                    Estimated Delivery Window
                  </label>
                  <select
                    value={deliverySlot}
                    onChange={(e) => setDeliverySlot(e.target.value)}
                    className="w-full px-3 py-2 bg-sand-100 border border-sand-300 rounded-lg text-xs text-navy-950 focus:outline-none focus:border-brass-500"
                  >
                    <option value="08:00 - 10:00 BST">08:00 - 10:00 BST (Early Morning)</option>
                    <option value="10:00 - 12:00 BST">10:00 - 12:00 BST (Mid-Morning)</option>
                    <option value="12:00 - 14:00 BST">12:00 - 14:00 BST (Midday)</option>
                    <option value="14:00 - 16:00 BST">14:00 - 16:00 BST (Afternoon)</option>
                    <option value="16:00 - 18:00 BST">16:00 - 18:00 BST (Late Afternoon)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy-900 mb-1">
                  Delivery Fulfillment Status
                </label>
                <select
                  value={statusVal}
                  onChange={(e) => setStatusVal(e.target.value)}
                  className="w-full px-3 py-2 bg-sand-100 border border-sand-300 rounded-lg text-xs font-bold text-navy-950 focus:outline-none focus:border-brass-500"
                >
                  <option value="in_transit">Dispatched (In Transit / On the Way)</option>
                  <option value="po_dispatched">Processing (Preparing at Supplier / Hub)</option>
                  <option value="unfulfilled">Order Confirmed (Awaiting Dispatch)</option>
                  <option value="delivered">Delivered (Completed)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy-900 mb-1">
                  Delivery Instructions &amp; Access Notes
                </label>
                <textarea
                  rows={3}
                  value={roomNotes}
                  onChange={(e) => setRoomNotes(e.target.value)}
                  placeholder="e.g. Ground floor access, gate code #1234, call customer 30 mins prior"
                  className="w-full px-3 py-2 bg-sand-100 border border-sand-300 rounded-lg text-xs text-navy-950 focus:outline-none focus:border-brass-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-sand-200">
                <button
                  type="button"
                  onClick={() => setDispatchOrder(null)}
                  className="px-4 py-2 rounded-lg border border-sand-300 bg-sand-100 hover:bg-sand-200 font-semibold text-navy-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingDispatch}
                  className="px-5 py-2 rounded-lg bg-navy-950 hover:bg-navy-900 text-sand-50 font-bold shadow-md transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Truck className="w-4 h-4 text-brass-400" />
                  <span>{isSubmittingDispatch ? "Saving Dispatch..." : "Confirm Dispatch"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. CREATE MANUAL CONCIERGE ORDER MODAL */}
      {/* ========================================================================= */}
      {isManualOrderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-navy-950/70 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150 print:hidden m-0">
          <div className="bg-white border border-sand-300 rounded-2xl max-w-xl w-full p-6 shadow-2xl my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-sand-200">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-brass-600" />
                <h3 className="font-display text-lg font-bold text-navy-950">
                  Create Manual / Concierge Phone Order
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsManualOrderModalOpen(false)}
                className="p-1 rounded-lg text-navy-400 hover:text-navy-700 hover:bg-sand-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateManualOrder} className="space-y-3.5 pt-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-navy-900 mb-1">Customer Full Name</label>
                  <input
                    type="text"
                    required
                    value={manualForm.customer_name}
                    onChange={(e) => setManualForm({ ...manualForm, customer_name: e.target.value })}
                    placeholder="e.g. Charlotte Bronte"
                    className="w-full px-3 py-2 bg-sand-50 border border-sand-300 rounded-lg text-navy-950 focus:outline-none focus:ring-1 focus:ring-brass-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-navy-900 mb-1">Customer Email</label>
                  <input
                    type="email"
                    required
                    value={manualForm.customer_email}
                    onChange={(e) => setManualForm({ ...manualForm, customer_email: e.target.value })}
                    placeholder="charlotte@example.co.uk"
                    className="w-full px-3 py-2 bg-sand-50 border border-sand-300 rounded-lg text-navy-950 focus:outline-none focus:ring-1 focus:ring-brass-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-navy-900 mb-1">Customer Phone</label>
                  <input
                    type="text"
                    value={manualForm.customer_phone}
                    onChange={(e) => setManualForm({ ...manualForm, customer_phone: e.target.value })}
                    placeholder="+44 20 7946 0912"
                    className="w-full px-3 py-2 bg-sand-50 border border-sand-300 rounded-lg text-navy-950 focus:outline-none focus:ring-1 focus:ring-brass-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-navy-900 mb-1">UK Delivery Postcode</label>
                  <input
                    type="text"
                    required
                    value={manualForm.postcode}
                    onChange={(e) => setManualForm({ ...manualForm, postcode: e.target.value.toUpperCase() })}
                    placeholder="SW1A 1AA"
                    className="w-full px-3 py-2 bg-sand-50 border border-sand-300 rounded-lg font-mono font-bold text-navy-950 focus:outline-none focus:ring-1 focus:ring-brass-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-navy-900 mb-1">Full Delivery Address</label>
                <input
                  type="text"
                  required
                  value={manualForm.shipping_address}
                  onChange={(e) => setManualForm({ ...manualForm, shipping_address: e.target.value })}
                  placeholder="e.g. 10 Downing Street, Westminster, London"
                  className="w-full px-3 py-2 bg-sand-50 border border-sand-300 rounded-lg text-navy-950 focus:outline-none focus:ring-1 focus:ring-brass-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block font-semibold text-navy-900 mb-1">Select Furniture Piece</label>
                  <select
                    value={manualForm.selectedProductId}
                    onChange={(e) => setManualForm({ ...manualForm, selectedProductId: e.target.value })}
                    className="w-full px-3 py-2 bg-sand-50 border border-sand-300 rounded-lg text-navy-950 focus:outline-none focus:ring-1 focus:ring-brass-500"
                  >
                    {catalogProducts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} — {formatGBP(p.price_pennies)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-navy-900 mb-1">Quantity</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={manualForm.quantity}
                    onChange={(e) => setManualForm({ ...manualForm, quantity: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3 py-2 bg-sand-50 border border-sand-300 rounded-lg font-bold text-navy-950 focus:outline-none focus:ring-1 focus:ring-brass-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-navy-900 mb-1">Delivery Tier</label>
                  <select
                    value={manualForm.delivery_tier}
                    onChange={(e) => setManualForm({ ...manualForm, delivery_tier: e.target.value })}
                    className="w-full px-3 py-2 bg-sand-50 border border-sand-300 rounded-lg text-navy-950 focus:outline-none focus:ring-1 focus:ring-brass-500 font-medium"
                  >
                    {dynamicDeliveryOptions.length > 0 ? (
                      dynamicDeliveryOptions.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.name} ({opt.formattedTotal || opt.formattedBaseFee || (opt.baseFeePennies === 0 ? "FREE" : formatGBP(opt.baseFeePennies || 0))})
                        </option>
                      ))
                    ) : (
                      <option value="">No delivery options configured in Logistics</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-navy-900 mb-1">Payment Method</label>
                  <select
                    value={manualForm.payment_method}
                    onChange={(e) => setManualForm({ ...manualForm, payment_method: e.target.value })}
                    className="w-full px-3 py-2 bg-sand-50 border border-sand-300 rounded-lg text-navy-950 focus:outline-none focus:ring-1 focus:ring-brass-500"
                  >
                    <option value="Stripe Manual (Telephone MOTO)">Telephone MOTO (Stripe Vault)</option>
                    <option value="BACS Bank Transfer (Pro-Forma)">BACS Bank Wire / Invoice</option>
                    <option value="Cash on White Glove Delivery">Cash on White Glove Delivery</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-navy-900 mb-1">Special Delivery &amp; Room Instructions</label>
                <textarea
                  rows={2}
                  value={manualForm.notes}
                  onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-sand-50 border border-sand-300 rounded-lg text-navy-950 focus:outline-none focus:ring-1 focus:ring-brass-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-sand-200">
                <button
                  type="button"
                  onClick={() => setIsManualOrderModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-sand-300 font-semibold text-navy-800 hover:bg-sand-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingManualOrder}
                  className="px-5 py-2 rounded-xl bg-navy-950 hover:bg-navy-900 text-sand-50 font-bold flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-4 h-4 text-brass-400" />
                  <span>{isSubmittingManualOrder ? "Creating Order..." : "Create Concierge Order"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. 2-MAN CARRIER PACKING SLIP & ROOM MANIFEST MODAL */}
      {/* ========================================================================= */}
      {manifestOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-navy-950/75 backdrop-blur-sm overflow-y-auto m-0 print:static print:inset-auto print:p-0 print:m-0 print:bg-white print:overflow-visible print:block print:w-full print:h-auto animate-in fade-in">
          <div className="bg-white border border-sand-300 rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl my-auto print:shadow-none print:border-none print:m-0 print:p-0 print:w-full print:max-w-full text-navy-950 print-manifest-sheet">
            {/* Header Actions (hidden on print) */}
            <div className="flex items-center justify-between pb-6 border-b border-sand-200 print:hidden">
              <span className="text-xs font-bold uppercase tracking-wider text-navy-600">
                {manifestOrder.delivery_tier === "two_man_white_glove" ? "2-Man Room of Choice Carrier Manifest & Packing Slip" : "Carrier Delivery Manifest & Packing Slip"}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-navy-950 text-sand-50 hover:bg-navy-900 text-xs font-semibold cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-brass-400" />
                  <span>Print Manifest</span>
                </button>
                <button
                  type="button"
                  onClick={() => setManifestOrder(null)}
                  className="p-1 rounded-lg text-navy-400 hover:text-navy-700 hover:bg-sand-200 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Manifest Sheet */}
            <div className="pt-6 print:pt-0 space-y-6 print:space-y-4">
              <div className="flex items-start justify-between border-b-2 border-navy-950 pb-4 print:pb-2">
                <div>
                  <h2 className="font-display text-2xl font-bold tracking-tight">SAN FURNITURE</h2>
                  <p className="text-xs text-navy-600">
                    {manifestOrder.delivery_tier === "two_man_white_glove" ? "2-Man White Glove Carrier Manifest" : "UK Freight & Carrier Manifest"}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-brass-700">DESTINATION POSTCODE</span>
                  <div className="text-3xl font-display font-bold font-mono text-navy-950 tracking-wider">
                    {manifestOrder.postcode || "SW1A 1AA"}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-white border border-sand-200 text-xs shadow-2xs">
                <div>
                  <strong className="block text-navy-900 uppercase text-[10px] tracking-wider mb-1">
                    Customer Delivery Address
                  </strong>
                  <p className="font-bold text-sm text-navy-950">{manifestOrder.customer_name}</p>
                  <p className="text-navy-700 mt-0.5">{manifestOrder.shipping_address || "14 Kensington Palace Gardens, London"}</p>
                  <p className="font-mono text-navy-800 font-semibold">{manifestOrder.postcode}</p>
                  <p className="text-navy-600 mt-1">Tel: {manifestOrder.customer_phone || "+44 20 7946 0912"}</p>
                </div>

                <div>
                  <strong className="block text-navy-900 uppercase text-[10px] tracking-wider mb-1">
                    Carrier Consignment Details
                  </strong>
                  <p>Order: <strong className="font-mono">{manifestOrder.order_number || manifestOrder.id}</strong></p>
                  <p>Carrier: <strong>{manifestOrder.carrier || (manifestOrder.delivery_tier === "two_man_white_glove" ? "SAN 2-Man Dedicated Logistics" : manifestOrder.delivery_tier === "pallet" ? "Palletways UK Freight" : "SAN Dedicated Logistics")}</strong></p>
                  <p>Consignment: <strong className="font-mono text-brass-800">{manifestOrder.tracking_number || "TRX-SAN-446575"}</strong></p>
                  <p>Delivery Slot: <strong>10:00 - 12:00 BST</strong></p>
                  <p>Tier: <strong className="text-forest-800">{manifestOrder.delivery_tier === "two_man_white_glove" ? "2-Man White Glove & Assembly" : manifestOrder.delivery_tier === "pallet" ? "Pallet Freight" : "Standard Delivery"}</strong></p>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-sand-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-sand-50 font-bold text-navy-950 border-b border-sand-200">
                    <tr>
                      <th className="p-3">Item Description</th>
                      <th className="p-3">SKU</th>
                      <th className="p-3 text-center">Qty</th>
                      <th className="p-3 text-right">Service Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sand-200">
                    {parseItems(manifestOrder.items_json).map((it, idx) => (
                      <tr key={idx}>
                        <td className="p-3 font-semibold text-navy-950">{it.title}</td>
                        <td className="p-3 font-mono text-navy-700">{it.sku || "SAN-PIECE"}</td>
                        <td className="p-3 text-center font-bold">{it.quantity}</td>
                        <td className="p-3 text-right text-forest-800 font-medium">
                          {manifestOrder.delivery_tier === "two_man_white_glove" ? "Room of Choice & Packaging Removal" : "Direct Doorstep / Kerbside Delivery"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Delivery Checklist & Customer Sign-off */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-sand-300 text-xs">
                <div className="space-y-1.5">
                  <span className="font-bold text-[10px] uppercase text-navy-500">
                    {manifestOrder.delivery_tier === "two_man_white_glove" ? "2-Man Team Checklist:" : "Delivery Team Checklist:"}
                  </span>
                  <div className="space-y-1 text-[11px] text-navy-700">
                    <p>☑ 2-Person Lift Completed</p>
                    <p>☑ Placed in Customer Room of Choice</p>
                    <p>☑ Checked for Transit Scuffs/Defects</p>
                    <p>☑ All Cardboard &amp; Packaging Disposed</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="font-bold text-[10px] uppercase text-navy-500">Customer Proof of Delivery (POD):</span>
                  <div className="h-16 border-2 border-dashed border-sand-300 rounded-lg flex items-center justify-center text-navy-400 text-[11px] bg-white">
                    Customer Signature / Sign-Off
                  </div>
                  <div className="flex justify-between text-[10px] text-navy-500">
                    <span>Print Name: _________________</span>
                    <span>Date: ___/___/2026</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. OFFICIAL ORDER INVOICE MODAL */}
      {/* ========================================================================= */}
      {invoiceOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-navy-950/75 backdrop-blur-sm overflow-y-auto m-0 print:static print:inset-auto print:p-0 print:m-0 print:bg-white print:overflow-visible print:block print:w-full print:h-auto animate-in fade-in">
          <div className="bg-white border border-sand-300 rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl my-auto print:shadow-none print:border-none print:m-0 print:p-0 print:w-full print:max-w-full text-navy-950 print-invoice-sheet">
            {/* Header Actions (hidden on print) */}
            <div className="flex items-center justify-between pb-6 border-b border-sand-200 print:hidden">
              <span className="text-xs font-bold uppercase tracking-wider text-navy-600">
                Official Order Invoice Preview
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-navy-950 text-sand-50 hover:bg-navy-900 text-xs font-semibold cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-brass-400" />
                  <span>Print / Save PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInvoiceOrder(null)}
                  className="p-1 rounded-lg text-navy-400 hover:text-navy-700 hover:bg-sand-200 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Invoice Sheet */}
            <div className="pt-6 print:pt-0 space-y-6 print:space-y-4">
              {/* Branding and Invoice Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-display text-2xl font-bold text-navy-950 tracking-tight">
                    SAN FURNITURE
                  </h2>
                  <p className="text-xs text-navy-600 mt-1">Contemporary Quality Home Living</p>
                  <div className="text-[11px] text-navy-500 mt-2 space-y-0.5">
                    <p>Online UK Furniture Retailer • Mainland Delivery</p>
                    <p>Customer Support: <strong className="text-navy-900">support@sanfurniture.com</strong></p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold uppercase tracking-widest text-brass-700">
                    ORDER INVOICE
                  </span>
                  <p className="font-mono text-sm font-bold text-navy-950 mt-1">
                    {invoiceOrder.order_number || invoiceOrder.id}
                  </p>
                  <p className="text-[11px] text-navy-500 mt-1">
                    Date: {new Date(invoiceOrder.created_at).toLocaleDateString("en-GB")}
                  </p>
                  <p className="text-[11px] text-emerald-800 font-semibold mt-1">
                    Payment Status: PAID
                  </p>
                </div>
              </div>

              {/* Bill To & Ship To */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-white border border-sand-200 text-xs shadow-2xs">
                <div>
                  <span className="font-bold text-navy-900 uppercase text-[10px] tracking-wider">
                    Customer Details:
                  </span>
                  <p className="font-semibold text-navy-950 mt-1">{invoiceOrder.customer_name}</p>
                  <p className="text-navy-600">{invoiceOrder.customer_email}</p>
                  <p className="text-navy-600 font-mono">{invoiceOrder.customer_phone}</p>
                </div>

                <div>
                  <span className="font-bold text-navy-900 uppercase text-[10px] tracking-wider">
                    UK Delivery Destination:
                  </span>
                  <p className="text-navy-900 mt-1">{invoiceOrder.shipping_address || "14 Kensington Palace Gardens, London"}</p>
                  <p className="font-mono font-bold text-brass-800">{invoiceOrder.postcode || "SW1A 1AA"}</p>
                  <span className="inline-block mt-1 text-[10px] font-semibold text-navy-800 bg-sand-100 px-2 py-0.5 rounded border border-sand-200">
                    Tier: {invoiceOrder.delivery_tier === "two_man_white_glove" ? "2-Man White Glove" : invoiceOrder.delivery_tier === "pallet" ? "Pallet Freight" : "Standard Delivery"}
                  </span>
                </div>
              </div>

              {/* VAT Math Table */}
              <div className="border border-sand-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-sand-50 border-b border-sand-200 font-semibold text-navy-800">
                    <tr>
                      <th className="p-3">Description</th>
                      <th className="p-3 text-right">Net Amount</th>
                      <th className="p-3 text-right">VAT Rate</th>
                      <th className="p-3 text-right">VAT (£)</th>
                      <th className="p-3 text-right">Total (£)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sand-200">
                    {(() => {
                      const gross = invoiceOrder.total_pennies || 0;
                      const vat = invoiceOrder.vat_pennies || Math.round(gross - gross / 1.2);
                      const net = gross - vat;
                      return (
                        <tr>
                          <td className="p-3 font-semibold text-navy-950">
                            Bespoke Handcrafted Furniture Order ({invoiceOrder.id})
                          </td>
                          <td className="p-3 text-right font-mono">{formatGBP(net)}</td>
                          <td className="p-3 text-right font-mono">20.00%</td>
                          <td className="p-3 text-right font-mono">{formatGBP(vat)}</td>
                          <td className="p-3 text-right font-mono font-bold text-navy-950">
                            {formatGBP(gross)}
                          </td>
                        </tr>
                      );
                    })()}
                  </tbody>
                </table>
              </div>

              {/* Total Summary */}
              <div className="flex justify-end pt-2">
                <div className="w-64 space-y-1.5 text-xs text-right">
                  {(() => {
                    const gross = invoiceOrder.total_pennies || 0;
                    const vat = invoiceOrder.vat_pennies || Math.round(gross - gross / 1.2);
                    const net = gross - vat;
                    return (
                      <>
                        <div className="flex justify-between text-navy-600">
                          <span>Net Subtotal:</span>
                          <span className="font-mono">{formatGBP(net)}</span>
                        </div>
                        <div className="flex justify-between text-navy-600">
                          <span>UK VAT (20%):</span>
                          <span className="font-mono">{formatGBP(vat)}</span>
                        </div>
                        <div className="flex justify-between text-sm font-bold text-navy-950 pt-2 border-t border-sand-300">
                          <span>Total Paid:</span>
                          <span className="font-display text-base text-brass-700">{formatGBP(gross)}</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Quality & Customer Care Footnote */}
              <div className="pt-6 border-t border-sand-200 text-[10px] text-navy-500 text-center space-y-1">
                <p>All furniture items are inspected for durability and packed in secure protective packaging.</p>
                <p>Thank you for choosing SAN Furniture &bull; Customer Care: support@sanfurniture.com</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. CANCEL ORDER CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {cancellingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150 print:hidden m-0">
          <div className="bg-sand-50 border border-sand-300 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 my-auto">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <Ban className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-display text-base font-bold text-navy-950">
                  Cancel Order Confirmation
                </h3>
                <p className="text-xs text-navy-600 mt-1">
                  Are you sure you want to cancel order{" "}
                  <span className="font-mono font-bold text-navy-950">
                    {cancellingOrder.order_number || cancellingOrder.id}
                  </span>{" "}
                  for <strong className="text-navy-900">{cancellingOrder.customer_name}</strong>?
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCancellingOrder(null)}
                className="p-1 rounded-lg text-navy-400 hover:text-navy-700 hover:bg-sand-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-sand-100/70 p-3.5 rounded-xl border border-sand-200 text-xs space-y-2">
              <div className="flex justify-between text-navy-700">
                <span>Order Total:</span>
                <span className="font-mono font-bold text-navy-950">{formatGBP(cancellingOrder.total_pennies || 0)}</span>
              </div>
              <div className="flex justify-between text-navy-700">
                <span>Current Status:</span>
                <span className="capitalize font-semibold text-navy-900">{cancellingOrder.status || "processing"}</span>
              </div>
              <p className="text-[11px] text-amber-800 bg-amber-50/90 p-2.5 rounded-lg border border-amber-200 leading-relaxed">
                Cancelling this order will mark fulfillment as cancelled, set payment status to refund pending, and log an administrative audit record.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy-900 mb-1">
                Cancellation Reason / Audit Note
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {[
                  "Customer requested cancellation before dispatch",
                  "Out of stock / Supplier inventory discrepancy",
                  "Customer requested change of address or delivery date",
                  "Duplicate order detected / Customer error",
                  "Suspected fraudulent transaction",
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setCancelReason(preset)}
                    className={`text-[10px] px-2 py-1 rounded-md border transition-colors text-left ${
                      cancelReason === preset
                        ? "bg-amber-100 border-amber-400 font-bold text-amber-900"
                        : "bg-white border-sand-300 text-navy-700 hover:bg-sand-100"
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Customer requested cancellation before dispatch..."
                rows={2}
                className="w-full px-3 py-2 bg-sand-100 border border-sand-300 rounded-lg text-xs text-navy-950 focus:outline-none focus:border-brass-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-sand-200">
              <button
                type="button"
                onClick={() => setCancellingOrder(null)}
                disabled={isSubmittingCancel}
                className="px-4 py-2 rounded-xl border border-sand-300 bg-white hover:bg-sand-100 text-navy-700 font-semibold text-xs cursor-pointer disabled:opacity-50"
              >
                Keep Order
              </button>
              <button
                type="button"
                onClick={handleConfirmCancelOrder}
                disabled={isSubmittingCancel}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>{isSubmittingCancel ? "Cancelling..." : "Confirm Cancellation"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. PERMANENT DELETE ORDER MODAL */}
      {/* ========================================================================= */}
      {deletingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150 print:hidden m-0">
          <div className="bg-sand-50 border border-sand-300 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 my-auto">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-display text-base font-bold text-navy-950">
                  Permanently Delete Order
                </h3>
                <p className="text-xs text-navy-600 mt-1">
                  Are you completely sure you want to delete order{" "}
                  <span className="font-mono font-bold text-navy-950">
                    {deletingOrder.order_number || deletingOrder.id}
                  </span>{" "}
                  for <strong className="text-navy-900">{deletingOrder.customer_name}</strong>?
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDeletingOrder(null)}
                className="p-1 rounded-lg text-navy-400 hover:text-navy-700 hover:bg-sand-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs space-y-1.5 text-rose-900">
              <p className="font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                This action is destructive and irreversible.
              </p>
              <p className="text-[11px] text-rose-800 leading-relaxed">
                The order record, customer line items, and associated carrier dispatches will be permanently purged from the database.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-sand-200">
              <button
                type="button"
                onClick={() => setDeletingOrder(null)}
                disabled={isSubmittingDelete}
                className="px-4 py-2 rounded-xl border border-sand-300 bg-white hover:bg-sand-100 text-navy-700 font-semibold text-xs cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteOrder}
                disabled={isSubmittingDelete}
                className="px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isSubmittingDelete ? "Deleting..." : "Delete Order Permanently"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
