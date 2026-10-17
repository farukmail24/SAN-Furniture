"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ScrollReveal,
  StaggerContainer,
  StaggerItem,
} from "@/components/motion/MotionWrapper";
import {
  ArrowRight,
  Star,
  ShoppingBag,
  Eye,
  Check,
  Sparkles,
  SlidersHorizontal,
  Flame,
  Truck,
  CreditCard,
  ShieldCheck,
  Tag
} from "lucide-react";
import { formatGBP } from "@san-furniture/types";
import { CATALOG_PRODUCTS, CATALOG_CATEGORIES, type CatalogProduct } from "@/lib/catalog";
import { useCart } from "@/lib/cart-context";
import { apiUrl } from "@/lib/api-config";
import { fetchWithSwr, getCachedData } from "@/lib/api-cache";

interface HomePageClientProps {
  initialProducts: CatalogProduct[];
}

export function HomePageClient({ initialProducts }: HomePageClientProps) {
  const router = useRouter();
  const { addItem } = useCart();
  const [activeTab, setActiveTab] = useState<string>("all");
  const [addedProductId, setAddedProductId] = useState<string | null>(null);

  const [productsList, setProductsList] = useState<CatalogProduct[]>(initialProducts || []);

  // Dynamic live reviews from MySQL customer_reviews table
  const cachedReviews = getCachedData<{ reviews: Array<{ id: string; customer_name: string; rating: number; title: string; comment: string }> }>(apiUrl("/api/reviews"));
  const [reviewsList, setReviewsList] = useState<Array<{ id: string; customer_name: string; rating: number; title: string; comment: string }>>(
    () => cachedReviews?.reviews || []
  );

  useEffect(() => {
    fetchWithSwr(
      apiUrl("/api/products"),
      (data: any) => {
        if (Array.isArray(data.products) && data.products.length > 0) {
          setProductsList(data.products);
        }
      }
    ).catch(() => {});

    fetchWithSwr(
      apiUrl("/api/reviews"),
      (data: any) => {
        if (Array.isArray(data.reviews) && data.reviews.length > 0) {
          setReviewsList(data.reviews);
        }
      }
    ).catch(() => {});
  }, []);

  // Filter products by selected room/category tab
  const filteredProducts = useMemo(() => {
    if (activeTab === "all") return productsList;
    return productsList.filter((p) => p.categoryId === activeTab);
  }, [activeTab, productsList]);

  // Special Offers & Discounted Products
  const saleProducts = useMemo(() => {
    return productsList.filter(
      (p) => p.compareAtPricePennies && p.compareAtPricePennies > p.pricePennies
    );
  }, [productsList]);

  // New Arrivals (Latest additions)
  const newArrivals = useMemo(() => {
    return productsList.slice(0, 6);
  }, [productsList]);

  // Quick Add handler with visual confirmation
  const handleQuickAdd = (product: CatalogProduct, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, 1);
    setAddedProductId(product.id);
    setTimeout(() => {
      setAddedProductId(null);
    }, 1800);
  };

  const categoriesWithCounts = useMemo(() => [
    { id: "all", name: "All Furniture", count: productsList.length },
    { id: "cat_sofas", name: "Sofas & Corner Lounges", count: productsList.filter(p => p.categoryId === "cat_sofas").length || 4 },
    { id: "cat_armchairs", name: "Accent Armchairs", count: productsList.filter(p => p.categoryId === "cat_armchairs").length || 3 },
    { id: "cat_dining", name: "Dining Sets & Tables", count: productsList.filter(p => p.categoryId === "cat_dining").length || 3 },
    { id: "cat_beds", name: "Ottoman Beds & Bedsteads", count: productsList.filter(p => p.categoryId === "cat_beds").length || 2 },
    { id: "cat_living", name: "Occasional & Coffee Tables", count: productsList.filter(p => p.categoryId === "cat_living").length || 2 },
  ], [productsList]);

  return (
    <div className="w-full space-y-16 sm:space-y-24 pb-20">
      {/* 1. CINEMATIC FULL-WIDTH HERO */}
      <section className="relative overflow-hidden bg-sand-100 border-b border-sand-200 py-12 sm:py-20 lg:py-24">
        <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-14 items-center">
            
            {/* Left Column: Value Proposition & Quick Shop */}
            <ScrollReveal direction="up" delay={0.1} duration={0.85} className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sand-50 border border-sand-300 text-xs font-medium text-navy-900 shadow-ambient">
                <span className="flex items-center text-brass-500">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <Star className="w-3.5 h-3.5 fill-current" />
                </span>
                <span>4.9/5 from 2,800+ UK Homeowners</span>
                <span className="text-sand-400">•</span>
                <span className="text-sage-700 font-semibold">Trustpilot Rated Excellent</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-display font-bold tracking-tight text-navy-950 leading-[1.08]">
                Bespoke Living, <br />
                <span className="text-navy-700 font-normal italic font-serif">Handcrafted for Britain.</span>
              </h1>

              <p className="text-base sm:text-lg text-navy-700 max-w-xl leading-relaxed">
                Discover tactile textured bouclés, solid European white oak tables, and luxury gas-lift ottoman beds. Enjoy complimentary 2-man room-of-choice delivery and Klarna interest-free finance across the UK.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  href="/catalog"
                  className="px-7 py-4 rounded-xl bg-navy-950 text-sand-50 font-semibold text-sm hover:bg-navy-900 transition-all flex items-center gap-2.5 shadow-card active:scale-[0.98]"
                >
                  Explore All 14 Products
                  <ArrowRight className="w-4 h-4 text-brass-400" />
                </Link>

                <a
                  href="#collection-grid"
                  className="px-7 py-4 rounded-xl bg-sand-50 border border-sand-300 text-navy-950 font-semibold text-sm hover:bg-sand-200 transition-all flex items-center gap-2"
                >
                  Shop By Room
                </a>
              </div>

              {/* Quick Trust Strip */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-sand-200 text-xs text-navy-800">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-sage-700 shrink-0" />
                  <span>Free UK White Glove over £500</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-brass-600 shrink-0" />
                  <span>BS 5852 Fire Safety Certified</span>
                </div>
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-navy-600 shrink-0" />
                  <span>Klarna 0% Pay in 3</span>
                </div>
              </div>
            </ScrollReveal>

            {/* Right Column: Featured Furniture Showcase Cards */}
            <ScrollReveal direction="scale" delay={0.2} duration={0.85} className="lg:col-span-6 grid grid-cols-2 gap-4 sm:gap-6">
              {productsList[0] ? (
                <Link
                  href={`/products/${productsList[0].handle}`}
                  className="group relative rounded-2xl overflow-hidden aspect-[4/5] bg-sand-200 border border-sand-300 shadow-elevation block"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={productsList[0].thumbnailUrl}
                    alt={productsList[0].title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-950/80 via-transparent to-transparent flex flex-col justify-end p-5 text-sand-50">
                    <span className="text-[10px] uppercase tracking-wider text-brass-400 font-semibold">Featured Masterpiece</span>
                    <h3 className="font-display font-bold text-lg text-sand-50 group-hover:text-brass-300 transition-colors line-clamp-2">{productsList[0].title}</h3>
                    <div className="flex items-baseline justify-between mt-1">
                      <span className="font-bold text-base text-sand-50">{formatGBP(productsList[0].pricePennies)}</span>
                      <span className="text-[11px] text-sand-300 underline">View Item &rarr;</span>
                    </div>
                  </div>
                </Link>
              ) : (
                <div className="rounded-2xl aspect-[4/5] bg-sand-200/50 animate-pulse" />
              )}

              <div className="space-y-4 sm:space-y-6 flex flex-col justify-between">
                {productsList.slice(1, 3).map((prod, idx) => (
                  <Link
                    key={prod.id || idx}
                    href={`/products/${prod.handle}`}
                    className="group relative rounded-2xl overflow-hidden aspect-[4/3] bg-sand-200 border border-sand-300 shadow-elevation block flex-1"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={prod.thumbnailUrl}
                      alt={prod.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-navy-950/80 via-transparent to-transparent flex flex-col justify-end p-4 text-sand-50">
                      <span className="text-[10px] uppercase tracking-wider text-sage-400 font-semibold">{prod.specs?.delivery_tier === "two_man_white_glove" ? "2-Man White Glove" : "In Stock"}</span>
                      <h3 className="font-display font-bold text-sm sm:text-base text-sand-50 group-hover:text-brass-300 transition-colors truncate">{prod.title}</h3>
                      <div className="flex items-baseline justify-between mt-0.5">
                        <span className="font-bold text-sm text-sand-50">{formatGBP(prod.pricePennies)}</span>
                        <span className="text-[10px] text-sand-300 underline">View &rarr;</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </ScrollReveal>

          </div>
        </div>
      </section>

      {/* 2. MAIN INTERACTIVE PRODUCT CATALOG BY ROOM (TABBED FILTER) */}
      <section id="collection-grid" className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        <ScrollReveal direction="up" className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-brass-600 font-semibold mb-1">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Live Catalog Filter
            </div>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-navy-950">
              Shop Handcrafted British Furniture
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-navy-600">
            Showing <span className="font-bold text-navy-950">{filteredProducts.length}</span> pieces ready for UK dispatch
          </p>
        </ScrollReveal>

        {/* Category Pills Tab Bar with Touch Momentum Scrolling */}
        <ScrollReveal direction="fade" delay={0.08} className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none border-b border-sand-200 -mx-4 px-4 sm:mx-0 sm:px-0">
          {categoriesWithCounts.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                type="button"
                className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
                  isActive
                    ? "bg-navy-950 text-sand-50 shadow-sm"
                    : "bg-sand-100 text-navy-800 hover:bg-sand-200 border border-sand-300"
                }`}
              >
                <span>{tab.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    isActive ? "bg-sand-50/20 text-sand-100" : "bg-sand-300 text-navy-700 font-bold"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </ScrollReveal>

        {/* Dynamic 2-Column Mobile App Grid with Staggered Cascading Animation */}
        <StaggerContainer
          key={activeTab}
          className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6 xl:gap-8"
        >
          {filteredProducts.map((product, index) => {
            const isAdded = addedProductId === product.id;
            const klarnaPerMonth = Math.round(product.pricePennies / 3);
            return (
              <StaggerItem
                key={`${product.id}-${index}`}
                className="group rounded-xl sm:rounded-2xl bg-sand-50 border border-sand-200 overflow-hidden shadow-ambient hover:shadow-elevation transition-all flex flex-col justify-between"
              >
                {/* Product Image & Badges */}
                <div className="relative aspect-[4/3] bg-sand-200 overflow-hidden">
                  <Link
                    href={`/products/${product.handle}`}
                    prefetch={true}
                    onMouseEnter={() => router.prefetch(`/products/${product.handle}`)}
                    onTouchStart={() => router.prefetch(`/products/${product.handle}`)}
                    className="block w-full h-full"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={product.thumbnailUrl}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    />
                  </Link>

                  {/* Delivery Tier Badge */}
                  <span className="absolute top-2 left-2 sm:top-3 sm:left-3 z-10 px-1.5 sm:px-2.5 py-0.5 sm:py-1 text-[9px] sm:text-[10px] font-semibold rounded bg-navy-950/90 text-sand-50 shadow-sm">
                    {product.specs.delivery_tier === "two_man_white_glove" ? "2-Man" : "Parcel"}
                  </span>

                  {/* Compare at price discount pill */}
                  {product.compareAtPricePennies && (
                    <span className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10 px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-bold rounded bg-terracotta-500 text-sand-50 shadow-sm">
                      SAVE {formatGBP(product.compareAtPricePennies - product.pricePennies)}
                    </span>
                  )}

                  {/* Desktop Quick Action Floating Overlay */}
                  <div className="hidden sm:flex absolute inset-x-3 bottom-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 gap-2">
                    <button
                      type="button"
                      onClick={(e) => handleQuickAdd(product, e)}
                      className={`flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-md ${
                        isAdded
                          ? "bg-sage-700 text-sand-50"
                          : "bg-navy-950 text-sand-50 hover:bg-brass-600 active:scale-95"
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> Added!
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-3.5 h-3.5" /> Quick Add
                        </>
                      )}
                    </button>
                    <Link
                      href={`/products/${product.handle}`}
                      className="p-2.5 rounded-lg bg-sand-50/90 text-navy-950 hover:bg-sand-50 shadow-md backdrop-blur-sm transition-all"
                      aria-label="View product details"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                  </div>
                </div>

                {/* Product Metadata & Info */}
                <div className="p-3 sm:p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-navy-500 mb-1">
                      <span className="capitalize font-medium truncate max-w-[80px] sm:max-w-none">{product.specs.color}</span>
                      <span className="hidden sm:inline">{product.specs.width_cm} × {product.specs.depth_cm} cm</span>
                    </div>

                    <Link
                      href={`/products/${product.handle}`}
                      prefetch={true}
                      onMouseEnter={() => router.prefetch(`/products/${product.handle}`)}
                      onTouchStart={() => router.prefetch(`/products/${product.handle}`)}
                    >
                      <h3 className="font-display font-bold text-xs sm:text-base text-navy-950 group-hover:text-brass-600 transition-colors line-clamp-1 leading-snug">
                        {product.title}
                      </h3>
                    </Link>

                    <p className="hidden sm:block text-xs text-navy-600 mt-1 line-clamp-2 leading-relaxed">
                      {product.subtitle}
                    </p>
                  </div>

                  <div className="mt-2 sm:mt-4 pt-2 sm:pt-4 border-t border-sand-200 flex items-center justify-between">
                    <div>
                      <div className="flex items-baseline gap-1.5 sm:gap-2">
                        <span className="font-display font-bold text-sm sm:text-lg text-navy-950">
                          {formatGBP(product.pricePennies)}
                        </span>
                        {product.compareAtPricePennies && (
                          <span className="text-[10px] sm:text-xs text-navy-400 line-through">
                            {formatGBP(product.compareAtPricePennies)}
                          </span>
                        )}
                      </div>
                      <p className="hidden sm:block text-[10px] text-navy-500 mt-0.5">
                        Or 3x {formatGBP(klarnaPerMonth)} with Klarna
                      </p>
                    </div>

                    {/* Mobile Touch Quick Add Button */}
                    <button
                      type="button"
                      onClick={(e) => handleQuickAdd(product, e)}
                      aria-label={`Add ${product.title} to basket`}
                      className={`sm:hidden p-2 rounded-lg transition-all active:scale-90 shadow-sm ${
                        isAdded
                          ? "bg-sage-700 text-sand-50"
                          : "bg-navy-950 text-sand-50 hover:bg-brass-600"
                      }`}
                    >
                      {isAdded ? <Check className="w-3.5 h-3.5" /> : <ShoppingBag className="w-3.5 h-3.5" />}
                    </button>

                    <span className="hidden sm:flex text-[11px] text-sage-700 font-semibold items-center gap-1">
                      <Check className="w-3 h-3" /> In Stock
                    </span>
                  </div>
                </div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      </section>

      {/* 3. "SHOP THE LOOK" CURATED LIVING ROOM SET */}
      <section className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        <ScrollReveal direction="up" duration={0.65} className="rounded-3xl bg-sand-100 border border-sand-300 p-6 sm:p-10 lg:p-12 overflow-hidden shadow-ambient">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-8">
            <div>
              <span className="text-xs uppercase tracking-widest text-brass-700 font-semibold">
                Room Inspiration
              </span>
              <h2 className="text-3xl sm:text-4xl font-display font-bold text-navy-950 mt-1">
                Shop The Belgravia Reception Suite
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-navy-600 max-w-md">
              A curated harmony of tactile boucle, forest green velvet, and honed Roman travertine designed to elevate modern British entertaining.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Large Styled Lifestyle Visual */}
            <div className="lg:col-span-7 relative rounded-2xl overflow-hidden aspect-[16/10] bg-sand-200 border border-sand-300 shadow-elevation">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=1400&q=85"
                alt="Belgravia Living Room Suite"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-navy-950/90 text-sand-50 text-xs font-semibold backdrop-blur-sm">
                Curated 3-Piece Living Suite
              </div>
            </div>

            {/* Included Suite Pieces Direct Buy List */}
            <div className="lg:col-span-5 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-navy-700">Pieces in this setting:</h3>
              
              {productsList.slice(3, 6).map((item, idx) => (
                <div key={item.id || idx} className="p-4 rounded-xl bg-sand-50 border border-sand-300 flex items-center justify-between gap-4 shadow-sm hover:border-brass-500 transition-all">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-14 h-14 rounded-lg bg-sand-200 overflow-hidden flex-shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.thumbnailUrl}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={`/products/${item.handle}`}
                        prefetch={true}
                        onMouseEnter={() => router.prefetch(`/products/${item.handle}`)}
                        onTouchStart={() => router.prefetch(`/products/${item.handle}`)}
                      >
                        <h4 className="font-display font-bold text-sm text-navy-950 truncate hover:text-brass-600 transition-colors">{item.title}</h4>
                      </Link>
                      <p className="text-xs text-navy-600 truncate">{item.subtitle}</p>
                      <span className="font-bold text-sm text-navy-950 mt-0.5 inline-block">{formatGBP(item.pricePennies)}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handleQuickAdd(item, e)}
                    className="px-3 py-2 rounded-lg bg-navy-950 text-sand-50 text-xs font-semibold hover:bg-brass-600 transition-colors shrink-0"
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* 4. LIMITED STOCK & SPECIAL PRICE OFFERS */}
      <section className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        <ScrollReveal direction="up" className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-terracotta-600 font-bold mb-1">
              <Flame className="w-3.5 h-3.5" />
              Limited Stock Promotions
            </div>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-navy-950">
              Special Savings on Signature Pieces
            </h2>
          </div>
          <Link
            href="/catalog"
            className="text-xs sm:text-sm font-semibold text-navy-900 hover:text-brass-600 flex items-center gap-1.5"
          >
            View all promotional offers <ArrowRight className="w-4 h-4" />
          </Link>
        </ScrollReveal>

        <StaggerContainer className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {saleProducts.slice(0, 4).map((product, index) => {
            const savings = (product.compareAtPricePennies || 0) - product.pricePennies;
            return (
              <StaggerItem
                key={`sale-${product.id}-${index}`}
                className="group rounded-xl sm:rounded-2xl bg-sand-50 border border-sand-300 overflow-hidden shadow-ambient hover:shadow-card transition-all flex flex-col justify-between"
              >
                <Link
                  href={`/products/${product.handle}`}
                  prefetch={true}
                  onMouseEnter={() => router.prefetch(`/products/${product.handle}`)}
                  onTouchStart={() => router.prefetch(`/products/${product.handle}`)}
                  className="block relative aspect-[4/3] bg-sand-200 overflow-hidden"
                >
                  <span className="absolute top-2 left-2 sm:top-3 sm:left-3 z-10 px-1.5 sm:px-2.5 py-0.5 sm:py-1 text-[9px] sm:text-[10px] font-bold rounded bg-terracotta-500 text-sand-50 shadow-sm">
                    SAVE {formatGBP(savings)}
                  </span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={product.thumbnailUrl}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </Link>

                <div className="p-3 sm:p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] sm:text-[11px] font-semibold text-terracotta-600 uppercase tracking-wide block truncate">
                      Low UK stock
                    </span>
                    <Link
                      href={`/products/${product.handle}`}
                      prefetch={true}
                      onMouseEnter={() => router.prefetch(`/products/${product.handle}`)}
                      onTouchStart={() => router.prefetch(`/products/${product.handle}`)}
                    >
                      <h3 className="font-display font-bold text-xs sm:text-base text-navy-950 group-hover:text-brass-600 transition-colors line-clamp-1 mt-0.5 sm:mt-1">
                        {product.title}
                      </h3>
                    </Link>
                    <p className="hidden sm:block text-xs text-navy-600 mt-1 line-clamp-1">
                      {product.subtitle}
                    </p>
                  </div>

                  <div className="mt-2 sm:mt-4 pt-2 sm:pt-4 border-t border-sand-200 flex items-center justify-between">
                    <div>
                      <span className="font-display font-bold text-sm sm:text-lg text-navy-950 block">
                        {formatGBP(product.pricePennies)}
                      </span>
                      {product.compareAtPricePennies && (
                        <span className="text-[10px] sm:text-xs text-navy-400 line-through">
                          {formatGBP(product.compareAtPricePennies || 0)}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleQuickAdd(product, e)}
                      aria-label={`Add ${product.title} to basket`}
                      className="p-2 sm:px-3.5 sm:py-2 rounded-lg bg-navy-950 text-sand-50 text-xs font-semibold hover:bg-brass-600 transition-all flex items-center gap-1 active:scale-90"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Add</span>
                    </button>
                  </div>
                </div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      </section>

      {/* 5. NEW ARRIVALS SPOTLIGHT (BEDS, CONSOLES, DINING) */}
      <section className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        <ScrollReveal direction="scale" duration={0.65} className="rounded-3xl bg-navy-950 text-sand-50 p-6 sm:p-12 lg:p-16 relative overflow-hidden shadow-elevation">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 sm:mb-10">
            <div>
              <span className="text-xs uppercase tracking-widest text-brass-400 font-semibold">
                Just Arrived in Showroom
              </span>
              <h2 className="text-2xl sm:text-4xl font-display font-bold text-sand-50 mt-1">
                New Bedroom & Occasional Additions
              </h2>
            </div>
            <Link
              href="/catalog"
              className="text-xs sm:text-sm font-semibold text-brass-300 hover:text-brass-200 flex items-center gap-1.5"
            >
              Explore all new arrivals <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {newArrivals.slice(0, 4).map((product, index) => (
              <Link
                key={`arrival-${product.id}-${index}`}
                href={`/products/${product.handle}`}
                className="group rounded-xl sm:rounded-2xl bg-sand-50/10 border border-sand-50/15 overflow-hidden backdrop-blur-sm hover:border-brass-400 transition-all flex flex-col justify-between"
              >
                <div className="relative aspect-[4/3] bg-navy-900 overflow-hidden">
                  <span className="absolute top-2 left-2 sm:top-3 sm:left-3 z-10 px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-bold rounded bg-brass-500 text-navy-950 shadow-sm">
                    NEW 2026
                  </span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={product.thumbnailUrl}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>

                <div className="p-3 sm:p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] sm:text-[11px] text-brass-300 font-medium block truncate">
                      {product.specs.material !== "none" ? product.specs.material : product.specs.frame_material}
                    </span>
                    <h3 className="font-display font-bold text-xs sm:text-base text-sand-50 group-hover:text-brass-300 transition-colors line-clamp-1 mt-0.5">
                      {product.title}
                    </h3>
                  </div>

                  <div className="mt-2 sm:mt-4 pt-2 sm:pt-3 border-t border-sand-50/15 flex items-center justify-between">
                    <span className="font-display font-bold text-sm sm:text-base text-sand-50">
                      {formatGBP(product.pricePennies)}
                    </span>
                    <span className="text-[11px] sm:text-xs text-brass-300 font-semibold group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                      Details →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </ScrollReveal>
      </section>

      {/* 6. REAL UK CUSTOMER ROOM REVIEWS */}
      <section className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        <ScrollReveal direction="up" className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <span className="text-xs uppercase tracking-widest text-brass-600 font-semibold">
              Real Homes & Experiences
            </span>
            <h2 className="text-3xl font-display font-bold text-navy-950 mt-1">
              What British Homeowners Say
            </h2>
          </div>
          <div className="flex items-center gap-2 text-xs text-navy-700">
            <span className="font-bold text-navy-950">4.9 / 5.0</span>
            <span>Trustpilot & Google Customer Feedback</span>
          </div>
        </ScrollReveal>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6 xl:gap-8">
          {reviewsList.map((rev) => {
            const starCount = Math.max(1, Math.min(5, Math.round(Number(rev.rating) || 5)));
            return (
              <StaggerItem
                key={rev.id}
                className="p-6 rounded-2xl bg-sand-100 border border-sand-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-1 text-brass-500 mb-3">
                    {[...Array(starCount)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  {rev.title && (
                    <h4 className="text-sm font-bold text-navy-950 mb-1.5 line-clamp-1">
                      {rev.title}
                    </h4>
                  )}
                  <p className="text-xs sm:text-sm text-navy-900 italic leading-relaxed">
                    &ldquo;{rev.comment}&rdquo;
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-sand-300 flex items-center justify-between text-xs">
                  <div>
                    <h4 className="font-bold text-navy-950">{rev.customer_name}</h4>
                    <p className="text-[11px] text-navy-600">Verified Client</p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-sage-100 text-sage-800 font-semibold border border-sage-300">
                    Verified Buyer
                  </span>
                </div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      </section>
    </div>
  );
}
