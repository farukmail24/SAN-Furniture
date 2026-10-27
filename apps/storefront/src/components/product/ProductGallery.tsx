"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";

interface ProductGalleryProps {
  images: string[];
  title: string;
}

export function ProductGallery({ images, title }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const validImages = Array.isArray(images) && images.length > 0 ? images : ["/SanFurnitureLogo.png"];
  const activeImage = validImages[selectedIndex] || validImages[0];

  const handlePrev = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      setSelectedIndex((prev) => (prev - 1 + validImages.length) % validImages.length);
    },
    [validImages.length]
  );

  const handleNext = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      setSelectedIndex((prev) => (prev + 1) % validImages.length);
    },
    [validImages.length]
  );

  // Keyboard navigation & body scroll lock for lightbox
  useEffect(() => {
    if (!isLightboxOpen) return;

    // Lock background scroll
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsLightboxOpen(false);
      if (e.key === "ArrowRight") setSelectedIndex((prev) => (prev + 1) % validImages.length);
      if (e.key === "ArrowLeft") setSelectedIndex((prev) => (prev - 1 + validImages.length) % validImages.length);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isLightboxOpen, validImages.length]);

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Main Hero Product Image Container */}
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
            if (validImages[0] && target.src !== validImages[0]) {
              target.src = validImages[0];
            } else if (!target.src.includes("SanFurnitureLogo.png")) {
              target.src = "/SanFurnitureLogo.png";
            }
          }}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Previous Image Chevron Button (<) */}
        {validImages.length > 1 && (
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous product image"
            className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/90 hover:bg-white text-navy-950 flex items-center justify-center shadow-lg border border-sand-300 transition-all duration-200 active:scale-90 hover:scale-110 opacity-90 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-brass-500"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-navy-950" />
          </button>
        )}

        {/* Next Image Chevron Button (>) */}
        {validImages.length > 1 && (
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next product image"
            className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/90 hover:bg-white text-navy-950 flex items-center justify-center shadow-lg border border-sand-300 transition-all duration-200 active:scale-90 hover:scale-110 opacity-90 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-brass-500"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-navy-950" />
          </button>
        )}

        {/* Image Counter Badge */}
        {validImages.length > 1 && (
          <div className="absolute top-3.5 right-3.5 pointer-events-none z-10">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-navy-950/75 backdrop-blur-md text-sand-50 text-[11px] font-semibold tracking-wider shadow-sm">
              {selectedIndex + 1} / {validImages.length}
            </span>
          </div>
        )}

        {/* Fullscreen Zoom Cue (Bottom Right) */}
        <div className="absolute bottom-3.5 right-3.5 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy-950/85 backdrop-blur-md text-sand-50 text-xs font-medium shadow-lg">
            <Maximize2 className="w-3.5 h-3.5 text-brass-400" />
            Click to view full screen
          </span>
        </div>
      </div>

      {/* Thumbnail Strip */}
      {validImages.length > 1 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-none">
          {validImages.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setSelectedIndex(idx)}
              aria-label={`View photo ${idx + 1}`}
              className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 bg-sand-100 ${
                selectedIndex === idx
                  ? "border-navy-950 ring-2 ring-brass-500/50 scale-[1.02]"
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

      {/* Fullscreen Lightbox Modal (Teleported to document.body via Portal) */}
      {isLightboxOpen && mounted && typeof document !== "undefined" && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[9999] bg-navy-950/60 backdrop-blur-sm flex flex-col items-center justify-between p-3 sm:p-6 animate-fade-in select-none"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Top Bar: Title, Count, Close Button inside floating pill */}
          <div
            className="w-full max-w-5xl flex items-center justify-between text-sand-50 py-2.5 px-4 sm:px-6 rounded-full bg-navy-950/80 backdrop-blur-md border border-white/15 shadow-2xl z-30"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="min-w-0 pr-4">
              <p className="text-xs sm:text-sm font-semibold text-white truncate max-w-xs sm:max-w-md md:max-w-lg">
                {title}
              </p>
              <p className="text-[11px] text-brass-400 font-medium">
                Photo {selectedIndex + 1} of {validImages.length}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="p-1.5 sm:p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all border border-white/20 shadow-md focus:outline-none focus:ring-2 focus:ring-brass-400 cursor-pointer flex-shrink-0"
              aria-label="Close full view"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Center Display Area with Large Nav Chevrons */}
          <div className="relative flex-1 w-full max-w-7xl flex items-center justify-center p-2 sm:p-4 my-auto">
            {/* Lightbox Previous Button (<) */}
            {validImages.length > 1 && (
              <button
                type="button"
                onClick={handlePrev}
                className="absolute left-2 sm:left-6 z-20 w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-navy-950/80 hover:bg-navy-900 text-white transition-all border border-white/20 shadow-2xl flex items-center justify-center active:scale-95 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-brass-400 cursor-pointer backdrop-blur-md"
                aria-label="Previous photo in fullscreen"
              >
                <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
              </button>
            )}

            {/* High-Res Fullscreen Image */}
            <div
              className="relative max-h-[72vh] sm:max-h-[78vh] max-w-full flex items-center justify-center cursor-default"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={activeImage}
                alt={`${title} - Fullscreen View ${selectedIndex + 1}`}
                className="max-h-[72vh] sm:max-h-[78vh] w-auto max-w-[92vw] sm:max-w-[85vw] object-contain rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] border border-white/10"
              />
            </div>

            {/* Lightbox Next Button (>) */}
            {validImages.length > 1 && (
              <button
                type="button"
                onClick={handleNext}
                className="absolute right-2 sm:right-6 z-20 w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-navy-950/80 hover:bg-navy-900 text-white transition-all border border-white/20 shadow-2xl flex items-center justify-center active:scale-95 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-brass-400 cursor-pointer backdrop-blur-md"
                aria-label="Next photo in fullscreen"
              >
                <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
              </button>
            )}
          </div>

          {/* Bottom Thumbnails Strip for Lightbox */}
          {validImages.length > 1 && (
            <div
              className="flex items-center gap-2 overflow-x-auto max-w-2xl py-2 px-3 sm:px-4 rounded-2xl bg-navy-950/80 backdrop-blur-md border border-white/15 shadow-2xl scrollbar-none z-30"
              onClick={(e) => e.stopPropagation()}
            >
              {validImages.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedIndex(idx)}
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 bg-white/5 cursor-pointer ${
                    selectedIndex === idx
                      ? "border-brass-400 ring-2 ring-brass-400/50 scale-105 opacity-100"
                      : "border-white/20 opacity-60 hover:opacity-100"
                  }`}
                  aria-label={`Jump to photo ${idx + 1}`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
