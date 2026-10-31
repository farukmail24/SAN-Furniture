"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Headphones,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  AlertTriangle,
  Send,
  Lock,
  User,
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  MessageSquare,
  Sparkles,
  RefreshCw,
  Tag,
  ShieldCheck,
  Check,
  ArrowRight,
  Truck,
  FileText
} from "lucide-react";
import { apiUrl } from "@/lib/api-config";
import { showAlert } from "@/components/ui/AlertModal";
import { fetchWithSwr, invalidateCache } from "@/lib/api-cache";

interface SupportMessage {
  id: string;
  ticket_id: string;
  sender_type: "customer" | "agent" | "system";
  sender_name: string;
  message: string;
  is_internal_note: number;
  created_at: string;
}

interface LinkedOrder {
  id: string;
  order_number: string;
  customer_name: string;
  total_pennies: number;
  total_formatted: string;
  payment_status: string;
  fulfillment_status: string;
  delivery_tier: string;
  carrier?: string;
  tracking_number?: string;
  created_at: string;
}

interface SupportTicket {
  id: string;
  ticket_number: string;
  customer_id?: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  order_id?: string;
  category: "delivery" | "damaged_item" | "return_refund" | "order_status" | "product_inquiry" | "assembly_help" | "general";
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "in_progress" | "waiting_customer" | "resolved" | "closed";
  subject: string;
  assigned_to?: string;
  last_reply_at: string;
  created_at: string;
  needs_reply?: boolean;
  last_sender_type?: "customer" | "agent" | "system";
  last_message_preview?: string;
  total_messages?: number;
}

const CANNED_RESPONSES = [
  {
    title: "White Glove Logistics Slot",
    text: "Dear Client, our 2-man White Glove logistics team is scheduled for your area. They will deliver directly to your room of choice, unpack, assemble, and remove all protective packaging. You will receive an SMS 30 minutes before arrival.",
  },
  {
    title: "Fabric Swatch Dispatch",
    text: "Good day, your requested bespoke fabric presentation samples have been carefully prepared and dispatched via Royal Mail 1st Class Signed For. You should receive them within 24–48 hours.",
  },
  {
    title: "Replacement Component",
    text: "Thank you for notifying us. We have arranged an expedited replacement component directly from our British workshop with next-day DX Express courier. We sincerely apologize for any inconvenience caused.",
  },
  {
    title: "DX Freight Tracking",
    text: "Your pallet consignment is currently in transit with DX Freight. You can monitor live tracking using your consignment number on the carrier portal or through your SAN Client Portal.",
  },
];

export default function AdminSupportHelpdeskPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [counts, setCounts] = useState<{
    total: number;
    open: number;
    in_progress: number;
    waiting_customer: number;
    resolved: number;
  }>({ total: 0, open: 0, in_progress: 0, waiting_customer: 0, resolved: 0 });

  const [loading, setLoading] = useState(true);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [ticketDetail, setTicketDetail] = useState<{
    ticket: SupportTicket;
    messages: SupportMessage[];
    linked_order: LinkedOrder | null;
  } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Reply Composer
  const [replyMessage, setReplyMessage] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const getAuthHeaders = useCallback((includeJson = true) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("san_admin_token") : null;
    const headers: Record<string, string> = {};
    if (includeJson) headers["Content-Type"] = "application/json";
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return headers;
  }, []);

  // Fetch Tickets List with 0ms SWR Cache
  const fetchTickets = async (isSilent = false) => {
    try {
      if (tickets.length === 0 && !isSilent) {
        setLoading(true);
      }
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (priorityFilter !== "all") params.set("priority", priorityFilter);
      if (categoryFilter !== "all") params.set("category", categoryFilter);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());

      const url = apiUrl(`/api/support/tickets?${params.toString()}`);
      const authHeaders = getAuthHeaders(false);
      await fetchWithSwr<{
        tickets: SupportTicket[];
        counts: { total: number; open: number; in_progress: number; waiting_customer: number; resolved: number };
      }>(
        url,
        (data) => {
          if (data && data.tickets) {
            setTickets(data.tickets);
            if (data.counts) {
              setCounts({
                total: Number(data.counts.total || 0),
                open: Number(data.counts.open || 0),
                in_progress: Number(data.counts.in_progress || 0),
                waiting_customer: Number(data.counts.waiting_customer || 0),
                resolved: Number(data.counts.resolved || 0),
              });
            }
            if (!selectedTicketId && data.tickets.length > 0) {
              setSelectedTicketId(data.tickets[0].id);
            }
            setLoading(false);
          }
        },
        { headers: authHeaders, credentials: "include" }
      );
    } catch (err) {
      console.error("Failed to load tickets:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Single Ticket Details & Message Thread
  const fetchTicketDetails = async (id: string) => {
    try {
      setDetailLoading(true);
      const res = await fetch(apiUrl(`/api/support/tickets/${id}`), {
        headers: getAuthHeaders(false),
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setTicketDetail(data);
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || "Failed to load inquiry details");
      }
    } catch (err) {
      console.error("Failed to fetch ticket detail:", err);
      showToast("Network connection error loading ticket");
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [statusFilter, priorityFilter, categoryFilter]);

  useEffect(() => {
    if (selectedTicketId) {
      fetchTicketDetails(selectedTicketId);
    }
  }, [selectedTicketId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticketDetail?.messages]);

  // Handle Status Update
  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedTicketId) return;
    try {
      const res = await fetch(apiUrl(`/api/support/tickets/${selectedTicketId}`), {
        method: "PATCH",
        headers: getAuthHeaders(true),
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        showToast(`Ticket status updated to "${newStatus.replace("_", " ")}"`);
        fetchTicketDetails(selectedTicketId);
        fetchTickets();
      }
    } catch (e: any) {
      await showAlert({ title: "Status Update Failed", message: e.message, type: "danger" });
    }
  };

  // Handle Priority Update
  const handleUpdatePriority = async (newPriority: string) => {
    if (!selectedTicketId) return;
    try {
      const res = await fetch(apiUrl(`/api/support/tickets/${selectedTicketId}`), {
        method: "PATCH",
        headers: getAuthHeaders(true),
        credentials: "include",
        body: JSON.stringify({ priority: newPriority }),
      });
      if (res.ok) {
        showToast(`Priority adjusted to ${newPriority}`);
        fetchTicketDetails(selectedTicketId);
        fetchTickets();
      }
    } catch (e: any) {
      await showAlert({ title: "Priority Update Failed", message: e.message, type: "danger" });
    }
  };

  // Handle Assignee Update
  const handleUpdateAssignee = async (newAssignee: string) => {
    if (!selectedTicketId) return;
    try {
      const res = await fetch(apiUrl(`/api/support/tickets/${selectedTicketId}`), {
        method: "PATCH",
        headers: getAuthHeaders(true),
        credentials: "include",
        body: JSON.stringify({ assigned_to: newAssignee }),
      });
      if (res.ok) {
        showToast(`Assigned to ${newAssignee}`);
        fetchTicketDetails(selectedTicketId);
        fetchTickets();
      }
    } catch (e: any) {
      await showAlert({ title: "Assignment Failed", message: e.message, type: "danger" });
    }
  };

  // Handle Send Reply
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim() || !selectedTicketId) return;

    try {
      setSendingReply(true);
      const res = await fetch(apiUrl(`/api/support/tickets/${selectedTicketId}/messages`), {
        method: "POST",
        headers: getAuthHeaders(true),
        credentials: "include",
        body: JSON.stringify({
          sender_type: "agent",
          sender_name: "SAN Operations Concierge",
          message: replyMessage.trim(),
          is_internal_note: isInternalNote ? 1 : 0,
        }),
      });

      if (res.ok) {
        setReplyMessage("");
        showToast(isInternalNote ? "Internal staff note added." : "Reply dispatched to customer.");
        await fetchTicketDetails(selectedTicketId);
        fetchTickets();
      } else {
        const d = await res.json();
        await showAlert({ title: "Message Failed", message: d.error || "Unknown error", type: "danger" });
      }
    } catch (err: any) {
      await showAlert({ title: "Network Error", message: err.message, type: "danger" });
    } finally {
      setSendingReply(false);
    }
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case "urgent":
        return "bg-rose-100 text-rose-800 border-rose-300 font-bold";
      case "high":
        return "bg-amber-100 text-amber-800 border-amber-300 font-semibold";
      case "medium":
        return "bg-blue-50 text-blue-800 border-blue-200 font-medium";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200 font-normal";
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case "open":
        return "bg-emerald-50 text-emerald-800 border-emerald-300";
      case "in_progress":
        return "bg-blue-50 text-blue-800 border-blue-300";
      case "waiting_customer":
        return "bg-amber-50 text-amber-800 border-amber-300";
      case "resolved":
        return "bg-purple-50 text-purple-800 border-purple-300";
      case "closed":
        return "bg-slate-100 text-slate-600 border-slate-300";
      default:
        return "bg-sand-100 text-navy-800 border-sand-300";
    }
  };

  return (
    <div className="space-y-6 antialiased" suppressHydrationWarning>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#00072D] text-sand-50 px-5 py-3 rounded-xl shadow-2xl border border-brass-500/40 flex items-center gap-3 animate-fade-in text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-brass-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & KPI Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-navy-500 mb-1">
            <Link href="/admin" className="hover:text-navy-950">
              Operations Suite
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="font-semibold text-navy-900">Customer Support Helpdesk</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-[#00072D] flex items-center gap-2.5">
            <Headphones className="w-7 h-7 text-brass-600" />
            <span>Customer Concierge &amp; Helpdesk Suite</span>
          </h1>
          <p className="text-xs text-navy-600 mt-1">
            Manage White Glove customer inquiries, transit claims, fabric sample requests, and bespoke communications.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            fetchTickets();
            if (selectedTicketId) fetchTicketDetails(selectedTicketId);
          }}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-sand-50 text-navy-900 border border-sand-300 text-xs font-semibold transition-colors shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-navy-600 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Inbox</span>
        </button>
      </div>

      {/* 4 Metric KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl p-4 border border-[#E8E2D5] shadow-xs">
          <span className="text-[11px] font-semibold text-navy-500 uppercase tracking-wider block">
            Total Tickets
          </span>
          <p className="font-display font-bold text-2xl text-navy-950 mt-1">{counts.total}</p>
          <span className="text-[10px] text-navy-500 mt-0.5 block">Recorded claims &amp; requests</span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-emerald-200 bg-emerald-50/20 shadow-xs">
          <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider block">
            Open Inquiries
          </span>
          <div className="flex items-center gap-2 mt-1">
            <p className="font-display font-bold text-2xl text-emerald-700">{counts.open}</p>
            {counts.open > 0 && <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />}
          </div>
          <span className="text-[10px] text-emerald-700 mt-0.5 block">Requires immediate response</span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-amber-200 bg-amber-50/20 shadow-xs">
          <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider block">
            Awaiting Customer
          </span>
          <p className="font-display font-bold text-2xl text-amber-700 mt-1">{counts.waiting_customer}</p>
          <span className="text-[10px] text-amber-700 mt-0.5 block">White Glove reply dispatched</span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-[#E8E2D5] shadow-xs">
          <span className="text-[11px] font-semibold text-purple-700 uppercase tracking-wider block">
            Resolved Inquiries
          </span>
          <p className="font-display font-bold text-2xl text-purple-800 mt-1">{counts.resolved}</p>
          <span className="text-[10px] text-purple-600 mt-0.5 block">Customer satisfied</span>
        </div>
      </div>

      {/* Main Split Layout: Left Tickets Queue | Right Conversation Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* ================================================================= */}
        {/* LEFT COLUMN: TICKET INBOX & FILTERS (5 Cols)                      */}
        {/* ================================================================= */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-[#E8E2D5] shadow-sm flex flex-col overflow-hidden h-[760px]">
          
          {/* Search & Filter Header */}
          <div className="p-3.5 border-b border-[#E8E2D5] space-y-2.5 bg-[#FAF8F5]">
            <div className="relative">
              <Search className="w-4 h-4 text-navy-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search ticket #, name, email, subject, order #..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchTickets()}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-[#E8E2D5] text-xs bg-white text-navy-950 focus:outline-none focus:ring-2 focus:ring-brass-500/50"
              />
            </div>

            {/* Status Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-[11px]">
              {[
                { key: "all", label: "All" },
                { key: "open", label: counts.open > 0 ? `Needs Reply (${counts.open})` : "Needs Reply" },
                { key: "in_progress", label: "In Progress" },
                { key: "waiting_customer", label: "Waiting Client" },
                { key: "resolved", label: "Resolved" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setStatusFilter(tab.key)}
                  className={`px-2.5 py-1 rounded-md font-semibold whitespace-nowrap transition-colors ${
                    statusFilter === tab.key
                      ? "bg-[#00072D] text-sand-50"
                      : "bg-white text-navy-700 border border-[#E8E2D5] hover:bg-sand-100"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Priority & Category Dropdown Selectors */}
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-2 py-1 rounded-md border border-[#E8E2D5] bg-white text-navy-800 focus:outline-none text-xs"
              >
                <option value="all">All Priorities</option>
                <option value="urgent">Urgent Priority</option>
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-2 py-1 rounded-md border border-[#E8E2D5] bg-white text-navy-800 focus:outline-none text-xs"
              >
                <option value="all">All Categories</option>
                <option value="delivery">Delivery &amp; Logistics</option>
                <option value="damaged_item">Transit Damage</option>
                <option value="product_inquiry">Product &amp; Swatches</option>
                <option value="assembly_help">Assembly Support</option>
                <option value="return_refund">Return &amp; Refund</option>
              </select>
            </div>
          </div>

          {/* Ticket List Queue */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#E8E2D5]">
            {loading ? (
              <div className="p-8 text-center text-xs text-navy-500 space-y-2">
                <RefreshCw className="w-5 h-5 text-brass-600 animate-spin mx-auto" />
                <p>Loading helpdesk inquiries...</p>
              </div>
            ) : tickets.length === 0 ? (
              <div className="p-8 text-center text-xs text-navy-500 space-y-1">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2 opacity-80" />
                <p className="font-semibold text-navy-800">Inbox is Clear</p>
                <p>No customer tickets matching current filter criteria.</p>
              </div>
            ) : (
              tickets.map((t) => {
                const isSelected = selectedTicketId === t.id;
                const isNeedsReply = Boolean(
                  t.needs_reply ?? (t.status === "open" || t.last_sender_type === "customer")
                );
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setSelectedTicketId(t.id);
                      fetchTicketDetails(t.id);
                    }}
                    className={`w-full text-left p-3.5 transition-all flex flex-col gap-1.5 cursor-pointer active-press relative ${
                      isSelected
                        ? "bg-sand-100/95 border-l-4 border-l-brass-500 shadow-xs ring-1 ring-brass-500/10"
                        : isNeedsReply
                        ? "bg-amber-50/40 hover:bg-amber-50/70 border-l-4 border-l-amber-500"
                        : "hover:bg-sand-50"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono font-bold text-navy-950">{t.ticket_number}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] border capitalize ${getPriorityBadge(t.priority)}`}>
                          {t.priority}
                        </span>
                        {isNeedsReply && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white shadow-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            Needs Reply
                          </span>
                        )}
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] border capitalize font-medium shrink-0 ${getStatusBadge(t.status)}`}>
                        {t.status === "open" ? "Open (Unreplied)" : t.status.replace("_", " ")}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-navy-950 truncate flex items-center gap-1.5">
                      {isNeedsReply && (
                        <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" title="Awaiting Agent Response" />
                      )}
                      <span className="truncate">{t.subject}</span>
                    </h4>

                    {t.last_message_preview && (
                      <p className="text-[11px] text-navy-600 truncate line-clamp-1 italic bg-sand-50/70 px-2 py-1 rounded border border-sand-200/70">
                        &ldquo;{t.last_message_preview}&rdquo;
                      </p>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-navy-600">
                      <span className="font-medium truncate max-w-[160px]">{t.customer_name}</span>
                      <span className="text-[10px] text-navy-400">
                        {new Date(t.last_reply_at || t.created_at).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    {t.order_id && (
                      <div className="text-[10px] text-brass-700 flex items-center gap-1 font-mono">
                        <ShoppingBag className="w-3 h-3 text-brass-600" />
                        <span>Order #{t.order_id}</span>
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ================================================================= */}
        {/* RIGHT COLUMN: ACTIVE TICKET WORKSPACE & CONVERSATION (7 Cols)     */}
        {/* ================================================================= */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E8E2D5] shadow-sm flex flex-col overflow-hidden h-[760px]">
          {detailLoading ? (
            <div className="m-auto text-center p-12 text-xs text-navy-500 space-y-2">
              <RefreshCw className="w-6 h-6 text-brass-600 animate-spin mx-auto" />
              <p>Fetching full communication thread...</p>
            </div>
          ) : !ticketDetail ? (
            <div className="m-auto text-center p-12 text-xs text-navy-500 space-y-2">
              <Headphones className="w-10 h-10 text-sand-400 mx-auto" />
              <p className="font-semibold text-navy-800">Select a Ticket</p>
              <p>Choose an inquiry from the inbox queue to view conversation history and reply.</p>
            </div>
          ) : (
            <>
              {/* Ticket Top Action Bar */}
              <div className="p-4 border-b border-[#E8E2D5] bg-[#FAF8F5] space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-navy-950 bg-white px-2 py-0.5 rounded border border-[#E8E2D5]">
                        {ticketDetail.ticket.ticket_number}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs border capitalize ${getPriorityBadge(ticketDetail.ticket.priority)}`}>
                        {ticketDetail.ticket.priority} priority
                      </span>
                      <span className="text-xs text-navy-500 font-medium capitalize">
                        {ticketDetail.ticket.category.replace("_", " ")}
                      </span>
                    </div>
                    <h2 className="font-display font-bold text-base text-navy-950 mt-1">
                      {ticketDetail.ticket.subject}
                    </h2>
                  </div>

                  {/* Status, Priority & Assignee Quick Actions */}
                  <div className="flex items-center gap-2">
                    <select
                      value={ticketDetail.ticket.status}
                      onChange={(e) => handleUpdateStatus(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg border border-[#E8E2D5] bg-white text-xs font-semibold text-navy-950 focus:outline-none shadow-xs"
                    >
                      <option value="open">Status: Open</option>
                      <option value="in_progress">Status: In Progress</option>
                      <option value="waiting_customer">Status: Waiting Customer</option>
                      <option value="resolved">Status: Resolved ✓</option>
                      <option value="closed">Status: Closed</option>
                    </select>

                    <select
                      value={ticketDetail.ticket.priority}
                      onChange={(e) => handleUpdatePriority(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg border border-[#E8E2D5] bg-white text-xs font-semibold text-navy-950 focus:outline-none shadow-xs"
                    >
                      <option value="low">Priority: Low</option>
                      <option value="medium">Priority: Medium</option>
                      <option value="high">Priority: High</option>
                      <option value="urgent">Priority: Urgent ⚠️</option>
                    </select>

                    <select
                      value={ticketDetail.ticket.assigned_to || "Unassigned"}
                      onChange={(e) => handleUpdateAssignee(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg border border-[#E8E2D5] bg-white text-xs font-medium text-navy-800 focus:outline-none shadow-xs"
                    >
                      <option value="Unassigned">Unassigned</option>
                      <option value="Charlotte Davies (Logistics Lead)">Charlotte Davies</option>
                      <option value="Oliver Vance (Senior Concierge)">Oliver Vance</option>
                      <option value="SAN White Glove Team">White Glove Team</option>
                    </select>
                  </div>
                </div>

                {/* Customer & Linked Order Strip */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-white p-2.5 rounded-xl border border-[#E8E2D5]">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-navy-950 text-brass-400 font-bold flex items-center justify-center text-xs">
                      {ticketDetail.ticket.customer_name.charAt(0)}
                    </div>
                    <div className="truncate">
                      <p className="font-bold text-navy-950 truncate">{ticketDetail.ticket.customer_name}</p>
                      <p className="text-[11px] text-navy-600 truncate">{ticketDetail.ticket.customer_email}</p>
                    </div>
                  </div>

                  {ticketDetail.linked_order ? (
                    <div className="flex items-center justify-between sm:justify-end gap-3 text-[11px]">
                      <div className="text-right">
                        <p className="font-mono font-bold text-navy-950">
                          Order #{ticketDetail.linked_order.order_number || ticketDetail.linked_order.id}
                        </p>
                        <p className="text-navy-600">
                          {ticketDetail.linked_order.total_formatted} • {ticketDetail.linked_order.delivery_tier}
                        </p>
                      </div>
                      <Link
                        href={`/admin/orders`}
                        className="p-1.5 rounded-lg bg-sand-100 hover:bg-sand-200 text-navy-800"
                        title="View Full Order in Orders Suite"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-navy-700" />
                      </Link>
                    </div>
                  ) : (
                    <div className="flex items-center text-[11px] text-navy-500">
                      <span>No specific order attached</span>
                    </div>
                  )}
                </div>

                {/* Needs Reply Alert Banner */}
                {Boolean(ticketDetail.ticket.needs_reply ?? (ticketDetail.ticket.status === "open")) && (
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs text-amber-950 animate-fade-in">
                    <div className="flex items-center gap-2 font-semibold">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                      <span>Action Required: Customer is waiting for a reply</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full shadow-xs">
                      Needs Reply
                    </span>
                  </div>
                )}
              </div>

              {/* Message Timeline */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-sand-50/50">
                {ticketDetail.messages.map((m) => {
                  const isInternal = Boolean(m.is_internal_note);
                  const isAgent = m.sender_type === "agent";

                  if (isInternal) {
                    return (
                      <div
                        key={m.id}
                        className="bg-amber-50/90 border border-amber-300 rounded-xl p-3 text-xs shadow-xs"
                      >
                        <div className="flex items-center justify-between text-amber-900 font-semibold mb-1">
                          <span className="flex items-center gap-1.5 text-[11px]">
                            <Lock className="w-3.5 h-3.5 text-amber-700" />
                            Internal Staff Note ({m.sender_name})
                          </span>
                          <span className="text-[10px] text-amber-700 font-normal">
                            {new Date(m.created_at).toLocaleTimeString("en-GB", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="text-navy-900 whitespace-pre-wrap">{m.message}</p>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isAgent ? "items-end" : "items-start"}`}
                    >
                      <div className="flex items-center gap-1.5 text-[10px] text-navy-500 mb-1 px-1">
                        <span className="font-semibold text-navy-800">{m.sender_name}</span>
                        <span>•</span>
                        <span>
                          {new Date(m.created_at).toLocaleTimeString("en-GB", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      <div
                        className={`max-w-[85%] rounded-2xl p-3.5 text-xs shadow-xs ${
                          isAgent
                            ? "bg-[#00072D] text-sand-50 border border-navy-800 rounded-br-xs"
                            : "bg-white text-navy-950 border border-[#E8E2D5] rounded-bl-xs"
                        }`}
                      >
                        <p className="whitespace-pre-wrap leading-relaxed">{m.message}</p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Canned Replies */}
              <div className="px-4 py-2 border-t border-[#E8E2D5] bg-[#FAF8F5] flex items-center gap-1.5 overflow-x-auto no-scrollbar text-[11px]">
                <span className="text-navy-500 flex items-center gap-1 flex-shrink-0 font-medium">
                  <Sparkles className="w-3 h-3 text-brass-600" /> Canned:
                </span>
                {CANNED_RESPONSES.map((c, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setReplyMessage(c.text)}
                    className="px-2 py-0.5 rounded-full bg-white hover:bg-sand-100 border border-[#E8E2D5] text-navy-800 font-medium whitespace-nowrap transition-colors"
                  >
                    {c.title}
                  </button>
                ))}
              </div>

              {/* Reply Composer Form */}
              <form onSubmit={handleSendReply} className="p-3 border-t border-[#E8E2D5] bg-white space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsInternalNote(false)}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                        !isInternalNote
                          ? "bg-[#00072D] text-sand-50"
                          : "bg-sand-100 text-navy-700 hover:bg-sand-200"
                      }`}
                    >
                      Public Reply (To Client)
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsInternalNote(true)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                        isInternalNote
                          ? "bg-amber-600 text-white"
                          : "bg-sand-100 text-navy-700 hover:bg-sand-200"
                      }`}
                    >
                      <Lock className="w-3 h-3" />
                      <span>Internal Staff Note</span>
                    </button>
                  </div>

                  <span className="text-[11px] text-navy-400">Press Enter to line break</span>
                </div>

                <div className="relative">
                  <textarea
                    rows={3}
                    placeholder={
                      isInternalNote
                        ? "Record confidential staff observation or logistics coordinate (hidden from customer)..."
                        : "Draft luxury response to client..."
                    }
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border text-xs focus:outline-none focus:ring-2 resize-none ${
                      isInternalNote
                        ? "bg-amber-50/50 border-amber-300 focus:ring-amber-500/50"
                        : "bg-sand-50/60 border-[#E8E2D5] focus:ring-brass-500/50"
                    }`}
                  />
                  <button
                    type="submit"
                    disabled={sendingReply || !replyMessage.trim()}
                    className={`absolute bottom-2.5 right-2.5 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
                      isInternalNote
                        ? "bg-amber-600 hover:bg-amber-700 text-white"
                        : "bg-[#00072D] hover:bg-navy-900 text-sand-50"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <span>{sendingReply ? "Sending..." : isInternalNote ? "Save Note" : "Send Reply"}</span>
                    <Send className="w-3 h-3 text-brass-400" />
                  </button>
                </div>
              </form>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
