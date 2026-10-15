"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Truck,
  CreditCard,
  Lock,
  ArrowRight,
  ChevronRight,
  CheckCircle2,
  MapPin,
  Clock,
  Sparkles,
  ShoppingBag,
  FileText,
} from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { classifyUKPostcode, formatGBP, calculateNetAndVat, type UKPostcodeZone } from "@san-furniture/types";

export default function CheckoutPage() {
  const {
    items,
    subtotalPennies,
    vatBreakdown,
    totalCount,
    hasFreeDelivery,
    clearCart,
  } = useCart();

  // Address State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [postcode, setPostcode] = useState("");

  // Payment Selection
  const [paymentMethod, setPaymentMethod] = useState<"card" | "klarna" | "clearpay" | "paypal">("card");

  // Postcode lookup state
  const [lookupMessage, setLookupMessage] = useState<string | null>(null);

  // Order status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<{
    orderId: string;
    shippingPennies: number;
    totalPennies: number;
    postcodeZone: UKPostcodeZone;
  } | null>(null);

  // Live Shipping Calculation based on postcode
  const shippingCalculation = useMemo(() => {
    if (!postcode || postcode.trim().length < 2) {
      return {
        zone: "zone_1_mainland" as UKPostcodeZone,
        shippingPennies: hasFreeDelivery ? 0 : 4900,
        label: hasFreeDelivery ? "FREE 2-Man Delivery" : "Standard 2-Man Delivery (£49.00)",
        days: "3 - 7 business days",
      };
    }

    const zone = classifyUKPostcode(postcode.trim());
    let surcharge = 0;
    let label = hasFreeDelivery ? "FREE UK Delivery" : "Standard 2-Man Delivery (£49.00)";
    let days = "3 - 7 business days";

    if (zone === "zone_2_scottish_highlands") {
      surcharge = 4900;
      label = "Highlands 2-Man Freight (£49.00 Regional Surcharge)";
      days = "5 - 10 business days";
    } else if (zone === "zone_3_scottish_islands") {
      surcharge = 6900;
      label = "Offshore Islands Maritime Transit (£69.00)";
      days = "7 - 14 business days";
    } else if (zone === "zone_4_northern_ireland") {
      surcharge = 5900;
      label = "Northern Ireland Irish Sea Freight (£59.00)";
      days = "6 - 10 business days";
    }

    const baseShipping = hasFreeDelivery ? 0 : 4900;
    const totalShipping = baseShipping + surcharge;

    return {
      zone,
      shippingPennies: totalShipping,
      label,
      days,
    };
  }, [postcode, hasFreeDelivery]);

  const grandTotalPennies = subtotalPennies + shippingCalculation.shippingPennies;
  const overallVatBreakdown = calculateNetAndVat(grandTotalPennies);
  const klarnaMonthlyPennies = Math.round(grandTotalPennies / 3);

  // Instant address lookup simulation
  const handleAddressLookup = () => {
    const clean = postcode.toUpperCase().replace(/\s+/g, "");
    if (!clean) {
      setLookupMessage("Please enter a UK postcode first.");
      return;
    }

    if (clean === "SW1A1AA") {
      setAddressLine1("Buckingham Palace");
      setAddressLine2("The Mall");
      setCity("London");
      setLookupMessage("Address found: Buckingham Palace, London");
    } else if (clean === "M11AE") {
      setAddressLine1("1 Piccadilly Gardens");
      setCity("Manchester");
      setLookupMessage("Address found: 1 Piccadilly Gardens, Manchester");
    } else if (clean === "EH11YZ") {
      setAddressLine1("12 Princes Street");
      setCity("Edinburgh");
      setLookupMessage("Address found: 12 Princes Street, Edinburgh");
    } else {
      setAddressLine1("1 High Street");
      setCity("London");
      setLookupMessage(`Address verified for postcode ${postcode.toUpperCase()}`);
    }
  };

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !addressLine1 || !postcode) {
      alert("Please fill in your name, email, delivery address and UK postcode.");
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const orderId = `SAN-${Date.now().toString().slice(-6)}`;
      setConfirmedOrder({
        orderId,
        shippingPennies: shippingCalculation.shippingPennies,
        totalPennies: grandTotalPennies,
        postcodeZone: shippingCalculation.zone,
      });
      clearCart();
      setIsSubmitting(false);
    }, 900);
  };

  // Order Confirmed Screen
  if (confirmedOrder) {
    return (
      <div className="bg-sand-50 min-h-screen py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto bg-sand-100 rounded-2xl border border-sand-300 p-8 sm:p-10 shadow-elevation text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-forest-100 border border-forest-300 text-forest-700 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-brass-600 block mb-1">
              Payment Confirmed
            </span>
            <h1 className="font-display text-3xl font-bold text-navy-950">
              Thank You for Your Order
            </h1>
            <p className="text-sm text-navy-600 mt-2">
              Order reference: <strong className="font-mono text-navy-950">{confirmedOrder.orderId}</strong>
            </p>
          </div>

          <div className="p-4 rounded-xl bg-sand-50 border border-sand-200 text-left text-xs space-y-2 text-navy-800">
            <div className="flex justify-between pb-2 border-b border-sand-200 font-semibold">
              <span>Delivery Details</span>
              <span className="text-forest-700">{shippingCalculation.days}</span>
            </div>
            <div><strong>Recipient:</strong> {name}</div>
            <div><strong>Address:</strong> {addressLine1}, {city}, {postcode.toUpperCase()}</div>
            <div><strong>Paid Total:</strong> {formatGBP(confirmedOrder.totalPennies)} (Inc. 20% UK VAT)</div>
            <div><strong>Payment Method:</strong> {paymentMethod.toUpperCase()}</div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-navy-700 pt-2">
            <div className="p-3 rounded-lg bg-sand-200/60 flex items-center gap-2">
              <Truck className="w-4 h-4 text-brass-600 flex-shrink-0" />
              <span>2-Man Logistics Dispatching</span>
            </div>
            <div className="p-3 rounded-lg bg-sand-200/60 flex items-center gap-2">
              <FileText className="w-4 h-4 text-forest-700 flex-shrink-0" />
              <span>HMRC VAT Invoice Emailed</span>
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/"
              className="w-full sm:w-auto px-6 py-3 rounded-lg bg-navy-950 text-sand-50 font-semibold text-xs hover:bg-brass-600 transition-colors"
            >
              Return to Homepage
            </Link>
            <Link
              href="/catalog"
              className="w-full sm:w-auto px-6 py-3 rounded-lg bg-sand-200 text-navy-950 font-semibold text-xs hover:bg-sand-300 transition-colors"
            >
              Continue Exploring
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Empty cart checkout guard
  if (items.length === 0) {
    return (
      <div className="bg-sand-50 min-h-screen py-24 text-center px-4">
        <div className="w-16 h-16 rounded-full bg-sand-200 flex items-center justify-center text-navy-400 mx-auto mb-4">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h1 className="font-display text-2xl font-bold text-navy-950 mb-2">
          Your Basket is Empty
        </h1>
        <p className="text-xs text-navy-600 max-w-sm mx-auto mb-6">
          Add one of our handcrafted sofas, armchairs, or dining sets before checking out.
        </p>
        <Link
          href="/catalog"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-navy-950 text-sand-50 text-xs font-semibold hover:bg-brass-600 transition-colors"
        >
          Browse Full Catalog
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-sand-50 min-h-screen">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="border-b border-sand-200 bg-sand-100/50">
        <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-3 flex items-center text-xs text-navy-600 gap-1.5">
          <Link href="/" className="hover:text-navy-950">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 text-sand-400" />
          <Link href="/catalog" className="hover:text-navy-950">Catalog</Link>
          <ChevronRight className="w-3.5 h-3.5 text-sand-400" />
          <span className="font-semibold text-navy-950">UK Secure Checkout</span>
        </div>
      </nav>

      {/* Main Checkout Grid */}
      <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-10 sm:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
          
          {/* Left Form: Express Checkout, Delivery Address & Payment (7 cols) */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Express Checkout Options */}
            <div className="p-6 rounded-xl bg-sand-100/60 border border-sand-300 space-y-3">
              <span className="text-[11px] font-bold text-navy-600 uppercase tracking-wider block">
                Express Checkout
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("card")}
                  className="py-2.5 px-3 rounded-lg bg-black text-white text-xs font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-1 shadow-sm"
                >
                  <span> Pay</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("card")}
                  className="py-2.5 px-3 rounded-lg bg-white border border-sand-300 text-navy-950 text-xs font-bold hover:bg-sand-50 transition-colors flex items-center justify-center gap-1 shadow-sm"
                >
                  <span>G Pay</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("klarna")}
                  className="py-2.5 px-3 rounded-lg bg-pink-100 text-pink-900 border border-pink-300 text-xs font-bold hover:bg-pink-200 transition-colors flex items-center justify-center gap-1"
                >
                  <span>Klarna.</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("clearpay")}
                  className="py-2.5 px-3 rounded-lg bg-teal-100 text-teal-950 border border-teal-300 text-xs font-bold hover:bg-teal-200 transition-colors flex items-center justify-center gap-1"
                >
                  <span>Clearpay</span>
                </button>
              </div>
            </div>

            {/* Delivery Address Form */}
            <form onSubmit={handlePlaceOrder} className="space-y-6">
              <div className="p-6 rounded-xl bg-sand-100/40 border border-sand-300 space-y-4">
                <div className="flex items-center justify-between border-b border-sand-200 pb-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-brass-600" />
                    <h2 className="font-display text-lg font-bold text-navy-950">
                      1. UK Delivery Address
                    </h2>
                  </div>
                  <span className="text-[11px] font-semibold text-forest-700 bg-forest-50 px-2 py-0.5 rounded border border-forest-200">
                    Room of Choice Delivery
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-navy-900 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Lady Eleanor Vance"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-sand-300 bg-sand-50 text-navy-950 focus:ring-2 focus:ring-brass-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-navy-900 mb-1">
                      Email Address (for VAT Invoice & Tracking) *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="eleanor@example.co.uk"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-sand-300 bg-sand-50 text-navy-950 focus:ring-2 focus:ring-brass-500 outline-none"
                    />
                  </div>
                </div>

                {/* UK Postcode & Fast Lookup */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-navy-900 mb-1">
                      UK Postcode *
                    </label>
                    <input
                      type="text"
                      required
                      value={postcode}
                      onChange={(e) => {
                        setPostcode(e.target.value.toUpperCase());
                        setLookupMessage(null);
                      }}
                      placeholder="e.g. SW1A 1AA, M1 1AE, EH1 1YZ"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-sand-300 bg-sand-50 text-navy-950 focus:ring-2 focus:ring-brass-500 outline-none font-mono uppercase"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddressLookup}
                    className="w-full py-2 px-3 rounded-lg bg-navy-950 text-sand-50 text-xs font-semibold hover:bg-brass-600 transition-colors h-[34px]"
                  >
                    Find Address
                  </button>
                </div>

                {lookupMessage && (
                  <p className="text-xs text-forest-700 font-medium">{lookupMessage}</p>
                )}

                <div>
                  <label className="block text-xs font-semibold text-navy-900 mb-1">
                    Address Line 1 *
                  </label>
                  <input
                    type="text"
                    required
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                    placeholder="House name / number and street"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-sand-300 bg-sand-50 text-navy-950 focus:ring-2 focus:ring-brass-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-navy-900 mb-1">
                      Address Line 2 (Optional)
                    </label>
                    <input
                      type="text"
                      value={addressLine2}
                      onChange={(e) => setAddressLine2(e.target.value)}
                      placeholder="Apartment, suite, unit"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-sand-300 bg-sand-50 text-navy-950 focus:ring-2 focus:ring-brass-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-navy-900 mb-1">
                      Town / City *
                    </label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. London"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-sand-300 bg-sand-50 text-navy-950 focus:ring-2 focus:ring-brass-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-navy-900 mb-1">
                    UK Telephone Number (required for 2-man booking call) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+44 7700 900123"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-sand-300 bg-sand-50 text-navy-950 focus:ring-2 focus:ring-brass-500 outline-none"
                  />
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="p-6 rounded-xl bg-sand-100/40 border border-sand-300 space-y-4">
                <div className="flex items-center gap-2 border-b border-sand-200 pb-3">
                  <CreditCard className="w-5 h-5 text-brass-600" />
                  <h2 className="font-display text-lg font-bold text-navy-950">
                    2. Payment Method
                  </h2>
                </div>

                <div className="space-y-3">
                  {/* Card Option */}
                  <label className={`flex items-center justify-between p-3.5 rounded-lg border cursor-pointer transition-all ${
                    paymentMethod === "card"
                      ? "border-navy-950 bg-sand-200/50 ring-1 ring-navy-950"
                      : "border-sand-300 bg-sand-50 hover:bg-sand-100"
                  }`}>
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="payment_choice"
                        checked={paymentMethod === "card"}
                        onChange={() => setPaymentMethod("card")}
                        className="text-navy-950 focus:ring-brass-500"
                      />
                      <span className="text-xs font-bold text-navy-950">
                        Credit / Debit Card (Visa, Mastercard, Amex)
                      </span>
                    </div>
                    <span className="text-xs text-navy-500 font-mono">128-bit SSL</span>
                  </label>

                  {/* Klarna Option */}
                  <label className={`flex items-center justify-between p-3.5 rounded-lg border cursor-pointer transition-all ${
                    paymentMethod === "klarna"
                      ? "border-pink-500 bg-pink-50/70 ring-1 ring-pink-500"
                      : "border-sand-300 bg-sand-50 hover:bg-sand-100"
                  }`}>
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="payment_choice"
                        checked={paymentMethod === "klarna"}
                        onChange={() => setPaymentMethod("klarna")}
                        className="text-pink-600 focus:ring-pink-500"
                      />
                      <div className="text-xs">
                        <span className="font-bold text-pink-900 block">
                          Klarna Pay in 3 (3 × {formatGBP(klarnaMonthlyPennies)})
                        </span>
                        <span className="text-[11px] text-pink-800">
                          0% Interest. Pay first instalment today.
                        </span>
                      </div>
                    </div>
                    <span className="font-bold text-pink-600 text-xs">Klarna.</span>
                  </label>

                  {/* Clearpay Option */}
                  <label className={`flex items-center justify-between p-3.5 rounded-lg border cursor-pointer transition-all ${
                    paymentMethod === "clearpay"
                      ? "border-teal-500 bg-teal-50/70 ring-1 ring-teal-500"
                      : "border-sand-300 bg-sand-50 hover:bg-sand-100"
                  }`}>
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="payment_choice"
                        checked={paymentMethod === "clearpay"}
                        onChange={() => setPaymentMethod("clearpay")}
                        className="text-teal-600 focus:ring-teal-500"
                      />
                      <div className="text-xs">
                        <span className="font-bold text-teal-950 block">
                          Clearpay (4 instalments every 2 weeks)
                        </span>
                        <span className="text-[11px] text-teal-800">
                          Interest-free UK financing
                        </span>
                      </div>
                    </div>
                    <span className="font-bold text-teal-700 text-xs">clearpay</span>
                  </label>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 px-6 rounded-lg bg-brass-500 text-navy-950 font-bold text-sm tracking-wide flex items-center justify-center gap-2 hover:bg-brass-400 active:scale-[0.99] transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                <Lock className="w-4 h-4" />
                <span>
                  {isSubmitting ? "Processing Order..." : `Complete Order • ${formatGBP(grandTotalPennies)}`}
                </span>
              </button>

              <div className="flex items-center justify-center gap-4 text-[11px] text-navy-600 pt-1">
                <span className="flex items-center gap-1 text-forest-700 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  BS 5852 Fire Safety Guaranteed
                </span>
                <span>•</span>
                <span>14-Day Statutory UK Returns</span>
                <span>•</span>
                <span>HMRC 20% VAT Inclusive</span>
              </div>
            </form>
          </div>

          {/* Right Column: Order Summary & VAT Breakdown (5 cols) */}
          <div className="lg:col-span-5">
            <div className="sticky top-28 rounded-xl bg-sand-100/70 border border-sand-300 p-6 space-y-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-sand-200 pb-3">
                <h3 className="font-display text-base font-bold text-navy-950">
                  Order Summary ({totalCount} {totalCount === 1 ? "piece" : "pieces"})
                </h3>
                <Link href="/catalog" className="text-xs text-navy-600 hover:text-navy-950">
                  Edit
                </Link>
              </div>

              {/* Items List */}
              <div className="space-y-4 max-h-72 overflow-y-auto divide-y divide-sand-200 pr-1">
                {items.map((item) => (
                  <div key={item.id} className="pt-3 first:pt-0 flex gap-3">
                    <div className="w-16 h-16 rounded-md bg-sand-200 overflow-hidden flex-shrink-0 border border-sand-300">
                      <img
                        src={item.product.thumbnailUrl}
                        alt={item.product.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-navy-950 truncate">
                        {item.product.title}
                      </h4>
                      <p className="text-[11px] text-navy-600">
                        Qty: {item.quantity} • {item.selectedFinish || item.product.specs.color}
                      </p>
                      <div className="text-xs font-bold text-navy-950 mt-1">
                        {formatGBP(item.product.pricePennies * item.quantity)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cost & VAT Breakdown */}
              <div className="space-y-2 border-t border-sand-200 pt-4 text-xs text-navy-700">
                <div className="flex justify-between">
                  <span>Net Goods (ex. VAT)</span>
                  <span>{vatBreakdown.formattedNet}</span>
                </div>
                <div className="flex justify-between">
                  <span>UK VAT (20%)</span>
                  <span>{vatBreakdown.formattedVat}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <span className="block">Delivery & Logistics</span>
                    <span className="text-[10px] text-navy-500">{shippingCalculation.label}</span>
                  </div>
                  <span className="font-semibold text-navy-950">
                    {shippingCalculation.shippingPennies === 0
                      ? "FREE"
                      : formatGBP(shippingCalculation.shippingPennies)}
                  </span>
                </div>

                <div className="pt-3 border-t border-sand-300 flex justify-between items-baseline font-bold text-navy-950">
                  <span className="text-sm">Total Due</span>
                  <span className="font-display text-2xl text-navy-950">
                    {formatGBP(grandTotalPennies)}
                  </span>
                </div>
              </div>

              {/* Klarna Installment Summary */}
              <div className="p-3 rounded-lg bg-sand-50 border border-sand-200 text-xs text-navy-800 space-y-1">
                <div className="flex justify-between font-semibold">
                  <span>Klarna Pay in 3 Option:</span>
                  <span className="font-bold text-pink-600">3 × {formatGBP(klarnaMonthlyPennies)}</span>
                </div>
                <p className="text-[11px] text-navy-600">
                  First payment due today, followed by 2 equal monthly payments. Zero interest or hidden fees.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
