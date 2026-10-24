"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ShieldCheck, Cookie, Settings, Check, X } from "lucide-react";

interface CookiePreferences {
  essential: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}

const STORAGE_KEY = "san_cookie_consent_v1";

export function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true, // Always true and locked
    functional: false,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        // Small delay to prevent layout shift during initial paint
        const timer = setTimeout(() => setIsVisible(true), 600);
        return () => clearTimeout(timer);
      }
    } catch {
      setIsVisible(true);
    }
  }, []);

  const saveConsent = (prefs: CookiePreferences) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
      document.cookie = `san_cookie_consent=${JSON.stringify(prefs)}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {}
    setIsVisible(false);
  };

  const handleAcceptAll = () => {
    const allAccepted: CookiePreferences = {
      essential: true,
      functional: true,
      analytics: true,
      marketing: true,
    };
    setPreferences(allAccepted);
    saveConsent(allAccepted);
  };

  const handleRejectNonEssential = () => {
    const onlyEssential: CookiePreferences = {
      essential: true,
      functional: false,
      analytics: false,
      marketing: false,
    };
    setPreferences(onlyEssential);
    saveConsent(onlyEssential);
  };

  const handleSavePreferences = () => {
    saveConsent(preferences);
  };

  if (!isVisible) return null;

  return (
    <aside
      role="dialog"
      aria-labelledby="cookie-heading"
      aria-describedby="cookie-desc"
      data-no-print="true"
      className="fixed bottom-0 inset-x-0 z-50 p-4 sm:p-6 bg-navy-950/95 backdrop-blur-md border-t border-sand-300/20 text-sand-50 shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 no-print print:hidden"
    >
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-brass-400 shrink-0" />
              <h3 id="cookie-heading" className="text-sm sm:text-base font-bold font-display tracking-tight text-sand-50">
                UK GDPR & PECR Cookie Consent
              </h3>
            </div>
            <p id="cookie-desc" className="text-xs text-sand-300 leading-relaxed">
              We use strictly necessary cookies to power core checkout safety, cart continuity, and delivery zone calculations.
              Optional analytical and personalization cookies enhance your showroom experience. You may customize your preferences
              or accept all below in accordance with our{" "}
              <Link href="/privacy" className="text-brass-400 underline hover:text-brass-300 transition-colors">
                Privacy & Cookies Policy
              </Link>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full md:w-auto shrink-0">
            <button
              type="button"
              onClick={() => setShowPreferences((prev) => !prev)}
              className="px-3.5 py-2 text-xs font-medium text-sand-200 border border-sand-300/30 rounded-lg hover:bg-sand-900/40 transition-colors flex items-center gap-1.5 focus:ring-2 focus:ring-brass-500 focus:outline-none"
            >
              <Settings className="w-3.5 h-3.5" />
              {showPreferences ? "Hide Settings" : "Manage Preferences"}
            </button>
            <button
              type="button"
              onClick={handleRejectNonEssential}
              className="px-4 py-2 text-xs font-semibold text-sand-50 bg-navy-800 border border-sand-300/30 rounded-lg hover:bg-navy-700 transition-colors focus:ring-2 focus:ring-brass-500 focus:outline-none"
            >
              Reject Non-Essential
            </button>
            <button
              type="button"
              onClick={handleAcceptAll}
              className="px-5 py-2 text-xs font-bold text-navy-950 bg-brass-400 rounded-lg hover:bg-brass-300 transition-colors shadow-sm focus:ring-2 focus:ring-brass-500 focus:outline-none"
            >
              Accept All Cookies
            </button>
          </div>
        </div>

        {/* Detailed Granular Preferences Drawer */}
        {showPreferences && (
          <div className="pt-4 border-t border-sand-300/20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-200">
            {/* Essential */}
            <div className="p-3 bg-navy-900/70 border border-sand-300/10 rounded-lg space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sand-100">Strictly Necessary</span>
                <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                  Always On
                </span>
              </div>
              <p className="text-[11px] text-sand-400 leading-normal">
                Basket continuity, secure checkout tokens, and delivery postcode lookup.
              </p>
            </div>

            {/* Functional */}
            <div className="p-3 bg-navy-900/70 border border-sand-300/10 rounded-lg space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sand-100">Functional & Room Memory</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.functional}
                    onChange={(e) => setPreferences({ ...preferences, functional: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-navy-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-brass-500"></div>
                </label>
              </div>
              <p className="text-[11px] text-sand-400 leading-normal">
                Remembers recently viewed sofas and preferred UK furniture finishes.
              </p>
            </div>

            {/* Analytics */}
            <div className="p-3 bg-navy-900/70 border border-sand-300/10 rounded-lg space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sand-100">Anonymous Analytics</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.analytics}
                    onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-navy-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-brass-500"></div>
                </label>
              </div>
              <p className="text-[11px] text-sand-400 leading-normal">
                Measures website speed and performance anonymously to prevent errors.
              </p>
            </div>

            {/* Marketing */}
            <div className="p-3 bg-navy-900/70 border border-sand-300/10 rounded-lg space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sand-100">Marketing & Syndication</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.marketing}
                    onChange={(e) => setPreferences({ ...preferences, marketing: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-navy-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-brass-500"></div>
                </label>
              </div>
              <p className="text-[11px] text-sand-400 leading-normal">
                Enables relevant UK interior inspiration adverts across search channels.
              </p>
            </div>

            <div className="sm:col-span-2 lg:col-span-4 flex justify-end pt-1">
              <button
                type="button"
                onClick={handleSavePreferences}
                className="px-4 py-1.5 text-xs font-bold text-navy-950 bg-sand-100 hover:bg-sand-50 rounded-md transition-colors"
              >
                Save My Preferences
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
