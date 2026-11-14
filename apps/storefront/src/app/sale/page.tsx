import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Percent, ShieldCheck, Truck, Sparkles } from "lucide-react";
import { CATALOG_CATEGORIES, getLiveProducts } from "@/lib/catalog";
import { CategoryView } from "@/components/catalog/CategoryView";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Furniture Sale & Clearance | Up to 40% Off | SAN Furniture UK",
  description:
    "Discover seasonal showroom discounts and clearance offers on handcrafted sofas, solid oak dining tables, ottoman beds, and Scandinavian office desks. Includes free UK mainland delivery and 20% VAT.",
  alternates: {
    canonical: "https://sanfurniture.com/sale",
  },
  openGraph: {
    title: "Furniture Sale & Warehouse Clearance | SAN Furniture UK",
    description: "Limited UK warehouse allocation on handcrafted furniture with direct mainland UK delivery.",
    url: "https://sanfurniture.com/sale",
    images: [
      {
        url: "https://images.unsplash.com/photo-1532372320572-cda25653a26d?auto=format&fit=crop&w=1200&q=85",
        width: 1200,
        height: 630,
        alt: "SAN Furniture Sale & Clearance",
      },
    ],
  },
};

interface SalePageProps {
  searchParams?: Promise<{
    [key: string]: string | string[] | undefined;
  }>;
}

export default async function SalePage({ searchParams }: SalePageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const liveProducts = await getLiveProducts();

  // Pre-seed with filter: "sale" so the Sale toggle is active by default
  const mergedSearchParams = {
    filter: "sale",
    ...resolvedSearchParams,
  };

  return (
    <div className="bg-sand-50 min-h-screen">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="border-b border-sand-200 bg-sand-100/50">
        <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-3 flex items-center text-xs text-navy-600 gap-1.5">
          <Link href="/" className="hover:text-navy-950 transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-sand-400" />
          <Link href="/catalog" className="hover:text-navy-950 transition-colors">
            Collections
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-sand-400" />
          <span className="font-semibold text-navy-950">Sale & Clearance</span>
        </div>
      </nav>

      {/* Sale Hero Banner */}
      <div className="relative border-b border-sand-200 overflow-hidden bg-navy-950 text-sand-50">
        <div className="absolute inset-0 z-0 opacity-20">
          <img
            src="https://images.unsplash.com/photo-1532372320572-cda25653a26d?auto=format&fit=crop&w=1600&q=85"
            alt="Showroom Clearance"
            fetchPriority="high"
            decoding="async"
            className="w-full h-full object-cover filter brightness-75"
          />
        </div>
        <div className="relative z-10 max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-12 sm:py-16">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-terracotta-700/80 text-white text-[11px] font-bold tracking-widest uppercase mb-3 border border-terracotta-600/50">
              <Percent className="w-3.5 h-3.5" />
              Limited UK Warehouse Allocation
            </span>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-sand-50 mb-4">
              Furniture Sale & Warehouse Clearance
            </h1>
            <p className="text-sm sm:text-base text-sand-200 leading-relaxed mb-6">
              Explore authentic showroom markdowns and warehouse clearance pieces across British bouclé sofas, solid oak extending dining tables, luxury ottoman beds, and Scandinavian desks. All items include 20% UK VAT with direct tracked mainland delivery.
            </p>

            {/* Quick Reassurances */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-sand-300 font-medium pt-2">
              <span className="flex items-center gap-1.5 text-terracotta-300 font-semibold">
                <Sparkles className="w-4 h-4 text-terracotta-400" />
                Savings Up to 40% Off RRP
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5 text-sage-400">
                <Truck className="w-4 h-4" />
                Free Mainland UK Delivery on Orders £500+
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5 text-sand-200">
                <ShieldCheck className="w-4 h-4 text-brass-400" />
                Statutory UK Quality Checked
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Filtered Product Catalog */}
      <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-8 sm:py-12">
        <CategoryView
          key={`sale-${JSON.stringify(mergedSearchParams)}`}
          initialProducts={liveProducts}
          allCategories={CATALOG_CATEGORIES}
          initialSearchParams={mergedSearchParams}
          hideHeaderBanner={true}
        />
      </div>
    </div>
  );
}
