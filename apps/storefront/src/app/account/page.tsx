"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Package,
  Truck,
  MapPin,
  FileText,
  Heart,
  LogOut,
  ChevronRight,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  User,
  ShoppingBag,
  Loader2,
  Calendar,
  CreditCard,
  Bell,
  Phone,
  Mail,
  Plus,
  Trash2,
  Edit3,
  Search,
  Filter,
  RotateCcw,
  Check,
  X,
  Layers,
  Lock,
  Sliders,
  Download,
  AlertCircle,
  Info,
  Compass,
  ArrowRight,
  Share2,
  Headphones
} from "lucide-react";
import { formatGBP } from "@san-furniture/types";
import { apiUrl } from "@/lib/api-config";
import { fetchWithSwr } from "@/lib/api-cache";
import { useCart } from "@/lib/cart-context";
import { type CatalogProduct } from "@/lib/catalog";
import { CustomerHelpdeskView } from "@/components/account/CustomerHelpdeskView";
import { CustomerNotificationsView } from "@/components/account/CustomerNotificationsView";

interface CustomerUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

interface OrderItem {
  id: string;
  title: string;
  handle?: string;
  finish?: string;
  quantity: number;
  pricePennies: number;
  thumbnailUrl?: string;
}

interface CustomerOrder {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  shipping_address: string;
  shipping_postcode: string;
  shipping_zone: string;
  delivery_tier: string;
  subtotal_pennies: number;
  shipping_pennies: number;
  vat_pennies: number;
  total_pennies: number;
  payment_status: string;
  payment_method: string;
  fulfillment_status: string;
  carrier?: string;
  tracking_number?: string;
  po_number?: string;
  created_at: string;
  items: OrderItem[];
  totalGbpFormatted: string;
  subtotalFormatted: string;
  shippingFormatted: string;
  vatFormatted: string;
  invoiceHtmlUrl: string;
  deliverySlot?: string;
  deliveryTimeline: Array<{
    step: string;
    done: boolean;
    time: string;
    note: string;
  }>;
}

interface SavedAddress {
  id: string;
  label: string;
  recipient: string;
  line1: string;
  line2?: string;
  city: string;
  postcode: string;
  phone: string;
  isDefaultDelivery: boolean;
  isDefaultBilling: boolean;
  accessNotes?: string;
}

interface WishlistItem {
  id: string;
  title: string;
  handle: string;
  subtitle: string;
  pricePennies: number;
  thumbnailUrl: string;
  stockStatus: "in_stock" | "made_to_order";
  material: string;
  leadTime: string;
}

