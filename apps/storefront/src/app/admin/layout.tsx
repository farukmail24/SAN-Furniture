"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Truck,
  ShieldAlert,
  Rss,
  History,
  LogOut,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Menu,
  X,
  Search,
  CheckCircle2,
  Lock,
  User,
  UserCheck,
  MessageSquare,
  Tag,
  Settings,
  Building2,
  SlidersHorizontal,
  FolderTree,
  Users,
  Image as ImageIcon,
  Bell,
  Headphones,
  AlertTriangle,
  Clock,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronLeft,
  Trash2,
  LayoutTemplate,
  ShieldCheck
} from "lucide-react";
import { apiUrl } from "@/lib/api-config";

interface AdminNotification {
  id: string;
  recipient_type: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  is_read: number;
  created_at: string;
}

interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/admin/login";
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [backendStatus, setBackendStatus] = useState<"checking" | "online" | "offline">("checking");
  const userDropdownRef = useRef<HTMLDivElement>(null);

  // Collapsible Sidebar State (Persisted in localStorage)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("san_admin_sidebar_collapsed");
      if (saved !== null) {
        setIsSidebarCollapsed(saved === "true");
      }
    } catch {}
  }, []);

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("san_admin_sidebar_collapsed", String(next));
      } catch {}
      return next;
    });
  };

  // Operations Notifications & Live Orders Badge State
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [openTicketsCount, setOpenTicketsCount] = useState<number>(3);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const notificationDropdownRef = useRef<HTMLDivElement>(null);
  const isFetchingNotifications = useRef(false);

  // Fetch admin notifications and pending dispatch orders count
  const fetchNotifications = useCallback(async () => {
    if (document.visibilityState !== "visible" || isFetchingNotifications.current) return;
    isFetchingNotifications.current = true;
    const token = typeof window !== "undefined" ? localStorage.getItem("san_admin_token") : null;
    const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      const [notificationResult, metricsResult, ticketsResult] = await Promise.allSettled([
        fetch(apiUrl("/api/notifications?recipient_type=admin&limit=15"), {
          signal: AbortSignal.timeout(8000),
          headers: authHeaders,
        }).then(async (res) => {
          if (!res.ok) throw new Error(`Notification request failed (${res.status})`);
          return res.json();
        }),
        fetch(apiUrl("/api/admin/metrics"), {
          signal: AbortSignal.timeout(8000),
          headers: authHeaders,
        }).then(async (res) => {
          if (!res.ok) throw new Error(`Admin metrics request failed (${res.status})`);
          return res.json();
        }),
        fetch(apiUrl("/api/support/tickets?limit=1"), {
          signal: AbortSignal.timeout(8000),
          headers: authHeaders,
        }).then(async (res) => {
          if (!res.ok) throw new Error(`Tickets request failed (${res.status})`);
          return res.json();
        }),
      ]);

      if (notificationResult.status === "fulfilled") {
        const data = notificationResult.value;
        setNotifications(data.notifications || []);
        setUnreadCount(Number(data.unread_count || 0));
      } else {
        console.warn("Admin notification refresh failed:", notificationResult.reason);
      }

      if (metricsResult.status === "fulfilled") {
        const overview = metricsResult.value.overview;
        if (overview?.awaitingDispatchOrders !== undefined) {
          setNewOrdersCount(Number(overview.awaitingDispatchOrders));
        }
      } else {
        console.warn("Admin metrics refresh failed:", metricsResult.reason);
      }

      if (ticketsResult.status === "fulfilled") {
        const counts = ticketsResult.value?.counts;
        const totalOpen = Number(counts?.open || 0) + Number(counts?.in_progress || 0);
        if (totalOpen > 0) {
          setOpenTicketsCount(totalOpen);
        }
      }
    } finally {
      isFetchingNotifications.current = false;
    }
  }, []);

  useEffect(() => {
    if (isLoginPage) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    document.addEventListener("visibilitychange", fetchNotifications);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", fetchNotifications);
    };
  }, [fetchNotifications, isLoginPage]);

  useEffect(() => {
    if (isLoginPage) return;

    let isMounted = true;
    const checkBackendStatus = async () => {
      try {
        const response = await fetch(apiUrl("/api/health"), {
          signal: AbortSignal.timeout(5000),
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error(`Admin API health check failed (${response.status})`);
        }

        const data = await response.json();
        if ((data?.status !== "healthy" && !data?.overview) || !isMounted) {
          if (isMounted) setBackendStatus("offline");
          return;
        }
        setBackendStatus("online");
      } catch {
        if (isMounted) setBackendStatus("offline");
      }
    };

    checkBackendStatus();
    const interval = setInterval(checkBackendStatus, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isLoginPage]);

  const handleMarkAsRead = async (id: string, link?: string) => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("san_admin_token") : null;
      await fetch(apiUrl(`/api/notifications/${id}/read`), {
        method: "PATCH",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
      if (link) {
        setIsNotificationOpen(false);
        router.push(link);
      }
    } catch {}
  };

  const handleMarkAllAsRead = async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("san_admin_token") : null;
      await fetch(apiUrl("/api/notifications/read-all"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ recipient_type: "admin" }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    } catch {}
  };

  const handleDeleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("san_admin_token") : null;
      const res = await fetch(apiUrl(`/api/notifications/${id}`), {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        setUnreadCount((prev) => {
          const notif = notifications.find((n) => n.id === id);
          return notif && !notif.is_read ? Math.max(0, prev - 1) : prev;
        });
      }
    } catch {}
  };

  // Auto-close dropdowns on route changes
  useEffect(() => {
    setIsUserMenuOpen(false);
    setIsNotificationOpen(false);
  }, [pathname]);

  // Close dropdowns on outside clicks
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (notificationDropdownRef.current && !notificationDropdownRef.current.contains(e.target as Node)) {
        setIsNotificationOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {

    // Check local admin session
    const token = localStorage.getItem("san_admin_token");
    const storedUser = localStorage.getItem("san_admin_user");

    if (!token || !storedUser) {
      router.replace("/admin/login");
      return;
    }

    try {
      setCurrentUser(JSON.parse(storedUser));
    } catch {
      router.replace("/admin/login");
    }
  }, [pathname]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  const handleLogout = () => {
    localStorage.removeItem("san_admin_token");
    localStorage.removeItem("san_admin_user");
    document.cookie = "san_admin_token=; Max-Age=0; path=/;";
    router.push("/admin/login");
  };

  const navLinks = [
    {
      name: "Dashboard",
      href: "/admin",
      icon: LayoutDashboard,
      active: pathname === "/admin"
    },
    {
      name: "Products & Inventory",
      href: "/admin/products",
      icon: Package,
      active: pathname.startsWith("/admin/products")
    },
    {
      name: "Categories",
      href: "/admin/categories",
      icon: FolderTree,
      active: pathname.startsWith("/admin/categories")
    },
    {
      name: "Global Media Library",
      href: "/admin/media",
      icon: ImageIcon,
      active: pathname.startsWith("/admin/media")
    },
    {
      name: "Page Content (CMS)",
      href: "/admin/pages",
      icon: LayoutTemplate,
      active: pathname.startsWith("/admin/pages")
    },
    {
      name: "Customer Orders",
      href: "/admin/orders",
      icon: ShoppingBag,
      active: pathname.startsWith("/admin/orders"),
      badge: newOrdersCount > 0 ? `${newOrdersCount}` : undefined
    },
    {
      name: "Customer Helpdesk",
      href: "/admin/support",
      icon: Headphones,
      active: pathname.startsWith("/admin/support"),
      badge: openTicketsCount > 0 ? `${openTicketsCount}` : undefined
    },
    {
      name: "Notifications Hub",
      href: "/admin/notifications",
      icon: Bell,
      active: pathname.startsWith("/admin/notifications"),
      badge: unreadCount > 0 ? `${unreadCount}` : undefined
    },
    {
      name: "Customers (CRM)",
      href: "/admin/customers",
      icon: Users,
      active: pathname.startsWith("/admin/customers")
    },
    {
      name: "Staff & User Roles",
      href: "/admin/users",
      icon: UserCheck,
      active: pathname.startsWith("/admin/users")
    },
    {
      name: "Dropship Suppliers",
      href: "/admin/suppliers",
      icon: Building2,
      active: pathname.startsWith("/admin/suppliers")
    },
    {
      name: "UK Logistics & Postcodes",
      href: "/admin/logistics",
      icon: SlidersHorizontal,
      active: pathname.startsWith("/admin/logistics")
    },
    {
      name: "Security & IP Jail",
      href: "/admin/security",
      icon: ShieldAlert,
      active: pathname.startsWith("/admin/security")
    },
    {
      name: "Google & Meta Feeds",
      href: "/admin/marketing",
      icon: Rss,
      active: pathname.startsWith("/admin/marketing")
    },
    {
      name: "Customer Reviews",
      href: "/admin/reviews",
      icon: MessageSquare,
      active: pathname.startsWith("/admin/reviews")
    },
    {
      name: "Promotions & Vouchers",
      href: "/admin/promotions",
      icon: Tag,
      active: pathname.startsWith("/admin/promotions")
    },
    {
      name: "Audit Trail & Logs",
      href: "/admin/audit",
      icon: History,
      active: pathname.startsWith("/admin/audit")
    },
    {
      name: "System Settings",
      href: "/admin/settings",
      icon: Settings,
      active: pathname.startsWith("/admin/settings")
    }
  ];

  return (
    <div className="min-h-screen bg-[#F4F1EA] print:bg-white print:min-h-0 text-[#00072D] flex flex-col lg:flex-row antialiased w-full" suppressHydrationWarning>
      {/* Mobile Top Bar */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-[#00072D] text-sand-50 border-b border-navy-800 print:hidden">
        <div className="flex items-center gap-2">
          <img
            src="/San-Furniture-Logo-Dark.png"
            alt="SAN Furniture Operations"
            width={120} height={28} className="h-7 w-auto object-contain"
          />
        </div>
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-1.5 rounded-md text-sand-200 hover:text-sand-50 hover:bg-navy-800"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Backdrop Overlay */}
      <div
        className={`fixed inset-0 bg-navy-950/70 backdrop-blur-sm z-40 transition-opacity lg:hidden ${
          isMobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        } print:hidden`}
        onClick={() => setIsMobileMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Enterprise Dark Navy Left Sidebar (Collapsible with smooth transition) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-[#00072D] text-sand-100 flex flex-col border-r border-navy-800 transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? "lg:w-20" : "lg:w-64"
        } w-64 ${
          isMobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"
        } print:hidden`}
      >
        {/* Brand Header (Flexible / Unfixed) */}
        <div className={`p-4 border-b border-navy-800/80 bg-[#00072D] flex items-center ${
          isSidebarCollapsed ? "justify-center" : "justify-between"
        }`}>
          {!isSidebarCollapsed ? (
            <Link href="/admin" className="block min-w-0">
              <img
                src="/San-Furniture-Logo-Dark.png"
                alt="SAN Furniture Operations"
                width={140} height={36} className="h-9 w-auto object-contain"
              />
              <div className="flex items-center gap-1.5 mt-1.5 px-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-semibold text-brass-400 uppercase tracking-widest">
                  Operations Suite v2.4
                </span>
              </div>
            </Link>
          ) : (
            <Link href="/admin" className="flex flex-col items-center justify-center py-1 group" title="SAN Operations Suite">
              <span className="font-display font-black text-brass-400 text-lg tracking-wider group-hover:scale-105 transition-transform">SAN</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mt-0.5" />
            </Link>
          )}

          {/* Sidebar Collapse Toggle Button (Inside header) */}
          <button
            type="button"
            onClick={toggleSidebar}
            className={`hidden lg:flex items-center justify-center p-1.5 rounded-lg text-sand-400 hover:text-sand-100 hover:bg-navy-900 transition-colors cursor-pointer ${
              isSidebarCollapsed ? "mt-2" : ""
            }`}
            title={isSidebarCollapsed ? "Expand Sidebar (w-64)" : "Collapse Sidebar (w-20)"}
            aria-label="Toggle Sidebar Navigation"
          >
            {isSidebarCollapsed ? (
              <ChevronRight className="w-4 h-4 text-brass-400" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-sand-400" />
            )}
          </button>
        </div>

        {/* Scrollable Navigation Links (Middle Container with beautiful slim custom scrollbar) */}
        <nav className="flex-1 overflow-y-auto admin-sidebar-scroll min-h-0 p-3 space-y-1">
          {!isSidebarCollapsed && (
            <div className="text-[10px] font-bold uppercase tracking-wider text-sand-400 px-3 py-1.5">
              Management Suite
            </div>
          )}
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = link.active;
            return (
              <Link
                key={link.name}
                href={link.href}
                prefetch={false}
                title={link.name}
                onMouseEnter={() => router.prefetch(link.href)}
                onFocus={() => router.prefetch(link.href)}
                onClick={() => {
                  setIsMobileMenuOpen(false);
                }}
                className={`flex items-center ${
                  isSidebarCollapsed ? "justify-center p-3" : "justify-between px-3 py-2.5"
                } rounded-xl text-xs font-medium active:scale-[0.97] transition-all relative ${
                  isActive
                    ? "bg-brass-500/20 text-brass-400 border border-brass-500/35 font-semibold shadow-xs"
                    : "text-sand-300 hover:bg-navy-900 hover:text-sand-50"
                }`}
              >
                <div className={`flex items-center ${isSidebarCollapsed ? "justify-center" : "gap-3"}`}>
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-brass-400" : "text-sand-400"}`} />
                  {!isSidebarCollapsed && (
                    <span className="truncate flex items-center gap-1.5">
                      {link.name}
                    </span>
                  )}
                </div>
                {!isSidebarCollapsed && link.badge && (
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      (link.name === "Customer Orders" || link.name === "Customer Helpdesk") && !isActive
                        ? "bg-amber-500/25 text-amber-300 border border-amber-500/40"
                        : isActive
                        ? "bg-brass-500 text-navy-950"
                        : "bg-navy-800 text-sand-300 border border-navy-700"
                    }`}
                  >
                    {link.badge}
                  </span>
                )}
                {isSidebarCollapsed && link.badge && (
                  <span
                    className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ring-2 ring-[#00072D] ${
                      link.name === "Customer Orders" || link.name === "Customer Helpdesk" ? "bg-amber-400 animate-pulse" : "bg-brass-500"
                    }`}
                    title={`${link.name}: ${link.badge}`}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Profile & Actions (Live UK Storefront button moved to topbar!) */}
        <div className={`shrink-0 border-t border-navy-800/80 bg-[#060B1A] p-3 space-y-2.5 shadow-lg ${
          isSidebarCollapsed ? "flex flex-col items-center" : ""
        }`}>
          {/* User Info */}
          {!isSidebarCollapsed ? (
            <div className="flex items-center gap-3 px-2 py-1">
              <div className="w-8 h-8 rounded-full bg-navy-800 border border-brass-500/40 flex items-center justify-center text-brass-400 font-bold text-xs shadow-inner shrink-0">
                {currentUser?.fullName ? currentUser.fullName.charAt(0) : "A"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-sand-100 truncate">
                  {currentUser?.fullName || "Admin Operator"}
                </p>
                <div className="flex items-center gap-1">
                  <UserCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                  <p className="text-[10px] text-sand-400 font-medium capitalize truncate">
                    {currentUser?.role?.replace("_", " ") || "Super Admin"}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div
              className="w-9 h-9 rounded-full bg-navy-800 border border-brass-500/40 flex items-center justify-center text-brass-400 font-bold text-xs shadow-inner cursor-pointer"
              title={`${currentUser?.fullName || "Admin Operator"} (${currentUser?.role || "Super Admin"})`}
            >
              {currentUser?.fullName ? currentUser.fullName.charAt(0) : "A"}
            </div>
          )}

          {/* Logout Button */}
          <button
            type="button"
            onClick={handleLogout}
            title="Secure Logout"
            className={`w-full flex items-center justify-center gap-2 rounded-lg bg-red-950/30 hover:bg-red-900/50 text-red-300 hover:text-red-100 border border-red-900/40 font-semibold transition-colors ${
              isSidebarCollapsed ? "p-2.5" : "px-3 py-2 text-xs"
            }`}
          >
            <LogOut className="w-3.5 h-3.5 shrink-0" />
            {!isSidebarCollapsed && <span>Secure Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Operations Canvas (Responsive offset based on collapsed/expanded state) */}
      <div
        className={`flex-1 flex flex-col min-w-0 w-full transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? "lg:pl-20" : "lg:pl-64"
        } min-h-screen print:pl-0 print:p-0 print:m-0 print:min-h-0 print:bg-white`}
        suppressHydrationWarning
      >
        {/* Top Operations Header with User Profile Dropdown */}
        <header className="sticky top-0 z-30 bg-sand-50/95 backdrop-blur-md border-b border-sand-200 px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-3 sm:gap-4 w-full shadow-sm print:hidden">
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Desktop Sidebar Toggle Button */}
            <button
              type="button"
              onClick={toggleSidebar}
              className="hidden lg:flex items-center justify-center p-2 rounded-xl bg-sand-100 hover:bg-sand-200 border border-sand-300 text-navy-800 transition-colors shadow-xs active-press cursor-pointer"
              title={isSidebarCollapsed ? "Expand Sidebar (w-64)" : "Collapse Sidebar (w-20)"}
              aria-label="Toggle Sidebar"
            >
              {isSidebarCollapsed ? (
                <PanelLeftOpen className="w-4 h-4 text-navy-900" />
              ) : (
                <PanelLeftClose className="w-4 h-4 text-navy-900" />
              )}
            </button>

            <span className="text-xs font-medium text-navy-600 hidden md:inline">Terminal:</span>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-semibold ${
              backendStatus === "online"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : backendStatus === "offline"
                  ? "bg-red-50 border-red-200 text-red-800"
                  : "bg-sand-100 border-sand-300 text-navy-700"
            }`}>
              <CheckCircle2 className={`w-3.5 h-3.5 ${
                backendStatus === "online"
                  ? "text-emerald-600"
                  : backendStatus === "offline"
                    ? "text-red-600"
                    : "text-navy-500"
              }`} />
              <span className="hidden sm:inline">
                {backendStatus === "online" ? "API & Database Connected" : backendStatus === "offline" ? "Backend Unavailable" : "Checking Backend"}
              </span>
              <span className="sm:hidden">
                {backendStatus === "online" ? "Connected" : backendStatus === "offline" ? "Offline" : "Checking"}
              </span>
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live UK Storefront Button in Topbar (MOVED FROM SIDEBAR) */}
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sand-100 hover:bg-sand-200 border border-sand-300 text-xs font-semibold text-navy-950 transition-colors shadow-xs active-press"
              title="Open Live UK Customer Storefront in New Tab"
            >
              <ExternalLink className="w-3.5 h-3.5 text-brass-600" />
              <span className="hidden sm:inline">Live UK Storefront</span>
            </Link>

            <Link
              href="/admin/products"
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-navy-950 hover:bg-navy-900 text-sand-50 text-xs font-semibold transition-colors shadow-sm"
            >
              <Package className="w-3.5 h-3.5 text-brass-400" />
              <span>Manage Products</span>
            </Link>

            {/* Topbar Operations Notifications Bell & Dropdown */}
            <div className="relative" ref={notificationDropdownRef}>
              <button
                type="button"
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className="relative p-2 rounded-full bg-sand-100 hover:bg-sand-200 border border-sand-300 text-navy-800 transition-colors shadow-xs focus:outline-none focus:ring-2 focus:ring-brass-500/50 cursor-pointer"
                aria-label="Operations Notifications"
                aria-expanded={isNotificationOpen}
              >
                <Bell className="w-4 h-4 text-navy-800" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-brass-600 text-navy-950 text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse shadow-sm">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {/* Luxury Notifications Drawer */}
              {isNotificationOpen && (
                <div className="absolute right-0 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-sand-300 shadow-2xl p-0 z-50 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
                  <div className="p-3.5 bg-[#00072D] text-sand-50 flex items-center justify-between border-b border-navy-800">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-brass-400" />
                      <span className="text-xs font-bold text-sand-50">Operations Alerts</span>
                      {unreadCount > 0 && (
                        <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-brass-500 text-navy-950">
                          {unreadCount} unread
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllAsRead}
                        className="text-[11px] text-brass-300 hover:text-sand-50 transition-colors font-medium cursor-pointer"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-sand-200">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-navy-500">
                        <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-1.5 opacity-80" />
                        <p>No operational alerts at this time.</p>
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => handleMarkAsRead(n.id, n.link)}
                          className={`p-3 text-xs transition-colors cursor-pointer flex items-start gap-2.5 ${
                            n.is_read ? "bg-white hover:bg-sand-50" : "bg-sand-100/70 hover:bg-sand-100 font-medium"
                          }`}
                        >
                          <div className="mt-0.5 w-6 h-6 rounded-full bg-sand-200 flex items-center justify-center flex-shrink-0 text-navy-800">
                            {n.type === "order_created" ? (
                              <ShoppingBag className="w-3.5 h-3.5 text-brass-600" />
                            ) : n.type === "ticket_created" || n.type === "ticket_reply" ? (
                              <Headphones className="w-3.5 h-3.5 text-emerald-600" />
                            ) : n.type === "security_alert" ? (
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                            ) : (
                              <Bell className="w-3.5 h-3.5 text-navy-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1 mb-0.5">
                              <h5 className="font-bold text-navy-950 text-xs truncate">{n.title}</h5>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                {!n.is_read && (
                                  <span className="w-2 h-2 rounded-full bg-brass-600 flex-shrink-0" />
                                )}
                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteNotification(n.id, e)}
                                  className="p-1 rounded text-navy-400 hover:text-rose-600 hover:bg-sand-200 transition-colors cursor-pointer"
                                  title="Delete Notification"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                            <p className="text-[11px] text-navy-600 line-clamp-2 leading-relaxed">{n.message}</p>
                            <span className="text-[10px] text-navy-400 mt-1 block">
                              {new Date(n.created_at).toLocaleTimeString("en-GB", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="p-2.5 bg-sand-50 border-t border-sand-200 space-y-1.5 text-center">
                    <Link
                      href="/admin/notifications"
                      onClick={() => setIsNotificationOpen(false)}
                      className="w-full py-1.5 px-3 rounded-lg bg-navy-950 text-sand-50 hover:bg-navy-900 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                    >
                      <Bell className="w-3.5 h-3.5 text-brass-400" />
                      <span>Manage &amp; View All Notifications</span>
                      <ChevronRight className="w-3 h-3 text-sand-300" />
                    </Link>
                    <Link
                      href="/admin/support"
                      onClick={() => setIsNotificationOpen(false)}
                      className="text-[11px] font-medium text-navy-600 hover:text-navy-950 inline-flex items-center gap-1"
                    >
                      <span>Open Customer Support Helpdesk</span>
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Topbar User Profile Dropdown */}
            <div className="relative" ref={userDropdownRef}>
              <button
                type="button"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2.5 p-1 sm:px-3 sm:py-1.5 rounded-full bg-sand-100/90 hover:bg-sand-200 border border-sand-300 text-xs font-semibold text-navy-950 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-brass-500/50"
                aria-label="User Account Menu"
                aria-expanded={isUserMenuOpen}
              >
                <div className="w-7 h-7 rounded-full bg-[#00072D] border border-brass-500/50 flex items-center justify-center text-brass-400 font-bold text-xs shadow-inner">
                  {currentUser?.fullName ? currentUser.fullName.charAt(0) : "A"}
                </div>
                <div className="hidden md:flex flex-col text-left">
                  <span className="text-xs font-bold leading-none text-[#00072D]">
                    {currentUser?.fullName || "SAN Operations Lead"}
                  </span>
                  <span className="text-[10px] text-navy-600 font-medium capitalize mt-0.5">
                    {currentUser?.role?.replace("_", " ") || "Super Admin"}
                  </span>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-navy-600 transition-transform duration-200 ${
                    isUserMenuOpen ? "rotate-180 text-brass-600" : ""
                  }`}
                />
              </button>

              {/* Luxury Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-sand-300 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  {/* Dropdown Header Info */}
                  <div className="p-3 bg-sand-50 rounded-xl border border-sand-200/70 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-[#00072D] border border-brass-500/60 flex items-center justify-center text-brass-400 font-bold text-sm shadow">
                        {currentUser?.fullName ? currentUser.fullName.charAt(0) : "A"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-navy-950 truncate">
                          {currentUser?.fullName || "SAN Operations Lead"}
                        </p>
                        <p className="text-[11px] text-navy-600 truncate">
                          {currentUser?.email || "admin@sanfurniture.com"}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2.5 pt-2 border-t border-sand-200/60 flex items-center justify-between text-[10px]">
                      <span className="text-navy-500 font-medium">Privilege Role:</span>
                      <span className="font-bold text-brass-700 bg-brass-50 px-2 py-0.5 rounded-full border border-brass-200 capitalize">
                        {currentUser?.role?.replace("_", " ") || "Super Admin"}
                      </span>
                    </div>
                  </div>

                  {/* Dropdown Navigation Actions */}
                  <div className="space-y-0.5 text-xs">
                    <Link
                      href="/admin/users"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-navy-800 hover:text-navy-950 hover:bg-sand-100 transition-colors font-medium"
                    >
                      <User className="w-4 h-4 text-brass-600" />
                      <span>Profile & My Account</span>
                    </Link>
                    <Link
                      href="/admin/users"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-navy-800 hover:text-navy-950 hover:bg-sand-100 transition-colors font-medium"
                    >
                      <UserCheck className="w-4 h-4 text-emerald-600" />
                      <span>Staff & User Roles (RBAC)</span>
                    </Link>
                    <Link
                      href="/admin/settings"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-navy-800 hover:text-navy-950 hover:bg-sand-100 transition-colors font-medium"
                    >
                      <Settings className="w-4 h-4 text-brass-600" />
                      <span>System Configuration</span>
                    </Link>
                    <Link
                      href="/admin/security"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-navy-800 hover:text-navy-950 hover:bg-sand-100 transition-colors font-medium"
                    >
                      <ShieldAlert className="w-4 h-4 text-rose-600" />
                      <span>Security & IP Lockout</span>
                    </Link>
                    <Link
                      href="/"
                      target="_blank"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-navy-800 hover:text-navy-950 hover:bg-sand-100 transition-colors font-medium"
                    >
                      <ExternalLink className="w-4 h-4 text-blue-600" />
                      <span>Live UK Storefront</span>
                    </Link>
                  </div>

                  {/* Divider & Logout Button */}
                  <div className="mt-2 pt-2 border-t border-sand-200">
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-rose-700 hover:text-rose-900 hover:bg-rose-50 transition-colors font-semibold text-xs"
                    >
                      <LogOut className="w-4 h-4 text-rose-600" />
                      <span>Secure Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full print:p-0 print:m-0" suppressHydrationWarning>
          {children}
        </main>
      </div>
    </div>
  );
}
