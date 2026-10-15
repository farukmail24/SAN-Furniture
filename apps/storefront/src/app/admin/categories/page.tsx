"use client";

import React, { useState, useEffect } from "react";
import {
  FolderTree,
  Plus,
  Edit2,
  Trash2,
  Layers,
  CheckCircle2,
  AlertCircle,
  X,
  Image as ImageIcon,
  ExternalLink
} from "lucide-react";
import { DataTable, ColumnDef } from "@/components/admin/DataTable";
import { MediaPickerModal } from "@/components/admin/MediaPickerModal";
import { apiUrl } from "@/lib/api-config";

interface CategoryRecord {
  id: string;
  name: string;
  handle: string;
  description: string;
  hero_image: string;
  products_count: number;
  created_at: string;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryRecord | null>(null);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [mediaTarget, setMediaTarget] = useState<"add" | "edit">("add");

  // Add Form state
  const [formName, setFormName] = useState("");
  const [formHandle, setFormHandle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formHeroImage, setFormHeroImage] = useState("https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=85");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/admin/categories"));
      const data = await res.json();
      if (data.categories) setCategories(data.categories);
    } catch (err) {
      console.error("Failed to load categories:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch(apiUrl("/api/admin/categories"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          handle: formHandle,
          description: formDesc,
          heroImage: formHeroImage,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setToastMsg({ type: "success", text: `Category "${formName}" created!` });
        setIsAddModalOpen(false);
        setFormName("");
        setFormHandle("");
        setFormDesc("");
        fetchCategories();
      } else {
        setToastMsg({ type: "error", text: data.error || "Failed to create category" });
      }
    } catch {
      setToastMsg({ type: "error", text: "Network error creating category." });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setToastMsg(null), 4000);
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(apiUrl(`/api/admin/categories/${editingCategory.id}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editingCategory.name,
          handle: editingCategory.handle,
          description: editingCategory.description,
          heroImage: editingCategory.hero_image,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setToastMsg({ type: "success", text: "Category updated successfully!" });
        setEditingCategory(null);
        fetchCategories();
      } else {
        setToastMsg({ type: "error", text: data.error || "Failed to update category" });
      }
    } catch {
      setToastMsg({ type: "error", text: "Network error updating category." });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setToastMsg(null), 4000);
    }
  };

  const handleDeleteCategory = async (catId: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    try {
      const res = await fetch(apiUrl(`/api/admin/categories/${catId}`), {
        method: "DELETE",
      });
      if (res.ok) {
        setToastMsg({ type: "success", text: "Category deleted." });
        fetchCategories();
      }
    } catch {
      setToastMsg({ type: "error", text: "Error deleting category." });
    } finally {
      setTimeout(() => setToastMsg(null), 3500);
    }
  };

  const columns: ColumnDef<CategoryRecord>[] = [
    {
      key: "hero_image",
      header: "Visual",
      sortable: false,
      searchable: false,
      width: "80px",
      cell: (row) => (
        <img
          src={row.hero_image}
          alt={row.name}
          className="w-12 h-9 object-cover rounded-md border border-[#E8E2D5]"
        />
      ),
    },
    {
      key: "name",
      header: "Category Name & Slug",
      cell: (row) => (
        <div>
          <div className="font-semibold text-[#0B132B]">{row.name}</div>
          <div className="text-[11px] font-mono text-[#4F6D7A]">/categories/{row.handle}</div>
        </div>
      ),
    },
    {
      key: "description",
      header: "Description",
      cell: (row) => (
        <div className="text-xs text-[#4F6D7A] max-w-sm truncate">
          {row.description || "Bespoke handcrafted UK luxury furniture collection."}
        </div>
      ),
    },
    {
      key: "products_count",
      header: "Live Products",
      sortable: true,
      cell: (row) => (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#0B132B] text-white">
          {row.products_count} Items
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
            onClick={() => setEditingCategory(row)}
            className="p-1.5 rounded hover:bg-slate-100 text-[#4F6D7A] hover:text-blue-700"
            title="Edit Category"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleDeleteCategory(row.id)}
            className="p-1.5 rounded hover:bg-rose-50 text-[#4F6D7A] hover:text-rose-700"
            title="Delete Category"
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

      {/* Advanced Global DataTable */}
      <DataTable
        title="Furniture Categories & Taxonomy"
        subtitle="Manage product categories, URL slugs, and hero imagery for storefront navigation and filter menus."
        data={categories}
        columns={columns}
        keyExtractor={(c) => c.id}
        searchPlaceholder="Search categories by name, handle, or description..."
        loading={loading}
        onRefresh={fetchCategories}
        exportFileName="san_furniture_categories"
        actions={
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0B132B] hover:bg-[#1C2541] text-[#FAF8F5] rounded-lg text-xs font-semibold transition-all shadow-sm"
          >
            <Plus className="w-4 h-4 text-[#C89B3C]" />
            <span>Add Category</span>
          </button>
        }
      />

      {/* MODAL 1: Add Category */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl border border-[#E8E2D5] shadow-2xl w-full max-w-lg p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D5]">
              <div className="flex items-center gap-2">
                <FolderTree className="w-5 h-5 text-[#C89B3C]" />
                <h3 className="font-serif font-bold text-lg text-[#0B132B]">Add Furniture Category</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-[#4F6D7A] hover:text-[#0B132B]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#0B132B] mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Footstools &amp; Benches"
                  value={formName}
                  onChange={(e) => {
                    setFormName(e.target.value);
                    setFormHandle(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-[#E8E2D5] text-xs text-[#0B132B]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0B132B] mb-1">URL Handle (Slug)</label>
                <input
                  type="text"
                  required
                  placeholder="footstools-benches"
                  value={formHandle}
                  onChange={(e) => setFormHandle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#E8E2D5] text-xs font-mono text-[#0B132B]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0B132B] mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Bespoke handcrafted accent seating and ottomans..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#E8E2D5] text-xs text-[#0B132B]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-[#0B132B]">Hero Image URL</label>
                  <button
                    type="button"
                    onClick={() => {
                      setMediaTarget("add");
                      setIsMediaModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#C89B3C] hover:underline"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Choose from Media Library</span>
                  </button>
                </div>
                <input
                  type="url"
                  required
                  value={formHeroImage}
                  onChange={(e) => setFormHeroImage(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#E8E2D5] text-xs text-[#0B132B]"
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
                  {isSubmitting ? "Creating..." : "Save Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Edit Category */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl border border-[#E8E2D5] shadow-2xl w-full max-w-lg p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D5]">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-[#C89B3C]" />
                <h3 className="font-serif font-bold text-lg text-[#0B132B]">Edit Category</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingCategory(null)}
                className="text-[#4F6D7A] hover:text-[#0B132B]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#0B132B] mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  value={editingCategory.name}
                  onChange={(e) =>
                    setEditingCategory({ ...editingCategory, name: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[#E8E2D5] text-xs text-[#0B132B]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0B132B] mb-1">URL Handle</label>
                <input
                  type="text"
                  required
                  value={editingCategory.handle}
                  onChange={(e) =>
                    setEditingCategory({ ...editingCategory, handle: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[#E8E2D5] text-xs font-mono text-[#0B132B]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0B132B] mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editingCategory.description || ""}
                  onChange={(e) =>
                    setEditingCategory({ ...editingCategory, description: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[#E8E2D5] text-xs text-[#0B132B]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-[#0B132B]">Hero Image URL</label>
                  <button
                    type="button"
                    onClick={() => {
                      setMediaTarget("edit");
                      setIsMediaModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#C89B3C] hover:underline"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Choose from Media Library</span>
                  </button>
                </div>
                <input
                  type="url"
                  required
                  value={editingCategory.hero_image}
                  onChange={(e) =>
                    setEditingCategory({ ...editingCategory, hero_image: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[#E8E2D5] text-xs text-[#0B132B]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E8E2D5]">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="px-4 py-2 rounded-lg border border-[#E8E2D5] text-xs font-semibold text-[#4F6D7A] hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 rounded-lg bg-[#0B132B] hover:bg-[#1C2541] text-white text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "Updating..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reusable Media Library Picker Modal */}
      <MediaPickerModal
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        onSelect={(url) => {
          if (mediaTarget === "add") {
            setFormHeroImage(url);
          } else if (editingCategory) {
            setEditingCategory({ ...editingCategory, hero_image: url });
          }
        }}
        currentUrl={mediaTarget === "add" ? formHeroImage : editingCategory?.hero_image}
      />
    </div>
  );
}
