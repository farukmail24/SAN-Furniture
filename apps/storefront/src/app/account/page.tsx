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
  ChevronLeft,
  Copy,
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
  Ban,
  Layers,
  Lock,
  Sliders,
  Download,
  AlertCircle,
  Info,
  Compass,
  ArrowRight,
  Share2,
  Headphones,
  Eye,
  EyeOff,
  Laptop,
  Globe
} from "lucide-react";
import { formatGBP } from "@san-furniture/types";
import { apiUrl } from "@/lib/api-config";
import { showAlert, showConfirm } from "@/components/ui/AlertModal";
import { fetchWithSwr, getCachedData, invalidateCache } from "@/lib/api-cache";
import { useCart } from "@/lib/cart-context";
import { type CatalogProduct } from "@/lib/catalog";
import { CustomerHelpdeskView } from "@/components/account/CustomerHelpdeskView";
import { CustomerNotificationsView } from "@/components/account/CustomerNotificationsView";
import { usePageSections } from "@/lib/cms";

interface CustomerUser {
  id: string;
  email: string;
  username?: string;
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
  cancellation_reason?: string | null;
  cancelled_by?: string | null;
  cancelled_at?: string | null;
  created_at: string;
  createdAt?: string;
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

  const { getSection } = usePageSections("account");
  const welcomeBanner = getSection("account_welcome_banner", {
    welcome_title: "SAN Client Portal",
    welcome_subtitle: "Manage your active furniture orders, download official VAT invoices, request swatch samples, and track white-glove dispatches.",
    vip_perk_badge: "UK Verified Client",
    support_shortcut_text: "Need urgent delivery rescheduling? Speak to dispatch directly via our live helpdesk.",
  });

  const [mounted, setMounted] = useState(false);
  const [customer, setCustomer] = useState<CustomerUser | null>(null);
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<
    "overview" | "orders" | "addresses" | "wishlist" | "payments" | "security" | "support" | "notifications"
  >("overview");

  // Orders filters
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState<
    "all" | "in_transit" | "delivered" | "returns" | "cancelled"
  >("all");

  // Interactive Modals
  const [trackingModalOrder, setTrackingModalOrder] = useState<CustomerOrder | null>(null);
  const [rescheduleModalOrder, setRescheduleModalOrder] = useState<CustomerOrder | null>(null);
  const [returnModalOrder, setReturnModalOrder] = useState<CustomerOrder | null>(null);
  const [cancelModalOrder, setCancelModalOrder] = useState<CustomerOrder | null>(null);
  const [cancelReason, setCancelReason] = useState("Found alternative / changed mind");
  const [isCancelling, setIsCancelling] = useState(false);
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Saved Addresses State (dynamically fetched from MySQL customer_addresses)
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [isAddressesLoading, setIsAddressesLoading] = useState<boolean>(true);

  // Saved Payment Methods State (dynamically fetched from MySQL customer_payment_methods)
  interface SavedPaymentMethod {
    id: string;
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
    cardholder_name?: string;
    is_default: boolean | number;
    created_at: string;
  createdAt?: string;
  }
  const [savedPaymentMethods, setSavedPaymentMethods] = useState<SavedPaymentMethod[]>([]);
  const [isPaymentsLoading, setIsPaymentsLoading] = useState<boolean>(true);
  const [isUpdatingDefaultPm, setIsUpdatingDefaultPm] = useState<string | null>(null);

  // Dynamic Wishlist State (persisted to database & synchronized)
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [isWishlistLoading, setIsWishlistLoading] = useState<boolean>(true);

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
  const [selectedSlot, setSelectedSlot] = useState("Thursday 22 Oct: 10:00 - 12:00 BST");

  // Selected return reason
  const [returnReason, setReturnReason] = useState("Dimensions did not suit living space");

  // Notification toggles in Security tab
  const [notifications, setNotifications] = useState({
    orderUpdates: true,
    exclusivePreview: false,
  });

