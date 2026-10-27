"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  ScrollReveal,
  StaggerContainer,
  StaggerItem,
} from "@/components/motion/MotionWrapper";
import {
  ArrowRight,
  ChevronDown,
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
import { usePageSections, DEFAULT_STOREFRONT_SECTIONS, type SiteSection } from "@/lib/cms";

interface HomePageClientProps {
  initialProducts: CatalogProduct[];
  initialSections?: Record<string, SiteSection> | null;
  initialReviews?: Array<{ id: string; customer_name: string; rating: number; title: string; comment: string }>;
}

function colorWithOpacity(color: string, opacity: number): string {
  const match = /^#([0-9a-f]{6})$/i.exec(color);
  if (!match) return `rgba(245, 241, 233, ${opacity})`;
  const value = match[1];
  const red = parseInt(value.slice(0, 2), 16);
  const green = parseInt(value.slice(2, 4), 16);
  const blue = parseInt(value.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
}

function normalizeOpacity(value: unknown, fallback: number): number {
  const opacity = Number(value);
  return Number.isFinite(opacity) ? Math.min(100, Math.max(0, opacity)) : fallback;
}

export function HomePageClient({ initialProducts, initialSections, initialReviews }: HomePageClientProps) {
  const { addItem } = useCart();
  const [activeTab, setActiveTab] = useState<string>("all");
  const [addedProductId, setAddedProductId] = useState<string | null>(null);
  const [activeReviewIndex, setActiveReviewIndex] = useState(0);
  const reviewsScrollRef = React.useRef<HTMLDivElement>(null);

  const handleReviewsScroll = () => {
    if (!reviewsScrollRef.current) return;
    const { scrollLeft, clientWidth } = reviewsScrollRef.current;
    const itemWidth = clientWidth * 0.84;
    const index = Math.round(scrollLeft / itemWidth);
    setActiveReviewIndex(Math.max(0, Math.min(reviewsList.length - 1, index)));
  };

  const scrollToReview = (index: number) => {
    if (!reviewsScrollRef.current) return;
    const itemWidth = reviewsScrollRef.current.clientWidth * 0.84;
    reviewsScrollRef.current.scrollTo({
      left: index * itemWidth,
      behavior: "smooth",
    });
    setActiveReviewIndex(index);
  };

  const { getSection } = usePageSections("home", initialSections);
  const heroSec = getSection("home_hero", DEFAULT_STOREFRONT_SECTIONS.home_hero.content);
  const filterSec = getSection("home_catalog_filter", DEFAULT_STOREFRONT_SECTIONS.home_catalog_filter.content);
  const curatedSec = getSection("home_curated_suite", DEFAULT_STOREFRONT_SECTIONS.home_curated_suite.content);
  const promoSec = getSection("home_promotions", DEFAULT_STOREFRONT_SECTIONS.home_promotions.content);
  const arrivalsSec = getSection("home_new_arrivals", DEFAULT_STOREFRONT_SECTIONS.home_new_arrivals.content);
  const reviewsSec = getSection("home_reviews", DEFAULT_STOREFRONT_SECTIONS.home_reviews.content);

  const [productsList, setProductsList] = useState<CatalogProduct[]>(initialProducts || []);
  const heroShowcaseProducts = useMemo(() => {
    const selectedIds = [
      heroSec.content.hero_product_1_id,
      heroSec.content.hero_product_2_id,
      heroSec.content.hero_product_3_id,
    ];
    const availableProducts = [...productsList];
    return selectedIds
      .map((selectedId) => {
        const selectedIndex = selectedId
          ? availableProducts.findIndex((product) => product.id === selectedId)
          : -1;
        const [product] = availableProducts.splice(selectedIndex >= 0 ? selectedIndex : 0, 1);
        return product;
      })
      .filter((product): product is CatalogProduct => Boolean(product));
  }, [
    productsList,
    heroSec.content.hero_product_1_id,
    heroSec.content.hero_product_2_id,
    heroSec.content.hero_product_3_id,
  ]);
  const heroBackgroundImageOpacity =
    normalizeOpacity(heroSec.content.background_image_opacity, 15) / 100;
  const heroBackgroundColorOpacity =
    normalizeOpacity(heroSec.content.background_color_opacity, 75) / 100;
  const heroBackgroundColor = colorWithOpacity(
    heroSec.content.background_color || "#f5f1e9",
    heroBackgroundColorOpacity
  );
  const productsPerPage = Math.min(
    100,
    Math.max(1, Math.floor(Number(filterSec.content.products_per_page) || 16))
  );
  const productSortOrder =
    filterSec.content.product_sort_order === "asc" ||
    filterSec.content.product_sort_order === "random"
      ? filterSec.content.product_sort_order
      : "desc";
  const showViewMore = filterSec.content.show_view_more !== false;
  const viewMoreText = filterSec.content.view_more_text || "View More";
  const [visibleProductCount, setVisibleProductCount] = useState(productsPerPage);
  const [randomSeed, setRandomSeed] = useState(0);

  useEffect(() => {
    setVisibleProductCount(productsPerPage);
  }, [activeTab, productsPerPage]);

  useEffect(() => {
    if (productSortOrder === "random") {
      setRandomSeed(Math.floor(Math.random() * 0xffffffff) + 1);
    }
  }, [productSortOrder, productsList]);

  // Dynamic live reviews from MySQL customer_reviews table (ZERO mock fallbacks, instant SSR initialized)
  const cachedReviews = getCachedData<{ reviews: Array<{ id: string; customer_name: string; rating: number; title: string; comment: string }> }>(apiUrl("/api/reviews"));
  const [reviewsList, setReviewsList] = useState<Array<{ id: string; customer_name: string; rating: number; title: string; comment: string }>>(
    () => (initialReviews && initialReviews.length > 0 ? initialReviews : cachedReviews?.reviews || [])
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

  const sortedProducts = useMemo(() => {
    if (productSortOrder === "random") {
      if (randomSeed === 0) return filteredProducts;

      const shuffled = [...filteredProducts];
      let seed = randomSeed;
      const nextRandom = () => {
        seed = (seed * 1664525 + 1013904223) % 0x100000000;
        return seed / 0x100000000;
      };
      for (let index = shuffled.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(nextRandom() * (index + 1));
        [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
      }
      return shuffled;
    }

    return [...filteredProducts].sort((a, b) => {
      const aCreatedAt = a.createdAt ? Date.parse(a.createdAt) : Number.NaN;
      const bCreatedAt = b.createdAt ? Date.parse(b.createdAt) : Number.NaN;
      if (!Number.isFinite(aCreatedAt) || !Number.isFinite(bCreatedAt)) return 0;
      return productSortOrder === "asc"
        ? aCreatedAt - bCreatedAt
        : bCreatedAt - aCreatedAt;
    });
  }, [filteredProducts, productSortOrder, randomSeed]);
  const visibleProducts = showViewMore
    ? sortedProducts.slice(0, visibleProductCount)
    : sortedProducts;

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

  // Curated suite pieces (Real matching storage & bedroom pieces from live catalog)
  const curatedSuiteProducts = useMemo(() => {
    const wardrobe = productsList.find((p) => p.handle.includes("2461") || p.title.toLowerCase().includes("wardrobe"));
    const chest = productsList.find((p) => p.handle.includes("2429") || p.title.toLowerCase().includes("tall chest"));
    const bedside = productsList.find((p) => p.handle.includes("2413") || p.title.toLowerCase().includes("bedside"));
    const suite = [wardrobe, chest, bedside].filter(Boolean) as CatalogProduct[];
    return suite.length > 0 ? suite : productsList.slice(0, 3);
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

  // Only display categories with real products in stock (ZERO fake fallbacks)
  const categoriesWithCounts = useMemo(() => {
    const allTab = { id: "all", name: "All Furniture", count: productsList.length };
    const categoryConfigs = [
      { id: "cat_sofas", name: "Sofas & Seating" },
      { id: "cat_living", name: "Living Room" },
      { id: "cat_dining", name: "Dining Room" },
      { id: "cat_beds", name: "Bedroom" },
      { id: "cat_office", name: "Home Office" },
    ];
    const dynamicTabs = categoryConfigs
      .map((cat) => ({
        id: cat.id,
        name: cat.name,
        count: productsList.filter((p) => p.categoryId === cat.id).length,
      }))
      .filter((tab) => tab.count > 0);
    return [allTab, ...dynamicTabs];
  }, [productsList]);

  return (
    <div className="w-full space-y-10 sm:space-y-20 pb-4 sm:pb-12">
      {/* 1. CINEMATIC FULL-WIDTH HERO */}
      {heroSec.isEnabled && (
        <section className="relative overflow-hidden bg-sand-100 border-b border-sand-200 py-8 sm:py-16 lg:py-24">
          {heroSec.content.background_image_url && (
            <React.Fragment>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={heroSec.content.background_image_url}
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
                style={{ opacity: heroBackgroundImageOpacity }}
              />
            </React.Fragment>
          )}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{ backgroundColor: heroBackgroundColor }}
          />
          <div className="relative z-10 max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10 xl:gap-14 items-center">
              
              {/* Left Column: Value Proposition & Quick Shop */}
              <ScrollReveal direction="up" delay={0.1} duration={0.85} className="lg:col-span-6 space-y-4 sm:space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-sand-50/95 border border-sand-300 text-[11px] sm:text-xs font-medium text-navy-900 shadow-ambient max-w-full">
                  <span className="flex items-center text-brass-500 shrink-0">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <Star className="w-3.5 h-3.5 fill-current" />
                  </span>
                  <span className="truncate">{heroSec.content.rating_score || "4.9/5 from 2,800+ UK Homeowners"}</span>
                  <span className="text-sand-400 hidden sm:inline">•</span>
                  <span className="text-sage-700 font-semibold hidden sm:inline">{heroSec.content.trustpilot_badge || "Trustpilot Rated Excellent"}</span>
                </div>

                <h1 className="text-3xl sm:text-5xl lg:text-6xl xl:text-7xl font-display font-bold tracking-tight text-navy-950 leading-[1.12]">
                  {heroSec.content.headline_line1 || "Bespoke Living,"} <br />
                  <span className="text-navy-700 font-normal italic font-serif">{heroSec.content.headline_line2 || "Handcrafted for Britain."}</span>
                </h1>

                <p className="text-sm sm:text-base lg:text-lg text-navy-700 max-w-xl leading-relaxed">
                  {heroSec.content.description || "Discover tactile textured bouclés, solid European white oak tables, and luxury gas-lift ottoman beds. Enjoy direct UK mainland delivery and premium craftsmanship straight to your home."}
                </p>

                <div className="flex items-center gap-2.5 sm:gap-4 pt-1 sm:pt-2">
                  <Link
                    href={heroSec.content.primary_cta_link || "/catalog"}
                    className="flex-1 sm:flex-none px-5 sm:px-7 py-3 sm:py-4 rounded-xl bg-navy-950 text-sand-50 font-semibold text-xs sm:text-sm hover:bg-navy-900 transition-all flex items-center justify-center gap-2 shadow-card active:scale-[0.98]"
                  >
                    {heroSec.content.primary_cta_text || "Explore All Products"}
                    <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-brass-400" />
                  </Link>

                  <a
                    href={heroSec.content.secondary_cta_link || "#collection-grid"}
                    className="flex-1 sm:flex-none px-4 sm:px-7 py-3 sm:py-4 rounded-xl bg-sand-50 border border-sand-300 text-navy-950 font-semibold text-xs sm:text-sm hover:bg-sand-200 transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
                  >
                    {heroSec.content.secondary_cta_text || "Shop By Room"}
                  </a>
                </div>

                {/* Quick Trust Strip */}
                <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 sm:gap-4 pt-4 sm:pt-6 border-t border-sand-200/80 text-[11px] sm:text-xs text-navy-800">
                  {Array.isArray(heroSec.content.trust_items) && heroSec.content.trust_items.length > 0 ? (
                    heroSec.content.trust_items.map((item: any, i: number) => {
                      const cleanLabel = (item.label || "")
                        .replace(/&?\s*PayPal\s*/gi, "")
                        .replace(/\s+/g, " ")
                        .trim();
                      return (
                        <div key={i} className="flex items-center gap-1.5 sm:gap-2 whitespace-nowrap shrink-0">
                          {item.icon === "Truck" ? (
                            <Truck className="w-4 h-4 text-brass-600 shrink-0" />
                          ) : item.icon === "ShieldCheck" ? (
                            <ShieldCheck className="w-4 h-4 text-forest-700 shrink-0" />
                          ) : (
                            <CreditCard className="w-4 h-4 text-navy-700 shrink-0" />
                          )}
                          <span>{cleanLabel || item.label}</span>
                        </div>
                      );
                    })
                  ) : (
                    <>
                      <div className="flex items-center gap-1.5 sm:gap-2 whitespace-nowrap shrink-0">
                        <Truck className="w-4 h-4 text-brass-600 shrink-0" />
                        <span>UK Mainland Delivery</span>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 whitespace-nowrap shrink-0">
                        <ShieldCheck className="w-4 h-4 text-forest-700 shrink-0" />
                        <span>UK Quality Checked & Tested</span>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 whitespace-nowrap shrink-0">
                        <CreditCard className="w-4 h-4 text-navy-700 shrink-0" />
                        <span>Secure Card Checkout</span>
                      </div>
                    </>
                  )}
                </div>
              </ScrollReveal>

              {/* Right Column: Featured Furniture Showcase Cards */}
              <ScrollReveal direction="scale" delay={0.2} duration={0.85} className="lg:col-span-6 grid grid-cols-2 gap-3 sm:gap-6">
                {heroShowcaseProducts[0] ? (
                  <Link
                    href={`/products/${heroShowcaseProducts[0].handle}`}
                    className="group relative rounded-2xl overflow-hidden aspect-[4/5] bg-sand-200 border border-sand-300 shadow-elevation block"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={heroShowcaseProducts[0].thumbnailUrl}
                      alt={heroShowcaseProducts[0].title}
                      fetchPriority="high"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-navy-950/80 via-transparent to-transparent flex flex-col justify-end p-3 sm:p-5 text-sand-50">
                      <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-brass-400 font-semibold">{heroSec.content.featured_badge || "Featured Masterpiece"}</span>
                      <h3 className="font-display font-bold text-xs sm:text-lg text-sand-50 group-hover:text-brass-300 transition-colors line-clamp-2">{heroShowcaseProducts[0].title}</h3>
                      <div className="flex items-baseline justify-between mt-1">
                        <span className="font-bold text-xs sm:text-base text-sand-50">{formatGBP(heroShowcaseProducts[0].pricePennies)}</span>
                        <span className="text-[10px] sm:text-[11px] text-sand-300 underline">View Item &rarr;</span>
                      </div>
                    </div>
                  </Link>
                ) : (
                  <div className="rounded-2xl aspect-[4/5] bg-sand-200/50 animate-pulse" />
                )}

                <div className="space-y-3 sm:space-y-6 flex flex-col justify-between">
                  {heroShowcaseProducts.slice(1, 3).map((prod, idx) => (
                    <Link
                      key={prod.id || idx}
                      href={`/products/${prod.handle}`}
                      className="group relative rounded-2xl overflow-hidden aspect-[4/3] bg-sand-200 border border-sand-300 shadow-elevation block flex-1"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={prod.thumbnailUrl}
                        alt={prod.title}
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-navy-950/80 via-transparent to-transparent flex flex-col justify-end p-2.5 sm:p-4 text-sand-50">
                        <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-sage-400 font-semibold">{prod.specs?.delivery_tier === "two_man_white_glove" ? "White Glove" : "In Stock"}</span>
                        <h3 className="font-display font-bold text-xs sm:text-base text-sand-50 group-hover:text-brass-300 transition-colors truncate">{prod.title}</h3>
                        <div className="flex items-baseline justify-between mt-0.5">
                          <span className="font-bold text-xs sm:text-sm text-sand-50">{formatGBP(prod.pricePennies)}</span>
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
      )}

      {/* 2. MAIN INTERACTIVE PRODUCT CATALOG BY ROOM (TABBED FILTER) */}
      <section id="collection-grid" className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        <ScrollReveal direction="up" className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-brass-600 font-semibold mb-1">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              {filterSec.content.eyebrow || "Live Catalog Filter"}
            </div>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-navy-950">
              {filterSec.content.heading || "Shop Handcrafted British Furniture"}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-navy-600">
            {filterSec.content.subheading_prefix || "Showing"}{" "}
            <span className="font-bold text-navy-950">{visibleProducts.length}</span>{" "}
            {filterSec.content.subheading_suffix || "pieces ready for UK dispatch"}
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
          {visibleProducts.map((product) => {
            const isAdded = addedProductId === product.id;
            return (
              <StaggerItem
                key={product.id}
                className="group rounded-xl sm:rounded-2xl bg-sand-50 border border-sand-200 overflow-hidden shadow-ambient hover:shadow-elevation transition-[box-shadow,border-color] duration-300 flex flex-col justify-between"
              >
                {/* Product Image & Badges */}
                <div className="relative aspect-[4/3] bg-sand-200 overflow-hidden">
                  <Link
                    href={`/products/${product.handle}`}
                    prefetch={false}
                    className="block w-full h-full"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={product.thumbnailUrl}
                      alt={product.title}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    />
                  </Link>

                  {/* Delivery Tier Badge */}
                  <span className="absolute top-2 left-2 sm:top-3 sm:left-3 z-10 px-1.5 sm:px-2.5 py-0.5 sm:py-1 text-[9px] sm:text-[10px] font-semibold rounded bg-navy-950/90 text-sand-50 shadow-sm">
                    {product.specs.delivery_tier === "two_man_white_glove" ? "White Glove" : "Parcel"}
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
                      prefetch={false}
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
                      <p className="hidden sm:block text-[10px] text-forest-700 font-medium mt-0.5">
                        UK Delivery • 20% VAT Included
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

        {showViewMore && visibleProductCount < sortedProducts.length && (
          <div className="flex justify-center pt-8">
            <button
              type="button"
              onClick={() =>
                setVisibleProductCount((current) =>
                  Math.min(current + productsPerPage, sortedProducts.length)
                )
              }
              className="inline-flex items-center gap-2 rounded-full border border-navy-300 bg-sand-50 px-7 py-3 text-sm font-semibold text-navy-950 shadow-ambient transition-colors hover:border-navy-950 hover:bg-navy-950 hover:text-sand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass-600 focus-visible:ring-offset-2"
            >
              {viewMoreText}
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </section>

      {/* 3. "SHOP THE LOOK" CURATED LIVING ROOM SET */}
      {curatedSec.isEnabled && (
        <section className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <ScrollReveal direction="up" duration={0.65} className="rounded-3xl bg-sand-100 border border-sand-300 p-6 sm:p-10 lg:p-12 overflow-hidden shadow-ambient">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-8">
              <div>
                <span className="text-xs uppercase tracking-widest text-brass-700 font-semibold">
                  {curatedSec.content.eyebrow || "Room Inspiration"}
                </span>
                <h2 className="text-3xl sm:text-4xl font-display font-bold text-navy-950 mt-1">
                  {curatedSec.content.title || "Shop The Belgravia Reception Suite"}
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-navy-600 max-w-md">
                {curatedSec.content.description || "A curated harmony of tactile boucle, forest green velvet, and honed Roman travertine designed to elevate modern British entertaining."}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Large Styled Lifestyle Visual */}
              <div className="lg:col-span-7 relative rounded-2xl overflow-hidden aspect-[16/10] bg-sand-200 border border-sand-300 shadow-elevation">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={curatedSec.content.image_url || "https://files.ekmcdn.com/amosmann1/images/madrid-sliding-door-wardrobe-120cm-gloss-white-2461-2461-p.png"}
                  alt={curatedSec.content.title || "Contemporary Storage & Wardrobe Suite"}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-navy-950/90 text-sand-50 text-xs font-semibold backdrop-blur-sm">
                  {curatedSec.content.badge_text || "Curated 3-Piece Storage Suite"}
                </div>
              </div>

              {/* Included Suite Pieces Direct Buy List */}
              <div className="lg:col-span-5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-navy-700">
                  {curatedSec.content.list_title || "Pieces in this setting:"}
                </h3>
                
                {curatedSuiteProducts.map((item, idx) => (
                  <div key={item.id || idx} className="p-4 rounded-xl bg-sand-50 border border-sand-300 flex items-center justify-between gap-4 shadow-sm hover:border-brass-500 transition-all">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-14 h-14 rounded-lg bg-sand-200 overflow-hidden flex-shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.thumbnailUrl}
                          alt={item.title}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <Link
                          href={`/products/${item.handle}`}
                          prefetch={false}
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
      )}

      {/* 4. LIMITED STOCK & SPECIAL PRICE OFFERS */}
      {promoSec.isEnabled && (
        <section className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <ScrollReveal direction="up" className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-terracotta-600 font-bold mb-1">
                <Flame className="w-3.5 h-3.5" />
                {promoSec.content.eyebrow || "Limited Stock Promotions"}
              </div>
              <h2 className="text-3xl sm:text-4xl font-display font-bold text-navy-950">
                {promoSec.content.heading || "Special Savings on Signature Pieces"}
              </h2>
            </div>
            <Link
              href={promoSec.content.cta_link || "/catalog"}
              className="text-xs sm:text-sm font-semibold text-navy-900 hover:text-brass-600 flex items-center gap-1.5"
            >
              {promoSec.content.cta_text || "View all promotional offers"} <ArrowRight className="w-4 h-4" />
            </Link>
          </ScrollReveal>

          <StaggerContainer className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {saleProducts.slice(0, 4).map((product, index) => {
              const savings = (product.compareAtPricePennies || 0) - product.pricePennies;
              return (
                <StaggerItem
                  key={`sale-${product.id}-${index}`}
                  className="group rounded-xl sm:rounded-2xl bg-sand-50 border border-sand-300 overflow-hidden shadow-ambient hover:shadow-card transition-[box-shadow,border-color] duration-300 flex flex-col justify-between"
                >
                  <Link
                    href={`/products/${product.handle}`}
                    prefetch={false}
                    className="block relative aspect-[4/3] bg-sand-200 overflow-hidden"
                  >
                    <span className="absolute top-2 left-2 sm:top-3 sm:left-3 z-10 px-1.5 sm:px-2.5 py-0.5 sm:py-1 text-[9px] sm:text-[10px] font-bold rounded bg-terracotta-500 text-sand-50 shadow-sm">
                      SAVE {formatGBP(savings)}
                    </span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={product.thumbnailUrl}
                      alt={product.title}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </Link>

                  <div className="p-3 sm:p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] sm:text-[11px] font-semibold text-terracotta-600 uppercase tracking-wide block truncate">
                        {promoSec.content.badge_text || "Low UK stock"}
                      </span>
                      <Link
                        href={`/products/${product.handle}`}
                        prefetch={false}
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
      )}

      {/* 5. NEW ARRIVALS SPOTLIGHT (BEDS, CONSOLES, DINING) */}
      {arrivalsSec.isEnabled && (
        <section className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <ScrollReveal direction="scale" duration={0.65} className="rounded-3xl bg-navy-950 text-sand-50 p-6 sm:p-12 lg:p-16 relative overflow-hidden shadow-elevation">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 sm:mb-10">
              <div>
                <span className="text-xs uppercase tracking-widest text-brass-400 font-semibold">
                  {arrivalsSec.content.eyebrow || "Just Arrived in Showroom"}
                </span>
                <h2 className="text-2xl sm:text-4xl font-display font-bold text-sand-50 mt-1">
                  {arrivalsSec.content.heading || "New Bedroom & Occasional Additions"}
                </h2>
              </div>
              <Link
                href={arrivalsSec.content.cta_link || "/catalog"}
                className="text-xs sm:text-sm font-semibold text-brass-300 hover:text-brass-200 flex items-center gap-1.5"
              >
                {arrivalsSec.content.cta_text || "Explore all new arrivals"} <ArrowRight className="w-4 h-4" />
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
                      {arrivalsSec.content.badge_text || "NEW 2026"}
                    </span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={product.thumbnailUrl}
                      alt={product.title}
                      loading="lazy"
                      decoding="async"
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
      )}

      {/* 6. REAL UK CUSTOMER ROOM REVIEWS */}
      {reviewsSec.isEnabled && (
        <section className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <ScrollReveal direction="up" className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <span className="text-xs uppercase tracking-widest text-brass-600 font-semibold">
                {reviewsSec.content.eyebrow || "Real Homes & Experiences"}
              </span>
              <h2 className="text-3xl font-display font-bold text-navy-950 mt-1">
                {reviewsSec.content.heading || "What British Homeowners Say"}
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs text-navy-700">
              <span className="font-bold text-navy-950">{reviewsSec.content.rating_score || "4.9 / 5.0"}</span>
              <span>{reviewsSec.content.source_label || "Trustpilot & Google Customer Feedback"}</span>
            </div>
          </ScrollReveal>

          {/* Mobile Snap Carousel / Desktop Grid */}
          <div className="relative">
            <div
              ref={reviewsScrollRef}
              onScroll={handleReviewsScroll}
              className="flex md:grid md:grid-cols-3 gap-4 sm:gap-6 xl:gap-8 overflow-x-auto md:overflow-visible snap-x snap-mandatory pb-4 pt-1 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0"
            >
              {reviewsList.map((rev) => {
                const starCount = Math.max(1, Math.min(5, Math.round(Number(rev.rating) || 5)));
                return (
                  <div
                    key={rev.id}
                    className="w-[84vw] max-w-[340px] shrink-0 md:w-auto md:max-w-none md:shrink snap-center p-5 sm:p-6 rounded-2xl bg-sand-100 border border-sand-300/80 shadow-xs flex flex-col justify-between transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-1 text-brass-500">
                          {[...Array(starCount)].map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-current" />
                          ))}
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-sage-100 text-sage-800 font-semibold border border-sage-300">
                          Verified Buyer
                        </span>
                      </div>
                      {rev.title && (
                        <h4 className="text-sm font-bold text-navy-950 mb-1.5 line-clamp-1">
                          {rev.title}
                        </h4>
                      )}
                      <p className="text-xs sm:text-sm text-navy-900 italic leading-relaxed line-clamp-4">
                        &ldquo;{rev.comment}&rdquo;
                      </p>
                    </div>
                    <div className="mt-5 pt-3.5 border-t border-sand-300/80 flex items-center justify-between text-xs">
                      <div>
                        <h4 className="font-bold text-navy-950 text-xs sm:text-sm">{rev.customer_name}</h4>
                        <p className="text-[10px] sm:text-[11px] text-navy-600">Verified Client</p>
                      </div>
                      <span className="text-[10px] text-navy-500 font-medium">UK Delivery</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mobile Carousel Pagination Indicators */}
            {reviewsList.length > 1 && (
              <div className="flex md:hidden items-center justify-center gap-1.5 pt-2">
                {reviewsList.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => scrollToReview(i)}
                    aria-label={`Go to customer review ${i + 1}`}
                    className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                      activeReviewIndex === i ? "w-6 bg-brass-600" : "w-1.5 bg-sand-300"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
