"use client";

import React, { useState, useEffect } from "react";
import {
  Image as ImageIcon,
  X,
  Upload,
  Check,
  Search,
  Filter,
  Copy,
  CheckCircle2,
  Trash2,
  FileImage,
  Sparkles,
  Link as LinkIcon
} from "lucide-react";
import { apiUrl } from "@/lib/api-config";
import { showAlert, showConfirm } from "@/components/ui/AlertModal";

export interface MediaAsset {
  id: string;
  file_name: string;
  file_url: string;
  file_size_bytes: number;
  mime_type: string;
  width_px: number;
  height_px: number;
  alt_text: string;
  category: string;
  created_at: string;
}

interface MediaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string, media?: MediaAsset) => void;
  currentUrl?: string;
  title?: string;
  buttonLabel?: string;
}

export function MediaPickerModal({
  isOpen,
  onClose,
  onSelect,
  currentUrl,
  title = "Add media",
  buttonLabel = "Insert into product",
}: MediaPickerModalProps) {
  const [activeTab, setActiveTab] = useState<"upload" | "library">("library");
  const [mediaList, setMediaList] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [copied, setCopied] = useState(false);

  // Upload Tab Form State
  const [uploadUrl, setUploadUrl] = useState("");
  const [uploadName, setUploadName] = useState("");
  const [uploadAlt, setUploadAlt] = useState("");
  const [uploadCategory, setUploadCategory] = useState("product");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fetchMedia = async () => {
    setLoading(true);
    try {
      let url = apiUrl("/api/admin/media");
      const params = new URLSearchParams();
      if (activeCategory !== "all") params.append("category", activeCategory);
      if (searchQuery.trim()) params.append("q", searchQuery.trim());
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.media) {
        setMediaList(data.media);
        if (currentUrl) {
          const match = data.media.find((m: MediaAsset) => m.file_url === currentUrl);
          if (match) setSelectedAsset(match);
        }
      }
    } catch (err) {
      console.error("Failed to load media:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMedia();
    }
  }, [isOpen, activeCategory, searchQuery]);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadUrl.trim()) return;
    setIsUploading(true);
    setUploadError(null);

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

      if (!res.ok) throw new Error("Failed to upload media asset");

      setUploadUrl("");
      setUploadName("");
      setUploadAlt("");
      await fetchMedia();
      setActiveTab("library");
    } catch (err: any) {
      setUploadError(err.message || "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    const ok = await showConfirm({ title: "Delete Media Asset", message: "Are you sure you want to delete this media asset permanently?", confirmText: "Delete Asset", type: "danger" });
    if (!ok) return;
    try {
      const res = await fetch(apiUrl(`/api/admin/media/${assetId}`), {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      if (selectedAsset?.id === assetId) setSelectedAsset(null);
      await fetchMedia();
    } catch (err: any) {
      await showAlert({ title: "Delete Failed", message: err.message, type: "danger" });
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-navy-950/75 backdrop-blur-xs p-3 sm:p-6 overflow-hidden animate-fade-in">
      <div className="bg-[#f0f0f1] border border-[#c3c4c7] rounded-lg max-w-6xl w-full h-[90vh] flex flex-col shadow-2xl overflow-hidden text-navy-950 font-sans">
        
        {/* WordPress Style Modal Header */}
        <div className="bg-white border-b border-[#dcdcde] px-4 py-2.5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-6">
            <h2 className="text-base font-semibold text-[#1d2327] tracking-tight">{title}</h2>
            <div className="flex items-center gap-1 border-b-2 border-transparent">
              <button
                type="button"
                onClick={() => setActiveTab("upload")}
                className={`px-3 py-1.5 text-xs font-semibold border-b-2 transition-all ${
                  activeTab === "upload"
                    ? "border-navy-950 text-navy-950"
                    : "border-transparent text-[#646970] hover:text-[#135e96]"
                }`}
              >
                Upload files
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("library")}
                className={`px-3 py-1.5 text-xs font-semibold border-b-2 transition-all ${
                  activeTab === "library"
                    ? "border-navy-950 text-navy-950"
                    : "border-transparent text-[#646970] hover:text-[#135e96]"
                }`}
              >
                Media Library
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-[#787c82] hover:text-[#d63638] hover:bg-[#f6f7f7] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 flex overflow-hidden">
          {activeTab === "upload" ? (
            /* Upload Files Tab (WordPress Dropzone) */
            <div className="flex-1 p-8 overflow-y-auto flex flex-col items-center justify-center bg-white">
              <div className="max-w-xl w-full p-8 border-2 border-dashed border-[#c3c4c7] rounded-lg text-center bg-[#fafafa]">
                <div className="w-16 h-16 rounded-full bg-sand-200/60 mx-auto flex items-center justify-center mb-4 text-brass-700">
                  <Upload className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-[#1d2327]">Drop files anywhere to upload</h3>
                <p className="text-xs text-[#646970] mt-1 mb-6">or import high-res photography via direct URL</p>

                {uploadError && (
                  <div className="mb-4 p-2.5 rounded bg-red-50 border border-red-200 text-red-700 text-xs">
                    {uploadError}
                  </div>
                )}

                <form onSubmit={handleUploadSubmit} className="space-y-3 text-left">
                  <div>
                    <label className="block text-xs font-semibold text-[#1d2327] mb-1">
                      Direct Image Web URL <span className="text-red-500">*</span>
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
                        Attachment Title
                      </label>
                      <input
                        type="text"
                        value={uploadName}
                        onChange={(e) => setUploadName(e.target.value)}
                        placeholder="e.g. Richmond 3-Seater Ivory"
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
                        <option value="fabric">Material & Texture</option>
                        <option value="logo">Brand Logos</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1d2327] mb-1">
                      Alternative Text (Alt Text)
                    </label>
                    <input
                      type="text"
                      value={uploadAlt}
                      onChange={(e) => setUploadAlt(e.target.value)}
                      placeholder="Describe the image for SEO and screen readers"
                      className="w-full px-3 py-2 bg-white border border-[#8c8f94] rounded text-xs text-[#1d2327] focus:outline-none focus:border-[#2271b1]"
                    />
                  </div>

                  <div className="pt-2 text-center">
                    <button
                      type="submit"
                      disabled={isUploading}
                      className="px-5 py-2 rounded bg-navy-950 hover:bg-navy-900 text-sand-50 font-semibold text-xs transition-colors disabled:opacity-50"
                    >
                      {isUploading ? "Uploading to Library..." : "Select & Ingest File"}
                    </button>
                  </div>
                </form>

                <div className="mt-6 pt-4 border-t border-[#dcdcde] text-[11px] text-[#646970]">
                  Maximum upload file size: 64 MB. Supported formats: JPG, WebP, PNG, SVG.
                </div>
              </div>
            </div>
          ) : (
            /* Media Library Tab (WordPress Grid + Attachment Details Sidebar) */
            <>
              {/* Left Side: Filter Bar + Image Grid */}
              <div className="flex-1 flex flex-col bg-white border-r border-[#dcdcde] overflow-hidden">
                {/* Filter & Search Bar */}
                <div className="p-3 bg-[#f6f7f7] border-b border-[#dcdcde] flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <select
                      value={activeCategory}
                      onChange={(e) => setActiveCategory(e.target.value)}
                      className="px-2.5 py-1.5 bg-white border border-[#8c8f94] rounded text-xs text-[#1d2327] focus:outline-none focus:border-[#2271b1]"
                    >
                      <option value="all">All media items</option>
                      <option value="sofas">Sofas</option>
                      <option value="armchairs">Armchairs</option>
                      <option value="dining">Dining</option>
                      <option value="beds">Beds</option>
                      <option value="tables">Tables</option>
                      <option value="fabric">Material & Texture</option>
                      <option value="logo">Logos</option>
                    </select>

                    <select
                      defaultValue="all"
                      className="px-2.5 py-1.5 bg-white border border-[#8c8f94] rounded text-xs text-[#1d2327] focus:outline-none focus:border-[#2271b1]"
                    >
                      <option value="all">All dates</option>
                      <option value="2026-10">October 2026</option>
                      <option value="2026-09">September 2026</option>
                    </select>
                  </div>

                  <div className="relative w-64">
                    <Search className="w-3.5 h-3.5 text-[#646970] absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search media items..."
                      className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#8c8f94] rounded text-xs text-[#1d2327] focus:outline-none focus:border-[#2271b1]"
                    />
                  </div>
                </div>

                {/* Thumbnails Grid */}
                <div className="flex-1 p-4 overflow-y-auto">
                  {loading ? (
                    <div className="p-12 text-center text-xs text-[#646970]">
                      Loading WordPress media items...
                    </div>
                  ) : mediaList.length === 0 ? (
                    <div className="p-12 text-center">
                      <FileImage className="w-10 h-10 text-[#c3c4c7] mx-auto mb-2" />
                      <p className="text-xs font-semibold text-[#1d2327]">No media files found</p>
                      <button
                        type="button"
                        onClick={() => setActiveTab("upload")}
                        className="mt-3 text-xs text-[#2271b1] hover:underline"
                      >
                        Upload your first image
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                      {mediaList.map((asset) => {
                        const isSelected = selectedAsset?.id === asset.id;
                        return (
                          <div
                            key={asset.id}
                            onClick={() => setSelectedAsset(asset)}
                            className={`group relative aspect-square bg-[#f0f0f1] rounded cursor-pointer overflow-hidden border-2 transition-all ${
                              isSelected
                                ? "border-[#2271b1] ring-2 ring-[#2271b1]/30 shadow-md"
                                : "border-transparent hover:border-[#8c8f94]"
                            }`}
                          >
                            <img
                              src={asset.file_url}
                              alt={asset.alt_text || asset.file_name}
                              className="w-full h-full object-cover"
                            />
                            {isSelected && (
                              <div className="absolute top-1 right-1 w-5 h-5 bg-[#2271b1] text-white rounded flex items-center justify-center shadow-sm">
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              </div>
                            )}
                            <div className="absolute inset-x-0 bottom-0 bg-navy-950/80 text-white p-1 text-[9px] truncate opacity-0 group-hover:opacity-100 transition-opacity">
                              {asset.file_name}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Side: WordPress Attachment Details Sidebar */}
              <div className="w-80 bg-[#f6f7f7] flex flex-col overflow-y-auto flex-shrink-0 border-l border-[#dcdcde]">
                <div className="p-4 border-b border-[#dcdcde] bg-white">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#646970]">
                    Attachment Details
                  </h3>
                </div>

                {selectedAsset ? (
                  <div className="p-4 space-y-4 text-xs">
                    {/* Preview Thumbnail */}
                    <div className="aspect-video bg-[#e0e0e0] rounded overflow-hidden border border-[#dcdcde]">
                      <img
                        src={selectedAsset.file_url}
                        alt={selectedAsset.file_name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Metadata summary */}
                    <div className="space-y-1 text-[#646970] text-[11px] pb-3 border-b border-[#dcdcde]">
                      <p className="font-bold text-[#1d2327] truncate">{selectedAsset.file_name}</p>
                      <p>{new Date(selectedAsset.created_at).toLocaleDateString("en-GB", { month: "long", day: "numeric", year: "numeric" })}</p>
                      <p>{(selectedAsset.file_size_bytes / 1024).toFixed(0)} KB</p>
                      <p>{selectedAsset.width_px} &times; {selectedAsset.height_px} pixels</p>
                      <button
                        type="button"
                        onClick={() => handleDeleteAsset(selectedAsset.id)}
                        className="text-[#d63638] hover:underline pt-1 inline-flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete permanently</span>
                      </button>
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
                          placeholder="Learn how to describe the purpose of the image"
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
                          File URL
                        </label>
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            readOnly
                            value={selectedAsset.file_url}
                            className="w-full px-2.5 py-1 bg-[#f0f0f1] border border-[#dcdcde] rounded text-[10px] text-[#646970] font-mono truncate select-all"
                          />
                          <button
                            type="button"
                            onClick={() => handleCopyUrl(selectedAsset.file_url)}
                            className="px-2 py-1 bg-white border border-[#8c8f94] rounded hover:bg-[#f0f0f1] text-[#1d2327] flex items-center justify-center flex-shrink-0"
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
                    Select an item from the library to view attachment details.
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* WordPress Style Footer Action Bar */}
        <div className="bg-white border-t border-[#dcdcde] px-4 py-3 flex items-center justify-between flex-shrink-0">
          <div className="text-xs text-[#646970]">
            {selectedAsset ? (
              <span className="font-semibold text-[#1d2327]">
                Selected: <span className="text-[#2271b1]">{selectedAsset.file_name}</span>
              </span>
            ) : (
              <span>No image selected</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded border border-[#c3c4c7] text-[#2c3338] hover:bg-[#f6f7f7] font-semibold text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!selectedAsset}
              onClick={() => {
                if (selectedAsset) {
                  onSelect(selectedAsset.file_url, selectedAsset);
                  onClose();
                }
              }}
              className="px-4 py-1.5 rounded bg-[#2271b1] hover:bg-[#135e96] text-white font-semibold text-xs shadow-xs transition-colors disabled:opacity-40 disabled:hover:bg-[#2271b1]"
            >
              {buttonLabel}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
