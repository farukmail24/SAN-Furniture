"use client";

import React, { useState, useEffect } from "react";
import { ZoomIn, Sparkles, X, ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";

interface ProductGalleryProps {
  images: string[];
  title: string;
}

export function ProductGallery({ images, title }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const activeImage = images?.[selectedIndex] || images?.[0] || "/SanFurnitureLogo.png";

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!isLightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsLightboxOpen(false);
      if (e.key === "ArrowRight") setSelectedIndex((prev) => (prev + 1) % images.length);
      if (e.key === "ArrowLeft") setSelectedIndex((prev) => (prev - 1 + images.length) % images.length);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLightboxOpen, images.length]);

  return (
    <div className="flex flex-col gap-4">
      {/* Full-bleed gallery display: crisp presentation filling container edge-to-edge */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsLightboxOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsLightboxOpen(true);
          }
        }}
        aria-label={`Enlarge photo: ${title}`}
        className="relative aspect-square w-full rounded-2xl overflow-hidden bg-sand-100 border border-[#E8E2D5] group shadow-sm flex items-center justify-center cursor-zoom-in select-none"
      >
        <img
          src={activeImage}
          alt={`${title} - View ${selectedIndex + 1}`}
          fetchPriority="high"
          decoding="async"
          onError={(e) => {
            const target = e.currentTarget;
            if (images?.[0] && target.src !== images[0]) {
              target.src = images[0];
            } else if (!target.src.includes("SanFurnitureLogo.png")) {
              target.src = "/SanFurnitureLogo.png";
            }
          }}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Studio badge */}
        <div className="absolute top-4 left-4 pointer-events-none">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-navy-950/80 backdrop-blur-md text-sand-50 text-[10px] font-semibold tracking-wider uppercase">
            <Sparkles className="w-3 h-3 text-brass-400" />
            Studio Collection
          </span>
        </div>

        {/* Fullscreen zoom pill */}
        <div className="absolute bottom-4 right-4 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy-950/85 backdrop-blur-sm text-sand-50 text-xs font-medium shadow-lg">
            <Maximize2 className="w-3.5 h-3.5 text-brass-400" />
            Click to view full image
          </span>
        </div>
      </div>

      {/* Thumbnail Strip (if multiple images or variations) */}
      {images.length > 1 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-none">
          {images.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setSelectedIndex(idx)}
              aria-label={`View image ${idx + 1}`}
              className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 bg-sand-100 ${
                selectedIndex === idx
                  ? "border-[#00072D] ring-2 ring-[#C89B3C]/50 scale-[1.02]"
                  : "border-[#E8E2D5] opacity-75 hover:opacity-100"
              }`}
            >
              <img
                src={img}
                alt=""
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      {isLightboxOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-navy-950/95 backdrop-blur-xl flex flex-col items-center justify-between p-4 sm:p-8 animate-fade-in"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Header bar */}
          <div
            className="w-full max-w-6xl flex items-center justify-between text-sand-50 pb-4 border-b border-sand-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <p className="text-sm font-bold text-sand-100">{title}</p>
              <p className="text-xs text-sand-400">
                Photo {selectedIndex + 1} of {images.length}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="p-2 rounded-full bg-sand-900/60 hover:bg-sand-800 text-sand-200 hover:text-white transition-colors"
              aria-label="Close full view"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Center Image Container */}
          <div
            className="relative flex-1 w-full max-w-5xl flex items-center justify-center p-2 sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {images.length > 1 && (
              <button
                type="button"
                onClick={() => setSelectedIndex((prev) => (prev - 1 + images.length) % images.length)}
                className="absolute left-2 sm:left-4 z-10 p-2.5 rounded-full bg-navy-900/70 hover:bg-navy-800 text-sand-100 hover:text-white transition-colors border border-sand-700 shadow-xl"
                aria-label="Previous photo"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            <div className="relative max-h-[80vh] max-w-full flex items-center justify-center bg-white rounded-2xl p-2 sm:p-4 shadow-2xl">
              <img
                src={activeImage}
                alt={title}
                className="max-h-[75vh] w-auto max-w-full object-contain rounded-lg"
              />
            </div>

            {images.length > 1 && (
              <button
                type="button"
                onClick={() => setSelectedIndex((prev) => (prev + 1) % images.length)}
                className="absolute right-2 sm:right-4 z-10 p-2.5 rounded-full bg-navy-900/70 hover:bg-navy-800 text-sand-100 hover:text-white transition-colors border border-sand-700 shadow-xl"
                aria-label="Next photo"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Bottom Thumbnails */}
          {images.length > 1 && (
            <div
              className="flex items-center gap-2 overflow-x-auto max-w-xl py-2 px-4 rounded-xl bg-navy-900/60 border border-sand-800"
              onClick={(e) => e.stopPropagation()}
            >
              {images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedIndex(idx)}
                  className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all bg-white flex-shrink-0 ${
                    selectedIndex === idx ? "border-brass-400 scale-105" : "border-sand-700 opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-contain p-0.5" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
