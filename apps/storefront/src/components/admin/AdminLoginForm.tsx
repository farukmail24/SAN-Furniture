"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Lock, Mail, ArrowRight, AlertCircle, Eye, EyeOff } from "lucide-react";
import { apiUrl } from "@/lib/api-config";

export default function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
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

      // Store authenticated admin session
      localStorage.setItem("san_admin_token", data.token);
      localStorage.setItem("san_admin_user", JSON.stringify(data.user));
      document.cookie = `san_admin_token=${data.token}; path=/; max-age=86400; SameSite=Strict`;

      // Redirect to dedicated operations suite
      router.push("/admin");
    } catch (err: any) {
      setError(err.message || "Unable to connect to authentication server.");
    } finally {
      setLoading(false);
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

        {/* Login Card */}
        <div className="bg-[#00072D] border border-navy-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-950/60 border border-red-800 text-red-200 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

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

          {/* Security Assurance Footer */}
          <div className="mt-6 pt-5 border-t border-navy-800/80 flex items-center justify-between text-[11px] text-sand-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              IP Lockout Active (5 strikes)
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
