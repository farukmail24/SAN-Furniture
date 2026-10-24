import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, RotateCcw, ShieldCheck, FileText, CheckCircle2 } from "lucide-react";
import { getLiveSections } from "@/lib/cms-server";
import { DEFAULT_STOREFRONT_SECTIONS } from "@/lib/cms-defaults";

export const metadata: Metadata = {
  title: "Returns & Customer Resolution Policy | SAN Furniture",
  description:
    "Clear, straightforward customer resolution and collection process for SAN Furniture orders across Mainland UK.",
  alternates: {
    canonical: "https://sanfurniture.com/returns",
  },
};

export default async function ReturnsPage() {
  const sections = await getLiveSections("delivery_returns");
  const returns = sections?.returns_policy?.content || DEFAULT_STOREFRONT_SECTIONS.returns_policy?.content || {};

  return (
    <div className="bg-sand-50 min-h-screen">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="border-b border-sand-200 bg-sand-100/50">
        <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-3 flex items-center text-xs text-navy-600 gap-1.5">
          <Link href="/" className="hover:text-navy-950 transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 text-sand-400" />
          <span className="font-semibold text-navy-950">Returns Policy</span>
        </div>
      </nav>

      <section className="py-12 sm:py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="space-y-3 text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sand-200/80 text-navy-800 text-[11px] font-semibold tracking-wider uppercase">
            <RotateCcw className="w-3.5 h-3.5 text-brass-600" />
            Customer Care &amp; Support
          </span>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-navy-950">
            {returns.title}
          </h1>
          <p className="text-sm sm:text-base text-navy-600 max-w-2xl mx-auto leading-relaxed">
            {returns.cooling_off_notice}
          </p>
        </div>

        <div className="rounded-2xl border border-sand-200 bg-white p-6 sm:p-10 space-y-6 shadow-xs">
          <div className="space-y-3">
            <h2 className="font-display text-lg font-bold text-navy-950 flex items-center gap-2">
              <FileText className="w-5 h-5 text-brass-600" />
              <span>How To Book A Collection</span>
            </h2>
            <p className="text-xs sm:text-sm text-navy-700 leading-relaxed">
              {returns.collection_procedure}
            </p>
          </div>

          <div className="space-y-3 pt-4 border-t border-sand-100">
            <h2 className="font-display text-lg font-bold text-navy-950 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-brass-600" />
              <span>Return Conditions & Refund Timeline</span>
            </h2>
            <p className="text-xs sm:text-sm text-navy-700 leading-relaxed">
              {returns.condition_requirement}
            </p>
          </div>

          <div className="pt-6 border-t border-sand-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-navy-600">
              Need assistance? Email our returns desk at <span className="font-semibold text-navy-900">support@sanfurniture.com</span>
            </div>
            <Link
              href="/contact"
              className="px-5 py-2.5 rounded-xl bg-navy-950 text-sand-50 text-xs font-semibold hover:bg-navy-900 transition-colors"
            >
              Contact Support Desk
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
