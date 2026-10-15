"use client";

import React, { useState, useEffect } from "react";
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
  Menu,
  X,
  Search,
  CheckCircle2,
  Lock,
  UserCheck,
  MessageSquare,
  Tag,
  Settings,
  Building2,
  SlidersHorizontal
} from "lucide-react";

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

  // If on login page, render clean full-screen login container without sidebar
  const isLoginPage = pathname === "/admin/login";

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
      name: "Customer Orders & POs",
      href: "/admin/orders",
      icon: ShoppingBag,
      active: pathname.startsWith("/admin/orders"),
      badge: "HMRC VAT"
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
      badge: "2 Jailed"
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
    <div className="min-h-screen bg-[#F4F1EA] text-[#070D1E] flex flex-col lg:flex-row antialiased">
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

      {/* Enterprise Dark Navy Left Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#070D1E] text-sand-100 flex flex-col justify-between border-r border-navy-800 transition-transform lg:static lg:translate-x-0 ${
          isMobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        <div>
          {/* Brand Header */}
          <div className="p-5 border-b border-navy-800/80">
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

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-sand-400 px-3 py-2">
              Management Suite
            </div>
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    link.active
                      ? "bg-brass-500/15 text-brass-400 border border-brass-500/30 font-semibold"
                      : "text-sand-300 hover:bg-navy-900 hover:text-sand-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${link.active ? "text-brass-400" : "text-sand-400"}`} />
                    <span>{link.name}</span>
                  </div>
                  {link.badge && (
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        link.active
                          ? "bg-brass-500 text-navy-950"
                          : "bg-navy-800 text-sand-300 border border-navy-700"
                      }`}
                    >
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Profile & Actions */}
        <div className="p-4 border-t border-navy-800/80 bg-navy-950/60 space-y-3">
          {/* User Info */}
          <div className="flex items-center gap-3 px-2 py-1.5">
            <div className="w-8 h-8 rounded-full bg-navy-800 border border-brass-500/40 flex items-center justify-center text-brass-400 font-bold text-xs">
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

      {/* Main Operations Canvas */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Operations Header */}
        <header className="sticky top-0 z-30 bg-sand-50/90 backdrop-blur-md border-b border-sand-200 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-navy-600">Terminal:</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              All Systems Operational (MySQL 3306)
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/admin/products"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy-950 hover:bg-navy-900 text-sand-50 text-xs font-semibold transition-colors shadow-sm"
            >
              <Package className="w-3.5 h-3.5 text-brass-400" />
              Manage Products
            </Link>

            <div className="flex items-center gap-2 text-xs text-navy-700 bg-sand-100 px-3 py-1.5 rounded-lg border border-sand-200 font-mono">
              <Lock className="w-3.5 h-3.5 text-brass-600" />
              <span>TLS 1.3 UK Vault</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
