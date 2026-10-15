import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  Sparkles,
  Award,
  CheckCircle2,
  FileCheck2,
} from "lucide-react";
import {
  CATALOG_CATEGORIES,
  getLiveProductByHandle,
  getLiveProducts,
  getLiveProductsByCategory,
} from "@/lib/catalog";
import { ProductGallery } from "@/components/product/ProductGallery";
import { DimensionsClearance } from "@/components/product/DimensionsClearance";
import { PostcodeEstimator } from "@/components/product/PostcodeEstimator";
import { ProductActions } from "@/components/product/ProductActions";
import { formatGBP } from "@san-furniture/types";

interface ProductPageProps {
  params: Promise<{
    handle: string;
  }>;
}

export async function generateStaticParams() {
  const products = await getLiveProducts();
  return products.map((product) => ({
    handle: product.handle,
  }));
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { handle } = await params;
  const product = await getLiveProductByHandle(handle);

  if (!product) {
    return {
      title: "Product Not Found | SAN Furniture",
    };
  }

  const category = CATALOG_CATEGORIES.find((c) => c.id === product.categoryId);

  return {
    title: `${product.title} | Luxury UK Furniture | SAN Furniture`,
    description: product.description,
    alternates: {
      canonical: `https://sanfurniture.co.uk/products/${product.handle}`,
    },
    openGraph: {
      title: `${product.title} | SAN Furniture UK`,
      description: product.description,
      url: `https://sanfurniture.co.uk/products/${product.handle}`,
      images: [
        {
          url: product.thumbnailUrl,
          width: 1200,
          height: 900,
          alt: product.title,
        },
      ],
      type: "website",
    },
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { handle } = await params;
  const product = await getLiveProductByHandle(handle);

  if (!product) {
    notFound();
  }

  const category = CATALOG_CATEGORIES.find((c) => c.id === product.categoryId);
  const categoryProducts = await getLiveProductsByCategory(product.categoryId);
  const relatedProducts = categoryProducts
    .filter((p) => p.id !== product.id)
    .slice(0, 4);

  // Schema.org JSON-LD Structured Data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    image: product.images,
    description: product.description,
    sku: product.id,
    gtin13: product.gtinBarcode,
    brand: {
      "@type": "Brand",
      name: "SAN Furniture",
    },
    category: category ? category.name : "Furniture",
    offers: {
      "@type": "Offer",
      url: `https://sanfurniture.co.uk/products/${product.handle}`,
      priceCurrency: "GBP",
      price: (product.pricePennies / 100).toFixed(2),
      priceValidUntil: "2027-12-31",
      availability:
        product.status === "published"
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: {
        "@type": "Organization",
        name: "SAN Furniture",
      },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "GB",
        returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 14,
        returnMethod: "https://schema.org/ReturnByMail",
      },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: {
          "@type": "MonetaryAmount",
          value: product.pricePennies >= 50000 ? "0.00" : "49.00",
          currency: "GBP",
        },
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: "GB",
        },
      },
    },
  };

  return (
    <div className="bg-sand-50 min-h-screen">
      {/* Schema.org Script */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="border-b border-sand-200 bg-sand-100/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center text-xs text-navy-600 gap-1.5 flex-wrap">
          <Link href="/" className="hover:text-navy-950 transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-sand-400" />
          <Link href="/catalog" className="hover:text-navy-950 transition-colors">
            Catalog
          </Link>
          {category && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-sand-400" />
              <Link
                href={`/categories/${category.handle}`}
                className="hover:text-navy-950 transition-colors"
              >
                {category.name}
              </Link>
            </>
          )}
          <ChevronRight className="w-3.5 h-3.5 text-sand-400" />
          <span className="font-semibold text-navy-950 truncate max-w-[200px] sm:max-w-none">
            {product.title}
          </span>
        </div>
      </nav>

      {/* Main Product Hero Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          {/* Left Column: Image Gallery (7 cols on lg) */}
          <div className="lg:col-span-7">
            <ProductGallery images={product.images} title={product.title} />
          </div>

          {/* Right Column: Title, Subtitle, Price & Actions (5 cols on lg) */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              {/* Category & Status Pill */}
              <div className="flex items-center gap-2 mb-2">
                {category && (
                  <span className="text-[11px] font-bold text-navy-600 tracking-wider uppercase">
                    {category.name}
                  </span>
                )}
                <span className="text-sand-400">•</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-forest-700 bg-forest-50 px-2 py-0.5 rounded border border-forest-200">
                  <CheckCircle2 className="w-3 h-3" />
                  In Stock (UK Warehouse)
                </span>
              </div>

              {/* Product Title & Subtitle */}
              <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-navy-950 mb-2">
                {product.title}
              </h1>
              <p className="text-xs sm:text-sm text-navy-600 leading-relaxed font-medium">
                {product.subtitle}
              </p>
            </div>

            {/* Product Actions Component (Pricing, Swatches, Add to Cart, Klarna, Guarantees) */}
            <ProductActions product={product} />

            {/* Description Summary */}
            <div className="pt-4 border-t border-sand-200">
              <h2 className="text-xs font-bold text-navy-950 uppercase tracking-wider mb-2">
                Craftsmanship & Design Notes
              </h2>
              <p className="text-xs sm:text-sm text-navy-700 leading-relaxed">
                {product.description}
              </p>
            </div>
          </div>
        </div>

        {/* Technical Widgets Section: Dimensions Visualizer & Postcode Estimator */}
        <div className="mt-14 sm:mt-18 pt-10 border-t border-sand-200">
          <div className="max-w-3xl mb-8">
            <span className="text-[11px] font-bold uppercase tracking-widest text-brass-600 block mb-1">
              Architectural Specifications
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-navy-950">
              Dimensions, Access & Logistics
            </h2>
            <p className="text-xs sm:text-sm text-navy-600 mt-1">
              Verify room proportions and calculate live transit times to your UK postcode.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Dimensions & Doorway Clearance Visualizer */}
            <DimensionsClearance
              widthCm={product.specs.width_cm}
              heightCm={product.specs.height_cm}
              depthCm={product.specs.depth_cm}
              seatHeightCm={product.specs.seat_height_cm}
              weightKg={product.specs.weight_kg}
              doorwayClearanceMinCm={product.specs.doorway_clearance_min_cm}
            />

            {/* UK Live Postcode Delivery Estimator */}
            <PostcodeEstimator
              deliveryTier={product.specs.delivery_tier}
              leadTimeDays={product.specs.lead_time_days}
            />
          </div>
        </div>

        {/* Detailed Specifications & UK Regulatory Compliance Table */}
        <div className="mt-14 pt-10 border-t border-sand-200">
          <h2 className="font-display text-xl sm:text-2xl font-bold text-navy-950 mb-6">
            Full Product Specifications
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 text-xs divide-y md:divide-y-0 divide-sand-200">
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-sand-200">
                <span className="text-navy-500">Upholstery / Primary Material</span>
                <span className="font-semibold text-navy-950 capitalize">
                  {product.specs.material}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-sand-200">
                <span className="text-navy-500">Frame & Internal Structure</span>
                <span className="font-semibold text-navy-950 capitalize">
                  {product.specs.frame_material.replace(/_/g, " ")}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-sand-200">
                <span className="text-navy-500">Color / Finish</span>
                <span className="font-semibold text-navy-950">{product.specs.color}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-sand-200">
                <span className="text-navy-500">Assembly Requirement</span>
                <span className="font-semibold text-navy-950">
                  {product.specs.assembly_required
                    ? `Assembly Required (~${product.specs.assembly_time_mins || 20} mins)`
                    : "Fully Assembled (No assembly needed)"}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-sand-200">
                <span className="text-navy-500">UK Fire Safety Standard</span>
                <span className="font-semibold text-forest-800 flex items-center gap-1">
                  <FileCheck2 className="w-3.5 h-3.5" />
                  {product.specs.fire_safety.standard}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-sand-200">
                <span className="text-navy-500">Fire Certificate Reference</span>
                <span className="font-mono font-semibold text-navy-950">
                  {product.specs.fire_safety.certificate_ref}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-sand-200">
                <span className="text-navy-500">Regulatory Fire Label Attached</span>
                <span className="font-semibold text-navy-950">
                  {product.specs.fire_safety.label_attached ? "Yes (UK Statutory)" : "Exempt"}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-sand-200">
                <span className="text-navy-500">GTIN-13 Barcode</span>
                <span className="font-mono font-semibold text-navy-950">
                  {product.gtinBarcode}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Curated Related Furniture Grid */}
        {relatedProducts.length > 0 && (
          <div className="mt-16 pt-12 border-t border-sand-200">
            <div className="flex items-center justify-between mb-8">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-brass-600 block mb-1">
                  Coordinated Living
                </span>
                <h2 className="font-display text-2xl font-bold tracking-tight text-navy-950">
                  You May Also Admire
                </h2>
              </div>
              <Link
                href="/catalog"
                className="text-xs font-semibold text-navy-950 hover:text-brass-600 transition-colors flex items-center gap-1"
              >
                <span>View Full Catalog</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((item) => (
                <Link
                  key={item.id}
                  href={`/products/${item.handle}`}
                  className="group rounded-xl border border-sand-200 bg-sand-50 overflow-hidden hover:shadow-lg transition-all"
                >
                  <div className="relative aspect-[4/3] bg-sand-200 overflow-hidden">
                    <img
                      src={item.thumbnailUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-4 space-y-1">
                    <h3 className="text-xs font-bold text-navy-950 group-hover:text-brass-600 transition-colors line-clamp-1">
                      {item.title}
                    </h3>
                    <p className="text-[11px] text-navy-600 line-clamp-1">{item.subtitle}</p>
                    <div className="pt-2 font-display text-sm font-bold text-navy-950">
                      {formatGBP(item.pricePennies)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
