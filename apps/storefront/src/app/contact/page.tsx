import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Phone, Mail, MessageSquare, Clock, HelpCircle, Building2, Truck, ShieldCheck } from "lucide-react";
import { getLiveSections } from "@/lib/cms-server";
import { DEFAULT_STOREFRONT_SECTIONS } from "@/lib/cms-defaults";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Contact Concierge & UK Support | SAN Furniture",
  description:
    "Direct phone, WhatsApp, and email assistance for all order inquiries, room dimensions, and UK delivery coordination.",
  alternates: {
    canonical: "https://sanfurniture.com/contact",
  },
};

export default async function ContactPage() {
  const sections = await getLiveSections("contact_faq", { fresh: true });
  const contact = sections?.contact_details?.content || DEFAULT_STOREFRONT_SECTIONS.contact_details?.content || {};
  const faqData = sections?.faq_list?.content || DEFAULT_STOREFRONT_SECTIONS.faq_list?.content || {};
  const faqs = Array.isArray(faqData.faqs) ? faqData.faqs : DEFAULT_STOREFRONT_SECTIONS.faq_list?.content?.faqs || [];

  const phoneStr = contact.phone || "+4420 3150 3472";
  const emailStr = contact.email || "support@sanfurniture.com";
  const whatsappStr = contact.whatsapp || "+4420 3150 3472";
  const hoursStr = contact.hours || "Monday – Friday: 08:30 – 18:30 GMT | Saturday: 09:00 – 16:00 GMT";
  const rawAddress = contact.registered_office || contact.office_address || contact.warehouse_address || "";
  // Strip obsolete mock labels from address if present
  const cleanAddress = rawAddress
    .replace(/^SAN Furniture Logistics Hub,?\s*/i, "")
    .replace(/,\s*United Kingdom$/i, ", United Kingdom")
    .trim();

  const phoneHref = `tel:${phoneStr.replace(/[^0-9+]/g, "")}`;
  const emailHref = `mailto:${emailStr.trim()}`;
  const whatsappHref = `https://wa.me/${whatsappStr.replace(/[^0-9]/g, "")}`;

  return (
    <div className="bg-sand-50 min-h-screen">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="border-b border-sand-200 bg-sand-100/50">
        <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-3 flex items-center text-xs text-navy-600 gap-1.5">
          <Link href="/" className="hover:text-navy-950 transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 text-sand-400" />
          <span className="font-semibold text-navy-950">Contact & Support</span>
        </div>
      </nav>

      {/* Hero Header */}
      <section className="border-b border-sand-200 bg-sand-100/40 py-12 sm:py-16">
        <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="max-w-2xl space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-brass-700">
              UK Concierge Desk
            </span>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-navy-950">
              {contact.page_title || "Customer Concierge & Support Desk"}
            </h1>
            <p className="text-sm sm:text-base text-navy-700 leading-relaxed">
              {contact.page_subtitle || "Our UK support team is available Monday through Saturday to answer questions regarding orders, product specifications, or room dimensions."}
            </p>
          </div>
        </div>
      </section>

      {/* Contact Cards */}
      <section className="py-12 sm:py-16 max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 space-y-8 sm:space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Phone */}
          <a
            href={phoneHref}
            className="group rounded-2xl border border-sand-200 bg-white p-6 space-y-3 shadow-xs hover:border-brass-500 hover:shadow-md transition-all duration-200 block"
          >
            <div className="w-10 h-10 rounded-xl bg-sand-100 flex items-center justify-center text-brass-600 group-hover:bg-brass-50 group-hover:text-brass-700 transition-colors">
              <Phone className="w-5 h-5" />
            </div>
            <h3 className="font-display text-base font-bold text-navy-950">Telephone Helpline</h3>
            <p className="text-xs text-navy-600">Direct dispatch & order inquiries</p>
            <p className="text-sm font-semibold text-brass-700 group-hover:underline">{phoneStr}</p>
          </a>

          {/* Email */}
          <a
            href={emailHref}
            className="group rounded-2xl border border-sand-200 bg-white p-6 space-y-3 shadow-xs hover:border-brass-500 hover:shadow-md transition-all duration-200 block"
          >
            <div className="w-10 h-10 rounded-xl bg-sand-100 flex items-center justify-center text-brass-600 group-hover:bg-brass-50 group-hover:text-brass-700 transition-colors">
              <Mail className="w-5 h-5" />
            </div>
            <h3 className="font-display text-base font-bold text-navy-950">Email Concierge</h3>
            <p className="text-xs text-navy-600">Responses within 2 business hours</p>
            <p className="text-sm font-semibold text-brass-700 group-hover:underline">{emailStr}</p>
          </a>

          {/* WhatsApp */}
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-2xl border border-sand-200 bg-white p-6 space-y-3 shadow-xs hover:border-emerald-500 hover:shadow-md transition-all duration-200 block"
          >
            <div className="w-10 h-10 rounded-xl bg-sand-100 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-50 group-hover:text-emerald-700 transition-colors">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h3 className="font-display text-base font-bold text-navy-950">WhatsApp Concierge</h3>
            <p className="text-xs text-navy-600">Instant room dimension & spec advice</p>
            <p className="text-sm font-semibold text-emerald-700 group-hover:underline">{whatsappStr}</p>
          </a>

          {/* Hours */}
          <div className="rounded-2xl border border-sand-200 bg-white p-6 space-y-3 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-sand-100 flex items-center justify-center text-brass-600">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="font-display text-base font-bold text-navy-950">Operating Hours</h3>
            <p className="text-xs text-navy-600">Customer care availability</p>
            <p className="text-xs font-medium text-navy-900 leading-relaxed">{hoursStr}</p>
          </div>
        </div>

        {/* Operational Model & Registered Address Reassurance Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Direct UK Mainland Delivery Guarantee */}
          <div className="rounded-2xl border border-sand-200 bg-sand-100/70 p-6 sm:p-8 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-white border border-sand-200 flex items-center justify-center text-brass-600 shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <h4 className="font-display text-base font-bold text-navy-950">Direct UK Mainland Delivery</h4>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  <ShieldCheck className="w-3 h-3 mr-1" /> Verified UK Network
                </span>
              </div>
              <p className="text-xs sm:text-sm text-navy-700 leading-relaxed">
                We operate a digital-first dropship logistics model. Every piece is dispatched directly from our verified UK manufacturer & supplier distribution facilities straight to your room of choice, completely eliminating expensive high-street showroom and secondary warehouse markups.
              </p>
              <p className="text-[11px] text-navy-500 pt-0.5">
                • Standard Mainland UK delivery within 7-14 business days with scheduled tracking alerts.
              </p>
            </div>
          </div>

          {/* Registered UK Office (Correspondence Only) */}
          <div className="rounded-2xl border border-sand-200 bg-sand-100/70 p-6 sm:p-8 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-white border border-sand-200 flex items-center justify-center text-brass-600 shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="space-y-1.5">
              <h4 className="font-display text-base font-bold text-navy-950">UK Registered Office</h4>
              <p className="text-xs sm:text-sm font-medium text-navy-800 leading-relaxed">
                {cleanAddress ? (cleanAddress.includes("United Kingdom") ? cleanAddress : `${cleanAddress}, United Kingdom`) : "112 Coventry Road, Exhall, Coventry, CV7 9EU, United Kingdom"}
              </p>
              <p className="text-[11px] text-navy-500 pt-0.5">
                Official administrative and postal correspondence only. Orders and customer deliveries are handled exclusively via our scheduled insured courier service — no public warehouse visits or collections.
              </p>
            </div>
          </div>
        </div>

        {/* FAQs Section */}
        <div className="space-y-6 pt-4">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-brass-700">Immediate Answers</span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-navy-950">Frequently Asked Questions</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {faqs.map((faq: any, i: number) => (
              <div key={i} className="rounded-2xl border border-sand-200 bg-white p-6 space-y-2 shadow-xs">
                <h3 className="font-display text-sm sm:text-base font-bold text-navy-950 flex items-start gap-2">
                  <HelpCircle className="w-4 h-4 text-brass-600 shrink-0 mt-0.5" />
                  <span>{faq.question}</span>
                </h3>
                <p className="text-xs sm:text-sm text-navy-600 leading-relaxed pl-6">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
