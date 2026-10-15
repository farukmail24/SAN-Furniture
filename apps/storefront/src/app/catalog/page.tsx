import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Sparkles } from "lucide-react";
import { CATALOG_CATEGORIES, getLiveProducts } from "@/lib/catalog";
import { CategoryView } from "@/components/catalog/CategoryView";

export const metadata: Metadata = {
  title: "All Luxury Furniture Collections | SAN Furniture UK",
  description:
    "Explore our complete collection of handcrafted British sofas, dining sets, accent armchairs, ottoman beds, and designer coffee tables. Delivered with 2-man white glove service.",
  alternates: {
    canonical: "https://sanfurniture.co.uk/catalog",
  },
  openGraph: {
    title: "All Luxury Furniture Collections | SAN Furniture UK",
    description: "Handcrafted British living furniture with free UK white glove delivery over £500.",
    url: "https://sanfurniture.co.uk/catalog",
  },
};

export default async function CatalogPage() {
  const liveProducts = await getLiveProducts();

  return (
    <div className="bg-sand-50 min-h-screen">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="border-b border-sand-200 bg-sand-100/50">
        <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-3 flex items-center text-xs text-navy-600 gap-1.5">
          <Link href="/" className="hover:text-navy-950 transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-sand-400" />
          <span className="font-semibold text-navy-950">Catalog</span>
        </div>
      </nav>

      {/* Hero Header */}
      <div className="border-b border-sand-200 bg-sand-100/30">
        <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-10 sm:py-14">
          <div className="max-w-4xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sand-200/80 text-navy-800 text-[11px] font-semibold tracking-wider uppercase mb-3">
              <Sparkles className="w-3.5 h-3.5 text-brass-600" />
              British Design Portfolio
            </span>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-navy-950 mb-4">
              The Complete Furniture Collection
            </h1>
            <p className="text-sm sm:text-base text-navy-700 leading-relaxed">
              Explore our full curation of solid hardwood dining sets, textured bouclé sofas, sculptural accent chairs, and ottoman storage beds. Every piece is rigorously tested for UK fire compliance (BS 5852) and delivered with our white-glove two-man service.
            </p>
          </div>
        </div>
      </div>

      {/* Main Filtered Product Catalog */}
      <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-8 sm:py-12">
        <CategoryView
          initialProducts={liveProducts}
          allCategories={CATALOG_CATEGORIES}
        />
      </div>
    </div>
  );
}
