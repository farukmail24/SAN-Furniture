import Link from "next/link";
import { Search, ShoppingBag, ShieldCheck, Truck, Menu } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-sand-200 bg-sand-50/95 backdrop-blur-md">
      {/* Top Value Proposition & Legal Bar */}
      <div className="bg-navy-950 text-sand-50 text-xs py-2 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-[11px] sm:text-xs">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-sage-600 font-medium">
              <Truck className="w-3.5 h-3.5" />
              Free 2-Man Delivery on UK Orders Over £500
            </span>
            <span className="hidden md:inline-block text-sand-400">|</span>
            <span className="hidden md:flex items-center gap-1 text-sand-300">
              <ShieldCheck className="w-3.5 h-3.5 text-brass-500" />
              100% Fire Safety Compliant (BS 5852)
            </span>
          </div>
          <div className="flex items-center gap-3 text-sand-300 font-medium">
            <span>Klarna Pay in 3</span>
            <span>•</span>
            <span>UK VAT Included</span>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-6">
        {/* Mobile menu button */}
        <button
          type="button"
          aria-label="Open mobile menu"
          className="lg:hidden p-2 text-navy-900 hover:text-navy-700"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Brand Logo */}
        <Link href="/" className="flex flex-col items-start group">
          <span className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-navy-950 group-hover:text-brass-600 transition-colors">
            SAN <span className="font-light text-navy-700">FURNITURE</span>
          </span>
          <span className="text-[10px] tracking-widest text-navy-600 uppercase font-medium">
            Crafted for British Living
          </span>
        </Link>

        {/* Primary Desktop Category Links */}
        <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-navy-900">
          <Link
            href="/categories/sofas"
            className="hover:text-brass-600 transition-colors py-2 border-b-2 border-transparent hover:border-brass-500"
          >
            Sofas & Corner Groups
          </Link>
          <Link
            href="/categories/armchairs"
            className="hover:text-brass-600 transition-colors py-2 border-b-2 border-transparent hover:border-brass-500"
          >
            Armchairs & Accent
          </Link>
          <Link
            href="/categories/dining"
            className="hover:text-brass-600 transition-colors py-2 border-b-2 border-transparent hover:border-brass-500"
          >
            Dining Tables & Chairs
          </Link>
          <Link
            href="/categories/bedroom"
            className="hover:text-brass-600 transition-colors py-2 border-b-2 border-transparent hover:border-brass-500"
          >
            Beds & Storage
          </Link>
        </nav>

        {/* Search & Actions */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            aria-label="Search furniture catalog"
            className="flex items-center gap-2 px-3 py-1.5 text-xs text-navy-700 bg-sand-100 border border-sand-200 rounded-md hover:bg-sand-200 transition-colors"
          >
            <Search className="w-4 h-4 text-navy-600" />
            <span className="hidden sm:inline">Search furniture...</span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] bg-sand-50 rounded border border-sand-300 text-navy-500">
              ⌘K
            </kbd>
          </button>

          <Link
            href="/basket"
            aria-label="Shopping Basket"
            className="relative p-2.5 rounded-full bg-navy-950 text-sand-50 hover:bg-navy-900 transition-transform active:scale-95"
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 bg-brass-500 text-navy-950 text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              0
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}
