"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Smartphone,
  Mail,
  KeyRound,
  CheckCircle2,
  Copy,
  Check,
  Download,
  AlertCircle,
  RotateCcw,
  Lock,
  ArrowRight,
  ShieldOff,
} from "lucide-react";
import { apiUrl } from "@/lib/api-config";
import { showAlert, showConfirm } from "@/components/ui/AlertModal";

interface TwoFactorStatus {
  twoFactorEnabled: boolean;
  method: "app" | "email";
  hasAppConfigured: boolean;
  hasEmailConfigured: boolean;
  verifiedAt: string | null;
  email: string;
  maskedEmail: string;
  remainingRecoveryCodes: number;
}

export function TwoFactorSettingsSection() {
  const [status, setStatus] = useState<TwoFactorStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSetupMethod, setActiveSetupMethod] = useState<"app" | "email" | null>(null);

  // App Setup States
  const [appSecret, setAppSecret] = useState<string>("");
  const [appFormattedSecret, setAppFormattedSecret] = useState<string>("");
  const [appQrCode, setAppQrCode] = useState<string>("");
  const [appCodeInput, setAppCodeInput] = useState("");
  const [isCopiedSecret, setIsCopiedSecret] = useState(false);

  // Email Setup States
  const [emailCodeInput, setEmailCodeInput] = useState("");
  const [emailSentNotice, setEmailSentNotice] = useState<string | null>(null);

  // Recovery Codes Modal
  const [generatedRecoveryCodes, setGeneratedRecoveryCodes] = useState<string[] | null>(null);
  const [isCopiedCodes, setIsCopiedCodes] = useState(false);

  // Disabling 2FA State
  const [isDisableModalOpen, setIsDisableModalOpen] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch live 2FA status
  const fetchStatus = async () => {
    try {
      const res = await fetch(apiUrl("/api/admin/2fa/status"));
      const data = await res.json();
      if (res.ok && data.success) {
        setStatus(data);
      }
    } catch (err) {
      console.error("[2FA fetchStatus error]:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  // Initiate Setup (App or Email)
  const handleStartSetup = async (method: "app" | "email") => {
    setErrorMsg(null);
    setIsSubmitting(true);
    setActiveSetupMethod(method);

    try {
      const res = await fetch(apiUrl("/api/admin/2fa/setup"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start 2FA configuration.");

      if (method === "app") {
        setAppSecret(data.secret);
        setAppFormattedSecret(data.formattedSecret || data.secret);
        setAppQrCode(data.qrCodeDataUrl);
        setAppCodeInput("");
      } else {
        setEmailSentNotice(data.message || `Verification code sent to your email`);
        setEmailCodeInput("");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Could not initialize 2FA setup.");
      setActiveSetupMethod(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm Setup with Code
  const handleConfirmSetup = async (method: "app" | "email") => {
    setErrorMsg(null);
    const code = method === "app" ? appCodeInput.trim() : emailCodeInput.trim();
    if (!code || code.length !== 6) {
      setErrorMsg("Please enter the complete 6-digit verification code.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(apiUrl("/api/admin/2fa/confirm-setup"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method, code }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Incorrect verification code.");

      // Success: Show Recovery Codes if provided
      if (Array.isArray(data.recoveryCodes) && data.recoveryCodes.length > 0) {
        setGeneratedRecoveryCodes(data.recoveryCodes);
      }

      setActiveSetupMethod(null);
      setAppCodeInput("");
      setEmailCodeInput("");
      await fetchStatus();
      showAlert({
        title: "2FA Security Active",
        message: `Two-Factor Authentication via ${method === "app" ? "Authenticator App" : "Email OTP"} has been successfully enabled!`,
        type: "success",
      });
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to confirm verification code.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Disable 2FA
  const handleDisable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disablePassword.trim()) {
      setErrorMsg("Please enter your password to confirm.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch(apiUrl("/api/admin/2fa/disable"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: disablePassword.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to disable 2FA.");

      setIsDisableModalOpen(false);
      setDisablePassword("");
      await fetchStatus();
      showAlert({
        title: "2FA Disabled",
        message: "Two-Factor Authentication has been disabled for your account.",
        type: "info",
      });
    } catch (err: any) {
      setErrorMsg(err.message || "Incorrect password or authorization error.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Copy Recovery Codes to Clipboard
  const handleCopyCodes = () => {
    if (!generatedRecoveryCodes) return;
    navigator.clipboard.writeText(generatedRecoveryCodes.join("\n"));
    setIsCopiedCodes(true);
    setTimeout(() => setIsCopiedCodes(false), 2500);
  };

  // Download Recovery Codes as Text File
  const handleDownloadCodes = () => {
    if (!generatedRecoveryCodes) return;
    const text = `SAN FURNITURE UK - 2FA BACKUP RECOVERY CODES\nGenerated: ${new Date().toISOString()}\nAccount: ${
      status?.email || "Admin User"
    }\n\nEach code can only be used once if you lose access to your authenticator app or email:\n\n${generatedRecoveryCodes
      .map((c, i) => `[${i + 1}] ${c}`)
      .join("\n")}\n\nStore this file in a secure, encrypted location.`;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `san-furniture-2fa-recovery-codes-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="p-6 bg-sand-50 border border-sand-300 rounded-2xl animate-pulse space-y-3">
        <div className="h-5 bg-sand-200 rounded w-1/4"></div>
        <div className="h-20 bg-sand-200 rounded"></div>
      </div>
    );
  }

  const isEnabled = Boolean(status?.twoFactorEnabled);
  const activeMethod = status?.method || "app";

  return (
    <div className="p-6 bg-sand-50 border border-sand-300 rounded-2xl shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-sand-300/80 pb-4">
        <div>
          <h2 className="text-base font-bold text-navy-950 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-brass-600" />
            <span>Two-Factor Authentication (2FA) Security</span>
          </h2>
          <p className="text-xs text-navy-600 mt-1">
            Enforce secondary identity verification upon admin sign-in via Authenticator App (TOTP) or Corporate Email OTP.
          </p>
        </div>

        {/* Live Status Badge */}
        <div>
          {isEnabled ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>2FA Enabled ({activeMethod === "app" ? "Authenticator App" : "Email OTP"})</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>2FA Not Active (Vulnerable)</span>
            </span>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-300 text-red-800 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 2FA Method Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Method 1: Authenticator App */}
        <div
          className={`p-5 rounded-xl border transition-all ${
            isEnabled && activeMethod === "app"
              ? "bg-navy-950 text-sand-50 border-navy-900 shadow-md"
              : "bg-white text-navy-950 border-sand-300 hover:border-sand-400"
          }`}
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  isEnabled && activeMethod === "app"
                    ? "bg-brass-500/20 text-brass-400 border border-brass-500/40"
                    : "bg-sand-100 text-navy-800 border border-sand-200"
                }`}
              >
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold">Authenticator App (Recommended)</h3>
                <span
                  className={`text-[10px] uppercase tracking-wider font-semibold ${
                    isEnabled && activeMethod === "app" ? "text-brass-400" : "text-navy-600"
                  }`}
                >
                  Google Authenticator &bull; Microsoft &bull; 1Password
                </span>
              </div>
            </div>

            {isEnabled && activeMethod === "app" && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-brass-500/20 text-brass-300 border border-brass-500/40">
                ACTIVE
              </span>
            )}
          </div>

          <p
            className={`text-xs leading-relaxed mb-4 ${
              isEnabled && activeMethod === "app" ? "text-sand-300" : "text-navy-600"
            }`}
          >
            Generates time-based 6-digit codes (TOTP) directly on your smartphone. Works 100% offline without cellular network dependence.
          </p>

          <div className="pt-2">
            {isEnabled && activeMethod === "app" ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleStartSetup("app")}
                  className="px-3.5 py-1.5 rounded-lg bg-navy-800 hover:bg-navy-700 text-sand-100 text-xs font-medium border border-navy-700 transition-colors"
                >
                  Reconfigure App / New Phone
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => handleStartSetup("app")}
                disabled={isSubmitting}
                className="w-full py-2 px-3.5 rounded-xl bg-navy-950 hover:bg-navy-900 text-sand-50 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
              >
                <span>Set Up Authenticator App</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Method 2: Email OTP */}
        <div
          className={`p-5 rounded-xl border transition-all ${
            isEnabled && activeMethod === "email"
              ? "bg-navy-950 text-sand-50 border-navy-900 shadow-md"
              : "bg-white text-navy-950 border-sand-300 hover:border-sand-400"
          }`}
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  isEnabled && activeMethod === "email"
                    ? "bg-brass-500/20 text-brass-400 border border-brass-500/40"
                    : "bg-sand-100 text-navy-800 border border-sand-200"
                }`}
              >
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold">Email One-Time Password (OTP)</h3>
                <span
                  className={`text-[10px] uppercase tracking-wider font-semibold ${
                    isEnabled && activeMethod === "email" ? "text-brass-400" : "text-navy-600"
                  }`}
                >
                  Corporate Email Verification
                </span>
              </div>
            </div>

            {isEnabled && activeMethod === "email" && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-brass-500/20 text-brass-300 border border-brass-500/40">
                ACTIVE
              </span>
            )}
          </div>

          <p
            className={`text-xs leading-relaxed mb-4 ${
              isEnabled && activeMethod === "email" ? "text-sand-300" : "text-navy-600"
            }`}
          >
            Dispatches a single-use 6-digit passcode to your registered corporate email (<code>{status?.maskedEmail}</code>) on every sign-in attempt.
          </p>

          <div className="pt-2">
            {isEnabled && activeMethod === "email" ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Email OTP active on {status?.maskedEmail}</span>
                </span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => handleStartSetup("email")}
                disabled={isSubmitting}
                className="w-full py-2 px-3.5 rounded-xl bg-navy-950 hover:bg-navy-900 text-sand-50 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
              >
                <span>Set Up Email Verification</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ACTIVE SETUP CARD: AUTHENTICATOR APP                                      */}
      {/* ========================================================================= */}
      {activeSetupMethod === "app" && (
        <div className="p-6 bg-navy-950 text-sand-50 border border-navy-800 rounded-2xl space-y-5 animate-in fade-in duration-200 shadow-xl">
          <div className="flex items-center justify-between border-b border-navy-800 pb-3">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-brass-400" />
              <h3 className="text-sm font-bold text-sand-50">Set Up Authenticator App</h3>
            </div>
            <button
              type="button"
              onClick={() => setActiveSetupMethod(null)}
              className="text-xs text-sand-400 hover:text-sand-200 transition-colors"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Step 1: Scan QR */}
            <div className="flex flex-col items-center p-4 bg-white rounded-xl border border-sand-300">
              {appQrCode ? (
                <img
                  src={appQrCode}
                  alt="Scan 2FA QR Code"
                  width={200}
                  height={200}
                  className="w-48 h-48 object-contain"
                />
              ) : (
                <div className="w-48 h-48 bg-sand-100 flex items-center justify-center text-xs text-navy-400">
                  Generating QR...
                </div>
              )}
              <span className="text-[11px] font-semibold text-navy-950 mt-2">
                Scan with Google Authenticator or Camera
              </span>
            </div>

            {/* Step 2: Secret & Verification */}
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-sand-300 mb-1">
                  Or Enter Secret Key Manually
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={appFormattedSecret}
                    className="flex-1 px-3 py-2 bg-navy-900 border border-navy-700 rounded-lg text-xs font-mono text-sand-100 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(appSecret);
                      setIsCopiedSecret(true);
                      setTimeout(() => setIsCopiedSecret(false), 2000);
                    }}
                    className="px-3 py-2 bg-navy-800 hover:bg-navy-700 rounded-lg border border-navy-700 text-xs font-medium text-sand-200 flex items-center gap-1 transition-colors"
                  >
                    {isCopiedSecret ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-sand-200 mb-1">
                  Enter 6-Digit Code from App to Confirm
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    value={appCodeInput}
                    onChange={(e) => setAppCodeInput(e.target.value.replace(/\D/g, ""))}
                    className="w-40 px-3 py-2.5 bg-navy-900 border border-navy-700 rounded-xl text-sand-50 font-mono text-lg font-bold text-center tracking-widest focus:outline-none focus:border-brass-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleConfirmSetup("app")}
                    disabled={isSubmitting || appCodeInput.length !== 6}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-brass-500 to-brass-600 hover:from-brass-400 hover:to-brass-500 text-navy-950 font-bold text-xs tracking-wide shadow-md transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? "Verifying..." : "Confirm & Enable App 2FA"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ACTIVE SETUP CARD: EMAIL OTP                                              */}
      {/* ========================================================================= */}
      {activeSetupMethod === "email" && (
        <div className="p-6 bg-navy-950 text-sand-50 border border-navy-800 rounded-2xl space-y-4 animate-in fade-in duration-200 shadow-xl">
          <div className="flex items-center justify-between border-b border-navy-800 pb-3">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-brass-400" />
              <h3 className="text-sm font-bold text-sand-50">Set Up Email Verification</h3>
            </div>
            <button
              type="button"
              onClick={() => setActiveSetupMethod(null)}
              className="text-xs text-sand-400 hover:text-sand-200 transition-colors"
            >
              Cancel
            </button>
          </div>

          {emailSentNotice && (
            <div className="p-3 bg-navy-900/80 border border-brass-500/30 rounded-xl text-xs text-sand-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-brass-400 flex-shrink-0" />
              <span>{emailSentNotice}</span>
            </div>
          )}

          <div className="space-y-3 max-w-md">
            <label className="block text-xs font-semibold text-sand-200">
              Enter the 6-Digit Code Received in Your Email
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                maxLength={6}
                placeholder="123456"
                value={emailCodeInput}
                onChange={(e) => setEmailCodeInput(e.target.value.replace(/\D/g, ""))}
                className="w-40 px-3 py-2.5 bg-navy-900 border border-navy-700 rounded-xl text-sand-50 font-mono text-lg font-bold text-center tracking-widest focus:outline-none focus:border-brass-500"
              />
              <button
                type="button"
                onClick={() => handleConfirmSetup("email")}
                disabled={isSubmitting || emailCodeInput.length !== 6}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-brass-500 to-brass-600 hover:from-brass-400 hover:to-brass-500 text-navy-950 font-bold text-xs tracking-wide shadow-md transition-all disabled:opacity-50"
              >
                {isSubmitting ? "Verifying..." : "Confirm & Enable Email 2FA"}
              </button>
            </div>
            <button
              type="button"
              onClick={() => handleStartSetup("email")}
              disabled={isSubmitting}
              className="text-xs text-brass-400 hover:text-brass-300 font-medium transition-colors flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Resend test code to {status?.maskedEmail}</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* RECOVERY CODES SUCCESS MODAL                                              */}
      {/* ========================================================================= */}
      {generatedRecoveryCodes && (
        <div className="p-6 bg-sand-100 border-2 border-emerald-500 rounded-2xl space-y-4 shadow-lg animate-in zoom-in-95 duration-200">
          <div className="flex items-center gap-2.5 text-emerald-900">
            <ShieldCheck className="w-6 h-6 text-emerald-600" />
            <div>
              <h3 className="text-sm font-bold">Important: Save Your Backup Recovery Codes</h3>
              <p className="text-xs text-emerald-800">
                If you ever lose access to your phone or email, you can use these single-use codes to log in. Each code can only be used once.
              </p>
            </div>
          </div>

          {/* Codes Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-4 bg-white rounded-xl border border-sand-300 font-mono text-xs font-bold text-navy-950 text-center tracking-widest">
            {generatedRecoveryCodes.map((c, i) => (
              <div key={i} className="p-2 bg-sand-50 rounded border border-sand-200">
                {c}
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleCopyCodes}
              className="px-4 py-2 bg-navy-950 hover:bg-navy-900 text-sand-50 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
            >
              {isCopiedCodes ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied All Codes</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Codes</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownloadCodes}
              className="px-4 py-2 bg-sand-200 hover:bg-sand-300 text-navy-950 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors border border-sand-300"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download as .txt</span>
            </button>

            <button
              type="button"
              onClick={() => setGeneratedRecoveryCodes(null)}
              className="ml-auto text-xs text-navy-600 hover:text-navy-950 font-medium underline"
            >
              I have saved my codes &rarr; Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Disable 2FA Action */}
      {isEnabled && (
        <div className="pt-4 border-t border-sand-300/80 flex items-center justify-between">
          <div className="text-xs text-navy-600">
            <span>Active since: {status?.verifiedAt ? new Date(status.verifiedAt).toLocaleDateString("en-GB") : "Recently"}</span>
            <span className="mx-2">&bull;</span>
            <span>{status?.remainingRecoveryCodes || 0} recovery codes remaining</span>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsDisableModalOpen(true);
              setErrorMsg(null);
              setDisablePassword("");
            }}
            className="px-3.5 py-1.5 rounded-xl border border-red-200 hover:bg-red-50 text-red-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <ShieldOff className="w-3.5 h-3.5 text-red-600" />
            <span>Disable 2FA</span>
          </button>
        </div>
      )}

      {/* Disable Modal */}
      {isDisableModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-sand-300 space-y-4">
            <div className="flex items-center gap-2.5 text-red-700">
              <ShieldAlert className="w-5 h-5 text-red-600" />
              <h3 className="text-sm font-bold">Disable Two-Factor Authentication?</h3>
            </div>
            <p className="text-xs text-navy-600 leading-relaxed">
              Disabling 2FA will reduce your account security level to password-only verification. Please enter your staff password to authorize this action:
            </p>

            <form onSubmit={handleDisable2FA} className="space-y-4">
              <div>
                <input
                  type="password"
                  required
                  autoFocus
                  placeholder="Enter staff password"
                  value={disablePassword}
                  onChange={(e) => setDisablePassword(e.target.value)}
                  className="w-full px-3 py-2 bg-sand-50 border border-sand-300 rounded-xl text-xs text-navy-950 focus:outline-none focus:border-navy-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDisableModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-navy-700 hover:bg-sand-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !disablePassword.trim()}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "Verifying..." : "Confirm & Disable 2FA"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
