"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ZoomIn, Sparkles } from "lucide-react";

interface ProductGalleryProps {
  images: string[];
  title: string;
}

export function ProductGallery({ images, title }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const activeImage = images?.[selectedIndex] || images?.[0] || "/SanFurnitureLogo.png";

  return (
    <div className="flex flex-col gap-4">
      {/* Main Large Architectural Image */}
      <div className="relative aspect-[4/3] sm:aspect-[16/11] rounded-2xl overflow-hidden bg-sand-200 border border-sand-300 group shadow-sm">
        <img
          src={activeImage}
          alt={`${title} - View ${selectedIndex + 1}`}
          onError={(e) => {
            const target = e.currentTarget;
            if (images?.[0] && target.src !== images[0]) {
              target.src = images[0];
            } else if (!target.src.includes("SanFurnitureLogo.png")) {
              target.src = "/SanFurnitureLogo.png";
            }
          }}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />

        {/* Studio badge */}
        <div className="absolute top-4 left-4 pointer-events-none">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-navy-950/80 backdrop-blur-md text-sand-50 text-[10px] font-semibold tracking-wider uppercase">
            <Sparkles className="w-3 h-3 text-brass-400" />
            Studio Collection
          </span>
        </div>

        {/* Zoom hint */}
        <div className="absolute bottom-4 right-4 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-sand-50/90 backdrop-blur-sm text-navy-900 text-xs font-medium shadow">
            <ZoomIn className="w-3.5 h-3.5" />
            Click or roll to inspect
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
              className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 bg-sand-200 ${
                selectedIndex === idx
                  ? "border-navy-950 ring-2 ring-brass-500/50 scale-[1.02]"
                  : "border-sand-300 opacity-70 hover:opacity-100"
              }`}
            >
              <img
                src={img}
                alt=""
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
