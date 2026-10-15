"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Package,
  Truck,
  MapPin,
  FileText,
  Heart,
  LogOut,
  ChevronRight,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  User,
  ShoppingBag
} from "lucide-react";
import { formatGBP } from "@san-furniture/types";

interface CustomerUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export default function CustomerAccountPage() {
  const router = useRouter();
  const [customer, setCustomer] = useState<CustomerUser | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check customer session
    const stored = localStorage.getItem("san_customer_user");
    if (stored) {
      try {
        setCustomer(JSON.parse(stored));
      } catch {
        setCustomer(null);
      }
    } else {
      // Demo default
      setCustomer({
        id: "cust_01",
        email: "eleanor.vance@gmail.com",
        firstName: "Eleanor",
        lastName: "Vance",
        phone: "+44 7700 900123"
      });
    }

    // Fetch orders
    fetch("http://localhost:9000/api/customer/orders?email=eleanor.vance@gmail.com")
      .then((res) => res.json())
      .then((data) => {
        if (data.orders) setOrders(data.orders);
      })
      .catch((err) => console.error("Orders fetch error:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("san_customer_token");
    localStorage.removeItem("san_customer_user");
    document.cookie = "san_customer_token=; Max-Age=0; path=/;";
    router.push("/account/login");
  };

  return (
    <div className="bg-sand-50 min-h-screen py-10 px-4 sm:px-6 lg:px-8 antialiased">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Top Header Card */}
        <div className="bg-sand-100/70 border border-sand-300 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-navy-950 text-brass-400 font-display font-bold text-xl flex items-center justify-center shadow-md">
              {customer?.firstName ? customer.firstName.charAt(0) : "C"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-brass-600">
                  Verified UK Client
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  White Glove Priority
                </span>
              </div>
              <h1 className="font-display text-2xl font-bold text-navy-950 mt-0.5">
                Welcome back, {customer?.firstName || "Valued Client"} {customer?.lastName || ""}
              </h1>
              <p className="text-xs text-navy-600">{customer?.email || "eleanor.vance@gmail.com"}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs font-semibold px-4 py-2.5 rounded-xl border border-sand-300 bg-sand-50 text-navy-900 hover:bg-sand-200 transition-colors"
            >
              Browse Catalog
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="text-xs font-semibold px-4 py-2.5 rounded-xl bg-navy-950 text-sand-50 hover:bg-navy-900 transition-colors flex items-center gap-2"
            >
              <LogOut className="w-3.5 h-3.5 text-sand-300" />
              Sign Out
            </button>
          </div>
        </div>

        {/* Section 1: Active Furniture Orders & Live 2-Man Delivery Tracking (Phase 14) */}
        <div className="bg-sand-50 border border-sand-300 rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-sand-200">
            <div>
              <h2 className="font-display text-lg font-bold text-navy-950 flex items-center gap-2">
                <Truck className="w-5 h-5 text-brass-600" />
                Active Orders &amp; Live UK 2-Man Delivery Tracking
              </h2>
              <p className="text-xs text-navy-600 mt-0.5">
                Pre-booked 2hr delivery window &bull; White glove room-of-choice placement
              </p>
            </div>
            <span className="text-xs font-bold text-navy-800 bg-sand-200 px-3 py-1 rounded-full">
              {orders.length} Orders
            </span>
          </div>

          <div className="mt-6 space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="p-6 rounded-xl bg-sand-100/50 border border-sand-200 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-sand-200">
                  <div>
                    <span className="font-mono text-xs font-bold text-brass-600">{order.id}</span>
                    <h3 className="text-base font-bold text-navy-950 mt-0.5">The Kensington 3-Seater Sofa (Ivory Bouclé)</h3>
                    <p className="text-xs text-navy-600">
                      Destination: <strong className="font-mono text-navy-950">{order.postcode}</strong> &bull; Carrier: <strong>BJS 2-Man Logistics</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-display font-bold text-lg text-navy-950">
                      {order.totalGbpFormatted || "£1,299.00"}
                    </span>
                    {/* Phase 15: Download UK VAT Invoice */}
                    <a
                      href={`http://localhost:9000/api/invoices/${order.id}?format=html`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sand-200 hover:bg-sand-300 text-navy-950 text-xs font-semibold transition-colors"
                      title="Download Official UK VAT Invoice"
                    >
                      <FileText className="w-3.5 h-3.5 text-navy-700" />
                      <span>UK VAT Invoice</span>
                      <ExternalLink className="w-3 h-3 text-navy-500" />
                    </a>
                  </div>
                </div>

                {/* 4-Step Interactive Tracking Timeline (Phase 14) */}
                <div>
                  <span className="text-xs font-semibold text-navy-700 uppercase tracking-wider block mb-3">
                    Fulfillment &amp; White Glove Progress
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="p-3 rounded-lg bg-sand-50 border border-emerald-300 flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-navy-950">1. Order Placed</p>
                        <span className="text-[10px] text-navy-500">Deposit / Full VAT Paid</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-sand-50 border border-emerald-300 flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-navy-950">2. Workshop QC</p>
                        <span className="text-[10px] text-navy-500">BS 5852 Certified</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-sand-50 border border-brass-400 bg-brass-500/5 flex items-start gap-3">
                      <Clock className="w-4 h-4 text-brass-600 mt-0.5 animate-pulse" />
                      <div>
                        <p className="text-xs font-bold text-navy-950">3. 2-Man In Transit</p>
                        <span className="text-[10px] text-navy-600 font-semibold">Pre-call 30m prior</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-sand-50 border border-sand-300 opacity-60 flex items-start gap-3">
                      <Package className="w-4 h-4 text-navy-400 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-navy-950">4. Room Choice</p>
                        <span className="text-[10px] text-navy-500">Packaging Cleared</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: Saved Delivery Address & Wishlist */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Saved Addresses */}
          <div className="bg-sand-50 border border-sand-300 rounded-2xl p-6 shadow-sm">
            <h3 className="font-display text-base font-bold text-navy-950 flex items-center gap-2 mb-4">
              <MapPin className="w-4 h-4 text-brass-600" />
              Primary UK Delivery Address
            </h3>
            <div className="p-4 rounded-xl bg-sand-100/60 border border-sand-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-navy-950">Residential Sanctuary</span>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Default Delivery
                </span>
              </div>
              <p className="text-xs text-navy-700 leading-relaxed">
                14 Kensington Palace Gardens, Apt 4B<br />
                Kensington, London<br />
                <strong className="text-navy-950 font-mono">SW1A 1AA</strong><br />
                United Kingdom
              </p>
              <div className="mt-3 pt-3 border-t border-sand-200 flex items-center gap-2 text-xs text-navy-600">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>UK Mainland (Free White Glove Eligible)</span>
              </div>
            </div>
          </div>

          {/* Client Wishlist */}
          <div className="bg-sand-50 border border-sand-300 rounded-2xl p-6 shadow-sm">
            <h3 className="font-display text-base font-bold text-navy-950 flex items-center gap-2 mb-4">
              <Heart className="w-4 h-4 text-brass-600" />
              Saved Bespoke Wishlist (2 Items)
            </h3>
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-sand-100/60 border border-sand-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=150&q=80"
                    alt="Florence Chair"
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-navy-950">The Florence Sculptural Armchair</h4>
                    <span className="text-xs font-semibold text-brass-600">£495.00</span>
                  </div>
                </div>
                <Link
                  href="/products/florence-sculptural-boucle-armchair"
                  className="px-3 py-1.5 rounded-lg bg-navy-950 hover:bg-navy-900 text-sand-50 text-[11px] font-semibold transition-colors"
                >
                  View Item
                </Link>
              </div>

              <div className="p-3 rounded-xl bg-sand-100/60 border border-sand-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src="https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=150&q=80"
                    alt="Henley Dining Table"
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-navy-950">The Henley Solid Oak Dining Table</h4>
                    <span className="text-xs font-semibold text-brass-600">£1,150.00</span>
                  </div>
                </div>
                <Link
                  href="/products/henley-solid-oak-dining-table"
                  className="px-3 py-1.5 rounded-lg bg-navy-950 hover:bg-navy-900 text-sand-50 text-[11px] font-semibold transition-colors"
                >
                  View Item
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
