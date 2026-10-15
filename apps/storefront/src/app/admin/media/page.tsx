"use client";

import React, { useState, useEffect } from "react";
import {
  Image as ImageIcon,
  Upload,
  Plus,
  Trash2,
  Copy,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Search,
  Filter,
  Grid,
  List,
  Layers,
  X,
  RefreshCw,
  Eye
} from "lucide-react";
import { MediaAsset } from "@/components/admin/MediaPickerModal";

export default function AdminMediaPage() {
  const [mediaList, setMediaList] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [toastMsg, setToastMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Add Media Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formUrl, setFormUrl] = useState("");
  const [formName, setFormName] = useState("");
  const [formAlt, setFormAlt] = useState("");
  const [formCategory, setFormCategory] = useState("product");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Selected Preview
  const [previewMedia, setPreviewMedia] = useState<MediaAsset | null>(null);

  const fetchMedia = async () => {
    setLoading(true);
    try {
      let url = "http://localhost:9000/api/admin/media";
      const params = new URLSearchParams();
      if (activeCategory !== "all") params.append("category", activeCategory);
      if (searchQuery.trim()) params.append("q", searchQuery.trim());
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.media) setMediaList(data.media);
    } catch (err) {
      console.error("Failed to load media:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, [activeCategory, searchQuery]);

  const handleCopyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 3000);
  };

  const handleAddMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formUrl.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("http://localhost:9000/api/admin/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileUrl: formUrl.trim(),
          fileName: formName.trim(),
          altText: formAlt.trim(),
          category: formCategory,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setToastMsg({ type: "success", text: "Media asset successfully added!" });
        setIsAddModalOpen(false);
        setFormUrl("");
        setFormName("");
        setFormAlt("");
        fetchMedia();
      } else {
        setToastMsg({ type: "error", text: data.error || "Failed to add media" });
      }
    } catch {
      setToastMsg({ type: "error", text: "Network error adding media asset." });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setToastMsg(null), 4000);
    }
  };

  const handleDeleteMedia = async (id: string) => {
    if (!confirm("Are you sure you want to delete this media asset?")) return;
    try {
      const res = await fetch(`http://localhost:9000/api/admin/media/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setToastMsg({ type: "success", text: "Media asset removed." });
        if (previewMedia?.id === id) setPreviewMedia(null);
        fetchMedia();
      }
    } catch {
      setToastMsg({ type: "error", text: "Error removing media asset." });
    } finally {
      setTimeout(() => setToastMsg(null), 3500);
    }
  };

  return (
    <div className="space-y-6 w-full">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E8E2D5]">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#C89B3C] mb-1">
            <ImageIcon className="w-4 h-4" />
            <span>Digital Asset Management (DAM)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif text-[#0B132B]">
            Global Media Library
          </h1>
          <p className="text-sm text-[#4F6D7A] mt-1">
            Central repository for luxury UK furniture photography, swatches, room scenes, and branding assets.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchMedia}
            className="p-2 bg-white border border-[#E8E2D5] hover:bg-slate-50 text-[#0B132B] rounded-lg transition-colors"
            title="Refresh Media"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-[#C89B3C]" : ""}`} />
          </button>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0B132B] hover:bg-[#1C2541] text-[#FAF8F5] rounded-lg text-xs font-semibold transition-all shadow-sm"
          >
            <Plus className="w-4 h-4 text-[#C89B3C]" />
            <span>Add Asset</span>
          </button>
        </div>
      </div>

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

      {/* Toolbar: Category Filters, Search, Grid/List Toggles */}
      <div className="p-4 bg-white border border-[#E8E2D5] rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs">
          {["all", "sofas", "armchairs", "dining", "bedroom", "swatches", "branding"].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-lg font-medium capitalize transition-colors whitespace-nowrap ${
                activeCategory === cat
                  ? "bg-[#0B132B] text-white"
                  : "bg-[#F4F1EA] text-[#4F6D7A] hover:text-[#0B132B]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search & Layout Toggles */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-[#4F6D7A] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Filter by filename or alt text..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 pl-9 pr-3 py-1.5 rounded-lg border border-[#E8E2D5] text-xs text-[#0B132B] focus:outline-none focus:ring-2 focus:ring-[#0B132B]"
            />
          </div>

          <div className="flex items-center bg-[#F4F1EA] p-1 rounded-lg border border-[#E8E2D5]">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded ${viewMode === "grid" ? "bg-white text-[#0B132B] shadow-sm" : "text-[#4F6D7A]"}`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded ${viewMode === "list" ? "bg-white text-[#0B132B] shadow-sm" : "text-[#4F6D7A]"}`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Asset Canvas */}
      {loading ? (
        <div className="py-24 text-center bg-white rounded-xl border border-[#E8E2D5]">
          <RefreshCw className="w-8 h-8 animate-spin text-[#C89B3C] mx-auto mb-2" />
          <span className="text-xs text-[#4F6D7A]">Loading media library...</span>
        </div>
      ) : mediaList.length === 0 ? (
        <div className="py-24 text-center bg-white rounded-xl border border-[#E8E2D5] text-sm text-[#4F6D7A]">
          No assets found matching your query.
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {mediaList.map((item) => (
            <div
              key={item.id}
              className="group bg-white rounded-xl border border-[#E8E2D5] overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div
                onClick={() => setPreviewMedia(item)}
                className="aspect-[4/3] bg-sand-100 overflow-hidden relative cursor-pointer"
              >
                <img
                  src={item.file_url}
                  alt={item.alt_text || item.file_name}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-navy-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <span className="p-1.5 rounded-full bg-white text-[#0B132B] shadow">
                    <Eye className="w-4 h-4" />
                  </span>
                </div>
              </div>

              <div className="p-3 bg-white space-y-2">
                <div className="flex items-center justify-between text-[10px] text-[#4F6D7A]">
                  <span className="px-1.5 py-0.5 rounded bg-sand-100 uppercase font-bold text-[#0B132B]">
                    {item.category}
                  </span>
                  <span>{(item.file_size_bytes / 1024).toFixed(0)} KB</span>
                </div>

                <p className="text-xs font-semibold text-[#0B132B] truncate" title={item.file_name}>
                  {item.file_name}
                </p>

                <div className="pt-2 border-t border-[#E8E2D5] flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => handleCopyUrl(item.file_url, item.id)}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-[#4F6D7A] hover:text-[#0B132B]"
                  >
                    {copiedId === item.id ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-[#C89B3C]" />
                        <span>Copy URL</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteMedia(item.id)}
                    className="p-1 text-[#4F6D7A] hover:text-rose-600 rounded"
                    title="Delete Asset"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-xl border border-[#E8E2D5] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm divide-y divide-[#E8E2D5]">
              <thead className="bg-[#FAF8F5] text-xs font-semibold uppercase text-[#0B132B]">
                <tr>
                  <th className="py-3 px-4">Preview</th>
                  <th className="py-3 px-4">File Name & Alt Text</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Dimensions</th>
                  <th className="py-3 px-4">Size</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2D5]">
                {mediaList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-4">
                      <img
                        src={item.file_url}
                        alt={item.alt_text || item.file_name}
                        className="w-12 h-9 object-cover rounded-md border border-[#E8E2D5]"
                      />
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="font-semibold text-xs text-[#0B132B]">{item.file_name}</div>
                      <div className="text-[11px] text-[#4F6D7A] truncate max-w-xs">{item.alt_text}</div>
                    </td>
                    <td className="py-2.5 px-4 text-xs font-bold uppercase text-[#0B132B]">
                      {item.category}
                    </td>
                    <td className="py-2.5 px-4 text-xs font-mono text-[#4F6D7A]">
                      {item.width_px} × {item.height_px}
                    </td>
                    <td className="py-2.5 px-4 text-xs font-mono text-[#4F6D7A]">
                      {(item.file_size_bytes / 1024).toFixed(0)} KB
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopyUrl(item.file_url, item.id)}
                          className="p-1.5 rounded hover:bg-slate-100 text-[#4F6D7A] hover:text-[#0B132B]"
                          title="Copy Image URL"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteMedia(item.id)}
                          className="p-1.5 rounded hover:bg-rose-50 text-[#4F6D7A] hover:text-rose-600"
                          title="Delete Asset"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: Add New Media Asset */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl border border-[#E8E2D5] shadow-2xl w-full max-w-lg p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D5]">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-[#C89B3C]" />
                <h3 className="font-serif font-bold text-lg text-[#0B132B]">Add New Media Asset</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-[#4F6D7A] hover:text-[#0B132B]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMedia} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#0B132B] mb-1">Image URL *</label>
                <input
                  type="url"
                  required
                  placeholder="https://images.unsplash.com/... or /uploads/..."
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#E8E2D5] text-xs text-[#0B132B]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0B132B] mb-1">File Name</label>
                <input
                  type="text"
                  placeholder="e.g. kensington-sofa-ivory.jpg"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#E8E2D5] text-xs text-[#0B132B]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0B132B] mb-1">Alt Text / SEO Description</label>
                <input
                  type="text"
                  placeholder="e.g. Handcrafted Bouclé Sofa in Warm Ivory"
                  value={formAlt}
                  onChange={(e) => setFormAlt(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#E8E2D5] text-xs text-[#0B132B]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0B132B] mb-1">Asset Category</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#E8E2D5] text-xs text-[#0B132B]"
                >
                  <option value="sofas">Sofas</option>
                  <option value="armchairs">Armchairs</option>
                  <option value="dining">Dining Sets</option>
                  <option value="bedroom">Bedroom</option>
                  <option value="swatches">Fabric Swatches</option>
                  <option value="branding">Branding &amp; Logos</option>
                  <option value="product">General Product</option>
                </select>
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
                  {isSubmitting ? "Adding..." : "Add to Library"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DRAWER: Preview Media */}
      {previewMedia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl border border-[#E8E2D5] shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="aspect-[16/10] bg-sand-100 overflow-hidden relative">
              <img
                src={previewMedia.file_url}
                alt={previewMedia.alt_text}
                className="w-full h-full object-contain bg-slate-900"
              />
              <button
                type="button"
                onClick={() => setPreviewMedia(null)}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 text-white hover:bg-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-serif font-bold text-lg text-[#0B132B]">{previewMedia.file_name}</h3>
                  <p className="text-xs text-[#4F6D7A] mt-0.5">{previewMedia.alt_text}</p>
                </div>
                <span className="px-2.5 py-1 rounded bg-[#0B132B] text-white text-xs uppercase font-bold">
                  {previewMedia.category}
                </span>
              </div>

              <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E8E2D5] font-mono text-xs text-[#0B132B] break-all">
                {previewMedia.file_url}
              </div>

              <div className="flex items-center justify-between text-xs text-[#4F6D7A]">
                <span>Dimensions: <strong>{previewMedia.width_px} × {previewMedia.height_px} px</strong></span>
                <span>File Size: <strong>{(previewMedia.file_size_bytes / 1024).toFixed(0)} KB</strong></span>
                <span>Type: <strong>{previewMedia.mime_type}</strong></span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E8E2D5]">
                <button
                  type="button"
                  onClick={() => handleCopyUrl(previewMedia.file_url, previewMedia.id)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0B132B] text-white rounded-lg text-xs font-semibold"
                >
                  <Copy className="w-4 h-4 text-[#C89B3C]" />
                  <span>Copy Image URL</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
