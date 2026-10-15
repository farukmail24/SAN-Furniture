import Link from "next/link";
import { Shield, Sparkles, Truck, RotateCcw } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-navy-950 text-sand-100 border-t border-navy-800">
      {/* 4 Pillars of UK Customer Confidence */}
      <div className="border-b border-navy-800 py-10">
        <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-navy-900 rounded-xl text-brass-500 border border-navy-800">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sand-50 font-semibold text-sm">UK 2-Man White Glove</h4>
              <p className="text-sand-300 text-xs mt-1">
                Room of choice placement, pre-booked 2hr delivery window across UK Mainland.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-3 bg-navy-900 rounded-xl text-brass-500 border border-navy-800">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sand-50 font-semibold text-sm">14-Day Statutory Returns</h4>
              <p className="text-sand-300 text-xs mt-1">
                Full statutory rights per Consumer Contracts Regulations 2013 with simple collection.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-3 bg-navy-900 rounded-xl text-brass-500 border border-navy-800">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sand-50 font-semibold text-sm">BS 5852 Fire Safety</h4>
              <p className="text-sand-300 text-xs mt-1">
                100% compliant with UK Furniture and Furnishings Regulations 1988 with verified labels.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-3 bg-navy-900 rounded-xl text-brass-500 border border-navy-800">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sand-50 font-semibold text-sm">Klarna & Clearpay</h4>
              <p className="text-sand-300 text-xs mt-1">
                Spread the cost interest-free in 3 installments with instant automated decision.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-14 grid grid-cols-2 md:grid-cols-5 gap-8">
        <div className="col-span-2">
          <Link href="/" className="inline-block">
            <img
              src="/San-Furniture-Logo-Dark.png"
              alt="SAN Furniture UK"
              className="h-10 sm:h-12 w-auto object-contain"
            />
          </Link>
          <p className="text-sand-300 text-xs mt-3 max-w-sm leading-relaxed">
            Delivering bespoke craftsmanship, architectural aesthetics, and white-glove customer care straight to British homes.
          </p>
          <div className="mt-6 text-xs text-sand-400">
            <p className="font-medium text-sand-200">Customer Support (UK)</p>
            <p className="mt-1">Monday – Friday: 09:00 – 18:00 GMT</p>
            <p>support@sanfurniture.co.uk</p>
          </div>
        </div>

        <div>
          <h4 className="text-sand-50 font-semibold text-xs uppercase tracking-wider">Collections</h4>
          <ul className="mt-4 space-y-2.5 text-xs text-sand-300">
            <li><Link href="/categories/sofas" className="hover:text-brass-400">Sofas & Lounges</Link></li>
            <li><Link href="/categories/armchairs" className="hover:text-brass-400">Bouclé Armchairs</Link></li>
            <li><Link href="/categories/dining" className="hover:text-brass-400">Solid Oak Dining</Link></li>
            <li><Link href="/categories/bedroom" className="hover:text-brass-400">Luxury Beds</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sand-50 font-semibold text-xs uppercase tracking-wider">Customer Care</h4>
          <ul className="mt-4 space-y-2.5 text-xs text-sand-300">
            <li><Link href="/delivery" className="hover:text-brass-400">UK Delivery & Postcodes</Link></li>
            <li><Link href="/returns" className="hover:text-brass-400">14-Day Returns Policy</Link></li>
            <li><Link href="/track-order" className="hover:text-brass-400">Track Consignment</Link></li>
            <li><Link href="/swatches" className="hover:text-brass-400">Order Free Fabric Swatches</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sand-50 font-semibold text-xs uppercase tracking-wider">Legal & Compliance</h4>
          <ul className="mt-4 space-y-2.5 text-xs text-sand-300">
            <li><Link href="/privacy" className="hover:text-brass-400">UK GDPR Privacy & Cookies</Link></li>
            <li><Link href="/terms" className="hover:text-brass-400">Terms of Service</Link></li>
            <li><Link href="/fire-safety" className="hover:text-brass-400">Fire Safety Regulations</Link></li>
            <li><Link href="/vat" className="hover:text-brass-400">VAT & Tax Information</Link></li>
          </ul>
        </div>
      </div>

      {/* Mandatory UK Companies Act and Tax Disclosures */}
      <div className="border-t border-navy-900 bg-navy-950/80 py-6 text-[11px] text-sand-400">
        <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <p>
              © {new Date().getFullYear()} SAN Furniture Ltd. Registered in England & Wales (Company No. 15998234).
            </p>
            <p className="mt-0.5 text-sand-500">
              All prices shown include 20% UK VAT. VAT Registration Number: GB 499 8210 44.
            </p>
          </div>
          <div className="flex items-center gap-3 text-sand-300 font-semibold text-[11px]">
            <span className="px-2 py-1 bg-navy-900 rounded border border-navy-800">Visa / Mastercard</span>
            <span className="px-2 py-1 bg-navy-900 rounded border border-navy-800">Apple Pay</span>
            <span className="px-2 py-1 bg-navy-900 rounded border border-navy-800">Google Pay</span>
            <span className="px-2 py-1 bg-navy-900 rounded border border-navy-800 text-pink-300">Klarna.</span>
            <span className="px-2 py-1 bg-navy-900 rounded border border-navy-800 text-teal-300">clearpay</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
