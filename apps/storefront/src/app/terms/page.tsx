import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, FileCheck, Scale, AlertCircle, ShieldAlert } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service & UK Consumer Rights | SAN Furniture",
  description: "Terms and conditions governing purchases, white-glove deliveries, warranties, and cancellations under the UK Consumer Rights Act 2015.",
};

export default function TermsPage() {
  return (
    <div className="bg-sand-50 min-h-screen">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="border-b border-sand-200 bg-sand-100/50">
        <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-3 flex items-center text-xs text-navy-600 gap-1.5">
          <Link href="/" className="hover:text-navy-950 transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 text-sand-400" />
          <span className="font-semibold text-navy-950">Terms of Service</span>
        </div>
      </nav>

      {/* Hero */}
      <section className="border-b border-sand-200 bg-sand-100/40 py-12 sm:py-16">
        <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="max-w-3xl space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sand-200/80 text-navy-800 text-[11px] font-semibold tracking-wider uppercase">
              <Scale className="w-3.5 h-3.5 text-brass-600" />
              Consumer Rights Act 2015
            </span>
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-navy-950">
              Terms & Conditions of Sale
            </h1>
            <p className="text-sm text-navy-700 leading-relaxed">
              These terms govern all orders placed with SAN Furniture Ltd for residential and commercial delivery within the United Kingdom.
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 sm:py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-navy-900 space-y-8 text-xs sm:text-sm leading-relaxed">
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-sand-200 space-y-3">
          <h2 className="font-display text-lg font-bold text-navy-950">1. Order Formation & Pricing</h2>
          <p className="text-navy-700">
            All orders placed on sanfurniture.com constitute an offer to purchase under English Law. Prices are displayed in Pounds Sterling (£ GBP) and include UK Value Added Tax (VAT) at the standard rate of 20%. Contract formation occurs upon dispatch confirmation or delivery slot allocation.
          </p>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-sand-200 space-y-3">
          <h2 className="font-display text-lg font-bold text-navy-950">2. Right of Cancellation (14-Day Cooling-Off Period)</h2>
          <p className="text-navy-700">
            Under the Consumer Contracts (Information, Cancellation and Additional Charges) Regulations 2013, you have the right to cancel your order within 14 days of receiving your goods without giving any reason. Goods must be in pristine condition, unassembled, and in original packaging for collection.
          </p>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-sand-200 space-y-3">
          <h2 className="font-display text-lg font-bold text-navy-950">3. White-Glove & Specialist Delivery</h2>
          <p className="text-navy-700">
            For items marked as two-man white-glove delivery, our logistics partners will carry items into your room of choice provided safe and clear access exists. It is the customer&apos;s responsibility to measure doorways, stairwells, and hallways prior to dispatch.
          </p>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-sand-200 space-y-3">
          <h2 className="font-display text-lg font-bold text-navy-950">4. Applicable Jurisdiction</h2>
          <p className="text-navy-700">
            These terms and any non-contractual obligations arising out of or in connection with them are governed by and construed in accordance with English Law, and subject to the exclusive jurisdiction of the Courts of England and Wales.
          </p>
        </div>
      </section>
    </div>
  );
}
