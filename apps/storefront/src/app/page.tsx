import Link from "next/link";
import {
  ArrowRight,
  Star,
  ShieldCheck,
  Truck,
  Clock,
  Sparkles,
  Ruler,
  CheckCircle2,
  Box,
  CreditCard,
  HelpCircle,
  Layers
} from "lucide-react";
import { formatGBP } from "@san-furniture/types";
import { CATALOG_PRODUCTS, CATALOG_CATEGORIES } from "../lib/catalog";

export default function HomePage() {
  const featuredCollections = [
    {
      title: "Bouclé & Velvet Sofas",
      subtitle: "3-Seaters, Deep Loungers & Corner Groups",
      href: "/categories/sofas",
      startingPricePennies: 89900,
      image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80",
      tag: "Best Seller"
    },
    {
      title: "Solid Oak Dining Tables",
      subtitle: "Extendable & Architectural Live-Edge Profiles",
      href: "/categories/dining",
      startingPricePennies: 38900,
      image: "https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=800&q=80",
      tag: "Handcrafted"
    },
    {
      title: "Sculptural Accent Armchairs",
      subtitle: "360° Swivels & Cantilever Leather Comfort",
      href: "/categories/armchairs",
      startingPricePennies: 49900,
      image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80",
      tag: "Trending"
    },
    {
      title: "Ottoman Storage Beds",
      subtitle: "Hydraulic Gas-Lift & Solid Spindle Frames",
      href: "/categories/beds",
      startingPricePennies: 94900,
      image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80",
      tag: "New Arrivals"
    }
  ];

  // Selected spotlight products for homepage showcase
  const spotlightProducts = CATALOG_PRODUCTS.slice(0, 6);

  const customerReviews = [
    {
      name: "Lady Georgina Sterling",
      location: "Kensington, London",
      item: "The Kensington 3-Seater Sofa",
      rating: 5,
      date: "Delivered 3 days ago",
      text: "The oat bouclé is delightfully tactile, and the proportions sit majestically in our double-reception room. The 2-man white glove delivery team was impeccably courteous, even removing all packaging materials for recycling.",
      verified: true
    },
    {
      name: "Dr. Alistair MacLeod",
      location: "Morningside, Edinburgh",
      item: "The Windsor Solid Oak Dining Table",
      rating: 5,
      date: "Delivered last week",
      text: "Solid 40mm French oak with extraordinary medullary grain patterns. Extending it for a dinner party of eight took less than twenty seconds. Outstanding craftsmanship.",
      verified: true
    },
    {
      name: "Charlotte & David Evans",
      location: "Harrogate, North Yorkshire",
      item: "Westminster Ottoman Storage Bed",
      rating: 5,
      date: "Delivered 2 weeks ago",
      text: "The gas-lift ottoman mechanism is effortless. Finally, a luxury upholstered bed that gives us substantial hidden storage without compromising on boutique hotel aesthetics.",
      verified: true
    }
  ];

  const homepageFaqs = [
    {
      question: "How does the 2-Man White Glove delivery service work?",
      answer: "For all bulky items (sofas, corner groups, dining tables, beds), our specialized two-man logistics crew books a precise 2-hour delivery window. They carry your items directly to your room of choice, unpack them, assemble basic components, and remove all protective packaging for eco-conscious recycling."
    },
    {
      question: "Are your upholstered pieces compliant with UK Fire Safety Laws?",
      answer: "Yes, 100%. Every single armchair, sofa, and upholstered headboard is rigorously tested and certified compliant with the UK Furniture and Furnishings (Fire Safety) Regulations 1988 (BS 5852: Part 1). Each item arrives with its permanent statutory fire compliance label intact."
    },
    {
      question: "What is your 76.2cm doorway clearance guarantee?",
      answer: "Standard UK residential doorways are 76.2cm (30 inches) wide. All our furniture specs display a guaranteed minimum doorway clearance. Furthermore, our sofas feature removable solid hardwood plinths and modular frame connections to ensure seamless entry into Victorian and modern homes."
    },
    {
      question: "Can I pay in instalments with Klarna or Clearpay?",
      answer: "Yes! At checkout you can select Klarna Pay in 3 to split your order total into 3 equal, interest-free monthly payments (0% APR). We also support Apple Pay, Google Pay, Visa, Mastercard, and PayPal Business."
    }
  ];

  return (
    <>
      {/* Schema.org Organization Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FurnitureStore",
            name: "SAN Furniture",
            url: "https://sanfurniture.co.uk",
            priceRange: "£££",
            address: {
              "@type": "PostalAddress",
              addressCountry: "GB"
            },
            currenciesAccepted: "GBP",
            paymentAccepted: "Credit Card, Apple Pay, Google Pay, Klarna, Clearpay, PayPal"
          })
        }}
      />

      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-sand-100 py-16 sm:py-24 border-b border-sand-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Editorial Value Proposition */}
            <div className="lg:col-span-7 space-y-6">
              {/* Trust & Social Proof Pill */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sand-50 border border-sand-300 text-xs font-medium text-navy-900 shadow-ambient">
                <div className="flex items-center text-brass-500">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <Star className="w-3.5 h-3.5 fill-current" />
                </div>
                <span>4.9/5 from 2,800+ UK Homeowners</span>
                <span className="text-sand-400">•</span>
                <span className="text-sage-700 font-semibold">Trustpilot Rated Excellent</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold tracking-tight text-navy-950 leading-[1.1]">
                Enduring Design, <br />
                <span className="text-navy-700 font-normal italic font-serif">Made for Everyday Luxury.</span>
              </h1>

              {/* Subheadline */}
              <p className="text-base sm:text-lg text-navy-700 max-w-xl leading-relaxed">
                Handcrafted bouclé lounges, solid European white oak tables, and gas-lift ottoman beds with complimentary 2-man room-of-choice delivery throughout the UK.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  href="/catalog"
                  className="px-6 py-3.5 rounded-md bg-navy-950 text-sand-50 font-medium text-sm hover:bg-navy-900 transition-all flex items-center gap-2 shadow-card active:scale-[0.98]"
                >
                  Explore Complete Catalog
                  <ArrowRight className="w-4 h-4 text-brass-400" />
                </Link>

                <a
                  href="#swatches-box"
                  className="px-6 py-3.5 rounded-md bg-sand-50 border border-sand-300 text-navy-900 font-medium text-sm hover:bg-sand-200 transition-all flex items-center gap-2"
                >
                  Order Free Swatches
                </a>
              </div>

              {/* 3 Quick USPs */}
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
                  <Clock className="w-4 h-4 text-navy-600 shrink-0" />
                  <span>14-Day Statutory Returns</span>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Visual Card */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-2xl overflow-hidden shadow-elevation border border-sand-300 aspect-[4/5] bg-sand-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=85"
                  alt="Kensington 3-Seater Sofa in Oat Bouclé"
                  className="w-full h-full object-cover object-center"
                />

                {/* Floating Product Highlight Tag */}
                <div className="absolute bottom-6 left-6 right-6 p-4 rounded-xl bg-sand-50/95 backdrop-blur-md border border-sand-200 shadow-card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-navy-600 font-medium">Signature Collection</p>
                      <h3 className="font-display font-bold text-navy-950 text-base">The Kensington 3-Seater</h3>
                      <p className="text-xs text-navy-600 mt-0.5">Oat Textured Bouclé • Solid Oak Plinth</p>
                    </div>
                    <div className="text-right">
                      <p className="font-display font-bold text-navy-950 text-lg">
                        {formatGBP(129900)}
                      </p>
                      <p className="text-[10px] text-sage-700 font-medium">In Stock for UK Dispatch</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. KLARNA FINANCE STRIP */}
      <section className="bg-sand-200/60 border-b border-sand-300 py-3.5 px-4 text-center">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-3 text-xs sm:text-sm text-navy-900">
          <span className="font-semibold flex items-center gap-1.5 text-navy-950">
            <CreditCard className="w-4 h-4 text-brass-600" />
            Klarna. Pay in 3
          </span>
          <span className="hidden sm:inline text-sand-400">|</span>
          <span>Spread the cost into 3 interest-free payments (0% APR) on all orders over £250.</span>
          <Link href="/catalog" className="text-brass-700 font-semibold hover:underline inline-flex items-center gap-1 ml-1">
            Shop with Klarna <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

      {/* 3. FEATURED FURNITURE SPACES (4 BENTO CARDS) */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <span className="text-xs uppercase tracking-widest text-brass-600 font-semibold">
              Curated Spaces
            </span>
            <h2 className="text-3xl font-display font-bold text-navy-950 mt-1">
              Explore Our Living Collections
            </h2>
          </div>
          <Link
            href="/catalog"
            className="mt-4 md:mt-0 text-sm font-semibold text-navy-900 hover:text-brass-600 flex items-center gap-1.5 transition-colors"
          >
            View all 14 pieces in catalog
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredCollections.map((collection) => (
            <Link
              key={collection.title}
              href={collection.href}
              className="group block rounded-xl overflow-hidden bg-sand-100 border border-sand-200 hover:border-sand-300 transition-all shadow-ambient hover:shadow-card"
            >
              <div className="aspect-[4/3] overflow-hidden bg-sand-200 relative">
                <span className="absolute top-3 left-3 z-10 px-2.5 py-1 text-[11px] font-semibold rounded bg-navy-950 text-sand-50">
                  {collection.tag}
                </span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={collection.image}
                  alt={collection.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                />
              </div>
              <div className="p-5">
                <h3 className="font-display font-bold text-lg text-navy-950 group-hover:text-brass-600 transition-colors">
                  {collection.title}
                </h3>
                <p className="text-xs text-navy-600 mt-1 line-clamp-1">
                  {collection.subtitle}
                </p>
                <div className="mt-3 pt-3 border-t border-sand-200 flex items-center justify-between text-xs">
                  <span className="text-navy-600 font-medium">From {formatGBP(collection.startingPricePennies)}</span>
                  <span className="font-semibold text-navy-950 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                    Shop <ArrowRight className="w-3.5 h-3.5 text-brass-500" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. BEST SELLERS SPOTLIGHT PRODUCT GRID */}
      <section className="py-16 bg-sand-100/60 border-y border-sand-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-brass-600 font-semibold mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                Featured UK Masterpieces
              </div>
              <h2 className="text-3xl font-display font-bold text-navy-950">
                Most Desired Handcrafted Furniture
              </h2>
            </div>
            <Link
              href="/catalog"
              className="mt-3 md:mt-0 text-sm font-semibold text-navy-900 hover:text-brass-600 flex items-center gap-1.5 transition-colors"
            >
              Browse complete showroom
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {spotlightProducts.map((product) => {
              const klarnaPayment = Math.round(product.pricePennies / 3);
              return (
                <div
                  key={product.id}
                  className="group rounded-2xl bg-sand-50 border border-sand-200 overflow-hidden shadow-ambient hover:shadow-elevation transition-all flex flex-col"
                >
                  <Link href={`/products/${product.handle}`} className="block relative aspect-[4/3] overflow-hidden bg-sand-200">
                    <span className="absolute top-3 left-3 z-10 px-2.5 py-1 text-[11px] font-semibold rounded bg-navy-950 text-sand-50 shadow-sm">
                      {product.specs.delivery_tier === "two_man_white_glove" ? "2-Man White Glove" : "Standard UK Parcel"}
                    </span>
                    {product.compareAtPricePennies && (
                      <span className="absolute top-3 right-3 z-10 px-2 py-0.5 text-[10px] font-bold rounded bg-terracotta-500 text-sand-50 shadow-sm">
                        SAVE {formatGBP(product.compareAtPricePennies - product.pricePennies)}
                      </span>
                    )}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={product.thumbnailUrl}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </Link>

                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-xs text-navy-500 mb-1.5">
                        <span className="capitalize">{product.specs.color}</span>
                        <span>{product.specs.width_cm} × {product.specs.depth_cm} cm</span>
                      </div>
                      <Link href={`/products/${product.handle}`}>
                        <h3 className="font-display font-bold text-lg text-navy-950 group-hover:text-brass-600 transition-colors leading-snug">
                          {product.title}
                        </h3>
                      </Link>
                      <p className="text-xs text-navy-600 mt-2 line-clamp-2 leading-relaxed">
                        {product.subtitle}
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-sand-200 flex items-end justify-between">
                      <div>
                        <div className="flex items-baseline gap-2">
                          <span className="font-display font-bold text-xl text-navy-950">
                            {formatGBP(product.pricePennies)}
                          </span>
                          {product.compareAtPricePennies && (
                            <span className="text-xs text-navy-400 line-through">
                              {formatGBP(product.compareAtPricePennies)}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-navy-500 mt-0.5">
                          Or 3x {formatGBP(klarnaPayment)} with Klarna
                        </p>
                      </div>

                      <Link
                        href={`/products/${product.handle}`}
                        className="px-4 py-2 rounded-lg bg-navy-950 text-sand-50 text-xs font-semibold hover:bg-navy-900 transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                      >
                        View Details
                        <ArrowRight className="w-3.5 h-3.5 text-brass-400" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. WILL IT FIT? 76.2CM UK DOORWAY GUARANTEE */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-navy-950 text-sand-50 p-8 sm:p-12 lg:p-16 relative overflow-hidden shadow-elevation">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sand-50/10 border border-sand-50/20 text-xs font-medium text-brass-300">
                <Ruler className="w-3.5 h-3.5" />
                Architectural Fit Guarantee
              </div>
              <h2 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-sand-50 leading-tight">
                Will It Fit? <br />
                <span className="text-brass-300 font-normal italic font-serif">Certified for 76.2cm Standard UK Doorways.</span>
              </h2>
              <p className="text-sm sm:text-base text-sand-300 leading-relaxed max-w-xl">
                Nothing is more frustrating than a delivery that cannot navigate your home. Every SAN Furniture sofa and dining table is architecturally engineered with removable feet, modular locking brackets, or flat-pack packaging to guarantee smooth transit through standard 30-inch (76.2cm) British hallways, stairwells, and lifts.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 text-xs sm:text-sm text-sand-200">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-brass-400 shrink-0 mt-0.5" />
                  <span>Precise diagonal doorway clearances calculated on every product page.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-brass-400 shrink-0 mt-0.5" />
                  <span>Removable solid oak plinths reduce profile height by up to 12cm.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-brass-400 shrink-0 mt-0.5" />
                  <span>2-man logistics team conducts pre-delivery access checks.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-brass-400 shrink-0 mt-0.5" />
                  <span>14-day zero-hassle exchange if a piece cannot fit.</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 bg-sand-50/5 border border-sand-50/10 rounded-2xl p-6 backdrop-blur-sm space-y-4">
              <h3 className="font-display font-bold text-base text-sand-100 flex items-center gap-2">
                <Box className="w-4 h-4 text-brass-400" />
                Room of Choice White Glove Protocol
              </h3>
              <p className="text-xs text-sand-300 leading-relaxed">
                Our two-man delivery professionals do not leave your furniture on the kerbside. They carry each box directly into your designated living room or master bedroom, assemble it according to specification, and whisk away all cardboard and polystyrene for zero-landfill recycling.
              </p>
              <div className="p-3.5 rounded-xl bg-sand-50/10 border border-sand-50/10 flex items-center justify-between text-xs">
                <span className="text-sand-300 font-medium">Standard UK Mainland:</span>
                <span className="font-bold text-brass-300">FREE on orders over £500</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. CRAFTSMANSHIP & MATERIAL INTEGRITY BENTO GRID */}
      <section className="py-16 bg-sand-100 border-t border-sand-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs uppercase tracking-widest text-brass-600 font-semibold">
              Heritage Materials
            </span>
            <h2 className="text-3xl font-display font-bold text-navy-950 mt-1">
              Engineered with Uncompromising Craft
            </h2>
            <p className="text-xs sm:text-sm text-navy-600 mt-2">
              From sustainable European forests to fire-safe British textiles, discover the four pillars of SAN Furniture quality.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-sand-50 border border-sand-200 shadow-ambient">
              <div className="w-10 h-10 rounded-xl bg-sand-200 flex items-center justify-center text-navy-900 mb-4">
                <Layers className="w-5 h-5 text-brass-600" />
              </div>
              <h3 className="font-display font-bold text-base text-navy-950">FSC European Oak & Walnut</h3>
              <p className="text-xs text-navy-600 mt-2 leading-relaxed">
                Sustainably harvested from certified managed French and English woodlands. Kiln-dried to 8% moisture content to prevent seasonal warping in heated British homes.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-sand-50 border border-sand-200 shadow-ambient">
              <div className="w-10 h-10 rounded-xl bg-sand-200 flex items-center justify-center text-navy-900 mb-4">
                <ShieldCheck className="w-5 h-5 text-brass-600" />
              </div>
              <h3 className="font-display font-bold text-base text-navy-950">BS 5852 Fire Compliance</h3>
              <p className="text-xs text-navy-600 mt-2 leading-relaxed">
                Full compliance with the UK Furniture and Furnishings Regulations 1988. Flame-retardant interliners and foam cores tested with cigarette and match resistance.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-sand-50 border border-sand-200 shadow-ambient">
              <div className="w-10 h-10 rounded-xl bg-sand-200 flex items-center justify-center text-navy-900 mb-4">
                <Sparkles className="w-5 h-5 text-brass-600" />
              </div>
              <h3 className="font-display font-bold text-base text-navy-950">50,000+ Martindale Rubs</h3>
              <p className="text-xs text-navy-600 mt-2 leading-relaxed">
                Our heavy-textured bouclés, Belgian washed linens, and velvets undergo intense abrasion testing to withstand family life, children, and pets without pilling.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-sand-50 border border-sand-200 shadow-ambient">
              <div className="w-10 h-10 rounded-xl bg-sand-200 flex items-center justify-center text-navy-900 mb-4">
                <Truck className="w-5 h-5 text-brass-600" />
              </div>
              <h3 className="font-display font-bold text-base text-navy-950">White Glove Delivery</h3>
              <p className="text-xs text-navy-600 mt-2 leading-relaxed">
                Dedicated 2-man uniformed delivery partners specializing in fine furniture logistics. Two-hour delivery notification windows and live GPS tracking links.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FREE FABRIC SWATCHES DISPATCH BOX */}
      <section id="swatches-box" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-sand-200/80 border border-sand-300 p-8 sm:p-12 lg:p-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 space-y-4">
              <span className="text-xs uppercase tracking-widest text-brass-700 font-semibold">
                Complimentary Service
              </span>
              <h2 className="text-3xl sm:text-4xl font-display font-bold text-navy-950">
                Order Up to 5 Free Luxury Fabric Swatches
              </h2>
              <p className="text-xs sm:text-sm text-navy-700 leading-relaxed max-w-xl">
                Experience the weight, pile, and texture of our fabrics in your own home lighting. Each presentation box includes generous 15×15cm swatches of our textured Oat Bouclé, Forest Velvet, Natural Belgian Linen, and Cognac Saddle Leather.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <span className="px-3 py-1.5 rounded-full bg-sand-50 text-xs font-semibold text-navy-900 border border-sand-300">
                  ✓ Royal Mail 48hr Tracked
                </span>
                <span className="px-3 py-1.5 rounded-full bg-sand-50 text-xs font-semibold text-navy-900 border border-sand-300">
                  ✓ 100% Free of Charge
                </span>
                <span className="px-3 py-1.5 rounded-full bg-sand-50 text-xs font-semibold text-navy-900 border border-sand-300">
                  ✓ Zero Commitment
                </span>
              </div>
            </div>

            <div className="lg:col-span-5 bg-sand-50 rounded-2xl p-6 border border-sand-300 shadow-card">
              <h3 className="font-display font-bold text-navy-950 text-base mb-1">
                Request Your Swatch Box
              </h3>
              <p className="text-xs text-navy-600 mb-4">
                Delivered straight through your letterbox in 2 working days.
              </p>
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-navy-700 uppercase mb-1">Full Name</label>
                  <input
                    type="text"
                    defaultValue="Eleanor Vance"
                    className="w-full px-3 py-2 rounded-lg bg-sand-100 border border-sand-300 text-xs text-navy-950 focus:outline-none focus:ring-2 focus:ring-brass-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-navy-700 uppercase mb-1">UK Postal Address</label>
                  <input
                    type="text"
                    defaultValue="Flat 4, 12 Kensington Palace Gardens"
                    className="w-full px-3 py-2 rounded-lg bg-sand-100 border border-sand-300 text-xs text-navy-950 focus:outline-none focus:ring-2 focus:ring-brass-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-navy-700 uppercase mb-1">UK Postcode</label>
                  <input
                    type="text"
                    defaultValue="W8 4QP"
                    className="w-full px-3 py-2 rounded-lg bg-sand-100 border border-sand-300 text-xs text-navy-950 focus:outline-none focus:ring-2 focus:ring-brass-500"
                  />
                </div>
                <button
                  type="button"
                  className="w-full py-3 rounded-lg bg-navy-950 text-sand-50 font-semibold text-xs hover:bg-navy-900 transition-all flex items-center justify-center gap-2 mt-2 shadow-sm active:scale-98"
                >
                  Dispatch My Free Swatch Pack
                  <ArrowRight className="w-3.5 h-3.5 text-brass-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. VERIFIED UK CUSTOMER ARCHITECTURAL REVIEWS */}
      <section className="py-20 bg-sand-100/60 border-t border-sand-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <span className="text-xs uppercase tracking-widest text-brass-600 font-semibold">
                Client Testimonials
              </span>
              <h2 className="text-3xl font-display font-bold text-navy-950 mt-1">
                Loved by Homes Across Britain
              </h2>
            </div>
            <div className="mt-4 md:mt-0 flex items-center gap-2 text-xs text-navy-700">
              <span className="font-bold text-navy-950">4.9 / 5.0 Rating</span>
              <span>from 2,800+ Trustpilot & Google Reviews</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {customerReviews.map((review) => (
              <div
                key={review.name}
                className="p-6 rounded-2xl bg-sand-50 border border-sand-200 shadow-ambient flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-1 text-brass-500 mb-3">
                    {[...Array(review.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm text-navy-800 italic leading-relaxed">
                    &ldquo;{review.text}&rdquo;
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-sand-200 flex items-center justify-between text-xs">
                  <div>
                    <h4 className="font-semibold text-navy-950">{review.name}</h4>
                    <p className="text-[11px] text-navy-500">{review.location}</p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-sage-100 text-sage-800 font-semibold border border-sage-200">
                    Verified Buyer
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. HOME BUYING GUIDE & FREQUENT QUESTIONS */}
      <section className="py-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-xs uppercase tracking-widest text-brass-600 font-semibold">
            Assurance & Advice
          </span>
          <h2 className="text-3xl font-display font-bold text-navy-950 mt-1">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-navy-600 mt-2">
            Everything you need to know about delivery, fire safety, and our UK guarantees.
          </p>
        </div>

        <div className="space-y-4">
          {homepageFaqs.map((faq, idx) => (
            <div
              key={idx}
              className="p-6 rounded-xl bg-sand-50 border border-sand-200 shadow-ambient"
            >
              <h3 className="font-display font-bold text-base text-navy-950 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-brass-600 shrink-0" />
                {faq.question}
              </h3>
              <p className="text-xs sm:text-sm text-navy-700 mt-2 leading-relaxed pl-6">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
