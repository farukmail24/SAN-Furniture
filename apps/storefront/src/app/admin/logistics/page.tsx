"use client";

import React, { useState, useEffect } from "react";
import {
  Truck,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Save,
  Package,
  SlidersHorizontal,
  Info
} from "lucide-react";
import { formatGBP } from "@san-furniture/types";
import { apiUrl } from "@/lib/api-config";

interface PostcodeZone {
  id: string;
  zone_code: string;
  zone_name: string;
  prefix_list: string;
  surcharge_pennies: number;
  lead_time_extra_days: number;
  is_active: number;
}

interface DeliveryTier {
  code: string;
  name: string;
  basePricePennies: number;
  leadTimeDays: number;
}

export default function AdminLogisticsPage() {
  const [zones, setZones] = useState<PostcodeZone[]>([]);
  const [tiers, setTiers] = useState<DeliveryTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingZoneId, setSavingZoneId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchLogistics = async () => {
    try {
      const res = await fetch(apiUrl("/api/admin/logistics"));
      const data = await res.json();
      if (data.zones) setZones(data.zones);
      if (data.deliveryTiers) setTiers(data.deliveryTiers);
    } catch (err) {
      console.error("Failed to load logistics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogistics();
  }, []);

  const handleUpdateZone = async (zone: PostcodeZone) => {
    setSavingZoneId(zone.id);
    setToastMsg(null);
    try {
      const res = await fetch(apiUrl(`/api/admin/logistics/zones/${zone.id}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          surchargePennies: zone.surcharge_pennies,
          leadTimeExtraDays: zone.lead_time_extra_days,
          isActive: Boolean(zone.is_active)
        })
      });
      const data = await res.json();
      if (res.ok) {
        setToastMsg({ type: "success", text: `${zone.zone_name} rules successfully saved!` });
      } else {
        setToastMsg({ type: "error", text: data.error || "Failed to save zone rules." });
      }
    } catch {
      setToastMsg({ type: "error", text: "Network error saving zone rules." });
    } finally {
      setSavingZoneId(null);
      setTimeout(() => setToastMsg(null), 3500);
    }
  };

  const handleZoneFieldChange = (zoneId: string, field: keyof PostcodeZone, val: unknown) => {
    setZones((prev) =>
      prev.map((z) => (z.id === zoneId ? { ...z, [field]: val } : z))
    );
  };

  return (
    <div className="space-y-6 w-full">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E8E2D5]">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#C89B3C] mb-1">
            <Truck className="w-4 h-4" />
            <span>British Logistics & Fulfillment Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif text-[#0B132B]">
            UK Postal Zones & Delivery Tiers
          </h1>
          <p className="text-sm text-[#4F6D7A] mt-1">
            Configure mainland routing, Scottish Highlands surcharges, and 2-Man White Glove delivery standards.
          </p>
        </div>

        <button
          onClick={fetchLogistics}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-[#E8E2D5] hover:bg-[#F4F1EA] text-[#0B132B] rounded-md text-xs font-semibold transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Rates</span>
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

      {/* Delivery Tiers Overview Cards */}
      <div>
        <h2 className="text-base font-serif font-bold text-[#0B132B] mb-3 flex items-center gap-2">
          <Package className="w-4 h-4 text-[#C89B3C]" />
          UK Delivery Service Tiers
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tiers.map((t) => (
            <div key={t.code} className="bg-white p-5 rounded-xl border border-[#E8E2D5] shadow-sm">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[11px] font-mono uppercase bg-[#0B132B] text-white">
                  {t.code}
                </span>
                <span className="text-sm font-bold text-[#0B132B]">
                  {formatGBP(t.basePricePennies)}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-[#0B132B] mt-2.5">{t.name}</h3>
              <div className="flex items-center gap-1.5 text-xs text-[#4F6D7A] mt-2">
                <Clock className="w-3.5 h-3.5 text-[#C89B3C]" />
                <span>Base Dispatch: {t.leadTimeDays} business days</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Postcode Surcharge Zones Table */}
      <div className="bg-white rounded-xl border border-[#E8E2D5] shadow-sm overflow-hidden">
        <div className="p-5 border-b border-[#E8E2D5] flex items-center justify-between">
          <div>
            <h2 className="text-base font-serif font-bold text-[#0B132B] flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-[#C89B3C]" />
              Regional Postcode Surcharge Matrix
            </h2>
            <p className="text-xs text-[#4F6D7A] mt-0.5">
              Prefixes are automatically matched against customer postcodes during checkout.
            </p>
          </div>
          <span className="text-xs text-[#4F6D7A]">
            Prices stored in <strong>pennies</strong>
          </span>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center items-center">
            <RefreshCw className="w-8 h-8 animate-spin text-[#C89B3C]" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#FAF8F5] text-[#0B132B] text-xs uppercase font-semibold border-b border-[#E8E2D5]">
                <tr>
                  <th className="py-3 px-4">Zone & Region</th>
                  <th className="py-3 px-4">Postcode Prefixes</th>
                  <th className="py-3 px-4">Surcharge (Pennies)</th>
                  <th className="py-3 px-4">Extra Lead Days</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2D5]">
                {zones.map((zone) => (
                  <tr key={zone.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#0B132B]">{zone.zone_name}</div>
                      <div className="text-[11px] font-mono text-[#4F6D7A]">{zone.zone_code}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="max-w-xs text-xs font-mono text-[#0B132B] bg-[#F4F1EA] px-2 py-1 rounded border border-[#E8E2D5] truncate" title={zone.prefix_list}>
                        {zone.prefix_list}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={zone.surcharge_pennies}
                          onChange={(e) =>
                            handleZoneFieldChange(
                              zone.id,
                              "surcharge_pennies",
                              parseInt(e.target.value || "0", 10)
                            )
                          }
                          className="w-24 px-2 py-1 border border-[#E8E2D5] rounded text-xs text-[#0B132B]"
                        />
                        <span className="text-xs font-medium text-[#4F6D7A]">
                          ({formatGBP(zone.surcharge_pennies)})
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          value={zone.lead_time_extra_days}
                          onChange={(e) =>
                            handleZoneFieldChange(
                              zone.id,
                              "lead_time_extra_days",
                              parseInt(e.target.value || "0", 10)
                            )
                          }
                          className="w-16 px-2 py-1 border border-[#E8E2D5] rounded text-xs text-[#0B132B]"
                        />
                        <span className="text-xs text-[#4F6D7A]">days</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() =>
                          handleZoneFieldChange(
                            zone.id,
                            "is_active",
                            zone.is_active ? 0 : 1
                          )
                        }
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          zone.is_active
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {zone.is_active ? "Active" : "Inactive"}
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleUpdateZone(zone)}
                        disabled={savingZoneId === zone.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0B132B] hover:bg-[#1C2541] text-white rounded text-xs font-medium transition-colors disabled:opacity-50"
                      >
                        {savingZoneId === zone.id ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#C89B3C]" />
                        ) : (
                          <Save className="w-3.5 h-3.5 text-[#C89B3C]" />
                        )}
                        <span>Save</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Compliance Note */}
      <div className="p-4 bg-sand-100 border border-sand-300 rounded-xl flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-brass-600 shrink-0 mt-0.5" />
        <div className="text-xs text-navy-900 leading-relaxed">
          <strong>British Furniture Safety & White Glove Protocol:</strong> All deliveries of upholstered goods include mandatory inspection for BS 5852 fire safety swing-tickets. Two-man delivery teams unpack and position into room of choice, verify door clearance, and remove all recyclable corrugated packaging.
        </div>
      </div>
    </div>
  );
}
