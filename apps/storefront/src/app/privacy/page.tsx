import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, ShieldCheck, Lock, Eye, FileText, CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy & UK GDPR Compliance | SAN Furniture",
  description: "Learn how SAN Furniture Ltd protects your personal data in accordance with the UK Data Protection Act 2018 and UK GDPR.",
};

export default function PrivacyPage() {
  return (
    <div className="bg-sand-50 min-h-screen">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="border-b border-sand-200 bg-sand-100/50">
        <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-3 flex items-center text-xs text-navy-600 gap-1.5">
          <Link href="/" className="hover:text-navy-950 transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 text-sand-400" />
          <span className="font-semibold text-navy-950">UK GDPR Privacy Policy</span>
        </div>
      </nav>

      {/* Hero */}
      <section className="border-b border-sand-200 bg-sand-100/40 py-12 sm:py-16">
        <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="max-w-3xl space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sand-200/80 text-navy-800 text-[11px] font-semibold tracking-wider uppercase">
              <ShieldCheck className="w-3.5 h-3.5 text-brass-600" />
              Data Protection Act 2018 & UK GDPR
            </span>
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-navy-950">
              Privacy & Cookies Policy
            </h1>
            <p className="text-sm text-navy-700 leading-relaxed">
              SAN Furniture Ltd is committed to protecting your personal information and respecting your privacy rights across all digital touchpoints and delivery logistics.
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 sm:py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-navy-900 space-y-8 text-xs sm:text-sm leading-relaxed">
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-sand-200 space-y-4">
          <h2 className="font-display text-lg font-bold text-navy-950 flex items-center gap-2">
            <FileText className="w-5 h-5 text-brass-600" />
            1. Data Controller Details
          </h2>
          <p className="text-navy-700">
            For the purposes of the UK General Data Protection Regulation (UK GDPR) and Data Protection Act 2018, the data controller is:
          </p>
          <div className="p-4 bg-sand-50 rounded-xl border border-sand-200 text-xs text-navy-800 space-y-1">
            <p className="font-semibold">SAN Furniture</p>
            <p>Online UK Furniture Retailer • Mainland Delivery</p>
            <p>Customer Support: support@sanfurniture.com</p>
            <p>Privacy & Data Inquiries: <a href="mailto:privacy@sanfurniture.com" className="text-brass-600 underline">privacy@sanfurniture.com</a></p>
          </div>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-sand-200 space-y-4">
          <h2 className="font-display text-lg font-bold text-navy-950 flex items-center gap-2">
            <Lock className="w-5 h-5 text-brass-600" />
            2. Personal Data We Collect
          </h2>
          <p className="text-navy-700">We collect and process the following information when you interact with our website or place an order:</p>
          <ul className="list-disc pl-5 space-y-1.5 text-navy-700 text-xs sm:text-sm">
            <li><strong>Identity & Contact:</strong> Full name, billing address, delivery postcode, telephone number, and email.</li>
            <li><strong>Transactional Data:</strong> Items ordered, payment references (we never store raw credit/debit card numbers; all payments are processed under Level 1 PCI-DSS compliance via Stripe UK Gateway).</li>
            <li><strong>Logistics Coordination:</strong> Delivery access notes (e.g. lift access, floor level, parking restrictions) provided for two-man delivery fleets.</li>
          </ul>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-sand-200 space-y-4">
          <h2 className="font-display text-lg font-bold text-navy-950 flex items-center gap-2">
            <Eye className="w-5 h-5 text-brass-600" />
            3. Your Legal Rights Under UK GDPR
          </h2>
          <p className="text-navy-700">You have statutory rights under UK data protection legislation, including:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-navy-800">
            <div className="p-3 bg-sand-50 rounded-xl border border-sand-200">
              <strong>Right to Access:</strong> Request a copy of your personal data at zero administrative fee.
            </div>
            <div className="p-3 bg-sand-50 rounded-xl border border-sand-200">
              <strong>Right to Rectification:</strong> Request correction of inaccurate personal records.
            </div>
            <div className="p-3 bg-sand-50 rounded-xl border border-sand-200">
              <strong>Right to Erasure (&quot;Right to be Forgotten&quot;):</strong> Request deletion of your account.
            </div>
            <div className="p-3 bg-sand-50 rounded-xl border border-sand-200">
              <strong>Right to Object:</strong> Opt-out of marketing communications at any time.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
