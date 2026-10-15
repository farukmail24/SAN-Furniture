"use client";

import React, { useState, useEffect } from "react";
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
  Tag
} from "lucide-react";
import { formatGBP } from "@san-furniture/types";

interface OrderItem {
  id: string;
  customer_name: string;
  customer_email: string;
  postcode: string;
  delivery_tier: string;
  status: string;
  total_pennies: number;
  created_at: string;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [trackingNumberInput, setTrackingNumberInput] = useState<{ [id: string]: string }>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      const res = await fetch("http://localhost:9000/api/admin/orders");
      const data = await res.json();
      if (data.orders) setOrders(data.orders);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingOrderId(orderId);
    try {
      const trackingNumber = trackingNumberInput[orderId] || "BJS-2MAN-88200";
      const res = await fetch(`http://localhost:9000/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, trackingNumber }),
      });

      if (!res.ok) throw new Error("Failed to update status");

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      setSuccessMessage(`Order ${orderId} updated to "${newStatus}"!`);
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.postcode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "all" || o.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-navy-500 mb-1">
            <Link href="/admin" className="hover:text-navy-950">Operations Suite</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="font-semibold text-navy-900">Orders &amp; UK Fulfillment</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-navy-950">
            Customer Orders &amp; 2-Man Dispatch
          </h1>
          <p className="text-xs text-navy-600 mt-1">
            Track UK logistics, assign carrier manifests, and generate HMRC VAT invoices
          </p>
        </div>

        {/* Phase 15: Accounting Export Button */}
        <a
          href="http://localhost:9000/api/admin/accounting/export.csv"
          download="san_furniture_accounting.csv"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-navy-950 hover:bg-navy-900 text-sand-50 font-bold text-xs shadow-sm transition-all"
        >
          <Download className="w-4 h-4 text-brass-400" />
          <span>Export Xero/QuickBooks CSV</span>
        </a>
      </div>

      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 bg-sand-50 border border-sand-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-navy-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search order ID, customer, postcode..."
            className="w-full pl-9 pr-4 py-2 bg-sand-100/80 border border-sand-300 rounded-lg text-xs text-navy-950 focus:outline-none focus:border-brass-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-navy-500" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-sand-100/80 border border-sand-300 rounded-lg text-xs text-navy-950 focus:outline-none focus:border-brass-500"
          >
            <option value="all">All Statuses</option>
            <option value="paid">Paid &bull; Awaiting PO</option>
            <option value="po_dispatched">PO Forwarded to Supplier</option>
            <option value="in_transit_two_man">2-Man Carrier Booked</option>
            <option value="delivered">Delivered to Room of Choice</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-sand-50 border border-sand-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-sand-200/50 border-b border-sand-200 text-navy-700 font-semibold">
                <th className="p-3.5">Order ID &amp; Date</th>
                <th className="p-3.5">Customer &amp; Postcode</th>
                <th className="p-3.5">Delivery Tier</th>
                <th className="p-3.5">Gross Total (£)</th>
                <th className="p-3.5">Lifecycle Status</th>
                <th className="p-3.5">Carrier Tracking Code</th>
                <th className="p-3.5 text-right">Actions &amp; VAT Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-200">
              {filteredOrders.map((o) => {
                const totalGbp = (o.total_pennies / 100).toFixed(2);
                return (
                  <tr key={o.id} className="hover:bg-sand-100/40 transition-colors">
                    <td className="p-3.5">
                      <span className="font-mono font-bold text-navy-950">{o.id}</span>
                      <p className="text-[10px] text-navy-500">{new Date(o.created_at).toLocaleDateString("en-GB")}</p>
                    </td>
                    <td className="p-3.5">
                      <p className="font-semibold text-navy-950">{o.customer_name}</p>
                      <span className="font-mono text-[11px] text-brass-700 font-bold">{o.postcode}</span>
                    </td>
                    <td className="p-3.5">
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-navy-800 bg-sand-200 px-2 py-0.5 rounded">
                        <Truck className="w-3 h-3 text-brass-600" />
                        {o.delivery_tier === "two_man_white_glove" ? "2-Man White Glove" : "Pallet Freight"}
                      </span>
                    </td>
                    <td className="p-3.5 font-bold text-navy-950 text-sm">
                      £{totalGbp}
                    </td>
                    <td className="p-3.5">
                      <select
                        value={o.status}
                        onChange={(e) => handleUpdateStatus(o.id, e.target.value)}
                        disabled={updatingOrderId === o.id}
                        className="px-2.5 py-1 rounded bg-sand-100 border border-sand-300 font-semibold text-[11px] text-navy-950 focus:outline-none focus:border-brass-500"
                      >
                        <option value="paid">Paid (Awaiting PO)</option>
                        <option value="po_dispatched">PO Forwarded to Supplier</option>
                        <option value="in_transit_two_man">2-Man Carrier In Transit</option>
                        <option value="delivered">Delivered to Room of Choice</option>
                      </select>
                    </td>
                    <td className="p-3.5">
                      <input
                        type="text"
                        placeholder="e.g. BJS-88231"
                        value={trackingNumberInput[o.id] !== undefined ? trackingNumberInput[o.id] : "BJS-2MAN-9912"}
                        onChange={(e) =>
                          setTrackingNumberInput((prev) => ({ ...prev, [o.id]: e.target.value }))
                        }
                        className="w-32 px-2 py-1 bg-sand-100 border border-sand-300 rounded text-[11px] font-mono text-navy-950 focus:outline-none focus:border-brass-500"
                      />
                    </td>
                    <td className="p-3.5 text-right space-x-2">
                      {/* Phase 15: Download VAT Invoice */}
                      <a
                        href={`http://localhost:9000/api/invoices/${o.id}?format=html`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-sand-200 hover:bg-sand-300 text-navy-950 text-[11px] font-semibold transition-colors"
                        title="Download HMRC-Compliant UK VAT Invoice"
                      >
                        <FileText className="w-3 h-3 text-navy-700" />
                        <span>VAT Invoice</span>
                        <ExternalLink className="w-3 h-3 text-navy-500" />
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
