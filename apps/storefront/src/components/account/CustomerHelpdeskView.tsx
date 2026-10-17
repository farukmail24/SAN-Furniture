"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Headphones,
  Plus,
  Send,
  MessageSquare,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  X,
  FileText
} from "lucide-react";
import { apiUrl } from "@/lib/api-config";

interface CustomerTicket {
  id: string;
  ticket_number: string;
  order_id?: string;
  category: string;
  priority: string;
  status: string;
  subject: string;
  assigned_to?: string;
  last_reply_at: string;
  created_at: string;
}

interface TicketMessage {
  id: string;
  sender_type: "customer" | "agent" | "system";
  sender_name: string;
  message: string;
  is_internal_note: number;
  created_at: string;
}

interface CustomerHelpdeskViewProps {
  customer: {
    id?: string;
    email: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
  };
  orders: Array<{
    id: string;
    order_number: string;
    totalGbpFormatted: string;
    created_at: string;
  }>;
  showToast: (msg: string) => void;
}

export function CustomerHelpdeskView({ customer, orders, showToast }: CustomerHelpdeskViewProps) {
  const [tickets, setTickets] = useState<CustomerTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [ticketDetail, setTicketDetail] = useState<{
    ticket: CustomerTicket;
    messages: TicketMessage[];
    linked_order: any;
  } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // New Ticket Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("general");
  const [priority, setPriority] = useState("medium");
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [initialMessage, setInitialMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Reply state
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch Tickets
  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        apiUrl(`/api/support/tickets?customer_email=${encodeURIComponent(customer.email)}`)
      );
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
        if (!selectedTicketId && data.tickets?.length > 0) {
          setSelectedTicketId(data.tickets[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to fetch customer tickets:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Ticket Messages
  const fetchTicketDetails = async (id: string) => {
    try {
      setDetailLoading(true);
      const res = await fetch(apiUrl(`/api/support/tickets/${id}`));
      if (res.ok) {
        const data = await res.json();
        // Filter out internal notes for customer view
        data.messages = (data.messages || []).filter((m: TicketMessage) => !m.is_internal_note);
        setTicketDetail(data);
      }
    } catch (err) {
      console.error("Failed to fetch ticket detail:", err);
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [customer.email]);

  useEffect(() => {
    if (selectedTicketId) {
      fetchTicketDetails(selectedTicketId);
    }
  }, [selectedTicketId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticketDetail?.messages]);

  // Submit New Ticket
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !initialMessage.trim()) {
      alert("Please enter a subject and message.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(apiUrl("/api/support/tickets"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: customer.id || null,
          customer_name: `${customer.firstName || ""} ${customer.lastName || ""}`.trim() || customer.email,
          customer_email: customer.email,
          customer_phone: customer.phone || null,
          order_id: selectedOrderId || null,
          category,
          priority,
          subject: subject.trim(),
          message: initialMessage.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        showToast(`Support inquiry #${data.ticket.ticket_number} created successfully.`);
        setIsModalOpen(false);
        setSubject("");
        setInitialMessage("");
        setSelectedOrderId("");
        await fetchTickets();
        if (data.ticket?.id) {
          setSelectedTicketId(data.ticket.id);
        }
      } else {
        const err = await res.json();
        alert("Failed to submit ticket: " + (err.error || "Unknown"));
      }
    } catch (err: any) {
      alert("Network error: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Customer Reply
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicketId) return;

    try {
      setSendingReply(true);
      const res = await fetch(apiUrl(`/api/support/tickets/${selectedTicketId}/messages`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender_type: "customer",
          sender_name: `${customer.firstName || "Customer"}`,
          message: replyText.trim(),
          is_internal_note: 0,
        }),
      });

      if (res.ok) {
        setReplyText("");
        showToast("Reply sent to SAN White Glove Concierge.");
        await fetchTicketDetails(selectedTicketId);
        fetchTickets();
      }
    } catch (e: any) {
      alert("Error sending reply: " + e.message);
    } finally {
      setSendingReply(false);
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
      default:
        return "bg-sand-100 text-navy-800 border-sand-300";
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-navy-950">
      {/* Header Bar */}
      <div className="bg-sand-100/90 border border-sand-300 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-brass-700 bg-brass-500/10 px-2.5 py-0.5 rounded-full border border-brass-500/20">
            White Glove Concierge Service
          </span>
          <h2 className="font-display text-2xl font-bold text-navy-950 mt-1 flex items-center gap-2">
            <Headphones className="w-6 h-6 text-brass-600" />
            <span>Dedicated Customer Support &amp; Claims</span>
          </h2>
          <p className="text-xs text-navy-600 mt-0.5">
            Connect directly with SAN furniture specialists regarding deliveries, room-of-choice assembly, fabric swatches, or transit inquiries.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-navy-950 hover:bg-navy-900 text-sand-50 text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4 text-brass-400" />
          <span>Open New Inquiry / Claim</span>
        </button>
      </div>

      {/* Main Split Grid: Ticket List (Left) & Conversation Thread (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Column: Tickets Queue */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-sand-300 shadow-sm flex flex-col overflow-hidden h-[620px]">
          <div className="p-3.5 border-b border-sand-200 bg-sand-50/70 flex items-center justify-between">
            <h3 className="text-xs font-bold text-navy-950">My Inquiries ({tickets.length})</h3>
            <button
              type="button"
              onClick={fetchTickets}
              className="p-1 rounded text-navy-600 hover:text-navy-950"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-sand-200">
            {loading ? (
              <div className="p-8 text-center text-xs text-navy-500">
                <RefreshCw className="w-5 h-5 text-brass-600 animate-spin mx-auto mb-2" />
                <p>Loading your support tickets...</p>
              </div>
            ) : tickets.length === 0 ? (
              <div className="p-8 text-center text-xs text-navy-500 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto opacity-70" />
                <p className="font-semibold text-navy-800">No Inquiries Found</p>
                <p>You currently have no open support claims or requests.</p>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="mt-2 text-xs text-brass-700 font-bold hover:underline"
                >
                  Create an Inquiry
                </button>
              </div>
            ) : (
              tickets.map((t) => {
                const isSelected = selectedTicketId === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTicketId(t.id)}
                    className={`w-full text-left p-3.5 transition-colors flex flex-col gap-1.5 ${
                      isSelected
                        ? "bg-sand-100/90 border-l-4 border-l-brass-500"
                        : "hover:bg-sand-50"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-mono font-bold text-navy-950">{t.ticket_number}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] border capitalize font-medium ${getStatusBadge(t.status)}`}>
                        {t.status.replace("_", " ")}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-navy-950 line-clamp-1">{t.subject}</h4>

                    <div className="flex items-center justify-between text-[10px] text-navy-500">
                      <span className="capitalize">{t.category.replace("_", " ")}</span>
                      <span>
                        {new Date(t.last_reply_at || t.created_at).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Ticket Detail & Message Timeline */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-sand-300 shadow-sm flex flex-col overflow-hidden h-[620px]">
          {detailLoading ? (
            <div className="m-auto text-center p-12 text-xs text-navy-500 space-y-2">
              <RefreshCw className="w-6 h-6 text-brass-600 animate-spin mx-auto" />
              <p>Loading messages...</p>
            </div>
          ) : !ticketDetail ? (
            <div className="m-auto text-center p-12 text-xs text-navy-500 space-y-2">
              <Headphones className="w-10 h-10 text-sand-400 mx-auto" />
              <p className="font-semibold text-navy-800">Select an Inquiry</p>
              <p>Choose a ticket to read responses from our White Glove support team.</p>
            </div>
          ) : (
            <>
              {/* Ticket Topbar */}
              <div className="p-4 border-b border-sand-200 bg-sand-50/70 flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-navy-950 bg-white px-2 py-0.5 rounded border border-sand-300">
                      {ticketDetail.ticket.ticket_number}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] border capitalize font-medium ${getStatusBadge(ticketDetail.ticket.status)}`}>
                      {ticketDetail.ticket.status.replace("_", " ")}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-sm sm:text-base text-navy-950 mt-1">
                    {ticketDetail.ticket.subject}
                  </h3>
                </div>

                {ticketDetail.ticket.order_id && (
                  <div className="text-right text-[11px] font-mono text-navy-700 bg-white px-2.5 py-1 rounded-lg border border-sand-300">
                    <span className="text-navy-400 block text-[9px] uppercase font-sans">Linked Order</span>
                    #{ticketDetail.ticket.order_id}
                  </div>
                )}
              </div>

              {/* Chat Timeline */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-sand-50/40">
                {ticketDetail.messages.map((m) => {
                  const isCustomer = m.sender_type === "customer";
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isCustomer ? "items-end" : "items-start"}`}
                    >
                      <div className="flex items-center gap-1.5 text-[10px] text-navy-500 mb-1 px-1">
                        <span className="font-semibold text-navy-800">
                          {isCustomer ? "You" : m.sender_name || "SAN Concierge"}
                        </span>
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
                          isCustomer
                            ? "bg-navy-950 text-sand-50 border border-navy-800 rounded-br-xs"
                            : "bg-white text-navy-950 border border-sand-300 rounded-bl-xs"
                        }`}
                      >
                        <p className="whitespace-pre-wrap leading-relaxed">{m.message}</p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply Form */}
              <form onSubmit={handleSendReply} className="p-3 border-t border-sand-200 bg-white">
                <div className="relative">
                  <textarea
                    rows={2}
                    placeholder="Type your response to the SAN Concierge team..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="w-full p-2.5 pr-24 rounded-xl border border-sand-300 text-xs focus:outline-none focus:ring-2 focus:ring-brass-500/50 resize-none bg-sand-50/50"
                  />
                  <button
                    type="submit"
                    disabled={sendingReply || !replyText.trim()}
                    className="absolute bottom-2.5 right-2.5 px-3 py-1.5 rounded-lg bg-navy-950 hover:bg-navy-900 text-sand-50 text-xs font-bold flex items-center gap-1.5 disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    <span>{sendingReply ? "Sending..." : "Reply"}</span>
                    <Send className="w-3 h-3 text-brass-400" />
                  </button>
                </div>
              </form>
            </>
          )}
        </div>

      </div>

      {/* Modal: Open New Support Ticket */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-navy-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-sand-50 border border-sand-300 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-navy-500 hover:text-navy-950 hover:bg-sand-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-brass-700 bg-brass-100 px-2 py-0.5 rounded">
                White Glove Assistance
              </span>
              <h3 className="font-display text-xl font-bold text-navy-950 mt-1">
                Open Support Inquiry
              </h3>
              <p className="text-xs text-navy-600">
                Submit an inquiry and our dedicated UK concierge team will review and respond promptly.
              </p>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-navy-950 mb-1">Subject</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Room of choice delivery clearance, fabric sample request..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-sand-300 bg-white text-navy-950 focus:outline-none focus:ring-2 focus:ring-brass-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-navy-950 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-sand-300 bg-white text-navy-950 focus:outline-none"
                  >
                    <option value="general">General Inquiries</option>
                    <option value="delivery">2-Man Delivery &amp; Slots</option>
                    <option value="damaged_item">Transit Damage Claim</option>
                    <option value="product_inquiry">Fabric Swatch / Product Spec</option>
                    <option value="assembly_help">Assembly Support</option>
                    <option value="return_refund">Return or Refund Request</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-navy-950 mb-1">Attach Order (Optional)</label>
                  <select
                    value={selectedOrderId}
                    onChange={(e) => setSelectedOrderId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-sand-300 bg-white text-navy-950 focus:outline-none"
                  >
                    <option value="">No Order Attached</option>
                    {orders.map((o) => (
                      <option key={o.id} value={o.order_number || o.id}>
                        {o.order_number || o.id} ({o.totalGbpFormatted})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-navy-950 mb-1">Detailed Description</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Describe your inquiry, delivery requirements, or any specific questions..."
                  value={initialMessage}
                  onChange={(e) => setInitialMessage(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-sand-300 bg-white text-navy-950 focus:outline-none focus:ring-2 focus:ring-brass-500/50 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-navy-700 hover:bg-sand-200 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-navy-950 hover:bg-navy-900 text-sand-50 font-bold text-xs transition-all disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Submit Inquiry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