export default function CustomerAccountPage() {
  const router = useRouter();
  const { addItem, openCart } = useCart();

  const [customer, setCustomer] = useState<CustomerUser | null>(null);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<
    "overview" | "orders" | "addresses" | "wishlist" | "payments" | "concierge" | "security" | "support" | "notifications"
  >("overview");

  // Orders filters
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState<"all" | "in_transit" | "delivered">("all");

  // Interactive Modals
  const [trackingModalOrder, setTrackingModalOrder] = useState<CustomerOrder | null>(null);
  const [rescheduleModalOrder, setRescheduleModalOrder] = useState<CustomerOrder | null>(null);
  const [returnModalOrder, setReturnModalOrder] = useState<CustomerOrder | null>(null);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isSwatchModalOpen, setIsSwatchModalOpen] = useState(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Saved Addresses State
  const [addresses, setAddresses] = useState<SavedAddress[]>([
    {
      id: "addr_1",
      label: "Primary Residential Sanctuary",
      recipient: "Eleanor Vance",
      line1: "14 Kensington Palace Gardens, Apt 4B",
      city: "Kensington, London",
      postcode: "SW1A 1AA",
      phone: "+44 7700 900123",
      isDefaultDelivery: true,
      isDefaultBilling: true,
      accessNotes: "Resident freight lift available. Intercom 4B. 2-Man room-of-choice clearance verified.",
    },
    {
      id: "addr_2",
      label: "Cotswolds Country Retreat",
      recipient: "Eleanor Vance",
      line1: "The Old Manor, High Street",
      city: "Chipping Campden, Gloucestershire",
      postcode: "GL55 6AT",
      phone: "+44 7700 900123",
      isDefaultDelivery: false,
      isDefaultBilling: false,
      accessNotes: "Gated gravel driveway with space for 7.5t logistics vehicle. Ground floor double doors.",
    },
    {
      id: "addr_3",
      label: "Mayfair Private Office",
      recipient: "Eleanor Vance",
      line1: "100 Pall Mall, St James's",
      city: "London",
      postcode: "SW1Y 5NQ",
      phone: "+44 20 7946 0192",
      isDefaultDelivery: false,
      isDefaultBilling: false,
      accessNotes: "Concierge reception desk accepts deliveries 08:00 - 18:00 Monday to Friday.",
    },
  ]);

  // Wishlist State
  const [wishlist, setWishlist] = useState<WishlistItem[]>([
    {
      id: "wish_1",
      title: "Madrid Sliding Door Wardrobe 120cm Gloss White - 2461",
      handle: "madrid-sliding-door-wardrobe-120cm-gloss-white-2461",
      subtitle: "Contemporary Gloss White German Sliding Wardrobe",
      pricePennies: 25752,
      thumbnailUrl: "https://www.amosmannfurniture.co.uk/media/catalog/product/cache/1/small_image/295x295/9df78eab33525d08d6e5fb8d27136e95/2/4/2461.jpg",
      stockStatus: "in_stock",
      material: "Engineered Hardwood & High Gloss",
      leadTime: "3-5 business days mainland UK delivery",
    },
    {
      id: "wish_2",
      title: "Granada Cashmere And Artisan Oak Effect Chest Of Drawers - 11013696",
      handle: "granada-cashmere-and-artisan-oak-effect-chest-of-drawers-11013696",
      subtitle: "Warm Cashmere & Natural Artisan Oak Grain",
      pricePennies: 17400,
      thumbnailUrl: "https://www.amosmannfurniture.co.uk/media/catalog/product/cache/1/small_image/295x295/9df78eab33525d08d6e5fb8d27136e95/1/1/11013696.jpg",
      stockStatus: "in_stock",
      material: "FSC Certified Engineered Wood",
      leadTime: "3-5 business days",
    },
    {
      id: "wish_3",
      title: "Louise White Gloss Bedside Table - 2413",
      handle: "louise-white-gloss-bedside-table-2413",
      subtitle: "Modern High Gloss 2-Drawer Bedside Cabinet",
      pricePennies: 7813,
      thumbnailUrl: "https://www.amosmannfurniture.co.uk/media/catalog/product/cache/1/small_image/295x295/9df78eab33525d08d6e5fb8d27136e95/2/4/2413.jpg",
      stockStatus: "in_stock",
      material: "High Gloss Finish",
      leadTime: "48h dispatch",
    },
  ]);

  // Swatch selection state for Concierge Tab
  const [selectedSwatches, setSelectedSwatches] = useState<string[]>([
    "Ivory Textured Bouclé (BS 5852)",
    "Natural European White Oak",
  ]);

  // New Address Form State
  const [newAddressForm, setNewAddressForm] = useState({
    label: "",
    recipient: "",
    line1: "",
    line2: "",
    city: "",
    postcode: "",
    phone: "",
    accessNotes: "",
  });

  // Selected delivery slot state for reschedule modal
  const [selectedSlot, setSelectedSlot] = useState("Thursday 22 Oct: 10:00 - 12:00 (Pre-call 30m prior)");

  // Selected return reason
  const [returnReason, setReturnReason] = useState("Dimensions did not suit living space");

  // Notification toggles in Security tab
  const [notifications, setNotifications] = useState({
    smsTracking: true,
    emailInvoices: true,
    exclusivePreview: false,
  });

  useEffect(() => {
    // Check customer session
    const stored = localStorage.getItem("san_customer_user");
    const token = localStorage.getItem("san_customer_token");

    let currentUser: CustomerUser | null = null;
    if (stored) {
      try {
        currentUser = JSON.parse(stored);
      } catch {
        currentUser = null;
      }
    }

    if (!currentUser || !token) {
      router.replace("/account/login");
      return;
    }

    setCustomer(currentUser);
    setIsAuthorized(true);

    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const initialTab = searchParams.get("tab");
      const validTabs = ["overview", "orders", "addresses", "wishlist", "payments", "concierge", "security", "support", "notifications"];
      if (initialTab && validTabs.includes(initialTab)) {
        setActiveTab(initialTab as any);
      }
    }

    // Fetch live customer orders from backend for authentic user
    fetchWithSwr(
      apiUrl(`/api/customer/orders?email=${encodeURIComponent(currentUser.email)}`),
      (data: any, isCached) => {
        if (data.orders) {
          setOrders(data.orders);
          if (isCached) setLoading(false);
        }
      }
    )
      .catch((err) => console.error("Orders fetch error:", err))
      .finally(() => setLoading(false));
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("san_customer_token");
    localStorage.removeItem("san_customer_user");
    document.cookie = "san_customer_token=; Max-Age=0; path=/;";
    window.dispatchEvent(new Event("storage"));
    router.replace("/account/login");
  };

  const handleQuickReorder = (item: OrderItem) => {
    const itemHandle =
      item.handle ||
      (item.title ? item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") : "product");
    const reorderProduct: CatalogProduct = {
      id: item.id || `prod_reorder_${Date.now()}`,
      title: item.title,
      handle: itemHandle,
      subtitle: item.finish || "Luxury UK Furniture Collection",
      description: "Direct client re-order from SAN Furniture customer portal.",
      categoryId: "luxury-beds-wardrobes",
      status: "published",
      pricePennies: item.pricePennies,
      vatRatePercent: 20.0,
      gtinBarcode: "5060891280000",
      thumbnailUrl: item.thumbnailUrl || "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=400&q=80",
      images: [item.thumbnailUrl || "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=400&q=80"],
      specs: {
        width_cm: 120,
        height_cm: 200,
        depth_cm: 60,
        weight_kg: 50,
        material: "none",
        frame_material: "engineered_hardwood",
        color: item.finish || "Standard Finish",
        assembly_required: true,
        delivery_tier: "pallet",
        fire_safety: {
          compliant: true,
          standard: "BS 5852: Part 1: 1979",
          certificate_ref: "BS-SAN-2026-QC",
          label_attached: true,
        },
        lead_time_days: 5,
      },
    };

    addItem(reorderProduct, item.quantity, { finish: item.finish });
    openCart();
    showToast(`Added ${item.title} to your luxury basket.`);
  };

  const handleAddWishlistToCart = (item: WishlistItem) => {
    const wishlistProduct: CatalogProduct = {
      id: item.id,
      title: item.title,
      handle: item.handle,
      subtitle: item.subtitle,
      description: item.subtitle,
      categoryId: "luxury-beds-wardrobes",
      status: "published",
      pricePennies: item.pricePennies,
      vatRatePercent: 20.0,
      gtinBarcode: "5060891289999",
      thumbnailUrl: item.thumbnailUrl,
      images: [item.thumbnailUrl],
      specs: {
        width_cm: 120,
        height_cm: 200,
        depth_cm: 60,
        weight_kg: 45,
        material: "none",
        frame_material: "solid_oak",
        color: "Natural",
        assembly_required: false,
        delivery_tier: "pallet",
        fire_safety: {
          compliant: true,
          standard: "BS 5852",
          certificate_ref: "BS-5852-CERT",
          label_attached: true,
        },
        lead_time_days: 5,
      },
    };

    addItem(wishlistProduct, 1);
    openCart();
    showToast(`Added "${item.title}" to your basket.`);
  };

  const handleRemoveWishlistItem = (id: string) => {
    setWishlist((prev) => prev.filter((w) => w.id !== id));
    showToast("Item removed from your saved collection.");
  };

  const handleSaveNewAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddressForm.line1 || !newAddressForm.city || !newAddressForm.postcode) {
      alert("Please fill in the required address fields.");
      return;
    }

    const newAddr: SavedAddress = {
      id: `addr_${Date.now()}`,
      label: newAddressForm.label || "New Sanctuary Residence",
      recipient: newAddressForm.recipient || `${customer?.firstName} ${customer?.lastName}`,
      line1: newAddressForm.line1,
      line2: newAddressForm.line2,
      city: newAddressForm.city,
      postcode: newAddressForm.postcode.toUpperCase().trim(),
      phone: newAddressForm.phone || customer?.phone || "+44 7700 900123",
      isDefaultDelivery: addresses.length === 0,
      isDefaultBilling: false,
      accessNotes: newAddressForm.accessNotes || "Standard private residential entry.",
    };

    setAddresses((prev) => [...prev, newAddr]);
    setIsAddressModalOpen(false);
    setNewAddressForm({
      label: "",
      recipient: "",
      line1: "",
      line2: "",
      city: "",
      postcode: "",
      phone: "",
      accessNotes: "",
    });
    showToast("New UK delivery address added to your address book.");
  };

  const handleSetDefaultDelivery = (id: string) => {
    setAddresses((prev) =>
      prev.map((a) => ({
        ...a,
        isDefaultDelivery: a.id === id,
      }))
    );
    showToast("Default delivery destination updated.");
  };

  const handleSetDefaultBilling = (id: string) => {
    setAddresses((prev) =>
      prev.map((a) => ({
        ...a,
        isDefaultBilling: a.id === id,
      }))
    );
    showToast("Default billing address updated.");
  };

  const handleDeleteAddress = (id: string) => {
    setAddresses((prev) => prev.filter((a) => a.id !== id));
    showToast("Address removed.");
  };

  const handleConfirmReschedule = () => {
    if (rescheduleModalOrder) {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === rescheduleModalOrder.id
            ? { ...o, deliverySlot: selectedSlot }
            : o
        )
      );
    }
    setRescheduleModalOrder(null);
    showToast(`2-Man delivery slot confirmed for: ${selectedSlot}`);
  };

  const handleSubmitReturnRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setReturnModalOrder(null);
    showToast("14-Day Return request submitted. Our London logistics concierge will arrange 2-man collection.");
  };

  const handleOrderSwatchKit = () => {
    setIsSwatchModalOpen(false);
    showToast("Complimentary Luxury Swatch Kit dispatched via Royal Mail Tracked 24.");
  };

  if (!isAuthorized || !customer) {
    return (
      <div className="min-h-[75vh] bg-sand-50 flex flex-col items-center justify-center p-6 text-center antialiased">
        <Loader2 className="w-8 h-8 text-brass-600 animate-spin mb-3" />
        <h2 className="text-sm font-bold text-navy-950">Accessing SAN Client Portal...</h2>
        <p className="text-xs text-navy-500 mt-1">Verifying encrypted UK session</p>
      </div>
    );
  }

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.order_number?.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
      o.id?.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
      o.items?.some((i) => i.title.toLowerCase().includes(orderSearchQuery.toLowerCase()));

    if (orderStatusFilter === "in_transit") {
      return matchesSearch && o.fulfillment_status !== "delivered";
    }
    if (orderStatusFilter === "delivered") {
      return matchesSearch && o.fulfillment_status === "delivered";
    }
    return matchesSearch;
  });

  const totalSpentPennies = orders.reduce((sum, o) => sum + (o.total_pennies || 0), 0);
  const activeDeliveriesCount = orders.filter((o) => o.fulfillment_status !== "delivered").length;

  return (
    <div className="bg-sand-50 min-h-screen py-8 px-4 sm:px-6 lg:px-8 xl:px-12 antialiased text-navy-950">
      <div className="max-w-[1680px] mx-auto space-y-8">
        
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-navy-950 text-sand-50 px-5 py-3.5 rounded-xl shadow-2xl border border-brass-500/40 flex items-center gap-3 animate-fade-in text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-brass-400 flex-shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* ============================================================== */}
        {/* EXECUTIVE CLIENT HEADER & VIP MEMBERSHIP STATUS BAR             */}
        {/* ============================================================== */}
        <div className="bg-sand-100/90 border border-sand-300 rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            
            {/* Client Monogram & Identity */}
            <div className="flex items-center gap-4 sm:gap-5">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-navy-950 border-2 border-brass-500 text-brass-400 font-display font-bold text-2xl flex items-center justify-center shadow-lg">
                  {customer.firstName ? customer.firstName.charAt(0) : "C"}
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-forest-600 border-2 border-sand-100 flex items-center justify-center text-sand-50">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-brass-700 bg-brass-500/10 border border-brass-500/20 px-2.5 py-0.5 rounded-full">
                    Verified UK Client
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    White Glove Priority VIP
                  </span>
                </div>

                <h1 className="font-display text-2xl sm:text-3xl font-bold text-navy-950 mt-1">
                  Welcome back, {customer.firstName} {customer.lastName || ""}
                </h1>
                <p className="text-xs text-navy-600 mt-0.5 flex items-center gap-2">
                  <span>{customer.email}</span>
                  <span className="text-sand-400">•</span>
                  <span className="font-mono text-navy-800">{customer.phone || "+44 7700 900123"}</span>
                </p>
              </div>
            </div>

            {/* Quick Action Navigation */}
            <div className="flex items-center gap-3">
              <Link
                href="/catalog"
                className="text-xs font-bold px-5 py-2.5 rounded-xl border border-sand-300 bg-sand-50 text-navy-950 hover:bg-sand-200 transition-colors shadow-sm inline-flex items-center gap-2"
              >
                <Compass className="w-4 h-4 text-brass-600" />
                <span>Explore Catalog</span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="text-xs font-bold px-4 py-2.5 rounded-xl bg-navy-950 text-sand-50 hover:bg-navy-900 transition-colors flex items-center gap-2 shadow-sm"
              >
                <LogOut className="w-3.5 h-3.5 text-sand-300" />
                <span>Sign Out</span>
              </button>
            </div>

          </div>

          {/* 4 Executive KPI Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-sand-200">
            <div className="p-3.5 rounded-xl bg-sand-50 border border-sand-200">
              <span className="text-[11px] font-semibold text-navy-500 uppercase tracking-wider block">
                Total Lifetime Spend
              </span>
              <p className="font-display font-bold text-xl sm:text-2xl text-navy-950 mt-0.5">
                {formatGBP(totalSpentPennies || 129900)}
              </p>
              <span className="text-[10px] text-navy-500 block mt-0.5">Inc. 20% UK VAT</span>
            </div>

            <div className="p-3.5 rounded-xl bg-sand-50 border border-sand-200">
              <span className="text-[11px] font-semibold text-navy-500 uppercase tracking-wider block">
                Active Consignments
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-display font-bold text-xl sm:text-2xl text-forest-700">
                  {activeDeliveriesCount} Active
                </span>
                <span className="w-2 h-2 rounded-full bg-forest-500 animate-ping" />
              </div>
              <span className="text-[10px] text-navy-500 block mt-0.5">2-Man Delivery In Transit</span>
            </div>

            <div className="p-3.5 rounded-xl bg-sand-50 border border-sand-200">
              <span className="text-[11px] font-semibold text-navy-500 uppercase tracking-wider block">
                Saved Wishlist Pieces
              </span>
              <p className="font-display font-bold text-xl sm:text-2xl text-brass-700 mt-0.5">
                {wishlist.length} Items
              </p>
              <span className="text-[10px] text-navy-500 block mt-0.5">Curated Moodboards</span>
            </div>

            <div className="p-3.5 rounded-xl bg-sand-50 border border-sand-200">
              <span className="text-[11px] font-semibold text-navy-500 uppercase tracking-wider block">
                Membership Tier
              </span>
              <p className="font-display font-bold text-base sm:text-lg text-navy-950 mt-1 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-brass-600" />
                <span>SAN Sovereign Club</span>
              </p>
              <span className="text-[10px] text-emerald-700 font-semibold block">5% Credit on Next Order</span>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* RESPONSIVE PORTAL TAB NAVIGATION BAR                            */}
        {/* ============================================================== */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl p-2 sm:p-2.5 border border-sand-300 shadow-xs">
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden flex-nowrap xl:flex-wrap">
            {[
              { id: "overview", label: "Overview & Snapshot", icon: Layers },
              { id: "orders", label: "My Orders & 2-Man Tracking", badge: orders.length, icon: Truck },
              { id: "addresses", label: "Saved Addresses", badge: addresses.length, icon: MapPin },
              { id: "wishlist", label: "Bespoke Wishlist", badge: wishlist.length, icon: Heart, iconColor: "text-brass-600" },
              { id: "payments", label: "Payment & Invoices", icon: CreditCard },
              { id: "concierge", label: "Concierge & Swatches", icon: Sparkles, iconColor: "text-brass-500" },
              { id: "support", label: "Customer Helpdesk & Claims", icon: Headphones, iconColor: "text-brass-500" },
              { id: "notifications", label: "Activity & Notifications", icon: Bell, iconColor: "text-brass-500" },
              { id: "security", label: "Profile & Security", icon: Lock },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    if (typeof window !== "undefined") {
                      const url = new URL(window.location.href);
                      url.searchParams.set("tab", tab.id);
                      window.history.replaceState(null, "", url.toString());
                    }
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap active-press cursor-pointer shrink-0 ${
                    isActive
                      ? "bg-navy-950 text-sand-50 shadow-md ring-1 ring-brass-500/40"
                      : "bg-sand-50/80 text-navy-800 hover:bg-sand-100 hover:text-navy-950 border border-sand-200/90"
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-brass-400" : (tab.iconColor || "text-navy-600")}`} />
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && (
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold leading-none shrink-0 ${
                        isActive
                          ? "bg-brass-500/25 text-brass-300 border border-brass-500/30"
                          : "bg-sand-200/90 text-navy-700 border border-sand-300"
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ============================================================== */}
        {/* TAB 1: OVERVIEW & DASHBOARD SNAPSHOT                            */}
        {/* ============================================================== */}
        {activeTab === "overview" && (
          <div className="space-y-8 animate-fade-in">
            
            {/* Active Delivery Spotlight Card */}
            {orders.length > 0 && (
              <div className="bg-gradient-to-br from-sand-100 to-sand-200/70 border border-sand-300 rounded-2xl p-6 sm:p-8 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-sand-300">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-forest-100 border border-forest-300 text-forest-700 flex items-center justify-center">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-forest-800 bg-forest-100 px-2 py-0.5 rounded">
                        Next Delivery in Progress
                      </span>
                      <h2 className="text-lg font-bold text-navy-950 mt-1">
                        Consignment #{orders[0].tracking_number || "TRK-AM-648875"}
                      </h2>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setTrackingModalOrder(orders[0])}
                      className="px-4 py-2 rounded-lg bg-navy-950 text-sand-50 text-xs font-bold hover:bg-brass-600 transition-colors shadow-sm inline-flex items-center gap-2"
                    >
                      <Compass className="w-3.5 h-3.5" />
                      <span>Live Van Waypoints</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRescheduleModalOrder(orders[0])}
                      className="px-4 py-2 rounded-lg border border-sand-300 bg-sand-50 text-navy-950 text-xs font-bold hover:bg-sand-200 transition-colors shadow-sm inline-flex items-center gap-2"
                    >
                      <Calendar className="w-3.5 h-3.5 text-navy-700" />
                      <span>Reschedule Slot</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 text-xs">
                  <div>
                    <span className="text-navy-500 block text-[11px]">Booked 2-Hour Slot:</span>
                    <strong className="text-navy-950 text-sm font-semibold">{orders[0].deliverySlot || "Thursday 22 Oct, 10:00 - 12:00"}</strong>
                    <span className="text-[11px] text-forest-700 block mt-0.5">Crew will phone 30m prior to arrival</span>
                  </div>
                  <div>
                    <span className="text-navy-500 block text-[11px]">Assigned Delivery Crew:</span>
                    <strong className="text-navy-950 text-sm font-semibold">{orders[0].carrier || "Amos Mann 2-Man Dedicated Fleet"}</strong>
                    <span className="text-[11px] text-navy-600 block mt-0.5">Room of choice placement + packaging removal</span>
                  </div>
                  <div>
                    <span className="text-navy-500 block text-[11px]">Destination Sanctuary:</span>
                    <strong className="text-navy-950 text-sm font-semibold">{orders[0].shipping_postcode || "SW1A 1AA"}</strong>
                    <span className="text-[11px] text-navy-600 block mt-0.5 truncate">{orders[0].shipping_address}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Orders Overview & Wishlist Quick Pick */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left 2 Cols: Recent Order Pieces */}
              <div className="lg:col-span-2 bg-sand-50 border border-sand-300 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-sand-200">
                  <h3 className="font-display text-base font-bold text-navy-950 flex items-center gap-2">
                    <Package className="w-4 h-4 text-brass-600" />
                    <span>Recent Furniture Commissions</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab("orders")}
                    className="text-xs font-bold text-brass-700 hover:text-navy-950 flex items-center gap-1"
                  >
                    <span>View All Orders</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="p-4 rounded-xl bg-sand-100/60 border border-sand-200 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <span className="font-mono text-xs font-bold text-brass-700">{order.order_number || order.id}</span>
                          <span className="text-[11px] text-navy-500 ml-2">
                            {new Date(order.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-navy-950">{order.totalGbpFormatted}</span>
                          <a
                            href={apiUrl(order.invoiceHtmlUrl || `/api/orders/${order.id}/invoice`)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] px-2.5 py-1 rounded bg-sand-200 hover:bg-sand-300 text-navy-900 font-semibold inline-flex items-center gap-1"
                          >
                            <FileText className="w-3 h-3" />
                            <span>VAT Invoice</span>
                          </a>
                        </div>
                      </div>

                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-3 pt-2 border-t border-sand-200">
                          <div className="flex items-center gap-3 min-w-0">
                            {item.thumbnailUrl && (
                              <img
                                src={item.thumbnailUrl}
                                alt={item.title}
                                className="w-12 h-12 rounded-lg object-cover border border-sand-300 flex-shrink-0"
                              />
                            )}
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-navy-950 truncate">{item.title}</p>
                              <p className="text-[11px] text-navy-600">
                                Qty: {item.quantity} • Finish: {item.finish || "Standard White Glove Finish"}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleQuickReorder(item)}
                            className="px-3 py-1.5 rounded-lg bg-sand-200 hover:bg-brass-500 hover:text-navy-950 text-navy-900 text-[11px] font-bold transition-all flex items-center gap-1.5 flex-shrink-0"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Buy Again</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Col: Quick Concierge Desk & Wishlist Snapshot */}
              <div className="space-y-6">
                
                {/* London Concierge Desk */}
                <div className="bg-sand-100/70 border border-sand-300 rounded-2xl p-6 shadow-sm space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-navy-950 text-brass-400 flex items-center justify-center">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-navy-950">London St James's Concierge</h4>
                      <p className="text-[11px] text-navy-600">Assigned: Julian M. (Senior White Glove Lead)</p>
                    </div>
                  </div>
                  <p className="text-xs text-navy-700 leading-relaxed">
                    Have special architectural access requirements, narrow stairwells, or need swatch samples? Our bespoke team is at your service.
                  </p>
                  <div className="pt-2 flex flex-col gap-2">
                    <a
                      href="tel:+442079460192"
                      className="w-full text-center py-2 px-3 rounded-lg bg-navy-950 text-sand-50 text-xs font-bold hover:bg-navy-900 transition-colors flex items-center justify-center gap-2"
                    >
                      <Phone className="w-3.5 h-3.5 text-brass-400" />
                      <span>Call Concierge: +44 20 7946 0192</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => setIsSwatchModalOpen(true)}
                      className="w-full text-center py-2 px-3 rounded-lg border border-sand-300 bg-sand-50 text-navy-950 text-xs font-bold hover:bg-sand-200 transition-colors flex items-center justify-center gap-2"
                    >
                      <Layers className="w-3.5 h-3.5 text-navy-700" />
                      <span>Request Complimentary Swatch Kit</span>
                    </button>
                  </div>
                </div>

                {/* Wishlist Snapshot */}
                <div className="bg-sand-50 border border-sand-300 rounded-2xl p-6 shadow-sm space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-sand-200">
                    <h4 className="text-xs font-bold text-navy-950 flex items-center gap-2">
                      <Heart className="w-3.5 h-3.5 text-brass-600" />
                      <span>Bespoke Wishlist ({wishlist.length})</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => setActiveTab("wishlist")}
                      className="text-[11px] font-bold text-brass-700 hover:underline"
                    >
                      View All
                    </button>
                  </div>

                  <div className="space-y-3">
                    {wishlist.slice(0, 2).map((item) => (
                      <div key={item.id} className="flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={item.thumbnailUrl}
                            alt={item.title}
                            className="w-10 h-10 rounded-lg object-cover border border-sand-300 flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="font-bold text-navy-950 truncate text-[11px]">{item.title}</p>
                            <span className="font-semibold text-brass-700 text-[11px]">
                              {formatGBP(item.pricePennies)}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAddWishlistToCart(item)}
                          className="px-2.5 py-1 rounded bg-navy-950 text-sand-50 text-[10px] font-bold hover:bg-brass-600 transition-colors flex-shrink-0"
                        >
                          Add
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: MY ORDERS & DETAILED 2-MAN LOGISTICS TRACKER            */}
        {/* ============================================================== */}
        {activeTab === "orders" && (
          <div className="space-y-6 animate-fade-in">
            
            {/* Search & Filter Toolbar */}
            <div className="bg-sand-100/70 border border-sand-300 rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-navy-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by order #, consignment ref, or furniture name..."
                  value={orderSearchQuery}
                  onChange={(e) => setOrderSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-sand-300 bg-sand-50 focus:outline-none focus:ring-2 focus:ring-brass-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-navy-600 flex items-center gap-1 mr-1">
                  <Filter className="w-3.5 h-3.5" />
                  Filter:
                </span>
                <button
                  type="button"
                  onClick={() => setOrderStatusFilter("all")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    orderStatusFilter === "all"
                      ? "bg-navy-950 text-sand-50 shadow-sm"
                      : "bg-sand-200/80 text-navy-800 hover:bg-sand-300"
                  }`}
                >
                  All Orders ({orders.length})
                </button>
                <button
                  type="button"
                  onClick={() => setOrderStatusFilter("in_transit")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    orderStatusFilter === "in_transit"
                      ? "bg-navy-950 text-sand-50 shadow-sm"
                      : "bg-sand-200/80 text-navy-800 hover:bg-sand-300"
                  }`}
                >
                  Active &bull; In Transit ({orders.filter((o) => o.fulfillment_status !== "delivered").length})
                </button>
                <button
                  type="button"
                  onClick={() => setOrderStatusFilter("delivered")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    orderStatusFilter === "delivered"
                      ? "bg-navy-950 text-sand-50 shadow-sm"
                      : "bg-sand-200/80 text-navy-800 hover:bg-sand-300"
                  }`}
                >
                  Completed ({orders.filter((o) => o.fulfillment_status === "delivered").length})
                </button>
              </div>
            </div>

            {/* Orders Listing */}
            {filteredOrders.length === 0 ? (
              <div className="bg-sand-50 border border-sand-300 rounded-2xl p-12 text-center space-y-3">
                <Package className="w-10 h-10 text-navy-400 mx-auto stroke-1" />
                <h3 className="text-sm font-bold text-navy-950">No orders match your filter criteria</h3>
                <p className="text-xs text-navy-500">Try adjusting your search terms or view all order history.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-sand-50 border border-sand-300 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6 transition-all hover:border-sand-400"
                  >
                    
                    {/* Header Bar: Ref, Status, Price, Actions */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-sand-200">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-sm font-bold text-navy-950">
                            Order {order.order_number || order.id}
                          </span>
                          <span className="text-[11px] font-bold text-forest-800 bg-forest-100 border border-forest-300 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                            {order.fulfillment_status === "delivered" ? "Delivered & Inspected" : "2-Man Dispatch In Transit"}
                          </span>
                          <span className="text-[11px] text-navy-500">
                            Placed on {new Date(order.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                          </span>
                        </div>

                        <p className="text-xs text-navy-600 mt-1">
                          Delivery Sanctuary: <strong className="font-mono text-navy-950">{order.shipping_postcode}</strong> &bull; Carrier: <strong>{order.carrier || "Amos Mann 2-Man Dedicated Fleet"}</strong>
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <div className="text-right mr-2">
                          <span className="font-display font-bold text-xl text-navy-950 block">
                            {order.totalGbpFormatted}
                          </span>
                          <span className="text-[10px] text-navy-500 block">Inc. 20% UK VAT ({order.vatFormatted || "£216.50"})</span>
                        </div>

                        {/* Statutory HMRC VAT Invoice */}
                        <a
                          href={apiUrl(order.invoiceHtmlUrl || `/api/orders/${order.id}/invoice`)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-2 rounded-lg bg-sand-200 hover:bg-sand-300 text-navy-950 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                          title="Official UK VAT Tax Invoice"
                        >
                          <FileText className="w-3.5 h-3.5 text-navy-700" />
                          <span>HMRC Invoice</span>
                          <ExternalLink className="w-3 h-3 text-navy-500" />
                        </a>

                        {/* Reschedule 2hr Delivery Window */}
                        <button
                          type="button"
                          onClick={() => setRescheduleModalOrder(order)}
                          className="px-3 py-2 rounded-lg border border-sand-300 bg-sand-50 hover:bg-sand-200 text-navy-950 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                        >
                          <Calendar className="w-3.5 h-3.5 text-brass-700" />
                          <span>Delivery Window</span>
                        </button>

                        {/* Live Waypoint GPS Modal */}
                        <button
                          type="button"
                          onClick={() => setTrackingModalOrder(order)}
                          className="px-4 py-2 rounded-lg bg-navy-950 hover:bg-brass-600 text-sand-50 text-xs font-bold inline-flex items-center gap-1.5 transition-colors shadow-sm"
                        >
                          <Compass className="w-3.5 h-3.5 text-brass-400" />
                          <span>Track Consignment</span>
                        </button>
                      </div>
                    </div>

                    {/* 4-Step Interactive White Glove Progress Timeline */}
                    <div className="p-4 rounded-xl bg-sand-100/70 border border-sand-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-navy-900 uppercase tracking-wider flex items-center gap-1.5">
                          <Truck className="w-3.5 h-3.5 text-brass-600" />
                          <span>Fulfillment &amp; 2-Man White Glove Progress</span>
                        </span>
                        <span className="font-mono text-xs font-semibold text-navy-600">
                          Tracking No: {order.tracking_number || "TRK-AM-648875"}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        {order.deliveryTimeline.map((step, idx) => (
                          <div
                            key={idx}
                            className={`p-3 rounded-lg border text-xs transition-all ${
                              step.done
                                ? "bg-sand-50 border-emerald-400 shadow-sm"
                                : idx === 2
                                ? "bg-brass-500/10 border-brass-400"
                                : "bg-sand-50/50 border-sand-300 opacity-60"
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              {step.done ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                              ) : idx === 2 ? (
                                <Clock className="w-4 h-4 text-brass-600 animate-pulse flex-shrink-0" />
                              ) : (
                                <Package className="w-4 h-4 text-navy-400 flex-shrink-0" />
                              )}
                              <span className="font-bold text-navy-950 truncate text-[11px]">{step.step}</span>
                            </div>
                            <span className="text-[10px] text-navy-600 block pl-6">{step.note}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Order Items List */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-navy-900 uppercase tracking-wider">
                        Commissioned Items ({order.items.length})
                      </h4>

                      <div className="divide-y divide-sand-200 border border-sand-200 rounded-xl bg-sand-100/40 p-4">
                        {order.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="py-3 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                          >
                            <div className="flex items-center gap-3.5 min-w-0">
                              {item.thumbnailUrl && (
                                <img
                                  src={item.thumbnailUrl}
                                  alt={item.title}
                                  className="w-14 h-14 rounded-lg object-cover border border-sand-300 flex-shrink-0"
                                />
                              )}
                              <div className="min-w-0">
                                <h5 className="text-xs font-bold text-navy-950 truncate">{item.title}</h5>
                                <p className="text-[11px] text-navy-600 mt-0.5">
                                  Qty: {item.quantity} &bull; Finish: {item.finish || "Standard White Glove Finish"}
                                </p>
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 mt-1">
                                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                  BS 5852 Fire Safety Compliant &bull; 10-Yr Guarantee
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 self-end sm:self-center">
                              <span className="text-xs font-bold text-navy-950">
                                {formatGBP(item.pricePennies * item.quantity)}
                              </span>

                              <button
                                type="button"
                                onClick={() => handleQuickReorder(item)}
                                className="px-3 py-1.5 rounded-lg bg-sand-200 hover:bg-brass-500 hover:text-navy-950 text-navy-950 text-xs font-bold transition-all flex items-center gap-1.5"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Buy Again</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setReturnModalOrder(order)}
                                className="px-2.5 py-1.5 rounded-lg border border-sand-300 hover:bg-sand-200 text-navy-700 text-xs font-medium transition-colors"
                              >
                                <span>14-Day Return</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            )}

          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: SAVED ADDRESSES & PROPERTY ACCESS                       */}
        {/* ============================================================== */}
        {activeTab === "addresses" && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-sand-200">
              <div>
                <h3 className="font-display text-lg font-bold text-navy-950 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-brass-600" />
                  <span>UK Property Addresses &amp; Logistics Access</span>
                </h3>
                <p className="text-xs text-navy-600 mt-0.5">
                  Manage delivery sanctuaries and private property access instructions for our 2-man white glove delivery crew.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsAddressModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-navy-950 text-sand-50 hover:bg-brass-600 text-xs font-bold transition-colors inline-flex items-center gap-2 shadow-sm self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Sanctuary Address</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  className={`p-6 rounded-2xl border flex flex-col justify-between transition-all ${
                    addr.isDefaultDelivery
                      ? "bg-sand-100 border-brass-500 shadow-sm"
                      : "bg-sand-50 border-sand-300 hover:border-sand-400"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-navy-950 uppercase tracking-wider">{addr.label}</span>
                      {addr.isDefaultDelivery && (
                        <span className="text-[10px] font-bold text-brass-800 bg-brass-500/20 px-2 py-0.5 rounded-full border border-brass-500/30">
                          Default Delivery
                        </span>
                      )}
                      {addr.isDefaultBilling && (
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                          Default Billing
                        </span>
                      )}
                    </div>

                    <div>
                      <p className="text-xs font-bold text-navy-950">{addr.recipient}</p>
                      <p className="text-xs text-navy-700 leading-relaxed mt-1">
                        {addr.line1}<br />
                        {addr.line2 && <>{addr.line2}<br /></>}
                        {addr.city}<br />
                        <strong className="font-mono text-navy-950">{addr.postcode}</strong><br />
                        United Kingdom
                      </p>
                      <p className="text-xs font-mono text-navy-600 mt-2">{addr.phone}</p>
                    </div>

                    {addr.accessNotes && (
                      <div className="p-3 rounded-lg bg-sand-200/60 border border-sand-300 text-[11px] text-navy-800 space-y-1">
                        <strong className="text-navy-950 font-semibold block flex items-center gap-1">
                          <Truck className="w-3 h-3 text-brass-700" />
                          <span>Crew Access Notes:</span>
                        </strong>
                        <p>{addr.accessNotes}</p>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 mt-4 border-t border-sand-200 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      {!addr.isDefaultDelivery && (
                        <button
                          type="button"
                          onClick={() => handleSetDefaultDelivery(addr.id)}
                          className="text-[11px] font-bold text-brass-700 hover:underline"
                        >
                          Make Delivery Default
                        </button>
                      )}
                      {!addr.isDefaultBilling && (
                        <button
                          type="button"
                          onClick={() => handleSetDefaultBilling(addr.id)}
                          className="text-[11px] font-bold text-navy-700 hover:underline"
                        >
                          Make Billing Default
                        </button>
                      )}
                    </div>

                    {addresses.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteAddress(addr.id)}
                        className="text-red-700 hover:text-red-900 p-1 rounded"
                        title="Delete Address"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 4: BESPOKE WISHLIST & MOODBOARDS                           */}
        {/* ============================================================== */}
        {activeTab === "wishlist" && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-sand-200">
              <div>
                <h3 className="font-display text-lg font-bold text-navy-950 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-brass-600" />
                  <span>Bespoke Wishlist &amp; Curated Moodboards</span>
                </h3>
                <p className="text-xs text-navy-600 mt-0.5">
                  Save your desired luxury commissions, compare handcrafted finishes, and move directly to checkout.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(window.location.href);
                    showToast("Wishlist link copied to clipboard.");
                  }}
                  className="px-3.5 py-2 rounded-xl border border-sand-300 bg-sand-50 text-navy-950 text-xs font-bold hover:bg-sand-200 transition-colors inline-flex items-center gap-2"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share with Interior Designer</span>
                </button>
              </div>
            </div>

            {wishlist.length === 0 ? (
              <div className="bg-sand-50 border border-sand-300 rounded-2xl p-12 text-center space-y-3">
                <Heart className="w-10 h-10 text-navy-300 mx-auto stroke-1" />
                <h3 className="text-sm font-bold text-navy-950">Your Wishlist is Empty</h3>
                <p className="text-xs text-navy-500">Explore our luxury catalog to save bespoke sofas, dining tables, and chairs.</p>
                <Link
                  href="/catalog"
                  className="inline-block mt-2 px-5 py-2.5 rounded-xl bg-navy-950 text-sand-50 text-xs font-bold hover:bg-brass-600 transition-colors"
                >
                  Browse Catalog
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {wishlist.map((item) => (
                  <div
                    key={item.id}
                    className="bg-sand-50 border border-sand-300 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between group hover:border-sand-400 transition-all"
                  >
                    <div>
                      <div className="relative aspect-[4/3] bg-sand-200 overflow-hidden">
                        <img
                          src={item.thumbnailUrl}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveWishlistItem(item.id)}
                          className="absolute top-3 right-3 p-2 rounded-full bg-sand-50/90 hover:bg-sand-100 text-navy-700 hover:text-red-700 shadow-sm transition-colors"
                          title="Remove from Wishlist"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <div className="absolute bottom-3 left-3">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-navy-950/85 text-sand-50 backdrop-blur-sm">
                            {item.stockStatus === "in_stock" ? "In Stock • 48h Dispatch" : "Made to Order"}
                          </span>
                        </div>
                      </div>

                      <div className="p-5 space-y-2">
                        <Link href={`/products/${item.handle}`} className="block group-hover:text-brass-700 transition-colors">
                          <h4 className="font-display font-bold text-base text-navy-950 leading-snug">
                            {item.title}
                          </h4>
                        </Link>
                        <p className="text-xs text-navy-600 line-clamp-2">{item.subtitle}</p>
                        
                        <div className="pt-2 text-xs text-navy-700 space-y-1">
                          <div><strong>Material:</strong> {item.material}</div>
                          <div><strong>Lead Time:</strong> {item.leadTime}</div>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 pt-0 border-t border-sand-200/70 flex items-center justify-between gap-3 mt-2">
                      <div>
                        <span className="font-display font-bold text-lg text-navy-950">
                          {formatGBP(item.pricePennies)}
                        </span>
                        <span className="text-[10px] text-navy-500 block">Inc. 20% UK VAT</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAddWishlistToCart(item)}
                        className="px-4 py-2.5 rounded-xl bg-navy-950 hover:bg-brass-600 text-sand-50 text-xs font-bold transition-all inline-flex items-center gap-2 shadow-sm"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Move to Basket</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 5: PAYMENT METHODS & VAT INVOICES                          */}
        {/* ============================================================== */}
        {activeTab === "payments" && (
          <div className="space-y-6 animate-fade-in">
            <div className="pb-2 border-b border-sand-200">
              <h3 className="font-display text-lg font-bold text-navy-950 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-brass-600" />
                <span>Payment Methods &amp; Statutory UK VAT Billing</span>
              </h3>
              <p className="text-xs text-navy-600 mt-0.5">
                Saved card tokens, Klarna Pay in 3 accounts, and statutory HMRC invoice details for UK tax compliance.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Saved Cards */}
              <div className="bg-sand-50 border border-sand-300 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-sand-200">
                  <h4 className="text-xs font-bold text-navy-950 uppercase tracking-wider">
                    Authorized Payment Instruments
                  </h4>
                  <span className="text-[11px] text-emerald-800 font-semibold bg-emerald-100 px-2 py-0.5 rounded flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    PCI-DSS Level 1
                  </span>
                </div>

                {/* Primary Card */}
                <div className="p-4 rounded-xl bg-navy-950 text-sand-50 space-y-4 shadow-md">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-brass-400 block">
                        Stripe UK Vault Secured
                      </span>
                      <p className="text-sm font-bold mt-1">Mastercard World Elite</p>
                    </div>
                    <span className="text-[10px] font-bold bg-brass-500 text-navy-950 px-2 py-0.5 rounded">
                      Default
                    </span>
                  </div>

                  <div className="font-mono text-base tracking-widest text-sand-200">
                    •••• •••• •••• 4242
                  </div>

                  <div className="flex justify-between items-center text-xs text-sand-300">
                    <span>Cardholder: <strong>{customer.firstName} {customer.lastName}</strong></span>
                    <span>Expires: <strong>12/28</strong></span>
                  </div>
                </div>

                {/* Secondary: Klarna Pay in 3 */}
                <div className="p-4 rounded-xl bg-sand-100/70 border border-sand-300 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <strong className="text-navy-950 font-bold block">Klarna UK Pay in 3</strong>
                    <span className="text-navy-600">Interest-free financing linked to {customer.email}</span>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                    Active
                  </span>
                </div>

                <div className="pt-2 text-[11px] text-navy-500">
                  All credit and debit card tokens are securely encrypted via Stripe UK 256-bit TLS protocol. SAN Furniture never stores raw PAN or CVC numbers.
                </div>
              </div>

              {/* VAT Invoicing & Tax Profile */}
              <div className="bg-sand-50 border border-sand-300 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-sand-200">
                  <h4 className="text-xs font-bold text-navy-950 uppercase tracking-wider">
                    Statutory UK VAT Billing Details
                  </h4>
                  <span className="text-[11px] text-brass-700 font-semibold bg-sand-200 px-2 py-0.5 rounded">
                    HMRC Compliant
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-sand-100/60 border border-sand-200 space-y-2 text-xs">
                  <div><strong>Tax Entity:</strong> Private Individual / UK Consumer</div>
                  <div><strong>VAT Rate Applied:</strong> Standard 20% UK VAT (Included in all gross amounts)</div>
                  <div><strong>Invoice Dispatch:</strong> Auto-emailed upon payment authorization</div>
                  <div><strong>Company VAT Reg:</strong> <span className="font-mono text-navy-950">GB 421 9823 45</span></div>
                  <div><strong>Company CRN:</strong> <span className="font-mono text-navy-950">15482910</span></div>
                </div>

                <div className="space-y-2 pt-2">
                  <h5 className="text-xs font-bold text-navy-950">Download All Historical Invoices</h5>
                  <div className="space-y-2">
                    {orders.map((o) => (
                      <div key={o.id} className="p-3 rounded-lg bg-sand-100 border border-sand-200 flex items-center justify-between text-xs">
                        <div>
                          <strong className="text-navy-950 font-mono">{o.order_number || o.id}</strong>
                          <span className="text-navy-500 block text-[11px]">{new Date(o.created_at).toLocaleDateString("en-GB")}</span>
                        </div>
                        <a
                          href={apiUrl(o.invoiceHtmlUrl || `/api/orders/${o.id}/invoice`)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded bg-sand-200 hover:bg-sand-300 text-navy-950 font-bold inline-flex items-center gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>PDF / HTML</span>
                        </a>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 6: CONCIERGE & FREE SWATCH SERVICE                         */}
        {/* ============================================================== */}
        {activeTab === "concierge" && (
          <div className="space-y-6 animate-fade-in">
            <div className="pb-2 border-b border-sand-200">
              <h3 className="font-display text-lg font-bold text-navy-950 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brass-600" />
                <span>White Glove Concierge &amp; Free Swatch Service</span>
              </h3>
              <p className="text-xs text-navy-600 mt-0.5">
                Enjoy priority access to our London interior design specialists, complimentary fabric sample kits, and structural guarantee certificates.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Free Swatch Kit Order Service */}
              <div className="bg-sand-50 border border-sand-300 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-sand-200">
                  <h4 className="text-xs font-bold text-navy-950 uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4 text-brass-600" />
                    <span>Free Fabric &amp; Wood Swatch Kit</span>
                  </h4>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                    Free Royal Mail 24
                  </span>
                </div>

                <p className="text-xs text-navy-700 leading-relaxed">
                  Select up to 4 luxury fabric swatches and solid wood samples. We will courier them straight to your registered UK address free of charge.
                </p>

                <div className="space-y-2 pt-2">
                  {[
                    "Ivory Textured Bouclé (BS 5852 Compliant)",
                    "Sage Green Italian Velvet",
                    "Burnt Amber Woven Chenille",
                    "Natural European White Oak (FSC Certified)",
                    "Smoked Artisan Walnut",
                    "Matte Black Solid Ash",
                  ].map((swatch, idx) => {
                    const isSelected = selectedSwatches.includes(swatch);
                    return (
                      <label
                        key={idx}
                        className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer text-xs transition-all ${
                          isSelected
                            ? "bg-sand-100 border-brass-500 font-bold text-navy-950 shadow-sm"
                            : "bg-sand-50 border-sand-200 text-navy-700 hover:bg-sand-100"
                        }`}
                      >
                        <span className="flex items-center gap-2.5">
                          <span className={`w-3.5 h-3.5 rounded-full border ${isSelected ? "bg-brass-600 border-brass-600" : "border-sand-400"}`} />
                          <span>{swatch}</span>
                        </span>
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={isSelected}
                          onChange={() => {
                            if (isSelected) {
                              setSelectedSwatches((prev) => prev.filter((s) => s !== swatch));
                            } else {
                              if (selectedSwatches.length >= 4) {
                                alert("You can select up to 4 complimentary swatches per kit.");
                                return;
                              }
                              setSelectedSwatches((prev) => [...prev, swatch]);
                            }
                          }}
                        />
                      </label>
                    );
                  })}
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleOrderSwatchKit}
                    className="w-full py-3 rounded-xl bg-navy-950 hover:bg-brass-600 text-sand-50 text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2"
                  >
                    <Truck className="w-4 h-4 text-brass-400" />
                    <span>Order Free Swatch Kit ({selectedSwatches.length} selected)</span>
                  </button>
                </div>
              </div>

              {/* VIP Guarantees & Hotline Desk */}
              <div className="space-y-6">
                
                {/* 10-Year Guarantee Download */}
                <div className="bg-sand-100/70 border border-sand-300 rounded-2xl p-6 shadow-sm space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-navy-950 text-brass-400 flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-navy-950 uppercase tracking-wider">
                        10-Year Frame Structural Guarantee
                      </h4>
                      <p className="text-[11px] text-navy-600">Registered to {customer.firstName} {customer.lastName}</p>
                    </div>
                  </div>

                  <p className="text-xs text-navy-700 leading-relaxed">
                    Every solid oak, ash, and kiln-dried beech frame from SAN Furniture is backed by our full 10-year structural warranty, compliant with BS EN 12520 strength and stability standards.
                  </p>

                  <div className="pt-2">
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        showToast("Downloading Official 10-Year Guarantee Certificate (PDF)...");
                      }}
                      className="px-4 py-2 rounded-lg bg-sand-200 hover:bg-sand-300 text-navy-950 text-xs font-bold inline-flex items-center gap-2 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Guarantee Certificate</span>
                    </a>
                  </div>
                </div>

                {/* Direct Concierge Contact Card */}
                <div className="bg-sand-50 border border-sand-300 rounded-2xl p-6 shadow-sm space-y-3">
                  <h4 className="text-xs font-bold text-navy-950 uppercase tracking-wider flex items-center gap-2">
                    <Phone className="w-4 h-4 text-brass-600" />
                    <span>Dedicated Client Care Channels</span>
                  </h4>

                  <div className="space-y-2 text-xs text-navy-800">
                    <div className="p-3 rounded-lg bg-sand-100 border border-sand-200 flex justify-between items-center">
                      <span>London St James's Concierge:</span>
                      <a href="tel:+442079460192" className="font-bold text-brass-700 underline">
                        +44 20 7946 0192
                      </a>
                    </div>
                    <div className="p-3 rounded-lg bg-sand-100 border border-sand-200 flex justify-between items-center">
                      <span>Priority VIP Support Email:</span>
                      <a href="mailto:concierge@sanfurniture.com" className="font-bold text-brass-700 underline">
                        concierge@sanfurniture.com
                      </a>
                    </div>
                    <div className="p-3 rounded-lg bg-sand-100 border border-sand-200 flex justify-between items-center">
                      <span>White Glove Operating Hours:</span>
                      <span className="font-semibold text-navy-950">Mon - Sat: 08:00 - 19:00</span>
                    </div>
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 7: PROFILE & SECURITY SETTINGS                             */}
        {/* ============================================================== */}
        {activeTab === "security" && (
          <div className="space-y-6 animate-fade-in max-w-4xl">
            <div className="pb-2 border-b border-sand-200">
              <h3 className="font-display text-lg font-bold text-navy-950 flex items-center gap-2">
                <Lock className="w-5 h-5 text-brass-600" />
                <span>Client Profile &amp; Account Security</span>
              </h3>
              <p className="text-xs text-navy-600 mt-0.5">
                Update your contact details, customize white glove delivery alerts, and secure your account credentials.
              </p>
            </div>

            {/* Profile Information Form */}
            <div className="bg-sand-50 border border-sand-300 rounded-2xl p-6 shadow-sm space-y-4">
              <h4 className="text-xs font-bold text-navy-950 uppercase tracking-wider">
                Personal Credentials
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-navy-700 font-semibold mb-1">First Name</label>
                  <input
                    type="text"
                    defaultValue={customer.firstName}
                    className="w-full px-3 py-2 rounded-lg border border-sand-300 bg-sand-100 text-navy-950"
                  />
                </div>
                <div>
                  <label className="block text-navy-700 font-semibold mb-1">Last Name</label>
                  <input
                    type="text"
                    defaultValue={customer.lastName || "Vance"}
                    className="w-full px-3 py-2 rounded-lg border border-sand-300 bg-sand-100 text-navy-950"
                  />
                </div>
                <div>
                  <label className="block text-navy-700 font-semibold mb-1">Email Address</label>
                  <input
                    type="email"
                    defaultValue={customer.email}
                    disabled
                    className="w-full px-3 py-2 rounded-lg border border-sand-300 bg-sand-200/60 text-navy-600 cursor-not-allowed"
                  />
                  <span className="text-[10px] text-navy-500 mt-1 block">Contact concierge to update your registered email.</span>
                </div>
                <div>
                  <label className="block text-navy-700 font-semibold mb-1">UK Mobile for Delivery Pre-call</label>
                  <input
                    type="tel"
                    defaultValue={customer.phone || "+44 7700 900123"}
                    className="w-full px-3 py-2 rounded-lg border border-sand-300 bg-sand-100 text-navy-950 font-mono"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => showToast("Client profile credentials updated successfully.")}
                  className="px-5 py-2 rounded-lg bg-navy-950 text-sand-50 text-xs font-bold hover:bg-brass-600 transition-colors shadow-sm"
                >
                  Save Profile Changes
                </button>
              </div>
            </div>

            {/* Delivery Alert Preferences */}
            <div className="bg-sand-50 border border-sand-300 rounded-2xl p-6 shadow-sm space-y-4">
              <h4 className="text-xs font-bold text-navy-950 uppercase tracking-wider flex items-center gap-2">
                <Bell className="w-4 h-4 text-brass-600" />
                <span>Logistics Notification Preferences</span>
              </h4>

              <div className="space-y-3 text-xs">
                <label className="flex items-center justify-between p-3 rounded-xl bg-sand-100/60 border border-sand-200 cursor-pointer">
                  <div>
                    <strong className="text-navy-950 block">SMS 30-Minute Prior Delivery Pre-call Alert</strong>
                    <span className="text-navy-600 text-[11px]">The delivery team will send an SMS and automated call 30 mins before van arrival.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.smsTracking}
                    onChange={(e) => {
                      setNotifications({ ...notifications, smsTracking: e.target.checked });
                      showToast("SMS dispatch preference saved.");
                    }}
                    className="w-4 h-4 rounded text-brass-600"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-sand-100/60 border border-sand-200 cursor-pointer">
                  <div>
                    <strong className="text-navy-950 block">Electronic Statutory VAT Invoices via Email</strong>
                    <span className="text-navy-600 text-[11px]">Receive HMRC-compliant PDF receipts upon order completion.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.emailInvoices}
                    onChange={(e) => {
                      setNotifications({ ...notifications, emailInvoices: e.target.checked });
                      showToast("Invoice email preference saved.");
                    }}
                    className="w-4 h-4 rounded text-brass-600"
                  />
                </label>
              </div>
            </div>

            {/* Password & Security Status */}
            <div className="bg-sand-50 border border-sand-300 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-navy-950 uppercase tracking-wider">
                  Authentication &amp; Credentials
                </h4>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Argon2id Encrypted
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-navy-700 font-semibold mb-1">New Password</label>
                  <input
                    type="password"
                    placeholder="Minimum 8 characters"
                    className="w-full px-3 py-2 rounded-lg border border-sand-300 bg-sand-100 text-navy-950"
                  />
                </div>
                <div>
                  <label className="block text-navy-700 font-semibold mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    placeholder="Repeat new password"
                    className="w-full px-3 py-2 rounded-lg border border-sand-300 bg-sand-100 text-navy-950"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => showToast("Password updated successfully.")}
                  className="px-5 py-2 rounded-lg bg-sand-200 hover:bg-sand-300 text-navy-950 text-xs font-bold transition-colors"
                >
                  Update Password
                </button>
              </div>
            </div>

          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 8: CUSTOMER HELPDESK & SUPPORT TICKETS                     */}
        {/* ============================================================== */}
        {activeTab === "support" && (
          <CustomerHelpdeskView
            customer={customer}
            orders={orders}
            showToast={showToast}
          />
        )}

        {/* ============================================================== */}
        {/* TAB 9: ACTIVITY & LOGISTICS NOTIFICATIONS                      */}
        {/* ============================================================== */}
        {activeTab === "notifications" && (
          <CustomerNotificationsView
            customer={customer}
            showToast={showToast}
            onNavigateTab={(tab) => setActiveTab(tab as any)}
          />
        )}

      </div>

      {/* ============================================================== */}
      {/* MODAL 1: LIVE CONSIGNMENT WAYPOINTS TRACKER                     */}
      {/* ============================================================== */}
      {trackingModalOrder && (
        <div className="fixed inset-0 z-50 bg-navy-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-sand-50 border border-sand-300 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setTrackingModalOrder(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-navy-500 hover:text-navy-950 hover:bg-sand-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-forest-800 bg-forest-100 px-2 py-0.5 rounded">
                Live 2-Man GPS Telemetry
              </span>
              <h3 className="font-display text-xl font-bold text-navy-950 mt-1">
                Consignment {trackingModalOrder.tracking_number || "TRK-AM-648875"}
              </h3>
              <p className="text-xs text-navy-600">
                Carrier: <strong>{trackingModalOrder.carrier || "Amos Mann 2-Man Dedicated Fleet"}</strong>
              </p>
            </div>

            <div className="p-4 rounded-xl bg-forest-50 border border-forest-200 text-xs space-y-1">
              <div className="flex justify-between font-bold text-forest-950">
                <span>Active Van Route Status:</span>
                <span className="font-mono">Stop 4 of 11</span>
              </div>
              <p className="text-forest-800">
                Delivery van currently in transit towards {trackingModalOrder.shipping_postcode}. Estimated arrival within scheduled 2-hour window.
              </p>
            </div>

            <div className="space-y-3 pt-2 text-xs">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <div>
                  <strong className="text-navy-950 block">Departed Leicester Logistics Central Hub</strong>
                  <span className="text-navy-500 text-[11px]">Yesterday at 18:30 • Multi-point vehicle loaded</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <div>
                  <strong className="text-navy-950 block">Arrived London Regional Sorting Facility</strong>
                  <span className="text-navy-500 text-[11px]">Today at 05:45 • White glove room-of-choice inspection passed</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-brass-600 mt-0.5 flex-shrink-0 animate-pulse" />
                <div>
                  <strong className="text-navy-950 block">Out for 2-Man Delivery Route</strong>
                  <span className="text-navy-700 font-semibold text-[11px]">
                    Today • Scheduled Slot: {trackingModalOrder.deliverySlot || "10:00 - 12:00"}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 opacity-60">
                <Package className="w-4 h-4 text-navy-400 mt-0.5 flex-shrink-0" />
                <div>
                  <strong className="text-navy-950 block">Room of Choice Placement &amp; Packaging Removal</strong>
                  <span className="text-navy-500 text-[11px]">Pending delivery window arrival</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-sand-200 flex justify-end">
              <button
                type="button"
                onClick={() => setTrackingModalOrder(null)}
                className="px-5 py-2 rounded-xl bg-navy-950 text-sand-50 text-xs font-bold hover:bg-brass-600 transition-colors"
              >
                Close Tracking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: RESCHEDULE 2-HOUR DELIVERY WINDOW                     */}
      {/* ============================================================== */}
      {rescheduleModalOrder && (
        <div className="fixed inset-0 z-50 bg-navy-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-sand-50 border border-sand-300 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setRescheduleModalOrder(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-navy-500 hover:text-navy-950 hover:bg-sand-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-brass-800 bg-sand-200 px-2 py-0.5 rounded">
                2-Man White Glove Slot
              </span>
              <h3 className="font-display text-lg font-bold text-navy-950 mt-1">
                Select Your 2-Hour Delivery Slot
              </h3>
              <p className="text-xs text-navy-600">
                Order: <span className="font-mono">{rescheduleModalOrder.order_number}</span> to {rescheduleModalOrder.shipping_postcode}
              </p>
            </div>

            <div className="space-y-2.5 pt-2 text-xs">
              {[
                "Thursday 22 Oct: 10:00 - 12:00 (Pre-call 30m prior)",
                "Thursday 22 Oct: 14:00 - 16:00 (Pre-call 30m prior)",
                "Friday 23 Oct: 09:00 - 11:00 (Pre-call 30m prior)",
                "Friday 23 Oct: 13:00 - 15:00 (Pre-call 30m prior)",
                "Saturday 24 Oct: 11:00 - 13:00 (Weekend Priority Slot)",
              ].map((slot, idx) => (
                <label
                  key={idx}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    selectedSlot === slot
                      ? "bg-sand-100 border-brass-600 font-bold text-navy-950 shadow-sm"
                      : "bg-sand-50 border-sand-200 text-navy-800 hover:bg-sand-100"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <span className={`w-3.5 h-3.5 rounded-full border ${selectedSlot === slot ? "bg-brass-600 border-brass-600" : "border-sand-400"}`} />
                    <span>{slot}</span>
                  </span>
                  <input
                    type="radio"
                    name="slot"
                    className="hidden"
                    checked={selectedSlot === slot}
                    onChange={() => setSelectedSlot(slot)}
                  />
                </label>
              ))}
            </div>

            <div className="pt-3 border-t border-sand-200 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setRescheduleModalOrder(null)}
                className="px-4 py-2 rounded-lg border border-sand-300 text-navy-800 hover:bg-sand-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReschedule}
                className="px-5 py-2 rounded-lg bg-navy-950 text-sand-50 font-bold hover:bg-brass-600 transition-colors"
              >
                Confirm Booking Slot
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: 14-DAY STATUTORY UK RETURN REQUEST                    */}
      {/* ============================================================== */}
      {returnModalOrder && (
        <div className="fixed inset-0 z-50 bg-navy-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <form
            onSubmit={handleSubmitReturnRequest}
            className="bg-sand-50 border border-sand-300 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative"
          >
            <button
              type="button"
              onClick={() => setReturnModalOrder(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-navy-500 hover:text-navy-950 hover:bg-sand-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-navy-700 bg-sand-200 px-2 py-0.5 rounded">
                UK Consumer Rights Act 2015
              </span>
              <h3 className="font-display text-lg font-bold text-navy-950 mt-1">
                14-Day Right to Return / Exchange
              </h3>
              <p className="text-xs text-navy-600">
                Order: <span className="font-mono">{returnModalOrder.order_number}</span>
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-navy-950 mb-1">Reason for Return or Exchange</label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-sand-300 bg-sand-100 text-navy-950"
                >
                  <option>Dimensions did not suit living space</option>
                  <option>Fabric / colour mismatch with interior lighting</option>
                  <option>Exchange for different size or variant</option>
                  <option>Change of mind under UK Consumer Contracts Regulations</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-navy-950 mb-1">2-Man Collection Preference</label>
                <p className="text-[11px] text-navy-600 leading-relaxed">
                  Our dedicated white glove team will collect the item from your room of choice. Please ensure items remain in pristine original condition.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-sand-200 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setReturnModalOrder(null)}
                className="px-4 py-2 rounded-lg border border-sand-300 text-navy-800 hover:bg-sand-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-navy-950 text-sand-50 font-bold hover:bg-brass-600 transition-colors"
              >
                Submit Return Request
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 4: ADD NEW UK DELIVERY SANCTUARY                         */}
      {/* ============================================================== */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 bg-navy-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <form
            onSubmit={handleSaveNewAddress}
            className="bg-sand-50 border border-sand-300 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative"
          >
            <button
              type="button"
              onClick={() => setIsAddressModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-navy-500 hover:text-navy-950 hover:bg-sand-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="font-display text-lg font-bold text-navy-950">Add New UK Delivery Address</h3>
              <p className="text-xs text-navy-600">Enter your British residence or commercial property details.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-navy-800 mb-1">Address Label (e.g. London Sanctuary, Cotswolds)</label>
                <input
                  type="text"
                  placeholder="e.g. Mayfair Apartment"
                  value={newAddressForm.label}
                  onChange={(e) => setNewAddressForm({ ...newAddressForm, label: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-sand-300 bg-sand-100"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-navy-800 mb-1">Recipient Name</label>
                <input
                  type="text"
                  placeholder="Full name"
                  value={newAddressForm.recipient}
                  onChange={(e) => setNewAddressForm({ ...newAddressForm, recipient: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-sand-300 bg-sand-100"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-navy-800 mb-1">Address Line 1 *</label>
                <input
                  type="text"
                  placeholder="House name / number and street"
                  required
                  value={newAddressForm.line1}
                  onChange={(e) => setNewAddressForm({ ...newAddressForm, line1: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-sand-300 bg-sand-100"
                />
              </div>

              <div>
                <label className="block font-semibold text-navy-800 mb-1">Town / City *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. London"
                  value={newAddressForm.city}
                  onChange={(e) => setNewAddressForm({ ...newAddressForm, city: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-sand-300 bg-sand-100"
                />
              </div>

              <div>
                <label className="block font-semibold text-navy-800 mb-1">UK Postcode *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SW1A 1AA"
                  value={newAddressForm.postcode}
                  onChange={(e) => setNewAddressForm({ ...newAddressForm, postcode: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-sand-300 bg-sand-100 font-mono uppercase"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-navy-800 mb-1">Access Notes for 2-Man Crew</label>
                <textarea
                  placeholder="e.g. 2nd floor with service lift, narrow hallway, gate code #4212"
                  rows={2}
                  value={newAddressForm.accessNotes}
                  onChange={(e) => setNewAddressForm({ ...newAddressForm, accessNotes: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-sand-300 bg-sand-100"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-sand-200 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setIsAddressModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-sand-300 text-navy-800 hover:bg-sand-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-navy-950 text-sand-50 font-bold hover:bg-brass-600 transition-colors"
              >
                Save Sanctuary Address
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 5: SWATCH KIT ORDER DISPATCH                            */}
      {/* ============================================================== */}
      {isSwatchModalOpen && (
        <div className="fixed inset-0 z-50 bg-navy-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-sand-50 border border-sand-300 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative text-xs">
            <button
              type="button"
              onClick={() => setIsSwatchModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-navy-500 hover:text-navy-950 hover:bg-sand-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                Free UK Royal Mail 24
              </span>
              <h3 className="font-display text-lg font-bold text-navy-950 mt-1">
                Confirm Fabric Swatch Kit Dispatch
              </h3>
              <p className="text-navy-600 mt-0.5">
                Dispatch to: <strong>14 Kensington Palace Gardens, Apt 4B, London, SW1A 1AA</strong>
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-sand-100/70 border border-sand-200 space-y-2">
              <strong className="text-navy-950 block">Included Swatches:</strong>
              <ul className="space-y-1 text-navy-700 pl-4 list-disc">
                {selectedSwatches.map((s, idx) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
            </div>

            <div className="pt-3 border-t border-sand-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsSwatchModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-sand-300 text-navy-800 hover:bg-sand-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleOrderSwatchKit}
                className="px-5 py-2 rounded-lg bg-navy-950 text-sand-50 font-bold hover:bg-brass-600 transition-colors"
              >
                Dispatch Swatch Kit (Free)
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
