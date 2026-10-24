import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Phone, Mail, MessageSquare, MapPin, Clock, HelpCircle, ChevronDown } from "lucide-react";
import { getLiveSections } from "@/lib/cms-server";
import { DEFAULT_STOREFRONT_SECTIONS } from "@/lib/cms-defaults";

export const metadata: Metadata = {
  title: "Contact Concierge & UK Support | SAN Furniture",
  description:
    "Direct phone, WhatsApp, and email assistance for all order inquiries, room dimensions, and UK delivery coordination.",
  alternates: {
    canonical: "https://sanfurniture.com/contact",
  },
};

export default async function ContactPage() {
  const sections = await getLiveSections("contact_faq");
  const contact = sections?.contact_details?.content || DEFAULT_STOREFRONT_SECTIONS.contact_details?.content || {};
  const faqData = sections?.faq_list?.content || DEFAULT_STOREFRONT_SECTIONS.faq_list?.content || {};
  const faqs = Array.isArray(faqData.faqs) ? faqData.faqs : DEFAULT_STOREFRONT_SECTIONS.faq_list?.content?.faqs || [];

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
              {contact.page_title}
            </h1>
            <p className="text-sm sm:text-base text-navy-700 leading-relaxed">
              {contact.page_subtitle}
            </p>
          </div>
        </div>
      </section>

      {/* Contact Cards */}
      <section className="py-12 sm:py-16 max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Phone */}
          <div className="rounded-2xl border border-sand-200 bg-white p-6 space-y-3 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-sand-100 flex items-center justify-center text-brass-600">
              <Phone className="w-5 h-5" />
            </div>
            <h3 className="font-display text-base font-bold text-navy-950">Telephone Helpline</h3>
            <p className="text-xs text-navy-600">Direct dispatch & inquiries</p>
            <p className="text-sm font-semibold text-brass-700">{contact.phone}</p>
          </div>

          {/* Email */}
          <div className="rounded-2xl border border-sand-200 bg-white p-6 space-y-3 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-sand-100 flex items-center justify-center text-brass-600">
              <Mail className="w-5 h-5" />
            </div>
            <h3 className="font-display text-base font-bold text-navy-950">Email Concierge</h3>
            <p className="text-xs text-navy-600">Responses within 2 business hours</p>
            <p className="text-sm font-semibold text-brass-700">{contact.email}</p>
          </div>

          {/* WhatsApp */}
          <div className="rounded-2xl border border-sand-200 bg-white p-6 space-y-3 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-sand-100 flex items-center justify-center text-emerald-600">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h3 className="font-display text-base font-bold text-navy-950">WhatsApp Concierge</h3>
            <p className="text-xs text-navy-600">Quick room dimension advice</p>
            <p className="text-sm font-semibold text-emerald-700">{contact.whatsapp}</p>
          </div>

          {/* Hours */}
          <div className="rounded-2xl border border-sand-200 bg-white p-6 space-y-3 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-sand-100 flex items-center justify-center text-brass-600">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="font-display text-base font-bold text-navy-950">Operating Hours</h3>
            <p className="text-xs text-navy-600 leading-relaxed">{contact.hours}</p>
          </div>
        </div>

        {/* Warehouse Location Notice */}
        <div className="rounded-2xl border border-sand-200 bg-sand-100/70 p-6 sm:p-8 flex items-start gap-4">
          <MapPin className="w-6 h-6 text-brass-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-display text-base font-bold text-navy-950">UK Central Dispatch Warehouse</h4>
            <p className="text-xs sm:text-sm text-navy-700 leading-relaxed">{contact.warehouse_address}</p>
            <p className="text-[11px] text-navy-500 pt-1">
              Note: Warehouse visits are by prior appointment only for scheduled trade inspections.
            </p>
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
