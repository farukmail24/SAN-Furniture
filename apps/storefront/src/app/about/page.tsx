import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, ShieldCheck, TreePine, Award, CheckCircle2, ArrowRight } from "lucide-react";
import { getLiveSections } from "@/lib/cms-server";
import { DEFAULT_STOREFRONT_SECTIONS } from "@/lib/cms-defaults";

export const metadata: Metadata = {
  title: "About SAN Furniture | Quality Living & Modern Furniture",
  description:
    "Learn about SAN Furniture's commitment to thoughtful design, durable materials, and reliable Mainland UK delivery.",
  alternates: {
    canonical: "https://sanfurniture.com/about",
  },
};

export default async function AboutPage() {
  const sections = await getLiveSections("about");
  const hero = sections?.about_hero?.content || DEFAULT_STOREFRONT_SECTIONS.about_hero?.content || {};
  const sustainability = sections?.about_sustainability?.content || DEFAULT_STOREFRONT_SECTIONS.about_sustainability?.content || {};

  return (
    <div className="bg-sand-50 min-h-screen">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="border-b border-sand-200 bg-sand-100/50">
        <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-3 flex items-center text-xs text-navy-600 gap-1.5">
          <Link href="/" className="hover:text-navy-950 transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 text-sand-400" />
          <span className="font-semibold text-navy-950">About Us</span>
        </div>
      </nav>

      {/* Hero Showcase */}
      <section className="border-b border-sand-200 bg-navy-950 text-sand-50 py-16 sm:py-24">
        <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="max-w-3xl space-y-4">
            <span className="text-xs uppercase tracking-widest font-bold text-brass-400">
              {hero.eyebrow}
            </span>
            <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-sand-50 leading-tight">
              {hero.title}
            </h1>
            <p className="text-base sm:text-lg text-sand-200 leading-relaxed pt-2">
              {hero.story}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
              {[hero.highlight_stat_1, hero.highlight_stat_2, hero.highlight_stat_3].map((stat, i) => (
                <div key={i} className="p-4 rounded-xl bg-navy-900/90 border border-navy-800 flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span className="text-xs font-semibold text-sand-100">{stat}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Sustainability & Forestry */}
      <section className="py-16 sm:py-20 max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full text-xs font-semibold border border-emerald-200">
              <TreePine className="w-4 h-4 text-emerald-600" />
              <span>Environmental Responsibility</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-navy-950">
              {sustainability.title}
            </h2>
            <p className="text-sm sm:text-base text-navy-700 leading-relaxed">
              {sustainability.description}
            </p>
            <ul className="space-y-3 pt-2 text-xs sm:text-sm text-navy-800 font-medium">
              <li className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-brass-600 shrink-0" />
                <span>{sustainability.bullet_1}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-brass-600 shrink-0" />
                <span>{sustainability.bullet_2}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-brass-600 shrink-0" />
                <span>{sustainability.bullet_3}</span>
              </li>
            </ul>
          </div>
          <div className="rounded-2xl border border-sand-200 bg-sand-100 p-8 sm:p-12 space-y-4">
            <Award className="w-10 h-10 text-brass-600" />
            <h3 className="font-display text-xl font-bold text-navy-950">
              Quality Construction & Structural Durability
            </h3>
            <p className="text-xs sm:text-sm text-navy-700 leading-relaxed">
              Every furniture piece in our curated collection is engineered with precision joinery, durable materials, and robust finishing built for everyday home living. Designed for comfort, structural stability, and easy assembly.
            </p>
            <Link
              href="/catalog"
              className="inline-flex items-center gap-2 text-xs font-semibold text-brass-700 hover:text-brass-800 pt-2"
            >
              Browse Curated Living Collections <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
