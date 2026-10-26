"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, User, Phone, MapPin, ArrowRight, AlertCircle, ShieldCheck } from "lucide-react";
import { apiUrl } from "@/lib/api-config";

export default function CustomerRegisterPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [postcode, setPostcode] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [city, setCity] = useState("London");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim()) {
      setError("Please fill in all mandatory fields.");
      return;
    }

    if (!phone.trim()) {
      setError("Mobile phone number is required for account creation and delivery coordination.");
      return;
    }

    const cleanPhone = phone.replace(/[\s\-\(\)]/g, "");
    if (cleanPhone.length < 10) {
      setError("Please enter a valid UK mobile or phone number (minimum 10 digits).");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(apiUrl("/api/customer/auth/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          password,
          postcode,
          addressLine1,
          city,
          phone,
        }),
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
        data = { error: text || `Registration server responded with status ${res.status}` };
      }

      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      localStorage.setItem("san_customer_token", data.token);
      localStorage.setItem("san_customer_user", JSON.stringify(data.customer));
      document.cookie = `san_customer_token=${data.token}; path=/; max-age=604800; SameSite=Lax`;
      window.dispatchEvent(new Event("storage"));

      router.push("/account");
    } catch (err: any) {
      setError(err.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[90vh] bg-sand-50 flex items-center justify-center p-4 sm:p-6 antialiased">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <span className="text-[11px] font-bold uppercase tracking-widest text-brass-600">
            Welcome to SAN Furniture
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-navy-950 mt-1">
            Create Your UK Client Account
          </h1>
          <p className="text-xs text-navy-600 mt-2">
            Enjoy complimentary room-of-choice delivery updates, saved UK addresses, and express checkout.
          </p>
        </div>

        <div className="bg-sand-100/60 border border-sand-300 rounded-2xl p-6 sm:p-8 shadow-sm">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-100 border border-red-300 text-red-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-navy-900 mb-1.5">First Name <span className="text-red-500">*</span></label>
                <div className="relative">
                  <User className="w-4 h-4 text-navy-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Eleanor"
                    className="w-full pl-10 pr-4 py-2.5 bg-sand-50 border border-sand-300 rounded-xl text-navy-950 text-xs focus:outline-none focus:border-brass-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy-900 mb-1.5">Last Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Smith"
                  className="w-full px-4 py-2.5 bg-sand-50 border border-sand-300 rounded-xl text-navy-950 text-xs focus:outline-none focus:border-brass-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-navy-900 mb-1.5">Email Address <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-navy-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="eleanor.vance@example.co.uk"
                    className="w-full pl-10 pr-4 py-2.5 bg-sand-50 border border-sand-300 rounded-xl text-navy-950 text-xs focus:outline-none focus:border-brass-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy-900 mb-1.5">
                  Mobile / Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-navy-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+44 7123 456789"
                    className="w-full pl-10 pr-4 py-2.5 bg-sand-50 border border-sand-300 rounded-xl text-navy-950 text-xs focus:outline-none focus:border-brass-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy-900 mb-1.5">Password (Min 8 chars) <span className="text-red-500">*</span></label>
              <div className="relative">
                <Lock className="w-4 h-4 text-navy-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-sand-50 border border-sand-300 rounded-xl text-navy-950 text-xs focus:outline-none focus:border-brass-500"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-sand-200">
              <span className="text-[11px] font-bold text-navy-800 uppercase tracking-wider block mb-2">
                Primary UK Delivery Address (Optional)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-navy-700 mb-1">Street Address</label>
                  <input
                    type="text"
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                    placeholder="14 Kensington Palace Gardens"
                    className="w-full px-3 py-2 bg-sand-50 border border-sand-300 rounded-xl text-navy-950 text-xs focus:outline-none focus:border-brass-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-navy-700 mb-1">UK Postcode</label>
                  <div className="relative">
                    <MapPin className="w-3.5 h-3.5 text-navy-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={postcode}
                      onChange={(e) => setPostcode(e.target.value.toUpperCase())}
                      placeholder="SW1A 1AA"
                      className="w-full pl-8 pr-3 py-2 bg-sand-50 border border-sand-300 rounded-xl text-navy-950 text-xs font-mono uppercase focus:outline-none focus:border-brass-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-navy-950 hover:bg-navy-900 text-sand-50 font-bold text-xs tracking-wide shadow-md transition-all disabled:opacity-50"
            >
              {loading ? (
                <span>Creating Account...</span>
              ) : (
                <>
                  <span>Create Account &amp; Continue</span>
                  <ArrowRight className="w-4 h-4 text-brass-400" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-sand-300 flex items-center justify-between text-xs">
            <span className="text-navy-600">Already registered?</span>
            <Link href="/account/login" className="font-bold text-navy-950 hover:text-brass-600 underline">
              Sign in to your account &rarr;
            </Link>
          </div>
        </div>

        <div className="mt-6 text-center">
          <span className="inline-flex items-center gap-1.5 text-xs text-navy-600">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            UK GDPR Compliant &bull; 100% Privacy Protected
          </span>
        </div>
      </div>
    </div>
  );
}
