import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, ShieldCheck, CheckCircle2, Award, Sparkles, Box, Hammer } from "lucide-react";

export const metadata: Metadata = {
  title: "Furniture Quality Standards & Home Care Guide | SAN Furniture",
  description: "Learn how SAN Furniture ensures structural durability, reinforced protective packaging, and everyday furniture maintenance.",
};

export default function FurnitureQualityAndCarePage() {
  return (
    <div className="bg-sand-50 min-h-screen">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="border-b border-sand-200 bg-sand-100/50">
        <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-3 flex items-center text-xs text-navy-600 gap-1.5">
          <Link href="/" className="hover:text-navy-950 transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 text-sand-400" />
          <span className="font-semibold text-navy-950">Furniture Quality &amp; Care</span>
        </div>
      </nav>

      {/* Hero */}
      <section className="border-b border-sand-200 bg-sand-100/40 py-12 sm:py-16">
        <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="max-w-3xl space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sand-200/80 text-navy-800 text-[11px] font-semibold tracking-wider uppercase">
              <ShieldCheck className="w-3.5 h-3.5 text-forest-600" />
              Quality Standards &amp; Maintenance
            </span>
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-navy-950">
              Furniture Durability &amp; Home Care Guide
            </h1>
            <p className="text-sm text-navy-700 leading-relaxed">
              Every dining set, wardrobe, storage chest, and living piece at SAN Furniture is engineered for structural durability, everyday ease of assembly, and long-lasting beauty in modern homes.
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 sm:py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-navy-900 space-y-8 text-xs sm:text-sm leading-relaxed">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-sand-200 space-y-3 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-sand-100 text-brass-600 flex items-center justify-center">
              <Hammer className="w-5 h-5" />
            </div>
            <h3 className="font-display text-sm font-bold text-navy-950">Durable Joinery &amp; Hardware</h3>
            <p className="text-xs text-navy-600">
              Engineered with reinforced metal fittings, smooth drawer runners, and stable hardwood frames built for everyday family use.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-sand-200 space-y-3 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-sand-100 text-brass-600 flex items-center justify-center">
              <Box className="w-5 h-5 text-brass-600" />
            </div>
            <h3 className="font-display text-sm font-bold text-navy-950">Reinforced Packaging</h3>
            <p className="text-xs text-navy-600">
              Shipped in heavy-duty multi-layer corrugated boxes with high-density corner protectors to safeguard your pieces throughout transit.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-sand-200 space-y-3 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-sand-100 text-brass-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-brass-600" />
            </div>
            <h3 className="font-display text-sm font-bold text-navy-950">Easy Home Maintenance</h3>
            <p className="text-xs text-navy-600">
              Surfaces are sealed with protective finishes that simply require a quick wipe with a clean, soft cloth to maintain their lustre.
            </p>
          </div>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-sand-200 space-y-4">
          <h2 className="font-display text-lg font-bold text-navy-950">
            Care &amp; Preservation Tips
          </h2>
          <ul className="list-disc pl-5 space-y-2 text-navy-700 text-xs sm:text-sm">
            <li><strong>Wood &amp; Veneer Surfaces:</strong> Dust regularly with a dry, lint-free cloth. Avoid harsh abrasive cleaners or ammonia-based sprays.</li>
            <li><strong>Heat &amp; Moisture Protection:</strong> Use coasters or placemats under hot beverages and plates to protect surface finishes from thermal shock.</li>
            <li><strong>Sunlight Positioning:</strong> Avoid placing delicate finishes directly next to intense heat sources or prolonged direct UV exposure.</li>
          </ul>
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2.5 mt-4">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>All SAN Furniture collections are covered by a full 12-month manufacturer warranty against manufacturing and structural defects.</span>
          </div>
        </div>
      </section>
    </div>
  );
}
