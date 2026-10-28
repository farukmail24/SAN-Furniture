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
  FileText,
  Download,
  Wrench,
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
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/motion/MotionWrapper";
import { getLiveSections } from "@/lib/cms-server";

interface ProductPageProps {
  params: Promise<{
    handle: string;
  }>;
}

export const dynamic = "force-dynamic";

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
      canonical: `https://sanfurniture.com/products/${product.handle}`,
    },
    openGraph: {
      title: `${product.title} | SAN Furniture UK`,
      description: product.description,
      url: `https://sanfurniture.com/products/${product.handle}`,
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
  const [product, cmsSections] = await Promise.all([
    getLiveProductByHandle(handle),
    getLiveSections("product_detail"),
  ]);

  if (!product) {
    notFound();
  }

  const category = CATALOG_CATEGORIES.find((c) => c.id === product.categoryId);
  const categoryProducts = (await getLiveProductsByCategory(product.categoryId)) || [];
  const relatedProducts = categoryProducts
    .filter((p) => p.id !== product.id)
    .slice(0, 4);

  const valueBadges = cmsSections?.["pdp_value_badges"]?.content?.badges;

  // Schema.org JSON-LD Structured Data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    image: Array.isArray(product.images) && product.images.length > 0 ? product.images : [product.thumbnailUrl],
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
      url: `https://sanfurniture.com/products/${product.handle}`,
      priceCurrency: "GBP",
      price: (Number(product.pricePennies || 0) / 100).toFixed(2),
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
          value: "0.00",
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
        <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-3 flex items-center text-xs text-navy-600 gap-1.5 flex-wrap">
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

      {/* Main Product Hero Grid (50% Image Gallery, 50% Product Info & Actions) */}
      <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 xl:gap-16 items-start">
          {/* Left Column: Image Gallery (50% width on lg) */}
          <ScrollReveal direction="scale" duration={0.55} className="w-full">
            <ProductGallery
              images={
                product.thumbnailUrl
                  ? [
                      product.thumbnailUrl,
                      ...(Array.isArray(product.images) ? product.images : []).filter(
                        (img) => img && typeof img === "string" && img !== product.thumbnailUrl
                      ),
                    ]
                  : Array.isArray(product.images)
                  ? product.images
                  : []
              }
              title={product.title}
            />
          </ScrollReveal>

          {/* Right Column: Title, Subtitle, Price & Actions (50% width on lg) */}
          <ScrollReveal direction="up" delay={0.08} duration={0.55} className="w-full space-y-6">
            <div>
              {/* Category, SKU & Status Pill */}
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {category && (
                  <span className="text-[11px] font-bold text-navy-600 tracking-wider uppercase">
                    {category.name}
                  </span>
                )}
                {product.sku && (
                  <>
                    <span className="text-sand-400">•</span>
                    <span className="font-mono text-[11px] font-bold text-[#00072D] bg-[#FAF6EE] px-2 py-0.5 rounded border border-[#C89B3C]/50">
                      SKU: {product.sku}
                    </span>
                  </>
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
                {(product.subtitle || "")
                  .replace(/Official\s+Amos\s+Mann\s+UK\s+Furniture/gi, "SAN Furniture Luxury Collection")
                  .replace(/Amos\s+Mann('s)?/gi, "SAN Furniture's")}
              </p>
            </div>

            {/* Product Actions Component (Pricing, Swatches, Add to Cart, Klarna, Guarantees) */}
            <ProductActions product={product} valueBadges={valueBadges} />

            {/* Description Summary */}
            <div className="pt-4 border-t border-sand-200">
              <h2 className="text-xs font-bold text-navy-950 uppercase tracking-wider mb-2">
                Craftsmanship & Design Notes
              </h2>
              <p className="text-xs sm:text-sm text-navy-700 leading-relaxed">
                {product.description}
              </p>
            </div>
          </ScrollReveal>
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
              widthCm={product.specs?.width_cm ?? 180}
              heightCm={product.specs?.height_cm ?? 215}
              depthCm={product.specs?.depth_cm ?? 60}
              seatHeightCm={product.specs?.seat_height_cm ?? undefined}
              weightKg={product.specs?.weight_kg ?? 100}
              doorwayClearanceMinCm={product.specs?.doorway_clearance_min_cm ?? 65}
            />

            {/* UK Live Postcode Delivery Estimator */}
            <PostcodeEstimator
              deliveryTier={product.specs?.delivery_tier || "two_man_white_glove"}
              leadTimeDays={product.specs?.lead_time_days ?? 7}
            />
          </div>
        </div>

        {/* Detailed Specifications & Furniture Quality Table */}
        <div className="mt-14 pt-10 border-t border-sand-200">
          <h2 className="font-display text-xl sm:text-2xl font-bold text-navy-950 mb-6">
            Full Product Specifications
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 text-xs divide-y md:divide-y-0 divide-sand-200">
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-sand-200">
                <span className="text-navy-500">Upholstery / Primary Material</span>
                <span className="font-semibold text-navy-950 capitalize">
                  {product.specs?.material ? product.specs.material.replace(/_/g, " ") : "Engineered Hardwood"}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-sand-200">
                <span className="text-navy-500">Frame & Internal Structure</span>
                <span className="font-semibold text-navy-950 capitalize">
                  {product.specs?.frame_material ? product.specs.frame_material.replace(/_/g, " ") : "Engineered Hardwood"}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-sand-200">
                <span className="text-navy-500">Color / Finish</span>
                <span className="font-semibold text-navy-950">{product.specs?.color || "Standard Finish"}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-sand-200">
                <span className="text-navy-500">Assembly Requirement</span>
                <span className="font-semibold text-navy-950">
                  {product.specs?.assembly_required
                    ? `Assembly Required (~${product.specs.assembly_time_mins || 20} mins)`
                    : "Fully Assembled (No assembly needed)"}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-sand-200">
                <span className="text-navy-500">Packaging & Protection</span>
                <span className="font-semibold text-navy-950 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-forest-700" />
                  Reinforced Flat-Pack Protective Box
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-sand-200">
                <span className="text-navy-500">Care & Maintenance</span>
                <span className="font-semibold text-navy-950">
                  Wipe clean with a soft dry cloth
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-sand-200">
                <span className="text-navy-500">Fulfillment Method</span>
                <span className="font-semibold text-navy-950">
                  Direct Mainland Dispatch
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-sand-200">
                <span className="text-navy-500">GTIN-13 Barcode</span>
                <span className="font-mono font-semibold text-navy-950">
                  {product.gtinBarcode || product.id}
                </span>
              </div>
            </div>
          </div>

          {/* Assembly Instructions & Manual Download Card */}
          {product.specs?.assembly_instructions_url ? (
            <div className="mt-6 p-4.5 rounded-2xl bg-gradient-to-r from-sand-100 via-sand-200/50 to-sand-100 border border-sand-300 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-navy-950 text-brass-400 flex items-center justify-center shrink-0 shadow-xs">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-display font-bold text-navy-950 text-sm">
                      Manufacturer Assembly Manual (PDF)
                    </h4>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
                      Official Guide
                    </span>
                  </div>
                  <p className="text-xs text-navy-600 mt-0.5">
                    Step-by-step pictorial assembly guide &amp; statutory hardware fittings checklist.
                  </p>
                </div>
              </div>

              <a
                href={product.specs.assembly_instructions_url}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-navy-950 hover:bg-navy-900 text-sand-50 font-bold text-xs shadow-md hover:shadow-lg transition-all shrink-0 cursor-pointer group"
              >
                <Download className="w-4 h-4 text-brass-400 group-hover:translate-y-0.5 transition-transform" />
                <span>Download Instructions (PDF)</span>
              </a>
            </div>
          ) : product.specs?.assembly_required ? (
            <div className="mt-6 p-4 rounded-2xl bg-sand-100/70 border border-sand-200 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-sand-200 text-navy-700 flex items-center justify-center shrink-0">
                <Wrench className="w-4 h-4" />
              </div>
              <div className="text-xs text-navy-700 leading-relaxed">
                <strong>Assembly Requirement:</strong> Flat-pack self-assembly required (~{product.specs.assembly_time_mins || 20} mins). A comprehensive printed step-by-step instruction booklet and all statutory fittings are securely enclosed inside the delivery boxes.
              </div>
            </div>
          ) : null}
        </div>

        {/* Curated Related Furniture Grid */}
        {relatedProducts.length > 0 && (
          <ScrollReveal direction="up" className="mt-16 pt-12 border-t border-sand-200">
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

            <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              {relatedProducts.map((item) => (
                <StaggerItem key={item.id}>
                  <Link
                    href={`/products/${item.handle}`}
                    prefetch={false}
                    className="group rounded-xl border border-sand-200 bg-sand-50 overflow-hidden hover:shadow-lg transition-[box-shadow,border-color] duration-300 block h-full"
                  >
                  <div className="relative aspect-[4/3] bg-sand-200 overflow-hidden">
                    <img
                      src={item.thumbnailUrl || "/SanFurnitureLogo.png"}
                      alt={item.title}
                      loading="lazy"
                      decoding="async"
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
              </StaggerItem>
            ))}
          </StaggerContainer>
        </ScrollReveal>
      )}
      </div>
    </div>
  );
}
