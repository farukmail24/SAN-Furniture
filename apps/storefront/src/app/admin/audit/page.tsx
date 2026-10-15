"use client";

import React, { useState, useEffect } from "react";
import {
  History,
  Search,
  Filter,
  RefreshCw,
  ShieldCheck,
  User,
  Activity,
  Terminal,
  Clock,
  ChevronDown,
  ChevronRight
} from "lucide-react";

interface AuditLog {
  id: string;
  actor: string;
  action: string;
  resource: string;
  details_json: string;
  ip_address: string;
  created_at: string;
}

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchLogs = async () => {
    try {
      const res = await fetch("http://localhost:9000/api/admin/audit?limit=100");
      const data = await res.json();
      if (data.logs) {
        setLogs(data.logs);
      }
    } catch (err) {
      console.error("Failed to load audit logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const q = searchTerm.toLowerCase();
    return (
      log.actor.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q) ||
      log.resource.toLowerCase().includes(q) ||
      (log.ip_address && log.ip_address.toLowerCase().includes(q))
    );
  });

  const getActionBadgeColor = (action: string) => {
    if (action.includes("CREATE")) return "bg-emerald-100 text-emerald-800 border-emerald-200";
    if (action.includes("DELETE") || action.includes("BAN")) return "bg-rose-100 text-rose-800 border-rose-200";
    if (action.includes("UPDATE")) return "bg-blue-100 text-blue-800 border-blue-200";
    if (action.includes("LOGIN")) return "bg-purple-100 text-purple-800 border-purple-200";
    return "bg-slate-100 text-slate-800 border-slate-200";
  };

  return (
    <div className="space-y-6 w-full">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E8E2D5]">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#C89B3C] mb-1">
            <History className="w-4 h-4" />
            <span>Governance & Immutable Audit Trail</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif text-[#0B132B]">
            Administrative Operations Log
          </h1>
          <p className="text-sm text-[#4F6D7A] mt-1">
            Tamper-evident record of staff logins, catalog modifications, order dispatch changes, and security events.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-[#E8E2D5] hover:bg-[#F4F1EA] text-[#0B132B] rounded-md text-xs font-semibold transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Audit Trail</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#4F6D7A] absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by staff actor, action name, resource, or IP address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-[#E8E2D5] text-xs text-[#0B132B] focus:outline-none focus:ring-2 focus:ring-[#0B132B]"
          />
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-xl border border-[#E8E2D5] shadow-sm overflow-hidden">
        <div className="p-4 bg-[#FAF8F5] border-b border-[#E8E2D5] flex items-center justify-between text-xs text-[#4F6D7A]">
          <span className="font-semibold text-[#0B132B]">
            Showing {filteredLogs.length} Records
          </span>
          <span>Preserved under GDPR Article 32 & UK Data Protection Act 2018</span>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center items-center">
            <RefreshCw className="w-8 h-8 animate-spin text-[#C89B3C]" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-16 text-center text-sm text-[#4F6D7A]">
            No matching audit records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#FAF8F5] text-[#0B132B] text-xs uppercase font-semibold border-b border-[#E8E2D5]">
                <tr>
                  <th className="py-3 px-4">Timestamp (UTC)</th>
                  <th className="py-3 px-4">Staff Actor</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Resource Target</th>
                  <th className="py-3 px-4">Client IP</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2D5]">
                {filteredLogs.map((log) => {
                  const isExpanded = expandedId === log.id;
                  return (
                    <React.Fragment key={log.id}>
                      <tr
                        onClick={() => setExpandedId(isExpanded ? null : log.id)}
                        className="hover:bg-slate-50/60 transition-colors cursor-pointer"
                      >
                        <td className="py-3.5 px-4 text-xs font-mono text-[#0B132B] whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString("en-GB")}
                        </td>

                        <td className="py-3.5 px-4 text-xs font-medium text-[#0B132B]">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-[#C89B3C]" />
                            <span>{log.actor}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${getActionBadgeColor(
                              log.action
                            )}`}
                          >
                            {log.action}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-xs font-mono text-[#4F6D7A]">
                          {log.resource}
                        </td>

                        <td className="py-3.5 px-4 text-xs font-mono text-[#4F6D7A]">
                          {log.ip_address}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            className="p-1 text-[#4F6D7A] hover:text-[#0B132B]"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="bg-[#FAF8F5]/80">
                          <td colSpan={6} className="p-4 border-b border-[#E8E2D5]">
                            <div className="text-xs font-mono text-[#0B132B] space-y-1">
                              <div className="text-[#4F6D7A] font-semibold mb-1">
                                Event Payload (Raw JSON):
                              </div>
                              <pre className="p-3 bg-white border border-[#E8E2D5] rounded-lg overflow-x-auto text-[11px] text-[#0B132B]">
                                {(() => {
                                  try {
                                    return JSON.stringify(JSON.parse(log.details_json || "{}"), null, 2);
                                  } catch {
                                    return log.details_json || "No payload details recorded";
                                  }
                                })()}
                              </pre>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
