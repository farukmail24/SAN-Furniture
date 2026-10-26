"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, ArrowRight, ShieldCheck, AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { apiUrl } from "@/lib/api-config";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get("token") || "";
  const emailParam = searchParams.get("email") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      setError("Reset token is missing. Please use the link provided in your email.");
      return;
    }

    if (password.length < 8) {
      setError("Your new password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please verify both fields.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(apiUrl("/api/customer/auth/reset-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          email: emailParam,
          password,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Failed to reset password.");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/account/login");
      }, 2500);
    } catch (err: any) {
      setError(err.message || "An error occurred while resetting your password.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="space-y-5 text-center">
        <div className="w-12 h-12 mx-auto rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-600">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-base font-bold text-navy-950 font-display">
            Invalid Reset Link
          </h2>
          <p className="text-xs text-navy-600 mt-1.5 leading-relaxed">
            This password reset link is invalid or incomplete. Please request a fresh reset link below.
          </p>
        </div>
        <div className="pt-2">
          <Link
            href="/account/forgot-password"
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-navy-950 hover:bg-navy-900 text-sand-50 font-bold text-xs tracking-wide shadow-md transition-all"
          >
            <span>Request New Reset Link</span>
            <ArrowRight className="w-4 h-4 text-brass-400" />
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="space-y-5 text-center">
        <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-600">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-base font-bold text-navy-950 font-display">
            Password Successfully Updated
          </h2>
          <p className="text-xs text-navy-600 mt-1.5 leading-relaxed">
            Your credentials have been securely updated. Redirecting you to the sign-in portal...
          </p>
        </div>
        <div className="pt-2">
          <Link
            href="/account/login"
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-navy-950 hover:bg-navy-900 text-sand-50 font-bold text-xs tracking-wide shadow-md transition-all"
          >
            <span>Sign In Now</span>
            <ArrowRight className="w-4 h-4 text-brass-400" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-100 border border-red-300 text-red-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {emailParam && (
        <div className="mb-4 p-2.5 rounded-lg bg-sand-200/50 border border-sand-300 text-[11px] text-navy-700">
          Resetting password for: <strong className="text-navy-950">{emailParam}</strong>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-navy-900 mb-1.5">
            New Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-navy-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type={showPassword ? "text" : "password"}
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              className="w-full pl-10 pr-10 py-2.5 bg-sand-50 border border-sand-300 rounded-xl text-navy-950 text-xs focus:outline-none focus:border-brass-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400 hover:text-navy-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-navy-900 mb-1.5">
            Confirm New Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-navy-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type={showPassword ? "text" : "password"}
              required
              minLength={8}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your new password"
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
            <span>Updating Password...</span>
          ) : (
            <>
              <span>Save &amp; Update Password</span>
              <ArrowRight className="w-4 h-4 text-brass-400" />
            </>
          )}
        </button>
      </form>
    </>
  );
}

export default function CustomerResetPasswordPage() {
  return (
    <div className="min-h-[85vh] bg-sand-50 flex items-center justify-center p-4 sm:p-6 antialiased">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-[11px] font-bold uppercase tracking-widest text-brass-600">
            SAN Client Security
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-navy-950 mt-1">
            Set New Password
          </h1>
          <p className="text-xs text-navy-600 mt-2">
            Create a secure password for your SAN Furniture client account.
          </p>
        </div>

        <div className="bg-sand-100/60 border border-sand-300 rounded-2xl p-6 sm:p-8 shadow-sm">
          <Suspense
            fallback={
              <div className="py-8 text-center text-xs text-navy-600">
                Loading password recovery security token...
              </div>
            }
          >
            <ResetPasswordForm />
          </Suspense>
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
