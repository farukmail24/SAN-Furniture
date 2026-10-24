"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ChevronRight, Truck, Search, MapPin, CheckCircle2, Clock, AlertCircle, FileText, Package, Calendar } from "lucide-react";
import { apiUrl } from "@/lib/api-config";

interface OrderDispatch {
  id: string;
  carrier: string;
  tracking_number: string;
  tracking_url?: string;
  status: string;
  created_at: string;
}

interface OrderItem {
  id?: string;
  productId?: string;
  title?: string;
  name?: string;
  productName?: string;
  quantity: number;
  price_pennies?: number;
  unit_price_pennies?: number;
}

interface LiveOrder {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  shipping_address?: string;
  shipping_postcode: string;
  shipping_zone?: string;
  delivery_tier: string;
  delivery_slot?: string;
  payment_status: string;
  fulfillment_status: string;
  formattedSubtotal: string;
  formattedShipping: string;
  formattedVat: string;
  formattedTotal: string;
  items: OrderItem[];
  dispatches: OrderDispatch[];
  created_at: string;
}

export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState("");
  const [postcode, setPostcode] = useState("");
  const [order, setOrder] = useState<LiveOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = orderId.trim();
    const cleanPostcode = postcode.trim().toUpperCase();

    if (!cleanId || !cleanPostcode) return;

    setLoading(true);
    setErrorMsg(null);
    setOrder(null);

    try {
      const res = await fetch(
        apiUrl(`/api/orders/${encodeURIComponent(cleanId)}?postcode=${encodeURIComponent(cleanPostcode)}`)
      );

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(
          data.error ||
            "Unable to find an active order matching this reference and delivery postcode. Please check your order confirmation email and try again."
        );
        return;
      }

      if (data.order) {
        setOrder(data.order);
      } else {
        setErrorMsg("Order record could not be retrieved. Please contact our concierge team.");
      }
    } catch {
      setErrorMsg("Network error connecting to logistics service. Please check your connection and retry.");
    } finally {
      setLoading(false);
    }
  };

  const getFulfillmentBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "fulfilled":
      case "delivered":
        return { label: "Delivered to Room of Choice", color: "bg-emerald-50 text-emerald-800 border-emerald-200" };
      case "po_dispatched":
      case "dispatched":
      case "in_transit":
        return { label: "In Transit with White-Glove Fleet", color: "bg-blue-50 text-blue-800 border-blue-200" };
      case "cancelled":
        return { label: "Order Cancelled", color: "bg-rose-50 text-rose-800 border-rose-200" };
      case "return_requested":
        return { label: "Return In Progress", color: "bg-purple-50 text-purple-800 border-purple-200" };
      default:
        return { label: "Allocating & Picking at Distribution Hub", color: "bg-amber-50 text-amber-800 border-amber-200" };
    }
  };

  const getDeliveryTierLabel = (tier: string) => {
    switch (tier) {
      case "two_man_white_glove":
        return "Two-Man White-Glove Delivery (Room of Choice + Packaging Removal)";
      case "pallet":
        return "Specialist Pallet Freight (Kerbside Scheduled)";
      default:
        return "Standard Tracked Parcel Courier";
    }
  };

  return (
    <div className="bg-sand-50 min-h-screen pb-16">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="border-b border-sand-200 bg-sand-100/50">
        <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-3 flex items-center text-xs text-navy-600 gap-1.5">
          <Link href="/" className="hover:text-navy-950 transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 text-sand-400" />
          <span className="font-semibold text-navy-950">Track Consignment</span>
        </div>
      </nav>

      {/* Hero */}
      <section className="border-b border-sand-200 bg-sand-100/40 py-12 sm:py-16">
        <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="max-w-2xl space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sand-200/80 text-navy-800 text-[11px] font-semibold tracking-wider uppercase">
              <Truck className="w-3.5 h-3.5 text-brass-600" />
              Live UK Logistics Telemetry
            </span>
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-navy-950">
              Track Your Furniture Consignment
            </h1>
            <p className="text-sm text-navy-700 leading-relaxed">
              Enter your SAN order number and delivery postcode below for real-time warehouse allocation, fleet dispatch tracking, and scheduled delivery booking status.
            </p>
          </div>
        </div>
      </section>

      {/* Tracking Search Form */}
      <section className="py-10 max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="max-w-xl mx-auto">
          <div className="bg-white border border-sand-200 rounded-2xl p-6 sm:p-8 shadow-sm">
            <form onSubmit={handleTrack} className="space-y-4">
              <div>
                <label htmlFor="track-order-ref" className="block text-xs font-semibold text-navy-900 mb-1.5 uppercase tracking-wider">
                  SAN Order Reference
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-navy-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="track-order-ref"
                    type="text"
                    required
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    placeholder="e.g. SAN-2026-08149"
                    className="w-full pl-10 pr-4 py-2.5 bg-sand-50/50 border border-sand-300 rounded-xl text-xs text-navy-950 focus:outline-none focus:border-brass-500 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="track-postcode" className="block text-xs font-semibold text-navy-900 mb-1.5 uppercase tracking-wider">
                  UK Delivery Postcode
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-navy-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="track-postcode"
                    type="text"
                    required
                    value={postcode}
                    onChange={(e) => setPostcode(e.target.value)}
                    placeholder="e.g. SW1A 1AA or M1 1AE"
                    className="w-full pl-10 pr-4 py-2.5 bg-sand-50/50 border border-sand-300 rounded-xl text-xs text-navy-950 uppercase focus:outline-none focus:border-brass-500 font-semibold"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-navy-950 text-sand-50 rounded-xl text-xs font-semibold hover:bg-navy-900 transition-colors flex items-center justify-center gap-2"
              >
                {loading ? "Querying Fleet Network..." : "Track My Furniture"}
              </button>
            </form>

            {/* Error Message */}
            {errorMsg && (
              <div className="mt-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-xs text-rose-800">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">{errorMsg}</p>
                  <p className="mt-1 text-[11px] text-rose-700">
                    Need help? Contact our Concierge Support on 0800 123 4567 or via <Link href="/contact" className="underline font-bold">our contact page</Link>.
                  </p>
                </div>
              </div>
            )}

            {/* Live Order Results */}
            {order && (
              <div className="mt-8 pt-8 border-t border-sand-200 space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-brass-600">
                      Consignment Status
                    </span>
                    <h3 className="font-display text-base font-bold text-navy-950 mt-0.5">
                      Order #{order.order_number || order.id}
                    </h3>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${getFulfillmentBadge(order.fulfillment_status).color}`}>
                    {getFulfillmentBadge(order.fulfillment_status).label}
                  </span>
                </div>

                {/* Delivery Logistics Overview */}
                <div className="p-4 rounded-xl bg-sand-100/70 border border-sand-200 space-y-2 text-xs text-navy-800">
                  <div className="flex items-center justify-between">
                    <span className="text-navy-500 font-semibold">Delivery Tier:</span>
                    <span className="font-bold text-navy-950">{getDeliveryTierLabel(order.delivery_tier)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-navy-500 font-semibold">Postcode Zone:</span>
                    <span className="font-bold text-navy-950 uppercase">{order.shipping_postcode}</span>
                  </div>
                  {order.delivery_slot && (
                    <div className="flex items-center justify-between border-t border-sand-200 pt-2">
                      <span className="text-navy-500 font-semibold flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-brass-600" />
                        Booked Arrival Window:
                      </span>
                      <span className="font-bold text-navy-950">{order.delivery_slot}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between border-t border-sand-200 pt-2">
                    <span className="text-navy-500 font-semibold">Total Order Value:</span>
                    <span className="font-bold text-navy-950">{order.formattedTotal} (inc. VAT)</span>
                  </div>
                </div>

                {/* Stage Progression Checklist */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-navy-900">
                    Consignment Milestones
                  </h4>

                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-xs font-semibold text-navy-900">Order Placed & Payment Verified</h5>
                      <p className="text-[11px] text-navy-600 mt-0.5">Order confirmed. Allocated to workshop queue.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-xs font-semibold text-navy-900">Quality Check & Packaging Inspection</h5>
                      <p className="text-[11px] text-navy-600 mt-0.5">Structural durability check and heavy-duty protective packaging applied.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    {order.fulfillment_status === "delivered" || order.fulfillment_status === "fulfilled" ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <h5 className="text-xs font-semibold text-navy-900">Mainland Fleet Dispatch &amp; Delivery</h5>
                      <p className="text-[11px] text-navy-600 mt-0.5">
                        {order.delivery_slot
                          ? `Scheduled delivery slot confirmed: ${order.delivery_slot}`
                          : "Our logistics team will send tracking updates prior to doorstep arrival."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Dispatched Items */}
                {order.items && order.items.length > 0 && (
                  <div className="space-y-2 border-t border-sand-200 pt-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-navy-900 flex items-center gap-1.5">
                      <Package className="w-4 h-4 text-brass-600" />
                      Items in Consignment ({order.items.length})
                    </h4>
                    <div className="divide-y divide-sand-100 bg-sand-50/50 rounded-xl border border-sand-200 overflow-hidden">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="p-3 flex items-center justify-between text-xs">
                          <span className="font-semibold text-navy-950">
                            {item.title || item.name || item.productName || "Furniture Item"}
                          </span>
                          <span className="text-navy-600 font-mono">Qty: {item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Link: Official VAT Invoice */}
                <div className="pt-2">
                  <a
                    href={apiUrl(`/api/orders/${order.id}/invoice?postcode=${encodeURIComponent(order.shipping_postcode)}`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl border border-sand-300 bg-white hover:bg-sand-50 text-navy-950 text-xs font-semibold transition-colors"
                  >
                    <FileText className="w-4 h-4 text-brass-600" />
                    View & Download Official HMRC VAT Invoice
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
