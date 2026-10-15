"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
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
  Eye,
  Check,
  ChevronRight,
  FileImage,
  Sparkles
} from "lucide-react";
import { MediaAsset } from "@/components/admin/MediaPickerModal";
import { apiUrl } from "@/lib/api-config";
import { fetchWithSwr, invalidateCache, getCachedData } from "@/lib/api-cache";

export default function AdminMediaPage() {
  const cachedMedia = getCachedData<{ media: MediaAsset[] }>(apiUrl("/api/admin/media"));
  const [mediaList, setMediaList] = useState<MediaAsset[]>(() => cachedMedia?.media || []);
  const [loading, setLoading] = useState<boolean>(() => !cachedMedia?.media?.length);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null);
  const [toastMsg, setToastMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // WordPress Upload Area Toggle
  const [showUploader, setShowUploader] = useState(false);
  const [uploadUrl, setUploadUrl] = useState("");
  const [uploadName, setUploadName] = useState("");
  const [uploadAlt, setUploadAlt] = useState("");
  const [uploadCategory, setUploadCategory] = useState("sofas");
  const [isUploading, setIsUploading] = useState(false);

  // Bulk select mode
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const fetchMedia = async () => {
    try {
      let url = apiUrl("/api/admin/media");
      const params = new URLSearchParams();
      if (activeCategory !== "all") params.append("category", activeCategory);
      if (searchQuery.trim()) params.append("q", searchQuery.trim());
      if (params.toString()) url += `?${params.toString()}`;

      fetchWithSwr(
        url,
        (data: any, isCached) => {
          if (data.media) {
            setMediaList(data.media);
            if (isCached) setLoading(false);
            if (selectedAsset) {
              const updated = data.media.find((m: MediaAsset) => m.id === selectedAsset.id);
              if (updated) setSelectedAsset(updated);
            }
          }
        }
      ).finally(() => setLoading(false));
    } catch (err) {
      console.error("Failed to load media:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, [activeCategory, searchQuery]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadUrl.trim()) return;
    setIsUploading(true);

    try {
      const res = await fetch(apiUrl("/api/admin/media"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: uploadName || uploadUrl.split("/").pop()?.split("?")[0] || "furniture-asset.jpg",
          fileUrl: uploadUrl,
          altText: uploadAlt || uploadName || "SAN Handcrafted Furniture",
          category: uploadCategory,
          mimeType: "image/jpeg",
          widthPx: 1200,
          heightPx: 800,
          fileSizeBytes: 320000,
        }),
      });

      if (!res.ok) throw new Error("Upload failed");

      invalidateCache("/api/admin/media");
      setUploadUrl("");
      setUploadName("");
      setUploadAlt("");
      setShowUploader(false);
      setToastMsg({ type: "success", text: "New media asset uploaded to MySQL library!" });
      await fetchMedia();
      setTimeout(() => setToastMsg(null), 3500);
    } catch (err: any) {
      setToastMsg({ type: "error", text: err.message || "Failed to upload image" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this media asset permanently?")) return;
    try {
      const res = await fetch(apiUrl(`/api/admin/media/${id}`), { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");

      invalidateCache("/api/admin/media");
      if (selectedAsset?.id === id) setSelectedAsset(null);
      setToastMsg({ type: "success", text: "Media asset deleted permanently." });
      await fetchMedia();
      setTimeout(() => setToastMsg(null), 3000);
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.length} selected items permanently?`)) return;
    try {
      for (const id of selectedIds) {
        await fetch(apiUrl(`/api/admin/media/${id}`), { method: "DELETE" });
      }
      setSelectedIds([]);
      setBulkMode(false);
      setToastMsg({ type: "success", text: "Selected items deleted permanently." });
      await fetchMedia();
      setTimeout(() => setToastMsg(null), 3000);
    } catch (err: any) {
      alert("Error deleting bulk items: " + err.message);
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* WordPress Admin Style Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-navy-500 mb-1">
            <Link href="/admin" className="hover:text-navy-950">Operations Suite</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="font-semibold text-navy-900">Media</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-bold text-navy-950">
              Media Library
            </h1>
            <button
              type="button"
              onClick={() => setShowUploader(!showUploader)}
              className="px-3 py-1 rounded border border-[#2271b1] text-[#2271b1] hover:bg-[#2271b1] hover:text-white font-semibold text-xs transition-colors"
            >
              {showUploader ? "Cancel Upload" : "Add New Media File"}
            </button>
          </div>
          <p className="text-xs text-navy-600 mt-1">
            WordPress-style Digital Asset Management (DAM) &bull; Cloud Furniture Photography &bull; Alt-Text SEO Engine
          </p>
        </div>

        <div className="flex items-center gap-2">
          {bulkMode ? (
            <>
              <button
                type="button"
                disabled={selectedIds.length === 0}
                onClick={handleBulkDelete}
                className="px-3 py-1.5 rounded bg-red-600 text-white font-semibold text-xs hover:bg-red-700 disabled:opacity-50"
              >
                Delete Selected ({selectedIds.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setBulkMode(false);
                  setSelectedIds([]);
                }}
                className="px-3 py-1.5 rounded border border-[#8c8f94] bg-white text-xs font-semibold text-[#2c3338] hover:bg-[#f6f7f7]"
              >
                Cancel Selection
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setBulkMode(true)}
              className="px-3 py-1.5 rounded border border-[#8c8f94] bg-white text-xs font-semibold text-[#2c3338] hover:bg-[#f6f7f7]"
            >
              Bulk select
            </button>
          )}
        </div>
      </div>

      {toastMsg && (
        <div
          className={`p-3 rounded-lg text-xs font-semibold flex items-center gap-2 ${
            toastMsg.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}
        >
          {toastMsg.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600" />
          )}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* WordPress Style Drag & Drop Upload Container */}
      {showUploader && (
        <div className="p-6 bg-white border-2 border-dashed border-[#c3c4c7] rounded-xl text-center shadow-xs animate-fade-in">
          <div className="max-w-xl mx-auto space-y-4">
            <div className="w-14 h-14 rounded-full bg-sand-200/60 mx-auto flex items-center justify-center text-brass-700">
              <Upload className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-[#1d2327]">Drop files anywhere to upload</h3>
            <p className="text-xs text-[#646970]">or paste a verified luxury photography image URL</p>

            <form onSubmit={handleUpload} className="space-y-3 text-left">
              <div>
                <label className="block text-xs font-semibold text-[#1d2327] mb-1">
                  Image Web URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  required
                  value={uploadUrl}
                  onChange={(e) => setUploadUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-1555041469..."
                  className="w-full px-3 py-2 bg-white border border-[#8c8f94] rounded text-xs text-[#1d2327] focus:outline-none focus:border-[#2271b1]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1d2327] mb-1">
                    File Title
                  </label>
                  <input
                    type="text"
                    value={uploadName}
                    onChange={(e) => setUploadName(e.target.value)}
                    placeholder="e.g. Richmond 3-Seater Ivory Bouclé"
                    className="w-full px-3 py-2 bg-white border border-[#8c8f94] rounded text-xs text-[#1d2327] focus:outline-none focus:border-[#2271b1]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1d2327] mb-1">
                    Category
                  </label>
                  <select
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#8c8f94] rounded text-xs text-[#1d2327] focus:outline-none focus:border-[#2271b1]"
                  >
                    <option value="sofas">Sofas &amp; Lounges</option>
                    <option value="armchairs">Accent Armchairs</option>
                    <option value="dining">Dining Furniture</option>
                    <option value="beds">Luxury Beds</option>
                    <option value="tables">Coffee &amp; Side Tables</option>
                    <option value="fabric">Fabric Swatches</option>
                    <option value="logo">Brand Logos</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1d2327] mb-1">
                  Alternative Text (SEO Alt Tag)
                </label>
                <input
                  type="text"
                  value={uploadAlt}
                  onChange={(e) => setUploadAlt(e.target.value)}
                  placeholder="Describe image for screen readers and UK search index"
                  className="w-full px-3 py-2 bg-white border border-[#8c8f94] rounded text-xs text-[#1d2327] focus:outline-none focus:border-[#2271b1]"
                />
              </div>

              <div className="pt-2 text-center flex items-center justify-center gap-3">
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-5 py-2 rounded bg-[#2271b1] hover:bg-[#135e96] text-white font-semibold text-xs shadow-xs transition-colors disabled:opacity-50"
                >
                  {isUploading ? "Uploading..." : "Save to Media Library"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowUploader(false)}
                  className="px-4 py-2 rounded border border-[#8c8f94] text-xs font-semibold text-[#2c3338] hover:bg-[#f6f7f7]"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WordPress Filter Bar */}
      <div className="p-3 bg-white border border-[#dcdcde] rounded-lg flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2">
          <select
            value={activeCategory}
            onChange={(e) => setActiveCategory(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-[#8c8f94] rounded text-xs text-[#1d2327] focus:outline-none focus:border-[#2271b1]"
          >
            <option value="all">All media items ({mediaList.length})</option>
            <option value="sofas">Sofas &amp; Lounges</option>
            <option value="armchairs">Armchairs</option>
            <option value="dining">Dining</option>
            <option value="beds">Beds</option>
            <option value="tables">Tables</option>
            <option value="fabric">Fabric Swatches</option>
            <option value="logo">Logos &amp; Branding</option>
          </select>

          <select
            defaultValue="all"
            className="px-2.5 py-1.5 bg-white border border-[#8c8f94] rounded text-xs text-[#1d2327] focus:outline-none focus:border-[#2271b1]"
          >
            <option value="all">All dates</option>
            <option value="2026-10">October 2026</option>
            <option value="2026-09">September 2026</option>
          </select>

          <button
            type="button"
            onClick={fetchMedia}
            className="p-1.5 rounded border border-[#8c8f94] text-[#2c3338] hover:bg-[#f6f7f7]"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="relative w-72">
          <Search className="w-3.5 h-3.5 text-[#646970] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search media items..."
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-[#8c8f94] rounded text-xs text-[#1d2327] focus:outline-none focus:border-[#2271b1]"
          />
        </div>
      </div>

      {/* Main Container: Grid + WordPress Attachment Details Sidebar */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Side: Thumbnail Grid */}
        <div className="flex-1 bg-white border border-[#dcdcde] rounded-lg p-4 min-h-[480px] shadow-xs">
          {loading ? (
            <div className="p-16 text-center text-xs text-[#646970]">
              Loading WordPress media items...
            </div>
          ) : mediaList.length === 0 ? (
            <div className="p-16 text-center">
              <FileImage className="w-12 h-12 text-[#c3c4c7] mx-auto mb-3" />
              <p className="text-sm font-semibold text-[#1d2327]">No media items found</p>
              <button
                type="button"
                onClick={() => setShowUploader(true)}
                className="mt-3 text-xs text-[#2271b1] hover:underline"
              >
                Upload your first image now
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {mediaList.map((asset) => {
                const isSelected = selectedAsset?.id === asset.id;
                const isBulkChecked = selectedIds.includes(asset.id);

                return (
                  <div
                    key={asset.id}
                    onClick={() => {
                      if (bulkMode) {
                        setSelectedIds((prev) =>
                          prev.includes(asset.id)
                            ? prev.filter((i) => i !== asset.id)
                            : [...prev, asset.id]
                        );
                      } else {
                        setSelectedAsset(asset);
                      }
                    }}
                    className={`group relative aspect-square bg-[#f0f0f1] rounded cursor-pointer overflow-hidden border-2 transition-all ${
                      bulkMode
                        ? isBulkChecked
                          ? "border-[#2271b1] ring-2 ring-[#2271b1]/30"
                          : "border-transparent hover:border-[#8c8f94]"
                        : isSelected
                        ? "border-[#2271b1] ring-2 ring-[#2271b1]/30 shadow-md"
                        : "border-transparent hover:border-[#8c8f94]"
                    }`}
                  >
                    <img
                      src={asset.file_url}
                      alt={asset.alt_text || asset.file_name}
                      className="w-full h-full object-cover"
                    />

                    {bulkMode && isBulkChecked && (
                      <div className="absolute top-1 right-1 w-5 h-5 bg-[#2271b1] text-white rounded flex items-center justify-center shadow-xs">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}

                    {!bulkMode && isSelected && (
                      <div className="absolute top-1 right-1 w-5 h-5 bg-[#2271b1] text-white rounded flex items-center justify-center shadow-xs">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}

                    <div className="absolute inset-x-0 bottom-0 bg-navy-950/80 text-white p-1 text-[10px] truncate opacity-0 group-hover:opacity-100 transition-opacity">
                      {asset.file_name}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: WordPress Attachment Details Sidebar */}
        <div className="w-full lg:w-80 bg-[#f6f7f7] border border-[#dcdcde] rounded-lg shadow-xs overflow-hidden flex-shrink-0">
          <div className="p-3.5 border-b border-[#dcdcde] bg-white">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#646970]">
              Attachment Details
            </h3>
          </div>

          {selectedAsset ? (
            <div className="p-4 space-y-4 text-xs">
              {/* Preview Image */}
              <div className="aspect-video bg-[#e0e0e0] rounded overflow-hidden border border-[#dcdcde]">
                <img
                  src={selectedAsset.file_url}
                  alt={selectedAsset.file_name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Metadata summary */}
              <div className="space-y-1 text-[#646970] text-[11px] pb-3 border-b border-[#dcdcde]">
                <p className="font-bold text-[#1d2327] truncate text-xs">{selectedAsset.file_name}</p>
                <p>Uploaded: {new Date(selectedAsset.created_at).toLocaleDateString("en-GB", { month: "long", day: "numeric", year: "numeric" })}</p>
                <p>File size: {(selectedAsset.file_size_bytes / 1024).toFixed(0)} KB</p>
                <p>Dimensions: {selectedAsset.width_px} &times; {selectedAsset.height_px} pixels</p>
                <div className="pt-2 flex items-center gap-3">
                  <a
                    href={selectedAsset.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#2271b1] hover:underline inline-flex items-center gap-1"
                  >
                    <span>View original</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <span className="text-[#dcdcde]">&bull;</span>
                  <button
                    type="button"
                    onClick={() => handleDelete(selectedAsset.id)}
                    className="text-[#d63638] hover:underline"
                  >
                    Delete permanently
                  </button>
                </div>
              </div>

              {/* Editable Fields */}
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#1d2327] mb-1">
                    Alternative Text
                  </label>
                  <textarea
                    rows={2}
                    defaultValue={selectedAsset.alt_text}
                    placeholder="Describe image for SEO and screen readers"
                    className="w-full px-2.5 py-1.5 bg-white border border-[#8c8f94] rounded text-xs text-[#1d2327] focus:outline-none focus:border-[#2271b1]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#1d2327] mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    defaultValue={selectedAsset.file_name}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#8c8f94] rounded text-xs text-[#1d2327] focus:outline-none focus:border-[#2271b1]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#1d2327] mb-1">
                    Category Tag
                  </label>
                  <span className="inline-block px-2 py-0.5 rounded bg-sand-200 text-[#1d2327] text-[11px] capitalize font-medium">
                    {selectedAsset.category}
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#1d2327] mb-1">
                    File URL
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      readOnly
                      value={selectedAsset.file_url}
                      className="w-full px-2.5 py-1.5 bg-[#f0f0f1] border border-[#dcdcde] rounded text-[10px] text-[#646970] font-mono truncate select-all"
                    />
                    <button
                      type="button"
                      onClick={() => handleCopyUrl(selectedAsset.file_url)}
                      className="px-2.5 py-1.5 bg-white border border-[#8c8f94] rounded hover:bg-[#f0f0f1] text-[#1d2327] flex items-center justify-center flex-shrink-0"
                      title="Copy URL"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-[#646970]">
              Click any image in the grid to view its attachment details, edit SEO tags, or copy URL.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
