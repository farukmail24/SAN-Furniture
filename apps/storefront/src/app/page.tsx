import Link from "next/link";
import { ArrowRight, Star, ShieldCheck, Truck, Clock } from "lucide-react";
import { formatGBP } from "@san-furniture/types";

export default function HomePage() {
  const featuredCollections = [
    {
      title: "Bouclé & Velvet Sofas",
      subtitle: "3-Seaters, Corner Groups & Chaises",
      href: "/categories/sofas",
      startingPricePennies: 79900,
      image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80",
      tag: "Best Seller"
    },
    {
      title: "Solid Oak Dining Tables",
      subtitle: "Extendable & Architectural Profiles",
      href: "/categories/dining",
      startingPricePennies: 54900,
      image: "https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=800&q=80",
      tag: "Handcrafted"
    },
    {
      title: "Sculptural Accent Armchairs",
      subtitle: "Ergonomic British Comfort",
      href: "/categories/armchairs",
      startingPricePennies: 34900,
      image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80",
      tag: "Trending"
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

      {/* Hero Section */}
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
                <span className="text-sage-700 font-semibold">Trustpilot</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold tracking-tight text-navy-950 leading-[1.1]">
                Enduring Design, <br />
                <span className="text-navy-700 font-normal italic font-serif">Made for Everyday Luxury.</span>
              </h1>

              {/* Subheadline */}
              <p className="text-base sm:text-lg text-navy-700 max-w-xl leading-relaxed">
                Experience high-performance fabrics, FSC-certified hardwoods, and room-of-choice 2-man white glove delivery across the United Kingdom.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  href="/categories/sofas"
                  className="px-6 py-3.5 rounded-md bg-navy-950 text-sand-50 font-medium text-sm hover:bg-navy-900 transition-all flex items-center gap-2 shadow-card active:scale-[0.98]"
                >
                  Explore Collection
                  <ArrowRight className="w-4 h-4 text-brass-400" />
                </Link>

                <Link
                  href="/swatches"
                  className="px-6 py-3.5 rounded-md bg-sand-50 border border-sand-300 text-navy-900 font-medium text-sm hover:bg-sand-200 transition-all flex items-center gap-2"
                >
                  Order Free Swatches
                </Link>
              </div>

              {/* 3 Quick USPs */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-sand-200 text-xs text-navy-800">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-sage-700 shrink-0" />
                  <span>Free UK White Glove over £500</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-brass-600 shrink-0" />
                  <span>BS 5852 Fire Certified</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-navy-600 shrink-0" />
                  <span>14-Day Hassle-Free Returns</span>
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

      {/* Featured Furniture Collections */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <span className="text-xs uppercase tracking-widest text-brass-600 font-semibold">
              Curated Living
            </span>
            <h2 className="text-3xl font-display font-bold text-navy-950 mt-1">
              Explore Our Living Spaces
            </h2>
          </div>
          <Link
            href="/catalog"
            className="mt-4 md:mt-0 text-sm font-semibold text-navy-900 hover:text-brass-600 flex items-center gap-1.5 transition-colors"
          >
            View all collections
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
              <div className="p-6">
                <h3 className="font-display font-bold text-xl text-navy-950 group-hover:text-brass-600 transition-colors">
                  {collection.title}
                </h3>
                <p className="text-xs text-navy-600 mt-1">
                  {collection.subtitle}
                </p>
                <div className="mt-4 pt-4 border-t border-sand-200 flex items-center justify-between text-xs">
                  <span className="text-navy-500 font-medium">From {formatGBP(collection.startingPricePennies)}</span>
                  <span className="font-semibold text-navy-900 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                    Shop Now <ArrowRight className="w-3.5 h-3.5 text-brass-500" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
