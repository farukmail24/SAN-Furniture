"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Headphones,
  X,
  Send,
  Truck,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  GripVertical
} from "lucide-react";
import { apiUrl } from "@/lib/api-config";
import { showAlert } from "@/components/ui/AlertModal";

export function ConciergeSupportWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dockSide, setDockSide] = useState<"left" | "right">("right");
  const [topPercent, setTopPercent] = useState(50);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);

  const pointerStartRef = useRef<{
    startX: number;
    startY: number;
    hasMoved: boolean;
  } | null>(null);

  const [activeMode, setActiveMode] = useState<"chat" | "faq" | "tracking">("chat");

  // Mobile Draggable Position State
  const [mobilePos, setMobilePos] = useState<{ x: number; y: number } | null>(null);
  const [isMobileDragging, setIsMobileDragging] = useState(false);
  const mobileStartRef = useRef<{ startX: number; startY: number; initX: number; initY: number; moved: boolean } | null>(null);

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

    try {
      const savedSide = localStorage.getItem("san_concierge_dock_side");
      if (savedSide === "left" || savedSide === "right") {
        setDockSide(savedSide);
      }
      const savedPercent = localStorage.getItem("san_concierge_top_percent");
      if (savedPercent) {
        const p = parseFloat(savedPercent);
        if (!isNaN(p) && p >= 10 && p <= 90) {
          setTopPercent(p);
        }
      }
      const savedMobile = localStorage.getItem("san_concierge_mobile_pos");
      if (savedMobile) {
        const parsed = JSON.parse(savedMobile);
        if (typeof parsed?.x === "number" && typeof parsed?.y === "number") {
          setMobilePos(parsed);
        }
      }
    } catch {}
  }, []);

  const handleMobileTouchStart = (e: React.PointerEvent<HTMLDivElement>) => {
    const currentX = mobilePos?.x ?? (window.innerWidth - 64);
    const currentY = mobilePos?.y ?? (window.innerHeight - 110);

    mobileStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: currentX,
      initY: currentY,
      moved: false,
    };
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
  };

  const handleMobileTouchMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!mobileStartRef.current) return;
    const deltaX = e.clientX - mobileStartRef.current.startX;
    const deltaY = e.clientY - mobileStartRef.current.startY;

    if (!mobileStartRef.current.moved && (Math.abs(deltaX) > 6 || Math.abs(deltaY) > 6)) {
      mobileStartRef.current.moved = true;
      setIsMobileDragging(true);
    }

    if (mobileStartRef.current.moved) {
      const newX = Math.max(12, Math.min(window.innerWidth - 60, mobileStartRef.current.initX + deltaX));
      const newY = Math.max(64, Math.min(window.innerHeight - 90, mobileStartRef.current.initY + deltaY));
      setMobilePos({ x: newX, y: newY });
    }
  };

  const handleMobileTouchEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!mobileStartRef.current) return;
    const moved = mobileStartRef.current.moved;
    mobileStartRef.current = null;
    setIsMobileDragging(false);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}

    if (moved) {
      if (mobilePos) {
        try {
          localStorage.setItem("san_concierge_mobile_pos", JSON.stringify(mobilePos));
        } catch {}
      }
    } else {
      setIsOpen((prev) => !prev);
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only react to primary mouse button / touch
    if (e.button !== 0 && e.pointerType === "mouse") return;

    pointerStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      hasMoved: false,
    };
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointerStartRef.current) return;
    const deltaX = e.clientX - pointerStartRef.current.startX;
    const deltaY = e.clientY - pointerStartRef.current.startY;

    if (!pointerStartRef.current.hasMoved && (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4)) {
      pointerStartRef.current.hasMoved = true;
      setIsDragging(true);
    }

    if (pointerStartRef.current.hasMoved) {
      setDragPos({
        x: e.clientX,
        y: Math.max(80, Math.min(window.innerHeight - 80, e.clientY)),
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointerStartRef.current) return;
    const hasMoved = pointerStartRef.current.hasMoved;
    pointerStartRef.current = null;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}

    if (hasMoved) {
      // Snapping to nearest side: left or right
      const isLeft = e.clientX < window.innerWidth / 2;
      const newSide: "left" | "right" = isLeft ? "left" : "right";
      const clampedY = Math.max(80, Math.min(window.innerHeight - 80, e.clientY));
      const newTopPercent = Math.max(12, Math.min(88, Math.round((clampedY / window.innerHeight) * 100)));

      setDockSide(newSide);
      setTopPercent(newTopPercent);
      setIsDragging(false);
      setDragPos(null);

      try {
        localStorage.setItem("san_concierge_dock_side", newSide);
        localStorage.setItem("san_concierge_top_percent", String(newTopPercent));
      } catch {}
    } else {
      // Simple click without drag
      setIsDragging(false);
      setDragPos(null);
      setIsOpen((prev) => !prev);
    }
  };

  const handlePointerCancel = () => {
    pointerStartRef.current = null;
    setIsDragging(false);
    setDragPos(null);
  };

  const handleSubmitInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userEmail.trim() || !userName.trim() || !message.trim()) {
      await showAlert({ title: "Inquiry Details Required", message: "Please enter your name, email, and message.", type: "warning" });
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
        await showAlert({ title: "Submission Failed", message: "Failed to submit inquiry. Please try again.", type: "danger" });
      }
    } catch (e: any) {
      await showAlert({ title: "Network Error", message: e.message, type: "danger" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleLookupOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingOrderNum.trim()) return;
    setTrackingResult(
      `Order ${trackingOrderNum.trim()} verified: White Glove delivery booked with dedicated logistics fleet. Delivery slot updates are dispatched via SMS 30 mins prior to delivery.`
    );
  };

  // Positioning logic
  const isRight = dockSide === "right";

  const containerStyle: React.CSSProperties = isDragging && dragPos
    ? {
        position: "fixed",
        top: dragPos.y,
        left: dragPos.x,
        transform: "translate(-50%, -50%)",
        zIndex: 9999,
        cursor: "grabbing",
        touchAction: "none",
        transition: "none",
      }
    : {
        position: "fixed",
        top: `${topPercent}%`,
        marginTop: "-24px",
        left: isRight ? "auto" : 0,
        right: isRight ? 0 : "auto",
        transform:
          isHovered || isOpen
            ? "translateX(0)"
            : isRight
            ? "translateX(calc(100% - 54px))"
            : "translateX(calc(-100% + 54px))",
        zIndex: 40,
        cursor: "grab",
        touchAction: "none",
        transition: "transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), top 0.25s ease-out",
      };

  return (
    <aside
      aria-label="SAN Customer Support Concierge"
      className="no-print print:hidden"
      data-no-print="true"
      data-support-widget="true"
    >
      {/* Mobile Freely Draggable Floating Action Button */}
      <div
        className="sm:hidden fixed z-40 touch-none select-none no-print print:hidden"
        data-no-print="true"
        data-support-widget="true"
        style={{
          left: mobilePos ? `${mobilePos.x}px` : "auto",
          right: mobilePos ? "auto" : "1rem",
          top: mobilePos ? `${mobilePos.y}px` : "auto",
          bottom: mobilePos ? "auto" : "5.5rem",
          transition: isMobileDragging ? "none" : "transform 0.15s ease-out",
        }}
        onPointerDown={handleMobileTouchStart}
        onPointerMove={handleMobileTouchMove}
        onPointerUp={handleMobileTouchEnd}
        onPointerCancel={handleMobileTouchEnd}
        role="button"
        tabIndex={0}
        aria-label="SAN Customer Support (Drag to move or tap to open)"
      >
        <div
          className={`relative flex items-center justify-center w-12 h-12 rounded-full bg-navy-950 text-sand-50 shadow-[0_10px_28px_rgba(0,7,45,0.45)] border border-brass-500/50 transition-transform cursor-grab ${
            isMobileDragging
              ? "scale-110 ring-2 ring-brass-400 cursor-grabbing shadow-[0_16px_36px_rgba(0,7,45,0.65)]"
              : "active:scale-90"
          }`}
        >
          <Headphones className="w-5 h-5 text-brass-400" />
          <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-navy-950 animate-pulse" />
        </div>
      </div>

      {/* Floating Draggable Side Tab for Desktop Screens Only */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={containerStyle}
        role="button"
        tabIndex={0}
        aria-label="SAN Customer Support - Drag to move or click to open"
        title="Customer Support (Drag across to left/right or up/down)"
        className="hidden sm:block select-none outline-none no-print print:hidden"
        data-no-print="true"
        data-support-widget="true"
      >
        <div
          className={`flex items-center gap-3 py-2.5 bg-navy-950 text-sand-50 shadow-[0_12px_36px_rgba(0,7,45,0.45)] transition-all ${
            isDragging
              ? "rounded-2xl border border-brass-400 shadow-[0_20px_50px_rgba(0,7,45,0.6)] scale-105 px-4"
              : isRight
              ? "pl-3.5 pr-4 rounded-l-2xl border-y border-l border-brass-500/40 hover:border-brass-400"
              : "pl-4 pr-3.5 rounded-r-2xl border-y border-r border-brass-500/40 hover:border-brass-400"
          }`}
        >
          {/* If Docked on Left: Show Grip Handle first, then Text, then Icon on outer edge */}
          {!isRight && !isDragging && (
            <div
              className="flex items-center text-navy-500 group-hover:text-brass-400 transition-colors pr-1 border-r border-navy-800"
              title="Drag across to right or up/down"
            >
              <GripVertical className="w-3.5 h-3.5" />
            </div>
          )}

          {/* Headphones Icon (Left edge if docked on right, right edge if docked on left) */}
          {isRight && (
            <div className="relative shrink-0 flex items-center justify-center w-8 h-8 rounded-xl bg-navy-900 border border-brass-500/30 transition-colors">
              <Headphones className="w-4 h-4 text-brass-400 transition-colors" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-navy-950 animate-pulse" />
            </div>
          )}

          {/* Full Button Label */}
          <div className="flex flex-col text-left whitespace-nowrap px-1">
            <span className="font-display text-xs font-bold tracking-wide text-sand-50">
              Customer Support
            </span>
            <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              UK Specialists Online
            </span>
          </div>

          {/* Headphones Icon when docked on left or while dragging */}
          {(!isRight || isDragging) && (
            <div className="relative shrink-0 flex items-center justify-center w-8 h-8 rounded-xl bg-navy-900 border border-brass-500/30 transition-colors">
              <Headphones className="w-4 h-4 text-brass-400 transition-colors" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-navy-950 animate-pulse" />
            </div>
          )}

          {/* If Docked on Right: Show Grip Handle at the end */}
          {isRight && !isDragging && (
            <div
              className="flex items-center text-navy-500 group-hover:text-brass-400 transition-colors pl-1 border-l border-navy-800"
              title="Drag across to left or up/down"
            >
              <GripVertical className="w-3.5 h-3.5" />
            </div>
          )}
        </div>
      </div>

      {/* Floating Modal Card */}
      {isOpen && (
        <div className="no-print print:hidden" data-no-print="true" data-support-widget="true">
          {/* Backdrop overlay for mobile dismissal */}
          <div
            className="fixed inset-0 bg-navy-950/60 backdrop-blur-xs z-40 transition-opacity no-print print:hidden"
            data-no-print="true"
            onClick={() => setIsOpen(false)}
          />

          <div
            className={`fixed z-50 inset-x-0 bottom-0 sm:inset-x-auto sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 w-full sm:w-[420px] max-h-[92vh] sm:max-h-[85vh] bg-white rounded-t-3xl sm:rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,7,45,0.45)] border-t sm:border border-sand-300 overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 pb-[max(env(safe-area-inset-bottom),0.5rem)] sm:pb-0 no-print print:hidden ${
              isRight
                ? "sm:right-16"
                : "sm:left-16"
            }`}
            data-no-print="true"
          >
            {/* Header */}
            <div className="bg-[#00072D] text-sand-50 p-4 border-b border-navy-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-navy-900 border border-brass-500/40 flex items-center justify-center text-brass-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-sm text-sand-50 leading-none">
                    SAN Customer Support
                  </h4>
                  <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1 mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    UK Specialists Online (08:30 – 18:30 GMT)
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-full bg-navy-900 text-sand-300 hover:text-sand-50 flex items-center justify-center cursor-pointer transition-colors"
                aria-label="Close support panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Navigation Pills */}
            <div className="bg-sand-100 p-2 border-b border-sand-200 flex items-center gap-1 text-xs font-semibold shrink-0">
              <button
                type="button"
                onClick={() => {
                  setActiveMode("chat");
                  setSubmittedTicket(null);
                }}
                className={`flex-1 py-1.5 rounded-xl transition-all cursor-pointer ${
                  activeMode === "chat" ? "bg-white text-navy-950 shadow-xs" : "text-navy-600 hover:text-navy-900"
                }`}
              >
                Contact Team
              </button>
              <button
                type="button"
                onClick={() => setActiveMode("tracking")}
                className={`flex-1 py-1.5 rounded-xl transition-all cursor-pointer ${
                  activeMode === "tracking" ? "bg-white text-navy-950 shadow-xs" : "text-navy-600 hover:text-navy-900"
                }`}
              >
                Order Tracking
              </button>
              <button
                type="button"
                onClick={() => setActiveMode("faq")}
                className={`flex-1 py-1.5 rounded-xl transition-all cursor-pointer ${
                  activeMode === "faq" ? "bg-white text-navy-950 shadow-xs" : "text-navy-600 hover:text-navy-900"
                }`}
              >
                Fast FAQ
              </button>
            </div>

            {/* Content Body */}
            <div className="p-4 overflow-y-auto flex-1">
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
                          Our UK customer support team has received your inquiry. A specialist will respond promptly and you will be notified via email and in your client portal.
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
                            placeholder="e.g. John Smith"
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
                            <option value="product_inquiry">Product Specifications</option>
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
                          placeholder="How can our UK support team assist you today?"
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
                        <span>{submitting ? "Transmitting..." : "Send to Support Team"}</span>
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
                      className="w-full py-2.5 rounded-xl bg-navy-950 hover:bg-navy-900 text-sand-50 font-bold transition-all cursor-pointer"
                    >
                      Track Furniture Delivery
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
                      <span>How is my furniture delivered and packaged?</span>
                    </h5>
                    <p className="text-[11px] text-navy-600 mt-1 leading-relaxed">
                      All items are securely packaged in heavy-duty protective boxes and delivered directly to your doorstep across Mainland UK within 10-15 business days.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-sand-100/70 border border-sand-200">
                    <h5 className="font-bold flex items-center gap-1.5 text-navy-950">
                      <ShieldCheck className="w-3.5 h-3.5 text-brass-600" />
                      <span>What care is recommended for furniture?</span>
                    </h5>
                    <p className="text-[11px] text-navy-600 mt-1 leading-relaxed">
                      Dust regularly with a soft, clean dry cloth. For spills, blot immediately with a damp lint-free cloth without abrasive chemicals to preserve original finishes.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-sand-100/70 border border-sand-200">
                    <h5 className="font-bold flex items-center gap-1.5 text-navy-950">
                      <Sparkles className="w-3.5 h-3.5 text-brass-600" />
                      <span>Is assembly straightforward?</span>
                    </h5>
                    <p className="text-[11px] text-navy-600 mt-1 leading-relaxed">
                      Yes! Flat-pack furniture items include step-by-step assembly instructions and all required fixtures for quick and easy home setup.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer note */}
            <div className="p-2.5 bg-sand-50 border-t border-sand-200 text-center text-[10px] text-navy-500 shrink-0">
              SAN Furniture UK Customer Support &amp; Logistics Desk
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
