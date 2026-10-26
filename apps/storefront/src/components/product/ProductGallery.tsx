"use client";

import React, { useState, useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";

interface ProductGalleryProps {
  images: string[];
  title: string;
}

export function ProductGallery({ images, title }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
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

      {/* Fullscreen Lightbox Modal */}
      {isLightboxOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-navy-950/95 backdrop-blur-xl flex flex-col items-center justify-between p-4 sm:p-6 animate-fade-in"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Top Bar: Title, Count, Close Button */}
          <div
            className="w-full max-w-6xl flex items-center justify-between text-sand-50 pb-3 border-b border-sand-800/80"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <p className="text-sm sm:text-base font-bold text-sand-100 truncate max-w-md sm:max-w-xl">
                {title}
              </p>
              <p className="text-xs text-sand-400">
                Photo {selectedIndex + 1} of {validImages.length}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="p-2 sm:p-2.5 rounded-full bg-sand-900/80 hover:bg-sand-800 text-sand-200 hover:text-white transition-colors border border-sand-700/60 shadow-lg focus:outline-none focus:ring-2 focus:ring-brass-400"
              aria-label="Close full view"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          {/* Center Display Area with Large Nav Chevrons */}
          <div
            className="relative flex-1 w-full max-w-6xl flex items-center justify-center p-2 sm:p-4 my-auto overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Lightbox Previous Button (<) */}
            {validImages.length > 1 && (
              <button
                type="button"
                onClick={handlePrev}
                className="absolute left-2 sm:left-4 z-20 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-navy-900/80 hover:bg-navy-800 text-sand-100 hover:text-white transition-all border border-sand-700/80 shadow-2xl flex items-center justify-center active:scale-95 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-brass-400"
                aria-label="Previous photo in fullscreen"
              >
                <ChevronLeft className="w-7 h-7 sm:w-8 sm:h-8" />
              </button>
            )}

            {/* High-Res Fullscreen Image */}
            <div className="relative max-h-[75vh] sm:max-h-[82vh] max-w-full flex items-center justify-center select-none">
              <img
                src={activeImage}
                alt={`${title} - Fullscreen View ${selectedIndex + 1}`}
                className="max-h-[75vh] sm:max-h-[82vh] w-auto max-w-[90vw] object-contain rounded-xl shadow-2xl"
              />
            </div>

            {/* Lightbox Next Button (>) */}
            {validImages.length > 1 && (
              <button
                type="button"
                onClick={handleNext}
                className="absolute right-2 sm:right-4 z-20 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-navy-900/80 hover:bg-navy-800 text-sand-100 hover:text-white transition-all border border-sand-700/80 shadow-2xl flex items-center justify-center active:scale-95 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-brass-400"
                aria-label="Next photo in fullscreen"
              >
                <ChevronRight className="w-7 h-7 sm:w-8 sm:h-8" />
              </button>
            )}
          </div>

          {/* Bottom Thumbnails Strip for Lightbox */}
          {validImages.length > 1 && (
            <div
              className="flex items-center gap-2 overflow-x-auto max-w-2xl py-2 px-4 rounded-2xl bg-navy-900/70 backdrop-blur-md border border-sand-800 scrollbar-none"
              onClick={(e) => e.stopPropagation()}
            >
              {validImages.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedIndex(idx)}
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 bg-sand-100/10 ${
                    selectedIndex === idx
                      ? "border-brass-400 ring-2 ring-brass-400/50 scale-105 opacity-100"
                      : "border-sand-700/60 opacity-50 hover:opacity-90"
                  }`}
                  aria-label={`Jump to photo ${idx + 1}`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
