"use client";

import Link from "next/link";
import { Shield, Sparkles, Truck, RotateCcw, Clock, CreditCard, ShieldCheck, ChevronDown } from "lucide-react";
import { usePageSections, DEFAULT_STOREFRONT_SECTIONS } from "@/lib/cms";

const ICON_MAP: Record<string, React.ElementType> = {
  Truck,
  RotateCcw,
  Shield,
  Sparkles,
  Clock,
  CreditCard,
  ShieldCheck,
};

export function Footer() {
  const { getSection } = usePageSections("footer");
  const assuranceSec = getSection("footer_assurance", DEFAULT_STOREFRONT_SECTIONS.footer_assurance.content);
  const brandSec = getSection("footer_brand_info", DEFAULT_STOREFRONT_SECTIONS.footer_brand_info.content);
  const paymentSec = getSection("footer_payment_trust", DEFAULT_STOREFRONT_SECTIONS.footer_payment_trust?.content);

  const pillars = Array.isArray(assuranceSec.content?.pillars) ? assuranceSec.content.pillars : DEFAULT_STOREFRONT_SECTIONS.footer_assurance.content.pillars;

  return (
    <footer className="bg-navy-950 text-sand-100 border-t border-navy-800">
      {/* 4 Pillars of UK Customer Confidence */}
      {assuranceSec.isEnabled && (
        <div className="border-b border-navy-800">
          {/* Mobile App 2x2 Grid */}
          <div className="sm:hidden grid grid-cols-2 gap-2.5 py-6 px-4">
            {pillars.map((item: any, idx: number) => {
              const IconComp = ICON_MAP[item.icon] || Shield;
              return (
                <div key={idx} className="p-3 rounded-xl bg-navy-900/60 border border-navy-800/80 flex flex-col justify-between">
                  <div className="w-7 h-7 rounded-lg bg-navy-800 text-brass-400 flex items-center justify-center shrink-0 mb-2">
                    <IconComp className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sand-50 font-semibold text-xs leading-tight">{item.title}</h4>
                    <p className="text-sand-400 text-[10px] mt-1 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Full Pillars Row */}
          <div className="hidden sm:grid max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 sm:grid-cols-2 lg:grid-cols-4 gap-8 py-10">
            {pillars.map((item: any, idx: number) => {
              const IconComp = ICON_MAP[item.icon] || Shield;
              return (
                <div key={idx} className="flex items-start gap-4">
                  <div className="p-3 bg-navy-900 rounded-xl text-brass-500 border border-navy-800 shrink-0">
                    <IconComp className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sand-50 font-semibold text-sm">{item.title}</h4>
                    <p className="text-sand-300 text-xs mt-1 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Mobile Accordion Links View */}
      <div className="md:hidden px-4 py-8 space-y-6">
        <div>
          <Link href="/" className="inline-block">
            <img
              src="/San-Furniture-Logo-Dark.png"
              alt="SAN Furniture UK"
              className="h-10 w-auto object-contain"
            />
          </Link>
          <p className="text-sand-400 text-xs mt-2.5 leading-relaxed">
            {brandSec.content.brand_bio || "Delivering bespoke craftsmanship, architectural aesthetics, and white-glove customer care straight to British homes."}
          </p>
        </div>

        {/* Mobile Accordion Groups */}
        <div className="space-y-3 pt-2 border-t border-navy-900">
          <details className="group border-b border-navy-900 pb-3">
            <summary className="flex items-center justify-between text-xs font-semibold text-sand-50 uppercase tracking-wider cursor-pointer list-none select-none py-1">
              <span>Living Collections</span>
              <ChevronDown className="w-4 h-4 text-brass-400 transition-transform duration-200 group-open:rotate-180" />
            </summary>
            <ul className="mt-3 space-y-2.5 text-xs text-sand-300 pl-1">
              <li><Link href="/categories/sofas" className="hover:text-brass-400 block py-0.5">Sofas & Lounges</Link></li>
              <li><Link href="/categories/sofas?type=armchairs" className="hover:text-brass-400 block py-0.5">Accent Chairs & Stools</Link></li>
              <li><Link href="/categories/dining" className="hover:text-brass-400 block py-0.5">Solid Oak Dining Sets</Link></li>
              <li><Link href="/categories/bedroom" className="hover:text-brass-400 block py-0.5">Storage Beds & Wardrobes</Link></li>
            </ul>
          </details>

          <details className="group border-b border-navy-900 pb-3">
            <summary className="flex items-center justify-between text-xs font-semibold text-sand-50 uppercase tracking-wider cursor-pointer list-none select-none py-1">
              <span>Delivery & Orders</span>
              <ChevronDown className="w-4 h-4 text-brass-400 transition-transform duration-200 group-open:rotate-180" />
            </summary>
            <ul className="mt-3 space-y-2.5 text-xs text-sand-300 pl-1">
              <li><Link href="/delivery" className="hover:text-brass-400 block py-0.5">Mainland UK Delivery Guide</Link></li>
              <li><Link href="/track-order" className="hover:text-brass-400 block py-0.5">Track Furniture Dispatch</Link></li>
              <li><Link href="/delivery" className="hover:text-brass-400 block py-0.5">Packaging & Assembly Guide</Link></li>
              <li><Link href="/account" className="hover:text-brass-400 block py-0.5">Order Status & Helpdesk</Link></li>
            </ul>
          </details>

          <details className="group border-b border-navy-900 pb-3">
            <summary className="flex items-center justify-between text-xs font-semibold text-sand-50 uppercase tracking-wider cursor-pointer list-none select-none py-1">
              <span>Quality & Living</span>
              <ChevronDown className="w-4 h-4 text-brass-400 transition-transform duration-200 group-open:rotate-180" />
            </summary>
            <ul className="mt-3 space-y-2.5 text-xs text-sand-300 pl-1">
              <li><Link href="/about" className="hover:text-brass-400 block py-0.5">About SAN Furniture</Link></li>
              <li><Link href="/delivery" className="hover:text-brass-400 block py-0.5">Furniture Care & Protection</Link></li>
              <li><Link href="/catalog" className="hover:text-brass-400 block py-0.5">Contemporary Room Inspiration</Link></li>
              <li><Link href="/privacy" className="hover:text-brass-400 block py-0.5">Terms & Privacy Policy</Link></li>
            </ul>
          </details>
        </div>

        {/* Customer Support Contact */}
        <div className="pt-2 text-xs text-sand-400">
          <p className="font-semibold text-sand-200">{brandSec.content.support_title || "Customer Support (UK)"}</p>
          <p className="mt-1">{brandSec.content.support_hours || "Monday – Friday: 09:00 – 18:00 GMT"}</p>
          <a href={`mailto:${brandSec.content.support_email || "support@sanfurniture.com"}`} className="text-brass-400 hover:underline block mt-0.5">
            {brandSec.content.support_email || "support@sanfurniture.com"}
          </a>
          {brandSec.content.support_phone && (
            <a href={`tel:${brandSec.content.support_phone.replace(/\s+/g, "")}`} className="text-brass-400 hover:underline block mt-0.5">
              {brandSec.content.support_phone}
            </a>
          )}
        </div>
      </div>

      {/* Desktop Main Footer Links */}
      <div className="hidden md:grid max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-14 grid-cols-5 gap-8">
        <div className="col-span-2">
          <Link href="/" className="inline-block">
            <img
              src="/San-Furniture-Logo-Dark.png"
              alt="SAN Furniture UK"
              className="h-14 sm:h-16 w-auto object-contain"
            />
          </Link>
          <p className="text-sand-300 text-xs mt-3 max-w-sm leading-relaxed">
            {brandSec.content.brand_bio || "Delivering bespoke craftsmanship, architectural aesthetics, and white-glove customer care straight to British homes."}
          </p>
          <div className="mt-6 text-xs text-sand-400">
            <p className="font-medium text-sand-200">{brandSec.content.support_title || "Customer Support (UK)"}</p>
            <p className="mt-1">{brandSec.content.support_hours || "Monday – Friday: 09:00 – 18:00 GMT"}</p>
            <p>{brandSec.content.support_email || "support@sanfurniture.com"}</p>
            {brandSec.content.support_phone && <p>{brandSec.content.support_phone}</p>}
          </div>
        </div>

        <div>
          <h4 className="text-sand-50 font-semibold text-xs uppercase tracking-wider">Living Collections</h4>
          <ul className="mt-4 space-y-2.5 text-xs text-sand-300">
            <li><Link href="/categories/sofas" className="hover:text-brass-400">Sofas & Lounges</Link></li>
            <li><Link href="/categories/sofas?type=armchairs" className="hover:text-brass-400">Accent Chairs & Stools</Link></li>
            <li><Link href="/categories/dining" className="hover:text-brass-400">Solid Oak Dining Sets</Link></li>
            <li><Link href="/categories/bedroom" className="hover:text-brass-400">Storage Beds & Wardrobes</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sand-50 font-semibold text-xs uppercase tracking-wider">Delivery & Orders</h4>
          <ul className="mt-4 space-y-2.5 text-xs text-sand-300">
            <li><Link href="/delivery" className="hover:text-brass-400">Mainland UK Delivery Guide</Link></li>
            <li><Link href="/track-order" className="hover:text-brass-400">Track Furniture Dispatch</Link></li>
            <li><Link href="/delivery" className="hover:text-brass-400">Packaging & Assembly Guide</Link></li>
            <li><Link href="/account" className="hover:text-brass-400">Order Status & Helpdesk</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sand-50 font-semibold text-xs uppercase tracking-wider">Quality & Living</h4>
          <ul className="mt-4 space-y-2.5 text-xs text-sand-300">
            <li><Link href="/about" className="hover:text-brass-400">About SAN Furniture</Link></li>
            <li><Link href="/delivery" className="hover:text-brass-400">Furniture Care & Protection</Link></li>
            <li><Link href="/catalog" className="hover:text-brass-400">Contemporary Room Inspiration</Link></li>
            <li><Link href="/privacy" className="hover:text-brass-400">Terms & Privacy Policy</Link></li>
          </ul>
        </div>
      </div>

      {/* Mandatory UK Companies Act and Tax Disclosures with Safe Bottom Dock Clearance */}
      <div className="border-t border-navy-900 bg-navy-950/80 pt-6 pb-28 lg:pb-8 text-[11px] text-sand-400">
        <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left">
            <p>
              © {new Date().getFullYear()} SAN Furniture. All rights reserved.
            </p>
            <p className="mt-0.5 text-sand-500">
              {(!paymentSec?.content?.positive_copy || /vat|room-of-choice|handcrafted british/i.test(paymentSec?.content?.positive_copy))
                ? "SAN Furniture UK • Contemporary Home Living, Exceptional Quality & Free Mainland Delivery."
                : paymentSec.content.positive_copy.replace(/\s*&\s*Dedicated Room-of-Choice Mainland Delivery\.?/i, " & Free Mainland Delivery.")}
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 text-sand-300 font-semibold text-[10px] sm:text-[11px]">
            {(() => {
              const STRIPE_CARDS = ["Visa", "Mastercard", "American Express", "Maestro"];
              const raw = Array.isArray(paymentSec?.content?.accepted_methods) && paymentSec.content.accepted_methods.length > 0
                ? paymentSec.content.accepted_methods
                : STRIPE_CARDS;
              const filtered = raw.filter((m: string) => !["PayPal", "Apple Pay", "Klarna", "Google Pay"].includes(m) && STRIPE_CARDS.includes(m));
              return (filtered.length > 0 ? filtered : STRIPE_CARDS).map((card: string) => (
                <span key={card} className="px-2.5 py-1 bg-navy-900 rounded border border-navy-800">
                  {card}
                </span>
              ));
            })()}
          </div>
        </div>
      </div>
    </footer>
  );
}
