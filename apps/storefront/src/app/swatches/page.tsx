"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ChevronRight, Sparkles, Check, Send, CheckCircle2, AlertCircle } from "lucide-react";

const SWATCH_OPTIONS = [
  { id: "boucle_ivory", name: "Warm Ivory Textured Bouclé", category: "Bouclé", colorHex: "#F5F2EB" },
  { id: "boucle_pebble", name: "Pebble Grey Bouclé", category: "Bouclé", colorHex: "#D8D6D1" },
  { id: "velvet_emerald", name: "Imperial Emerald Matte Velvet", category: "Velvet", colorHex: "#1E3F20" },
  { id: "velvet_midnight", name: "Midnight Navy Velvet", category: "Velvet", colorHex: "#101D38" },
  { id: "velvet_amber", name: "Burnt Amber Velvet", category: "Velvet", colorHex: "#A05A2C" },
  { id: "linen_natural", name: "Natural Oatmeal Belgian Linen", category: "Linen", colorHex: "#E3DAC9" },
  { id: "oak_natural", name: "Solid Natural White Oak", category: "Timber", colorHex: "#C9AA7E" },
  { id: "walnut_smoked", name: "Smoked American Walnut", category: "Timber", colorHex: "#5C4033" },
];

export default function SwatchesPage() {
  const [selected, setSelected] = useState<string[]>(["boucle_ivory", "velvet_emerald"]);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [postcode, setPostcode] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const toggleSwatch = (id: string) => {
    if (selected.includes(id)) {
      setSelected(selected.filter((s) => s !== id));
    } else {
      if (selected.length >= 5) return;
      setSelected([...selected, id]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selected.length === 0) return;
    setSubmitted(true);
  };

  return (
    <div className="bg-sand-50 min-h-screen">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="border-b border-sand-200 bg-sand-100/50">
        <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-3 flex items-center text-xs text-navy-600 gap-1.5">
          <Link href="/" className="hover:text-navy-950 transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 text-sand-400" />
          <span className="font-semibold text-navy-950">Complimentary Swatches</span>
        </div>
      </nav>

      {/* Hero */}
      <section className="border-b border-sand-200 bg-sand-100/40 py-12 sm:py-16">
        <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="max-w-2xl space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sand-200/80 text-navy-800 text-[11px] font-semibold tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5 text-brass-600" />
              Tactile Material Evaluation
            </span>
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-navy-950">
              Order Free Fabric & Timber Swatches
            </h1>
            <p className="text-sm text-navy-700 leading-relaxed">
              Experience the density of our bouclés, deep sheen of our Italian velvets, and grain of our solid European timbers before making your decision. Up to 5 complimentary swatches dispatched Royal Mail 1st Class.
            </p>
          </div>
        </div>
      </section>

      {/* Swatch Selection Grid */}
      <section className="py-12 sm:py-16 max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-navy-950">
                Select Your Samples ({selected.length}/5)
              </h2>
              <span className="text-xs text-navy-500">Select up to 5 samples free of charge</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {SWATCH_OPTIONS.map((swatch) => {
                const isSelected = selected.includes(swatch.id);
                return (
                  <button
                    key={swatch.id}
                    type="button"
                    onClick={() => toggleSwatch(swatch.id)}
                    className={`text-left rounded-2xl border p-4 transition-all relative ${
                      isSelected
                        ? "border-navy-950 bg-white shadow-md ring-2 ring-navy-950"
                        : "border-sand-200 bg-white hover:border-sand-400"
                    }`}
                  >
                    <div
                      className="w-full h-20 rounded-xl mb-3 border border-black/10 shadow-inner relative"
                      style={{ backgroundColor: swatch.colorHex }}
                    >
                      {isSelected && (
                        <span className="absolute top-2 right-2 w-5 h-5 bg-navy-950 text-sand-50 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-brass-600 block">
                      {swatch.category}
                    </span>
                    <h3 className="text-xs font-semibold text-navy-950 mt-0.5 leading-snug">
                      {swatch.name}
                    </h3>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form */}
          <div className="bg-white border border-sand-200 rounded-2xl p-6 sm:p-8 shadow-sm h-fit">
            <h3 className="font-display text-base font-bold text-navy-950">
              Delivery Details
            </h3>
            <p className="text-xs text-navy-600 mt-1 mb-5">
              Complimentary UK delivery direct to your letterbox.
            </p>

            {submitted ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 space-y-2">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                <h4 className="font-semibold text-xs">Swatches Requested!</h4>
                <p className="text-[11px] leading-relaxed">
                  Thank you, {fullName}. Your complimentary swatches have been logged and will be dispatched by Royal Mail 1st Class within 24 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-navy-900 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. John Smith"
                    className="w-full px-3.5 py-2.5 bg-sand-50/50 border border-sand-300 rounded-xl text-xs text-navy-950 focus:outline-none focus:border-brass-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-navy-900 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="client@example.co.uk"
                    className="w-full px-3.5 py-2.5 bg-sand-50/50 border border-sand-300 rounded-xl text-xs text-navy-950 focus:outline-none focus:border-brass-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-navy-900 mb-1">UK Delivery Address</label>
                  <input
                    type="text"
                    required
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                    placeholder="14 Kensington Palace Gardens"
                    className="w-full px-3.5 py-2.5 bg-sand-50/50 border border-sand-300 rounded-xl text-xs text-navy-950 focus:outline-none focus:border-brass-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-navy-900 mb-1">Postcode</label>
                  <input
                    type="text"
                    required
                    value={postcode}
                    onChange={(e) => setPostcode(e.target.value)}
                    placeholder="SW1A 1AA"
                    className="w-full px-3.5 py-2.5 bg-sand-50/50 border border-sand-300 rounded-xl text-xs text-navy-950 uppercase focus:outline-none focus:border-brass-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={selected.length === 0}
                  className="w-full py-3 bg-navy-950 text-sand-50 rounded-xl text-xs font-semibold hover:bg-navy-900 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  Order {selected.length} Free Sample{selected.length === 1 ? "" : "s"}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
