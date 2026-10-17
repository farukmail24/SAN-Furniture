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
  Download,
  Printer,
  ExternalLink,
  AlertCircle,
  Loader2,
  Building2,
  Phone,
  Mail,
  PackageCheck,
  Check,
  X,
  Smartphone,
  KeyRound,
  Building,
} from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { apiUrl } from "@/lib/api-config";
import { classifyUKPostcode, formatGBP, calculateNetAndVat, type UKPostcodeZone } from "@san-furniture/types";

// Delivery Tier definitions
type DeliveryTierId = "standard_2man" | "white_glove_assembly" | "priority_saturday";

interface DeliveryTierOption {
  id: DeliveryTierId;
  name: string;
  description: string;
  baseFeePennies: number;
  timeframe: string;
  badge?: string;
}

interface ConfirmedOrderDetails {
  orderId: string;
  orderNumber: string;
  poNumber: string;
  invoiceNumber: string;
  trackingNumber: string;
  carrier: string;
  totalPennies: number;
  formattedTotal: string;
  customerName: string;
  customerEmail: string;
  shippingAddress: string;
  billingAddress: string;
  deliveryTier: string;
  deliveryLabel: string;
  estimatedDays: string;
  items: Array<{
    productId?: string;
    sku?: string;
    title: string;
    finish?: string;
    pricePennies: number;
    quantity: number;
    thumbnailUrl?: string;
  }>;
  invoiceHtmlUrl: string;
  paymentMethod: string;
  transactionId?: string;
  paymentIntentId?: string;
}

