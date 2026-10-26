"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, ArrowRight, ShieldCheck, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import { apiUrl } from "@/lib/api-config";

export default function CustomerForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setError("Please provide a valid email address.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(apiUrl("/api/customer/auth/forgot-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Failed to process password reset request.");
      }

      setSubmittedEmail(email.trim().toLowerCase());
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] bg-sand-50 flex items-center justify-center p-4 sm:p-6 antialiased">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <span className="text-[11px] font-bold uppercase tracking-widest text-brass-600">
            SAN Client Security
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-navy-950 mt-1">
            Forgot Password
          </h1>
          <p className="text-xs text-navy-600 mt-2">
            Enter your account email to receive a secure, 60-minute password reset link.
          </p>
        </div>

        {/* Card */}
        <div className="bg-sand-100/60 border border-sand-300 rounded-2xl p-6 sm:p-8 shadow-sm">
          {submittedEmail ? (
            <div className="space-y-5 text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="w-6 h-6" />
              </div>

              <div>
                <h2 className="text-base font-bold text-navy-950 font-display">
                  Reset Instructions Sent
                </h2>
                <p className="text-xs text-navy-600 mt-1.5 leading-relaxed">
                  If an account exists for <strong className="text-navy-900">{submittedEmail}</strong>, we have dispatched a password recovery link.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-sand-50 border border-sand-300 text-[11px] text-navy-700 text-left space-y-1.5">
                <p className="font-semibold text-navy-900">&bull; Valid for 60 minutes from request.</p>
                <p>&bull; Check your spam or promotions folder if not visible within 2 minutes.</p>
                <p>&bull; Every session is encrypted under UK data privacy standards.</p>
              </div>

              <div className="pt-2 flex flex-col gap-2.5">
                <Link
                  href="/account/login"
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-navy-950 hover:bg-navy-900 text-sand-50 font-bold text-xs tracking-wide shadow-md transition-all"
                >
                  <ArrowLeft className="w-4 h-4 text-brass-400" />
                  <span>Return to Sign In</span>
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setSubmittedEmail(null);
                    setError(null);
                  }}
                  className="text-xs font-semibold text-brass-700 hover:text-brass-800 underline py-1"
                >
                  Resend or use a different email
                </button>
              </div>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-100 border border-red-300 text-red-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-navy-900 mb-1.5">
                    Account Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-navy-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your.email@example.co.uk"
                      className="w-full pl-10 pr-4 py-2.5 bg-sand-50 border border-sand-300 rounded-xl text-navy-950 text-xs focus:outline-none focus:border-brass-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-navy-950 hover:bg-navy-900 text-sand-50 font-bold text-xs tracking-wide shadow-md transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <span>Dispatching Instructions...</span>
                  ) : (
                    <>
                      <span>Send Reset Link</span>
                      <ArrowRight className="w-4 h-4 text-brass-400" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 pt-5 border-t border-sand-300 flex items-center justify-between text-xs">
                <Link
                  href="/account/login"
                  className="inline-flex items-center gap-1 font-semibold text-navy-700 hover:text-navy-950"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </Link>
                <Link
                  href="/account/register"
                  className="font-bold text-brass-700 hover:text-brass-800 underline"
                >
                  Create account &rarr;
                </Link>
              </div>
            </>
          )}
        </div>

        <div className="mt-6 text-center">
          <span className="inline-flex items-center gap-1.5 text-xs text-navy-600">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            256-Bit SSL UK Encrypted Session
          </span>
        </div>
      </div>
    </div>
  );
}
