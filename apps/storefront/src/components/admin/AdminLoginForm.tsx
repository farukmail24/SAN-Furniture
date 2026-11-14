"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  Smartphone,
  KeyRound,
  RotateCcw,
  CheckCircle2,
  ChevronLeft,
} from "lucide-react";
import { apiUrl } from "@/lib/api-config";

interface TwoFactorChallenge {
  ticket: string;
  method: "app" | "email";
  maskedEmail: string;
  canSwitchMethod: boolean;
  message: string;
}

export default function AdminLoginForm() {
  const router = useRouter();

  // Step 1: Credentials State
  const [step, setStep] = useState<"credentials" | "2fa">("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Step 2: 2FA State
  const [challenge, setChallenge] = useState<TwoFactorChallenge | null>(null);
  const [activeMethod, setActiveMethod] = useState<"app" | "email">("app");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);

  // Resend Countdown Timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Step 1: Submit Credentials
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResendStatus(null);
    setLoading(true);

    try {
      const res = await fetch(apiUrl("/api/admin/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      let data: any = {};
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        try {
          data = await res.json();
        } catch {
          data = {};
        }
      } else {
        const text = await res.text().catch(() => "");
        data = { error: text || `Authentication server responded with status ${res.status}` };
      }

      if (!res.ok) {
        throw new Error(data.error || "Authentication failed. Please verify your credentials.");
      }

      // Check if 2FA is required
      if (data.require2FA) {
        setChallenge({
          ticket: data.twoFactorTicket,
          method: data.method || "app",
          maskedEmail: data.maskedEmail || email,
          canSwitchMethod: Boolean(data.canSwitchMethod),
          message: data.message || "Please complete two-factor authentication.",
        });
        setActiveMethod(data.method || "app");
        setTwoFactorCode("");
        setIsRecoveryMode(false);
        setStep("2fa");
        if (data.method === "email") {
          setResendCooldown(60);
        }
        return;
      }

      // 2FA not enabled: Standard session establishment
      localStorage.setItem("san_admin_token", data.token);
      localStorage.setItem("san_admin_user", JSON.stringify(data.user));
      document.cookie = `san_admin_token=${data.token}; path=/; max-age=86400; SameSite=Strict`;

      router.push("/admin");
    } catch (err: any) {
      setError(err.message || "Unable to connect to authentication server.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify 2FA Code
  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!challenge) return;
    setError(null);
    setResendStatus(null);
    setLoading(true);

    try {
      const methodToSend = isRecoveryMode ? "recovery" : activeMethod;
      const res = await fetch(apiUrl("/api/admin/auth/verify-2fa"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticket: challenge.ticket,
          code: twoFactorCode.trim(),
          method: methodToSend,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Two-factor verification failed.");
      }

      // Success: Store authenticated admin session
      localStorage.setItem("san_admin_token", data.token);
      localStorage.setItem("san_admin_user", JSON.stringify(data.user));
      document.cookie = `san_admin_token=${data.token}; path=/; max-age=86400; SameSite=Strict`;

      router.push("/admin");
    } catch (err: any) {
      setError(err.message || "Verification code validation failed.");
    } finally {
      setLoading(false);
    }
  };

  // Resend Email Code
  const handleResendEmailOtp = async () => {
    if (!challenge || resendCooldown > 0 || isResending) return;
    setError(null);
    setIsResending(true);
    setResendStatus(null);

    try {
      const res = await fetch(apiUrl("/api/admin/auth/resend-2fa"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticket: challenge.ticket }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to resend verification code.");

      setResendStatus(data.message || `A fresh code has been sent to ${challenge.maskedEmail}`);
      setResendCooldown(60);
    } catch (err: any) {
      setError(err.message || "Could not resend email code.");
    } finally {
      setIsResending(false);
    }
  };

  // Switch between App & Email
  const handleSwitchMethod = async (target: "app" | "email") => {
    if (!challenge || loading) return;
    setError(null);
    setResendStatus(null);
    setTwoFactorCode("");

    if (target === "email") {
      setLoading(true);
      try {
        const res = await fetch(apiUrl("/api/admin/auth/switch-2fa"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ticket: challenge.ticket, targetMethod: "email" }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Failed to switch to email.");

        setActiveMethod("email");
        setIsRecoveryMode(false);
        setResendCooldown(60);
        setResendStatus(data.message || `Code dispatched to ${challenge.maskedEmail}`);
      } catch (err: any) {
        setError(err.message || "Could not switch verification method.");
      } finally {
        setLoading(false);
      }
    } else {
      setActiveMethod("app");
      setIsRecoveryMode(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#00072D] text-sand-50 flex items-center justify-center p-4 sm:p-6 antialiased relative overflow-hidden">
      {/* Background Subtle Gradient Accents */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-brass-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-navy-800/40 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Crest Header */}
        <div className="text-center mb-8">
          <img
            src="/San-Furniture-Logo-Dark.png"
            alt="SAN Furniture UK"
            width={180}
            height={48}
            className="h-12 sm:h-14 w-auto mx-auto object-contain mb-4"
          />
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-sand-50">
            Operations Gateway
          </h1>
          <p className="text-xs text-sand-400 mt-1.5 font-medium">
            SAN Furniture UK Ltd &bull; Dedicated Staff Control Panel
          </p>
        </div>

        {/* Login / 2FA Card */}
        <div className="bg-[#00072D] border border-navy-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl transition-all">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-950/60 border border-red-800 text-red-200 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {resendStatus && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-200 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>{resendStatus}</span>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 1: CORPORATE CREDENTIALS                                             */}
          {/* ========================================================================= */}
          {step === "credentials" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-sand-300 mb-1.5">
                  Staff Corporate Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-sand-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="staff@sanfurniture.co.uk"
                    className="w-full pl-10 pr-4 py-2.5 bg-navy-950 border border-navy-700 rounded-xl text-sand-50 text-xs focus:outline-none focus:border-brass-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-sand-300 mb-1.5">
                  Staff Master Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-sand-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-navy-950 border border-navy-700 rounded-xl text-sand-50 text-xs focus:outline-none focus:border-brass-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sand-400 hover:text-sand-100 transition-colors p-1"
                    title={showPassword ? "Hide password" : "Show password"}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-sand-400 select-none">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-3.5 h-3.5 rounded border-navy-700 bg-navy-950 text-brass-500 focus:ring-0"
                  />
                  <span>Remember this terminal</span>
                </label>
                <span className="text-[11px] text-brass-400">Argon2id Encrypted</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-brass-500 to-brass-600 hover:from-brass-400 hover:to-brass-500 text-navy-950 font-bold text-xs tracking-wide shadow-lg shadow-brass-500/20 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <span>Authenticating Terminal...</span>
                ) : (
                  <>
                    <span>Enter Operations Suite</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: TWO-FACTOR AUTHENTICATION (2FA CHALLENGE)                          */}
          {/* ========================================================================= */}
          {step === "2fa" && challenge && (
            <form onSubmit={handleVerify2FA} className="space-y-4 animate-in fade-in duration-200">
              {/* Challenge Mode Header Banner */}
              <div className="p-3 bg-navy-950 border border-navy-800 rounded-xl flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-brass-500/10 border border-brass-500/30 flex items-center justify-center flex-shrink-0 text-brass-400">
                  {isRecoveryMode ? (
                    <KeyRound className="w-5 h-5 text-brass-400" />
                  ) : activeMethod === "app" ? (
                    <Smartphone className="w-5 h-5 text-brass-400" />
                  ) : (
                    <Mail className="w-5 h-5 text-brass-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-brass-400">
                    {isRecoveryMode
                      ? "Emergency Recovery Code"
                      : activeMethod === "app"
                      ? "2FA App Verification"
                      : "Email OTP Verification"}
                  </span>
                  <p className="text-xs text-sand-300 truncate">
                    {isRecoveryMode
                      ? "Enter one of your 8-digit backup codes"
                      : activeMethod === "app"
                      ? "Open your Google Authenticator or 2FA App"
                      : `Sent to ${challenge.maskedEmail}`}
                  </p>
                </div>
              </div>

              {/* Code Input */}
              <div>
                <label className="block text-xs font-semibold text-sand-300 mb-1.5">
                  {isRecoveryMode ? "Enter Backup Recovery Code" : "6-Digit Security Code"}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    autoFocus
                    autoComplete="one-time-code"
                    value={twoFactorCode}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      if (isRecoveryMode) {
                        setTwoFactorCode(val);
                      } else {
                        setTwoFactorCode(val.replace(/\D/g, "").slice(0, 6));
                      }
                    }}
                    placeholder={isRecoveryMode ? "XXXX-XXXX" : "123456"}
                    className={`w-full px-4 py-3 bg-navy-950 border border-navy-700 rounded-xl text-sand-50 font-mono text-center tracking-[0.4em] focus:outline-none focus:border-brass-500 transition-colors ${
                      isRecoveryMode ? "text-base tracking-widest" : "text-2xl font-bold"
                    }`}
                  />
                </div>
              </div>

              {/* Action Buttons & Alternate Options */}
              <div className="space-y-2.5 pt-1">
                <button
                  type="submit"
                  disabled={loading || (isRecoveryMode ? twoFactorCode.length < 8 : twoFactorCode.length !== 6)}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-brass-500 to-brass-600 hover:from-brass-400 hover:to-brass-500 text-navy-950 font-bold text-xs tracking-wide shadow-lg shadow-brass-500/20 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <span>Verifying Code...</span>
                  ) : (
                    <>
                      <span>Confirm & Enter Admin</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Resend option for Email */}
                {activeMethod === "email" && !isRecoveryMode && (
                  <div className="flex items-center justify-between text-xs text-sand-400 pt-1">
                    <span>Didn&apos;t receive email code?</span>
                    <button
                      type="button"
                      onClick={handleResendEmailOtp}
                      disabled={resendCooldown > 0 || isResending}
                      className="font-medium text-brass-400 hover:text-brass-300 disabled:opacity-50 transition-colors flex items-center gap-1"
                    >
                      <RotateCcw className={`w-3 h-3 ${isResending ? "animate-spin" : ""}`} />
                      <span>{resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}</span>
                    </button>
                  </div>
                )}

                {/* Switch between App and Email options */}
                <div className="pt-2 border-t border-navy-800/80 flex flex-col gap-1.5 text-xs text-sand-400">
                  {!isRecoveryMode && activeMethod === "app" && (
                    <button
                      type="button"
                      onClick={() => handleSwitchMethod("email")}
                      className="text-left text-brass-400 hover:text-brass-300 font-medium transition-colors"
                    >
                      &rarr; Prefer email? Send code to {challenge.maskedEmail}
                    </button>
                  )}

                  {!isRecoveryMode && activeMethod === "email" && (
                    <button
                      type="button"
                      onClick={() => handleSwitchMethod("app")}
                      className="text-left text-brass-400 hover:text-brass-300 font-medium transition-colors"
                    >
                      &rarr; Use Google / Microsoft Authenticator app instead
                    </button>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsRecoveryMode(!isRecoveryMode);
                        setTwoFactorCode("");
                        setError(null);
                      }}
                      className="text-[11px] text-sand-400 hover:text-sand-200 underline transition-colors"
                    >
                      {isRecoveryMode ? "Use 6-digit verification code" : "Lost access? Use recovery code"}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setStep("credentials");
                        setError(null);
                        setResendStatus(null);
                      }}
                      className="text-[11px] text-sand-400 hover:text-sand-200 transition-colors flex items-center gap-1"
                    >
                      <ChevronLeft className="w-3 h-3" />
                      <span>Back to login</span>
                    </button>
                  </div>
                </div>
              </div>
            </form>
          )}

          {/* Security Assurance Footer */}
          <div className="mt-6 pt-5 border-t border-navy-800/80 flex items-center justify-between text-[11px] text-sand-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>UK Cyber Security Standard &bull; 2FA Armed</span>
            </span>
            <Link href="/" className="hover:text-sand-200 transition-colors">
              Return to Storefront &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