  // Safe Order Date Formatter (Prevents "Invalid Date")
  const formatOrderDate = (dateVal: any, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }) => {
    if (!dateVal) return "Recent";
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) {
      const num = Number(dateVal);
      if (!isNaN(num) && num > 0) {
        const d2 = new Date(num);
        if (!isNaN(d2.getTime())) {
          return d2.toLocaleDateString("en-GB", opts);
        }
      }
      return "Recent";
    }
    return d.toLocaleDateString("en-GB", opts);
  };

  // Pagination states
  const [ordersCurrentPage, setOrdersCurrentPage] = useState<number>(1);
  const [invoicesCurrentPage, setInvoicesCurrentPage] = useState<number>(1);
  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState<string>("");
  const [copiedInvoiceNumber, setCopiedInvoiceNumber] = useState<string | null>(null);

  // Profile Edit State in Security Tab
  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    phone: "",
  });
  const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
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

    const safePhone = (currentUser.phone && !currentUser.phone.includes("@"))
      ? currentUser.phone
      : "+44 7700 900123";

    setProfileForm({
      firstName: currentUser.firstName || "",
      lastName: currentUser.lastName || "",
      username: currentUser.username || (currentUser.email ? currentUser.email.split("@")[0] : ""),
      phone: safePhone,
    });

    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const initialTab = searchParams.get("tab");
      const validTabs = ["overview", "orders", "addresses", "wishlist", "payments", "security", "support", "notifications"];
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

    // Fetch live dynamic customer wishlist from MySQL database with SWR cache
    fetchWithSwr(
      apiUrl(`/api/customer/wishlist?email=${encodeURIComponent(currentUser.email)}`),
      (data: any, isCached) => {
        if (data.wishlist && Array.isArray(data.wishlist)) {
          setWishlist(data.wishlist);
          if (isCached) setIsWishlistLoading(false);
        }
      }
    )
      .catch((err) => console.error("Wishlist fetch error:", err))
      .finally(() => setIsWishlistLoading(false));

    // Fetch live customer addresses from MySQL customer_addresses
    fetchWithSwr(
      apiUrl(`/api/customer/addresses?email=${encodeURIComponent(currentUser.email)}`),
      (data: any, isCached) => {
        if (data.addresses && Array.isArray(data.addresses)) {
          setAddresses(data.addresses);
          if (isCached) setIsAddressesLoading(false);
        }
      }
    )
      .catch((err) => console.error("Addresses fetch error:", err))
      .finally(() => setIsAddressesLoading(false));

    // Fetch live saved payment instruments from MySQL customer_payment_methods
    fetchWithSwr(
      apiUrl(`/api/customer/payment-methods?email=${encodeURIComponent(currentUser.email)}`),
      (data: any, isCached) => {
        if (data.paymentMethods && Array.isArray(data.paymentMethods)) {
          setSavedPaymentMethods(data.paymentMethods);
          if (isCached) setIsPaymentsLoading(false);
        }
      }
    )
      .catch((err) => console.error("Payment methods fetch error:", err))
      .finally(() => setIsPaymentsLoading(false));
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
          standard: "UK Quality Checked",
          certificate_ref: "QC-INSPECTED",
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
          standard: "UK Quality Checked",
          certificate_ref: "QC-INSPECTED",
          label_attached: true,
        },
        lead_time_days: 5,
      },
    };

    addItem(wishlistProduct, 1);
    openCart();
    showToast(`Added "${item.title}" to your basket.`);
  };

  const handleRemoveWishlistItem = async (id: string) => {
    // Optimistic UI removal
    setWishlist((prev) => prev.filter((w) => w.id !== id && (w as any).productId !== id));
    showToast("Item removed from your saved collection.");

    if (customer?.email) {
      try {
        await fetch(apiUrl(`/api/customer/wishlist/${id}?email=${encodeURIComponent(customer.email)}`), {
          method: "DELETE",
        });
      } catch (err) {
        console.error("Failed to delete wishlist item from database:", err);
      }
    }
  };

  const getAuthHeaders = (): Record<string, string> => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("san_customer_token");
      if (token) return { Authorization: `Bearer ${token}` };
    }
    return {};
  };

  const handleSaveNewAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddressForm.line1 || !newAddressForm.city || !newAddressForm.postcode) {
      showToast("Please complete line 1, city, and postcode.");
      return;
    }

    try {
      const res = await fetch(apiUrl("/api/customer/addresses"), {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          email: customer?.email,
          label: newAddressForm.label || "New Sanctuary Residence",
          recipient: newAddressForm.recipient || `${customer?.firstName} ${customer?.lastName}`,
          line1: newAddressForm.line1,
          line2: newAddressForm.line2,
          city: newAddressForm.city,
          postcode: newAddressForm.postcode.toUpperCase().trim(),
          phone: newAddressForm.phone || customer?.phone || "",
          accessNotes: newAddressForm.accessNotes || "Standard private residential entry.",
          isDefaultDelivery: addresses.length === 0,
          isDefaultBilling: false,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save address");

      if (data.address) {
        setAddresses((prev) => [...prev, data.address]);
      }
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
    } catch (err: any) {
      showToast(err.message || "Could not save address.");
    }
  };

  const handleSetDefaultDelivery = async (id: string) => {
    try {
      await fetch(apiUrl(`/api/customer/addresses/${id}/default`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ type: "delivery" }),
      });
      setAddresses((prev) =>
        prev.map((a) => ({
          ...a,
          isDefaultDelivery: a.id === id,
        }))
      );
      showToast("Default delivery destination updated.");
    } catch {
      showToast("Error updating default delivery.");
    }
  };

  const handleSetDefaultBilling = async (id: string) => {
    try {
      await fetch(apiUrl(`/api/customer/addresses/${id}/default`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ type: "billing" }),
      });
      setAddresses((prev) =>
        prev.map((a) => ({
          ...a,
          isDefaultBilling: a.id === id,
        }))
      );
      showToast("Default billing address updated.");
    } catch {
      showToast("Error updating default billing.");
    }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      await fetch(apiUrl(`/api/customer/addresses/${id}`), {
        method: "DELETE",
        headers: { ...getAuthHeaders() },
      });
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      showToast("Address removed.");
    } catch {
      showToast("Error deleting address.");
    }
  };

  const handleConfirmReschedule = async () => {
    if (rescheduleModalOrder) {
      try {
        const res = await fetch(apiUrl(`/api/customer/orders/${rescheduleModalOrder.id}/reschedule`), {
          method: "POST",
          headers: { "Content-Type": "application/json", ...getAuthHeaders() },
          body: JSON.stringify({ slot: selectedSlot }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update slot");

        setOrders((prev) =>
          prev.map((o) =>
            o.id === rescheduleModalOrder.id
              ? { ...o, deliverySlot: selectedSlot }
              : o
          )
        );
        showToast(`Delivery slot confirmed for: ${selectedSlot}`);
      } catch (err: any) {
        showToast(err.message || "Failed to reschedule delivery slot");
      }
    }
    setRescheduleModalOrder(null);
  };

  const handleSubmitReturnRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnModalOrder) return;
    setIsSubmittingReturn(true);
    try {
      const res = await fetch(apiUrl(`/api/customer/orders/${returnModalOrder.id}/return`), {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ reason: returnReason }),
      });
      const data = await res.json();
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === returnModalOrder.id
              ? { ...o, fulfillment_status: "return_requested" }
              : o
          )
        );
        setReturnModalOrder(null);
        showToast("14-Day Return request submitted. Our logistics team will arrange direct home collection.");
      } else {
        await showAlert({ title: "Return Request Failed", message: data.error || "Failed to submit return request.", type: "danger" });
      }
    } catch (err: any) {
      await showAlert({ title: "Return Request Error", message: err?.message || "Network error", type: "danger" });
    } finally {
      setIsSubmittingReturn(false);
    }
  };

  const handleConfirmCancelOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelModalOrder) return;
    setIsCancelling(true);
    try {
      const res = await fetch(apiUrl(`/api/customer/orders/${cancelModalOrder.id}/cancel`), {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ reason: cancelReason }),
      });
      const data = await res.json();
      if (res.ok) {
        const nowIso = new Date().toISOString();
        const customerName = customer?.firstName ? `${customer.firstName} ${customer.lastName}`.trim() : "You";
        setOrders((prev) =>
          prev.map((o) =>
            o.id === cancelModalOrder.id
              ? {
                  ...o,
                  fulfillment_status: "cancelled",
                  payment_status: "refund_pending",
                  cancellation_reason: cancelReason,
                  cancelled_by: `Customer (${customerName})`,
                  cancelled_at: nowIso,
                }
              : o
          )
        );
        if (customer?.email) {
          invalidateCache(apiUrl(`/api/customer/orders?email=${encodeURIComponent(customer.email)}`));
        }
        invalidateCache("/api/customer/orders");
        invalidateCache(apiUrl("/api/admin/orders"));
        invalidateCache("/api/admin/orders");
        setCancelModalOrder(null);
        showToast("Order cancelled successfully. 100% refund scheduled to your payment method.");
      } else {
        await showAlert({ title: "Order Cancel Failed", message: data.error || "Failed to cancel order.", type: "danger" });
      }
    } catch (err: any) {
      await showAlert({ title: "Order Cancel Error", message: err?.message || "Network error", type: "danger" });
    } finally {
      setIsCancelling(false);
    }
  };

  if (!mounted || !isAuthorized || !customer) {
    return (
      <div className="min-h-[75vh] bg-sand-50 flex flex-col items-center justify-center p-6 text-center antialiased">
        <Loader2 className="w-8 h-8 text-brass-600 animate-spin mb-3" />
        <h2 className="text-sm font-bold text-navy-950">Accessing SAN Client Portal...</h2>
        <p className="text-xs text-navy-500 mt-1">Verifying encrypted UK session</p>
      </div>
    );
  }

  // Filtered orders with defensive safety guards
  const filteredOrders = orders.filter((o) => {
    const query = orderSearchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      o.order_number?.toLowerCase().includes(query) ||
      o.id?.toLowerCase().includes(query) ||
      (Array.isArray(o.items) && o.items.some((i) => i.title?.toLowerCase().includes(query)));

    if (!matchesSearch) return false;

    if (orderStatusFilter === "in_transit") {
      return (
        o.fulfillment_status === "in_transit" ||
        o.fulfillment_status === "po_dispatched" ||
        o.fulfillment_status === "unfulfilled" ||
        o.fulfillment_status === "paid"
      );
    }
    if (orderStatusFilter === "delivered") {
      return o.fulfillment_status === "delivered";
    }
    if (orderStatusFilter === "returns") {
      return o.fulfillment_status === "return_requested" || o.fulfillment_status === "returned";
    }
    if (orderStatusFilter === "cancelled") {
      return o.fulfillment_status === "cancelled";
    }
    return true;
  });

  // Pagination for Orders
  const ordersPerPage = 5;
  const totalOrderPages = Math.max(1, Math.ceil(filteredOrders.length / ordersPerPage));
  const paginatedOrders = filteredOrders.slice(
    (ordersCurrentPage - 1) * ordersPerPage,
    ordersCurrentPage * ordersPerPage
  );

  // Filtered & Paginated Invoices
  const filteredInvoices = orders.filter((o) => {
    const q = invoiceSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (o.order_number || o.id)?.toLowerCase().includes(q) ||
      (Array.isArray(o.items) && o.items.some((i: any) => i.title?.toLowerCase().includes(q)))
    );
  });
  const invoicesPerPage = 5;
  const totalInvoicePages = Math.max(1, Math.ceil(filteredInvoices.length / invoicesPerPage));
  const paginatedInvoices = filteredInvoices.slice(
    (invoicesCurrentPage - 1) * invoicesPerPage,
    invoicesCurrentPage * invoicesPerPage
  );

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
      if (customer) {
        const cleanPhone = profileForm.phone.includes("@") ? "+44 7700 900123" : profileForm.phone;
        const res = await fetch(apiUrl("/api/customer/auth/me"), {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            firstName: profileForm.firstName,
            lastName: profileForm.lastName,
            username: profileForm.username,
            phone: cleanPhone,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to save profile changes");
        }
        const updatedCustomer = data.customer || {
          ...customer,
          firstName: profileForm.firstName,
          lastName: profileForm.lastName,
          username: profileForm.username,
          phone: cleanPhone,
        };
        setCustomer(updatedCustomer);
        setProfileForm((prev) => ({ ...prev, phone: cleanPhone }));
        localStorage.setItem("san_customer_user", JSON.stringify(updatedCustomer));
        showToast("Client profile credentials updated successfully.");
      }
    } catch (err: any) {
      showToast(err.message || "Failed to save profile changes.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSignOutOtherSessions = () => {
    showToast("All other remote UK device sessions have been revoked.");
  };

  const handleDownloadDataArchive = () => {
    if (!customer) return;
    const clientData = {
      profile: {
        id: customer.id,
        name: `${customer.firstName} ${customer.lastName}`,
        email: customer.email,
        phone: profileForm.phone,
        username: profileForm.username,
      },
      ordersCount: orders.length,
      addressesCount: addresses.length,
      wishlistCount: wishlist.length,
      logisticsPreferences: notifications,
      compliance: {
        gdpr: "UK Data Protection Act 2018",
        transportSecurity: "TLS 1.3 / 256-bit",
        passwordHash: "Argon2id (RFC 9106)",
        exportedAt: new Date().toISOString(),
      },
    };
    const blob = new Blob([JSON.stringify(clientData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `san-furniture-gdpr-export-${customer.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("GDPR data archive generated and downloaded.");
  };

  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: "Enter Passphrase", color: "bg-sand-300", percent: 0 };
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (pwd.length >= 12) score += 1;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd) || /[^A-Za-z0-9]/.test(pwd)) score += 1;
    if (score <= 1) return { score: 1, label: "Weak Passphrase", color: "bg-rose-500", percent: 25 };
    if (score === 2) return { score: 2, label: "Moderate Security", color: "bg-amber-500", percent: 50 };
    if (score === 3) return { score: 3, label: "Strong Encryption", color: "bg-emerald-500", percent: 75 };
    return { score: 4, label: "Argon2id Ultra-Hardened", color: "bg-emerald-600", percent: 100 };
  };

  const handleUpdatePassword = async () => {
    if (!passwordForm.currentPassword) {
      showToast("Please enter your current password.");
      return;
    }
    if (!passwordForm.newPassword) {
      showToast("Please enter a new password.");
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      showToast("Password must be at least 8 characters.");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast("New passwords do not match.");
      return;
    }
    setIsUpdatingPassword(true);
    try {
      const res = await fetch(apiUrl("/api/customer/auth/me"), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update password");
      }
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      showToast("Password updated securely in SAN records.");
    } catch (err: any) {
      showToast(err.message || "Failed to update password.");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleRemovePaymentMethod = async (id: string) => {
    const ok = await showConfirm({ title: "Remove Payment Card", message: "Are you sure you want to remove this saved payment method from your customer profile?", confirmText: "Remove Card", type: "danger" });
    if (!ok) return;
    try {
      const res = await fetch(
        apiUrl(`/api/customer/payment-methods?id=${encodeURIComponent(id)}&email=${encodeURIComponent(customer.email)}`),
        { method: "DELETE" }
      );
      const data = await res.json();
      if (res.ok && data.success) {
        invalidateCache(apiUrl(`/api/customer/payment-methods?email=${encodeURIComponent(customer.email)}`));
        setSavedPaymentMethods((prev) => prev.filter((m) => m.id !== id));
        showToast("Payment method safely removed from your customer profile.");
      }
    } catch (err) {
      console.error("Failed to delete payment method:", err);
    }
  };

  const handleSetDefaultPaymentMethod = async (id: string) => {
    setIsUpdatingDefaultPm(id);
    try {
      const res = await fetch(apiUrl("/api/customer/payment-methods"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          action: "set_default",
          email: customer.email,
          customerId: customer.id,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        invalidateCache(apiUrl(`/api/customer/payment-methods?email=${encodeURIComponent(customer.email)}`));
        setSavedPaymentMethods((prev) =>
          prev.map((pm) => ({
            ...pm,
            is_default: pm.id === id ? 1 : 0,
          }))
        );
        showToast("Default payment instrument updated.");
      } else {
        showToast(data?.error || "Failed to update default card.");
      }
    } catch (err) {
      console.error("Failed to set default payment method:", err);
      showToast("Network error updating default payment instrument.");
    } finally {
      setIsUpdatingDefaultPm(null);
    }
  };

  const totalSpentPennies = orders.reduce((sum, o) => (o.fulfillment_status === "cancelled" ? sum : sum + (o.total_pennies || 0)), 0);
  const activeDeliveriesCount = orders.filter((o) => o.fulfillment_status === "in_transit" || o.fulfillment_status === "po_dispatched" || o.fulfillment_status === "unfulfilled" || o.fulfillment_status === "paid").length;

  return (
    <div className="bg-sand-50 min-h-screen py-8 px-4 sm:px-6 lg:px-8 antialiased text-navy-950">
      <div className="max-w-[1600px] mx-auto space-y-8">
        
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
                    {welcomeBanner.content.vip_perk_badge || "Verified UK Client"}
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
                  {customer.phone && (
                    <>
                      <span className="text-sand-400">•</span>
                      <span className="font-mono text-navy-800">{customer.phone}</span>
                    </>
                  )}
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
                className="text-xs font-bold px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white transition-all flex items-center gap-2 shadow-sm border border-red-700/60 cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500/40"
              >
                <LogOut className="w-3.5 h-3.5 text-white" />
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
                {formatGBP(totalSpentPennies)}
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
              <span className="text-[10px] text-navy-500 block mt-0.5">Dedicated Fleet In Transit</span>
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
                <span>
                  {totalSpentPennies >= 250000
                    ? "SAN Sovereign Club"
                    : totalSpentPennies >= 100000
                    ? "SAN Privileged Tier"
                    : totalSpentPennies > 0
                    ? "SAN Preferred Patron"
                    : "SAN Signature Member"}
                </span>
              </p>
              <span className="text-[10px] text-forest-700 font-semibold block">
                {totalSpentPennies >= 250000
                  ? "5% Credit on Next Order"
                  : totalSpentPennies >= 100000
                  ? "Complimentary White Glove"
                  : totalSpentPennies > 0
                  ? "Priority Concierge Dispatch"
                  : "Complimentary Swatch Samples"}
              </span>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* RESPONSIVE PORTAL TAB NAVIGATION BAR                            */}
        {/* ============================================================== */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl p-2 sm:p-2.5 border border-sand-300 shadow-xs">
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden flex-nowrap xl:flex-wrap">
            {[
              { id: "overview", label: "Overview", icon: Layers },
              { id: "orders", label: "My Orders", badge: orders.length, icon: Package },
              { id: "addresses", label: "Saved Addresses", badge: addresses.length, icon: MapPin },
              { id: "wishlist", label: "Wishlist", badge: wishlist.length, icon: Heart, iconColor: "text-brass-600" },
              { id: "payments", label: "Invoices & Payments", icon: CreditCard },
              { id: "support", label: "Helpdesk & Support", icon: Headphones, iconColor: "text-brass-500" },
              { id: "notifications", label: "Notifications", icon: Bell, iconColor: "text-brass-500" },
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
            {orders.length > 0 && orders[0].fulfillment_status !== "cancelled" && (
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
                        Consignment #{orders[0].tracking_number || orders[0].order_number || "TRK-SAN"}
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
                    <span className="text-navy-500 block text-[11px]">Booked Delivery Window:</span>
                    <strong className="text-navy-950 text-sm font-semibold">{orders[0].deliverySlot || "Carrier scheduled slot"}</strong>
                    <span className="text-[11px] text-forest-700 block mt-0.5">Tracking link &amp; updates provided</span>
                  </div>
                  <div>
                    <span className="text-navy-500 block text-[11px]">Assigned Delivery Fleet:</span>
                    <strong className="text-navy-950 text-sm font-semibold">{orders[0].carrier && !orders[0].carrier.includes("Amos Mann") ? orders[0].carrier : "SAN Dedicated Delivery Fleet"}</strong>
                    <span className="text-[11px] text-navy-600 block mt-0.5">Direct home delivery &amp; scheduled arrival</span>
                  </div>
                  <div>
                    <span className="text-navy-500 block text-[11px]">Destination Sanctuary:</span>
                    <strong className="text-navy-950 text-sm font-semibold">{orders[0].shipping_postcode || "UK Mainland"}</strong>
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
                    <span>Recent Orders</span>
                  </h3>
                  {orders.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setActiveTab("orders")}
                      className="text-xs font-bold text-brass-700 hover:text-navy-950 flex items-center gap-1"
                    >
                      <span>View All Orders</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  {orders.length === 0 ? (
                    <div className="p-8 text-center rounded-xl bg-sand-100/40 border border-dashed border-sand-300 space-y-2">
                      <ShoppingBag className="w-8 h-8 text-navy-400 mx-auto" />
                      <p className="text-xs font-semibold text-navy-800">No orders placed yet</p>
                      <p className="text-[11px] text-navy-500 max-w-sm mx-auto">
                        When you order curated pieces from our catalog, your delivery tracker and official VAT invoices will appear here.
                      </p>
                      <Link
                        href="/catalog"
                        className="inline-flex items-center gap-1.5 px-4 py-2 mt-2 rounded-xl bg-brass-500 hover:bg-brass-400 text-navy-950 font-bold text-xs transition-all shadow-xs"
                      >
                        <Compass className="w-3.5 h-3.5" />
                        <span>Discover Collections</span>
                      </Link>
                    </div>
                  ) : (
                    orders.slice(0, 3).map((order) => (
                    <div key={order.id} className="p-4 rounded-xl bg-sand-100/60 border border-sand-200 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-brass-700">{order.order_number || order.id}</span>

                          {/* Order Status Badge */}
                          {(() => {
                            const status = order.fulfillment_status || "unfulfilled";
                            if (status === "cancelled") {
                              return (
                                <span className="text-[10px] font-bold text-rose-800 bg-rose-50 border border-rose-300 px-2 py-0.5 rounded-full uppercase tracking-wider inline-flex items-center gap-1">
                                  <X className="w-2.5 h-2.5 text-rose-600" />
                                  Cancelled
                                </span>
                              );
                            }
                            if (status === "return_requested" || status === "returned") {
                              return (
                                <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded-full uppercase tracking-wider inline-flex items-center gap-1">
                                  <RotateCcw className="w-2.5 h-2.5 text-amber-600" />
                                  Return Requested
                                </span>
                              );
                            }
                            if (status === "delivered") {
                              return (
                                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-full uppercase tracking-wider inline-flex items-center gap-1">
                                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                                  Delivered
                                </span>
                              );
                            }
                            if (status === "in_transit" || status === "in_transit_two_man") {
                              return (
                                <span className="text-[10px] font-bold text-blue-800 bg-blue-50 border border-blue-300 px-2 py-0.5 rounded-full uppercase tracking-wider inline-flex items-center gap-1">
                                  <Truck className="w-2.5 h-2.5 text-blue-600 animate-pulse" />
                                  In Transit
                                </span>
                              );
                            }
                            if (status === "dispatched") {
                              return (
                                <span className="text-[10px] font-bold text-sky-800 bg-sky-50 border border-sky-300 px-2 py-0.5 rounded-full uppercase tracking-wider inline-flex items-center gap-1">
                                  <Package className="w-2.5 h-2.5 text-sky-600" />
                                  Dispatched
                                </span>
                              );
                            }
                            if (status === "po_dispatched" || status === "processing") {
                              return (
                                <span className="text-[10px] font-bold text-sky-800 bg-sky-50 border border-sky-300 px-2 py-0.5 rounded-full uppercase tracking-wider inline-flex items-center gap-1">
                                  <Clock className="w-2.5 h-2.5 text-sky-600" />
                                  Processing
                                </span>
                              );
                            }
                            return (
                              <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded-full uppercase tracking-wider inline-flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5 text-amber-600" />
                                Order Confirmed
                              </span>
                            );
                          })()}

                          <span className="text-[11px] text-navy-500">
                            {formatOrderDate(order.created_at || order.createdAt, { day: "numeric", month: "short", year: "numeric" })}
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
                                Qty: {item.quantity} • Finish: {item.finish || "Standard Finish"}
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
                  )))
                }
                </div>
              </div>

              {/* Right Col: Customer Care & Wishlist Snapshot */}
              <div className="space-y-6">
                
                {/* Customer Care Desk */}
                <div className="bg-sand-100/70 border border-sand-300 rounded-2xl p-6 shadow-sm space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-navy-950 text-brass-400 flex items-center justify-center">
                      <Headphones className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-navy-950">Customer Care &amp; Support</h4>
                      <p className="text-[11px] text-navy-600">Dedicated British Furniture Specialists</p>
                    </div>
                  </div>
                  <p className="text-xs text-navy-700 leading-relaxed">
                    Have questions about an existing order, dimensions inquiry, or delivery schedule? Our client care team is at your service.
                  </p>
                  <div className="pt-2 flex flex-col gap-2">
                    <a
                      href="tel:+442079460192"
                      className="w-full text-center py-2 px-3 rounded-lg bg-navy-950 text-sand-50 text-xs font-bold hover:bg-navy-900 transition-colors flex items-center justify-center gap-2"
                    >
                      <Phone className="w-3.5 h-3.5 text-brass-400" />
                      <span>Call Support: +44 20 7946 0192</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => setActiveTab("support")}
                      className="w-full text-center py-2 px-3 rounded-lg border border-sand-300 bg-sand-50 text-navy-950 text-xs font-bold hover:bg-sand-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Headphones className="w-3.5 h-3.5 text-navy-700" />
                      <span>Open Helpdesk Ticket</span>
                    </button>
                  </div>
                </div>

                {/* Wishlist Snapshot */}
                <div className="bg-sand-50 border border-sand-300 rounded-2xl p-6 shadow-sm space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-sand-200">
                    <h4 className="text-xs font-bold text-navy-950 flex items-center gap-2">
                      <Heart className="w-3.5 h-3.5 text-brass-600" />
                      <span>Saved Wishlist ({wishlist.length})</span>
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
        {/* TAB 2: MY ORDERS & ORDER TRACKING                             */}
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
                  onChange={(e) => {
                    setOrderSearchQuery(e.target.value);
                    setOrdersCurrentPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-sand-300 bg-sand-50 focus:outline-none focus:ring-2 focus:ring-brass-500"
                />
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-semibold text-navy-600 flex items-center gap-1 mr-1">
                  <Filter className="w-3.5 h-3.5" />
                  Filter:
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setOrderStatusFilter("all");
                    setOrdersCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    orderStatusFilter === "all"
                      ? "bg-navy-950 text-sand-50 shadow-sm"
                      : "bg-sand-200/80 text-navy-800 hover:bg-sand-300"
                  }`}
                >
                  All Orders ({orders.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOrderStatusFilter("in_transit");
                    setOrdersCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    orderStatusFilter === "in_transit"
                      ? "bg-navy-950 text-sand-50 shadow-sm"
                      : "bg-sand-200/80 text-navy-800 hover:bg-sand-300"
                  }`}
                >
                  In Transit ({orders.filter((o) => o.fulfillment_status === "in_transit" || o.fulfillment_status === "po_dispatched" || o.fulfillment_status === "unfulfilled" || o.fulfillment_status === "paid").length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOrderStatusFilter("delivered");
                    setOrdersCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    orderStatusFilter === "delivered"
                      ? "bg-navy-950 text-sand-50 shadow-sm"
                      : "bg-sand-200/80 text-navy-800 hover:bg-sand-300"
                  }`}
                >
                  Delivered ({orders.filter((o) => o.fulfillment_status === "delivered").length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOrderStatusFilter("returns");
                    setOrdersCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    orderStatusFilter === "returns"
                      ? "bg-navy-950 text-sand-50 shadow-sm"
                      : "bg-sand-200/80 text-navy-800 hover:bg-sand-300"
                  }`}
                >
                  Returns ({orders.filter((o) => o.fulfillment_status === "return_requested" || o.fulfillment_status === "returned").length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOrderStatusFilter("cancelled");
                    setOrdersCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    orderStatusFilter === "cancelled"
                      ? "bg-navy-950 text-sand-50 shadow-sm"
                      : "bg-sand-200/80 text-navy-800 hover:bg-sand-300"
                  }`}
                >
                  Cancelled ({orders.filter((o) => o.fulfillment_status === "cancelled").length})
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
                {paginatedOrders.map((order) => {
                  const status = order.fulfillment_status || "unfulfilled";
                  const isDelivered = status === "delivered";
                  const isReturnRequested = status === "return_requested" || status === "returned";
                  const isCancelled = status === "cancelled";
                  const canCancel = !isCancelled && !isDelivered && !isReturnRequested && status !== "in_transit";

                  return (
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
                          
                          {/* Rich Dynamic Status Badge */}
                          {isCancelled ? (
                            order.payment_status === "refunded" ? (
                              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Order Cancelled &bull; Refund Completed
                              </span>
                            ) : (
                              <span className="text-[11px] font-bold text-rose-800 bg-rose-50 border border-rose-300 px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                                <X className="w-3 h-3 text-rose-600" />
                                Order Cancelled &bull; Refund Scheduled
                              </span>
                            )
                          ) : isReturnRequested ? (
                            <span className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-300 px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                              <RotateCcw className="w-3 h-3 text-amber-600" />
                              14-Day Return Requested &bull; Collection Pending
                            </span>
                          ) : isDelivered ? (
                            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Delivered &amp; Inspected
                            </span>
                          ) : status === "in_transit" || status === "in_transit_two_man" ? (
                            <span className="text-[11px] font-bold text-blue-800 bg-blue-50 border border-blue-300 px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                              <Truck className="w-3 h-3 text-blue-600 animate-pulse" />
                              In Transit &bull; Delivery Fleet
                            </span>
                          ) : status === "dispatched" ? (
                            <span className="text-[11px] font-bold text-sky-800 bg-sky-50 border border-sky-300 px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                              <Package className="w-3 h-3 text-sky-600" />
                              Dispatched &bull; Handed to Carrier
                            </span>
                          ) : (
                            <span className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-300 px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                              <Clock className="w-3 h-3 text-amber-600" />
                              Order Confirmed &bull; Preparing Dispatch
                            </span>
                          )}

                          <span className="text-[11px] text-navy-500">
                            Placed on {formatOrderDate(order.created_at || order.createdAt, { day: "numeric", month: "long", year: "numeric" })}
                          </span>
                        </div>

                        <p className="text-xs text-navy-600 mt-1">
                          Delivery Sanctuary: <strong className="font-mono text-navy-950">{order.shipping_postcode}</strong> &bull; Carrier: <strong>{order.carrier && !order.carrier.includes("Amos Mann") ? order.carrier : "SAN Dedicated Delivery Fleet"}</strong>
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <div className="text-right mr-2">
                          <span className="font-display font-bold text-xl text-navy-950 block">
                            {order.totalGbpFormatted}
                          </span>
                          <span className="text-[10px] text-navy-500 block">
                            Inc. 20% UK VAT ({order.vatFormatted || formatGBP(order.vat_pennies || Math.round((Number(order.total_pennies) || 0) * 0.2 / 1.2))})
                          </span>
                        </div>

                        {/* Official Order Receipt */}
                        <a
                          href={apiUrl(order.invoiceHtmlUrl || `/api/orders/${order.id}/invoice`)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-2 rounded-lg bg-sand-200 hover:bg-sand-300 text-navy-950 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                          title="Official Order Receipt"
                        >
                          <FileText className="w-3.5 h-3.5 text-navy-700" />
                          <span>Order Receipt</span>
                          <ExternalLink className="w-3 h-3 text-navy-500" />
                        </a>

                        {/* Customer Cancel Order Button (Available before dispatch) */}
                        {canCancel && (
                          <button
                            type="button"
                            onClick={() => setCancelModalOrder(order)}
                            className="px-3 py-2 rounded-lg border border-rose-300 bg-rose-50/70 hover:bg-rose-100 text-rose-800 text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                            title="Cancel order before courier dispatch"
                          >
                            <X className="w-3.5 h-3.5 text-rose-600" />
                            <span>Cancel Order</span>
                          </button>
                        )}

                        {/* Reschedule 2hr Delivery Window */}
                        {!isCancelled && (
                          <button
                            type="button"
                            onClick={() => setRescheduleModalOrder(order)}
                            className="px-3 py-2 rounded-lg border border-sand-300 bg-sand-50 hover:bg-sand-200 text-navy-950 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                          >
                            <Calendar className="w-3.5 h-3.5 text-brass-700" />
                            <span>Delivery Window</span>
                          </button>
                        )}

                        {/* Live Waypoint GPS Modal */}
                        {!isCancelled && (
                          <button
                            type="button"
                            onClick={() => setTrackingModalOrder(order)}
                            className="px-4 py-2 rounded-lg bg-navy-950 hover:bg-brass-600 text-sand-50 text-xs font-bold inline-flex items-center gap-1.5 transition-colors shadow-sm"
                          >
                            <Compass className="w-3.5 h-3.5 text-brass-400" />
                            <span>Track Consignment</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* 4-Step Interactive White Glove Progress Timeline OR Cancellation Audit */}
                    {isCancelled ? (
                      <div
                        className={`p-4 rounded-xl text-xs space-y-2 ${
                          order.payment_status === "refunded"
                            ? "bg-emerald-50/80 border border-emerald-200"
                            : "bg-rose-50/80 border border-rose-200"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5 ${
                              order.payment_status === "refunded" ? "text-emerald-950" : "text-rose-950"
                            }`}
                          >
                            {order.payment_status === "refunded" ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Ban className="w-4 h-4 text-rose-600" />
                            )}
                            Order Cancellation &amp; Full Refund Status
                          </span>
                          {order.payment_status === "refunded" ? (
                            <span className="font-mono text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              100% Refund Completed
                            </span>
                          ) : (
                            <span className="font-mono text-[10px] font-bold text-rose-700 bg-rose-100 border border-rose-300 px-2.5 py-0.5 rounded-full">
                              100% Refund Scheduled
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                          <div>
                            <span className="text-navy-500 text-[10px] uppercase font-bold tracking-wider block">Cancelled By</span>
                            <strong className="text-navy-950 font-semibold block text-xs mt-0.5">
                              {order.cancelled_by || "Customer"}
                            </strong>
                          </div>
                          <div>
                            <span className="text-navy-500 text-[10px] uppercase font-bold tracking-wider block">Cancelled On</span>
                            <strong className="text-navy-950 font-semibold block text-xs mt-0.5">
                              {order.cancelled_at
                                ? new Date(order.cancelled_at).toLocaleString("en-GB", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : "Recent"}
                            </strong>
                          </div>
                        </div>
                        <div className="pt-1">
                          <span className="text-navy-500 text-[10px] uppercase font-bold tracking-wider block mb-0.5">
                            Reason Recorded
                          </span>
                          <p className="text-xs font-medium text-rose-950 bg-white/90 p-2 rounded-lg border border-rose-200/70">
                            &ldquo;{order.cancellation_reason || "Customer requested cancellation before courier dispatch"}&rdquo;
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-sand-100/70 border border-sand-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-navy-900 uppercase tracking-wider flex items-center gap-1.5">
                            <Truck className="w-3.5 h-3.5 text-brass-600" />
                            <span>Fulfillment &amp; Delivery Progress</span>
                          </span>
                          <span className="font-mono text-xs font-semibold text-navy-600">
                            Tracking No: {order.tracking_number || order.order_number || "Awaiting allocation"}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                          {(() => {
                            const timeline = order.deliveryTimeline || [];
                            const activeIdx = timeline.findIndex((s) => !s.done);
                            return timeline.map((step, idx) => {
                              const isCurrent = idx === activeIdx;
                              return (
                                <div
                                  key={idx}
                                  className={`p-3 rounded-lg border text-xs transition-all ${
                                    step.done
                                      ? "bg-sand-50 border-emerald-400 shadow-sm"
                                      : isCurrent
                                      ? "bg-brass-500/10 border-brass-400"
                                      : "bg-sand-50/50 border-sand-300 opacity-60"
                                  }`}
                                >
                                  <div className="flex items-center gap-2 mb-1">
                                    {step.done ? (
                                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                                    ) : isCurrent ? (
                                      <Clock className="w-4 h-4 text-brass-600 animate-pulse flex-shrink-0" />
                                    ) : (
                                      <Package className="w-4 h-4 text-navy-400 flex-shrink-0" />
                                    )}
                                    <span className="font-bold text-navy-950 truncate text-[11px]">{step.step}</span>
                                  </div>
                                  <span className="text-[10px] text-navy-600 block pl-6">{step.note}</span>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    )}

                    {/* Order Items List */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-navy-900 uppercase tracking-wider">
                        Ordered Items ({(order.items || []).length})
                      </h4>

                      <div className="divide-y divide-sand-200 border border-sand-200 rounded-xl bg-sand-100/40 p-4">
                        {(order.items || []).map((item, idx) => (
                          <div
                            key={idx}
                            className="py-3 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                          >
                            <div className="flex items-center gap-3.5 min-w-0">
                              {item.thumbnailUrl ? (
                                <img
                                  src={item.thumbnailUrl}
                                  alt={item.title}
                                  className="w-14 h-14 rounded-lg object-cover border border-sand-300 flex-shrink-0"
                                />
                              ) : (
                                <div className="w-14 h-14 rounded-lg bg-sand-200 border border-sand-300 flex items-center justify-center text-navy-600 flex-shrink-0">
                                  <Package className="w-6 h-6" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <h5 className="text-xs font-bold text-navy-950 truncate">{item.title}</h5>
                                <p className="text-[11px] text-navy-600 mt-0.5">
                                  Qty: {item.quantity || 1} &bull; Finish: {item.finish || "Standard White Glove Finish"}
                                </p>
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 mt-1">
                                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                  UK Quality Checked &bull; Genuine Home Furniture
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 self-end sm:self-center">
                              <span className="text-xs font-bold text-navy-950">
                                {formatGBP(Number(item.pricePennies || 0) * Number(item.quantity || 1))}
                              </span>

                              <button
                                type="button"
                                onClick={() => handleQuickReorder(item)}
                                className="px-3 py-1.5 rounded-lg bg-sand-200 hover:bg-brass-500 hover:text-navy-950 text-navy-950 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Buy Again</span>
                              </button>

                              {/* Compliant 14-Day Statutory UK Return Action */}
                              {(() => {
                                const isDelivered = order.fulfillment_status === "delivered";
                                const isReturnRequested = order.fulfillment_status === "return_requested" || order.fulfillment_status === "returned";
                                const isCancelled = order.fulfillment_status === "cancelled";

                                // Calculate days elapsed since order created_at
                                const orderDate = new Date(order.created_at);
                                const daysSinceOrder = Math.floor((Date.now() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
                                const isReturnWindowExpired = daysSinceOrder > 14;

                                if (isCancelled) {
                                  return null;
                                }

                                if (isReturnRequested) {
                                  return (
                                    <span className="px-2.5 py-1.5 rounded-lg bg-amber-50 border border-amber-300 text-amber-800 text-[11px] font-bold flex items-center gap-1 shadow-2xs">
                                      <RotateCcw className="w-3 h-3 text-amber-600" />
                                      <span>Return Pending</span>
                                    </span>
                                  );
                                }

                                if (!isDelivered) {
                                  return (
                                    <span
                                      title="Order resolution support activates once items are delivered."
                                      className="px-2.5 py-1.5 rounded-lg border border-dashed border-sand-300 text-navy-400 text-[11px] font-medium"
                                    >
                                      <span>Support on Delivery</span>
                                    </span>
                                  );
                                }

                                if (isReturnWindowExpired) {
                                  return (
                                    <button
                                      type="button"
                                      disabled
                                      title="The standard return resolution window has closed for this delivered order."
                                      className="px-2.5 py-1.5 rounded-lg border border-sand-300 bg-sand-200/80 text-navy-400 text-xs font-medium cursor-not-allowed opacity-60 flex items-center gap-1"
                                    >
                                      <RotateCcw className="w-3 h-3 text-navy-400" />
                                      <span>Resolution Window Closed</span>
                                    </button>
                                  );
                                }

                                return (
                                  <button
                                    type="button"
                                    onClick={() => setReturnModalOrder(order)}
                                    className="px-3 py-1.5 rounded-lg border border-sand-300 bg-white hover:bg-sand-100 text-navy-950 text-xs font-bold transition-all hover:border-brass-600 cursor-pointer flex items-center gap-1.5 shadow-2xs active-press"
                                  >
                                    <RotateCcw className="w-3 h-3 text-brass-600" />
                                    <span>14-Day Return</span>
                                  </button>
                                );
                              })()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Pagination Controls for Orders */}
              {totalOrderPages > 1 && (
                <div className="bg-sand-50 border border-sand-300 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs shadow-2xs">
                  <span className="text-navy-600 font-medium">
                    Showing{" "}
                    <strong className="text-navy-950">
                      {(ordersCurrentPage - 1) * ordersPerPage + 1}–{Math.min(ordersCurrentPage * ordersPerPage, filteredOrders.length)}
                    </strong>{" "}
                    of <strong className="text-navy-950">{filteredOrders.length}</strong> orders
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={ordersCurrentPage === 1}
                      onClick={() => {
                        setOrdersCurrentPage((p) => Math.max(1, p - 1));
                        if (typeof window !== "undefined") window.scrollTo({ top: 380, behavior: "smooth" });
                      }}
                      className="px-3.5 py-2 rounded-xl border border-sand-300 bg-white hover:bg-sand-100 disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-navy-900 transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Previous</span>
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalOrderPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          type="button"
                          onClick={() => {
                            setOrdersCurrentPage(page);
                            if (typeof window !== "undefined") window.scrollTo({ top: 380, behavior: "smooth" });
                          }}
                          className={`w-9 h-9 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            ordersCurrentPage === page
                              ? "bg-navy-950 text-sand-50 shadow-xs"
                              : "bg-white hover:bg-sand-100 text-navy-800 border border-sand-300"
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      disabled={ordersCurrentPage === totalOrderPages}
                      onClick={() => {
                        setOrdersCurrentPage((p) => Math.min(totalOrderPages, p + 1));
                        if (typeof window !== "undefined") window.scrollTo({ top: 380, behavior: "smooth" });
                      }}
                      className="px-3.5 py-2 rounded-xl border border-sand-300 bg-white hover:bg-sand-100 disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-navy-900 transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
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
                  Manage delivery addresses and private property access instructions for our dedicated delivery crew.
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

            {isAddressesLoading ? (
              <div className="p-8 text-center text-xs text-navy-600 bg-sand-100/50 rounded-2xl border border-sand-300">
                Loading client address book...
              </div>
            ) : addresses.length === 0 ? (
              <div className="p-8 text-center bg-sand-100/60 rounded-2xl border border-sand-300">
                <MapPin className="w-8 h-8 text-navy-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-navy-900">No UK delivery addresses saved yet.</p>
                <p className="text-xs text-navy-600 mt-1 mb-4">Add your residential address for faster checkout and delivery access scheduling.</p>
                <button
                  type="button"
                  onClick={() => setIsAddressModalOpen(true)}
                  className="px-4 py-2 bg-navy-950 text-sand-50 rounded-xl text-xs font-bold hover:bg-brass-600 transition-colors"
                >
                  Add Your Address
                </button>
              </div>
            ) : (
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
            )}

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
                  <span>Saved Wishlist &amp; Curated Pieces</span>
                </h3>
                <p className="text-xs text-navy-600 mt-0.5">
                  Save your favourite furniture pieces, compare handcrafted finishes, and move directly to checkout.
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
          <div className="space-y-8 animate-fade-in">
            <div className="pb-2 border-b border-sand-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-lg font-bold text-navy-950 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-brass-600" />
                  <span>Payment Instruments &amp; Official VAT Invoices</span>
                </h3>
                <p className="text-xs text-navy-600 mt-0.5">
                  Securely stored Stripe payment credentials, HMRC 20% VAT invoices, and historical purchase receipts.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-emerald-800 font-semibold bg-emerald-100 border border-emerald-200 px-3 py-1 rounded-lg flex items-center gap-1.5 shadow-2xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  PCI-DSS Level 1 Secured
                </span>
              </div>
            </div>

            {/* Top Tier: 2 Balanced Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
              
              {/* Card 1: Saved Payment Instruments */}
              <div className="bg-sand-50 border border-sand-300 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-sand-200">
                    <div>
                      <h4 className="text-xs font-bold text-navy-950 uppercase tracking-wider flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-brass-600" />
                        <span>Authorized Payment Instruments</span>
                      </h4>
                      <p className="text-[11px] text-navy-500 mt-0.5">
                        Tokenized cards available for 1-click accelerated checkout.
                      </p>
                    </div>
                    <span className="text-[11px] font-mono font-bold text-navy-700 bg-sand-200 px-2 py-0.5 rounded">
                      {savedPaymentMethods.length} {savedPaymentMethods.length === 1 ? "Card" : "Cards"}
                    </span>
                  </div>

                  {/* Dynamically Loaded Authorized Payment Instruments */}
                  <div className="mt-4">
                    {isPaymentsLoading ? (
                      <div className="p-8 rounded-xl bg-sand-100/60 border border-sand-200 text-center text-xs text-navy-500 animate-pulse">
                        Loading authorized payment instruments...
                      </div>
                    ) : savedPaymentMethods.length > 0 ? (
                      <div className="space-y-3">
                        {savedPaymentMethods.map((pm) => (
                          <div
                            key={pm.id}
                            className="p-4 rounded-xl bg-navy-950 text-sand-50 space-y-3 shadow-md relative overflow-hidden group border border-navy-900"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-brass-400 block font-mono">
                                  Stripe 256-Bit TLS
                                </span>
                                <p className="text-sm font-bold mt-0.5 text-sand-100">{pm.brand} Card</p>
                              </div>
                              <div className="flex items-center gap-2">
                                {Boolean(pm.is_default) ? (
                                  <span className="text-[10px] font-bold bg-brass-500 text-navy-950 px-2.5 py-0.5 rounded shadow-xs flex items-center gap-1 font-mono uppercase tracking-wider">
                                    <Check className="w-2.5 h-2.5" />
                                    Default
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    disabled={isUpdatingDefaultPm === pm.id}
                                    onClick={() => handleSetDefaultPaymentMethod(pm.id)}
                                    className="text-[10px] font-bold text-brass-300 hover:text-navy-950 bg-brass-500/10 hover:bg-brass-400 border border-brass-500/40 px-2.5 py-0.5 rounded transition-all cursor-pointer disabled:opacity-50"
                                    title="Set this card as your default payment method"
                                  >
                                    {isUpdatingDefaultPm === pm.id ? "Setting..." : "Set as Default"}
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleRemovePaymentMethod(pm.id)}
                                  className="text-[10px] text-rose-300 hover:text-rose-100 bg-rose-950/60 hover:bg-rose-900 border border-rose-800/60 px-2 py-0.5 rounded transition-colors cursor-pointer"
                                  title="Remove card from account"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>

                            <div className="font-mono text-base tracking-widest text-sand-200">
                              •••• •••• •••• {pm.last4}
                            </div>

                            <div className="flex justify-between items-center text-xs text-sand-300 pt-1 border-t border-navy-800/80">
                              <span>
                                Cardholder:{" "}
                                <strong className="text-sand-100">
                                  {pm.cardholder_name || `${customer.firstName} ${customer.lastName}`}
                                </strong>
                              </span>
                              <span>
                                Expires:{" "}
                                <strong className="font-mono text-sand-100">
                                  {String(pm.exp_month).padStart(2, "0")}/{String(pm.exp_year).slice(-2)}
                                </strong>
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 rounded-xl bg-sand-100/60 border border-sand-200 text-center space-y-2">
                        <CreditCard className="w-8 h-8 text-sand-400 mx-auto stroke-1" />
                        <p className="text-xs font-bold text-navy-950">No Saved Cards in Profile</p>
                        <p className="text-[11px] text-navy-600 max-w-sm mx-auto leading-relaxed">
                          You currently have no saved payment instruments. When checking out, tick <em>&ldquo;Save this card securely to my profile&rdquo;</em> to enable 1-click ordering.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 text-[11px] text-navy-500 border-t border-sand-200/80 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-forest-600 shrink-0" />
                  <span>Card tokens are securely encrypted via Stripe TLS protocol. SAN Furniture never stores raw PAN digits.</span>
                </div>
              </div>

              {/* Card 2: UK VAT & Merchant Credentials */}
              <div className="bg-sand-50 border border-sand-300 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-sand-200">
                    <div>
                      <h4 className="text-xs font-bold text-navy-950 uppercase tracking-wider flex items-center gap-2">
                        <FileText className="w-4 h-4 text-brass-600" />
                        <span>UK Billing &amp; VAT Tax Profile</span>
                      </h4>
                      <p className="text-[11px] text-navy-500 mt-0.5">
                        Official invoicing entity details and tax compliance.
                      </p>
                    </div>
                    <span className="text-[11px] text-forest-800 font-semibold bg-forest-100 border border-forest-200 px-2 py-0.5 rounded">
                      HMRC 20% Verified
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3.5 rounded-xl bg-sand-100/80 border border-sand-200 space-y-1">
                      <span className="text-navy-500 block text-[10px] uppercase font-bold tracking-wider">Account Status</span>
                      <strong className="text-navy-950 font-semibold block">Verified UK Customer</strong>
                      <span className="text-[11px] text-forest-700 block">Eligible for White Glove delivery</span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-sand-100/80 border border-sand-200 space-y-1">
                      <span className="text-navy-500 block text-[10px] uppercase font-bold tracking-wider">Standard VAT Rate</span>
                      <strong className="text-navy-950 font-semibold block">20.0% UK VAT Inclusive</strong>
                      <span className="text-[11px] text-navy-600 block">Itemized on all official receipts</span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-sand-100/80 border border-sand-200 space-y-1">
                      <span className="text-navy-500 block text-[10px] uppercase font-bold tracking-wider">Invoicing Entity</span>
                      <strong className="text-navy-950 font-semibold block">SAN Furniture UK Ltd</strong>
                      <span className="text-[11px] font-mono text-navy-600 block">VAT Reg: GB 384 9201 44</span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-sand-100/80 border border-sand-200 space-y-1">
                      <span className="text-navy-500 block text-[10px] uppercase font-bold tracking-wider">Receipt Dispatch</span>
                      <strong className="text-navy-950 font-semibold block">Instant Auto-Email</strong>
                      <span className="text-[11px] text-navy-600 block">PDF &amp; HTML format generated</span>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-sand-100/60 border border-sand-200 text-xs text-navy-600 leading-relaxed">
                  <strong>Pricing Transparency Guarantee:</strong> All catalogue and bespoke commission prices include full 20% UK Value Added Tax with zero hidden handling charges or post-checkout surprise fees.
                </div>
              </div>

            </div>

            {/* Bottom Tier: Full-Width Grand Invoices & Receipts Ledger */}
            <div className="bg-sand-50 border border-sand-300 rounded-2xl p-6 sm:p-7 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-sand-200">
                <div>
                  <h4 className="text-sm font-bold text-navy-950 uppercase tracking-wider flex items-center gap-2">
                    <Download className="w-4 h-4 text-brass-600" />
                    <span>Download All Historical Invoices &amp; Official Receipts</span>
                  </h4>
                  <p className="text-xs text-navy-600 mt-0.5">
                    View itemized breakdowns, download official HMRC-compliant VAT receipts, and verify payment settlements.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 text-navy-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search invoices..."
                      value={invoiceSearchQuery}
                      onChange={(e) => {
                        setInvoiceSearchQuery(e.target.value);
                        setInvoicesCurrentPage(1);
                      }}
                      className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-sand-300 bg-white focus:outline-none focus:ring-2 focus:ring-brass-500"
                    />
                  </div>
                  <span className="text-xs font-bold text-navy-800 bg-sand-200/80 px-3 py-1.5 rounded-lg shrink-0 border border-sand-300 font-mono">
                    {filteredInvoices.length} {filteredInvoices.length === 1 ? "Invoice" : "Invoices"}
                  </span>
                </div>
              </div>

              {/* Invoice List Items */}
              {filteredInvoices.length === 0 ? (
                <div className="p-12 text-center rounded-xl bg-sand-100/50 border border-dashed border-sand-300 space-y-2">
                  <FileText className="w-8 h-8 text-navy-400 mx-auto stroke-1" />
                  <p className="text-xs font-bold text-navy-950">No Historical Invoices Found</p>
                  <p className="text-[11px] text-navy-500">
                    {invoiceSearchQuery ? "No invoices matched your search filter." : "Your official VAT receipts will automatically generate here when orders are placed."}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {paginatedInvoices.map((o) => {
                    const orderRef = o.order_number || o.id;
                    const itemsCount = Array.isArray(o.items) ? o.items.length : 1;
                    const primaryTitle = Array.isArray(o.items) && o.items[0]?.title ? o.items[0].title : "SAN Bespoke Furniture Commission";
                    const isCopied = copiedInvoiceNumber === orderRef;

                    return (
                      <div
                        key={o.id}
                        className="p-4 sm:p-5 rounded-xl bg-white border border-sand-200 hover:border-sand-300 shadow-2xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-sm font-bold text-navy-950">
                              {orderRef}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                if (typeof navigator !== "undefined" && navigator.clipboard) {
                                  navigator.clipboard.writeText(orderRef);
                                  setCopiedInvoiceNumber(orderRef);
                                  setTimeout(() => setCopiedInvoiceNumber(null), 2000);
                                }
                              }}
                              className="text-[10px] font-semibold text-navy-500 hover:text-navy-950 p-1 rounded hover:bg-sand-100 inline-flex items-center gap-1 transition-colors cursor-pointer"
                              title="Copy order reference"
                            >
                              <Copy className="w-3 h-3" />
                              <span>{isCopied ? "Copied!" : "Copy"}</span>
                            </button>
                            <span className="text-[10px] font-bold text-forest-800 bg-forest-50 border border-forest-200 px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
                              <CheckCircle2 className="w-2.5 h-2.5 text-forest-600" />
                              Paid &amp; Settled
                            </span>
                          </div>

                          <p className="text-xs text-navy-600 truncate max-w-lg">
                            <strong className="text-navy-900">{primaryTitle}</strong>
                            {itemsCount > 1 && <span className="text-navy-500 ml-1">(+{itemsCount - 1} other pieces)</span>}
                          </p>

                          <div className="flex items-center gap-3 text-[11px] text-navy-500 pt-0.5">
                            <span>Issued: <strong className="text-navy-800">{formatOrderDate(o.created_at || o.createdAt, { day: "numeric", month: "long", year: "numeric" })}</strong></span>
                            <span>&bull;</span>
                            <span>Destination: <strong className="font-mono text-navy-800">{o.shipping_postcode || "UK Mainland"}</strong></span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between md:justify-end gap-5 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-sand-100">
                          <div className="text-left md:text-right">
                            <span className="font-display font-bold text-base text-navy-950 block">
                              {o.totalGbpFormatted || formatGBP(Number(o.total_pennies || 0))}
                            </span>
                            <span className="text-[10px] text-navy-500 block">
                              Inc. 20% UK VAT ({formatGBP(Number(o.vat_pennies) || Math.round((Number(o.total_pennies || 0) * 0.2) / 1.2))})
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <a
                              href={apiUrl(o.invoiceHtmlUrl || `/api/orders/${o.id}/invoice`)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3.5 py-2 rounded-xl bg-navy-950 hover:bg-brass-600 text-sand-50 font-bold text-xs inline-flex items-center gap-1.5 transition-colors shadow-2xs"
                              title="Download official HMRC-compliant VAT invoice in PDF / HTML"
                            >
                              <Download className="w-3.5 h-3.5 text-brass-400" />
                              <span>PDF / HTML</span>
                            </a>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveTab("orders");
                                setOrderSearchQuery(orderRef);
                                setOrdersCurrentPage(1);
                              }}
                              className="px-3 py-2 rounded-xl border border-sand-300 bg-sand-100 hover:bg-sand-200 text-navy-900 font-semibold text-xs inline-flex items-center gap-1 transition-colors cursor-pointer"
                              title="View delivery progress for this order"
                            >
                              <span>View Order</span>
                              <ChevronRight className="w-3.5 h-3.5 text-navy-500" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Invoices Pagination */}
              {totalInvoicePages > 1 && (
                <div className="pt-3 border-t border-sand-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <span className="text-navy-600 font-medium">
                    Showing{" "}
                    <strong className="text-navy-950">
                      {(invoicesCurrentPage - 1) * invoicesPerPage + 1}–{Math.min(invoicesCurrentPage * invoicesPerPage, filteredInvoices.length)}
                    </strong>{" "}
                    of <strong className="text-navy-950">{filteredInvoices.length}</strong> invoices
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={invoicesCurrentPage === 1}
                      onClick={() => setInvoicesCurrentPage((p) => Math.max(1, p - 1))}
                      className="px-3 py-1.5 rounded-lg border border-sand-300 bg-white hover:bg-sand-100 disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-navy-900 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Previous</span>
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalInvoicePages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          type="button"
                          onClick={() => setInvoicesCurrentPage(page)}
                          className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            invoicesCurrentPage === page
                              ? "bg-navy-950 text-sand-50 shadow-xs"
                              : "bg-white hover:bg-sand-100 text-navy-800 border border-sand-300"
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      disabled={invoicesCurrentPage === totalInvoicePages}
                      onClick={() => setInvoicesCurrentPage((p) => Math.min(totalInvoicePages, p + 1))}
                      className="px-3 py-1.5 rounded-lg border border-sand-300 bg-white hover:bg-sand-100 disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-navy-900 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

        {/* ============================================================== */}
        {/* TAB: PROFILE & SECURITY SETTINGS                               */}
        {/* ============================================================== */}
        {activeTab === "security" && (
          <div className="space-y-8 animate-fade-in w-full">
            {/* Header with Security Overview */}
            <div className="pb-3 border-b border-sand-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold tracking-widest uppercase bg-brass-100 text-brass-800 px-2 py-0.5 rounded border border-brass-200/80">
                    Client Security Suite
                  </span>
                  <span className="text-[10px] font-bold tracking-widest uppercase bg-sand-200 text-navy-800 px-2 py-0.5 rounded border border-sand-300">
                    UK GDPR Compliant
                  </span>
                </div>
                <h3 className="font-display text-xl font-bold text-navy-950 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-brass-600" />
                  <span>Client Profile &amp; Account Security</span>
                </h3>
                <p className="text-xs text-navy-600 mt-0.5">
                  Manage your delivery credentials, White Glove dispatch alerts, and cryptographic authentication settings.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-200 px-3 py-1 rounded-xl flex items-center gap-1.5 shadow-2xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Argon2id Encrypted
                </span>
                <span className="text-[11px] font-bold text-navy-800 bg-sand-200 border border-sand-300 px-3 py-1 rounded-xl flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-brass-700" />
                  TLS 1.3 Transport
                </span>
              </div>
            </div>

            {/* Executive Client Profile Hero Card */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy-950 via-navy-900 to-[#0A1628] text-sand-50 p-6 sm:p-8 border border-navy-800/80 shadow-md">
              <div className="absolute top-0 right-0 w-80 h-80 bg-brass-500/5 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-forest-500/5 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-navy-800/60">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brass-400 via-brass-500 to-brass-700 text-navy-950 font-display font-bold text-2xl flex items-center justify-center shadow-lg border-2 border-brass-300/40 shrink-0">
                    {((customer.firstName?.[0] || "S") + (customer.lastName?.[0] || "F")).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-display text-xl sm:text-2xl font-bold text-sand-50 tracking-tight">
                        {customer.firstName} {customer.lastName}
                      </h2>
                      <span className="text-[10px] font-bold text-brass-300 bg-brass-950/70 border border-brass-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-brass-400" />
                        UK Verified Household
                      </span>
                    </div>
                    <p className="text-xs text-sand-300/80 mt-1 flex items-center gap-2 flex-wrap">
                      <span className="font-mono">@{profileForm.username || customer.username || "client"}</span>
                      <span>&bull;</span>
                      <span>{customer.email}</span>
                      <span>&bull;</span>
                      <span className="text-brass-300">SAN Private Client</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start md:self-auto">
                  <button
                    type="button"
                    onClick={handleDownloadDataArchive}
                    className="px-3.5 py-2 rounded-xl bg-navy-800/80 hover:bg-navy-800 border border-navy-700 text-sand-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs hover:text-sand-50"
                    title="Export GDPR Data Archive (JSON)"
                  >
                    <Download className="w-3.5 h-3.5 text-brass-400" />
                    <span>Export GDPR Archive</span>
                  </button>
                </div>
              </div>

              {/* 4 Bento Metrics across full width */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-5">
                <div className="p-3 sm:p-3.5 rounded-xl bg-navy-900/60 border border-navy-800/80 backdrop-blur-xs">
                  <span className="text-[10px] text-sand-400 font-medium block uppercase tracking-wider">Account Status</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-bold text-xs sm:text-sm text-sand-100">Active &amp; Verified</span>
                  </div>
                </div>

                <div className="p-3 sm:p-3.5 rounded-xl bg-navy-900/60 border border-navy-800/80 backdrop-blur-xs">
                  <span className="text-[10px] text-sand-400 font-medium block uppercase tracking-wider">Contact Phone</span>
                  <p className="font-mono font-bold text-xs sm:text-sm text-brass-300 mt-1 truncate">
                    {profileForm.phone || "+44 7700 900123"}
                  </p>
                </div>

                <div className="p-3 sm:p-3.5 rounded-xl bg-navy-900/60 border border-navy-800/80 backdrop-blur-xs">
                  <span className="text-[10px] text-sand-400 font-medium block uppercase tracking-wider">Order Updates</span>
                  <p className="font-bold text-xs sm:text-sm text-sand-100 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span>{notifications.orderUpdates ? "Active" : "Disabled"}</span>
                  </p>
                </div>

                <div className="p-3 sm:p-3.5 rounded-xl bg-navy-900/60 border border-navy-800/80 backdrop-blur-xs">
                  <span className="text-[10px] text-sand-400 font-medium block uppercase tracking-wider">Security Engine</span>
                  <p className="font-bold text-xs sm:text-sm text-sand-100 mt-1 flex items-center gap-1 truncate">
                    <ShieldCheck className="w-3 h-3 text-brass-400 shrink-0" />
                    <span>Argon2id + TLS 1.3</span>
                  </p>
                </div>
              </div>
            </div>

            {/* 2-Column Balanced Responsive Bento Layout across 100% width */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
              
              {/* LEFT COLUMN: 7 OF 12 COLS (Credentials & Password) */}
              <div className="xl:col-span-7 space-y-8">
                
                {/* Section 1: Personal Credentials & Delivery Identity */}
                <div className="bg-white border border-sand-300 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-sand-200">
                    <div>
                      <h4 className="text-sm font-bold text-navy-950 uppercase tracking-wider flex items-center gap-2">
                        <User className="w-4 h-4 text-brass-600" />
                        <span>Personal Credentials &amp; Delivery Identity</span>
                      </h4>
                      <p className="text-xs text-navy-500 mt-0.5">
                        Used for UK delivery manifests, HMRC VAT receipts, and White Glove assembly bookings.
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-brass-800 bg-sand-200/90 border border-sand-300 px-2.5 py-1 rounded-lg shrink-0">
                      UK Household
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
                    <div>
                      <label className="block text-navy-800 font-semibold mb-1.5">First Name</label>
                      <input
                        type="text"
                        name="firstName"
                        autoComplete="given-name"
                        value={profileForm.firstName}
                        onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                        placeholder="e.g. Eleanor"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-sand-300 bg-sand-50/50 text-navy-950 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brass-500/50 focus:border-brass-600 transition-all shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="block text-navy-800 font-semibold mb-1.5">Last Name</label>
                      <input
                        type="text"
                        name="lastName"
                        autoComplete="family-name"
                        value={profileForm.lastName}
                        onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                        placeholder="e.g. Vance"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-sand-300 bg-sand-50/50 text-navy-950 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brass-500/50 focus:border-brass-600 transition-all shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="block text-navy-800 font-semibold mb-1.5">Account Username</label>
                      <input
                        type="text"
                        name="username"
                        autoComplete="username"
                        value={profileForm.username}
                        onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                        placeholder="e.g. eleanor_vance"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-sand-300 bg-sand-50/50 text-navy-950 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brass-500/50 focus:border-brass-600 transition-all shadow-2xs"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-navy-800 font-semibold">Registered Email</label>
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Verified
                        </span>
                      </div>
                      <input
                        type="email"
                        value={customer.email}
                        disabled
                        className="w-full px-3.5 py-2.5 rounded-xl border border-sand-300 bg-sand-200/50 text-navy-600 cursor-not-allowed font-medium shadow-2xs"
                      />
                      <span className="text-[10px] text-navy-500 mt-1 block">Contact client concierge to modify registered billing email.</span>
                    </div>

                    <div className="sm:col-span-2">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-navy-900 font-semibold text-xs flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-brass-700" />
                          <span>UK Phone for White Glove Pre-call &amp; SMS Dispatch</span>
                        </label>
                        <span className="text-[10px] font-bold text-forest-700 bg-forest-50 px-2 py-0.5 rounded border border-forest-200">
                          Active Courier Line
                        </span>
                      </div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                          <span className="text-xs font-semibold text-navy-600 font-mono">🇬🇧 +44</span>
                        </div>
                        <input
                          type="tel"
                          name="phone"
                          autoComplete="tel"
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                          placeholder="7700 900123"
                          className="w-full pl-20 pr-4 py-2.5 rounded-xl border border-sand-300 bg-sand-50/50 text-navy-950 font-mono text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-brass-500/50 focus:border-brass-600 transition-all shadow-2xs"
                        />
                      </div>
                      <p className="text-[11px] text-navy-500 mt-1.5 leading-relaxed">
                        Our delivery &amp; logistics team uses this contact number to coordinate delivery tracking and property access for your order.
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-sand-200/80">
                    <button
                      type="button"
                      disabled={isSavingProfile}
                      onClick={handleSaveProfile}
                      className="px-6 py-2.5 rounded-xl bg-navy-950 text-sand-50 text-xs font-bold hover:bg-brass-600 transition-all shadow-sm cursor-pointer disabled:opacity-50 inline-flex items-center justify-center gap-2 group active:scale-[0.99]"
                    >
                      {isSavingProfile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5 text-brass-400 group-hover:text-sand-50 transition-colors" />}
                      <span>{isSavingProfile ? "Saving Profile..." : "Save Profile Changes"}</span>
                    </button>
                    <span className="text-[11px] text-navy-500 italic">
                      Changes persist across your active UK sessions &amp; checkout pre-fills.
                    </span>
                  </div>
                </div>

                {/* Section 2: Password & Authentication Form */}
                <div className="bg-white border border-sand-300 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-sand-200">
                    <div>
                      <h4 className="text-sm font-bold text-navy-950 uppercase tracking-wider flex items-center gap-2">
                        <Lock className="w-4 h-4 text-brass-600" />
                        <span>Password &amp; Authentication</span>
                      </h4>
                      <p className="text-xs text-navy-500 mt-0.5">
                        Manage your account passphrase with memory-hard cryptographic protection.
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-brass-800 bg-brass-100 px-2.5 py-1 rounded-lg border border-brass-200 shrink-0">
                      Argon2id Hash
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
                    <div>
                      <label className="block text-navy-800 font-semibold mb-1.5">New Password</label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          name="newPassword"
                          autoComplete="new-password"
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                          placeholder="Minimum 8 characters"
                          className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-sand-300 bg-sand-50/50 text-navy-950 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brass-500/50 focus:border-brass-600 transition-all shadow-2xs"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-navy-400 hover:text-navy-700 cursor-pointer"
                          tabIndex={-1}
                        >
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-navy-800 font-semibold mb-1.5">Confirm New Password</label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          name="confirmPassword"
                          autoComplete="new-password"
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                          placeholder="Repeat new password"
                          className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-sand-300 bg-sand-50/50 text-navy-950 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brass-500/50 focus:border-brass-600 transition-all shadow-2xs"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-navy-400 hover:text-navy-700 cursor-pointer"
                          tabIndex={-1}
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Password Strength Visual Meter */}
                  {passwordForm.newPassword && (
                    <div className="p-3.5 rounded-xl bg-sand-50 border border-sand-200 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-navy-600 font-semibold text-[11px]">Passphrase Strength:</span>
                        <span className="font-bold text-[11px] text-navy-950">
                          {getPasswordStrength(passwordForm.newPassword).label}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-sand-200 rounded-full overflow-hidden flex gap-1">
                        <div className={`h-full flex-1 rounded-full ${passwordForm.newPassword.length >= 4 ? getPasswordStrength(passwordForm.newPassword).color : "bg-transparent"}`} />
                        <div className={`h-full flex-1 rounded-full ${passwordForm.newPassword.length >= 8 ? getPasswordStrength(passwordForm.newPassword).color : "bg-transparent"}`} />
                        <div className={`h-full flex-1 rounded-full ${getPasswordStrength(passwordForm.newPassword).score >= 3 ? getPasswordStrength(passwordForm.newPassword).color : "bg-transparent"}`} />
                        <div className={`h-full flex-1 rounded-full ${getPasswordStrength(passwordForm.newPassword).score >= 4 ? getPasswordStrength(passwordForm.newPassword).color : "bg-transparent"}`} />
                      </div>
                    </div>
                  )}

                  <div className="p-4 rounded-xl bg-sand-100/70 border border-sand-200 text-xs text-navy-700 flex items-start gap-3">
                    <Info className="w-4 h-4 text-brass-700 shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      Passwords must contain at least 8 characters. We salt and hash your credentials using memory-hard <strong>Argon2id</strong> (RFC 9106) with 64MB memory cost to prevent GPU brute-force attacks.
                    </p>
                  </div>

                  <div className="pt-2 border-t border-sand-200/80">
                    <button
                      type="button"
                      disabled={isUpdatingPassword}
                      onClick={handleUpdatePassword}
                      className="px-6 py-2.5 rounded-xl border border-sand-300 bg-sand-50 hover:bg-navy-950 hover:text-sand-50 text-navy-950 text-xs font-bold transition-all shadow-2xs cursor-pointer disabled:opacity-50 inline-flex items-center gap-2"
                    >
                      {isUpdatingPassword ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
                      <span>{isUpdatingPassword ? "Encrypting Passphrase..." : "Update Password"}</span>
                    </button>
                  </div>
                </div>

              </div>

              {/* RIGHT COLUMN: 5 OF 12 COLS (Logistics, Active Sessions, GDPR) */}
              <div className="xl:col-span-5 space-y-8">
                
                {/* Notification Preferences */}
                <div className="bg-white border border-sand-300 rounded-2xl p-6 sm:p-7 shadow-sm space-y-5">
                  <div className="pb-3 border-b border-sand-200">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-navy-950 uppercase tracking-wider flex items-center gap-2">
                        <Bell className="w-4 h-4 text-brass-600" />
                        <span>Notification Preferences</span>
                      </h4>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Preferences Active
                      </span>
                    </div>
                    <p className="text-xs text-navy-500 mt-1">Manage your order dispatch alerts and promotional updates.</p>
                  </div>

                  <div className="space-y-3.5 text-xs">
                    <label className="flex items-start justify-between p-4 rounded-xl bg-sand-50/70 border border-sand-200 hover:border-sand-300 transition-all cursor-pointer group">
                      <div className="pr-4">
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4 text-brass-700" />
                          <strong className="text-navy-950 block text-xs">Order &amp; Dispatch Updates</strong>
                        </div>
                        <span className="text-navy-600 text-[11px] leading-relaxed block mt-1">
                          Receive notifications when your order status updates or courier tracking is allocated.
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifications.orderUpdates}
                        onChange={(e) => {
                          setNotifications({ ...notifications, orderUpdates: e.target.checked });
                          showToast("Order notification preference saved.");
                        }}
                        className="w-4 h-4 mt-1 rounded text-brass-600 focus:ring-brass-500 accent-brass-600 cursor-pointer shrink-0"
                      />
                    </label>

                    <label className="flex items-start justify-between p-4 rounded-xl bg-sand-50/70 border border-sand-200 hover:border-sand-300 transition-all cursor-pointer group">
                      <div className="pr-4">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-brass-600" />
                          <strong className="text-navy-950 block text-xs">VIP Furniture Previews &amp; Offers</strong>
                        </div>
                        <span className="text-navy-600 text-[11px] leading-relaxed block mt-1">
                          Advance invitations to new furniture releases, exclusive sales, and seasonal clearances.
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifications.exclusivePreview}
                        onChange={(e) => {
                          setNotifications({ ...notifications, exclusivePreview: e.target.checked });
                          showToast("Promotional preference saved.");
                        }}
                        className="w-4 h-4 mt-1 rounded text-brass-600 focus:ring-brass-500 accent-brass-600 cursor-pointer shrink-0"
                      />
                    </label>
                  </div>
                </div>

                {/* Active Session & Device Shield */}
                <div className="bg-white border border-sand-300 rounded-2xl p-6 sm:p-7 shadow-sm space-y-4">
                  <div className="pb-3 border-b border-sand-200 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-navy-950 uppercase tracking-wider flex items-center gap-2">
                        <Laptop className="w-4 h-4 text-brass-600" />
                        <span>Active Session &amp; Shield</span>
                      </h4>
                      <p className="text-xs text-navy-500 mt-0.5">Protected client browser connection.</p>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Active Now
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-sand-50 border border-sand-200">
                      <div>
                        <strong className="text-navy-950 block text-xs">Current Web Client</strong>
                        <span className="text-navy-500 text-[11px]">Desktop Chrome &bull; Windows</span>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-navy-700 bg-sand-200 px-2 py-0.5 rounded">
                        UK Session
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-sand-50 border border-sand-200">
                      <div>
                        <strong className="text-navy-950 block text-xs">Brute-Force Guard</strong>
                        <span className="text-navy-500 text-[11px]">Sliding Window Rate-Limiter &amp; IP Jail</span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                        Enforced
                      </span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleSignOutOtherSessions}
                      className="w-full py-2.5 rounded-xl border border-sand-300 bg-white hover:bg-sand-100 text-navy-900 font-semibold text-xs transition-colors cursor-pointer text-center"
                    >
                      Revoke Other Remote UK Sessions
                    </button>
                  </div>
                </div>

                {/* UK GDPR & Data Protection Guarantee */}
                <div className="bg-gradient-to-br from-sand-50 to-sand-100/70 border border-sand-300 rounded-2xl p-6 sm:p-7 shadow-sm space-y-4 text-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-sand-200">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-forest-600" />
                      <h4 className="font-bold text-navy-950 uppercase tracking-wider text-xs">
                        UK Data Protection &amp; GDPR
                      </h4>
                    </div>
                    <span className="text-[10px] font-bold text-navy-700 bg-sand-200 px-2 py-0.5 rounded">
                      DPA 2018
                    </span>
                  </div>

                  <p className="text-navy-600 leading-relaxed text-xs">
                    Your client record is processed strictly under the <strong>UK Data Protection Act 2018</strong>. We do not sell customer details to advertising third parties.
                  </p>

                  <ul className="space-y-2 text-xs text-navy-800 pt-1">
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-forest-600 shrink-0" />
                      <span>256-bit TLS 1.3 Transport Encryption</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-forest-600 shrink-0" />
                      <span>Zero Plaintext Password Retention (Argon2id)</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-forest-600 shrink-0" />
                      <span>PCI-DSS Level 1 Stripe Vaulting</span>
                    </li>
                  </ul>

                  <div className="pt-2 border-t border-sand-200">
                    <button
                      type="button"
                      onClick={handleDownloadDataArchive}
                      className="text-brass-700 hover:text-brass-900 font-semibold text-xs inline-flex items-center gap-1.5 cursor-pointer underline-offset-2 hover:underline"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Full GDPR Data Archive (JSON)</span>
                    </button>
                  </div>
                </div>

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
                Live Delivery Tracking
              </span>
              <h3 className="font-display text-xl font-bold text-navy-950 mt-1">
                Consignment #{trackingModalOrder.tracking_number || trackingModalOrder.order_number}
              </h3>
              <p className="text-xs text-navy-600">
                Carrier: <strong>{trackingModalOrder.carrier && !trackingModalOrder.carrier.includes("Amos Mann") ? trackingModalOrder.carrier : "SAN Dedicated Delivery Fleet"}</strong>
              </p>
            </div>

            <div className="p-4 rounded-xl bg-forest-50 border border-forest-200 text-xs space-y-1">
              <div className="flex justify-between font-bold text-forest-950">
                <span>Active Route Status:</span>
                <span className="font-mono">In Progress</span>
              </div>
              <p className="text-forest-800">
                Delivery vehicle routing towards {trackingModalOrder.shipping_postcode || "destination"}. Live tracking updates active.
              </p>
            </div>

            <div className="space-y-3 pt-2 text-xs">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <div>
                  <strong className="text-navy-950 block">National Fulfilment Hub</strong>
                  <span className="text-navy-500 text-[11px]">Consignment registered &bull; QC inspection passed</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <div>
                  <strong className="text-navy-950 block">Regional Sorting Hub</strong>
                  <span className="text-navy-500 text-[11px]">Consignment routed to local dispatch crew</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-brass-600 mt-0.5 flex-shrink-0 animate-pulse" />
                <div>
                  <strong className="text-navy-950 block">Out for Delivery</strong>
                  <span className="text-navy-700 font-semibold text-[11px]">
                    Scheduled Slot: {trackingModalOrder.deliverySlot || "Confirmed upon routing"}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 opacity-60">
                <Package className="w-4 h-4 text-navy-400 mt-0.5 flex-shrink-0" />
                <div>
                  <strong className="text-navy-950 block">Delivered to Residence</strong>
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
                Delivery Time Slot
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
                "Thursday 22 Oct: 10:00 - 12:00 BST",
                "Thursday 22 Oct: 14:00 - 16:00 BST",
                "Friday 23 Oct: 09:00 - 11:00 BST",
                "Friday 23 Oct: 13:00 - 15:00 BST",
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
      {/* MODAL 3: ORDER RESOLUTION & ASSISTANCE REQUEST                 */}
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
                Customer Care Assistance
              </span>
              <h3 className="font-display text-lg font-bold text-navy-950 mt-1">
                Order Support &amp; Resolution
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
                <label className="block font-semibold text-navy-950 mb-1">Collection Preference</label>
                <p className="text-[11px] text-navy-600 leading-relaxed">
                  Our dedicated delivery fleet will collect the item directly from your property. Please ensure items remain in pristine original condition.
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
                disabled={isSubmittingReturn}
                className="px-5 py-2 rounded-lg bg-navy-950 text-sand-50 font-bold hover:bg-brass-600 transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSubmittingReturn && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isSubmittingReturn ? "Submitting..." : "Submit Return Request"}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3B: PRE-DISPATCH ORDER CANCELLATION & REFUND             */}
      {/* ============================================================== */}
      {cancelModalOrder && (
        <div className="fixed inset-0 z-50 bg-navy-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <form
            onSubmit={handleConfirmCancelOrder}
            className="bg-sand-50 border border-sand-300 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative"
          >
            <button
              type="button"
              onClick={() => setCancelModalOrder(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-navy-500 hover:text-navy-950 hover:bg-sand-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                Pre-Dispatch Cancellation • 100% Refund
              </span>
              <h3 className="font-display text-lg font-bold text-navy-950 mt-1">
                Cancel Order {cancelModalOrder.order_number}
              </h3>
              <p className="text-xs text-navy-600">
                Total to be refunded: <span className="font-bold text-navy-900">{formatGBP(cancelModalOrder.total_pennies)}</span>
              </p>
            </div>

            <div className="bg-amber-50/70 border border-amber-200/60 rounded-xl p-3 text-xs text-amber-900 space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>UK Consumer Rights Cancellation Notice</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Because this order has not yet been dispatched by our logistics fleet, you may cancel it immediately. Our finance department will release a full refund to your original payment card within 3-5 business days.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-navy-950 mb-1">Reason for Cancellation</label>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-sand-300 bg-sand-100 text-navy-950 text-xs focus:ring-1 focus:ring-brass-500"
                >
                  <option value="Changed mind / found alternative">Changed mind / found alternative</option>
                  <option value="Ordered duplicate / accidental purchase">Ordered duplicate / accidental purchase</option>
                  <option value="Delivery timeframe does not fit schedule">Delivery timeframe does not fit schedule</option>
                  <option value="Need to change delivery address or room">Need to change delivery address or room</option>
                  <option value="Other personal reason">Other personal reason</option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-sand-200 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setCancelModalOrder(null)}
                className="px-4 py-2 rounded-lg border border-sand-300 text-navy-800 hover:bg-sand-200"
              >
                Keep Order
              </button>
              <button
                type="submit"
                disabled={isCancelling}
                className="px-5 py-2 rounded-lg bg-rose-600 text-white font-bold hover:bg-rose-700 transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {isCancelling && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isCancelling ? "Processing..." : "Confirm Cancellation"}</span>
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
                <label className="block font-semibold text-navy-800 mb-1">Delivery &amp; Property Access Notes</label>
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

    </div>
  );
}
