"use client";

import { useState } from "react";
import { Calculator, ArrowRight, Check, HelpCircle } from "lucide-react";

export function VatCalculator() {
  const [mode, setMode] = useState<"gross" | "net">("gross");
  const [amountInput, setAmountInput] = useState<string>("500.00");

  const parsedAmount = parseFloat(amountInput) || 0;

  // UK Standard VAT Rate is 20%
  // If Gross: Net = Gross / 1.20, VAT = Gross - Net
  // If Net: VAT = Net * 0.20, Gross = Net * 1.20
  const netAmount = mode === "gross" 
    ? parsedAmount / 1.20 
    : parsedAmount;

  const vatAmount = mode === "gross" 
    ? parsedAmount - netAmount 
    : parsedAmount * 0.20;

  const grossAmount = mode === "gross" 
    ? parsedAmount 
    : parsedAmount + vatAmount;

  const formatGbp = (val: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  };

  const presets = [
    { label: "Accent Chair", value: "249.00" },
    { label: "Dining Table", value: "799.00" },
    { label: "Corner Sofa", value: "1450.00" },
    { label: "Suite Package", value: "2800.00" },
  ];

  return (
    <div className="bg-white rounded-2xl border border-sand-200 overflow-hidden shadow-sm">
      <div className="p-6 sm:p-8 border-b border-sand-100 bg-sand-50/50">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brass-100 text-brass-700 flex items-center justify-center font-bold">
              <Calculator className="w-5 h-5 text-brass-700" />
            </div>
            <div>
              <h3 className="font-display text-base sm:text-lg font-bold text-navy-950">
                Live UK 20% VAT Calculator
              </h3>
              <p className="text-xs text-navy-600">
                Calculate real-time net, gross, and HMRC VAT breakdowns for any furniture order.
              </p>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="inline-flex rounded-xl bg-sand-200/80 p-1 text-xs font-semibold text-navy-800">
            <button
              type="button"
              onClick={() => setMode("gross")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                mode === "gross"
                  ? "bg-white text-navy-950 shadow-sm"
                  : "text-navy-600 hover:text-navy-950"
              }`}
            >
              Retail Price (Gross)
            </button>
            <button
              type="button"
              onClick={() => setMode("net")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                mode === "net"
                  ? "bg-white text-navy-950 shadow-sm"
                  : "text-navy-600 hover:text-navy-950"
              }`}
            >
              Trade / Ex. VAT (Net)
            </button>
          </div>
        </div>

        {/* Input & Presets */}
        <div className="space-y-4">
          <div>
            <label htmlFor="vat-amount-input" className="block text-xs font-semibold text-navy-800 uppercase tracking-wider mb-1.5">
              {mode === "gross" ? "Enter Retail Price (£ inc. VAT)" : "Enter Trade Net Price (£ ex. VAT)"}
            </label>
            <div className="relative max-w-md">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-navy-500 font-semibold text-sm">
                £
              </span>
              <input
                id="vat-amount-input"
                type="number"
                step="0.01"
                min="0"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-2.5 bg-white border border-sand-300 rounded-xl text-sm font-semibold text-navy-950 focus:outline-none focus:ring-2 focus:ring-brass-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Presets */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-navy-500 font-medium">Quick Presets:</span>
            {presets.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => setAmountInput(preset.value)}
                className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                  amountInput === preset.value
                    ? "bg-navy-950 text-white border-navy-950"
                    : "bg-white text-navy-700 border-sand-300 hover:border-sand-400"
                }`}
              >
                {preset.label} ({formatGbp(parseFloat(preset.value))})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Calculated Breakdown Cards */}
      <div className="p-6 sm:p-8 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-sand-50 border border-sand-200">
            <span className="text-[11px] uppercase font-bold text-navy-500 tracking-wider">
              Net Goods Value (ex. VAT)
            </span>
            <div className="text-xl sm:text-2xl font-bold text-navy-950 font-display mt-1">
              {formatGbp(netAmount)}
            </div>
            <p className="text-[11px] text-navy-600 mt-1">
              Base furniture cost before taxation
            </p>
          </div>

          <div className="p-4 rounded-xl bg-brass-50/60 border border-brass-200">
            <span className="text-[11px] uppercase font-bold text-brass-800 tracking-wider">
              UK VAT @ 20.0%
            </span>
            <div className="text-xl sm:text-2xl font-bold text-brass-900 font-display mt-1">
              {formatGbp(vatAmount)}
            </div>
            <p className="text-[11px] text-brass-700 mt-1">
              HM Revenue & Customs standard rate
            </p>
          </div>

          <div className="p-4 rounded-xl bg-navy-950 text-white border border-navy-900">
            <span className="text-[11px] uppercase font-bold text-sand-300 tracking-wider">
              Total Gross Payable
            </span>
            <div className="text-xl sm:text-2xl font-bold text-sand-50 font-display mt-1">
              {formatGbp(grossAmount)}
            </div>
            <p className="text-[11px] text-sand-300 mt-1">
              All-inclusive checkout price
            </p>
          </div>
        </div>

        {/* Dynamic Formula Explanation */}
        <div className="p-4 rounded-xl bg-sand-100/70 border border-sand-200 text-xs text-navy-800 space-y-2">
          <div className="flex items-center gap-1.5 font-semibold text-navy-950">
            <HelpCircle className="w-4 h-4 text-brass-600" />
            <span>Statutory Calculation Formula:</span>
          </div>
          {mode === "gross" ? (
            <div className="font-mono text-[11px] text-navy-700 space-y-1">
              <p>Net Amount = Gross ({formatGbp(grossAmount)}) ÷ 1.20 = {formatGbp(netAmount)}</p>
              <p>VAT (20%) = Gross ({formatGbp(grossAmount)}) - Net ({formatGbp(netAmount)}) = {formatGbp(vatAmount)}</p>
            </div>
          ) : (
            <div className="font-mono text-[11px] text-navy-700 space-y-1">
              <p>VAT (20%) = Net ({formatGbp(netAmount)}) × 0.20 = {formatGbp(vatAmount)}</p>
              <p>Gross Amount = Net ({formatGbp(netAmount)}) + VAT ({formatGbp(vatAmount)}) = {formatGbp(grossAmount)}</p>
            </div>
          )}
          <p className="text-[11px] text-navy-600 pt-1 border-t border-sand-200/60">
            Every SAN Furniture tax invoice downloaded from your account dashboard mirrors this exact statutory calculation.
          </p>
        </div>
      </div>
    </div>
  );
}
