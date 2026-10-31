"use client";

import React, { useState, useMemo, useEffect } from "react";
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
  Building,
  User,
  Copy,
  Plus,
  Tag,
  X,
} from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { apiUrl } from "@/lib/api-config";
import { classifyUKPostcode, formatGBP, calculateNetAndVat, type UKPostcodeZone } from "@san-furniture/types";
import { usePageSections } from "@/lib/cms";
import { OrderCelebration } from "@/components/checkout/OrderCelebration";

// Delivery Tier definitions
type DeliveryTierId = string;

interface DeliveryTierOption {
  id: DeliveryTierId;
  name: string;
  description: string;
  baseFeePennies: number;
  timeframe: string;
  badge?: string;
  isActive?: boolean;
  sortOrder?: number;
}

const DEFAULT_FALLBACK_DELIVERY: DeliveryTierOption = {
  id: "del_opt_001",
  name: "Free UK Mainland Delivery",
  description: "Complimentary room of choice delivery across mainland UK. Direct from SAN Central Distribution Hub with a 2-hour pre-delivery booking call.",
  baseFeePennies: 0,
  timeframe: "3 - 7 business days",
  badge: "FREE DELIVERY",
  isActive: true,
  sortOrder: 1,
};

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

  const { getSection } = usePageSections("checkout");
  const headerBadge = getSection("checkout_header_badge", {
    badge_text: "Safe & Secure UK Checkout",
    guarantee_text: "Direct Mainland Dispatch • 100% Transit Insured • UK Quality Checked",
    ssl_note: "256-bit SSL Bank-Grade Encryption",
  });

  // Voucher / Promotion State
  const [voucherInput, setVoucherInput] = useState("");
  const [isApplyingVoucher, setIsApplyingVoucher] = useState(false);
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [appliedVoucher, setAppliedVoucher] = useState<{
    code: string;
    description: string;
    discountType: string;
    discountValue: number;
    discountPennies: number;
    discountFormatted: string;
  } | null>(null);

  // Restore applied voucher from session on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = sessionStorage.getItem("san_applied_voucher");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.code && parsed.discountPennies) {
            setAppliedVoucher(parsed);
          }
        }
      } catch {}
    }
  }, []);

  // 1. Account / Contact State
  const [accountFirstName, setAccountFirstName] = useState("");
  const [accountLastName, setAccountLastName] = useState("");
  const [accountUsername, setAccountUsername] = useState("");
  const [accountEmail, setAccountEmail] = useState("");
  const [accountPhone, setAccountPhone] = useState("");
  const [createAccount, setCreateAccount] = useState(false);
  const [accountPassword, setAccountPassword] = useState("");

  // 2. Billing Address State
  const [billingFirstName, setBillingFirstName] = useState("");
  const [billingLastName, setBillingLastName] = useState("");
  const [billingCompany, setBillingCompany] = useState("");
  const [billingAddress1, setBillingAddress1] = useState("");
  const [billingAddress2, setBillingAddress2] = useState("");
  const [billingCity, setBillingCity] = useState("");
  const [billingPostcode, setBillingPostcode] = useState("");
  const [billingCountry, setBillingCountry] = useState("United Kingdom");
  const [billingState, setBillingState] = useState("");
  const [billingEmail, setBillingEmail] = useState("");
  const [billingPhone, setBillingPhone] = useState("");
  const [billingAddressOptions, setBillingAddressOptions] = useState<Array<{
    id: string;
    line1: string;
    line2?: string;
    city: string;
    county: string;
    postcode: string;
    formatted: string;
  }>>([]);
  const [selectedBillingAddressIndex, setSelectedBillingAddressIndex] = useState<string>("");

  // 3. Shipping Address State
  const [shippingSameAsBilling, setShippingSameAsBilling] = useState(true);
  const [shippingFirstName, setShippingFirstName] = useState("");
  const [shippingLastName, setShippingLastName] = useState("");
  const [shippingCompany, setShippingCompany] = useState("");
  const [shippingAddress1, setShippingAddress1] = useState("");
  const [shippingAddress2, setShippingAddress2] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [shippingPostcode, setShippingPostcode] = useState("");
  const [shippingCountry, setShippingCountry] = useState("United Kingdom");
  const [shippingState, setShippingState] = useState("");
  const [shippingAddressOptions, setShippingAddressOptions] = useState<Array<{
    id: string;
    line1: string;
    line2?: string;
    city: string;
    county: string;
    postcode: string;
    formatted: string;
  }>>([]);
  const [selectedShippingAddressIndex, setSelectedShippingAddressIndex] = useState<string>("");

  // Copy Account -> Billing
  const handleCopyAccountToBilling = () => {
    if (accountFirstName) setBillingFirstName(accountFirstName);
    if (accountLastName) setBillingLastName(accountLastName);
    if (accountEmail) setBillingEmail(accountEmail);
    if (accountPhone) setBillingPhone(accountPhone);
  };

  // Copy Billing -> Shipping
  const handleCopyBillingToShipping = () => {
    setShippingFirstName(billingFirstName || accountFirstName);
    setShippingLastName(billingLastName || accountLastName);
    setShippingCompany(billingCompany);
    setShippingAddress1(billingAddress1);
    setShippingAddress2(billingAddress2);
    setShippingCity(billingCity);
    setShippingPostcode(billingPostcode);
    setShippingCountry(billingCountry || "United Kingdom");
    setShippingState(billingState);
  };

  interface SavedPaymentMethod {
    id: string;
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
    cardholder_name: string;
    is_default: number;
  }

  // Saved cards state & 1-click re-use
  const [savedCards, setSavedCards] = useState<SavedPaymentMethod[]>([]);
  const [selectedSavedCardId, setSelectedSavedCardId] = useState<string>("");
  const [paymentMode, setPaymentMode] = useState<"saved" | "new">("new");
  const [savedCardCvc, setSavedCardCvc] = useState("123");
  const [isLoadingSavedCards, setIsLoadingSavedCards] = useState(false);
  const [loggedInCustomer, setLoggedInCustomer] = useState<any>(null);

  // Auto-fill logged in user on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const rawUser = localStorage.getItem("san_customer_user");
      if (rawUser) {
        const u = JSON.parse(rawUser);
        setLoggedInCustomer(u);
        setCreateAccount(false);
        setAccountPassword("");
        if (u.firstName) setAccountFirstName(u.firstName);
        if (u.lastName) setAccountLastName(u.lastName);
        if (u.username) setAccountUsername(u.username);
        if (u.email) setAccountEmail(u.email);
        if (u.phone) setAccountPhone(u.phone);

        // Pre-fill billing with account
        setBillingFirstName(u.firstName || "");
        setBillingLastName(u.lastName || "");
        setBillingEmail(u.email || "");
        setBillingPhone(u.phone || "");

        if (u.addresses && u.addresses.length > 0) {
          const def = u.addresses.find((a: any) => a.is_default_delivery) || u.addresses[0];
          if (def) {
            setBillingAddress1(def.address_line1 || "");
            setBillingAddress2(def.address_line2 || "");
            setBillingCity(def.city || "");
            setBillingPostcode(def.postcode || "");
            setBillingState(def.county || "");
            setBillingCompany(def.company || "");
          }
        }
      } else {
        // Also check server auth session if localStorage is empty
        fetch(apiUrl("/api/customer/auth/me"))
          .then((r) => r.json())
          .then((data) => {
            if (data?.success && data?.customer) {
              const u = data.customer;
              setLoggedInCustomer(u);
              setCreateAccount(false);
              setAccountPassword("");
              try {
                localStorage.setItem("san_customer_user", JSON.stringify(u));
              } catch {}
              if (u.firstName) setAccountFirstName(u.firstName);
              if (u.lastName) setAccountLastName(u.lastName);
              if (u.username) setAccountUsername(u.username);
              if (u.email) setAccountEmail(u.email);
              if (u.phone) setAccountPhone(u.phone);

              setBillingFirstName(u.firstName || "");
              setBillingLastName(u.lastName || "");
              setBillingEmail(u.email || "");
              setBillingPhone(u.phone || "");
            }
          })
          .catch(() => {});
      }
    } catch {
      // ignore
    }
  }, []);

  // Ensure createAccount is always false when loggedInCustomer is active
  useEffect(() => {
    if (loggedInCustomer) {
      setCreateAccount(false);
      setAccountPassword("");
    }
  }, [loggedInCustomer]);

  // Fetch saved payment instruments dynamically for instant 1-click reuse
  useEffect(() => {
    const targetEmail = accountEmail.trim() || billingEmail.trim() || loggedInCustomer?.email;
    if (!targetEmail) return;

    let isCancelled = false;
    setIsLoadingSavedCards(true);
    fetch(apiUrl(`/api/customer/payment-methods?email=${encodeURIComponent(targetEmail)}&customerId=${encodeURIComponent(loggedInCustomer?.id || "")}`))
      .then((r) => r.json())
      .then((data) => {
        if (isCancelled) return;
        if (data.success && Array.isArray(data.paymentMethods) && data.paymentMethods.length > 0) {
          setSavedCards(data.paymentMethods);
          const def = data.paymentMethods.find((c: SavedPaymentMethod) => c.is_default) || data.paymentMethods[0];
          setSelectedSavedCardId(def.id);
          setPaymentMode("saved");
        } else {
          setSavedCards([]);
          setPaymentMode("new");
        }
      })
      .catch((err) => console.error("Error loading saved cards:", err))
      .finally(() => {
        if (!isCancelled) setIsLoadingSavedCards(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [accountEmail, billingEmail, loggedInCustomer?.id, loggedInCustomer?.email]);

  // Hydration state tracking
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Dedicated Delivery Options State (Defaults to primary active tier)
  const [selectedDeliveryTier, setSelectedDeliveryTier] = useState<DeliveryTierId>("del_opt_001");

  // Payment Selection: Sole processor is Credit / Debit Card (Stripe UK Gateway)
  const paymentMethod = "card";

  // Card details state
  const [cardholderName, setCardholderName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [saveCardForFuture, setSaveCardForFuture] = useState(false);

  // Postcode lookup state
  const [isLookingUpPostcode, setIsLookingUpPostcode] = useState(false);
  const [lookupMessage, setLookupMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  // Order & Payment submission state
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [checkoutStepState, setCheckoutStepState] = useState<"idle" | "authorizing" | "securing" | "confirmed">("idle");
  const [copiedOrderNumber, setCopiedOrderNumber] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<ConfirmedOrderDetails | null>(null);

  // Pre-warm checkout compilation & endpoints during idle time (ensures instant sub-second order confirm)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const prewarm = async () => {
      try {
        fetch(apiUrl("/api/shipping/options"), { method: "GET" }).catch(() => {});
        fetch(apiUrl("/api/checkout/create-payment-intent"), { method: "OPTIONS" }).catch(() => {});
        fetch(apiUrl("/api/checkout/confirm-payment"), { method: "OPTIONS" }).catch(() => {});
        fetch(apiUrl("/api/checkout/create-order"), { method: "OPTIONS" }).catch(() => {});
      } catch {}
    };
    if ("requestIdleCallback" in window) {
      (window as any).requestIdleCallback(prewarm, { timeout: 1200 });
    } else {
      setTimeout(prewarm, 400);
    }
  }, []);

  // Active Postcode for logistics calculation
  const activePostcode = (shippingSameAsBilling ? billingPostcode : (shippingPostcode || billingPostcode)).trim().toUpperCase();

  // Dynamic UK Logistics State (Connected to MySQL postcode_zones and system_settings)
  interface DynamicLogisticsState {
    zoneCode: string;
    zoneName: string;
    isDeliverable: boolean;
    surchargePennies: number;
    leadTimeExtraDays: number;
    errorMessage: string | null;
  }

  const [logisticsData, setLogisticsData] = useState<DynamicLogisticsState>({
    zoneCode: "mainland_uk",
    zoneName: "UK Mainland Standard Delivery",
    isDeliverable: true,
    surchargePennies: 0,
    leadTimeExtraDays: 0,
    errorMessage: null,
  });

  // Dynamic delivery options with live tiers from backend (Initializes with guaranteed active tier)
  const [deliveryOptions, setDeliveryOptions] = useState<DeliveryTierOption[]>([
    DEFAULT_FALLBACK_DELIVERY,
  ]);

  // Load active delivery options immediately on mount from backend database
  useEffect(() => {
    let isCancelled = false;
    const loadInitialOptions = async () => {
      try {
        const res = await fetch(apiUrl("/api/shipping/options"));
        if (!res.ok) return;
        const data = await res.json();
        if (isCancelled) return;
        const rawList = Array.isArray(data?.deliveryOptions)
          ? data.deliveryOptions
          : Array.isArray(data?.options)
          ? data.options
          : [];
        // Strictly filter out any inactive delivery tiers
        const activeOnly: DeliveryTierOption[] = rawList.filter(
          (o: any) => o && o.isActive !== false && o.id
        );
        if (activeOnly.length > 0) {
          setDeliveryOptions(activeOnly);
          setSelectedDeliveryTier((prev) => {
            const exists = activeOnly.some((o: DeliveryTierOption) => o.id === prev);
            return exists ? prev : (activeOnly[0]?.id || DEFAULT_FALLBACK_DELIVERY.id);
          });
        }
      } catch (err) {
        console.error("Failed to load initial delivery options:", err);
      }
    };
    loadInitialOptions();
    return () => {
      isCancelled = true;
    };
  }, []);

  // Synchronize Delivery Rates & Zone Surcharges dynamically from MySQL postcode_zones & system_settings
  useEffect(() => {
    let isCancelled = false;
    const fetchShipping = async () => {
      if (!activePostcode || activePostcode.length < 2) {
        setLogisticsData({
          zoneCode: "mainland_uk",
          zoneName: "UK Mainland Standard Delivery",
          isDeliverable: true,
          surchargePennies: 0,
          leadTimeExtraDays: 0,
          errorMessage: null,
        });
        return;
      }
      try {
        const res = await fetch(apiUrl("/api/shipping/calculate"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            postcode: activePostcode,
            subtotalPennies: Number(subtotalPennies) || 0,
          }),
        });
        if (!res.ok) return;
        const data = await res.json();
        if (isCancelled) return;

        const deliverable = data.deliverable !== false && data.is_deliverable !== false;
        setLogisticsData({
          zoneCode: data.zone || "mainland_uk",
          zoneName: data.zoneName || "UK Delivery",
          isDeliverable: deliverable,
          surchargePennies: deliverable ? (Number(data.surchargePennies) || 0) : 0,
          leadTimeExtraDays: Number(data.leadTimeExtraDays) || 0,
          errorMessage: !deliverable
            ? (data.error || data.message || "Delivery to this destination is currently suspended.")
            : null,
        });

        const rawList = Array.isArray(data?.deliveryOptions)
          ? data.deliveryOptions
          : Array.isArray(data?.options)
          ? data.options
          : [];
        // Strictly filter out any inactive delivery tiers
        const activeOnly: DeliveryTierOption[] = rawList.filter(
          (o: any) => o && o.isActive !== false && o.id
        );
        if (activeOnly.length > 0) {
          setDeliveryOptions(activeOnly);
          setSelectedDeliveryTier((prev) => {
            const exists = activeOnly.some((o: DeliveryTierOption) => o.id === prev);
            return exists ? prev : (activeOnly[0]?.id || DEFAULT_FALLBACK_DELIVERY.id);
          });
        }
      } catch (err) {
        console.error("Failed to query live shipping calculate:", err);
      }
    };

    const timer = setTimeout(fetchShipping, 250);
    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [activePostcode, subtotalPennies]);

  const hasEnteredPostcode = !!activePostcode && activePostcode.length >= 2;
  const isOutsideDeliveryArea = hasEnteredPostcode && !logisticsData.isDeliverable;

  // Selected Delivery Option (Guaranteed never undefined)
  const currentDeliveryOption = useMemo<DeliveryTierOption>(() => {
    if (!deliveryOptions || deliveryOptions.length === 0) {
      return DEFAULT_FALLBACK_DELIVERY;
    }
    const match = deliveryOptions.find((d) => d && d.id === selectedDeliveryTier);
    return match || deliveryOptions[0] || DEFAULT_FALLBACK_DELIVERY;
  }, [deliveryOptions, selectedDeliveryTier]);

  // Dynamic Postcode regional surcharge calculation
  const postcodeSurchargePennies = isOutsideDeliveryArea ? 0 : (Number(logisticsData?.surchargePennies) || 0);
  const baseDeliveryPennies = isOutsideDeliveryArea ? 0 : (Number(currentDeliveryOption?.baseFeePennies) || 0);
  const totalShippingPennies = baseDeliveryPennies + postcodeSurchargePennies;
  // Promotional Voucher calculation
  const voucherDiscountPennies = appliedVoucher?.discountPennies || 0;
  const discountedGoodsPennies = Math.max(0, (Number(subtotalPennies) || 0) - voucherDiscountPennies);
  const effectiveGoodsVat = calculateNetAndVat(discountedGoodsPennies);

  const grandTotalPennies = discountedGoodsPennies + totalShippingPennies;
  const overallVatBreakdown = calculateNetAndVat(grandTotalPennies);

  const handleApplyVoucher = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanCode = voucherInput.trim().toUpperCase();
    if (!cleanCode) {
      setVoucherError("Please enter a voucher code.");
      return;
    }
    setIsApplyingVoucher(true);
    setVoucherError(null);
    try {
      const res = await fetch(apiUrl("/api/promotions/validate"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: cleanCode,
          subtotalPennies: Number(subtotalPennies) || 0,
          customerEmail: (accountEmail.trim() || billingEmail.trim() || loggedInCustomer?.email || undefined),
          items: items.map((it) => ({
            productId: it?.product?.id || it?.id,
            quantity: Math.max(1, Number(it?.quantity) || 1),
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.valid) {
        setVoucherError(data.error || "Invalid voucher code.");
        return;
      }
      const voucherPayload = {
        code: data.code,
        description: data.description,
        discountType: data.discountType,
        discountValue: data.discountValue,
        discountPennies: data.discountPennies,
        discountFormatted: data.discountFormatted,
      };
      setAppliedVoucher(voucherPayload);
      try {
        sessionStorage.setItem("san_applied_voucher", JSON.stringify(voucherPayload));
      } catch {}
      setVoucherInput("");
      setVoucherError(null);
    } catch {
      setVoucherError("Failed to validate voucher. Please check your connection.");
    } finally {
      setIsApplyingVoucher(false);
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setVoucherError(null);
    try {
      sessionStorage.removeItem("san_applied_voucher");
    } catch {}
  };

  // Quick helper to autofill demo customer details for dev & test
  const handleFillDemoDetails = () => {
    let activeEmail = "eleanor.vance@gmail.com";
    let activeFirst = "Lady Eleanor";
    let activeLast = "Vance";
    let activePhone = "+44 7700 900123";

    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("san_customer_user");
        if (stored) {
          const u = JSON.parse(stored);
          if (u.email) activeEmail = u.email;
          if (u.firstName) activeFirst = u.firstName;
          if (u.lastName) activeLast = u.lastName;
          if (u.phone) activePhone = u.phone;
        }
      } catch {}
    }

    setAccountFirstName(activeFirst);
    setAccountLastName(activeLast);
    setAccountUsername(activeFirst.toLowerCase().replace(/\s+/g, "_"));
    setAccountEmail(activeEmail);
    setAccountPhone(activePhone);
    setBillingFirstName(activeFirst);
    setBillingLastName(activeLast);
    setBillingCompany("Kensington Manor Ltd");
    setBillingAddress1("10 Downing Street");
    setBillingAddress2("Apartment 4B");
    setBillingCity("London");
    setBillingPostcode("SW1A 2AA");
    setBillingState("Greater London");
    setBillingCountry("United Kingdom");
    setBillingEmail(activeEmail);
    setBillingPhone(activePhone);
  };

  // Quick helper to autofill demo test card
  const handleFillTestCard = () => {
    const fullName = `${billingFirstName || accountFirstName || "Lady Eleanor"} ${billingLastName || accountLastName || "Vance"}`.trim();
    setCardholderName(fullName);
    setCardNumber("4242 4242 4242 4242");
    setCardExpiry("12/28");
    setCardCvc("123");
  };

  // Live UK Postcode Lookup via Backend API
  const handleAddressLookup = async (target: "billing" | "shipping" = "billing") => {
    const rawPostcode = target === "billing" ? billingPostcode : shippingPostcode;
    const clean = rawPostcode.toUpperCase().replace(/\s+/g, "");
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
        const foundAddresses = Array.isArray(data.addresses) ? data.addresses : [];

        if (target === "billing") {
          setBillingPostcode(data.postcode);
          if (data.city) setBillingCity(data.city);
          if (data.county) setBillingState(data.county);
          setBillingAddressOptions(foundAddresses);
          setSelectedBillingAddressIndex("");

          if (foundAddresses.length > 0) {
            setBillingAddress1(foundAddresses[0].line1);
            if (foundAddresses[0].line2) setBillingAddress2(foundAddresses[0].line2);
            setSelectedBillingAddressIndex("0");
          } else if (data.sampleAddress) {
            setBillingAddress1(data.sampleAddress);
          }
        } else {
          setShippingPostcode(data.postcode);
          if (data.city) setShippingCity(data.city);
          if (data.county) setShippingState(data.county);
          setShippingAddressOptions(foundAddresses);
          setSelectedShippingAddressIndex("");

          if (foundAddresses.length > 0) {
            setShippingAddress1(foundAddresses[0].line1);
            if (foundAddresses[0].line2) setShippingAddress2(foundAddresses[0].line2);
            setSelectedShippingAddressIndex("0");
          } else if (data.sampleAddress) {
            setShippingAddress1(data.sampleAddress);
          }
        }

        if (data.deliverable === false) {
          setLookupMessage({
            text: data.message || "Delivery to this address is currently unavailable. Please provide a valid UK Mainland delivery address.",
            isError: true,
          });
        } else {
          setLookupMessage({
            text: `Verified UK Address: ${data.city} (${data.zoneName}). ${data.surchargePennies > 0 ? `Regional surcharge: ${formatGBP(data.surchargePennies)}.` : "Eligible for Free Standard Delivery."} Transit: ${data.estimatedDays}`,
            isError: false,
          });
        }
      } else {
        setLookupMessage({
          text: data.error || "Postcode not recognized. Please check or enter address manually.",
          isError: true,
        });
      }
    } catch {
      setLookupMessage({
        text: `Address recorded for UK postcode ${clean}.`,
        isError: false,
      });
    } finally {
      setIsLookingUpPostcode(false);
    }
  };

  // Professional 1-Step Checkout: Seamless Card Payment & Order Confirmation
  const handlePlaceOrderAndPay = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    // Validate Account fields
    const effAccountFirstName = accountFirstName.trim() || billingFirstName.trim();
    const effAccountLastName = accountLastName.trim() || billingLastName.trim();
    const effEmail = accountEmail.trim() || billingEmail.trim();
    const effPhone = accountPhone.trim() || billingPhone.trim();

    if (!effAccountFirstName || !effAccountLastName || !effEmail || !effPhone) {
      setSubmitError("Please fill in your Account / Contact details (First Name, Last Name, Email, and UK Phone Number).");
      return;
    }

    // Validate Password if account creation is requested (guest customers only)
    if (!loggedInCustomer && createAccount && (!accountPassword || accountPassword.length < 6)) {
      setSubmitError("Password must be at least 6 characters long to create your customer account.");
      return;
    }

    // Validate Billing Address fields
    if (!billingAddress1.trim() || !billingCity.trim() || !billingPostcode.trim()) {
      setSubmitError("Please fill in all required Billing Address fields (Address Line 1, Town/City, and UK Postcode).");
      return;
    }

    // Validate Shipping Address fields if separate
    if (!shippingSameAsBilling) {
      if (!shippingAddress1.trim() || !shippingCity.trim() || !shippingPostcode.trim()) {
        setSubmitError("Please fill in all required Shipping Address fields (Address Line 1, Town/City, and UK Postcode).");
        return;
      }
    }

    // Validate delivery availability
    if (isOutsideDeliveryArea) {
      setSubmitError(logisticsData.errorMessage || "Delivery to your entered destination is currently suspended. Please provide a valid UK Mainland delivery address to proceed.");
      return;
    }

    // Validate card fields if card selected
    if (paymentMethod === "card") {
      if (paymentMode === "saved") {
        if (!selectedSavedCardId) {
          setSubmitError("Please select a saved card to complete your order.");
          return;
        }
        if (!savedCardCvc.trim() || savedCardCvc.trim().length < 3) {
          setSubmitError("Please enter your card's security CVC / CVV code (3 or 4 digits).");
          return;
        }
      } else {
        const cleanCard = cardNumber.replace(/\s+/g, "");
        if (!cleanCard || cleanCard.length < 13) {
          setSubmitError("Please enter a valid credit or debit card number.");
          return;
        }
        if (!cardExpiry.trim() || cardExpiry.length < 4) {
          setSubmitError("Please enter a valid card expiry date (MM/YY).");
          return;
        }
        if (!cardCvc.trim() || cardCvc.length < 3) {
          setSubmitError("Please enter your card's security CVC / CVV code.");
          return;
        }
      }
    }

    setIsProcessingPayment(true);
    setIsSubmittingOrder(true);
    setCheckoutStepState("authorizing");

    try {
      // 1. Initiate Payment Intent with backend
      const intentRes = await fetch(apiUrl("/api/checkout/create-payment-intent"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountPennies: grandTotalPennies,
          voucherCode: appliedVoucher?.code || undefined,
          customer: {
            id: loggedInCustomer?.id || undefined,
            name: `${effAccountFirstName} ${effAccountLastName}`.trim(),
            firstName: effAccountFirstName,
            lastName: effAccountLastName,
            username: accountUsername.trim() || undefined,
            email: effEmail,
            phone: effPhone,
            postcode: activePostcode,
          },
          shippingAddress: {
            firstName: shippingSameAsBilling ? effAccountFirstName : (shippingFirstName.trim() || effAccountFirstName),
            lastName: shippingSameAsBilling ? effAccountLastName : (shippingLastName.trim() || effAccountLastName),
            company: shippingSameAsBilling ? billingCompany.trim() : shippingCompany.trim(),
            addressLine1: shippingSameAsBilling ? billingAddress1.trim() : shippingAddress1.trim(),
            addressLine2: shippingSameAsBilling ? billingAddress2.trim() : shippingAddress2.trim(),
            city: shippingSameAsBilling ? billingCity.trim() : shippingCity.trim(),
            state: shippingSameAsBilling ? billingState.trim() : shippingState.trim(),
            postcode: activePostcode,
            country: shippingSameAsBilling ? billingCountry : shippingCountry,
          },
          billingAddress: {
            firstName: billingFirstName.trim() || effAccountFirstName,
            lastName: billingLastName.trim() || effAccountLastName,
            company: billingCompany.trim(),
            addressLine1: billingAddress1.trim(),
            addressLine2: billingAddress2.trim(),
            city: billingCity.trim(),
            state: billingState.trim(),
            postcode: billingPostcode.trim().toUpperCase(),
            country: billingCountry || "United Kingdom",
            email: billingEmail.trim() || effEmail,
            phone: billingPhone.trim() || effPhone,
          },
          paymentMethod,
          deliveryTier: selectedDeliveryTier,
          items: items.map((it) => ({
            productId: it?.product?.id || it?.id || "unknown_item",
            quantity: Math.max(1, Number(it?.quantity) || 1),
            pricePennies: Number(it?.product?.pricePennies) || 0,
            title: it?.product?.title || "Handcrafted Furniture Item",
          })),
        }),
      });

      const intentData = await intentRes.json();
      if (!intentRes.ok || !intentData.success) {
        throw new Error(intentData.error || "Failed to initiate payment gateway intent.");
      }

      // Active card details resolution (saved card 1-click vs new card entry)
      const activeSavedCard = savedCards.find((c) => c.id === selectedSavedCardId);
      const activeCardDetails = paymentMode === "saved" && activeSavedCard
        ? {
            cardNumber: `•••• •••• •••• ${activeSavedCard.last4}`,
            cardholderName: activeSavedCard.cardholder_name || `${effAccountFirstName} ${effAccountLastName}`.trim(),
            cardExpiry: `${String(activeSavedCard.exp_month).padStart(2, "0")}/${String(activeSavedCard.exp_year).slice(-2)}`,
            cardCvc: savedCardCvc.trim(),
            isSavedCard: true,
            savedCardId: activeSavedCard.id,
            brand: activeSavedCard.brand,
            last4: activeSavedCard.last4,
            saveCardForFuture: false,
          }
        : {
            cardNumber: cardNumber.replace(/\s+/g, ""),
            cardholderName: cardholderName.trim() || `${effAccountFirstName} ${effAccountLastName}`.trim(),
            cardExpiry: cardExpiry.trim(),
            cardCvc: cardCvc.trim(),
            isSavedCard: false,
            saveCardForFuture: Boolean(saveCardForFuture),
          };

      // 2. Authorize & Confirm payment via Gateway directly (seamless, zero disruptive popups)
      const confirmRes = await fetch(apiUrl("/api/checkout/confirm-payment"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentIntentId: intentData.paymentIntentId,
          paymentMethod,
          saveCardForFuture: activeCardDetails.saveCardForFuture,
          paymentDetails: activeCardDetails,
          amountPennies: grandTotalPennies,
        }),
      });

      const confirmData = await confirmRes.json();
      if (!confirmRes.ok || !confirmData.success || confirmData.status !== "succeeded") {
        throw new Error(confirmData.error || "Payment authorization failed with issuer. Please verify and try again.");
      }

      setCheckoutStepState("securing");

      // 3. Persist Order to Database & Dispatch B2B Purchase Order
      const resolvedShipping = shippingSameAsBilling
        ? {
            firstName: billingFirstName || effAccountFirstName,
            lastName: billingLastName || effAccountLastName,
            company: billingCompany.trim(),
            addressLine1: billingAddress1.trim(),
            addressLine2: billingAddress2.trim(),
            city: billingCity.trim(),
            state: billingState.trim(),
            postcode: billingPostcode.trim().toUpperCase(),
            country: billingCountry || "United Kingdom",
          }
        : {
            firstName: shippingFirstName.trim() || billingFirstName || effAccountFirstName,
            lastName: shippingLastName.trim() || billingLastName || effAccountLastName,
            company: shippingCompany.trim(),
            addressLine1: shippingAddress1.trim(),
            addressLine2: shippingAddress2.trim(),
            city: shippingCity.trim(),
            state: shippingState.trim(),
            postcode: shippingPostcode.trim().toUpperCase(),
            country: shippingCountry || "United Kingdom",
          };

      const resolvedBilling = {
        firstName: billingFirstName.trim() || effAccountFirstName,
        lastName: billingLastName.trim() || effAccountLastName,
        company: billingCompany.trim(),
        addressLine1: billingAddress1.trim(),
        addressLine2: billingAddress2.trim(),
        city: billingCity.trim(),
        state: billingState.trim(),
        postcode: billingPostcode.trim().toUpperCase(),
        country: billingCountry || "United Kingdom",
        email: billingEmail.trim() || effEmail,
        phone: billingPhone.trim() || effPhone,
      };

      const orderPayload = {
        voucherCode: appliedVoucher?.code || undefined,
        discountPennies: voucherDiscountPennies,
        customer: {
          id: loggedInCustomer?.id || undefined,
          name: `${effAccountFirstName} ${effAccountLastName}`.trim(),
          firstName: effAccountFirstName,
          lastName: effAccountLastName,
          username: accountUsername.trim() || undefined,
          email: effEmail,
          phone: effPhone,
        },
        shippingAddress: resolvedShipping,
        billingAddress: resolvedBilling,
        createAccount: !loggedInCustomer && createAccount,
        accountPassword: (!loggedInCustomer && createAccount) ? accountPassword : undefined,
        deliveryOption: {
          tier: currentDeliveryOption?.id || "del_opt_001",
          name: currentDeliveryOption?.name || "Free UK Mainland Delivery",
          feePennies: totalShippingPennies,
          estimatedDays: currentDeliveryOption?.timeframe || "3 - 7 business days",
        },
        deliveryTier: currentDeliveryOption?.id || "del_opt_001",
        items: items.map((it) => ({
          productId: it?.product?.id || it?.id || "unknown_item",
          sku: it?.product?.gtinBarcode || it?.product?.id || "SAN-UK",
          title: it?.product?.title || "Handcrafted Furniture Item",
          finish: it?.selectedFinish || it?.selectedFabric || it?.product?.specs?.color || "Standard Finish",
          pricePennies: Number(it?.product?.pricePennies) || 0,
          quantity: Math.max(1, Number(it?.quantity) || 1),
          thumbnailUrl: it?.product?.thumbnailUrl || "/images/placeholder.svg",
        })),
        paymentMethod,
        saveCardForFuture: activeCardDetails.saveCardForFuture,
        paymentDetails: activeCardDetails,
        paymentConfirmation: {
          paymentIntentId: confirmData.paymentIntentId,
          transactionId: confirmData.transactionId,
          status: "succeeded",
          paymentMethod,
          saveCardForFuture: activeCardDetails.saveCardForFuture,
          paymentDetails: activeCardDetails,
        },
      };

      const orderRes = await fetch(apiUrl("/api/checkout/create-order"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok || !orderData.success) {
        const errorMsg = orderData.details && orderData.details !== orderData.error
          ? `${orderData.error || "Order placement failed"} (${orderData.details})`
          : (orderData.error || orderData.details || "Failed to persist verified order in database.");
        throw new Error(errorMsg);
      }

      // 4. Smooth Transition to Order Confirmation
      setConfirmedOrder({
        orderId: orderData.orderId,
        orderNumber: orderData.orderNumber,
        poNumber: orderData.poNumber,
        invoiceNumber: orderData.invoiceNumber,
        trackingNumber: orderData.trackingNumber,
        carrier: orderData.carrier && !orderData.carrier.includes("Amos Mann") ? orderData.carrier : "SAN Dedicated Delivery Fleet",
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

      // Clear basket from client state and scroll to top
      setCheckoutStepState("confirmed");
      clearCart();
      try {
        sessionStorage.removeItem("san_applied_voucher");
      } catch {}
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error processing payment authorization.";
      setSubmitError(msg);
      // Smooth scroll to payment section so customer immediately sees the decline reason
      setTimeout(() => {
        const paymentSection = document.getElementById("section-payment-method");
        if (paymentSection) {
          paymentSection.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 50);
    } finally {
      setIsProcessingPayment(false);
      setIsSubmittingOrder(false);
      setCheckoutStepState("idle");
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
                  <h2 className="text-xl font-bold text-navy-950 font-display">SAN Furniture</h2>
                  <p className="text-[11px] text-navy-700">Online UK Furniture Retailer • Mainland Delivery</p>
                  <p className="text-[10px] text-navy-600">Customer Support: support@sanfurniture.com</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-navy-950 block">OFFICIAL ORDER RECEIPT</span>
                  <span className="text-[11px] font-mono text-navy-800">Order: {confirmedOrder.orderNumber}</span>
                  <span className="text-[10px] text-navy-600 block">Date: {new Date().toLocaleDateString("en-GB")}</span>
                </div>
              </div>
            </div>

            {/* Animated Celebration & Confetti Blast */}
            <div className="print:hidden">
              <OrderCelebration orderNumber={confirmedOrder.orderNumber} customerName={confirmedOrder.customerName} />
            </div>

            <div className="hidden print:block w-16 h-16 rounded-full bg-forest-100 border border-forest-300 text-forest-700 items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-forest-100 text-forest-900 border border-forest-300 mb-3 shadow-2xs">
                <Check className="w-4 h-4 text-forest-700" />
                Payment Authorized • Order Confirmed
              </span>
              <h1 className="font-display text-3xl sm:text-4xl font-bold text-navy-950 print:text-2xl mt-1">
                Thank You for Your Order
              </h1>
              
              <div className="mt-3 flex items-center justify-center gap-2">
                <span className="text-sm text-navy-600">Order reference:</span>
                <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-sand-200/80 border border-sand-300 text-navy-950 font-mono font-bold text-sm">
                  {confirmedOrder.orderNumber}
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof navigator !== "undefined" && navigator.clipboard) {
                        navigator.clipboard.writeText(confirmedOrder.orderNumber);
                        setCopiedOrderNumber(true);
                        setTimeout(() => setCopiedOrderNumber(false), 2000);
                      }
                    }}
                    className="p-1 hover:text-brass-700 text-navy-500 transition-colors"
                    title="Copy Order Number"
                    aria-label="Copy Order Number"
                  >
                    {copiedOrderNumber ? (
                      <Check className="w-3.5 h-3.5 text-forest-600 animate-in zoom-in" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </span>
              </div>

              <p className="text-xs text-navy-500 mt-2">
                A confirmation email and digital order receipt have been prepared for <strong className="text-navy-900">{confirmedOrder.customerEmail}</strong>.
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

            {/* Logistics Real-time Dispatch Badge */}
            <div className="p-4 rounded-xl bg-sand-200/50 border border-sand-300 text-left space-y-3 print:bg-white print:border-sand-300">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sand-300/70 pb-2.5 print:border-sand-300">
                <div className="flex items-center gap-2 text-xs font-bold text-navy-950">
                  <Building2 className="w-4 h-4 text-brass-600" />
                  <span>Order Processing Reference: <span className="font-mono text-brass-700">{confirmedOrder.orderNumber}</span></span>
                </div>
                <span className="text-[11px] font-semibold text-forest-700 bg-forest-100/70 px-2 py-0.5 rounded border border-forest-200 print:bg-sand-100">
                  Hub Status: Dispatched
                </span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-navy-800">
                <div>
                  <span className="text-navy-500 block text-[11px]">Fulfilment Centre:</span>
                  <span className="font-semibold text-navy-950">SAN Central Distribution Centre</span>
                </div>
                <div>
                  <span className="text-navy-500 block text-[11px]">Carrier / Delivery Fleet:</span>
                  <span className="font-semibold text-navy-950">{confirmedOrder.carrier && !confirmedOrder.carrier.includes("Amos Mann") ? confirmedOrder.carrier : "SAN Dedicated Delivery Fleet"}</span>
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
                <span>Download Statutory VAT Invoice</span>
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
              Need assistance with your delivery booking? Our customer support team is available at{" "}
              <a href="tel:+442079460192" className="text-brass-700 font-semibold underline">
                +44 20 7946 0192
              </a>{" "}
              or{" "}
              <a href="mailto:support@sanfurniture.com" className="text-brass-700 font-semibold underline">
                support@sanfurniture.com
              </a>.
            </div>

          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // 1.5. INITIAL HYDRATION VIEW
  // ==========================================
  if (!hasMounted) {
    return (
      <div className="bg-sand-50 min-h-screen py-24 text-center px-4 flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-2 border-brass-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs text-navy-600 font-medium">Preparing secure checkout session...</p>
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
        {headerBadge.isEnabled && (
          <div className="mb-8 p-4 rounded-xl bg-forest-50/70 border border-forest-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-forest-700 shrink-0" />
              <span className="font-bold text-forest-950">{headerBadge.content.badge_text}:</span>
              <span className="text-navy-700">{headerBadge.content.guarantee_text}</span>
            </div>
            <span className="text-[11px] font-mono text-navy-600 bg-white px-2.5 py-1 rounded-md border border-sand-300 shadow-2xs shrink-0">
              {headerBadge.content.ssl_note}
            </span>
          </div>
        )}
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
            <form onSubmit={handlePlaceOrderAndPay} className="space-y-6">
              
              {/* Step 1: Account Information */}
              <div className="p-6 rounded-xl bg-sand-100/40 border border-sand-300 space-y-4">
                <div className="flex items-center justify-between border-b border-sand-200 pb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-brass-600" />
                    <h2 className="font-display text-lg font-bold text-navy-950">
                      1. Account Information
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    {process.env.NODE_ENV === "development" && (
                      <button
                        type="button"
                        onClick={handleFillDemoDetails}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-brass-50 hover:bg-brass-100 text-brass-900 border border-brass-300 text-[11px] font-semibold transition-colors"
                        title="Quick fill test details (dev only)"
                      >
                        <Sparkles className="w-3 h-3 text-brass-600" />
                        <span>Dev Autofill</span>
                      </button>
                    )}
                    <span className="text-[11px] font-semibold text-forest-700 bg-forest-50 px-2 py-0.5 rounded border border-forest-200">
                      Contact & Authentication
                    </span>
                  </div>
                </div>

                {loggedInCustomer && (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-forest-50 border border-forest-200 text-forest-900 text-xs font-medium">
                    <CheckCircle2 className="w-4 h-4 text-forest-600 shrink-0" />
                    <span>Logged in as <strong>{loggedInCustomer.email}</strong>. Orders and authorized payment cards are automatically linked to your customer profile.</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-navy-900 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={accountFirstName}
                      onChange={(e) => setAccountFirstName(e.target.value)}
                      placeholder="e.g. Eleanor"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-sand-300 bg-sand-50 text-navy-950 focus:ring-2 focus:ring-brass-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-navy-900 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={accountLastName}
                      onChange={(e) => setAccountLastName(e.target.value)}
                      placeholder="e.g. Smith"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-sand-300 bg-sand-50 text-navy-950 focus:ring-2 focus:ring-brass-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-navy-900 mb-1">
                      Username (Optional)
                    </label>
                    <input
                      type="text"
                      value={accountUsername}
                      onChange={(e) => setAccountUsername(e.target.value)}
                      placeholder="e.g. eleanor_vance"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-sand-300 bg-sand-50 text-navy-950 focus:ring-2 focus:ring-brass-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-navy-900 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={accountEmail}
                      onChange={(e) => setAccountEmail(e.target.value)}
                      placeholder="eleanor@example.co.uk"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-sand-300 bg-sand-50 text-navy-950 focus:ring-2 focus:ring-brass-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-navy-900 mb-1">
                    Telephone / Mobile *
                  </label>
                  <input
                    type="tel"
                    required
                    value={accountPhone}
                    onChange={(e) => setAccountPhone(e.target.value)}
                    placeholder="+44 7700 900123"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-sand-300 bg-sand-50 text-navy-950 focus:ring-2 focus:ring-brass-500 outline-none"
                  />
                  <p className="text-[10px] text-navy-500 mt-1">
                    The white glove courier team will send SMS dispatch updates and call to book your 2-hour delivery slot.
                  </p>
                </div>

                {/* Account Creation Option (Shown ONLY for guest customers who are NOT logged in) */}
                {loggedInCustomer ? (
                  <div className="pt-2.5 border-t border-sand-200 flex items-center justify-between text-xs text-navy-700">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-forest-600 animate-pulse"></div>
                      <span className="font-medium">
                        Customer Account Active: <strong className="text-navy-950">{loggedInCustomer.email}</strong>
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-forest-700 bg-forest-50 px-2 py-0.5 rounded border border-forest-200">
                      <CheckCircle2 className="w-3 h-3 text-forest-600" />
                      Profile Linked
                    </span>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-sand-200">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={createAccount}
                        onChange={(e) => setCreateAccount(e.target.checked)}
                        className="w-4 h-4 rounded text-navy-950 focus:ring-brass-500 border-sand-300"
                      />
                      <span className="text-xs font-semibold text-navy-900">
                        Create a customer account for instant order tracking &amp; faster reordering
                      </span>
                    </label>

                    {createAccount && (
                      <div className="mt-3 p-3 bg-sand-200/40 rounded-lg border border-sand-300 animate-fade-in">
                        <label className="block text-xs font-semibold text-navy-900 mb-1">
                          Create Account Password *
                        </label>
                        <input
                          type="password"
                          required={createAccount}
                          value={accountPassword}
                          onChange={(e) => setAccountPassword(e.target.value)}
                          placeholder="Choose a secure password (min 6 characters)"
                          className="w-full px-3 py-2 text-xs rounded-lg border border-sand-300 bg-white text-navy-950 focus:ring-2 focus:ring-brass-500 outline-none"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Step 2: Billing Address (can copy from Account) */}
              <div className="p-6 rounded-xl bg-sand-100/40 border border-sand-300 space-y-4">
                <div className="flex items-center justify-between border-b border-sand-200 pb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Building className="w-5 h-5 text-brass-600" />
                    <div>
                      <h2 className="font-display text-lg font-bold text-navy-950">
                        2. Billing Address
                      </h2>
                      <span className="text-[11px] text-navy-500">
                        Must match your card / bank statement
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyAccountToBilling}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sand-200 hover:bg-brass-100 text-navy-900 hover:text-navy-950 border border-sand-300 text-xs font-semibold transition-colors shadow-2xs"
                    title="Copy First Name, Last Name, Email, and Phone from Account"
                  >
                    <Copy className="w-3.5 h-3.5 text-brass-600" />
                    <span>Copy from Account</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-navy-900 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={billingFirstName}
                      onChange={(e) => setBillingFirstName(e.target.value)}
                      placeholder="e.g. Lady Eleanor"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-sand-300 bg-sand-50 text-navy-950 focus:ring-2 focus:ring-brass-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-navy-900 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={billingLastName}
                      onChange={(e) => setBillingLastName(e.target.value)}
                      placeholder="e.g. Smith"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-sand-300 bg-sand-50 text-navy-950 focus:ring-2 focus:ring-brass-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-navy-900 mb-1">
                    Company Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={billingCompany}
                    onChange={(e) => setBillingCompany(e.target.value)}
                    placeholder="e.g. Kensington Design Ltd (Optional)"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-sand-300 bg-sand-50 text-navy-950 focus:ring-2 focus:ring-brass-500 outline-none"
                  />
                </div>

                {/* UK Billing Postcode & Lookup */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                  <div className="sm:col-span-2">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-navy-900">
                        Postcode *
                      </label>
                      <span className="text-[10px] text-navy-500">e.g. SW1A 1AA, M1 1AE, LE5 5FN, CV7 9EU</span>
                    </div>
                    <input
                      type="text"
                      required
                      value={billingPostcode}
                      onChange={(e) => {
                        setBillingPostcode(e.target.value.toUpperCase());
                        setLookupMessage(null);
                        setBillingAddressOptions([]);
                      }}
                      placeholder="Enter UK Postcode"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-sand-300 bg-sand-50 text-navy-950 focus:ring-2 focus:ring-brass-500 outline-none font-mono uppercase"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddressLookup("billing")}
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

                {/* Billing Address Dropdown Selector */}
                {billingAddressOptions.length > 0 && (
                  <div className="p-3.5 bg-sand-100 rounded-xl border border-sand-300 shadow-xs space-y-2 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-navy-950 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-brass-600" />
                        <span>Select Address ({billingAddressOptions.length} premises found):</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setBillingAddressOptions([])}
                        className="text-[11px] font-medium text-brass-700 hover:text-navy-950 hover:underline"
                      >
                        Enter manually
                      </button>
                    </div>
                    <select
                      value={selectedBillingAddressIndex}
                      onChange={(e) => {
                        const idx = e.target.value;
                        setSelectedBillingAddressIndex(idx);
                        if (idx !== "" && billingAddressOptions[Number(idx)]) {
                          const picked = billingAddressOptions[Number(idx)];
                          setBillingAddress1(picked.line1);
                          if (picked.line2) setBillingAddress2(picked.line2);
                          if (picked.city) setBillingCity(picked.city);
                          if (picked.county) setBillingState(picked.county);
                        }
                      }}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-sand-300 bg-sand-50 text-navy-950 font-medium focus:ring-2 focus:ring-brass-500 outline-none cursor-pointer"
                    >
                      <option value="">-- Please select your address --</option>
                      {billingAddressOptions.map((addr, idx) => (
                        <option key={addr.id || idx} value={idx}>
                          {addr.formatted}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-navy-900">
                      Address Line 1 *
                    </label>
                    {billingAddressOptions.length > 0 && (
                      <span className="text-[10px] text-emerald-800 font-medium">
                        ✓ Select from dropdown above or edit / type below
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    list="billing-address-options-list"
                    value={billingAddress1}
                    onChange={(e) => {
                      setBillingAddress1(e.target.value);
                      const match = billingAddressOptions.find(
                        (a) => a.line1.toLowerCase() === e.target.value.toLowerCase()
                      );
                      if (match) {
                        if (match.line2) setBillingAddress2(match.line2);
                        if (match.city) setBillingCity(match.city);
                        if (match.county) setBillingState(match.county);
                      }
                    }}
                    placeholder="House name / number and street"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-sand-300 bg-sand-50 text-navy-950 focus:ring-2 focus:ring-brass-500 outline-none"
                  />
                  {billingAddressOptions.length > 0 && (
                    <datalist id="billing-address-options-list">
                      {billingAddressOptions.map((a, idx) => (
                        <option key={idx} value={a.line1}>
                          {a.formatted}
                        </option>
                      ))}
                    </datalist>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-navy-900 mb-1">
                      Address Line 2 (Optional)
                    </label>
                    <input
                      type="text"
                      value={billingAddress2}
                      onChange={(e) => setBillingAddress2(e.target.value)}
                      placeholder="Apartment, suite, unit (Optional)"
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
                      value={billingCity}
                      onChange={(e) => setBillingCity(e.target.value)}
                      placeholder="e.g. London"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-sand-300 bg-sand-50 text-navy-950 focus:ring-2 focus:ring-brass-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-navy-900 mb-1">
                      County (Optional)
                    </label>
                    <input
                      type="text"
                      value={billingState}
                      onChange={(e) => setBillingState(e.target.value)}
                      placeholder="e.g. Greater London / Leicestershire"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-sand-300 bg-sand-50 text-navy-950 focus:ring-2 focus:ring-brass-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-navy-900 mb-1">
                      Country *
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={billingCountry}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-sand-300 bg-sand-200/50 text-navy-950 font-medium cursor-not-allowed outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-navy-900 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={billingEmail}
                      onChange={(e) => setBillingEmail(e.target.value)}
                      placeholder="billing@example.co.uk"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-sand-300 bg-sand-50 text-navy-950 focus:ring-2 focus:ring-brass-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-navy-900 mb-1">
                      Telephone / Mobile *
                    </label>
                    <input
                      type="tel"
                      required
                      value={billingPhone}
                      onChange={(e) => setBillingPhone(e.target.value)}
                      placeholder="+44 7700 900123"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-sand-300 bg-sand-50 text-navy-950 focus:ring-2 focus:ring-brass-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Step 3: Shipping Address (can copy from Billing) */}
              <div className="p-6 rounded-xl bg-sand-100/40 border border-sand-300 space-y-4">
                <div className="flex items-center justify-between border-b border-sand-200 pb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-brass-600" />
                    <div>
                      <h2 className="font-display text-lg font-bold text-navy-950">
                        3. Shipping / Delivery Address
                      </h2>
                      <span className="text-[11px] text-navy-500">
                        Room of Choice White Glove Delivery
                      </span>
                    </div>
                  </div>
                  {!shippingSameAsBilling && (
                    <button
                      type="button"
                      onClick={handleCopyBillingToShipping}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sand-200 hover:bg-brass-100 text-navy-900 hover:text-navy-950 border border-sand-300 text-xs font-semibold transition-colors shadow-2xs"
                      title="Copy all billing address fields to shipping address"
                    >
                      <Copy className="w-3.5 h-3.5 text-brass-600" />
                      <span>Copy from Billing</span>
                    </button>
                  )}
                </div>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shippingSameAsBilling}
                    onChange={(e) => setShippingSameAsBilling(e.target.checked)}
                    className="w-4 h-4 rounded text-navy-950 focus:ring-brass-500 border-sand-300"
                  />
                  <span className="text-xs font-semibold text-navy-900">
                    Shipping address is the same as billing address
                  </span>
                </label>

                {!shippingSameAsBilling && (
                  <div className="pt-4 border-t border-sand-200 space-y-4 animate-fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-navy-900 mb-1">
                          First Name *
                        </label>
                        <input
                          type="text"
                          required={!shippingSameAsBilling}
                          value={shippingFirstName}
                          onChange={(e) => setShippingFirstName(e.target.value)}
                          placeholder="e.g. Lady Eleanor"
                          className="w-full px-3 py-2 text-xs rounded-lg border border-sand-300 bg-sand-50 text-navy-950 focus:ring-2 focus:ring-brass-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-navy-900 mb-1">
                          Last Name *
                        </label>
                        <input
                          type="text"
                          required={!shippingSameAsBilling}
                          value={shippingLastName}
                          onChange={(e) => setShippingLastName(e.target.value)}
                          placeholder="e.g. Smith"
                          className="w-full px-3 py-2 text-xs rounded-lg border border-sand-300 bg-sand-50 text-navy-950 focus:ring-2 focus:ring-brass-500 outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-navy-900 mb-1">
                        Company / Attention (Optional)
                      </label>
                      <input
                        type="text"
                        value={shippingCompany}
                        onChange={(e) => setShippingCompany(e.target.value)}
                        placeholder="e.g. Care of Reception / Site Manager (Optional)"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-sand-300 bg-sand-50 text-navy-950 focus:ring-2 focus:ring-brass-500 outline-none"
                      />
                    </div>

                    {/* UK Shipping Postcode & Lookup */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                      <div className="sm:col-span-2">
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-semibold text-navy-900">
                            Postcode *
                          </label>
                          <span className="text-[10px] text-navy-500">e.g. SW1A 1AA, M1 1AE, LE5 5FN, CV7 9EU</span>
                        </div>
                        <input
                          type="text"
                          required={!shippingSameAsBilling}
                          value={shippingPostcode}
                          onChange={(e) => {
                            setShippingPostcode(e.target.value.toUpperCase());
                            setLookupMessage(null);
                            setShippingAddressOptions([]);
                          }}
                          placeholder="Enter UK Delivery Postcode"
                          className="w-full px-3 py-2 text-xs rounded-lg border border-sand-300 bg-sand-50 text-navy-950 focus:ring-2 focus:ring-brass-500 outline-none font-mono uppercase"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddressLookup("shipping")}
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

                    {/* Shipping Address Dropdown Selector */}
                    {shippingAddressOptions.length > 0 && (
                      <div className="p-3.5 bg-sand-100 rounded-xl border border-sand-300 shadow-xs space-y-2 animate-in fade-in duration-200">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-navy-950 flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-brass-600" />
                            <span>Select Delivery Address ({shippingAddressOptions.length} premises found):</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => setShippingAddressOptions([])}
                            className="text-[11px] font-medium text-brass-700 hover:text-navy-950 hover:underline"
                          >
                            Enter manually
                          </button>
                        </div>
                        <select
                          value={selectedShippingAddressIndex}
                          onChange={(e) => {
                            const idx = e.target.value;
                            setSelectedShippingAddressIndex(idx);
                            if (idx !== "" && shippingAddressOptions[Number(idx)]) {
                              const picked = shippingAddressOptions[Number(idx)];
                              setShippingAddress1(picked.line1);
                              if (picked.line2) setShippingAddress2(picked.line2);
                              if (picked.city) setShippingCity(picked.city);
                              if (picked.county) setShippingState(picked.county);
                            }
                          }}
                          className="w-full px-3 py-2 text-xs rounded-lg border border-sand-300 bg-sand-50 text-navy-950 font-medium focus:ring-2 focus:ring-brass-500 outline-none cursor-pointer"
                        >
                          <option value="">-- Please select your delivery address --</option>
                          {shippingAddressOptions.map((addr, idx) => (
                            <option key={addr.id || idx} value={idx}>
                              {addr.formatted}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-navy-900">
                          Address Line 1 *
                        </label>
                        {shippingAddressOptions.length > 0 && (
                          <span className="text-[10px] text-emerald-800 font-medium">
                            ✓ Select from dropdown above or edit / type below
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        required={!shippingSameAsBilling}
                        list="shipping-address-options-list"
                        value={shippingAddress1}
                        onChange={(e) => {
                          setShippingAddress1(e.target.value);
                          const match = shippingAddressOptions.find(
                            (a) => a.line1.toLowerCase() === e.target.value.toLowerCase()
                          );
                          if (match) {
                            if (match.line2) setShippingAddress2(match.line2);
                            if (match.city) setShippingCity(match.city);
                            if (match.county) setShippingState(match.county);
                          }
                        }}
                        placeholder="House name / number and street"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-sand-300 bg-sand-50 text-navy-950 focus:ring-2 focus:ring-brass-500 outline-none"
                      />
                      {shippingAddressOptions.length > 0 && (
                        <datalist id="shipping-address-options-list">
                          {shippingAddressOptions.map((a, idx) => (
                            <option key={idx} value={a.line1}>
                              {a.formatted}
                            </option>
                          ))}
                        </datalist>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-navy-900 mb-1">
                          Address Line 2 (Optional)
                        </label>
                        <input
                          type="text"
                          value={shippingAddress2}
                          onChange={(e) => setShippingAddress2(e.target.value)}
                          placeholder="Apartment, suite, unit (Optional)"
                          className="w-full px-3 py-2 text-xs rounded-lg border border-sand-300 bg-sand-50 text-navy-950 focus:ring-2 focus:ring-brass-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-navy-900 mb-1">
                          Town / City *
                        </label>
                        <input
                          type="text"
                          required={!shippingSameAsBilling}
                          value={shippingCity}
                          onChange={(e) => setShippingCity(e.target.value)}
                          placeholder="e.g. London"
                          className="w-full px-3 py-2 text-xs rounded-lg border border-sand-300 bg-sand-50 text-navy-950 focus:ring-2 focus:ring-brass-500 outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-navy-900 mb-1">
                          County (Optional)
                        </label>
                        <input
                          type="text"
                          value={shippingState}
                          onChange={(e) => setShippingState(e.target.value)}
                          placeholder="e.g. Greater London"
                          className="w-full px-3 py-2 text-xs rounded-lg border border-sand-300 bg-sand-50 text-navy-950 focus:ring-2 focus:ring-brass-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-navy-900 mb-1">
                          Country *
                        </label>
                        <input
                          type="text"
                          readOnly
                          value={shippingCountry}
                          className="w-full px-3 py-2 text-xs rounded-lg border border-sand-300 bg-sand-200/50 text-navy-950 font-medium cursor-not-allowed outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {lookupMessage && (
                  <div className={`p-2.5 rounded-lg text-xs font-medium ${
                    lookupMessage.isError
                      ? "bg-rose-50 border border-rose-200 text-rose-700"
                      : "bg-forest-50 border border-forest-200 text-forest-800"
                  }`}>
                    {lookupMessage.text}
                  </div>
                )}

                {/* Delivery Destination Notice */}
                {isOutsideDeliveryArea && (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start gap-3 animate-fade-in">
                    <AlertCircle className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-bold text-sm text-amber-950">
                        Delivery Notice: Delivery Currently Unavailable
                      </p>
                      <p className="text-amber-800 leading-relaxed">
                        {logisticsData.errorMessage || "We apologize for the inconvenience. Our logistics network does not currently deliver to this postcode. Please enter a valid UK Mainland delivery address to proceed."}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Step 4: Dedicated UK Delivery Options */}
              <div className="p-6 rounded-xl bg-sand-100/40 border border-sand-300 space-y-4">
                <div className="flex items-center justify-between border-b border-sand-200 pb-3">
                  <div className="flex items-center gap-2">
                    <Truck className="w-5 h-5 text-brass-600" />
                    <h2 className="font-display text-lg font-bold text-navy-950">
                      4. Delivery Options
                    </h2>
                  </div>
                  <span className="text-xs text-navy-500 font-medium">
                    Central Distribution Hub
                  </span>
                </div>

                {isOutsideDeliveryArea ? (
                  <div className="p-5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs space-y-2 animate-fade-in">
                    <div className="flex items-center gap-2 font-bold text-sm text-amber-950">
                      <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                      <span>Delivery Options Unavailable for Non-Serviceable Postcode</span>
                    </div>
                    <p className="text-amber-800 leading-relaxed">
                      {logisticsData.errorMessage || "Delivery is currently unavailable to this address. Please update your delivery postcode to an active mainland destination."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {deliveryOptions
                      .filter((opt) => opt && opt.isActive !== false)
                      .map((opt) => {
                        const isSelected = selectedDeliveryTier === opt.id;
                        const baseFee = Number(opt.baseFeePennies) || 0;
                        const totalTierFee = baseFee + postcodeSurchargePennies;
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
                                    {postcodeSurchargePennies > 0 && (
                                      <span className="text-[10px] font-semibold text-brass-800 bg-sand-200 px-2 py-0.5 rounded border border-sand-300">
                                        +{formatGBP(postcodeSurchargePennies)} {logisticsData.zoneName} Surcharge
                                      </span>
                                    )}
                                  </div>
                                  {opt.description && (
                                    <p className="text-[11px] text-navy-600 mt-1">
                                      {opt.description}
                                    </p>
                                  )}
                                  <p className="text-[10px] text-brass-700 font-semibold mt-1">
                                    Estimated transit: {opt.timeframe || "3 - 7 business days"}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <span className="text-xs font-bold text-navy-950">
                                  {totalTierFee === 0 ? "FREE" : formatGBP(totalTierFee)}
                                </span>
                              </div>
                            </div>
                          </label>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* Step 5: Payment Method Selector */}
              <div id="section-payment-method" className="p-6 rounded-xl bg-sand-100/40 border border-sand-300 space-y-4">
                <div className="flex items-center justify-between border-b border-sand-200 pb-3">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-brass-600" />
                    <h2 className="font-display text-lg font-bold text-navy-950">
                      5. Payment Method
                    </h2>
                  </div>
                  <span className="text-xs text-navy-500 flex items-center gap-1 font-mono">
                    <Lock className="w-3.5 h-3.5 text-forest-700" />
                    256-Bit SSL Encrypted
                  </span>
                </div>

                {/* Prominent Payment Authorization Error in Section 5 */}
                {submitError && (
                  <div className="p-4 rounded-xl bg-rose-50 border-2 border-rose-400 text-rose-900 text-xs flex items-start gap-3 animate-in fade-in">
                    <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-bold text-rose-950 text-sm">Payment Authorization Failed</p>
                      <p className="leading-relaxed font-medium">{submitError}</p>
                      <p className="text-[11px] text-rose-700">The order has not been placed. Please review your card details or try a different payment card.</p>
                    </div>
                  </div>
                )}

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
                            Visa, Mastercard, American Express, Maestro (Stripe Supported)
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

                    {/* Mode Selector for Customers with Saved Cards */}
                    {savedCards.length > 0 && (
                      <div className="flex items-center gap-2 pt-2 border-t border-sand-300">
                        <button
                          type="button"
                          onClick={() => setPaymentMode("saved")}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                            paymentMode === "saved"
                              ? "bg-navy-950 text-white shadow-sm"
                              : "bg-sand-100 text-navy-700 hover:bg-sand-200 border border-sand-300"
                          }`}
                        >
                          <CreditCard className="w-3.5 h-3.5 text-brass-400" />
                          <span>Use Saved Card ({savedCards.length})</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentMode("new")}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                            paymentMode === "new"
                              ? "bg-navy-950 text-white shadow-sm"
                              : "bg-sand-100 text-navy-700 hover:bg-sand-200 border border-sand-300"
                          }`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Use a New Card</span>
                        </button>
                      </div>
                    )}

                    {/* Mode 1: Saved Card 1-Click Fast Checkout */}
                    {savedCards.length > 0 && paymentMode === "saved" ? (
                      <div className="pt-2 space-y-3">
                        <div className="flex items-center justify-between pb-1">
                          <span className="text-[11px] font-semibold text-navy-700">Select Authorized Card from Profile</span>
                          <span className="text-[11px] text-forest-700 font-semibold flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Verified Profile Instruments</span>
                          </span>
                        </div>

                        <div className="space-y-2">
                          {savedCards.map((card) => {
                            const isSelected = selectedSavedCardId === card.id;
                            return (
                              <div
                                key={card.id}
                                onClick={() => setSelectedSavedCardId(card.id)}
                                className={`p-3 sm:p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                                  isSelected
                                    ? "border-brass-600 bg-white ring-2 ring-brass-500 shadow-sm"
                                    : "border-sand-300 bg-sand-50/60 hover:bg-white hover:border-sand-400"
                                }`}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-4 h-4 rounded-full border border-navy-400 flex items-center justify-center shrink-0">
                                    {isSelected && <div className="w-2 h-2 rounded-full bg-navy-950" />}
                                  </div>
                                  <div className="w-10 h-7 rounded bg-navy-950 text-white flex items-center justify-center font-bold text-[10px] tracking-wider uppercase shrink-0">
                                    {card.brand || "Card"}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-xs font-bold text-navy-950 font-mono tracking-wide">
                                      •••• •••• •••• {card.last4}
                                    </div>
                                    <div className="text-[11px] text-navy-600 flex items-center gap-2 flex-wrap">
                                      <span>Expires {String(card.exp_month).padStart(2, "0")}/{String(card.exp_year).slice(-2)}</span>
                                      <span>•</span>
                                      <span className="truncate">{card.cardholder_name}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2.5 sm:self-center ml-7 sm:ml-0 shrink-0">
                                  {/* Inline CVV / CVC input directly inside the selected card row (Red Marked Area) */}
                                  {isSelected ? (
                                    <div
                                      className="flex items-center gap-1.5 bg-sand-100/90 border border-sand-300 px-2.5 py-1 rounded-lg shadow-2xs"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <Lock className="w-3 h-3 text-forest-700 shrink-0" />
                                      <label className="text-[11px] font-bold text-navy-900 shrink-0 select-none">
                                        CVV/CVC *
                                      </label>
                                      <input
                                        type="password"
                                        maxLength={4}
                                        value={savedCardCvc}
                                        onChange={(e) => setSavedCardCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                                        placeholder="123"
                                        className="w-14 px-1.5 py-0.5 text-xs rounded border border-sand-300 bg-white text-navy-950 font-mono tracking-widest text-center focus:ring-1 focus:ring-brass-500 outline-none font-bold"
                                      />
                                    </div>
                                  ) : (
                                    <span className="text-[11px] text-navy-400 italic hidden sm:inline">
                                      Click to select
                                    </span>
                                  )}

                                  {Boolean(card.is_default) && card.id === (savedCards.find((c) => Boolean(c.is_default))?.id || savedCards[0]?.id) && (
                                    <span className="text-[10px] font-bold uppercase tracking-wider bg-brass-100 text-brass-800 px-2 py-0.5 rounded border border-brass-300 shrink-0">
                                      Default
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Discreet security & compliance footnote */}
                        <div className="flex items-center justify-between text-[11px] text-navy-500 pt-1 px-1">
                          <span className="flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-forest-600 shrink-0" />
                            <span>1-click accelerated checkout. Encrypted via Stripe PCI-DSS Level 1.</span>
                          </span>
                          <span className="text-[10px] text-navy-400 hidden sm:inline">
                            Enter the 3 or 4-digit code from signature strip
                          </span>
                        </div>
                      </div>
                    ) : (
                      /* Mode 2: Standard New Card Form */
                      <div className="pt-3 border-t border-sand-300 space-y-3">
                        <div className="flex items-center justify-between pb-1">
                          <span className="text-[11px] font-semibold text-navy-700">Card Credentials (Stripe Hosted Element)</span>
                          {process.env.NODE_ENV === "development" && (
                            <button
                              type="button"
                              onClick={handleFillTestCard}
                              className="text-[11px] font-bold text-brass-700 hover:text-brass-800 underline flex items-center gap-1"
                            >
                              <Sparkles className="w-3 h-3 text-brass-600" />
                              <span>Dev Test Card</span>
                            </button>
                          )}
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
                            placeholder={billingFirstName || billingLastName ? `${billingFirstName} ${billingLastName}`.trim() : "Name on card"}
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

                        {/* Save Card for Future Checkbox */}
                        <label className="flex items-start gap-2.5 p-3 rounded-xl bg-sand-100/70 border border-sand-300/80 cursor-pointer hover:bg-sand-100 transition-colors select-none mt-1 group">
                          <input
                            type="checkbox"
                            checked={saveCardForFuture}
                            onChange={(e) => setSaveCardForFuture(e.target.checked)}
                            className="mt-0.5 w-4 h-4 rounded text-brass-600 focus:ring-brass-500 border-sand-400 accent-brass-600 cursor-pointer shrink-0"
                          />
                          <div className="text-left text-xs">
                            <span className="font-semibold text-navy-950 block group-hover:text-brass-700 transition-colors">
                              Save this card securely to my profile for faster future checkout
                            </span>
                            <span className="text-[11px] text-navy-600 leading-relaxed block mt-0.5">
                              PCI-DSS Level 1 compliant tokenization via Stripe. If checked, this card will appear under Authorized Payment Instruments in your customer profile.
                            </span>
                          </div>
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Error Alert right at CTA */}
              {submitError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 font-medium">{submitError}</div>
                </div>
              )}

              {/* Submit CTA Button: Seamless 1-Click Pay & Confirm */}
              <button
                type="submit"
                disabled={isProcessingPayment || isSubmittingOrder || isOutsideDeliveryArea}
                className={`w-full py-4 px-6 rounded-lg font-bold text-sm tracking-wide flex items-center justify-center gap-2 transition-all shadow-md ${
                  isOutsideDeliveryArea
                    ? "bg-sand-300 text-navy-400 cursor-not-allowed border border-sand-400"
                    : "bg-brass-500 text-navy-950 hover:bg-brass-400 active:scale-[0.99] cursor-pointer"
                } disabled:opacity-60`}
              >
                {checkoutStepState === "authorizing" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-navy-950" />
                    <span className="animate-pulse">Authorizing Payment with Issuer...</span>
                  </>
                ) : checkoutStepState === "securing" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-navy-950" />
                    <span className="animate-pulse">Securing Order & B2B Dispatch...</span>
                  </>
                ) : checkoutStepState === "confirmed" ? (
                  <>
                    <Check className="w-4 h-4 text-forest-700" />
                    <span>Order Confirmed!</span>
                  </>
                ) : isProcessingPayment || isSubmittingOrder ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-navy-950" />
                    <span>Processing Payment & Confirming Order...</span>
                  </>
                ) : isOutsideDeliveryArea ? (
                  <>
                    <AlertCircle className="w-4 h-4 text-amber-700" />
                    <span>Delivery Unavailable for Entered Address</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Pay {formatGBP(grandTotalPennies)} & Confirm Order</span>
                  </>
                )}
              </button>

              <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-navy-600 pt-1 text-center">
                <span className="flex items-center gap-1 text-forest-700 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  UK Quality Checked & Inspected
                </span>
                <span>•</span>
                <span>Free Mainland UK Delivery</span>
                <span>•</span>
                <span>Zero Hidden Fees</span>
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
                {items.map((item, idx) => {
                  const prod = item?.product;
                  const title = prod?.title || (item as any)?.title || "Handcrafted Furniture Item";
                  const thumbnail = prod?.thumbnailUrl || (item as any)?.thumbnailUrl || "/images/placeholder.svg";
                  const finish = item?.selectedFinish || item?.selectedFabric || prod?.specs?.color || "Standard Finish";
                  const pricePennies = typeof prod?.pricePennies === "number" ? prod.pricePennies : (Number((item as any)?.pricePennies) || 0);
                  const qty = Math.max(1, Number(item?.quantity) || 1);
                  const lineTotal = pricePennies * qty;

                  return (
                    <div key={item?.id || `cart-item-${idx}`} className="pt-3 first:pt-0 flex gap-3">
                      <div className="w-16 h-16 rounded-md bg-sand-200 overflow-hidden flex-shrink-0 border border-sand-300 relative">
                        <img
                          src={thumbnail}
                          alt={title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = "/images/placeholder.svg";
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-navy-950 truncate">
                          {title}
                        </h4>
                        <p className="text-[11px] text-navy-600">
                          Qty: {qty} • {finish}
                        </p>
                        <div className="text-xs font-bold text-navy-950 mt-1">
                          {formatGBP(lineTotal)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Voucher / Promotional Code Input */}
              <div className="border-t border-sand-200 pt-4">
                {appliedVoucher ? (
                  <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-300 text-xs flex items-center justify-between gap-3 animate-fade-in shadow-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
                        <Tag className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-navy-950 uppercase tracking-wider">
                            {appliedVoucher.code}
                          </span>
                          <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded-full">
                            Applied
                          </span>
                        </div>
                        <p className="text-[11px] text-navy-600 truncate">
                          {appliedVoucher.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-bold text-emerald-800 text-xs">
                        -{appliedVoucher.discountFormatted}
                      </span>
                      <button
                        type="button"
                        onClick={handleRemoveVoucher}
                        className="p-1 rounded-md text-navy-400 hover:text-red-700 hover:bg-sand-200 transition-colors"
                        title="Remove voucher"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleApplyVoucher} className="space-y-1.5">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Tag className="w-3.5 h-3.5 text-navy-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={voucherInput}
                          onChange={(e) => {
                            setVoucherInput(e.target.value.toUpperCase());
                            if (voucherError) setVoucherError(null);
                          }}
                          placeholder="Gift card or discount code"
                          className="w-full pl-8 pr-3 py-2 bg-sand-50 border border-sand-300 rounded-lg text-xs font-mono font-medium text-navy-950 placeholder:text-navy-400 placeholder:font-sans focus:outline-none focus:border-brass-500 uppercase tracking-wider"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isApplyingVoucher || !voucherInput.trim()}
                        className="px-4 py-2 bg-navy-950 hover:bg-navy-900 disabled:opacity-40 disabled:cursor-not-allowed text-sand-50 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1 shadow-sm"
                      >
                        {isApplyingVoucher ? (
                          <div className="w-3.5 h-3.5 border-2 border-sand-50/30 border-t-sand-50 rounded-full animate-spin" />
                        ) : (
                          "Apply"
                        )}
                      </button>
                    </div>
                    {voucherError && (
                      <p className="text-[11px] text-red-600 font-medium pl-1 animate-fade-in flex items-center gap-1">
                        <span>•</span>
                        <span>{voucherError}</span>
                      </p>
                    )}
                  </form>
                )}
              </div>

              {/* Cost & VAT Breakdown */}
              <div className="space-y-2 border-t border-sand-200 pt-4 text-xs text-navy-700">
                <div className="flex justify-between">
                  <span>Net Goods (ex. VAT)</span>
                  <span>{effectiveGoodsVat?.formattedNet || vatBreakdown?.formattedNet || formatGBP(0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>UK VAT (20%)</span>
                  <span>{effectiveGoodsVat?.formattedVat || vatBreakdown?.formattedVat || formatGBP(0)}</span>
                </div>
                {appliedVoucher && voucherDiscountPennies > 0 && (
                  <div className="flex justify-between items-center text-emerald-800 font-medium bg-emerald-50/70 -mx-2 px-2 py-1.5 rounded-lg border border-emerald-200/60">
                    <div className="flex items-center gap-1.5">
                      <span>Voucher Discount</span>
                      <span className="font-mono text-[10px] font-bold uppercase bg-emerald-100 px-1.5 py-0.5 rounded">
                        ({appliedVoucher.code})
                      </span>
                    </div>
                    <span className="font-bold text-emerald-800">-{formatGBP(voucherDiscountPennies)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <div>
                    <span className="block font-medium">Delivery</span>
                    <span className="text-[10px] text-navy-500">
                      {isOutsideDeliveryArea ? "Delivery Unavailable" : (currentDeliveryOption?.name || "Standard Delivery")}
                    </span>
                  </div>
                  <span className={`font-semibold ${isOutsideDeliveryArea ? "text-amber-700 text-xs font-bold" : "text-navy-950"}`}>
                    {isOutsideDeliveryArea
                      ? "Unavailable"
                      : baseDeliveryPennies === 0
                      ? "FREE"
                      : formatGBP(baseDeliveryPennies)}
                  </span>
                </div>

                {/* Regional Postcode Surcharge if applicable */}
                {postcodeSurchargePennies > 0 && !isOutsideDeliveryArea && (
                  <div className="flex justify-between items-center p-2 rounded-lg bg-sand-200/60 border border-sand-300 text-xs">
                    <div>
                      <span className="font-semibold text-navy-950 block">Regional Surcharge</span>
                      <span className="text-[10px] text-brass-700 font-medium">{logisticsData.zoneName}</span>
                    </div>
                    <span className="font-bold text-navy-950">+{formatGBP(postcodeSurchargePennies)}</span>
                  </div>
                )}

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
                  <span>Dedicated Furniture Logistics</span>
                </div>
                <p className="text-[11px] text-navy-600">
                  Furniture is dispatched with protective flat-pack packaging and delivered directly to your doorstep across Mainland UK with pre-delivery updates.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
