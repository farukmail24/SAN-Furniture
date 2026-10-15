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
  Loader2
} from "lucide-react";
import { preloadAdminRoutes } from "@/lib/api-cache";

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
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  // If on login page, render clean full-screen login container without sidebar
  const isLoginPage = pathname === "/admin/login";

  // Auto-close user dropdown on route changes
  useEffect(() => {
    setIsUserMenuOpen(false);
  }, [pathname]);

  // Close user dropdown on outside clicks
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    // Clear pending path indicator on route arrival
    setPendingPath(null);

    // Warm up admin route cache in background
    preloadAdminRoutes();

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
        email: "admin@sanfurniture.co.uk",
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
      active: pathname.startsWith("/admin/orders"),
      badge: "HMRC VAT"
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

      {/* Enterprise Dark Navy Left Sidebar (Permanently Fixed to Viewport with Fixed Bottom Logout Section) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#070D1E] text-sand-100 flex flex-col border-r border-navy-800 transition-transform duration-200 lg:translate-x-0 ${
          isMobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        {/* Brand Header (Fixed Top) */}
        <div className="shrink-0 p-5 border-b border-navy-800/80 bg-[#070D1E]">
          <Link href="/admin" className="block">
            <img
              src="/San-Furniture-Logo-Dark.png"
              alt="SAN Furniture Operations"
              className="h-10 w-auto object-contain"
            />
          </Link>
          <div className="flex items-center gap-1.5 mt-2 px-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-semibold text-brass-400 uppercase tracking-widest">
              Operations Suite v2.4
            </span>
          </div>
        </div>

        {/* Scrollable Navigation Links (Middle Container) */}
        <nav className="flex-1 overflow-y-auto min-h-0 p-4 space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-sand-400 px-3 py-2">
            Management Suite
          </div>
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isPending = pendingPath === link.href;
            const isActive = link.active && !isPending;
            return (
              <Link
                key={link.name}
                href={link.href}
                prefetch={true}
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  if (pathname !== link.href) {
                    setPendingPath(link.href);
                  }
                }}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isPending
                    ? "bg-brass-500/25 text-brass-300 border border-brass-500/40 font-semibold shadow-inner"
                    : isActive
                    ? "bg-brass-500/15 text-brass-400 border border-brass-500/30 font-semibold"
                    : "text-sand-300 hover:bg-navy-900 hover:text-sand-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  {isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin text-brass-400" />
                  ) : (
                    <Icon className={`w-4 h-4 ${isActive ? "text-brass-400" : "text-sand-400"}`} />
                  )}
                  <span>{link.name}</span>
                </div>
                {isPending ? (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-brass-500/30 text-brass-300 animate-pulse">
                    Loading...
                  </span>
                ) : link.badge ? (
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      isActive
                        ? "bg-brass-500 text-navy-950"
                        : "bg-navy-800 text-sand-300 border border-navy-700"
                    }`}
                  >
                    {link.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        {/* Fixed Bottom Profile & Actions (Always Pinned to Bottom of Sidebar) */}
        <div className="shrink-0 mt-auto border-t border-navy-800/80 bg-[#060B1A] p-4 space-y-3 shadow-lg">
          {/* User Info */}
          <div className="flex items-center gap-3 px-2 py-1.5">
            <div className="w-8 h-8 rounded-full bg-navy-800 border border-brass-500/40 flex items-center justify-center text-brass-400 font-bold text-xs shadow-inner">
              {currentUser?.fullName ? currentUser.fullName.charAt(0) : "A"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-sand-100 truncate">
                {currentUser?.fullName || "Admin Operator"}
              </p>
              <div className="flex items-center gap-1">
                <UserCheck className="w-3 h-3 text-emerald-400" />
                <p className="text-[10px] text-sand-400 font-medium capitalize">
                  {currentUser?.role?.replace("_", " ") || "Super Admin"}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Storefront Link */}
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between px-3 py-2 rounded-md bg-navy-900/80 hover:bg-navy-800 text-[11px] text-sand-300 hover:text-sand-50 border border-navy-800 transition-colors"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5 text-brass-400" />
              Live UK Storefront
            </span>
            <ChevronRight className="w-3 h-3 text-sand-500" />
          </Link>

          {/* Logout Button */}
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-red-950/40 hover:bg-red-900/50 text-red-300 hover:text-red-200 border border-red-900/50 text-xs font-semibold transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Secure Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Operations Canvas (Offset by lg:pl-64 to accommodate fixed sidebar) */}
      <div className="flex-1 flex flex-col min-w-0 w-full lg:pl-64 min-h-screen" suppressHydrationWarning>
        {/* Top Operations Header with User Profile Dropdown */}
        <header className="sticky top-0 z-30 bg-sand-50/95 backdrop-blur-md border-b border-sand-200 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4 w-full shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-navy-600">Terminal:</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              All Systems Operational (MySQL 3306)
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/admin/products"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy-950 hover:bg-navy-900 text-sand-50 text-xs font-semibold transition-colors shadow-sm"
            >
              <Package className="w-3.5 h-3.5 text-brass-400" />
              Manage Products
            </Link>

            <div className="hidden md:flex items-center gap-2 text-xs text-navy-700 bg-sand-100 px-3 py-1.5 rounded-lg border border-sand-200 font-mono">
              <Lock className="w-3.5 h-3.5 text-brass-600" />
              <span>TLS 1.3 UK Vault</span>
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
                          {currentUser?.email || "admin@sanfurniture.co.uk"}
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
