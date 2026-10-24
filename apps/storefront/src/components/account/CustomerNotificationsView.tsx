"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCircle2,
  Truck,
  Headphones,
  ShoppingBag,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  Clock
} from "lucide-react";
import { apiUrl } from "@/lib/api-config";

interface CustomerNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  is_read: number;
  created_at: string;
}

interface CustomerNotificationsViewProps {
  customer: {
    email: string;
    firstName?: string;
  };
  showToast: (msg: string) => void;
  onNavigateTab?: (tab: string) => void;
}

export function CustomerNotificationsView({
  customer,
  showToast,
  onNavigateTab,
}: CustomerNotificationsViewProps) {
  const [notifications, setNotifications] = useState<CustomerNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 5;

  const totalPages = Math.max(1, Math.ceil(notifications.length / perPage));
  const paginatedNotifications = notifications.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        apiUrl(`/api/notifications?recipient_type=customer&recipient_id=${encodeURIComponent(customer.email)}`)
      );
      if (res.ok) {
        const data = await res.json();
        const list = data.notifications || [];
        setNotifications(list);
        setUnreadCount(Number(data.unread_count || 0));
        // Reset or clamp page if list shrunk
        setCurrentPage((prev) => Math.min(prev, Math.max(1, Math.ceil(list.length / perPage))));
      }
    } catch (err) {
      console.error("Failed to fetch customer notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [customer.email]);

  const handleMarkAsRead = async (id: string, link?: string) => {
    try {
      await fetch(apiUrl(`/api/notifications/${id}/read`), { method: "PATCH" });
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
      showToast("Notification marked as read.");
      if (link && onNavigateTab) {
        if (link.includes("support")) onNavigateTab("support");
        else if (link.includes("orders")) onNavigateTab("orders");
      }
    } catch {}
  };

  const handleMarkAllAsRead = async () => {
    try {
      await fetch(apiUrl("/api/notifications/read-all"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient_type: "customer",
          recipient_id: customer.email,
        }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
      showToast("All notifications marked as read.");
    } catch {}
  };

  return (
    <div className="space-y-6 animate-fade-in text-navy-950">
      {/* Header Bar */}
      <div className="bg-sand-100/90 border border-sand-300 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-brass-700 bg-brass-500/10 px-2.5 py-0.5 rounded-full border border-brass-500/20">
            Account Activity Feed
          </span>
          <h2 className="font-display text-2xl font-bold text-navy-950 mt-1 flex items-center gap-2">
            <Bell className="w-6 h-6 text-brass-600" />
            <span>Notifications &amp; Delivery Updates</span>
          </h2>
          <p className="text-xs text-navy-600 mt-0.5">
            Real-time notifications regarding your delivery bookings, support replies, and order milestones.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-sand-50 text-navy-900 border border-sand-300 text-xs font-semibold shadow-xs transition-colors"
            >
              Mark all as read
            </button>
          )}

          <button
            type="button"
            onClick={fetchNotifications}
            className="p-2 rounded-xl bg-white hover:bg-sand-50 text-navy-900 border border-sand-300 shadow-xs"
            title="Refresh feed"
          >
            <RefreshCw className={`w-4 h-4 text-navy-600 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Notifications List Card */}
      <div className="bg-white rounded-2xl border border-sand-300 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-navy-500 space-y-2">
            <RefreshCw className="w-6 h-6 text-brass-600 animate-spin mx-auto" />
            <p>Loading activity alerts...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center text-xs text-navy-500 space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto opacity-70 mb-2" />
            <p className="font-semibold text-navy-800 text-sm">No Notifications Yet</p>
            <p>You have no recent delivery or order updates. Everything is up to date.</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-sand-200">
              {paginatedNotifications.map((n) => {
                const isUnread = !n.is_read;
                return (
                  <div
                    key={n.id}
                    onClick={() => handleMarkAsRead(n.id, n.link)}
                    className={`p-4 sm:p-5 flex items-start gap-4 transition-colors cursor-pointer ${
                      isUnread ? "bg-sand-100/60 hover:bg-sand-100/90" : "hover:bg-sand-50"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-sand-200 border border-sand-300 flex items-center justify-center flex-shrink-0 text-navy-900 shadow-xs">
                      {n.type === "delivery_update" ? (
                        <Truck className="w-5 h-5 text-forest-700" />
                      ) : n.type === "ticket_reply" ? (
                        <Headphones className="w-5 h-5 text-brass-700" />
                      ) : (
                        <ShoppingBag className="w-5 h-5 text-navy-700" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-sm font-bold text-navy-950 flex items-center gap-2">
                          <span>{n.title}</span>
                          {isUnread && (
                            <span className="w-2 h-2 rounded-full bg-brass-600 flex-shrink-0" />
                          )}
                        </h4>
                        <span className="text-[11px] text-navy-400 whitespace-nowrap">
                          {new Date(n.created_at).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      <p className="text-xs text-navy-700 mt-1 leading-relaxed">{n.message}</p>

                      {n.link && (
                        <div className="mt-2 text-xs font-semibold text-brass-700 hover:text-brass-900 inline-flex items-center gap-1">
                          <span>View Details</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-4 bg-sand-50 border-t border-sand-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <span className="text-navy-600 font-medium">
                  Showing{" "}
                  <strong className="text-navy-950">
                    {(currentPage - 1) * perPage + 1}–{Math.min(currentPage * perPage, notifications.length)}
                  </strong>{" "}
                  of <strong className="text-navy-950">{notifications.length}</strong> updates
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1.5 rounded-lg border border-sand-300 bg-white hover:bg-sand-100 disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-navy-900 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Previous</span>
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        type="button"
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          currentPage === page
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
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="px-3 py-1.5 rounded-lg border border-sand-300 bg-white hover:bg-sand-100 disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-navy-900 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
