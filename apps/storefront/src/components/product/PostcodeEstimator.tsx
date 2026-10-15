"use client";

import React, { useState } from "react";
import { Truck, MapPin, CheckCircle2, AlertCircle, Info, Calendar } from "lucide-react";
import { classifyUKPostcode, type UKPostcodeZone, type DeliveryTier } from "@san-furniture/types";

interface PostcodeEstimatorProps {
  deliveryTier: DeliveryTier;
  leadTimeDays: number;
}

export function PostcodeEstimator({ deliveryTier, leadTimeDays }: PostcodeEstimatorProps) {
  const [postcode, setPostcode] = useState("");
  const [searchedZone, setSearchedZone] = useState<UKPostcodeZone | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCheck = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = postcode.trim().toUpperCase();

    if (!clean) {
      setErrorMsg("Please enter a valid UK postcode.");
      setSearchedZone(null);
      return;
    }

    // Basic UK postcode regex validation
    const ukRegex = /^[A-Z]{1,2}[0-9][0-9A-Z]?\s?[0-9][A-Z]{2}$/i;
    if (!ukRegex.test(clean) && clean.length < 3) {
      setErrorMsg("Please enter a valid UK postcode format (e.g. SW1A 1AA or IV1 2AB).");
      setSearchedZone(null);
      return;
    }

    setErrorMsg(null);
    const zone = classifyUKPostcode(clean);
    setSearchedZone(zone);
  };

  const getTierLabel = (tier: DeliveryTier) => {
    switch (tier) {
      case "two_man_white_glove":
        return "2-Man White Glove (Room of Choice + Packaging Removal)";
      case "pallet":
        return "Kerbside Pallet Delivery (Protected Wooden Crate)";
      case "standard_parcel":
        return "Tracked Parcel Courier (DPD / Parcelforce)";
    }
  };

  return (
    <div className="rounded-xl border border-sand-300 bg-sand-100/40 p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-sand-200 pb-3">
        <div className="flex items-center gap-2">
          <Truck className="w-5 h-5 text-brass-600" />
          <h3 className="font-display text-base font-bold text-navy-950">
            UK Postcode Delivery Estimator
          </h3>
        </div>
        <span className="text-[11px] font-semibold text-forest-700 bg-forest-50 px-2 py-0.5 rounded border border-forest-200">
          UK Mainland & Regions
        </span>
      </div>

      <div className="text-xs text-navy-700">
        <p>
          Service Tier: <strong>{getTierLabel(deliveryTier)}</strong>
        </p>
      </div>

      {/* Input Field */}
      <form onSubmit={handleCheck} className="flex gap-2">
        <div className="relative flex-1">
          <MapPin className="w-4 h-4 text-navy-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={postcode}
            onChange={(e) => {
              setPostcode(e.target.value.toUpperCase());
              if (errorMsg) setErrorMsg(null);
            }}
            placeholder="e.g. SW1A 1AA, M1 1AE, IV1 2AB"
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-sand-300 bg-sand-50 text-navy-950 placeholder:text-navy-400 focus:outline-none focus:ring-2 focus:ring-brass-500 font-mono uppercase"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-navy-950 text-sand-50 rounded-lg text-xs font-semibold hover:bg-brass-600 transition-colors flex-shrink-0"
        >
          Check
        </button>
      </form>

      {/* Quick Example Postcodes */}
      <div className="flex items-center gap-2 text-[11px] text-navy-500 flex-wrap">
        <span>Examples:</span>
        <button
          type="button"
          onClick={() => {
            setPostcode("SW1A 1AA");
            setSearchedZone(classifyUKPostcode("SW1A1AA"));
          }}
          className="hover:underline text-navy-800"
        >
          London (SW1A)
        </button>
        <span>•</span>
        <button
          type="button"
          onClick={() => {
            setPostcode("EH1 1YZ");
            setSearchedZone(classifyUKPostcode("EH11YZ"));
          }}
          className="hover:underline text-navy-800"
        >
          Edinburgh (EH1)
        </button>
        <span>•</span>
        <button
          type="button"
          onClick={() => {
            setPostcode("IV1 1AA");
            setSearchedZone(classifyUKPostcode("IV11AA"));
          }}
          className="hover:underline text-navy-800"
        >
          Highlands (IV1)
        </button>
        <span>•</span>
        <button
          type="button"
          onClick={() => {
            setPostcode("BT1 1AA");
            setSearchedZone(classifyUKPostcode("BT11AA"));
          }}
          className="hover:underline text-navy-800"
        >
          Belfast (BT1)
        </button>
      </div>

      {errorMsg && (
        <p className="text-xs text-brick-600 flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5" />
          {errorMsg}
        </p>
      )}

      {/* Live Result Cards */}
      {searchedZone && (
        <div className="pt-2 animate-fade-in">
          {searchedZone === "zone_1_mainland" && (
            <div className="p-3.5 rounded-lg bg-forest-50/70 border border-forest-200 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-forest-900">
                <CheckCircle2 className="w-4 h-4 text-forest-600" />
                <span>Zone 1: Mainland UK Delivery Available</span>
              </div>
              <p className="text-forest-800">
                Eligible for <strong>Free 2-Man White Glove Delivery</strong> on orders over £500.
              </p>
              <div className="flex items-center gap-1 text-forest-700 font-medium pt-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>Estimated dispatch & delivery: {leadTimeDays} - {leadTimeDays + 3} business days.</span>
              </div>
            </div>
          )}

          {searchedZone === "zone_2_scottish_highlands" && (
            <div className="p-3.5 rounded-lg bg-amber-50/80 border border-amber-200 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-950">
                <Info className="w-4 h-4 text-amber-700" />
                <span>Zone 2: Scottish Highlands</span>
              </div>
              <p className="text-amber-900">
                Delivery available via specialized regional freight. Standard £49 regional surcharge applies.
              </p>
              <div className="flex items-center gap-1 text-amber-800 font-medium pt-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>Estimated delivery: {leadTimeDays + 3} - {leadTimeDays + 6} business days.</span>
              </div>
            </div>
          )}

          {searchedZone === "zone_3_scottish_islands" && (
            <div className="p-3.5 rounded-lg bg-amber-50/80 border border-amber-200 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-950">
                <Info className="w-4 h-4 text-amber-700" />
                <span>Zone 3: Scottish Offshore Islands</span>
              </div>
              <p className="text-amber-900">
                Requires ferry logistics. £69 regional maritime surcharge applies.
              </p>
              <div className="flex items-center gap-1 text-amber-800 font-medium pt-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>Estimated delivery: 7 - 14 business days.</span>
              </div>
            </div>
          )}

          {searchedZone === "zone_4_northern_ireland" && (
            <div className="p-3.5 rounded-lg bg-blue-50/80 border border-blue-200 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-blue-950">
                <Info className="w-4 h-4 text-blue-700" />
                <span>Zone 4: Northern Ireland</span>
              </div>
              <p className="text-blue-900">
                Irish Sea freight delivery available. £59 logistics surcharge applies at checkout.
              </p>
              <div className="flex items-center gap-1 text-blue-800 font-medium pt-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>Estimated transit: 6 - 10 business days.</span>
              </div>
            </div>
          )}

          {searchedZone === "zone_5_uk_offshore" && (
            <div className="p-3.5 rounded-lg bg-amber-50/80 border border-amber-200 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-950">
                <Info className="w-4 h-4 text-amber-700" />
                <span>Zone 5: UK Offshore (Isle of Man & Scilly)</span>
              </div>
              <p className="text-amber-900">
                Island transit delivery available. Surcharge calculated at checkout.
              </p>
            </div>
          )}

          {searchedZone === "zone_excluded" && (
            <div className="p-3.5 rounded-lg bg-sand-200 border border-sand-300 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-navy-950">
                <AlertCircle className="w-4 h-4 text-navy-700" />
                <span>Channel Islands (Jersey / Guernsey)</span>
              </div>
              <p className="text-navy-700">
                Automated online checkout is not supported for Channel Islands. Please contact our concierge team for custom private logistics.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
