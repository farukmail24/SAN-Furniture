"use client";

import React, { useState, useEffect } from "react";
import {
  Image as ImageIcon,
  X,
  Upload,
  Check,
  Search,
  Filter,
  RefreshCw,
  ExternalLink
} from "lucide-react";

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
}

export function MediaPickerModal({
  isOpen,
  onClose,
  onSelect,
  currentUrl,
  title = "Select Image from Media Library",
}: MediaPickerModalProps) {
  const [mediaList, setMediaList] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUrl, setSelectedUrl] = useState<string>(currentUrl || "");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newImageAlt, setNewImageAlt] = useState("");
  const [newImageCat, setNewImageCat] = useState("product");
  const [isAdding, setIsAdding] = useState(false);

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
    if (isOpen) {
      fetchMedia();
      setSelectedUrl(currentUrl || "");
    }
  }, [isOpen, activeCategory, searchQuery]);

  if (!isOpen) return null;

  const handleAddNewImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newImageUrl.trim()) return;
    setIsAdding(true);
    try {
      const res = await fetch("http://localhost:9000/api/admin/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileUrl: newImageUrl.trim(),
          altText: newImageAlt.trim(),
          category: newImageCat,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSelectedUrl(newImageUrl.trim());
        setNewImageUrl("");
        setNewImageAlt("");
        fetchMedia();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAdding(false);
    }
  };

  const handleConfirm = () => {
    const selectedItem = mediaList.find((m) => m.file_url === selectedUrl);
    onSelect(selectedUrl, selectedItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl border border-[#E8E2D5] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Top Header */}
        <div className="p-5 border-b border-[#E8E2D5] flex items-center justify-between bg-[#FAF8F5]">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-[#C89B3C]" />
            <h3 className="font-serif font-bold text-lg text-[#0B132B]">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[#4F6D7A] hover:text-[#0B132B] hover:bg-sand-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters & Quick Add Bar */}
        <div className="p-4 border-b border-[#E8E2D5] bg-white space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#4F6D7A] absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search media by filename or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-[#E8E2D5] text-xs text-[#0B132B] focus:outline-none focus:ring-2 focus:ring-[#0B132B]"
              />
            </div>

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
          </div>

          {/* Quick Add Form */}
          <form onSubmit={handleAddNewImage} className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-[#E8E2D5]">
            <input
              type="url"
              required
              placeholder="Paste Image URL (Unsplash, CDN or local path)..."
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              className="flex-1 px-3 py-1.5 rounded-lg border border-[#E8E2D5] text-xs text-[#0B132B]"
            />
            <input
              type="text"
              placeholder="Alt text / description..."
              value={newImageAlt}
              onChange={(e) => setNewImageAlt(e.target.value)}
              className="w-48 px-3 py-1.5 rounded-lg border border-[#E8E2D5] text-xs text-[#0B132B]"
            />
            <select
              value={newImageCat}
              onChange={(e) => setNewImageCat(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-[#E8E2D5] text-xs text-[#0B132B]"
            >
              <option value="product">Product</option>
              <option value="sofas">Sofas</option>
              <option value="armchairs">Armchairs</option>
              <option value="dining">Dining</option>
              <option value="bedroom">Bedroom</option>
              <option value="swatches">Swatches</option>
              <option value="branding">Branding</option>
            </select>
            <button
              type="submit"
              disabled={isAdding || !newImageUrl.trim()}
              className="px-4 py-1.5 bg-[#0B132B] hover:bg-[#1C2541] text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 shrink-0"
            >
              {isAdding ? "Adding..." : "+ Add to Library"}
            </button>
          </form>
        </div>

        {/* Media Grid */}
        <div className="flex-1 p-5 overflow-y-auto">
          {loading ? (
            <div className="py-24 text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-[#C89B3C] mx-auto mb-2" />
              <span className="text-xs text-[#4F6D7A]">Loading media library...</span>
            </div>
          ) : mediaList.length === 0 ? (
            <div className="py-20 text-center text-sm text-[#4F6D7A]">
              No media found. Use the input bar above to add photos.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {mediaList.map((m) => {
                const isSelected = selectedUrl === m.file_url;
                return (
                  <div
                    key={m.id}
                    onClick={() => setSelectedUrl(m.file_url)}
                    className={`group relative rounded-xl border-2 overflow-hidden cursor-pointer transition-all ${
                      isSelected
                        ? "border-[#C89B3C] shadow-lg ring-2 ring-[#C89B3C]/30"
                        : "border-[#E8E2D5] hover:border-navy-400"
                    }`}
                  >
                    <div className="aspect-[4/3] bg-sand-100 overflow-hidden relative">
                      <img
                        src={m.file_url}
                        alt={m.alt_text || m.file_name}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#C89B3C] text-white flex items-center justify-center shadow-md">
                          <Check className="w-4 h-4 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <div className="p-2.5 bg-white text-left">
                      <p className="text-xs font-semibold text-[#0B132B] truncate">{m.file_name}</p>
                      <div className="flex items-center justify-between text-[10px] text-[#4F6D7A] mt-1">
                        <span className="capitalize">{m.category}</span>
                        <span>{m.width_px}×{m.height_px}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div className="p-4 border-t border-[#E8E2D5] bg-[#FAF8F5] flex items-center justify-between">
          <div className="text-xs text-[#4F6D7A] truncate max-w-md">
            {selectedUrl ? (
              <span>Selected: <code className="text-[#0B132B] font-mono">{selectedUrl}</code></span>
            ) : (
              <span>Click an image to select</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-[#E8E2D5] hover:bg-slate-100 text-xs font-semibold text-[#4F6D7A]"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!selectedUrl}
              onClick={handleConfirm}
              className="px-6 py-2 rounded-lg bg-[#0B132B] hover:bg-[#1C2541] text-white text-xs font-semibold transition-colors disabled:opacity-40"
            >
              Use Selected Image
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
