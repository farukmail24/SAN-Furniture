"use client";

import React, { useState, useEffect, useRef } from "react";
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
  ChevronLeft
} from "lucide-react";
import { preloadAdminRoutes, preloadCache } from "@/lib/api-cache";
import { apiUrl } from "@/lib/api-config";

const ADMIN_API_PREFETCH_MAP: Record<string, string> = {
  "/admin": "/api/admin/metrics",
  "/admin/products": "/api/admin/products",
  "/admin/categories": "/api/admin/categories",
  "/admin/media": "/api/admin/media",
  "/admin/orders": "/api/admin/orders",
  "/admin/support": "/api/support/tickets",
  "/admin/customers": "/api/admin/customers",
  "/admin/users": "/api/admin/users",
  "/admin/suppliers": "/api/admin/suppliers",
  "/admin/logistics": "/api/admin/logistics",
  "/admin/security": "/api/security/ip-jail",
  "/admin/marketing": "/api/admin/promotions",
  "/admin/reviews": "/api/admin/reviews",
  "/admin/promotions": "/api/admin/promotions",
  "/admin/audit": "/api/admin/audit?limit=25",
  "/admin/settings": "/api/admin/settings",
};

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
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

  // Operations Notifications State
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const notificationDropdownRef = useRef<HTMLDivElement>(null);

  // Fetch admin notifications
  const fetchNotifications = async () => {
    try {
      const res = await fetch(apiUrl("/api/notifications?recipient_type=admin&limit=15"));
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(Number(data.unread_count || 0));
      }
    } catch {}
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 25000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (id: string, link?: string) => {
    try {
      await fetch(apiUrl(`/api/notifications/${id}/read`), { method: "PATCH" });
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
      await fetch(apiUrl("/api/notifications/read-all"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipient_type: "admin" }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    } catch {}
  };

  // If on login page, render clean full-screen login container without sidebar
  const isLoginPage = pathname === "/admin/login";

  // Preload route bundle and API cache on hover/touch for instant 0ms switching
  const handlePrefetch = (href: string) => {
    try {
      router.prefetch(href);
      const endpoint = ADMIN_API_PREFETCH_MAP[href];
      if (endpoint) {
        preloadCache(apiUrl(endpoint));
      }
    } catch {}
  };

  // Auto-close user and notification dropdown on route changes
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
    // Warm up admin route cache in background
    preloadAdminRoutes();
  }, [pathname]);

  useEffect(() => {

    // Check local admin session
    const storedUser = localStorage.getItem("san_admin_user");
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch {
        setCurrentUser(null);
      }
    } else {
      // Default fallback session for smooth dev experience
      setCurrentUser({
        id: "admin_usr_01",
        email: "admin@sanfurniture.com",
        fullName: "SAN Operations Lead",
        role: "super_admin"
      });
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
      name: "Dashboard & KPIs",
      href: "/admin",
      icon: LayoutDashboard,
      active: pathname === "/admin"
    },
    {
      name: "Products & Inventory",
      href: "/admin/products",
      icon: Package,
      active: pathname.startsWith("/admin/products"),
      badge: "CRUD"
    },
    {
      name: "Categories & Taxonomy",
      href: "/admin/categories",
      icon: FolderTree,
      active: pathname.startsWith("/admin/categories")
    },
    {
      name: "Global Media Library",
      href: "/admin/media",
      icon: ImageIcon,
      active: pathname.startsWith("/admin/media"),
      badge: "DAM"
    },
    {
      name: "Customer Orders & POs",
      href: "/admin/orders",
      icon: ShoppingBag,
      active: pathname.startsWith("/admin/orders")
    },
    {
      name: "Customer Helpdesk",
      href: "/admin/support",
      icon: Headphones,
      active: pathname.startsWith("/admin/support"),
      badge: "Tickets"
    },
    {
      name: "Customers (CRM)",
      href: "/admin/customers",
      icon: Users,
      active: pathname.startsWith("/admin/customers"),
      badge: "CRM"
    },
    {
      name: "Staff & User Roles",
      href: "/admin/users",
      icon: UserCheck,
      active: pathname.startsWith("/admin/users"),
      badge: "RBAC"
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
      active: pathname.startsWith("/admin/security"),
      badge: "WAF"
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
      active: pathname.startsWith("/admin/settings"),
      badge: "Core"
    }
  ];

  return (
    <div className="min-h-screen bg-[#F4F1EA] text-[#070D1E] flex flex-col lg:flex-row antialiased w-full" suppressHydrationWarning>
      {/* Mobile Top Bar */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-[#0B132B] text-sand-50 border-b border-navy-800">
        <div className="flex items-center gap-2">
          <img
            src="/San-Furniture-Logo-Dark.png"
            alt="SAN Furniture Operations"
            className="h-7 w-auto object-contain"
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
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Enterprise Dark Navy Left Sidebar (Collapsible with smooth transition) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-[#070D1E] text-sand-100 flex flex-col border-r border-navy-800 transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? "lg:w-20" : "lg:w-64"
        } w-64 ${
          isMobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Brand Header (Flexible / Unfixed) */}
        <div className={`p-4 border-b border-navy-800/80 bg-[#070D1E] flex items-center ${
          isSidebarCollapsed ? "justify-center" : "justify-between"
        }`}>
          {!isSidebarCollapsed ? (
            <Link href="/admin" className="block min-w-0">
              <img
                src="/San-Furniture-Logo-Dark.png"
                alt="SAN Furniture Operations"
                className="h-9 w-auto object-contain"
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
                prefetch={true}
                title={link.name}
                onMouseEnter={() => handlePrefetch(link.href)}
                onTouchStart={() => handlePrefetch(link.href)}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center ${
                  isSidebarCollapsed ? "justify-center p-3" : "justify-between px-3 py-2.5"
                } rounded-xl text-xs font-medium transition-all relative ${
                  isActive
                    ? "bg-brass-500/20 text-brass-400 border border-brass-500/35 font-semibold shadow-xs"
                    : "text-sand-300 hover:bg-navy-900 hover:text-sand-50"
                }`}
              >
                <div className={`flex items-center ${isSidebarCollapsed ? "justify-center" : "gap-3"}`}>
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-brass-400" : "text-sand-400"}`} />
                  {!isSidebarCollapsed && <span className="truncate">{link.name}</span>}
                </div>
                {!isSidebarCollapsed && link.badge && (
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      isActive
                        ? "bg-brass-500 text-navy-950"
                        : "bg-navy-800 text-sand-300 border border-navy-700"
                    }`}
                  >
                    {link.badge}
                  </span>
                )}
                {isSidebarCollapsed && link.badge && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brass-500 ring-2 ring-[#070D1E]" title={link.badge} />
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
        } min-h-screen`}
        suppressHydrationWarning
      >
        {/* Top Operations Header with User Profile Dropdown */}
        <header className="sticky top-0 z-30 bg-sand-50/95 backdrop-blur-md border-b border-sand-200 px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-3 sm:gap-4 w-full shadow-sm">
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
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">All Systems Operational</span>
              <span className="sm:hidden">Operational</span>
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

            <div className="hidden xl:flex items-center gap-2 text-xs text-navy-700 bg-sand-100 px-3 py-1.5 rounded-xl border border-sand-200 font-mono">
              <Lock className="w-3.5 h-3.5 text-brass-600" />
              <span>TLS 1.3 UK Vault</span>
            </div>

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
                  <div className="p-3.5 bg-[#070D1E] text-sand-50 flex items-center justify-between border-b border-navy-800">
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
                              {!n.is_read && (
                                <span className="w-2 h-2 rounded-full bg-brass-600 flex-shrink-0" />
                              )}
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

                  <div className="p-2.5 bg-sand-50 border-t border-sand-200 text-center">
                    <Link
                      href="/admin/support"
                      onClick={() => setIsNotificationOpen(false)}
                      className="text-xs font-semibold text-brass-700 hover:text-brass-900 inline-flex items-center gap-1"
                    >
                      <span>Open Customer Support Helpdesk</span>
                      <ChevronRight className="w-3.5 h-3.5" />
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
                <div className="w-7 h-7 rounded-full bg-[#070D1E] border border-brass-500/50 flex items-center justify-center text-brass-400 font-bold text-xs shadow-inner">
                  {currentUser?.fullName ? currentUser.fullName.charAt(0) : "A"}
                </div>
                <div className="hidden md:flex flex-col text-left">
                  <span className="text-xs font-bold leading-none text-[#070D1E]">
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
                      <div className="w-9 h-9 rounded-full bg-[#070D1E] border border-brass-500/60 flex items-center justify-center text-brass-400 font-bold text-sm shadow">
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
        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full" suppressHydrationWarning>{children}</main>
      </div>
    </div>
  );
}
