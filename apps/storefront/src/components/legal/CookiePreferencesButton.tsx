"use client";

import React from "react";
import { Settings } from "lucide-react";

/**
 * Dispatches the global window event listened to by CookieConsentBanner
 * so visitors can reopen and adjust cookie preferences from the Privacy Policy.
 */
export function CookiePreferencesButton({ label = "Manage Cookie Preferences" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent("san:open-cookie-preferences"))}
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-sand-100 hover:bg-sand-200 border border-sand-300 text-navy-950 font-semibold text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-brass-500"
    >
      <Settings className="w-3.5 h-3.5 text-brass-600" />
      <span>{label}</span>
    </button>
  );
}
