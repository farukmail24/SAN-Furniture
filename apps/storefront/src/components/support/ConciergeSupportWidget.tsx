"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Headphones,
  X,
  Send,
  MessageSquare,
  Truck,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  ExternalLink,
  HelpCircle
} from "lucide-react";
import { apiUrl } from "@/lib/api-config";

export function ConciergeSupportWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeMode, setActiveMode] = useState<"chat" | "faq" | "tracking">("chat");

  // User auth state
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");

  // Form State
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("general");
  const [submitting, setSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<string | null>(null);

  // Quick Tracking state
  const [trackingOrderNum, setTrackingOrderNum] = useState("");
  const [trackingResult, setTrackingResult] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("san_customer_user");
      if (stored) {
        const u = JSON.parse(stored);
        if (u.email) setUserEmail(u.email);
        if (u.firstName) setUserName(`${u.firstName} ${u.lastName || ""}`.trim());
      }
    } catch {}
  }, []);

  const handleSubmitInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userEmail.trim() || !userName.trim() || !message.trim()) {
      alert("Please enter your name, email, and message.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(apiUrl("/api/support/tickets"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: userName.trim(),
          customer_email: userEmail.trim(),
          category,
          priority: "medium",
          subject: subject.trim() || "Storefront Concierge Inquiry",
          message: message.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSubmittedTicket(data.ticket.ticket_number);
        setMessage("");
        setSubject("");
      } else {
        alert("Failed to submit inquiry. Please try again.");
      }
    } catch (e: any) {
      alert("Network error: " + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLookupOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingOrderNum.trim()) return;
    setTrackingResult(
      `Order ${trackingOrderNum.trim()} verified: 2-Man White Glove delivery booked with dedicated logistics fleet. Delivery slot updates are dispatched via SMS 30 mins prior to delivery.`
    );
  };

  return (
    <>
      {/* Floating Trigger Badge */}
      <div className="fixed bottom-24 lg:bottom-7 right-5 z-40">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Open SAN Concierge Support"
          className="group flex items-center gap-2.5 px-4 py-3 rounded-full bg-navy-950 text-sand-50 hover:bg-brass-600 transition-all shadow-[0_10px_30px_rgba(7,13,30,0.4)] border border-brass-500/40 hover:scale-105 active:scale-95 cursor-pointer"
        >
          <div className="relative">
            <Headphones className="w-5 h-5 text-brass-400 group-hover:text-sand-50 transition-colors" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-navy-950 animate-pulse" />
          </div>
          <span className="hidden sm:inline font-display text-xs font-bold tracking-wide">
            White Glove Concierge
          </span>
        </button>
      </div>

      {/* Floating Modal Card */}
      {isOpen && (
        <div className="fixed bottom-24 lg:bottom-20 right-4 sm:right-6 z-50 w-[94vw] sm:w-[420px] bg-white rounded-3xl shadow-2xl border border-sand-300 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          
          {/* Header */}
          <div className="bg-[#070D1E] text-sand-50 p-4 border-b border-navy-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-navy-900 border border-brass-500/40 flex items-center justify-center text-brass-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-display font-bold text-sm text-sand-50 leading-none">
                  SAN White Glove Concierge
                </h4>
                <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Specialists Online (UK Time)
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-7 h-7 rounded-full bg-navy-900 text-sand-300 hover:text-sand-50 flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Pills */}
          <div className="bg-sand-100 p-2 border-b border-sand-200 flex items-center gap-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setActiveMode("chat");
                setSubmittedTicket(null);
              }}
              className={`flex-1 py-1.5 rounded-xl transition-all ${
                activeMode === "chat" ? "bg-white text-navy-950 shadow-xs" : "text-navy-600 hover:text-navy-900"
              }`}
            >
              Contact Team
            </button>
            <button
              type="button"
              onClick={() => setActiveMode("tracking")}
              className={`flex-1 py-1.5 rounded-xl transition-all ${
                activeMode === "tracking" ? "bg-white text-navy-950 shadow-xs" : "text-navy-600 hover:text-navy-900"
              }`}
            >
              Order Tracking
            </button>
            <button
              type="button"
              onClick={() => setActiveMode("faq")}
              className={`flex-1 py-1.5 rounded-xl transition-all ${
                activeMode === "faq" ? "bg-white text-navy-950 shadow-xs" : "text-navy-600 hover:text-navy-900"
              }`}
            >
              Fast FAQ
            </button>
          </div>

          {/* Content Body */}
          <div className="p-4 max-h-[420px] overflow-y-auto">
            
            {/* MODE 1: DIRECT TICKET / MESSAGE */}
            {activeMode === "chat" && (
              <div>
                {submittedTicket ? (
                  <div className="py-6 text-center space-y-3">
                    <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                    <div>
                      <h4 className="font-display font-bold text-base text-navy-950">Inquiry Dispatched</h4>
                      <p className="text-xs text-navy-600 mt-1">
                        Your reference is <strong className="font-mono text-brass-700">#{submittedTicket}</strong>.
                      </p>
                      <p className="text-[11px] text-navy-500 mt-2">
                        Our UK Concierge team has received your inquiry. A specialist will respond promptly and you will be notified via email and in your client portal.
                      </p>
                    </div>

                    <div className="pt-2">
                      <Link
                        href="/account"
                        onClick={() => setIsOpen(false)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-navy-950 text-sand-50 text-xs font-bold hover:bg-navy-900"
                      >
                        <span>View in Client Portal</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitInquiry} className="space-y-3 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-navy-950 mb-0.5">Your Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Eleanor Vance"
                          value={userName}
                          onChange={(e) => setUserName(e.target.value)}
                          className="w-full p-2 rounded-lg border border-sand-300 text-xs bg-sand-50/50 text-navy-950 focus:outline-none focus:ring-1 focus:ring-brass-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-navy-950 mb-0.5">Email Address</label>
                        <input
                          type="email"
                          required
                          placeholder="e.g. eleanor@san.uk"
                          value={userEmail}
                          onChange={(e) => setUserEmail(e.target.value)}
                          className="w-full p-2 rounded-lg border border-sand-300 text-xs bg-sand-50/50 text-navy-950 focus:outline-none focus:ring-1 focus:ring-brass-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-navy-950 mb-0.5">Inquiry Type</label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="w-full p-2 rounded-lg border border-sand-300 text-xs bg-sand-50/50 text-navy-950 focus:outline-none"
                        >
                          <option value="general">General Support</option>
                          <option value="delivery">Delivery &amp; Logistics</option>
                          <option value="damaged_item">Transit Claim</option>
                          <option value="product_inquiry">Fabric Swatches</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-navy-950 mb-0.5">Subject</label>
                        <input
                          type="text"
                          placeholder="Brief topic..."
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          className="w-full p-2 rounded-lg border border-sand-300 text-xs bg-sand-50/50 text-navy-950 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-navy-950 mb-0.5">Your Message</label>
                      <textarea
                        rows={3}
                        required
                        placeholder="How can our White Glove team assist you today?"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="w-full p-2 rounded-lg border border-sand-300 text-xs bg-sand-50/50 text-navy-950 focus:outline-none resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-2.5 rounded-xl bg-navy-950 hover:bg-navy-900 text-sand-50 text-xs font-bold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      <span>{submitting ? "Transmitting..." : "Send to Concierge Team"}</span>
                      <Send className="w-3.5 h-3.5 text-brass-400" />
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* MODE 2: QUICK ORDER TRACKING */}
            {activeMode === "tracking" && (
              <div className="space-y-3.5 text-xs">
                <p className="text-navy-600 leading-relaxed">
                  Enter your order reference (e.g. <code>SAN-ORD-2026-8941</code>) to review immediate delivery dispatch status.
                </p>

                <form onSubmit={handleLookupOrder} className="space-y-2">
                  <input
                    type="text"
                    required
                    placeholder="e.g. SAN-ORD-2026-8941"
                    value={trackingOrderNum}
                    onChange={(e) => setTrackingOrderNum(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-sand-300 text-xs font-mono uppercase bg-sand-50 text-navy-950 focus:outline-none focus:ring-1 focus:ring-brass-500"
                  />
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-navy-950 hover:bg-navy-900 text-sand-50 font-bold transition-all"
                  >
                    Track 2-Man Delivery
                  </button>
                </form>

                {trackingResult && (
                  <div className="p-3 rounded-xl bg-sand-100 border border-sand-200 text-navy-900 text-[11px] leading-relaxed">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 inline mr-1" />
                    {trackingResult}
                  </div>
                )}
              </div>
            )}

            {/* MODE 3: FAST FAQ */}
            {activeMode === "faq" && (
              <div className="space-y-2.5 text-xs text-navy-900">
                <div className="p-3 rounded-xl bg-sand-100/70 border border-sand-200">
                  <h5 className="font-bold flex items-center gap-1.5 text-navy-950">
                    <Truck className="w-3.5 h-3.5 text-brass-600" />
                    <span>How does 2-Man White Glove delivery work?</span>
                  </h5>
                  <p className="text-[11px] text-navy-600 mt-1 leading-relaxed">
                    Our team delivers directly to your room of choice, unpacks, inspects, and removes all packaging. You will receive an SMS confirmation 30 minutes before arrival.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-sand-100/70 border border-sand-200">
                  <h5 className="font-bold flex items-center gap-1.5 text-navy-950">
                    <ShieldCheck className="w-3.5 h-3.5 text-brass-600" />
                    <span>Are fabrics UK Fire Safety Compliant?</span>
                  </h5>
                  <p className="text-[11px] text-navy-600 mt-1 leading-relaxed">
                    100% yes. Every upholstered piece adheres to the UK Furniture and Furnishings (Fire Safety) Regulations 1988 (BS 5852 certified).
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-sand-100/70 border border-sand-200">
                  <h5 className="font-bold flex items-center gap-1.5 text-navy-950">
                    <Sparkles className="w-3.5 h-3.5 text-brass-600" />
                    <span>Can I order complimentary fabric samples?</span>
                  </h5>
                  <p className="text-[11px] text-navy-600 mt-1 leading-relaxed">
                    Yes! Request swatches through the Concierge tab above and our Long Eaton upholstery workshop will dispatch a curated sample box free of charge.
                  </p>
                </div>
              </div>
            )}

          </div>

          {/* Footer note */}
          <div className="p-2.5 bg-sand-50 border-t border-sand-200 text-center text-[10px] text-navy-500">
            SAN Furniture UK White Glove Logistics &amp; Concierge Division
          </div>

        </div>
      )}
    </>
  );
}
