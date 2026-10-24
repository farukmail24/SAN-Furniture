import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Receipt, CheckCircle2, FileText, Globe, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Pricing Transparency & Order Invoicing | SAN Furniture",
  description: "Clear and transparent pricing on all home furniture. Zero hidden delivery fees across Mainland UK with itemised digital order receipts.",
};

export default function PricingTransparencyPage() {
  return (
    <div className="bg-sand-50 min-h-screen">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="border-b border-sand-200 bg-sand-100/50">
        <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-3 flex items-center text-xs text-navy-600 gap-1.5">
          <Link href="/" className="hover:text-navy-950 transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 text-sand-400" />
          <span className="font-semibold text-navy-950">Pricing &amp; Invoicing Transparency</span>
        </div>
      </nav>

      {/* Hero */}
      <section className="border-b border-sand-200 bg-sand-100/40 py-12 sm:py-16">
        <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="max-w-3xl space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sand-200/80 text-navy-800 text-[11px] font-semibold tracking-wider uppercase">
              <Receipt className="w-3.5 h-3.5 text-brass-600" />
              Transparent Pricing
            </span>
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-navy-950">
              Pricing Transparency &amp; Invoicing
            </h1>
            <p className="text-sm text-navy-700 leading-relaxed">
              At SAN Furniture, what you see is what you pay. We are committed to straightforward, honest pricing across our entire catalogue with zero unexpected fees at checkout.
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 sm:py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-navy-900 space-y-8 text-xs sm:text-sm leading-relaxed">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-sand-200 space-y-3 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-sand-100 text-brass-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-forest-700" />
            </div>
            <h3 className="font-display text-base font-bold text-navy-950">Zero Hidden Surcharges</h3>
            <p className="text-xs text-navy-600">
              Prices displayed for every sofa, dining table, and bedroom piece are complete. Standard delivery across Mainland UK is included free of charge with no hidden handling fees.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-sand-200 space-y-3 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-sand-100 text-brass-600 flex items-center justify-center">
              <FileText className="w-5 h-5 text-brass-600" />
            </div>
            <h3 className="font-display text-base font-bold text-navy-950">Itemised Digital Receipts</h3>
            <p className="text-xs text-navy-600">
              Upon successful order authorization, an official digital receipt containing order numbers, line items, chosen finishes, and delivery details is immediately emailed to you.
            </p>
          </div>
        </div>

        {/* Customer Care Box */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-sand-200 space-y-4">
          <h2 className="font-display text-lg font-bold text-navy-950 flex items-center gap-2">
            <Globe className="w-5 h-5 text-brass-600" />
            Mainland UK Logistics &amp; Inquiries
          </h2>
          <p className="text-navy-700">
            For retail customers and trade clients alike, we ensure all transactions are clear, secure, and fully traceable through our customer portal.
          </p>
          <div className="p-4 bg-sand-50 rounded-xl border border-sand-200 text-xs space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-forest-600 shrink-0" />
              <span>Full order tracking accessible 24/7 via the <Link href="/track-order" className="text-brass-600 font-semibold underline">Track Order</Link> portal.</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-forest-600 shrink-0" />
              <span>Dedicated customer care desk available Monday through Friday (09:00 - 18:00 GMT).</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
