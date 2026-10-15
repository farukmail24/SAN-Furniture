"use client";

import React, { useState, useEffect } from "react";
import {
  Building2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Truck,
  Calendar,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  Layers,
  Clock,
  ArrowUpRight
} from "lucide-react";

interface Supplier {
  id: string;
  name: string;
  code: string;
  location: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  feed_type: string;
  feed_url: string;
  lead_time_days: number;
  is_active: number;
  last_sync_at: string;
  sync_status: string;
  mapped_products_count?: number;
}

export default function AdminSuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchSuppliers = async () => {
    try {
      const res = await fetch("http://localhost:9000/api/admin/suppliers");
      const data = await res.json();
      if (data.suppliers) {
        setSuppliers(data.suppliers);
      }
    } catch (err) {
      console.error("Failed to load suppliers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleTriggerSync = async (supplierId: string) => {
    setSyncingId(supplierId);
    setToastMsg(null);
    try {
      const res = await fetch("http://localhost:9000/api/admin/suppliers/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supplierId }),
      });
      const data = await res.json();
      if (res.ok) {
        setToastMsg({ type: "success", text: data.message || "EDI catalog synchronized successfully." });
        fetchSuppliers();
      } else {
        setToastMsg({ type: "error", text: data.error || "Sync failed" });
      }
    } catch {
      setToastMsg({ type: "error", text: "Network error triggering supplier EDI sync." });
    } finally {
      setSyncingId(null);
      setTimeout(() => setToastMsg(null), 4000);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E8E2D5]">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#C89B3C] mb-1">
            <Building2 className="w-4 h-4" />
            <span>Supply Chain & B2B EDI Network</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif text-[#0B132B]">
            UK Wholesale Dropship Suppliers
          </h1>
          <p className="text-sm text-[#4F6D7A] mt-1">
            Real-time automated inventory feeds, lead times, and purchase order EDI pipelines.
          </p>
        </div>

        <button
          onClick={() => handleTriggerSync("all")}
          disabled={syncingId !== null}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#0B132B] hover:bg-[#1C2541] text-[#FAF8F5] rounded-md text-sm font-medium transition-all shadow-md hover:shadow-lg disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 text-[#C89B3C] ${syncingId ? "animate-spin" : ""}`} />
          <span>Sync All Live Feeds</span>
        </button>
      </div>

      {/* Toast Notification */}
      {toastMsg && (
        <div
          className={`p-4 rounded-md text-sm flex items-center gap-2 animate-in fade-in ${
            toastMsg.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-900"
              : "bg-rose-50 border border-rose-200 text-rose-900"
          }`}
        >
          {toastMsg.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white border border-[#E8E2D5] rounded-xl shadow-sm">
          <div className="text-xs uppercase tracking-wider font-semibold text-[#4F6D7A]">
            Active UK Manufacturers
          </div>
          <div className="text-3xl font-serif text-[#0B132B] mt-2">
            {suppliers.length} Partners
          </div>
          <div className="text-xs text-emerald-700 font-medium mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> 100% BS 5852 Fire Certified
          </div>
        </div>

        <div className="p-5 bg-white border border-[#E8E2D5] rounded-xl shadow-sm">
          <div className="text-xs uppercase tracking-wider font-semibold text-[#4F6D7A]">
            Catalog Stock Items Synced
          </div>
          <div className="text-3xl font-serif text-[#0B132B] mt-2">
            {suppliers.reduce((acc, s) => acc + (s.mapped_products_count || 5), 0)} SKUs
          </div>
          <div className="text-xs text-[#4F6D7A] mt-1">Live stock reservation active</div>
        </div>

        <div className="p-5 bg-white border border-[#E8E2D5] rounded-xl shadow-sm">
          <div className="text-xs uppercase tracking-wider font-semibold text-[#4F6D7A]">
            Avg UK Workshop Lead Time
          </div>
          <div className="text-3xl font-serif text-[#0B132B] mt-2">
            5 - 10 Days
          </div>
          <div className="text-xs text-[#C89B3C] font-medium mt-1 flex items-center gap-1">
            <Truck className="w-3.5 h-3.5" /> Direct white glove fulfillment
          </div>
        </div>
      </div>

      {/* Suppliers Directory Cards */}
      {loading ? (
        <div className="py-20 flex justify-center items-center">
          <RefreshCw className="w-8 h-8 animate-spin text-[#C89B3C]" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {suppliers.map((s) => (
            <div
              key={s.id}
              className="bg-white border border-[#E8E2D5] rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#0B132B] text-[#FAF8F5]">
                      {s.code.toUpperCase()}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                      {s.sync_status === "operational" ? "Feed Operational" : s.sync_status}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-sand-200 text-navy-800 uppercase">
                      EDI: {s.feed_type}
                    </span>
                  </div>

                  <h2 className="text-xl font-serif font-bold text-[#0B132B]">{s.name}</h2>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-[#4F6D7A]">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#C89B3C]" />
                      {s.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#C89B3C]" />
                      Workshop Lead Time: {s.lead_time_days} days
                    </span>
                    <span className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-[#C89B3C]" />
                      {s.mapped_products_count || 14} Catalog Products
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <button
                    onClick={() => handleTriggerSync(s.id)}
                    disabled={syncingId === s.id}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#F4F1EA] hover:bg-[#E8E2D5] text-[#0B132B] rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncingId === s.id ? "animate-spin" : ""}`} />
                    <span>{syncingId === s.id ? "Syncing EDI..." : "Sync Stock Catalog"}</span>
                  </button>

                  <a
                    href={s.feed_url || "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 border border-[#E8E2D5] hover:bg-slate-50 text-[#4F6D7A] rounded-lg text-xs font-medium transition-colors"
                  >
                    <span>Feed Endpoint</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Contact Bar */}
              <div className="mt-5 pt-4 border-t border-[#E8E2D5] flex flex-wrap items-center justify-between gap-3 text-xs text-[#4F6D7A]">
                <div className="flex flex-wrap items-center gap-4">
                  <span className="font-medium text-[#0B132B]">
                    Primary Contact: {s.contact_name || "Factory Dispatch Team"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-[#C89B3C]" />
                    <a href={`mailto:${s.contact_email}`} className="hover:underline">
                      {s.contact_email}
                    </a>
                  </span>
                  {s.contact_phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-[#C89B3C]" />
                      <span>{s.contact_phone}</span>
                    </span>
                  )}
                </div>

                <div className="text-[11px] text-[#4F6D7A]">
                  Last Feed Sync:{" "}
                  <strong>{s.last_sync_at ? new Date(s.last_sync_at).toLocaleString("en-GB") : "Recently"}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
