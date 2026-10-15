"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Tag, Plus, CheckCircle2, Percent, DollarSign, Calendar, ChevronRight } from "lucide-react";
import { formatGBP } from "@san-furniture/types";

export default function AdminPromotionsPage() {
  const [promotions, setPromotions] = useState([
    {
      id: "promo_bankholiday",
      code: "BANKHOLIDAY20",
      description: "Spring Bank Holiday Special: 20% off orders over £500",
      discount_type: "percentage",
      discount_value: 20,
      min_order_pennies: 50000,
      is_active: 1,
      usage_count: 14,
    },
    {
      id: "promo_welcome50",
      code: "WELCOME50",
      description: "Welcome to SAN: £50 off your first handcrafted order over £300",
      discount_type: "fixed_pennies",
      discount_value: 5000,
      min_order_pennies: 30000,
      is_active: 1,
      usage_count: 48,
    },
    {
      id: "promo_vip100",
      code: "LUXURY100",
      description: "Bespoke VIP Voucher: £100 off orders over £1,000",
      discount_type: "fixed_pennies",
      discount_value: 10000,
      min_order_pennies: 100000,
      is_active: 1,
      usage_count: 9,
    },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-navy-500 mb-1">
            <Link href="/admin" className="hover:text-navy-950">Operations Suite</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="font-semibold text-navy-900">Promotions &amp; Coupons</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-navy-950">
            UK Seasonal Promotions &amp; Voucher Engine
          </h1>
          <p className="text-xs text-navy-600 mt-1">
            Configure Bank Holiday codes, percentage discounts, and minimum order thresholds
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {promotions.map((p) => {
          const minGbp = (p.min_order_pennies / 100).toFixed(2);
          const discountLabel = p.discount_type === "percentage" ? `${p.discount_value}% OFF` : `£${(p.discount_value / 100).toFixed(2)} OFF`;

          return (
            <div key={p.id} className="p-6 rounded-2xl bg-sand-50 border border-sand-300 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-lg bg-navy-950 text-brass-400 font-mono font-bold text-sm tracking-wider">
                  {p.code}
                </span>
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                  Active
                </span>
              </div>

              <div>
                <p className="text-xs font-semibold text-navy-900 leading-snug">{p.description}</p>
                <div className="mt-3 pt-3 border-t border-sand-200 flex items-center justify-between text-xs">
                  <span className="text-navy-600">Benefit:</span>
                  <strong className="text-navy-950 font-display">{discountLabel}</strong>
                </div>
                <div className="mt-1 flex items-center justify-between text-xs">
                  <span className="text-navy-600">Minimum Spend:</span>
                  <span className="font-semibold text-navy-900">£{minGbp}</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-xs">
                  <span className="text-navy-600">Total Redeemed:</span>
                  <span className="font-mono text-navy-900 font-bold">{p.usage_count} times</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
