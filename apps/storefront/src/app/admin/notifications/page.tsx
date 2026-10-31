"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  ShoppingBag,
  Headphones,
  ShieldAlert,
  Trash2,
  CheckCheck,
  RotateCw,
  Search,
  Filter,
  ExternalLink,
  ChevronRight,
  Send,
  X,
  Eye,
  EyeOff,
  Inbox,
  Clock,
  Sparkles,
  Info
} from "lucide-react";
import { apiUrl } from "@/lib/api-config";
import { fetchWithSwr, invalidateCache } from "@/lib/api-cache";

interface NotificationItem {
  id: string;
  recipient_type: "admin" | "customer";
  recipient_id: string;
  type: string;
  title: string;
  message: string;
  link?: string | null;
  is_read: number;
  metadata?: string | null;
  created_at: string;
}

interface NotificationStats {
  total: number;
  unread: number;
  orders: number;
  tickets: number;
  security: number;
}

type FilterTab = "all" | "unread" | "orders" | "tickets" | "security" | "system";

export default function NotificationsHubPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [stats, setStats] = useState<NotificationStats>({
    total: 0,
    unread: 0,
    orders: 0,
    tickets: 0,
    security: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // New notification form state
  const [newAlert, setNewAlert] = useState({
    title: "",
    message: "",
    type: "general",
    recipient_type: "admin",
    link: "/admin",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const getAuthHeaders = useCallback((includeJson = true) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("san_admin_token") : null;
    const headers: Record<string, string> = {};
    if (includeJson) {
      headers["Content-Type"] = "application/json";
    }
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
  }, []);

  const fetchNotifications = useCallback(async (isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    try {
      const authHeaders = getAuthHeaders(false);
      await fetchWithSwr<{ notifications: NotificationItem[]; stats?: NotificationStats }>(
        apiUrl("/api/notifications?recipient_type=admin&limit=250"),
        (data) => {
          if (data && data.notifications) {
            setNotifications(data.notifications);
            const list: NotificationItem[] = data.notifications || [];
            setStats({
              total: list.length,
              unread: list.filter((n) => !n.is_read).length,
              orders: list.filter((n) => n.type.includes("order")).length,
              tickets: list.filter((n) => n.type.includes("ticket")).length,
              security: list.filter((n) => n.type.includes("security") || n.type.includes("jail")).length,
            });
            setLoading(false);
          }
        },
        { headers: authHeaders, credentials: "include" }
      );
    } catch (err) {
      console.error("Failed to load notifications", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(() => fetchNotifications(true), 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Filtered notifications list
  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      // Tab filter
      if (activeTab === "unread" && n.is_read) return false;
      if (activeTab === "orders" && !n.type.includes("order")) return false;
      if (activeTab === "tickets" && !n.type.includes("ticket")) return false;
      if (activeTab === "security" && !n.type.includes("security") && !n.type.includes("jail")) return false;
      if (activeTab === "system") {
        if (n.type.includes("order") || n.type.includes("ticket") || n.type.includes("security") || n.type.includes("jail")) {
          return false;
        }
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = n.title.toLowerCase().includes(q);
        const matchesMsg = n.message.toLowerCase().includes(q);
        const matchesId = n.id.toLowerCase().includes(q);
        const matchesType = n.type.toLowerCase().includes(q);
        if (!matchesTitle && !matchesMsg && !matchesId && !matchesType) return false;
      }

      return true;
    });
  }, [notifications, activeTab, searchQuery]);

  // Actions
  const handleToggleRead = async (id: string, currentRead: number) => {
    const newStatus = currentRead ? 0 : 1;
    const endpoint = newStatus ? `/api/notifications/${id}/read` : `/api/notifications/${id}/unread`;
    try {
      const res = await fetch(apiUrl(endpoint), {
        method: "PATCH",
        headers: getAuthHeaders(false),
        credentials: "include",
      });
      if (res.ok) {
        invalidateCache("/api/notifications");
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, is_read: newStatus } : n))
        );
        setStats((prev) => ({
          ...prev,
          unread: newStatus ? Math.max(0, prev.unread - 1) : prev.unread + 1,
        }));
        showToast(newStatus ? "Alert marked as read." : "Alert marked as unread.");
      } else {
        showToast("Failed to update status.");
      }
    } catch {
      showToast("Failed to update status.");
    }
  };

  const handleDeleteSingle = async (id: string) => {
    try {
      const res = await fetch(apiUrl(`/api/notifications/${id}`), {
        method: "DELETE",
        headers: getAuthHeaders(false),
        credentials: "include",
      });
      if (res.ok) {
        invalidateCache("/api/notifications");
        const removed = notifications.find((n) => n.id === id);
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        setSelectedIds((prev) => prev.filter((item) => item !== id));
        setStats((prev) => ({
          ...prev,
          total: Math.max(0, prev.total - 1),
          unread: removed && !removed.is_read ? Math.max(0, prev.unread - 1) : prev.unread,
        }));
        showToast("Notification deleted successfully.");
      } else {
        showToast("Failed to delete notification.");
      }
    } catch {
      showToast("Network error while deleting.");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch(apiUrl("/api/notifications/read-all"), {
        method: "POST",
        headers: getAuthHeaders(true),
        credentials: "include",
        body: JSON.stringify({ recipient_type: "admin" }),
      });
      if (res.ok) {
        invalidateCache("/api/notifications");
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
        setStats((prev) => ({ ...prev, unread: 0 }));
        showToast("All operational alerts marked as read.");
      } else {
        showToast("Failed to mark all as read.");
      }
    } catch {
      showToast("Failed to mark all as read.");
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    try {
      const res = await fetch(apiUrl("/api/notifications/delete-bulk"), {
        method: "POST",
        headers: getAuthHeaders(true),
        credentials: "include",
        body: JSON.stringify({ ids: selectedIds }),
      });
      if (res.ok) {
        invalidateCache("/api/notifications");
        const deletedSet = new Set(selectedIds);
        const unreadDeleted = notifications.filter((n) => deletedSet.has(n.id) && !n.is_read).length;
        setNotifications((prev) => prev.filter((n) => !deletedSet.has(n.id)));
        setStats((prev) => ({
          ...prev,
          total: Math.max(0, prev.total - selectedIds.length),
          unread: Math.max(0, prev.unread - unreadDeleted),
        }));
        showToast(`${selectedIds.length} notifications deleted successfully.`);
        setSelectedIds([]);
      } else {
        showToast("Failed to delete selected notifications.");
      }
    } catch {
      showToast("Failed to delete selected notifications.");
    }
  };

  const handleClearAll = async () => {
    try {
      const res = await fetch(apiUrl("/api/notifications/clear"), {
        method: "POST",
        headers: getAuthHeaders(true),
        credentials: "include",
        body: JSON.stringify({ recipient_type: "admin" }),
      });
      if (res.ok) {
        invalidateCache("/api/notifications");
        setNotifications([]);
        setSelectedIds([]);
        setStats({ total: 0, unread: 0, orders: 0, tickets: 0, security: 0 });
        setIsClearModalOpen(false);
        showToast("All operations notifications cleared.");
      } else {
        showToast("Failed to clear notifications.");
      }
    } catch {
      showToast("Failed to clear notifications.");
    }
  };

  const handleCreateNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlert.title || !newAlert.message) {
      showToast("Title and message are required.");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch(apiUrl("/api/notifications"), {
        method: "POST",
        headers: getAuthHeaders(true),
        credentials: "include",
        body: JSON.stringify(newAlert),
      });
      if (res.ok) {
        invalidateCache("/api/notifications");
        setIsCreateModalOpen(false);
        setNewAlert({
          title: "",
          message: "",
          type: "general",
          recipient_type: "admin",
          link: "/admin",
        });
        showToast("New alert broadcasted successfully.");
        fetchNotifications(true);
      } else {
        showToast("Failed to create alert.");
      }
    } catch {
      showToast("Failed to create alert.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Checkbox management
  const handleSelectAllVisible = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allVisibleIds = filteredNotifications.map((n) => n.id);
      setSelectedIds(Array.from(new Set([...selectedIds, ...allVisibleIds])));
    } else {
      const visibleSet = new Set(filteredNotifications.map((n) => n.id));
      setSelectedIds(selectedIds.filter((id) => !visibleSet.has(id)));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const isAllVisibleSelected =
    filteredNotifications.length > 0 &&
    filteredNotifications.every((n) => selectedIds.includes(n.id));

  const formatTimestamp = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return {
        formatted: date.toLocaleString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        timeAgo: getTimeAgo(date),
      };
    } catch {
      return { formatted: dateStr, timeAgo: "" };
    }
  };

  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getAlertIcon = (type: string) => {
    if (type.includes("order")) {
      return <ShoppingBag className="w-4 h-4 text-brass-700" />;
    }
    if (type.includes("ticket")) {
      return <Headphones className="w-4 h-4 text-emerald-700" />;
    }
    if (type.includes("security") || type.includes("jail")) {
      return <ShieldAlert className="w-4 h-4 text-rose-700" />;
    }
    return <Bell className="w-4 h-4 text-navy-700" />;
  };

  const getAlertBadge = (type: string) => {
    if (type.includes("order")) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-brass-100 text-brass-900 border border-brass-200">
          Order &amp; PO
        </span>
      );
    }
    if (type.includes("ticket")) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-200">
          Support Ticket
        </span>
      );
    }
    if (type.includes("security") || type.includes("jail")) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-900 border border-rose-200">
          Security Alert
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-sand-200 text-navy-900 border border-sand-300">
        System Event
      </span>
    );
  };

  return (
    <div className="space-y-6 antialiased pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#00072D] text-sand-50 px-4 py-3 rounded-xl shadow-2xl border border-navy-700 flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-brass-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Breadcrumb & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-navy-500 mb-1">
            <Link href="/admin" className="hover:text-navy-950 transition-colors">
              Operations Suite
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="font-semibold text-navy-900">Notifications &amp; Alerts</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-navy-950 flex items-center gap-2.5">
            <Bell className="w-6 h-6 text-brass-600" />
            <span>Operations Alert Center &amp; Notification Hub</span>
          </h1>
          <p className="text-xs text-navy-600 mt-1">
            Monitor, triage, bulk mark, or permanently delete operational alerts, orders, carrier updates, and security logs.
          </p>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => fetchNotifications(false)}
            disabled={refreshing}
            className="p-2.5 rounded-xl border border-sand-300 bg-white hover:bg-sand-100 text-navy-800 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs"
            title="Refresh Alert Feed"
          >
            <RotateCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-brass-600" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={stats.unread === 0}
            className="px-3.5 py-2.5 rounded-xl border border-sand-300 bg-white hover:bg-sand-100 text-navy-900 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Mark All Read</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="px-3.5 py-2.5 rounded-xl bg-navy-950 hover:bg-navy-900 text-sand-50 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Send className="w-3.5 h-3.5 text-brass-400" />
            <span>Broadcast Alert</span>
          </button>

          <button
            type="button"
            onClick={() => setIsClearModalOpen(true)}
            disabled={notifications.length === 0}
            className="px-3.5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            <span>Clear All Alerts</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Alerts */}
        <div className="p-4 rounded-2xl bg-white border border-sand-300 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-navy-500 uppercase tracking-wider block">
              Total Alerts
            </span>
            <div className="text-2xl font-bold font-display text-navy-950 mt-1">
              {stats.total}
            </div>
            <span className="text-[10px] text-navy-400 block mt-0.5">Database event records</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sand-100 border border-sand-200 flex items-center justify-center text-navy-700">
            <Inbox className="w-5 h-5 text-navy-700" />
          </div>
        </div>

        {/* Card 2: Unread Alerts */}
        <div className="p-4 rounded-2xl bg-white border border-sand-300 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-navy-500 uppercase tracking-wider block">
              Unread Alerts
            </span>
            <div className="text-2xl font-bold font-display text-brass-700 mt-1 flex items-center gap-2">
              <span>{stats.unread}</span>
              {stats.unread > 0 && (
                <span className="w-2 h-2 rounded-full bg-brass-600 animate-ping" />
              )}
            </div>
            <span className="text-[10px] text-brass-800 font-medium block mt-0.5">
              Requires review
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-brass-50 border border-brass-200 flex items-center justify-center text-brass-700">
            <Bell className="w-5 h-5 text-brass-700" />
          </div>
        </div>

        {/* Card 3: Orders & Fulfillment */}
        <div className="p-4 rounded-2xl bg-white border border-sand-300 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-navy-500 uppercase tracking-wider block">
              Orders &amp; POs
            </span>
            <div className="text-2xl font-bold font-display text-forest-700 mt-1">
              {stats.orders}
            </div>
            <span className="text-[10px] text-navy-400 block mt-0.5">Dropship &amp; dispatches</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-forest-50 border border-forest-200 flex items-center justify-center text-forest-700">
            <ShoppingBag className="w-5 h-5 text-forest-700" />
          </div>
        </div>

        {/* Card 4: Security & Support */}
        <div className="p-4 rounded-2xl bg-white border border-sand-300 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-navy-500 uppercase tracking-wider block">
              Security &amp; Tickets
            </span>
            <div className="text-2xl font-bold font-display text-navy-950 mt-1">
              {stats.tickets + stats.security}
            </div>
            <span className="text-[10px] text-navy-400 block mt-0.5">Helpdesk &amp; IP Jail events</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-700">
            <ShieldAlert className="w-5 h-5 text-rose-700" />
          </div>
        </div>
      </div>

      {/* Main Alert Feed Card */}
      <div className="bg-white border border-sand-300 rounded-2xl shadow-sm overflow-hidden">
        {/* Filter Navigation & Search Header */}
        <div className="p-4 border-b border-sand-200 bg-sand-50/70 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Tab Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === "all"
                  ? "bg-navy-950 text-sand-50 font-bold shadow-xs"
                  : "bg-white text-navy-700 hover:bg-sand-200/80 border border-sand-200"
              }`}
            >
              <span>All Alerts</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeTab === "all" ? "bg-brass-500 text-navy-950 font-bold" : "bg-sand-200 text-navy-700"
              }`}>
                {stats.total}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("unread")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === "unread"
                  ? "bg-navy-950 text-sand-50 font-bold shadow-xs"
                  : "bg-white text-navy-700 hover:bg-sand-200/80 border border-sand-200"
              }`}
            >
              <span>Unread</span>
              {stats.unread > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-brass-500 text-navy-950 font-bold">
                  {stats.unread}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("orders")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === "orders"
                  ? "bg-navy-950 text-sand-50 font-bold shadow-xs"
                  : "bg-white text-navy-700 hover:bg-sand-200/80 border border-sand-200"
              }`}
            >
              <ShoppingBag className="w-3 h-3 text-brass-600" />
              <span>Orders</span>
              <span className="text-[10px] text-navy-500">({stats.orders})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("tickets")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === "tickets"
                  ? "bg-navy-950 text-sand-50 font-bold shadow-xs"
                  : "bg-white text-navy-700 hover:bg-sand-200/80 border border-sand-200"
              }`}
            >
              <Headphones className="w-3 h-3 text-emerald-600" />
              <span>Tickets</span>
              <span className="text-[10px] text-navy-500">({stats.tickets})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("security")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === "security"
                  ? "bg-navy-950 text-sand-50 font-bold shadow-xs"
                  : "bg-white text-navy-700 hover:bg-sand-200/80 border border-sand-200"
              }`}
            >
              <ShieldAlert className="w-3 h-3 text-rose-600" />
              <span>Security</span>
              <span className="text-[10px] text-navy-500">({stats.security})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("system")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === "system"
                  ? "bg-navy-950 text-sand-50 font-bold shadow-xs"
                  : "bg-white text-navy-700 hover:bg-sand-200/80 border border-sand-200"
              }`}
            >
              <span>System</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search alert title or ID..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-sand-300 rounded-lg text-navy-950 focus:outline-none focus:ring-2 focus:ring-brass-500/50"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-navy-400 hover:text-navy-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Bulk Action Bar (when rows are selected) */}
        {selectedIds.length > 0 && (
          <div className="px-4 py-2.5 bg-navy-950 text-sand-50 flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-150">
            <div className="flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full bg-brass-400" />
              <span className="font-semibold">{selectedIds.length} notification(s) selected</span>
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="text-[11px] text-sand-300 hover:text-white underline ml-2 cursor-pointer"
              >
                Deselect all
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDeleteSelected}
                className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Selected ({selectedIds.length})</span>
              </button>
            </div>
          </div>
        )}

        {/* Table / List Header */}
        <div className="px-4 py-2.5 bg-sand-100/70 border-b border-sand-200 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-navy-600">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={isAllVisibleSelected}
              onChange={handleSelectAllVisible}
              className="w-4 h-4 rounded text-brass-600 border-sand-300 focus:ring-brass-500 cursor-pointer"
              title="Select all visible notifications"
            />
            <span>Notification &amp; Details</span>
          </div>
          <div className="flex items-center gap-8">
            <span className="hidden sm:inline">Timestamp</span>
            <span className="w-24 text-right">Actions</span>
          </div>
        </div>

        {/* Alert List Rows */}
        <div className="divide-y divide-sand-200">
          {loading ? (
            <div className="p-12 text-center text-xs text-navy-500 space-y-2">
              <RotateCw className="w-6 h-6 animate-spin text-brass-600 mx-auto" />
              <p>Loading notification records...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-16 text-center text-navy-600 space-y-3">
              <div className="w-12 h-12 rounded-full bg-sand-100 border border-sand-200 flex items-center justify-center mx-auto text-navy-400">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="font-display font-bold text-base text-navy-950">
                {searchQuery ? "No matching notifications found" : "All caught up! Zero alerts"}
              </h3>
              <p className="text-xs text-navy-500 max-w-sm mx-auto">
                {searchQuery
                  ? "Try clearing your search query or choosing another filter category."
                  : "All operational notifications have been addressed or deleted."}
              </p>
            </div>
          ) : (
            filteredNotifications.map((n) => {
              const { formatted, timeAgo } = formatTimestamp(n.created_at);
              const isSelected = selectedIds.includes(n.id);

              return (
                <div
                  key={n.id}
                  className={`p-4 transition-colors flex items-start gap-3 text-xs ${
                    isSelected
                      ? "bg-sand-100"
                      : n.is_read
                      ? "bg-white hover:bg-sand-50"
                      : "bg-sand-50/80 hover:bg-sand-100 font-medium"
                  }`}
                >
                  {/* Select Checkbox */}
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleToggleSelectOne(n.id)}
                    className="w-4 h-4 mt-1 rounded text-brass-600 border-sand-300 focus:ring-brass-500 cursor-pointer flex-shrink-0"
                  />

                  {/* Category Icon */}
                  <div className="mt-0.5 w-8 h-8 rounded-xl bg-sand-100 border border-sand-200 flex items-center justify-center flex-shrink-0 shadow-2xs">
                    {getAlertIcon(n.type)}
                  </div>

                  {/* Body Content */}
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      {getAlertBadge(n.type)}
                      <h4 className="font-bold text-navy-950 text-sm">{n.title}</h4>
                      {!n.is_read && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-brass-500 text-navy-950">
                          Unread
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-navy-700 leading-relaxed mb-2">
                      {n.message}
                    </p>

                    {/* Metadata & Direct Link */}
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-navy-500">
                      <span className="flex items-center gap-1 font-mono text-[10px] text-navy-400">
                        <span>ID:</span>
                        <span>{n.id}</span>
                      </span>

                      {n.link && (
                        <Link
                          href={n.link}
                          className="font-semibold text-brass-700 hover:text-brass-900 inline-flex items-center gap-1 hover:underline"
                        >
                          <span>Open Associated Module</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Timestamp & Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-right flex-shrink-0">
                    <div className="text-right hidden sm:block">
                      <span className="text-xs text-navy-800 font-medium block">
                        {timeAgo}
                      </span>
                      <span className="text-[10px] text-navy-400 block font-mono">
                        {formatted}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => handleToggleRead(n.id, n.is_read)}
                        className="p-2 rounded-lg text-navy-500 hover:text-navy-950 hover:bg-sand-200 transition-colors cursor-pointer"
                        title={n.is_read ? "Mark as unread" : "Mark as read"}
                      >
                        {n.is_read ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4 text-brass-600" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteSingle(n.id)}
                        className="p-2 rounded-lg text-navy-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete this notification"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Summary */}
        <div className="px-4 py-3 bg-sand-50 border-t border-sand-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-navy-600">
          <span>
            Showing <strong>{filteredNotifications.length}</strong> of{" "}
            <strong>{notifications.length}</strong> notifications
          </span>
          <span className="text-[11px] text-navy-500">
            Real-time operations stream • Retained in MySQL database
          </span>
        </div>
      </div>

      {/* Clear All Confirmation Modal */}
      {isClearModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-sand-300 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-700 flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-700" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-navy-950">
                  Clear All Notifications?
                </h3>
                <p className="text-xs text-navy-500">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-navy-700 leading-relaxed">
              Are you sure you want to permanently delete all <strong>{notifications.length}</strong>{" "}
              operations notifications from the database? Ongoing orders, support tickets, and system logs will remain intact.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsClearModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-sand-300 text-xs font-semibold text-navy-800 hover:bg-sand-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm &amp; Delete All</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Broadcast Alert Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-sand-300 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-sand-200">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-brass-600" />
                <h3 className="font-display font-bold text-base text-navy-950">
                  Broadcast New Operational Alert
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-navy-400 hover:text-navy-700 hover:bg-sand-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNotification} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-navy-900 mb-1">Alert Title</label>
                <input
                  type="text"
                  required
                  value={newAlert.title}
                  onChange={(e) => setNewAlert({ ...newAlert, title: e.target.value })}
                  placeholder="e.g. White Glove Carrier Schedule Update"
                  className="w-full px-3 py-2 bg-sand-50 border border-sand-300 rounded-lg text-navy-950 focus:outline-none focus:ring-2 focus:ring-brass-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-navy-900 mb-1">Alert Category</label>
                  <select
                    value={newAlert.type}
                    onChange={(e) => setNewAlert({ ...newAlert, type: e.target.value })}
                    className="w-full px-3 py-2 bg-sand-50 border border-sand-300 rounded-lg text-navy-950 focus:outline-none focus:ring-2 focus:ring-brass-500/50"
                  >
                    <option value="general">General Operations</option>
                    <option value="order_created">Order Alert</option>
                    <option value="ticket_created">Support Ticket</option>
                    <option value="security_alert">Security Warning</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-navy-900 mb-1">Target Recipient</label>
                  <select
                    value={newAlert.recipient_type}
                    onChange={(e) =>
                      setNewAlert({ ...newAlert, recipient_type: e.target.value as "admin" | "customer" })
                    }
                    className="w-full px-3 py-2 bg-sand-50 border border-sand-300 rounded-lg text-navy-950 focus:outline-none focus:ring-2 focus:ring-brass-500/50"
                  >
                    <option value="admin">All Staff (Admin Suite)</option>
                    <option value="customer">Customer Portal</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-navy-900 mb-1">Associated Module Link (Optional)</label>
                <input
                  type="text"
                  value={newAlert.link}
                  onChange={(e) => setNewAlert({ ...newAlert, link: e.target.value })}
                  placeholder="/admin/orders or /admin/support"
                  className="w-full px-3 py-2 bg-sand-50 border border-sand-300 rounded-lg text-navy-950 focus:outline-none focus:ring-2 focus:ring-brass-500/50"
                />
              </div>

              <div>
                <label className="block font-semibold text-navy-900 mb-1">Message Content</label>
                <textarea
                  required
                  rows={3}
                  value={newAlert.message}
                  onChange={(e) => setNewAlert({ ...newAlert, message: e.target.value })}
                  placeholder="Details of the operational alert..."
                  className="w-full px-3 py-2 bg-sand-50 border border-sand-300 rounded-lg text-navy-950 focus:outline-none focus:ring-2 focus:ring-brass-500/50"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-sand-200">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-sand-300 text-xs font-semibold text-navy-800 hover:bg-sand-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-navy-950 hover:bg-navy-900 text-sand-50 text-xs font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5 text-brass-400" />
                  <span>{isSubmitting ? "Broadcasting..." : "Send Alert"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
