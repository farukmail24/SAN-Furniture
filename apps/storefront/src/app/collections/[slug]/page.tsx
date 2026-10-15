import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronRight,
  ShieldCheck,
  Truck,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  BookOpen,
} from "lucide-react";
import { CATALOG_PRODUCTS, CATALOG_CATEGORIES } from "@/lib/catalog";
import { CategoryView } from "@/components/catalog/CategoryView";
import {
  PROGRAMMATIC_COLLECTIONS,
  type ProgrammaticPageDefinition,
} from "../../../../../backend/src/modules/seo/services/programmatic-seo-engine";

interface CollectionPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  return PROGRAMMATIC_COLLECTIONS.map((c) => ({
    slug: c.slug,
  }));
}

export async function generateMetadata({
  params,
}: CollectionPageProps): Promise<Metadata> {
  const { slug } = await params;
  const collection = PROGRAMMATIC_COLLECTIONS.find((c) => c.slug === slug);

  if (!collection) {
    return {
      title: "Collection Not Found | SAN Furniture",
    };
  }

  // Thin content check
  const matchingProducts = CATALOG_PRODUCTS.filter((p) => {
    const matchCat = p.categoryId.includes(collection.categoryHandle);
    const matchMat = collection.materialFilter
      ? p.specs.material === collection.materialFilter
      : true;
    return matchCat && matchMat;
  });

  const isIndexable = matchingProducts.length >= 1;

  return {
    title: collection.title,
    description: collection.metaDescription,
    alternates: {
      canonical: isIndexable
        ? `https://sanfurniture.co.uk/collections/${collection.slug}`
        : `https://sanfurniture.co.uk/categories/${collection.categoryHandle}`,
    },
    robots: {
      index: isIndexable,
      follow: true,
    },
    openGraph: {
      title: collection.title,
      description: collection.metaDescription,
      url: `https://sanfurniture.co.uk/collections/${collection.slug}`,
      type: "website",
    },
  };
}

export default async function ProgrammaticCollectionPage({
  params,
}: CollectionPageProps) {
  const { slug } = await params;
  const collection = PROGRAMMATIC_COLLECTIONS.find((c) => c.slug === slug);

  if (!collection) {
    notFound();
  }

  const matchingProducts = CATALOG_PRODUCTS.filter((p) => {
    const matchCat = p.categoryId.includes(collection.categoryHandle);
    const matchMat = collection.materialFilter
      ? p.specs.material === collection.materialFilter
      : true;
    return matchCat && matchMat;
  });

  // Breadcrumbs Schema.org
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://sanfurniture.co.uk",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Collections",
        item: "https://sanfurniture.co.uk/catalog",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: collection.headline,
        item: `https://sanfurniture.co.uk/collections/${collection.slug}`,
      },
    ],
  };

  // FAQPage Schema.org
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: collection.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <div className="bg-sand-50 min-h-screen">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="border-b border-sand-200 bg-sand-100/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center text-xs text-navy-600 gap-1.5 flex-wrap">
          <Link href="/" className="hover:text-navy-950 transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-sand-400" />
          <Link href="/catalog" className="hover:text-navy-950 transition-colors">
            Collections
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-sand-400" />
          <span className="font-semibold text-navy-950">{collection.headline}</span>
        </div>
      </nav>

      {/* Editorial Collection Hero Banner */}
      <div className="border-b border-sand-200 bg-sand-100/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sand-200/80 text-navy-800 text-[11px] font-semibold tracking-wider uppercase mb-3">
              <Sparkles className="w-3.5 h-3.5 text-brass-600" />
              Curated Buyer Guide &amp; Portfolio
            </span>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-navy-950 mb-4">
              {collection.headline}
            </h1>
            <p className="text-sm sm:text-base text-navy-700 leading-relaxed">
              {collection.buyerGuideSummary}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs text-navy-800 font-medium pt-4">
              <span className="flex items-center gap-1.5 text-sage-700">
                <Truck className="w-4 h-4 text-brass-600" />
                Free UK 2-Man Delivery on Orders Over £500
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-forest-700" />
                BS 5852 Fire Safety Guaranteed
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Filtered Product Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <CategoryView
          initialProducts={matchingProducts}
          allCategories={CATALOG_CATEGORIES}
        />
      </div>

      {/* Material Care Guide & Editorial Section */}
      <div className="border-t border-sand-200 bg-sand-100/50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {/* Care advice */}
            <div className="p-6 rounded-xl bg-sand-50 border border-sand-200 space-y-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-brass-600" />
                <h3 className="font-display text-base font-bold text-navy-950">
                  Care &amp; Longevity Guide
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-navy-700 leading-relaxed">
                {collection.careAdvice}
              </p>
            </div>

            {/* Guarantees */}
            <div className="p-6 rounded-xl bg-sand-50 border border-sand-200 space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-forest-700" />
                <h3 className="font-display text-base font-bold text-navy-950">
                  British Craftsmanship Guarantee
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-navy-700 leading-relaxed">
                Every frame in our collection is backed by our 10-year structural warranty and complies strictly with the Furniture and Furnishings (Fire Safety) Regulations 1988.
              </p>
            </div>
          </div>

          {/* Interactive FAQ Section */}
          {collection.faqs.length > 0 && (
            <div className="mt-12 pt-8 border-t border-sand-200 max-w-3xl">
              <div className="flex items-center gap-2 mb-6">
                <HelpCircle className="w-5 h-5 text-brass-600" />
                <h3 className="font-display text-xl font-bold text-navy-950">
                  Frequently Asked Questions
                </h3>
              </div>

              <div className="space-y-4">
                {collection.faqs.map((faq, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-lg bg-sand-50 border border-sand-200 text-xs sm:text-sm"
                  >
                    <h4 className="font-bold text-navy-950 mb-1.5">
                      {faq.question}
                    </h4>
                    <p className="text-navy-700 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
