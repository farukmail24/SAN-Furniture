"use client";

import React from "react";

interface OrderCelebrationProps {
  orderNumber?: string;
  customerName?: string;
}

export function OrderCelebration({ orderNumber, customerName }: OrderCelebrationProps) {
  return (
    <>
      {/* Prestigious Professional Order Confirmed Checkmark Seal */}
      <div className="relative mx-auto flex flex-col items-center justify-center my-6">
        {/* Soft Ambient Radiating Glow */}
        <div className="absolute w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-emerald-500/10 pointer-events-none" />
        <div className="absolute w-28 h-28 sm:w-36 sm:h-36 rounded-full border border-emerald-500/20 pointer-events-none" />

        {/* Master Emerald Seal with Animated Stroke Checkmark */}
        <div
          aria-label="Order confirmed seal"
          className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-tr from-emerald-800 via-emerald-600 to-emerald-500 shadow-xl shadow-emerald-950/25 border-4 border-white ring-4 ring-emerald-100/90 flex items-center justify-center seal-pop"
        >
          <svg
            className="w-16 h-16 sm:w-20 sm:h-20"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.25))" }}
          >
            {/* Elegant Inner Dashed Royal Ring */}
            <circle
              cx="50"
              cy="50"
              r="44"
              stroke="rgba(255, 255, 255, 0.35)"
              strokeWidth="2"
              strokeDasharray="6 4"
            />

            {/* Bold, Distinct Drawing Checkmark with Full Animated Stroke */}
            <path
              d="M 27 52 L 43 68 L 75 34"
              stroke="#FFFFFF"
              strokeWidth="8.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength="100"
              className="checkmark-draw"
            />
          </svg>
        </div>
      </div>

      {/* Synchronized CSS Animations */}
      <style jsx global>{`
        /* Phase 1: Dignified Seal Entrance with subtle bounce */
        .seal-pop {
          animation: sealPopEntrance 0.55s cubic-bezier(0.34, 1.4, 0.64, 1) forwards;
        }

        @keyframes sealPopEntrance {
          0% {
            transform: scale(0.4);
            opacity: 0;
          }
          70% {
            transform: scale(1.06);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        /* Phase 2: Drawing the Checkmark from Start to Finish */
        .checkmark-draw {
          stroke-dasharray: 100;
          stroke-dashoffset: 100;
          animation: drawCheckmarkStroke 0.75s cubic-bezier(0.65, 0, 0.35, 1) 0.25s forwards;
        }

        @keyframes drawCheckmarkStroke {
          0% {
            stroke-dashoffset: 100;
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          100% {
            stroke-dashoffset: 0;
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}
