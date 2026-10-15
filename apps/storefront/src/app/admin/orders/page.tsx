"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  Sparkles
} from "lucide-react";
import { DataTable, ColumnDef } from "@/components/admin/DataTable";
import { formatGBP } from "@san-furniture/types";
import { apiUrl } from "@/lib/api-config";
import { fetchWithSwr, invalidateCache, getCachedData } from "@/lib/api-cache";

interface OrderItem {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  shipping_address?: string;
  postcode: string;
  delivery_tier: string;
  status: string;
  total_pennies: number;
  subtotal_pennies?: number;
  vat_pennies?: number;
  payment_status?: string;
  carrier?: string;
  tracking_number?: string;
  po_number?: string;
  created_at: string;
}

export default function AdminOrdersPage() {
  const cachedOrders = getCachedData<{ orders: OrderItem[] }>(apiUrl("/api/admin/orders"));
  const [orders, setOrders] = useState<OrderItem[]>(() => cachedOrders?.orders || []);
  const [loading, setLoading] = useState<boolean>(() => !cachedOrders?.orders?.length);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Dispatch Modal State
  const [dispatchOrder, setDispatchOrder] = useState<OrderItem | null>(null);
  const [carrier, setCarrier] = useState("BJS Home Delivery");
  const [trackingCode, setTrackingCode] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("2026-10-18");
  const [deliverySlot, setDeliverySlot] = useState("10:00 - 12:00");
  const [roomNotes, setRoomNotes] = useState("Room of choice: 1st floor Master Bedroom. Packaging removal required.");
  const [statusVal, setStatusVal] = useState("in_transit");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // VAT Invoice Modal State
  const [invoiceOrder, setInvoiceOrder] = useState<OrderItem | null>(null);

  const fetchOrders = async () => {
    try {
      fetchWithSwr(
        apiUrl("/api/admin/orders"),
        (data: any, isCached) => {
          if (data.orders) {
            setOrders(data.orders);
            setLoading(false);
          }
        }
      ).finally(() => setLoading(false));
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const openDispatchModal = (o: OrderItem) => {
    setDispatchOrder(o);
    setCarrier(o.carrier || "BJS Home Delivery");
    setTrackingCode(o.tracking_number || `BJS-2MAN-${Date.now().toString().slice(-5)}`);
    setStatusVal(o.status || "in_transit");
  };

  const handleSaveDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispatchOrder) return;
    setIsSubmitting(true);

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
      setSuccessMessage(`Order ${dispatchOrder.id} successfully updated with ${carrier} tracking ${trackingCode}!`);
      setDispatchOrder(null);
      await fetchOrders();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      alert("Error dispatching: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  // Metrics
  const totalRevenuePennies = orders.reduce((sum, o) => sum + (o.total_pennies || 0), 0);
  const pendingDispatch = orders.filter((o) => o.status === "unfulfilled" || o.status === "paid" || o.status === "po_dispatched").length;
  const inTransitCount = orders.filter((o) => o.status === "in_transit" || o.status === "in_transit_two_man").length;

  const columns: ColumnDef<OrderItem>[] = useMemo(
    () => [
      {
        key: "order_number",
        header: "Order & Reference",
        sortable: true,
        cell: (o) => (
          <div>
            <span className="font-mono font-bold text-navy-950 text-xs">
              {o.order_number || o.id}
            </span>
            <p className="text-[10px] text-navy-500 mt-0.5">
              {new Date(o.created_at).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
        ),
      },
      {
        key: "customer_name",
        header: "Customer & Postcode",
        sortable: true,
        cell: (o) => (
          <div>
            <p className="font-semibold text-navy-950 text-xs">{o.customer_name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="font-mono text-[11px] font-bold text-brass-700 bg-sand-200/50 px-1.5 py-0.2 rounded">
                {o.postcode || "UK Mainland"}
              </span>
              <span className="text-[10px] text-navy-500 truncate max-w-[140px]">
                {o.customer_email}
              </span>
            </div>
          </div>
        ),
      },
      {
        key: "delivery_tier",
        header: "Delivery Tier",
        sortable: true,
        cell: (o) => (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-navy-900 bg-sand-200/60 px-2 py-0.5 rounded">
            <Truck className="w-3.5 h-3.5 text-brass-600" />
            {o.delivery_tier === "two_man_white_glove" ? "2-Man White Glove" : "Pallet Freight"}
          </span>
        ),
      },
      {
        key: "total_pennies",
        header: "Gross Total (Inc VAT)",
        sortable: true,
        cell: (o) => (
          <span className="font-bold text-navy-950 text-sm font-display">
            {formatGBP(o.total_pennies)}
          </span>
        ),
      },
      {
        key: "carrier_tracking",
        header: "Carrier & Manifest",
        cell: (o) => (
          <div>
            <p className="text-xs font-semibold text-navy-900">{o.carrier || "BJS Home Delivery"}</p>
            <span className="font-mono text-[10px] text-brass-800 bg-brass-100/60 px-1.5 py-0.2 rounded">
              {o.tracking_number || "Unassigned"}
            </span>
          </div>
        ),
      },
      {
        key: "status",
        header: "Fulfillment Status",
        sortable: true,
        cell: (o) => {
          if (o.status === "delivered") {
            return (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Delivered
              </span>
            );
          }
          if (o.status === "in_transit" || o.status === "in_transit_two_man") {
            return (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-navy-950 bg-brass-200 px-2.5 py-0.5 rounded-full">
                <Truck className="w-3 h-3 text-brass-800" />
                2-Man In Transit
              </span>
            );
          }
          if (o.status === "po_dispatched") {
            return (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-800 bg-sky-100 px-2.5 py-0.5 rounded-full">
                <Clock className="w-3 h-3 text-sky-600" />
                PO with Supplier
              </span>
            );
          }
          return (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
              Paid (Awaiting Dispatch)
            </span>
          );
        },
      },
      {
        key: "actions",
        header: "Actions",
        cell: (o) => (
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={() => openDispatchModal(o)}
              className="px-2.5 py-1 rounded-lg bg-navy-950 hover:bg-navy-900 text-sand-50 font-semibold text-xs transition-colors flex items-center gap-1"
              title="Assign 2-Man Carrier & Tracking"
            >
              <Truck className="w-3 h-3 text-brass-400" />
              <span>Dispatch</span>
            </button>
            <button
              type="button"
              onClick={() => setInvoiceOrder(o)}
              className="p-1.5 rounded-lg border border-sand-300 text-navy-700 hover:bg-sand-200 transition-colors"
              title="View HMRC Statutory VAT Invoice"
            >
              <FileText className="w-4 h-4 text-brass-700" />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6 antialiased">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-navy-500 mb-1">
            <Link href="/admin" className="hover:text-navy-950">Operations Suite</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="font-semibold text-navy-900">Customer Orders &amp; 2-Man Dispatch</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-navy-950">
            Order Fulfillment &amp; 2-Man Carrier Logistics
          </h1>
          <p className="text-xs text-navy-600 mt-1">
            Assign UK 2-Man White Glove Carriers &bull; Schedule 2-Hour Delivery Slots &bull; Generate HMRC VAT Invoices
          </p>
        </div>

        <a
          href={apiUrl("/api/admin/accounting/export.csv")}
          download="san_furniture_accounting.csv"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-navy-950 hover:bg-navy-900 text-sand-50 font-bold text-xs shadow-sm transition-all"
        >
          <Download className="w-4 h-4 text-brass-400" />
          <span>Export Xero / QuickBooks CSV</span>
        </a>
      </div>

      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2.5 animate-fade-in shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-sand-50 border border-sand-200 shadow-sm">
          <span className="text-[11px] font-semibold text-navy-600 uppercase tracking-wider">Total Orders</span>
          <p className="text-2xl font-display font-bold text-navy-950 mt-1">{orders.length}</p>
        </div>
        <div className="p-4 rounded-xl bg-sand-50 border border-sand-200 shadow-sm">
          <span className="text-[11px] font-semibold text-navy-600 uppercase tracking-wider">Awaiting 2-Man Dispatch</span>
          <p className="text-2xl font-display font-bold text-amber-700 mt-1">{pendingDispatch}</p>
        </div>
        <div className="p-4 rounded-xl bg-sand-50 border border-sand-200 shadow-sm">
          <span className="text-[11px] font-semibold text-navy-600 uppercase tracking-wider">Active In-Transit</span>
          <p className="text-2xl font-display font-bold text-brass-700 mt-1">{inTransitCount}</p>
        </div>
        <div className="p-4 rounded-xl bg-sand-50 border border-sand-200 shadow-sm">
          <span className="text-[11px] font-semibold text-navy-600 uppercase tracking-wider">Gross Revenue (Inc VAT)</span>
          <p className="text-2xl font-display font-bold text-emerald-700 mt-1">{formatGBP(totalRevenuePennies)}</p>
        </div>
      </div>

      {/* Advanced DataTable */}
      <DataTable
        data={orders}
        columns={columns}
        keyExtractor={(o) => o.id}
        title="Customer Orders Queue"
        subtitle="Live order feed synced directly from MySQL orders and order_po_dispatches tables"
        searchPlaceholder="Search order ID, customer name, postcode, carrier..."
        loading={loading}
        onRefresh={fetchOrders}
        exportFileName="san_furniture_orders_dispatch"
      />

      {/* 2-Man Dispatch Drawer / Modal */}
      {dispatchOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-sand-50 border border-sand-300 rounded-2xl max-w-xl w-full p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-sand-200">
              <div>
                <h3 className="font-display text-lg font-bold text-navy-950">
                  Assign 2-Man White Glove Dispatch
                </h3>
                <p className="text-xs text-navy-600">
                  Order: <span className="font-mono font-bold text-navy-900">{dispatchOrder.order_number || dispatchOrder.id}</span> &bull; Customer: {dispatchOrder.customer_name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDispatchOrder(null)}
                className="p-1 rounded-lg text-navy-400 hover:text-navy-700 hover:bg-sand-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDispatch} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-navy-900 mb-1">
                  2-Man Carrier Partner
                </label>
                <select
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  className="w-full px-3 py-2 bg-sand-100 border border-sand-300 rounded-lg text-xs text-navy-950 focus:outline-none focus:border-brass-500"
                >
                  <option value="BJS Home Delivery">BJS Home Delivery (Specialist 2-Man White Glove)</option>
                  <option value="Furdeco Delivery">Furdeco (Room of Choice &amp; Packaging Removal)</option>
                  <option value="ArrowXL">ArrowXL (Heavy 2-Man Specialist)</option>
                  <option value="DPD Heavy Freight">DPD Heavy Freight</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-navy-900">
                    Carrier Consignment / Tracking Code
                  </label>
                  <button
                    type="button"
                    onClick={() => setTrackingCode(`BJS-2MAN-${Date.now().toString().slice(-6)}`)}
                    className="text-[11px] text-brass-700 hover:underline font-semibold"
                  >
                    Auto-Generate BJS Code
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={trackingCode}
                  onChange={(e) => setTrackingCode(e.target.value)}
                  placeholder="e.g. BJS-2MAN-88200"
                  className="w-full px-3 py-2 bg-sand-100 border border-sand-300 rounded-lg text-xs font-mono font-bold text-navy-950 focus:outline-none focus:border-brass-500 uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-navy-900 mb-1">
                    Booked Delivery Date
                  </label>
                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="w-full px-3 py-2 bg-sand-100 border border-sand-300 rounded-lg text-xs text-navy-950"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-navy-900 mb-1">
                    Agreed 2-Hour Window Slot
                  </label>
                  <select
                    value={deliverySlot}
                    onChange={(e) => setDeliverySlot(e.target.value)}
                    className="w-full px-3 py-2 bg-sand-100 border border-sand-300 rounded-lg text-xs text-navy-950"
                  >
                    <option value="08:00 - 10:00">Morning (08:00 - 10:00)</option>
                    <option value="10:00 - 12:00">Midday (10:00 - 12:00)</option>
                    <option value="12:00 - 14:00">Early Afternoon (12:00 - 14:00)</option>
                    <option value="14:00 - 16:00">Afternoon (14:00 - 16:00)</option>
                    <option value="16:00 - 18:00">Evening (16:00 - 18:00)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy-900 mb-1">
                  Lifecycle Status
                </label>
                <select
                  value={statusVal}
                  onChange={(e) => setStatusVal(e.target.value)}
                  className="w-full px-3 py-2 bg-sand-100 border border-sand-300 rounded-lg text-xs text-navy-950 font-semibold"
                >
                  <option value="in_transit">2-Man Carrier Manifest Booked &amp; In Transit</option>
                  <option value="delivered">Delivered to Room of Choice &amp; Inspected</option>
                  <option value="po_dispatched">PO Forwarded to Supplier</option>
                  <option value="paid">Paid (Unfulfilled)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy-900 mb-1">
                  Driver Access &amp; Room of Choice Instructions
                </label>
                <textarea
                  rows={2}
                  value={roomNotes}
                  onChange={(e) => setRoomNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-sand-100 border border-sand-300 rounded-lg text-xs text-navy-950 focus:outline-none focus:border-brass-500"
                />
              </div>

              <div className="pt-4 border-t border-sand-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDispatchOrder(null)}
                  className="px-4 py-2 rounded-lg border border-sand-300 text-xs font-semibold text-navy-700 hover:bg-sand-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg bg-gradient-to-r from-brass-500 to-brass-600 hover:from-brass-400 hover:to-brass-500 text-navy-950 font-bold text-xs shadow-md transition-all disabled:opacity-50"
                >
                  {isSubmitting ? "Updating Manifest..." : "Confirm 2-Man Dispatch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HMRC VAT Statutory Invoice Printable Modal */}
      {invoiceOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/75 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white">
          <div className="bg-white border border-sand-300 rounded-2xl max-w-2xl w-full p-8 shadow-2xl my-8 print:shadow-none print:border-none print:m-0 text-navy-950">
            {/* Header Actions (hidden on print) */}
            <div className="flex items-center justify-between pb-6 border-b border-sand-200 print:hidden">
              <span className="text-xs font-bold uppercase tracking-wider text-navy-600">
                HMRC Statutory VAT Invoice Preview
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintInvoice}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-navy-950 text-sand-50 hover:bg-navy-900 text-xs font-semibold"
                >
                  <Printer className="w-3.5 h-3.5 text-brass-400" />
                  <span>Print / Save PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInvoiceOrder(null)}
                  className="p-1 rounded-lg text-navy-400 hover:text-navy-700 hover:bg-sand-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Invoice Sheet */}
            <div className="pt-6 space-y-6">
              {/* Branding and VAT Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-display text-2xl font-bold text-navy-950 tracking-tight">
                    SAN FURNITURE
                  </h2>
                  <p className="text-xs text-navy-600 mt-1">Handcrafted British Living</p>
                  <div className="text-[11px] text-navy-500 mt-2 space-y-0.5">
                    <p>48 Grosvenor Square, Mayfair, London W1K 2HP</p>
                    <p>Companies House: <strong>14289123</strong></p>
                    <p>HMRC VAT Reg: <strong className="text-navy-900">GB 438 9123 76</strong></p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold uppercase tracking-widest text-brass-700">
                    TAX INVOICE
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
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-sand-50 border border-sand-200 text-xs">
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
                  <span className="inline-block mt-1 text-[10px] font-semibold text-navy-800 bg-sand-200 px-2 py-0.5 rounded">
                    Tier: {invoiceOrder.delivery_tier === "two_man_white_glove" ? "2-Man White Glove" : "Pallet"}
                  </span>
                </div>
              </div>

              {/* VAT Math Table */}
              <div className="border border-sand-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-sand-100 border-b border-sand-200 font-semibold text-navy-800">
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

              {/* Statutory Footnote */}
              <div className="pt-6 border-t border-sand-200 text-[10px] text-navy-500 text-center space-y-1">
                <p>All upholstered items comply with the Furniture and Furnishings (Fire Safety) Regulations 1988 (BS 5852).</p>
                <p>Thank you for choosing SAN Furniture &bull; Customer Concierge: concierge@sanfurniture.co.uk</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
