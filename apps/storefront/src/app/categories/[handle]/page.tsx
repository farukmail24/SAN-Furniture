import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, ShieldCheck, Truck } from "lucide-react";
import {
  CATALOG_CATEGORIES,
  getCategoryByHandle,
  getLiveProductsByCategory,
} from "@/lib/catalog";
import { CategoryView } from "@/components/catalog/CategoryView";

interface CategoryPageProps {
  params: Promise<{
    handle: string;
  }>;
}

export async function generateStaticParams() {
  return CATALOG_CATEGORIES.map((category) => ({
    handle: category.handle,
  }));
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { handle } = await params;
  const category = getCategoryByHandle(handle);

  if (!category) {
    return {
      title: "Category Not Found | SAN Furniture",
    };
  }

  return {
    title: `${category.name} | Luxury UK Furniture | SAN Furniture`,
    description: category.description,
    alternates: {
      canonical: `https://sanfurniture.com/categories/${category.handle}`,
    },
    openGraph: {
      title: `${category.name} | SAN Furniture UK`,
      description: category.description,
      images: [
        {
          url: category.heroImage,
          width: 1200,
          height: 630,
          alt: category.name,
        },
      ],
    },
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { handle } = await params;
  const category = getCategoryByHandle(handle);

  if (!category) {
    notFound();
  }

  const products = await getLiveProductsByCategory(category.id);

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
          <span className="font-semibold text-navy-950">{category.name}</span>
        </div>
      </nav>

      {/* Category Hero Banner */}
      <div className="relative border-b border-sand-200 overflow-hidden bg-navy-950 text-sand-50">
        <div className="absolute inset-0 z-0 opacity-25">
          <img
            src={category.heroImage}
            alt={category.name}
            className="w-full h-full object-cover filter brightness-75"
          />
        </div>
        <div className="relative z-10 max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-12 sm:py-16">
          <div className="max-w-2xl">
            <span className="text-[11px] font-bold uppercase tracking-widest text-brass-400 block mb-2">
              Curated UK Collection
            </span>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-sand-50 mb-4">
              {category.name}
            </h1>
            <p className="text-sm sm:text-base text-sand-200 leading-relaxed mb-6">
              {category.description}
            </p>

            {/* Quick Guarantees */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-sand-300 font-medium pt-2">
              <span className="flex items-center gap-1.5 text-sage-400">
                <Truck className="w-4 h-4" />
                Free 2-Man Delivery on orders £500+
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5 text-sand-200">
                <ShieldCheck className="w-4 h-4 text-brass-400" />
                BS 5852 Fire Safety Verified
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Filtered Product Grid */}
      <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-8 sm:py-12">
        <CategoryView
          category={category}
          initialProducts={products}
          allCategories={CATALOG_CATEGORIES}
        />
      </div>
    </div>
  );
}
