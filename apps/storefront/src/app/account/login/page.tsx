"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";
import { apiUrl } from "@/lib/api-config";

export default function CustomerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    const token = localStorage.getItem("san_customer_token");
    const user = localStorage.getItem("san_customer_user");
    if (token && user) {
      router.replace("/account");
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(apiUrl("/api/customer/auth/login"), {
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
        throw new Error(data.error || "Authentication failed");
      }

      localStorage.setItem("san_customer_token", data.token);
      localStorage.setItem("san_customer_user", JSON.stringify(data.customer));
      document.cookie = `san_customer_token=${data.token}; path=/; max-age=604800; SameSite=Lax`;
      window.dispatchEvent(new Event("storage"));

      router.push("/account");
    } catch (err: any) {
      if (err?.message?.includes("fetch") || err?.name === "TypeError") {
        setError("Unable to connect to authentication server. Please check your network and try again.");
      } else {
        setError(err.message || "Login error occurred");
      }
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
            SAN Client Portal
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-navy-950 mt-1">
            Sign In to Your Account
          </h1>
          <p className="text-xs text-navy-600 mt-2">
            Track your white glove delivery, view VAT invoices, and manage saved UK addresses.
          </p>
        </div>

        {/* Card */}
        <div className="bg-sand-100/60 border border-sand-300 rounded-2xl p-6 sm:p-8 shadow-sm">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-100 border border-red-300 text-red-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-navy-900 mb-1.5">
                Email Address or Mobile Number
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-navy-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.co.uk or +44 7123 456789"
                  className="w-full pl-10 pr-4 py-2.5 bg-sand-50 border border-sand-300 rounded-xl text-navy-950 text-xs focus:outline-none focus:border-brass-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-navy-900">
                  Password
                </label>
                <Link
                  href="/account/forgot-password"
                  className="text-[11px] font-semibold text-brass-700 hover:text-brass-800 hover:underline transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-navy-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
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
                <span>Signing In...</span>
              ) : (
                <>
                  <span>Sign In &amp; Access Orders</span>
                  <ArrowRight className="w-4 h-4 text-brass-400" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-sand-300 flex items-center justify-between text-xs">
            <span className="text-navy-600">New to SAN Furniture?</span>
            <Link href="/account/register" className="font-bold text-navy-950 hover:text-brass-600 underline">
              Create an account &rarr;
            </Link>
          </div>
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
