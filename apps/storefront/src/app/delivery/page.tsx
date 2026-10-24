import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Truck, Box, ShieldCheck, MapPin, Clock, ArrowRight } from "lucide-react";
import { getLiveSections } from "@/lib/cms-server";
import { DEFAULT_STOREFRONT_SECTIONS } from "@/lib/cms-defaults";

export const metadata: Metadata = {
  title: "UK Delivery Services & Surcharge Zones | SAN Furniture",
  description:
    "Explore our UK delivery tiers: Standard Parcel, Pallet, and White Glove room of choice. Full details on lead times and postcode zones.",
  alternates: {
    canonical: "https://sanfurniture.com/delivery",
  },
};

export default async function DeliveryPage() {
  const sections = await getLiveSections("delivery_returns");
  const tiers = sections?.delivery_tiers_guide?.content || DEFAULT_STOREFRONT_SECTIONS.delivery_tiers_guide?.content || {};

  return (
    <div className="bg-sand-50 min-h-screen">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="border-b border-sand-200 bg-sand-100/50">
        <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-3 flex items-center text-xs text-navy-600 gap-1.5">
          <Link href="/" className="hover:text-navy-950 transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 text-sand-400" />
          <span className="font-semibold text-navy-950">UK Delivery Guide</span>
        </div>
      </nav>

      {/* Hero */}
      <section className="border-b border-sand-200 bg-sand-100/40 py-12 sm:py-16">
        <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="max-w-3xl space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sand-200/80 text-navy-800 text-[11px] font-semibold tracking-wider uppercase">
              <Truck className="w-3.5 h-3.5 text-brass-600" />
              Specialist Furniture Fleet
            </span>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-navy-950">
              {tiers.title}
            </h1>
            <p className="text-sm sm:text-base text-navy-700 leading-relaxed pt-1">
              {tiers.lead_time_summary}
            </p>
          </div>
        </div>
      </section>

      {/* Delivery Tiers Cards */}
      <section className="py-12 sm:py-16 max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {/* Tier 1 */}
          <div className="rounded-2xl border border-sand-200 bg-white p-6 sm:p-8 space-y-4 shadow-xs">
            <div className="w-12 h-12 rounded-xl bg-sand-100 flex items-center justify-center text-brass-600">
              <Box className="w-6 h-6" />
            </div>
            <h3 className="font-display text-lg font-bold text-navy-950">{tiers.tier_1_title}</h3>
            <p className="text-xs sm:text-sm text-navy-600 leading-relaxed">{tiers.tier_1_desc}</p>
            <div className="pt-2 text-[11px] font-semibold text-navy-800">Dispatch: 1-3 business days</div>
          </div>

          {/* Tier 2 */}
          <div className="rounded-2xl border border-sand-200 bg-white p-6 sm:p-8 space-y-4 shadow-xs">
            <div className="w-12 h-12 rounded-xl bg-sand-100 flex items-center justify-center text-brass-600">
              <Truck className="w-6 h-6" />
            </div>
            <h3 className="font-display text-lg font-bold text-navy-950">{tiers.tier_2_title}</h3>
            <p className="text-xs sm:text-sm text-navy-600 leading-relaxed">{tiers.tier_2_desc}</p>
            <div className="pt-2 text-[11px] font-semibold text-navy-800">Dispatch: 3-5 business days</div>
          </div>

          {/* Tier 3 */}
          <div className="rounded-2xl border-2 border-brass-500/40 bg-sand-50/70 p-6 sm:p-8 space-y-4 shadow-xs relative">
            <span className="absolute -top-3 right-6 px-3 py-0.5 rounded-full bg-brass-500 text-navy-950 text-[10px] font-bold uppercase tracking-wider">
              Recommended
            </span>
            <div className="w-12 h-12 rounded-xl bg-brass-500/20 flex items-center justify-center text-brass-700">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-display text-lg font-bold text-navy-950">{tiers.tier_3_title}</h3>
            <p className="text-xs sm:text-sm text-navy-600 leading-relaxed">{tiers.tier_3_desc}</p>
            <div className="pt-2 text-[11px] font-semibold text-forest-700">Free standard delivery across Mainland UK</div>
          </div>
        </div>

        {/* Mainland UK Coverage & Delivery Policy */}
        <div className="mt-12 rounded-2xl border border-sand-200 bg-white p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2 text-navy-950 font-display text-lg font-bold">
            <MapPin className="w-5 h-5 text-brass-600" />
            <span>UK Mainland Delivery Coverage</span>
          </div>
          <p className="text-xs sm:text-sm text-navy-600 leading-relaxed">
            Free room of choice delivery is included on all orders for Mainland England, Wales, and Southern Scotland postcodes. Please note: We currently do not deliver outside mainland UK (including Scottish Highlands & Islands, Northern Ireland, Isle of Man, Scilly, or Channel Islands).
          </p>
        </div>
      </section>
    </div>
  );
}
