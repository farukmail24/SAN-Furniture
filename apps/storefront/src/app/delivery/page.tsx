import type { Metadata } from "next";
import Link from "next/link";
import {
  ChevronRight,
  Truck,
  Box,
  ShieldCheck,
  MapPin,
  Clock,
  ArrowRight,
  Phone,
  Mail,
  Calendar,
  AlertTriangle,
  FileText,
  Lock,
  Building,
  CheckCircle2,
  HelpCircle,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { getLiveSections } from "@/lib/cms-server";
import { DEFAULT_STOREFRONT_SECTIONS } from "@/lib/cms-defaults";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "UK Delivery Services & Logistics Policy | SAN Furniture Limited",
  description:
    "Comprehensive UK delivery guide for SAN Furniture Limited (Company No. 11733475). Lead times, 2-Man room of choice delivery, postcode coverage, statutory consumer rights, and privacy practices.",
  alternates: {
    canonical: "https://sanfurniture.com/delivery",
  },
};

export default async function DeliveryPage() {
  const sections = await getLiveSections("delivery_returns");
  const tiers = sections?.delivery_tiers_guide?.content || DEFAULT_STOREFRONT_SECTIONS.delivery_tiers_guide?.content || {};

  return (
    <div className="bg-sand-50 min-h-screen text-navy-950">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="border-b border-sand-200 bg-sand-100/50">
        <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-3 flex items-center text-xs text-navy-600 gap-1.5 flex-wrap">
          <Link href="/" className="hover:text-navy-950 transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 text-sand-400" />
          <span className="font-semibold text-navy-950">UK Delivery &amp; Logistics Policy</span>
        </div>
      </nav>

      {/* Hero Header */}
      <section className="border-b border-sand-200 bg-gradient-to-b from-sand-100/70 via-sand-50 to-sand-50 py-12 sm:py-16">
        <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="max-w-4xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sand-200/80 text-navy-800 text-[11px] font-semibold tracking-wider uppercase">
              <Truck className="w-3.5 h-3.5 text-brass-600" />
              <span>SAN Furniture Limited &bull; Company No. 11733475</span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-navy-950">
              UK Delivery Services &amp; Logistics Policy
            </h1>
            <p className="text-sm sm:text-base text-navy-700 leading-relaxed max-w-3xl">
              Fulfillment guidance, delivery timescales, 2-Man room-of-choice handling, and statutory consumer protections in full accordance with our{" "}
              <Link href="/terms" className="text-brass-700 underline font-semibold hover:text-navy-950 transition-colors">
                Terms and Conditions
              </Link>{" "}
              (Clause 94) and{" "}
              <Link href="/privacy" className="text-brass-700 underline font-semibold hover:text-navy-950 transition-colors">
                Privacy Policy
              </Link>
              .
            </p>

            {/* Quick Benefits Strip */}
            <div className="pt-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-white border border-sand-200 shadow-2xs">
                <span className="text-[10px] font-bold text-navy-500 uppercase tracking-wider block">Standard Delivery</span>
                <span className="text-xs font-bold text-forest-700 flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-forest-600 shrink-0" />
                  Free Across Mainland UK
                </span>
              </div>
              <div className="p-3 rounded-xl bg-white border border-sand-200 shadow-2xs">
                <span className="text-[10px] font-bold text-navy-500 uppercase tracking-wider block">Typical Lead Time</span>
                <span className="text-xs font-bold text-navy-950 flex items-center gap-1 mt-0.5">
                  <Clock className="w-3.5 h-3.5 text-brass-600 shrink-0" />
                  7 – 14 Business Days
                </span>
              </div>
              <div className="p-3 rounded-xl bg-white border border-sand-200 shadow-2xs">
                <span className="text-[10px] font-bold text-navy-500 uppercase tracking-wider block">Heavy Goods &amp; Wardrobes</span>
                <span className="text-xs font-bold text-navy-950 flex items-center gap-1 mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-brass-600 shrink-0" />
                  2-Man Room of Choice
                </span>
              </div>
              <div className="p-3 rounded-xl bg-white border border-sand-200 shadow-2xs">
                <span className="text-[10px] font-bold text-navy-500 uppercase tracking-wider block">Statutory Cooling-Off</span>
                <span className="text-xs font-bold text-navy-950 flex items-center gap-1 mt-0.5">
                  <RotateCcw className="w-3.5 h-3.5 text-brass-600 shrink-0" />
                  14-Day Right to Cancel
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-12 sm:py-16 space-y-16">
        {/* 1. Delivery Tiers Cards */}
        <section className="space-y-6">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-brass-700">Fulfillment Tiers</span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-navy-950">
              Three Specialist Delivery Tiers
            </h2>
            <p className="text-xs sm:text-sm text-navy-600">
              Every order is matched to the optimal logistics network based on weight, dimensions, and handling requirements.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {/* Tier 1 */}
            <div className="rounded-2xl border border-sand-200 bg-white p-6 sm:p-8 space-y-4 shadow-xs flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-sand-100 flex items-center justify-center text-brass-600">
                  <Box className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-navy-950">
                    {tiers.tier_1_title || "1. Standard Parcel (Small Items)"}
                  </h3>
                  <span className="text-[11px] font-semibold text-brass-700 block mt-0.5">Tracked Express Courier (DPD / Parcelforce)</span>
                </div>
                <p className="text-xs sm:text-sm text-navy-600 leading-relaxed">
                  {tiers.tier_1_desc || "Tracked next-day courier delivery for lamps, cushions, small stools, care kits, and hardware accessories."}
                </p>
                <ul className="text-xs text-navy-700 space-y-1.5 pt-2 border-t border-sand-100">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-forest-600 shrink-0" />
                    <span>Real-time GPS tracking and 1-hour delivery window SMS</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-forest-600 shrink-0" />
                    <span>Direct-to-door signed handover or safe-place delivery</span>
                  </li>
                </ul>
              </div>
              <div className="pt-4 border-t border-sand-100">
                <span className="text-[11px] font-bold text-navy-900 block">Dispatch: 1 – 3 Business Days</span>
                <span className="text-xs font-semibold text-forest-700">Free across Mainland UK</span>
              </div>
            </div>

            {/* Tier 2 */}
            <div className="rounded-2xl border border-sand-200 bg-white p-6 sm:p-8 space-y-4 shadow-xs flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-sand-100 flex items-center justify-center text-brass-600">
                  <Truck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-navy-950">
                    {tiers.tier_2_title || "2. Heavy Goods Pallet Delivery"}
                  </h3>
                  <span className="text-[11px] font-semibold text-brass-700 block mt-0.5">Hydraulic Tail-Lift Lorry Delivery</span>
                </div>
                <p className="text-xs sm:text-sm text-navy-600 leading-relaxed">
                  {tiers.tier_2_desc || "Kerbside palletized delivery for solid wood dining tables, modular sideboards, and heavy crate shipments."}
                </p>
                <ul className="text-xs text-navy-700 space-y-1.5 pt-2 border-t border-sand-100">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-forest-600 shrink-0" />
                    <span>Strapped and shrink-wrapped onto protective wooden pallet</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-forest-600 shrink-0" />
                    <span>Pre-scheduled delivery day with morning / afternoon slot</span>
                  </li>
                </ul>
              </div>
              <div className="pt-4 border-t border-sand-100">
                <span className="text-[11px] font-bold text-navy-900 block">Dispatch: 3 – 5 Business Days</span>
                <span className="text-xs font-semibold text-forest-700">Free across Mainland UK</span>
              </div>
            </div>

            {/* Tier 3 */}
            <div className="rounded-2xl border-2 border-brass-500/50 bg-sand-100/60 p-6 sm:p-8 space-y-4 shadow-sm relative flex flex-col justify-between">
              <span className="absolute -top-3 right-6 px-3 py-0.5 rounded-full bg-gradient-to-r from-brass-500 to-brass-600 text-navy-950 text-[10px] font-bold uppercase tracking-wider shadow-xs">
                Recommended Flagship Service
              </span>
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-brass-500/20 flex items-center justify-center text-brass-700">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-navy-950">
                    {tiers.tier_3_title || "3. Room of Choice Delivery Service"}
                  </h3>
                  <span className="text-[11px] font-semibold text-brass-700 block mt-0.5">Specialist 2-Man White Glove Crew</span>
                </div>
                <p className="text-xs sm:text-sm text-navy-600 leading-relaxed">
                  {tiers.tier_3_desc || "Delivered into your designated room of choice, unpackaged, and inspected. Packaging materials are removed for eco-recycling."}
                </p>
                <ul className="text-xs text-navy-700 space-y-1.5 pt-2 border-t border-sand-200">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-forest-600 shrink-0" />
                    <span>Carried to room of choice (up to 2nd floor without lift, higher with lift)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-forest-600 shrink-0" />
                    <span>Dedicated for sliding mirrored wardrobes, sofas &amp; large bedroom sets</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-forest-600 shrink-0" />
                    <span>Pre-delivery booking telephone call 24–48 hours in advance</span>
                  </li>
                </ul>
              </div>
              <div className="pt-4 border-t border-sand-200">
                <span className="text-[11px] font-bold text-navy-900 block">Total Lead Time: 7 – 14 Business Days</span>
                <span className="text-xs font-bold text-forest-700">Included Free on Furniture Orders</span>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Statutory Delivery Terms & Obligations (Directly from Terms Clause 94 & 112) */}
        <section className="space-y-6">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-brass-700">Legal Governance</span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-navy-950">
              Delivery Protocol &amp; Customer Rights
            </h2>
            <p className="text-xs sm:text-sm text-navy-600">
              The statutory rules governing fulfillment, lead times, examination of goods, and risk transfer as set out in our{" "}
              <Link href="/terms" className="text-brass-700 underline font-semibold">Terms and Conditions</Link>.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Clause 94.1 */}
            <div className="p-6 rounded-2xl bg-white border border-sand-200 space-y-3 shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sand-100 flex items-center justify-center text-brass-600">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-navy-950">30-Day Maximum Statutory Delivery Window</h3>
                  <span className="text-[10px] text-navy-500 font-mono">Terms and Conditions &bull; Clause 94.1</span>
                </div>
              </div>
              <p className="text-xs text-navy-600 leading-relaxed">
                We will deliver the Goods to the Delivery Location agreed in the Order without undue delay and, in any event, not more than <strong>30 calendar days</strong> after the day on which the Contract is entered into. Standard deliveries are typically fulfilled within 7 to 14 business days. If we fail to deliver within the statutory or agreed period, you maintain the right to cancel the contract with prompt return of all payments under Clause 94.2 and 94.3.
              </p>
            </div>

            {/* Clause 94.8 */}
            <div className="p-6 rounded-2xl bg-white border border-sand-200 space-y-3 shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sand-100 flex items-center justify-center text-brass-600">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-navy-950">Pre-Delivery Booking &amp; Slot Commitment</h3>
                  <span className="text-[10px] text-navy-500 font-mono">Terms and Conditions &bull; Clause 94.8</span>
                </div>
              </div>
              <p className="text-xs text-navy-600 leading-relaxed">
                Our specialist carrier contacts each customer 24 to 48 hours prior to delivery to confirm a mutual date and time window. If you or your nominated representative fail, through no fault of ours, to accept delivery of the Goods at the agreed Delivery Location and time slot, we may charge the reasonable costs of storage, warehouse holding, and redelivery.
              </p>
            </div>

            {/* Clause 94.9 & 112.1 */}
            <div className="p-6 rounded-2xl bg-white border border-sand-200 space-y-3 shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sand-100 flex items-center justify-center text-brass-600">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-navy-950">Examination on Delivery &amp; Risk Transfer</h3>
                  <span className="text-[10px] text-navy-500 font-mono">Terms and Conditions &bull; Clause 94.9 &amp; 112.1</span>
                </div>
              </div>
              <p className="text-xs text-navy-600 leading-relaxed">
                Risk of damage to, or loss of, any Goods passes to you from the completion of delivery. You or your representative must, if reasonably practicable, examine the outer cartons and furniture pieces before signing the driver&apos;s manifest. Any transit damage or discrepancies must be recorded on the delivery note and reported to <span className="font-semibold text-navy-900">support@sanfurniture.com</span> within 48 hours.
              </p>
            </div>

            {/* Clause 94.7 */}
            <div className="p-6 rounded-2xl bg-white border border-sand-200 space-y-3 shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sand-100 flex items-center justify-center text-brass-600">
                  <Box className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-navy-950">Instalments &amp; Multi-Item Consignments</h3>
                  <span className="text-[10px] text-navy-500 font-mono">Terms and Conditions &bull; Clause 94.7</span>
                </div>
              </div>
              <p className="text-xs text-navy-600 leading-relaxed">
                If an order contains multiple items or specialized collections sourced from different UK fulfillment hubs (e.g. Leicester sliding wardrobes and Wiltshire flatpack storage), you agree that goods may be delivered in separate consignments to expedite fulfillment, without any extra delivery charges.
              </p>
            </div>
          </div>
        </section>

        {/* 3. Geographic Scope & Postcode Coverage (Clause 104) */}
        <section className="rounded-2xl border border-sand-200 bg-white p-6 sm:p-10 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-sand-200">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-brass-700">Territorial Scope</span>
              <h2 className="font-display text-2xl font-bold text-navy-950 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-brass-600" />
                <span>UK Mainland Coverage &amp; Exclusions</span>
              </h2>
            </div>
            <span className="text-[11px] font-mono text-navy-500 bg-sand-100 px-3 py-1 rounded-full">
              Terms &bull; Clause 104
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs sm:text-sm text-navy-700">
            <div className="space-y-3">
              <h3 className="font-bold text-sm text-navy-950 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-forest-600" />
                <span>Fully Serviced Mainland UK Postcodes</span>
              </h3>
              <p className="text-navy-600 leading-relaxed text-xs">
                Free standard and 2-Man room of choice delivery applies across all mainland postal zones in:
              </p>
              <ul className="grid grid-cols-2 gap-2 text-xs font-medium text-navy-800">
                <li className="p-2 rounded-lg bg-sand-50 border border-sand-200">&bull; Greater London &amp; Home Counties</li>
                <li className="p-2 rounded-lg bg-sand-50 border border-sand-200">&bull; West Midlands &amp; Birmingham</li>
                <li className="p-2 rounded-lg bg-sand-50 border border-sand-200">&bull; Greater Manchester &amp; North West</li>
                <li className="p-2 rounded-lg bg-sand-50 border border-sand-200">&bull; Yorkshire &amp; Humberside</li>
                <li className="p-2 rounded-lg bg-sand-50 border border-sand-200">&bull; East Midlands &amp; Leicestershire</li>
                <li className="p-2 rounded-lg bg-sand-50 border border-sand-200">&bull; South West &amp; South East</li>
                <li className="p-2 rounded-lg bg-sand-50 border border-sand-200">&bull; Wales (Cardiff, Swansea, Newport)</li>
                <li className="p-2 rounded-lg bg-sand-50 border border-sand-200">&bull; Scotland (Glasgow, Edinburgh, Central)</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="font-bold text-sm text-navy-950 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Offshore &amp; Non-Mainland Restrictions</span>
              </h3>
              <p className="text-navy-600 leading-relaxed text-xs">
                In strict accordance with Clause 104 of our Terms, our specialist 2-Man fleet does not deliver to addresses outside Mainland Great Britain. We currently cannot accept orders for:
              </p>
              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-950 text-xs space-y-1.5">
                <p className="font-semibold text-[11px] text-amber-900 uppercase tracking-wider">Excluded Zones:</p>
                <p>&bull; Northern Ireland (BT postcodes)</p>
                <p>&bull; Channel Islands (Jersey JE, Guernsey GY)</p>
                <p>&bull; Isle of Man (IM postcodes) &amp; Isle of Wight (PO30–PO41)</p>
                <p>&bull; Scilly Isles (TR21–TR25)</p>
                <p>&bull; Scottish Offshore Islands (HS, ZE, KW15–17, IV41–56, KA27–28, PA20–78, PH42–44)</p>
              </div>
              <p className="text-[11px] text-navy-500 italic">
                For mainland Scottish Highland border postcodes, please consult our concierge team prior to placing an order.
              </p>
            </div>
          </div>
        </section>

        {/* 4. 14-Day Cancellation & Returns Protocol (Clause 120, 134, 164) */}
        <section className="rounded-2xl border border-sand-200 bg-sand-100/50 p-6 sm:p-10 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-sand-200">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-brass-700">Consumer Rights Act 2015</span>
              <h2 className="font-display text-2xl font-bold text-navy-950 flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-brass-600" />
                <span>14-Day Right to Cancel &amp; Returns Procedure</span>
              </h2>
            </div>
            <Link
              href="/returns"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-brass-700 hover:text-navy-950 transition-colors"
            >
              <span>View Dedicated Returns Page</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs sm:text-sm text-navy-700">
            <div className="space-y-2 p-5 rounded-xl bg-white border border-sand-200">
              <span className="w-7 h-7 rounded-full bg-brass-100 text-brass-800 text-xs font-bold flex items-center justify-center">1</span>
              <h3 className="font-bold text-navy-950 text-sm">14-Day Statutory Cooling-Off</h3>
              <p className="text-navy-600 text-xs leading-relaxed">
                Under the UK Consumer Contracts Regulations 2013 and Clause 134 of our Terms, you have <strong>14 calendar days</strong> from the date of physical delivery to cancel your contract for any reason without penalty.
              </p>
            </div>

            <div className="space-y-2 p-5 rounded-xl bg-white border border-sand-200">
              <span className="w-7 h-7 rounded-full bg-brass-100 text-brass-800 text-xs font-bold flex items-center justify-center">2</span>
              <h3 className="font-bold text-navy-950 text-sm">Return Handling &amp; Condition</h3>
              <p className="text-navy-600 text-xs leading-relaxed">
                Items must be returned in their original protective packaging and in resalable condition. In accordance with Clause 148, deductions may be made if the loss in value is caused by handling beyond what would be allowed in a retail showroom.
              </p>
            </div>

            <div className="space-y-2 p-5 rounded-xl bg-white border border-sand-200">
              <span className="w-7 h-7 rounded-full bg-brass-100 text-brass-800 text-xs font-bold flex items-center justify-center">3</span>
              <h3 className="font-bold text-navy-950 text-sm">Reimbursement Within 14 Days</h3>
              <p className="text-navy-600 text-xs leading-relaxed">
                In accordance with Clause 153, full reimbursement is made using your original payment method within 14 calendar days of our receipt of the goods (or receipt of proof of dispatch). The designated UK warehouse return address will be confirmed by email.
              </p>
            </div>
          </div>
        </section>

        {/* 5. Privacy & Data Protection in Delivery (Directly from Privacy Policy) */}
        <section className="rounded-2xl border border-navy-800 bg-[#00072D] text-sand-50 p-6 sm:p-10 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-navy-800">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brass-500/20 text-brass-300 border border-brass-500/30 text-[10px] font-bold uppercase tracking-wider">
                <Lock className="w-3.5 h-3.5 text-brass-400" />
                UK GDPR &amp; Data Protection Act 2018
              </div>
              <h2 className="font-display text-2xl font-bold text-sand-50">
                Logistics Data Protection &amp; Courier Privacy
              </h2>
            </div>
            <Link
              href="/privacy"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-brass-400 hover:text-sand-100 transition-colors"
            >
              <span>View Privacy Policy</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-sand-300">
            <div className="space-y-2 p-4 rounded-xl bg-navy-900/80 border border-navy-800">
              <h3 className="font-bold text-sand-100 text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                Purpose-Bound Courier Sharing
              </h3>
              <p className="leading-relaxed">
                Your full name, delivery address, telephone contact number, and email are shared exclusively with our contracted specialist logistics carriers (such as our 2-Man room-of-choice transport fleet) strictly for fulfillment purposes.
              </p>
            </div>

            <div className="space-y-2 p-4 rounded-xl bg-navy-900/80 border border-navy-800">
              <h3 className="font-bold text-sand-100 text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                Pre-Delivery Contact Only
              </h3>
              <p className="leading-relaxed">
                Couriers use your contact phone number solely to place pre-delivery confirmation calls (24–48 hours prior) and send automated dispatch tracking SMS messages with arrival estimates.
              </p>
            </div>

            <div className="space-y-2 p-4 rounded-xl bg-navy-900/80 border border-navy-800">
              <h3 className="font-bold text-sand-100 text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                Zero Marketing or Data Resale
              </h3>
              <p className="leading-relaxed">
                In strict compliance with our Privacy Policy, our logistics partners are governed by enforceable Data Processing Agreements (DPAs). Your personal information is never sold, leased, or utilized for unauthorized third-party marketing.
              </p>
            </div>
          </div>
        </section>

        {/* 6. Statutory Company Information & Customer Concierge */}
        <section className="rounded-2xl border border-sand-200 bg-white p-6 sm:p-10 space-y-6 shadow-xs">
          <div className="space-y-1 pb-4 border-b border-sand-200">
            <span className="text-xs font-semibold uppercase tracking-wider text-brass-700">Corporate Governance</span>
            <h2 className="font-display text-2xl font-bold text-navy-950">
              Statutory Company Credentials &amp; Concierge Support
            </h2>
            <p className="text-xs sm:text-sm text-navy-600">
              SAN Furniture Limited is incorporated in England and Wales under statutory company law.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-sand-50 border border-sand-200 space-y-1">
              <span className="text-[10px] font-bold text-navy-500 uppercase tracking-wider block">Registered Company</span>
              <p className="font-bold text-navy-950 flex items-center gap-1.5 text-sm">
                <Building className="w-4 h-4 text-brass-600 shrink-0" />
                SAN Furniture Limited
              </p>
              <p className="text-[11px] text-navy-600">Company No. 11733475</p>
            </div>

            <div className="p-4 rounded-xl bg-sand-50 border border-sand-200 space-y-1">
              <span className="text-[10px] font-bold text-navy-500 uppercase tracking-wider block">Registered Office</span>
              <p className="font-bold text-navy-950 text-xs">
                112 Coventry Road, Exhall, West Midlands, CV7 9EU
              </p>
              <p className="text-[11px] text-navy-600">England and Wales</p>
            </div>

            <div className="p-4 rounded-xl bg-sand-50 border border-sand-200 space-y-1">
              <span className="text-[10px] font-bold text-navy-500 uppercase tracking-wider block">Logistics Hotline</span>
              <p className="font-bold text-navy-950 flex items-center gap-1.5 text-sm">
                <Phone className="w-4 h-4 text-brass-600 shrink-0" />
                +4420 3150 3472
              </p>
              <p className="text-[11px] text-navy-600">Mon–Fri: 08:30–18:30 GMT</p>
            </div>

            <div className="p-4 rounded-xl bg-sand-50 border border-sand-200 space-y-1">
              <span className="text-[10px] font-bold text-navy-500 uppercase tracking-wider block">Orders &amp; Returns Mailbox</span>
              <p className="font-bold text-navy-950 flex items-center gap-1.5 text-xs truncate">
                <Mail className="w-4 h-4 text-brass-600 shrink-0" />
                support@sanfurniture.com
              </p>
              <p className="text-[11px] text-navy-600">Privacy: privacy@sanfurniture.com</p>
            </div>
          </div>

          <div className="pt-4 border-t border-sand-100 flex flex-wrap items-center justify-between gap-4">
            <div className="text-xs text-navy-600">
              Have a question about stairwell clearance or room access? Our UK customer support team is on hand to assist.
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/track-order"
                className="px-4 py-2.5 rounded-xl bg-sand-100 hover:bg-sand-200 text-navy-950 text-xs font-semibold transition-colors"
              >
                Track Your Order
              </Link>
              <Link
                href="/contact"
                className="px-5 py-2.5 rounded-xl bg-navy-950 hover:bg-navy-900 text-sand-50 text-xs font-semibold transition-colors"
              >
                Contact Support Desk
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}