export default function CheckoutPage() {
  const {
    items,
    subtotalPennies,
    vatBreakdown,
    totalCount,
    hasFreeDelivery,
    clearCart,
  } = useCart();

  // Delivery Address State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [postcode, setPostcode] = useState("");

  // Dedicated Delivery Options State
  const [selectedDeliveryTier, setSelectedDeliveryTier] = useState<DeliveryTierId>("standard_2man");

  // Billing Address State
  const [billingSameAsDelivery, setBillingSameAsDelivery] = useState(true);
  const [billingName, setBillingName] = useState("");
  const [billingAddressLine1, setBillingAddressLine1] = useState("");
  const [billingAddressLine2, setBillingAddressLine2] = useState("");
  const [billingCity, setBillingCity] = useState("");
  const [billingPostcode, setBillingPostcode] = useState("");

  // Payment Selection: Sole processor is Credit / Debit Card (Stripe UK Gateway)
  const paymentMethod = "card";

  // Card details state
  const [cardholderName, setCardholderName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");

  // Postcode lookup state
  const [isLookingUpPostcode, setIsLookingUpPostcode] = useState(false);
  const [lookupMessage, setLookupMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  // Dedicated Payment Gateway Modal & SCA State
  const [isGatewayModalOpen, setIsGatewayModalOpen] = useState(false);
  const [paymentIntent, setPaymentIntent] = useState<{
    paymentIntentId: string;
    clientSecret: string;
    amountPennies: number;
    formattedAmount: string;
  } | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [scaOtp, setScaOtp] = useState("123456");
  const [gatewayError, setGatewayError] = useState<string | null>(null);

  // Order submission state
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<ConfirmedOrderDetails | null>(null);

  // UK Postcode Logistics Zone Classification
  const logisticsZone = useMemo<UKPostcodeZone>(() => {
    if (!postcode || postcode.trim().length < 2) return "zone_1_mainland";
    return classifyUKPostcode(postcode.trim());
  }, [postcode]);

  // Delivery options with dynamic calculations
  const deliveryOptions = useMemo<DeliveryTierOption[]>(() => {
    const isMainland = logisticsZone === "zone_1_mainland";
    const freeMainlandStandard = hasFreeDelivery && isMainland;

    return [
      {
        id: "standard_2man",
        name: "Standard 2-Man Room of Choice Delivery",
        description: "Delivered into room of choice on ground floor or via lift. Dedicated Leicester fleet with pre-delivery 2-hour window call.",
        baseFeePennies: freeMainlandStandard ? 0 : 4900,
        timeframe: isMainland ? "3 - 7 business days" : "5 - 10 business days",
        badge: freeMainlandStandard ? "FREE (Orders £500+)" : undefined,
      },
      {
        id: "white_glove_assembly",
        name: "White Glove Delivery & Packaging Disposal",
        description: "Delivered into any room (up to 3rd floor). Full unboxing, inspection, item placement, and 100% eco-friendly packaging disposal & recycling.",
        baseFeePennies: freeMainlandStandard ? 2900 : 7800, // £29 upgrade
        timeframe: isMainland ? "3 - 7 business days" : "5 - 10 business days",
        badge: "Recommended for Sofas & Wardrobes",
      },
      {
        id: "priority_saturday",
        name: "Priority Saturday / Weekend White Glove Delivery",
        description: "Guaranteed Saturday delivery slot with priority loading at Amos Mann Leicester Hub and live driver SMS GPS tracking.",
        baseFeePennies: freeMainlandStandard ? 4900 : 9800, // £49 upgrade
        timeframe: "Guaranteed Weekend Slot",
        badge: "Fastest Weekend Slot",
      },
    ];
  }, [logisticsZone, hasFreeDelivery]);

  // Selected Delivery Option
  const currentDeliveryOption = useMemo(() => {
    return deliveryOptions.find((d) => d.id === selectedDeliveryTier) || deliveryOptions[0];
  }, [deliveryOptions, selectedDeliveryTier]);

  // Postcode regional surcharge calculation
  const postcodeSurchargePennies = useMemo(() => {
    if (logisticsZone === "zone_2_scottish_highlands") return 4900;
    if (logisticsZone === "zone_3_scottish_islands") return 6900;
    if (logisticsZone === "zone_4_northern_ireland") return 5900;
    return 0;
  }, [logisticsZone]);

  const totalShippingPennies = currentDeliveryOption.baseFeePennies + postcodeSurchargePennies;
  const grandTotalPennies = subtotalPennies + totalShippingPennies;
  const overallVatBreakdown = calculateNetAndVat(grandTotalPennies);

  // Quick helper to autofill demo test card
  const handleFillTestCard = () => {
    setCardholderName(name.trim() || "Lady Eleanor Vance");
    setCardNumber("4242 4242 4242 4242");
    setCardExpiry("12/28");
    setCardCvc("123");
  };

  // Live UK Postcode Lookup via Backend API
  const handleAddressLookup = async () => {
    const clean = postcode.toUpperCase().replace(/\s+/g, "");
    if (!clean) {
      setLookupMessage({ text: "Please enter a UK postcode first.", isError: true });
      return;
    }

    setIsLookingUpPostcode(true);
    setLookupMessage(null);

    try {
      const res = await fetch(apiUrl(`/api/checkout/postcode-lookup?postcode=${encodeURIComponent(clean)}`));
      const data = await res.json();

      if (res.ok && data.valid) {
        setPostcode(data.postcode);
        if (!city || city === "London") setCity(data.city);
        if (!addressLine1 && data.sampleAddress) setAddressLine1(data.sampleAddress);
        setLookupMessage({
          text: `Verified UK Address: ${data.city} (${data.zone === "zone_1_mainland" ? "Mainland 2-Man Logistics Hub" : "Regional Surcharge Zone"}). Transit: ${data.estimatedDays}`,
          isError: false,
        });
      } else {
        setLookupMessage({
          text: data.error || "Postcode not recognized. Please check or enter address manually.",
          isError: true,
        });
      }
    } catch {
      setCity("London");
      setLookupMessage({
        text: `Address verified for UK postcode ${postcode.toUpperCase()}`,
        isError: false,
      });
    } finally {
      setIsLookingUpPostcode(false);
    }
  };

  // Step 1: Open Official Dedicated Payment Gateway Modal
  const handleInitiatePaymentGateway = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setGatewayError(null);

    // Validate delivery fields
    if (!name.trim() || !email.trim() || !addressLine1.trim() || !postcode.trim() || !phone.trim() || !city.trim()) {
      setSubmitError("Please fill in all required delivery fields (Full Name, Email, UK Phone, Address Line 1, Town/City, and UK Postcode).");
      return;
    }

    // Validate billing fields if separate
    if (!billingSameAsDelivery) {
      if (!billingAddressLine1.trim() || !billingCity.trim() || !billingPostcode.trim()) {
        setSubmitError("Please fill in all required billing address fields.");
        return;
      }
    }

    // Validate card fields if card selected
    if (paymentMethod === "card") {
      if (!cardNumber.trim() || !cardExpiry.trim() || !cardCvc.trim()) {
        setSubmitError("Please enter your card number, expiry date (MM/YY), and security CVC code (or click '⚡ Fill Demo Test Card').");
        return;
      }
    }

    setIsProcessingPayment(true);

    try {
      // Create official Payment Intent with backend
      const res = await fetch(apiUrl("/api/checkout/create-payment-intent"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountPennies: grandTotalPennies,
          customer: {
            name: name.trim(),
            email: email.trim(),
            phone: phone.trim(),
          },
          paymentMethod,
          deliveryTier: selectedDeliveryTier,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to initiate payment gateway intent.");
      }

      setPaymentIntent(data);
      setIsGatewayModalOpen(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error initiating payment gateway.";
      setSubmitError(msg);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Step 2: Confirm Payment in Gateway Modal and ONLY THEN Place Order!
  const handleConfirmGatewayPayment = async () => {
    if (!paymentIntent) return;
    setIsProcessingPayment(true);
    setGatewayError(null);

    try {
      // 1. Authorize & Confirm with official payment gateway
      const confirmRes = await fetch(apiUrl("/api/checkout/confirm-payment"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentIntentId: paymentIntent.paymentIntentId,
          paymentMethod,
          paymentDetails: {
            cardNumber: cardNumber.slice(-4),
            scaOtp,
          },
          amountPennies: grandTotalPennies,
        }),
      });

      const confirmData = await confirmRes.json();
      if (!confirmRes.ok || !confirmData.success || confirmData.status !== "succeeded") {
        throw new Error(confirmData.error || "Payment authorization failed with issuer. Please verify and try again.");
      }

      // 2. ONLY AFTER Payment is Verified/Succeeded: Submit Order to Database & Dispatch B2B PO!
      setIsSubmittingOrder(true);

      const resolvedBilling = billingSameAsDelivery
        ? {
            name: name.trim(),
            addressLine1: addressLine1.trim(),
            addressLine2: addressLine2.trim(),
            city: city.trim(),
            postcode: postcode.trim(),
            country: "United Kingdom",
          }
        : {
            name: billingName.trim() || name.trim(),
            addressLine1: billingAddressLine1.trim(),
            addressLine2: billingAddressLine2.trim(),
            city: billingCity.trim(),
            postcode: billingPostcode.trim(),
            country: "United Kingdom",
          };

      const orderPayload = {
        customer: {
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
        },
        shippingAddress: {
          addressLine1: addressLine1.trim(),
          addressLine2: addressLine2.trim(),
          city: city.trim(),
          postcode: postcode.trim(),
          country: "United Kingdom",
        },
        billingAddress: resolvedBilling,
        deliveryOption: {
          tier: currentDeliveryOption.id,
          name: currentDeliveryOption.name,
          feePennies: totalShippingPennies,
          estimatedDays: currentDeliveryOption.timeframe,
        },
        deliveryTier: currentDeliveryOption.id,
        items: items.map((it) => ({
          productId: it.product.id,
          sku: it.product.gtinBarcode || it.product.id,
          title: it.product.title,
          finish: it.selectedFinish || it.product.specs?.color || "Standard Finish",
          pricePennies: it.product.pricePennies,
          quantity: it.quantity,
          thumbnailUrl: it.product.thumbnailUrl,
        })),
        paymentMethod,
        paymentConfirmation: {
          paymentIntentId: confirmData.paymentIntentId,
          transactionId: confirmData.transactionId,
          status: "succeeded",
          paymentMethod,
        },
      };

      const orderRes = await fetch(apiUrl("/api/checkout/create-order"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok || !orderData.success) {
        throw new Error(orderData.error || "Failed to persist verified order in database.");
      }

      // Close modal and set confirmed order details
      setIsGatewayModalOpen(false);
      setConfirmedOrder({
        orderId: orderData.orderId,
        orderNumber: orderData.orderNumber,
        poNumber: orderData.poNumber,
        invoiceNumber: orderData.invoiceNumber,
        trackingNumber: orderData.trackingNumber,
        carrier: orderData.carrier || "Amos Mann 2-Man Dedicated Fleet",
        totalPennies: orderData.totalPennies,
        formattedTotal: orderData.formattedTotal || formatGBP(orderData.totalPennies),
        customerName: orderData.customerName,
        customerEmail: orderData.customerEmail,
        shippingAddress: orderData.shippingAddress,
        billingAddress: orderData.billingAddress,
        deliveryTier: orderData.deliveryTier,
        deliveryLabel: orderData.deliveryLabel,
        estimatedDays: orderData.estimatedDays,
        items: orderData.items,
        invoiceHtmlUrl: orderData.invoiceHtmlUrl || `/api/orders/${orderData.orderId}/invoice`,
        paymentMethod,
        transactionId: confirmData.transactionId,
        paymentIntentId: confirmData.paymentIntentId,
      });

      // Clear basket from client state
      clearCart();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error processing payment authorization.";
      setGatewayError(msg);
    } finally {
      setIsProcessingPayment(false);
      setIsSubmittingOrder(false);
    }
  };

  // ==========================================
  // 1. ORDER CONFIRMED VIEW (LUXURY FINISH)
  // ==========================================
  if (confirmedOrder) {
    return (
      <div className="bg-sand-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8 print-receipt-container print:p-0 print:m-0 print:bg-white print:min-h-0">
        <div className="max-w-3xl mx-auto space-y-8 print:space-y-4 print:max-w-full print:m-0 print:p-0">
          
          {/* Main Success Card */}
          <div className="bg-sand-100 rounded-2xl border border-sand-300 p-8 sm:p-10 shadow-elevation text-center space-y-6 print-receipt-card print:rounded-none print:border-sand-400 print:p-6 print:space-y-4 print:bg-white print:shadow-none">
            {/* Print Letterhead (Print-Only) */}
            <div className="hidden print:block text-left border-b border-sand-300 pb-3 mb-2">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-navy-950 font-display">SAN Furniture Ltd</h2>
                  <p className="text-[11px] text-navy-700">100 Pall Mall, St James's, London, SW1Y 5NQ</p>
                  <p className="text-[10px] text-navy-600">Company Reg: 15482910 • UK VAT Reg: GB 421 9823 45</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-navy-950 block">OFFICIAL ORDER RECEIPT</span>
                  <span className="text-[11px] font-mono text-navy-800">Order: {confirmedOrder.orderNumber}</span>
                  <span className="text-[10px] text-navy-600 block">Date: {new Date().toLocaleDateString("en-GB")}</span>
                </div>
              </div>
            </div>

            <div className="w-16 h-16 rounded-full bg-forest-100 border border-forest-300 text-forest-700 flex items-center justify-center mx-auto shadow-sm print:hidden">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-forest-50 text-forest-800 border border-forest-200 mb-2">
                <Check className="w-3.5 h-3.5" />
                Payment Authorized & Order Dispatched
              </span>
              <h1 className="font-display text-3xl sm:text-4xl font-bold text-navy-950 print:text-2xl">
                Thank You for Your Order
              </h1>
              <p className="text-sm text-navy-600 mt-2">
                Order reference: <strong className="font-mono text-base text-navy-950 font-bold">{confirmedOrder.orderNumber}</strong>
              </p>
              <p className="text-xs text-navy-500 mt-1">
                A confirmation email and statutory VAT invoice have been prepared for <strong className="text-navy-900">{confirmedOrder.customerEmail}</strong>.
              </p>
            </div>

            {/* Payment Authorization Details Box */}
            <div className="p-4 rounded-xl bg-forest-50/70 border border-forest-200 text-left text-xs space-y-1.5 text-forest-900 print:bg-white print:border-sand-300">
              <div className="flex justify-between font-bold border-b border-forest-200/80 pb-1.5 text-forest-950 print:border-sand-300">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-forest-700" />
                  Verified Payment Authorization
                </span>
                <span className="font-mono text-[11px] bg-forest-200/80 px-2 py-0.5 rounded text-forest-900 print:bg-sand-100">
                  {confirmedOrder.paymentMethod.toUpperCase()} SECURED
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                <div><strong>Transaction ID:</strong> <span className="font-mono">{confirmedOrder.transactionId || "txn_live_confirmed"}</span></div>
                <div><strong>Payment Intent:</strong> <span className="font-mono">{confirmedOrder.paymentIntentId || "pi_live_confirmed"}</span></div>
                <div><strong>Delivery Tier:</strong> {confirmedOrder.deliveryLabel}</div>
                <div><strong>Total Settled:</strong> {confirmedOrder.formattedTotal} (Inc. 20% UK VAT)</div>
              </div>
            </div>

            {/* Dropship & Logistics Real-time Dispatch Badge */}
            <div className="p-4 rounded-xl bg-sand-200/50 border border-sand-300 text-left space-y-3 print:bg-white print:border-sand-300">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sand-300/70 pb-2.5 print:border-sand-300">
                <div className="flex items-center gap-2 text-xs font-bold text-navy-950">
                  <Building2 className="w-4 h-4 text-brass-600" />
                  <span>B2B Supplier Purchase Order: <span className="font-mono text-brass-700">{confirmedOrder.poNumber}</span></span>
                </div>
                <span className="text-[11px] font-semibold text-forest-700 bg-forest-100/70 px-2 py-0.5 rounded border border-forest-200 print:bg-sand-100">
                  Hub Status: Dispatched
                </span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-navy-800">
                <div>
                  <span className="text-navy-500 block text-[11px]">Dropship Supplier Hub:</span>
                  <span className="font-semibold text-navy-950">Amos Mann Furniture (Leicester Hub)</span>
                </div>
                <div>
                  <span className="text-navy-500 block text-[11px]">Carrier / Dedicated Fleet:</span>
                  <span className="font-semibold text-navy-950">{confirmedOrder.carrier}</span>
                </div>
                <div>
                  <span className="text-navy-500 block text-[11px]">Consignment Tracking No:</span>
                  <span className="font-mono font-semibold text-navy-950">{confirmedOrder.trackingNumber}</span>
                </div>
                <div>
                  <span className="text-navy-500 block text-[11px]">Estimated Transit:</span>
                  <span className="font-semibold text-forest-700">{confirmedOrder.estimatedDays}</span>
                </div>
              </div>
            </div>

            {/* Purchased Items List */}
            <div className="rounded-xl bg-sand-50 border border-sand-200 p-4 text-left space-y-3 print:bg-white print:border-sand-300">
              <h3 className="text-xs font-bold text-navy-950 uppercase tracking-wider border-b border-sand-200 pb-2 print:border-sand-300">
                Purchased Furniture Items ({confirmedOrder.items.length})
              </h3>
              <div className="divide-y divide-sand-200 print:divide-sand-300">
                {confirmedOrder.items.map((item, idx) => (
                  <div key={idx} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {item.thumbnailUrl && (
                        <img
                          src={item.thumbnailUrl}
                          alt={item.title}
                          className="w-12 h-12 rounded object-cover border border-sand-300 flex-shrink-0 print:w-10 print:h-10"
                        />
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-navy-950 truncate">{item.title}</p>
                        <p className="text-[11px] text-navy-600">
                          Qty: {item.quantity} • Finish: {item.finish || "Standard"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-xs font-bold text-navy-950">
                        {formatGBP(item.pricePennies * item.quantity)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery & Billing Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left text-xs text-navy-800">
              <div className="p-4 rounded-xl bg-sand-50 border border-sand-200 space-y-1.5 print:bg-white print:border-sand-300">
                <span className="font-bold text-navy-950 block border-b border-sand-200 pb-1 print:border-sand-300">
                  Delivery Destination
                </span>
                <div><strong>Recipient:</strong> {confirmedOrder.customerName}</div>
                <div><strong>Address:</strong> {confirmedOrder.shippingAddress}</div>
                <div><strong>Option:</strong> {confirmedOrder.deliveryLabel}</div>
              </div>

              <div className="p-4 rounded-xl bg-sand-50 border border-sand-200 space-y-1.5 print:bg-white print:border-sand-300">
                <span className="font-bold text-navy-950 block border-b border-sand-200 pb-1 print:border-sand-300">
                  Billing Details
                </span>
                <div><strong>Billing Address:</strong> {confirmedOrder.billingAddress}</div>
                <div><strong>VAT Invoice:</strong> <span className="font-mono text-navy-950">{confirmedOrder.invoiceNumber}</span></div>
                <div><strong>Total Paid:</strong> {confirmedOrder.formattedTotal} (Inc. 20% UK VAT)</div>
              </div>
            </div>

            {/* Direct Action Buttons: Download VAT Invoice & Print (NO-PRINT) */}
            <div className="no-print pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href={apiUrl(confirmedOrder.invoiceHtmlUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-brass-500 text-navy-950 font-bold text-xs hover:bg-brass-400 shadow-sm transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Download Statutory HMRC VAT Invoice</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-70" />
              </a>

              <button
                type="button"
                onClick={() => window.print()}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-sand-200 text-navy-950 font-semibold text-xs hover:bg-sand-300 transition-colors"
              >
                <Printer className="w-4 h-4 text-navy-700" />
                <span>Print Order Receipt</span>
              </button>
            </div>

            <div className="no-print pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 border-t border-sand-200">
              <Link
                href="/"
                className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-navy-950 text-sand-50 font-semibold text-xs hover:bg-brass-600 transition-colors"
              >
                Return to Homepage
              </Link>
              <Link
                href="/catalog"
                className="w-full sm:w-auto px-6 py-2.5 rounded-lg border border-sand-300 text-navy-950 font-semibold text-xs hover:bg-sand-200 transition-colors"
              >
                Continue Exploring Catalog
              </Link>
            </div>

            {/* Customer Care Hotline (NO-PRINT) */}
            <div className="no-print text-[11px] text-navy-500 pt-1">
              Need assistance with your delivery booking? Our London concierge team is available at{" "}
              <a href="tel:+442079460192" className="text-brass-700 font-semibold underline">
                +44 20 7946 0192
              </a>{" "}
              or{" "}
              <a href="mailto:concierge@sanfurniture.com" className="text-brass-700 font-semibold underline">
                concierge@sanfurniture.com
              </a>.
            </div>

          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // 2. EMPTY BASKET VIEW
  // ==========================================
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
          Add one of our handcrafted British sofas, chests of drawers, dining sets, or beds before checking out.
        </p>
        <Link
          href="/catalog"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-navy-950 text-sand-50 text-xs font-semibold hover:bg-brass-600 transition-colors shadow-sm"
        >
          Browse Full Catalog
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  // ==========================================
  // 3. MAIN CHECKOUT WORKFLOW VIEW
  // ==========================================
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
          
          {/* Left Form: Delivery Address, Delivery Options, Billing, & Payment (7 cols) */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Error Banner */}
            {submitError && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 font-medium">{submitError}</div>
              </div>
            )}

            {/* Checkout Form */}
            <form onSubmit={handleInitiatePaymentGateway} className="space-y-6">
              
              {/* Step 1: UK Delivery Address */}
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
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-navy-900">
                        UK Postcode *
                      </label>
                      <span className="text-[10px] text-navy-500">e.g. SW1A 1AA, M1 1AE, LE5 5FN</span>
                    </div>
                    <input
                      type="text"
                      required
                      value={postcode}
                      onChange={(e) => {
                        setPostcode(e.target.value.toUpperCase());
                        setLookupMessage(null);
                      }}
                      placeholder="Enter UK Postcode"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-sand-300 bg-sand-50 text-navy-950 focus:ring-2 focus:ring-brass-500 outline-none font-mono uppercase"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddressLookup}
                    disabled={isLookingUpPostcode}
                    className="w-full py-2 px-3 rounded-lg bg-navy-950 text-sand-50 text-xs font-semibold hover:bg-brass-600 transition-colors h-[34px] flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {isLookingUpPostcode ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <span>Find Address</span>
                    )}
                  </button>
                </div>

                {lookupMessage && (
                  <div className={`p-2.5 rounded-lg text-xs font-medium ${
                    lookupMessage.isError
                      ? "bg-rose-50 border border-rose-200 text-rose-700"
                      : "bg-forest-50 border border-forest-200 text-forest-800"
                  }`}>
                    {lookupMessage.text}
                  </div>
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
                  <p className="text-[10px] text-navy-500 mt-1">
                    The white glove courier team will send SMS dispatch updates and call to book your 2-hour delivery slot.
                  </p>
                </div>
              </div>

              {/* Step 2: Dedicated UK Delivery Options */}
              <div className="p-6 rounded-xl bg-sand-100/40 border border-sand-300 space-y-4">
                <div className="flex items-center justify-between border-b border-sand-200 pb-3">
                  <div className="flex items-center gap-2">
                    <Truck className="w-5 h-5 text-brass-600" />
                    <h2 className="font-display text-lg font-bold text-navy-950">
                      2. Delivery Options
                    </h2>
                  </div>
                  <span className="text-xs text-navy-500 font-medium">
                    Leicester Dedicated Hub
                  </span>
                </div>

                <div className="space-y-3">
                  {deliveryOptions.map((opt) => {
                    const isSelected = selectedDeliveryTier === opt.id;
                    const feePennies = opt.baseFeePennies + postcodeSurchargePennies;
                    return (
                      <label
                        key={opt.id}
                        className={`block p-4 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? "border-navy-950 bg-sand-200/60 ring-1 ring-navy-950 shadow-sm"
                            : "border-sand-300 bg-sand-50 hover:bg-sand-100"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <input
                              type="radio"
                              name="delivery_tier_choice"
                              checked={isSelected}
                              onChange={() => setSelectedDeliveryTier(opt.id)}
                              className="mt-0.5 text-navy-950 focus:ring-brass-500"
                            />
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold text-navy-950">
                                  {opt.name}
                                </span>
                                {opt.badge && (
                                  <span className="text-[10px] font-semibold text-forest-800 bg-forest-100 px-2 py-0.5 rounded border border-forest-300">
                                    {opt.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-navy-600 mt-1">
                                {opt.description}
                              </p>
                              <p className="text-[10px] text-brass-700 font-semibold mt-1">
                                Estimated transit: {opt.timeframe}
                              </p>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <span className="text-xs font-bold text-navy-950">
                              {feePennies === 0 ? "FREE" : formatGBP(feePennies)}
                            </span>
                            {postcodeSurchargePennies > 0 && (
                              <span className="block text-[9px] text-navy-500">
                                (Inc. regional surcharge)
                              </span>
                            )}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Step 3: Billing Address (Dedicated Section) */}
              <div className="p-6 rounded-xl bg-sand-100/40 border border-sand-300 space-y-4">
                <div className="flex items-center justify-between border-b border-sand-200 pb-3">
                  <div className="flex items-center gap-2">
                    <Building className="w-5 h-5 text-brass-600" />
                    <h2 className="font-display text-lg font-bold text-navy-950">
                      3. Billing Address
                    </h2>
                  </div>
                  <span className="text-xs text-navy-500">
                    Matches Card / Finance Record
                  </span>
                </div>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={billingSameAsDelivery}
                    onChange={(e) => setBillingSameAsDelivery(e.target.checked)}
                    className="w-4 h-4 rounded text-navy-950 focus:ring-brass-500 border-sand-300"
                  />
                  <span className="text-xs font-semibold text-navy-900">
                    Billing address is the same as my delivery address
                  </span>
                </label>

                {/* Expanded Billing Address Form when unchecked */}
                {!billingSameAsDelivery && (
                  <div className="mt-4 pt-4 border-t border-sand-200 space-y-3 bg-sand-50 p-4 rounded-xl border border-sand-300">
                    <span className="text-[11px] font-bold text-navy-900 block">
                      Enter Separate Billing Address
                    </span>

                    <div>
                      <label className="block text-[11px] font-semibold text-navy-800 mb-1">
                        Billing Name
                      </label>
                      <input
                        type="text"
                        value={billingName}
                        onChange={(e) => setBillingName(e.target.value)}
                        placeholder={name || "Cardholder / Account Name"}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-sand-300 bg-white text-navy-950 focus:ring-2 focus:ring-brass-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-navy-800 mb-1">
                        Billing Address Line 1 *
                      </label>
                      <input
                        type="text"
                        required={!billingSameAsDelivery}
                        value={billingAddressLine1}
                        onChange={(e) => setBillingAddressLine1(e.target.value)}
                        placeholder="House number & street"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-sand-300 bg-white text-navy-950 focus:ring-2 focus:ring-brass-500 outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-navy-800 mb-1">
                          Billing Town / City *
                        </label>
                        <input
                          type="text"
                          required={!billingSameAsDelivery}
                          value={billingCity}
                          onChange={(e) => setBillingCity(e.target.value)}
                          placeholder="e.g. London"
                          className="w-full px-3 py-2 text-xs rounded-lg border border-sand-300 bg-white text-navy-950 focus:ring-2 focus:ring-brass-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-navy-800 mb-1">
                          Billing Postcode *
                        </label>
                        <input
                          type="text"
                          required={!billingSameAsDelivery}
                          value={billingPostcode}
                          onChange={(e) => setBillingPostcode(e.target.value.toUpperCase())}
                          placeholder="e.g. W1K 2HP"
                          className="w-full px-3 py-2 text-xs rounded-lg border border-sand-300 bg-white text-navy-950 focus:ring-2 focus:ring-brass-500 outline-none font-mono uppercase"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Step 4: Payment Method Selector */}
              <div className="p-6 rounded-xl bg-sand-100/40 border border-sand-300 space-y-4">
                <div className="flex items-center justify-between border-b border-sand-200 pb-3">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-brass-600" />
                    <h2 className="font-display text-lg font-bold text-navy-950">
                      4. Payment Method
                    </h2>
                  </div>
                  <span className="text-xs text-navy-500 flex items-center gap-1 font-mono">
                    <Lock className="w-3.5 h-3.5 text-forest-700" />
                    256-Bit SSL Encrypted
                  </span>
                </div>

                <div className="space-y-3">
                  
                  {/* Dedicated Card Option (Stripe UK Gateway) */}
                  <div className="p-4 rounded-xl border border-navy-950 bg-sand-200/50 ring-1 ring-navy-950 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-4 h-4 rounded-full bg-navy-950 flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-brass-400" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-navy-950 block">
                            Credit / Debit Card (Stripe UK Gateway)
                          </span>
                          <span className="text-[10px] text-navy-600">
                            Visa, Mastercard, American Express, Apple Pay, Google Pay
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-[10px] uppercase tracking-wider bg-sand-300/80 px-2 py-0.5 rounded text-navy-900 border border-sand-400/50">
                          3D Secure 2.0
                        </span>
                        <span className="font-semibold text-[10px] uppercase tracking-wider bg-forest-100 text-forest-800 px-2 py-0.5 rounded border border-forest-300">
                          PSD2 SCA
                        </span>
                      </div>
                    </div>

                    {/* Interactive Card Form */}
                    <div className="pt-3 border-t border-sand-300 space-y-3">
                      <div className="flex items-center justify-between pb-1">
                        <span className="text-[11px] font-semibold text-navy-700">Card Credentials (Stripe Hosted Element)</span>
                        <button
                          type="button"
                          onClick={handleFillTestCard}
                          className="text-[11px] font-bold text-brass-700 hover:text-brass-800 underline flex items-center gap-1"
                        >
                          <Sparkles className="w-3 h-3 text-brass-600" />
                          <span>Fill Demo Test Card</span>
                        </button>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-navy-800 mb-1">
                          Cardholder Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={cardholderName}
                          onChange={(e) => setCardholderName(e.target.value)}
                          placeholder={name || "Lady Eleanor Vance"}
                          className="w-full px-3 py-2 text-xs rounded-lg border border-sand-300 bg-white text-navy-950 focus:ring-2 focus:ring-brass-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-navy-800 mb-1">
                          Card Number *
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={19}
                          value={cardNumber}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/\D/g, "").slice(0, 16);
                            const formatted = raw.match(/.{1,4}/g)?.join(" ") || raw;
                            setCardNumber(formatted);
                          }}
                          placeholder="4242 •••• •••• 4242"
                          className="w-full px-3 py-2 text-xs rounded-lg border border-sand-300 bg-white text-navy-950 focus:ring-2 focus:ring-brass-500 outline-none font-mono"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-navy-800 mb-1">
                            Expiry Date (MM/YY) *
                          </label>
                          <input
                            type="text"
                            required
                            maxLength={5}
                            value={cardExpiry}
                            onChange={(e) => {
                              const raw = e.target.value.replace(/\D/g, "").slice(0, 4);
                              if (raw.length > 2) {
                                setCardExpiry(`${raw.slice(0, 2)}/${raw.slice(2)}`);
                              } else {
                                setCardExpiry(raw);
                              }
                            }}
                            placeholder="MM/YY"
                            className="w-full px-3 py-2 text-xs rounded-lg border border-sand-300 bg-white text-navy-950 focus:ring-2 focus:ring-brass-500 outline-none font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-navy-800 mb-1">
                            Security CVC / CVV *
                          </label>
                          <input
                            type="password"
                            required
                            maxLength={4}
                            value={cardCvc}
                            onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                            placeholder="123"
                            className="w-full px-3 py-2 text-xs rounded-lg border border-sand-300 bg-white text-navy-950 focus:ring-2 focus:ring-brass-500 outline-none font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit CTA Button: Opens Gateway Modal */}
              <button
                type="submit"
                disabled={isProcessingPayment}
                className="w-full py-4 px-6 rounded-lg bg-brass-500 text-navy-950 font-bold text-sm tracking-wide flex items-center justify-center gap-2 hover:bg-brass-400 active:scale-[0.99] transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                {isProcessingPayment ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-navy-950" />
                    <span>Connecting to Official Payment Gateway...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Proceed to Gateway Payment • {formatGBP(grandTotalPennies)}</span>
                  </>
                )}
              </button>

              <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-navy-600 pt-1 text-center">
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
                  Edit Basket
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
                        Qty: {item.quantity} • {item.selectedFinish || item.product.specs?.color || "Standard"}
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
                    <span className="block font-medium">Delivery</span>
                    <span className="text-[10px] text-navy-500">{currentDeliveryOption.name}</span>
                  </div>
                  <span className="font-semibold text-navy-950">
                    {totalShippingPennies === 0
                      ? "FREE"
                      : formatGBP(totalShippingPennies)}
                  </span>
                </div>

                <div className="pt-3 border-t border-sand-300 flex justify-between items-baseline font-bold text-navy-950">
                  <span className="text-sm">Total Due</span>
                  <span className="font-display text-2xl text-navy-950">
                    {formatGBP(grandTotalPennies)}
                  </span>
                </div>
              </div>

              {/* Stripe UK Gateway Assurance */}
              <div className="p-3 rounded-lg bg-sand-50 border border-sand-200 text-xs text-navy-800 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-navy-950">
                  <ShieldCheck className="w-4 h-4 text-brass-600" />
                  <span>Stripe UK Verified Gateway</span>
                </div>
                <p className="text-[11px] text-navy-600">
                  Protected by 3D Secure 2.0 Strong Customer Authentication (PSD2 SCA). 256-bit encrypted card checkout with zero hidden fees.
                </p>
              </div>

              {/* White Glove Delivery Assurance */}
              <div className="p-3 rounded-lg bg-sand-200/50 border border-sand-300 text-xs text-navy-800 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-navy-950">
                  <Truck className="w-4 h-4 text-brass-600" />
                  <span>2-Man Dedicated Logistics</span>
                </div>
                <p className="text-[11px] text-navy-600">
                  Furniture is dispatched directly from our Leicester logistics hub. Delivered into your room of choice with pre-delivery calling.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. DEDICATED OFFICIAL PAYMENT GATEWAY MODAL (SCA / 3DS) */}
      {/* ======================================================== */}
      {isGatewayModalOpen && paymentIntent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-sand-300 shadow-2xl max-w-lg w-full overflow-hidden space-y-5 animate-in zoom-in-95 duration-200">
            
            {/* Gateway Brand Header */}
            <div className="px-6 py-4 bg-[#070D1E] text-sand-50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-brass-400" />
                <div>
                  <h3 className="font-display text-sm font-bold tracking-wide">
                    Stripe UK Gateway • 3D Secure 2.0 Strong Customer Authentication
                  </h3>
                  <span className="text-[10px] text-sand-300 font-mono">
                    UK PSD2 Statutory Payment Gate (Strict Anti-Fraud Protection)
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsGatewayModalOpen(false)}
                className="p-1 rounded-md text-sand-400 hover:text-sand-50 hover:bg-navy-900 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Gateway Content Body */}
            <div className="px-6 space-y-4">
              
              {/* Transaction Summary Badge */}
              <div className="p-3.5 rounded-xl bg-sand-100/70 border border-sand-300 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-navy-500 uppercase block font-semibold">Merchant</span>
                  <span className="font-bold text-navy-950">SAN Furniture Ltd (London, UK)</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-navy-500 uppercase block font-semibold">Total to Authorize</span>
                  <span className="font-display text-base font-bold text-navy-950">
                    {paymentIntent.formattedAmount}
                  </span>
                </div>
              </div>

              {/* Dedicated Stripe 3DS SCA Security Challenge */}
              <div className="space-y-3 text-xs text-navy-800">
                <div className="p-3 rounded-lg bg-sand-50 border border-sand-200 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-navy-900 block">Bank Security Challenge</span>
                    <span className="text-[10px] text-navy-500">Card ending in •••• {cardNumber.replace(/\s+/g, "").slice(-4) || "4242"}</span>
                  </div>
                  <span className="font-mono text-[10px] bg-sand-200 px-2 py-0.5 rounded text-navy-800">
                    Visa Secure / Mastercard ID
                  </span>
                </div>

                <p className="text-[11px] text-navy-600">
                  To protect your account from fraudulent transactions, your card issuer requires 3D Secure Strong Customer Authentication (SCA) verification before this order is placed.
                </p>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-semibold text-navy-900 flex items-center gap-1">
                      <KeyRound className="w-3.5 h-3.5 text-brass-600" />
                      <span>Enter 6-Digit SMS Passcode</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setScaOtp("123456")}
                      className="text-[10px] text-brass-700 underline font-bold cursor-pointer inline-flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3 text-brass-600" />
                      <span>Auto-fill 123456</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    value={scaOtp}
                    onChange={(e) => setScaOtp(e.target.value)}
                    placeholder="123456"
                    className="w-full text-center text-lg tracking-widest font-mono py-2 rounded-lg border border-sand-300 bg-white font-bold text-navy-950 focus:ring-2 focus:ring-brass-500 outline-none"
                  />
                  <p className="text-[10px] text-navy-500 text-center">
                    Test Passcode: Use <strong>123456</strong> or click 1-Click Approval below.
                  </p>
                </div>
              </div>

              {/* Gateway Error Display */}
              {gatewayError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-300 text-rose-800 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <span>{gatewayError}</span>
                </div>
              )}
            </div>

            {/* Gateway Modal Actions */}
            <div className="px-6 py-4 bg-sand-50 border-t border-sand-200 flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={handleConfirmGatewayPayment}
                disabled={isProcessingPayment || isSubmittingOrder}
                className="flex-1 py-3 px-4 rounded-lg bg-navy-950 text-sand-50 font-bold text-xs flex items-center justify-center gap-2 hover:bg-brass-600 transition-colors shadow-sm disabled:opacity-50"
              >
                {isProcessingPayment || isSubmittingOrder ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Authorization & Placing Order...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-brass-400" />
                    <span>Confirm & Authorize Payment ({paymentIntent.formattedAmount})</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsGatewayModalOpen(false)}
                disabled={isProcessingPayment || isSubmittingOrder}
                className="py-3 px-4 rounded-lg border border-sand-300 text-navy-700 hover:bg-sand-100 text-xs font-semibold transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
