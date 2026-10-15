"use client";

import React, { useState, useEffect } from "react";
import {
  UserCheck,
  UserPlus,
  Shield,
  Key,
  Mail,
  Lock,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Clock,
  ShieldAlert
} from "lucide-react";
import { DataTable, ColumnDef } from "@/components/admin/DataTable";
import { apiUrl } from "@/lib/api-config";

interface AdminUserRecord {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: number;
  last_login_at: string | null;
  created_at: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUserRecord | null>(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formRole, setFormRole] = useState("catalog_manager");
  const [formPassword, setFormPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/admin/users"));
      const data = await res.json();
      if (data.users) setUsers(data.users);
    } catch (err) {
      console.error("Failed to load staff users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch(apiUrl("/api/admin/users"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: formName,
          email: formEmail,
          role: formRole,
          password: formPassword,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setToastMsg({ type: "success", text: `Staff user "${formName}" created successfully!` });
        setIsAddModalOpen(false);
        setFormName("");
        setFormEmail("");
        setFormPassword("");
        fetchUsers();
      } else {
        setToastMsg({ type: "error", text: data.error || "Failed to create user" });
      }
    } catch {
      setToastMsg({ type: "error", text: "Network error creating staff user." });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setToastMsg(null), 4000);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(apiUrl(`/api/admin/users/${editingUser.id}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: editingUser.full_name,
          role: editingUser.role,
          isActive: Boolean(editingUser.is_active),
          password: formPassword || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setToastMsg({ type: "success", text: "Staff user updated successfully!" });
        setEditingUser(null);
        setFormPassword("");
        fetchUsers();
      } else {
        setToastMsg({ type: "error", text: data.error || "Failed to update staff user" });
      }
    } catch {
      setToastMsg({ type: "error", text: "Network error updating staff user." });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setToastMsg(null), 4000);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to remove this staff member?")) return;
    try {
      const res = await fetch(apiUrl(`/api/admin/users/${userId}`), {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        setToastMsg({ type: "success", text: "Staff user removed." });
        fetchUsers();
      } else {
        setToastMsg({ type: "error", text: data.error || "Failed to remove staff" });
      }
    } catch {
      setToastMsg({ type: "error", text: "Network error removing staff." });
    } finally {
      setTimeout(() => setToastMsg(null), 3500);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "super_admin":
        return "bg-purple-100 text-purple-800 border-purple-200 font-bold";
      case "catalog_manager":
        return "bg-blue-100 text-blue-800 border-blue-200 font-semibold";
      case "logistics_operator":
        return "bg-amber-100 text-amber-800 border-amber-200 font-semibold";
      case "support_agent":
        return "bg-emerald-100 text-emerald-800 border-emerald-200 font-semibold";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  const columns: ColumnDef<AdminUserRecord>[] = [
    {
      key: "name",
      header: "Staff Member & Email",
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#0B132B] text-[#C89B3C] flex items-center justify-center font-bold text-xs uppercase shrink-0">
            {row.full_name.charAt(0)}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-[#0B132B] truncate">{row.full_name}</div>
            <div className="text-[11px] text-[#4F6D7A] flex items-center gap-1">
              <Mail className="w-3 h-3 text-[#C89B3C]" />
              <span className="truncate">{row.email}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "RBAC Role",
      sortable: true,
      cell: (row) => (
        <span
          className={`px-2.5 py-0.5 rounded-full text-[11px] border capitalize ${getRoleBadge(
            row.role
          )}`}
        >
          {row.role.replace("_", " ")}
        </span>
      ),
    },
    {
      key: "is_active",
      header: "Status",
      sortable: true,
      cell: (row) => (
        <span
          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
            row.is_active ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"
          }`}
        >
          {row.is_active ? "Active" : "Suspended"}
        </span>
      ),
    },
    {
      key: "2fa",
      header: "2FA Security",
      sortable: false,
      searchable: false,
      cell: (row) => (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
          <Shield className="w-3.5 h-3.5 text-emerald-600" />
          <span>Enforced</span>
        </span>
      ),
    },
    {
      key: "last_login_at",
      header: "Last Login",
      sortable: true,
      cell: (row) => (
        <span className="text-[11px] text-[#4F6D7A]">
          {row.last_login_at ? new Date(row.last_login_at).toLocaleString("en-GB") : "Never"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      sortable: false,
      searchable: false,
      cell: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => setEditingUser(row)}
            className="p-1.5 rounded hover:bg-slate-100 text-[#4F6D7A] hover:text-blue-700"
            title="Edit Role & Permissions"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleDeleteUser(row.id)}
            className="p-1.5 rounded hover:bg-rose-50 text-[#4F6D7A] hover:text-rose-700"
            title="Delete Staff"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 w-full">
      {/* Toast Notification */}
      {toastMsg && (
        <div
          className={`p-4 rounded-xl text-sm flex items-center gap-2 animate-in fade-in ${
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

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white border border-[#E8E2D5] rounded-xl shadow-sm">
          <div className="text-xs uppercase tracking-wider font-semibold text-[#4F6D7A]">
            Staff Accounts
          </div>
          <div className="text-3xl font-serif text-[#0B132B] mt-2">
            {users.length} Users
          </div>
          <div className="text-xs text-emerald-700 font-medium mt-1">
            Role-Based Access Control (RBAC) Active
          </div>
        </div>

        <div className="p-5 bg-white border border-[#E8E2D5] rounded-xl shadow-sm">
          <div className="text-xs uppercase tracking-wider font-semibold text-[#4F6D7A]">
            Super Administrators
          </div>
          <div className="text-3xl font-serif text-[#0B132B] mt-2">
            {users.filter((u) => u.role === "super_admin").length} Principals
          </div>
          <div className="text-xs text-[#4F6D7A] mt-1">Full database & system access</div>
        </div>

        <div className="p-5 bg-white border border-[#E8E2D5] rounded-xl shadow-sm">
          <div className="text-xs uppercase tracking-wider font-semibold text-[#4F6D7A]">
            Staff Security Guard
          </div>
          <div className="text-3xl font-serif text-[#0B132B] mt-2">
            PBKDF2-512
          </div>
          <div className="text-xs text-emerald-700 font-medium mt-1">
            Zero plaintext credential storage
          </div>
        </div>
      </div>

      {/* Advanced Global DataTable */}
      <DataTable
        title="Admin Staff & RBAC Permissions"
        subtitle="Manage operations leads, catalog editors, logistics operators, and support agents."
        data={users}
        columns={columns}
        keyExtractor={(u) => u.id}
        searchPlaceholder="Search staff by name, email, or role..."
        loading={loading}
        onRefresh={fetchUsers}
        exportFileName="san_furniture_admin_users"
        actions={
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0B132B] hover:bg-[#1C2541] text-[#FAF8F5] rounded-lg text-xs font-semibold transition-all shadow-sm"
          >
            <UserPlus className="w-4 h-4 text-[#C89B3C]" />
            <span>Invite New Staff</span>
          </button>
        }
      />

      {/* MODAL 1: Add Staff User */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl border border-[#E8E2D5] shadow-2xl w-full max-w-lg p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D5]">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#C89B3C]" />
                <h3 className="font-serif font-bold text-lg text-[#0B132B]">Invite New Staff Member</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-[#4F6D7A] hover:text-[#0B132B]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#0B132B] mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#E8E2D5] text-xs text-[#0B132B]"
                  placeholder="Sophie Mercer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0B132B] mb-1">Company Email *</label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#E8E2D5] text-xs text-[#0B132B]"
                  placeholder="sophie.mercer@sanfurniture.co.uk"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0B132B] mb-1">Assigned Role</label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#E8E2D5] text-xs text-[#0B132B]"
                >
                  <option value="catalog_manager">Catalog Manager (Products, Categories, Media)</option>
                  <option value="logistics_operator">Logistics Operator (Orders, Shipping, Tracking)</option>
                  <option value="support_agent">Support Agent (Reviews, Customers, Orders View)</option>
                  <option value="super_admin">Super Administrator (Full System Governance)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0B132B] mb-1">Temporary Password *</label>
                <input
                  type="password"
                  required
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#E8E2D5] text-xs text-[#0B132B]"
                  placeholder="Minimum 8 characters"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E8E2D5]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[#E8E2D5] text-xs font-semibold text-[#4F6D7A] hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 rounded-lg bg-[#0B132B] hover:bg-[#1C2541] text-white text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "Inviting..." : "Create Staff Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Edit Staff User */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl border border-[#E8E2D5] shadow-2xl w-full max-w-lg p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D5]">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-[#C89B3C]" />
                <h3 className="font-serif font-bold text-lg text-[#0B132B]">Edit Staff Permissions</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="text-[#4F6D7A] hover:text-[#0B132B]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#0B132B] mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editingUser.full_name}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, full_name: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[#E8E2D5] text-xs text-[#0B132B]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0B132B] mb-1">Role</label>
                <select
                  value={editingUser.role}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, role: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[#E8E2D5] text-xs text-[#0B132B]"
                >
                  <option value="catalog_manager">Catalog Manager</option>
                  <option value="logistics_operator">Logistics Operator</option>
                  <option value="support_agent">Support Agent</option>
                  <option value="super_admin">Super Administrator</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0B132B] mb-1">Status</label>
                <button
                  type="button"
                  onClick={() =>
                    setEditingUser({ ...editingUser, is_active: editingUser.is_active ? 0 : 1 })
                  }
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    editingUser.is_active
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {editingUser.is_active ? "Active" : "Suspended"} (Click to toggle)
                </button>
              </div>

              <div className="pt-2 border-t border-[#E8E2D5]">
                <label className="block text-xs font-semibold text-[#0B132B] mb-1">
                  Reset Password (Leave blank to keep current)
                </label>
                <input
                  type="password"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#E8E2D5] text-xs text-[#0B132B]"
                  placeholder="New password if resetting"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E8E2D5]">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-lg border border-[#E8E2D5] text-xs font-semibold text-[#4F6D7A] hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 rounded-lg bg-[#0B132B] hover:bg-[#1C2541] text-white text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "Updating..." : "Update Staff User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
