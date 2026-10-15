"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  Mail,
  Phone,
  MapPin,
  ShoppingBag,
  Clock,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  AlertCircle,
  X,
  CreditCard,
  ShieldCheck
} from "lucide-react";
import { DataTable, ColumnDef } from "@/components/admin/DataTable";
import { formatGBP } from "@san-furniture/types";
import { apiUrl } from "@/lib/api-config";

interface CustomerRecord {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  orders_count: number;
  total_spend_pennies: number;
  last_order_at: string | null;
  postcode: string;
  city: string;
  created_at: string;
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modals & Drawers state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerRecord | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<CustomerRecord | null>(null);

  // Add Form state
  const [formFirstName, setFormFirstName] = useState("");
  const [formLastName, setFormLastName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("+44 ");
  const [formAddress, setFormAddress] = useState("");
  const [formCity, setFormCity] = useState("London");
  const [formPostcode, setFormPostcode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/admin/customers"));
      const data = await res.json();
      if (data.customers) setCustomers(data.customers);
    } catch (err) {
      console.error("Failed to load customers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch(apiUrl("/api/admin/customers"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formFirstName,
          lastName: formLastName,
          email: formEmail,
          phone: formPhone,
          addressLine1: formAddress,
          city: formCity,
          postcode: formPostcode,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setToastMsg({ type: "success", text: "Customer profile successfully created in CRM!" });
        setIsAddModalOpen(false);
        // Reset form
        setFormFirstName("");
        setFormLastName("");
        setFormEmail("");
        setFormAddress("");
        setFormPostcode("");
        fetchCustomers();
      } else {
        setToastMsg({ type: "error", text: data.error || "Failed to create customer" });
      }
    } catch {
      setToastMsg({ type: "error", text: "Network error creating customer." });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setToastMsg(null), 4000);
    }
  };

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(apiUrl(`/api/admin/customers/${editingCustomer.id}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: editingCustomer.first_name,
          lastName: editingCustomer.last_name,
          email: editingCustomer.email,
          phone: editingCustomer.phone,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setToastMsg({ type: "success", text: "Customer updated successfully!" });
        setEditingCustomer(null);
        fetchCustomers();
      } else {
        setToastMsg({ type: "error", text: data.error || "Failed to update customer" });
      }
    } catch {
      setToastMsg({ type: "error", text: "Network error updating customer." });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setToastMsg(null), 4000);
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this customer record?")) return;
    try {
      const res = await fetch(apiUrl(`/api/admin/customers/${id}`), {
        method: "DELETE",
      });
      if (res.ok) {
        setToastMsg({ type: "success", text: "Customer removed from CRM." });
        fetchCustomers();
      }
    } catch {
      setToastMsg({ type: "error", text: "Error deleting customer." });
    } finally {
      setTimeout(() => setToastMsg(null), 3500);
    }
  };

  const handleBulkDelete = async (selectedIds: string[]) => {
    for (const id of selectedIds) {
      await fetch(apiUrl(`/api/admin/customers/${id}`), { method: "DELETE" });
    }
    setToastMsg({ type: "success", text: `Deleted ${selectedIds.length} customer records.` });
    fetchCustomers();
    setTimeout(() => setToastMsg(null), 4000);
  };

  const columns: ColumnDef<CustomerRecord>[] = [
    {
      key: "name",
      header: "Customer Name & Email",
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#0B132B] text-[#C89B3C] flex items-center justify-center font-bold text-xs uppercase shrink-0">
            {row.first_name.charAt(0)}{row.last_name.charAt(0)}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-[#0B132B] truncate">
              {row.first_name} {row.last_name}
            </div>
            <div className="text-[11px] text-[#4F6D7A] flex items-center gap-1">
              <Mail className="w-3 h-3 text-[#C89B3C]" />
              <span className="truncate">{row.email}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "phone",
      header: "Telephone",
      cell: (row) => (
        <div className="text-xs font-mono text-[#0B132B]">
          {row.phone || "—"}
        </div>
      ),
    },
    {
      key: "postcode",
      header: "Location (Postcode)",
      cell: (row) => (
        <div>
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-[#F4F1EA] text-[#0B132B] border border-[#E8E2D5]">
            {row.postcode}
          </span>
          <span className="text-[11px] text-[#4F6D7A] ml-1.5">{row.city}</span>
        </div>
      ),
    },
    {
      key: "orders_count",
      header: "Orders",
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-1.5 font-semibold text-[#0B132B]">
          <ShoppingBag className="w-3.5 h-3.5 text-[#C89B3C]" />
          <span>{row.orders_count} orders</span>
        </div>
      ),
    },
    {
      key: "total_spend_pennies",
      header: "Lifetime Spend (LTV)",
      sortable: true,
      cell: (row) => (
        <div className="font-bold text-[#0B132B] text-xs">
          {formatGBP(row.total_spend_pennies)}
        </div>
      ),
    },
    {
      key: "created_at",
      header: "Registered",
      sortable: true,
      cell: (row) => (
        <span className="text-[11px] text-[#4F6D7A]">
          {new Date(row.created_at).toLocaleDateString("en-GB")}
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
            onClick={() => setViewingCustomer(row)}
            className="p-1.5 rounded hover:bg-slate-100 text-[#4F6D7A] hover:text-[#0B132B]"
            title="View Customer Profile"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setEditingCustomer(row)}
            className="p-1.5 rounded hover:bg-slate-100 text-[#4F6D7A] hover:text-blue-700"
            title="Edit Customer"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleDeleteCustomer(row.id)}
            className="p-1.5 rounded hover:bg-rose-50 text-[#4F6D7A] hover:text-rose-700"
            title="Delete Customer"
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
            Registered UK Customers
          </div>
          <div className="text-3xl font-serif text-[#0B132B] mt-2">
            {customers.length} Accounts
          </div>
          <div className="text-xs text-emerald-700 font-medium mt-1 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Stored in dedicated `customers` table
          </div>
        </div>

        <div className="p-5 bg-white border border-[#E8E2D5] rounded-xl shadow-sm">
          <div className="text-xs uppercase tracking-wider font-semibold text-[#4F6D7A]">
            Total Gross CRM Spend
          </div>
          <div className="text-3xl font-serif text-[#0B132B] mt-2">
            {formatGBP(customers.reduce((acc, c) => acc + Number(c.total_spend_pennies || 0), 0))}
          </div>
          <div className="text-xs text-[#4F6D7A] mt-1">20% UK VAT included</div>
        </div>

        <div className="p-5 bg-white border border-[#E8E2D5] rounded-xl shadow-sm">
          <div className="text-xs uppercase tracking-wider font-semibold text-[#4F6D7A]">
            High-Value VIPs (&gt;£1,000 LTV)
          </div>
          <div className="text-3xl font-serif text-[#0B132B] mt-2">
            {customers.filter((c) => c.total_spend_pennies >= 100000).length} Clients
          </div>
          <div className="text-xs text-[#C89B3C] font-medium mt-1">
            Eligible for Concierge 2-Man Priority
          </div>
        </div>
      </div>

      {/* Advanced Global DataTable */}
      <DataTable
        title="Customer Directory & CRM"
        subtitle="Manage verified UK furniture buyers, address books, and order spend analytics."
        data={customers}
        columns={columns}
        keyExtractor={(c) => c.id}
        searchPlaceholder="Search customer by name, email, phone, or postcode..."
        loading={loading}
        onRefresh={fetchCustomers}
        onBulkDelete={handleBulkDelete}
        exportFileName="san_furniture_customers_crm"
        actions={
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0B132B] hover:bg-[#1C2541] text-[#FAF8F5] rounded-lg text-xs font-semibold transition-all shadow-sm"
          >
            <UserPlus className="w-4 h-4 text-[#C89B3C]" />
            <span>Add New Customer</span>
          </button>
        }
      />

      {/* MODAL 1: Add Customer */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl border border-[#E8E2D5] shadow-2xl w-full max-w-lg p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D5]">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#C89B3C]" />
                <h3 className="font-serif font-bold text-lg text-[#0B132B]">Add New Customer</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-[#4F6D7A] hover:text-[#0B132B]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#0B132B] mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formFirstName}
                    onChange={(e) => setFormFirstName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#E8E2D5] text-xs text-[#0B132B]"
                    placeholder="Eleanor"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0B132B] mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={formLastName}
                    onChange={(e) => setFormLastName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#E8E2D5] text-xs text-[#0B132B]"
                    placeholder="Vance"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0B132B] mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#E8E2D5] text-xs text-[#0B132B]"
                  placeholder="eleanor.vance@mayfair.co.uk"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0B132B] mb-1">UK Phone</label>
                <input
                  type="text"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#E8E2D5] text-xs text-[#0B132B]"
                  placeholder="+44 7700 900123"
                />
              </div>

              <div className="pt-2 border-t border-[#E8E2D5] space-y-3">
                <div className="text-xs font-semibold text-[#0B132B]">Delivery Address (Default)</div>
                <div>
                  <input
                    type="text"
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#E8E2D5] text-xs text-[#0B132B]"
                    placeholder="Street Address (e.g. 14 Berkeley Mews)"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#E8E2D5] text-xs text-[#0B132B]"
                    placeholder="City (e.g. London)"
                  />
                  <input
                    type="text"
                    value={formPostcode}
                    onChange={(e) => setFormPostcode(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#E8E2D5] text-xs text-[#0B132B]"
                    placeholder="UK Postcode (e.g. W1K 2HP)"
                  />
                </div>
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
                  {isSubmitting ? "Creating..." : "Save Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Edit Customer */}
      {editingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl border border-[#E8E2D5] shadow-2xl w-full max-w-lg p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D5]">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-[#C89B3C]" />
                <h3 className="font-serif font-bold text-lg text-[#0B132B]">Edit Customer Profile</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingCustomer(null)}
                className="text-[#4F6D7A] hover:text-[#0B132B]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateCustomer} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#0B132B] mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={editingCustomer.first_name}
                    onChange={(e) =>
                      setEditingCustomer({ ...editingCustomer, first_name: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#E8E2D5] text-xs text-[#0B132B]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0B132B] mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={editingCustomer.last_name}
                    onChange={(e) =>
                      setEditingCustomer({ ...editingCustomer, last_name: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#E8E2D5] text-xs text-[#0B132B]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0B132B] mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={editingCustomer.email}
                  onChange={(e) =>
                    setEditingCustomer({ ...editingCustomer, email: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[#E8E2D5] text-xs text-[#0B132B]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0B132B] mb-1">Phone</label>
                <input
                  type="text"
                  value={editingCustomer.phone || ""}
                  onChange={(e) =>
                    setEditingCustomer({ ...editingCustomer, phone: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[#E8E2D5] text-xs text-[#0B132B]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E8E2D5]">
                <button
                  type="button"
                  onClick={() => setEditingCustomer(null)}
                  className="px-4 py-2 rounded-lg border border-[#E8E2D5] text-xs font-semibold text-[#4F6D7A] hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 rounded-lg bg-[#0B132B] hover:bg-[#1C2541] text-white text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : "Update Details"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DRAWER: View Customer Profile */}
      {viewingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-navy-950/50 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md h-full bg-white shadow-2xl flex flex-col justify-between p-6 overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#E8E2D5]">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#0B132B] text-[#C89B3C] flex items-center justify-center font-bold text-base uppercase">
                    {viewingCustomer.first_name.charAt(0)}{viewingCustomer.last_name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-lg text-[#0B132B]">
                      {viewingCustomer.first_name} {viewingCustomer.last_name}
                    </h3>
                    <p className="text-xs text-[#4F6D7A] font-mono">{viewingCustomer.id}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setViewingCustomer(null)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-[#4F6D7A]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="p-4 bg-[#FAF8F5] rounded-xl border border-[#E8E2D5] flex items-center justify-between">
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-[#4F6D7A]">Lifetime Spend</div>
                    <div className="text-xl font-serif font-bold text-[#0B132B]">
                      {formatGBP(viewingCustomer.total_spend_pennies)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] uppercase tracking-wider text-[#4F6D7A]">Total Orders</div>
                    <div className="text-xl font-serif font-bold text-[#0B132B]">
                      {viewingCustomer.orders_count}
                    </div>
                  </div>
                </div>

                <div className="p-4 border border-[#E8E2D5] rounded-xl space-y-2 text-xs">
                  <div className="font-semibold text-[#0B132B] uppercase tracking-wider text-[11px]">
                    Contact Information
                  </div>
                  <div className="flex items-center gap-2 text-[#0B132B]">
                    <Mail className="w-3.5 h-3.5 text-[#C89B3C]" />
                    <a href={`mailto:${viewingCustomer.email}`} className="hover:underline">
                      {viewingCustomer.email}
                    </a>
                  </div>
                  <div className="flex items-center gap-2 text-[#0B132B]">
                    <Phone className="w-3.5 h-3.5 text-[#C89B3C]" />
                    <span>{viewingCustomer.phone || "No phone registered"}</span>
                  </div>
                </div>

                <div className="p-4 border border-[#E8E2D5] rounded-xl space-y-2 text-xs">
                  <div className="font-semibold text-[#0B132B] uppercase tracking-wider text-[11px]">
                    UK Delivery Postcode & Region
                  </div>
                  <div className="flex items-center gap-2 text-[#0B132B]">
                    <MapPin className="w-3.5 h-3.5 text-[#C89B3C]" />
                    <span>Postcode: <strong>{viewingCustomer.postcode}</strong> ({viewingCustomer.city})</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-[#E8E2D5]">
              <button
                type="button"
                onClick={() => setViewingCustomer(null)}
                className="w-full py-2.5 bg-[#0B132B] text-white rounded-lg text-xs font-semibold"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
