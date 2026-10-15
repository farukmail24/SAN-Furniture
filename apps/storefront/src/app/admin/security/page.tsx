"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Unlock,
  AlertTriangle,
  RefreshCw,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Terminal,
  Activity
} from "lucide-react";
import { apiUrl } from "@/lib/api-config";
import { fetchWithSwr, invalidateCache, getCachedData } from "@/lib/api-cache";

interface JailedIP {
  id: string;
  ip_address: string;
  strike_count: number;
  reason: string;
  locked_until: string;
  is_permanent: number;
  created_at: string;
}

export default function AdminSecurityPage() {
  const cachedJail = getCachedData<{ jailedIps: JailedIP[] }>(apiUrl("/api/security/ip-jail"));
  const [jailedIps, setJailedIps] = useState<JailedIP[]>(() => cachedJail?.jailedIps || []);
  const [loading, setLoading] = useState<boolean>(() => !cachedJail?.jailedIps?.length);
  const [unblockingIp, setUnblockingIp] = useState<string | null>(null);
  const [newIp, setNewIp] = useState("");
  const [newReason, setNewReason] = useState("");
  const [addingBan, setAddingBan] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchJail = async () => {
    try {
      fetchWithSwr(
        apiUrl("/api/security/ip-jail"),
        (data: any, isCached) => {
          if (data.jailedIps) {
            setJailedIps(data.jailedIps);
            setLoading(false);
          }
        }
      ).finally(() => setLoading(false));
    } catch (err) {
      console.error("Failed to fetch IP jail:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJail();
  }, []);

  const handleUnblock = async (ip: string) => {
    setUnblockingIp(ip);
    setToastMsg(null);
    try {
      const res = await fetch(apiUrl("/api/security/unblock"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ip })
      });
      const data = await res.json();
      if (res.ok) {
        setToastMsg({ type: "success", text: data.message || `IP ${ip} released from jail.` });
        fetchJail();
      } else {
        setToastMsg({ type: "error", text: data.error || "Failed to release IP" });
      }
    } catch {
      setToastMsg({ type: "error", text: "Network error releasing IP." });
    } finally {
      setUnblockingIp(null);
      setTimeout(() => setToastMsg(null), 4000);
    }
  };

  const handleManualBan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIp.trim()) return;

    setAddingBan(true);
    setToastMsg(null);
    try {
      const res = await fetch(apiUrl("/api/security/block"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ip: newIp.trim(), reason: newReason.trim() || "Manual security lock" })
      });
      const data = await res.json();
      if (res.ok) {
        setToastMsg({ type: "success", text: data.message || `IP ${newIp} banned.` });
        setNewIp("");
        setNewReason("");
        fetchJail();
      } else {
        setToastMsg({ type: "error", text: data.error || "Failed to ban IP" });
      }
    } catch {
      setToastMsg({ type: "error", text: "Network error banning IP." });
    } finally {
      setAddingBan(false);
      setTimeout(() => setToastMsg(null), 4000);
    }
  };

  return (
    <div className="space-y-6 w-full">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E8E2D5]">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-rose-600 mb-1">
            <ShieldAlert className="w-4 h-4" />
            <span>Cyber Defense & Zero-Trust WAF</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif text-[#0B132B]">
            Security Operations & IP Jail
          </h1>
          <p className="text-sm text-[#4F6D7A] mt-1">
            Live monitor of locked malicious IPs, sliding-window rate limit defense, and brute-force mitigation.
          </p>
        </div>

        <button
          onClick={fetchJail}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-[#E8E2D5] hover:bg-[#F4F1EA] text-[#0B132B] rounded-md text-xs font-semibold transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Jail Status</span>
        </button>
      </div>

      {/* Toast Notification */}
      {toastMsg && (
        <div
          className={`p-4 rounded-md text-sm flex items-center gap-2 animate-in fade-in ${
            toastMsg.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-900"
              : "bg-rose-50 border border-rose-200 text-rose-900"
          }`}
        >
          {toastMsg.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Security Defense Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#0B132B] text-white p-5 rounded-xl border border-navy-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-sand-300 uppercase tracking-wider font-semibold">
            <span>Currently Jailed IPs</span>
            <Lock className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-3xl font-serif text-white mt-2">
            {jailedIps.length} Locked
          </div>
          <div className="text-xs text-rose-400 mt-1 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> Blocked from API & Checkout
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#E8E2D5] shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#4F6D7A] uppercase tracking-wider font-semibold">
            <span>Sliding Window Rate Limits</span>
            <Activity className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-serif text-[#0B132B] mt-2">
            5 / 15m
          </div>
          <div className="text-xs text-[#4F6D7A] mt-1">
            Auth: 5 req | Checkout: 3 req | Search: 60 req
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#E8E2D5] shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#4F6D7A] uppercase tracking-wider font-semibold">
            <span>Cryptography Standard</span>
            <ShieldCheck className="w-4 h-4 text-[#C89B3C]" />
          </div>
          <div className="text-3xl font-serif text-[#0B132B] mt-2">
            PBKDF2 / SHA-512
          </div>
          <div className="text-xs text-emerald-700 font-medium mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> 100,000 salt iterations active
          </div>
        </div>
      </div>

      {/* Manual Ban Form */}
      <div className="bg-white p-5 rounded-xl border border-[#E8E2D5] shadow-sm">
        <h2 className="text-sm font-semibold text-[#0B132B] uppercase tracking-wider mb-3 flex items-center gap-2">
          <Plus className="w-4 h-4 text-[#C89B3C]" />
          Manual IP Lockout / Blacklist
        </h2>
        <form onSubmit={handleManualBan} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            required
            placeholder="IP Address (e.g. 192.168.1.100 or 203.0.113.195)"
            value={newIp}
            onChange={(e) => setNewIp(e.target.value)}
            className="flex-1 px-3.5 py-2 rounded-lg border border-[#E8E2D5] text-xs text-[#0B132B] focus:outline-none focus:ring-2 focus:ring-[#0B132B]"
          />
          <input
            type="text"
            placeholder="Lockout Reason (e.g. Malicious SQL injection probe)"
            value={newReason}
            onChange={(e) => setNewReason(e.target.value)}
            className="flex-1 px-3.5 py-2 rounded-lg border border-[#E8E2D5] text-xs text-[#0B132B] focus:outline-none focus:ring-2 focus:ring-[#0B132B]"
          />
          <button
            type="submit"
            disabled={addingBan}
            className="px-5 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 shrink-0"
          >
            {addingBan ? "Locking IP..." : "Ban & Jail IP"}
          </button>
        </form>
      </div>

      {/* IP Jail Table */}
      <div className="bg-white rounded-xl border border-[#E8E2D5] shadow-sm overflow-hidden">
        <div className="p-5 border-b border-[#E8E2D5] flex items-center justify-between">
          <h2 className="text-base font-serif font-bold text-[#0B132B] flex items-center gap-2">
            <Terminal className="w-4 h-4 text-rose-600" />
            Active Jailed IP Addresses
          </h2>
          <span className="text-xs text-[#4F6D7A]">
            Auto-purged after timeout unless marked permanent
          </span>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center items-center">
            <RefreshCw className="w-8 h-8 animate-spin text-[#C89B3C]" />
          </div>
        ) : jailedIps.length === 0 ? (
          <div className="py-16 text-center text-sm text-[#4F6D7A]">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            <span>IP Jail is currently clear. Zero active malicious lockout flags.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#FAF8F5] text-[#0B132B] text-xs uppercase font-semibold border-b border-[#E8E2D5]">
                <tr>
                  <th className="py-3 px-4">Offender IP</th>
                  <th className="py-3 px-4">Violations / Strikes</th>
                  <th className="py-3 px-4">Lockout Reason</th>
                  <th className="py-3 px-4">Jailed Until</th>
                  <th className="py-3 px-4">Flag</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2D5]">
                {jailedIps.map((j) => (
                  <tr key={j.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-xs font-bold text-rose-700">
                      {j.ip_address}
                    </td>

                    <td className="py-3.5 px-4 text-xs font-semibold text-[#0B132B]">
                      {j.strike_count} strikes
                    </td>

                    <td className="py-3.5 px-4 text-xs text-[#4F6D7A]">
                      {j.reason || "Automated threshold exceeded"}
                    </td>

                    <td className="py-3.5 px-4 text-xs text-[#0B132B]">
                      {j.is_permanent ? (
                        <span className="text-rose-600 font-semibold">PERMANENT LOCK</span>
                      ) : (
                        new Date(j.locked_until).toLocaleString("en-GB")
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-100 text-rose-800">
                        JAILED
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleUnblock(j.ip_address)}
                        disabled={unblockingIp === j.ip_address}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E8E2D5] hover:bg-emerald-50 text-emerald-800 rounded text-xs font-semibold transition-colors disabled:opacity-50"
                      >
                        {unblockingIp === j.ip_address ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Unlock className="w-3.5 h-3.5" />
                        )}
                        <span>Release IP</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
