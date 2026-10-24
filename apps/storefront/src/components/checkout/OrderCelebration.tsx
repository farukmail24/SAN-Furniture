"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Sparkles } from "lucide-react";

interface OrderCelebrationProps {
  orderNumber?: string;
  customerName?: string;
}

export function OrderCelebration({ orderNumber, customerName }: OrderCelebrationProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [celebrationKey, setCelebrationKey] = useState(0);

  const triggerCelebration = useCallback(() => {
    setCelebrationKey((prev) => prev + 1);
  }, []);

  useEffect(() => {
    // Check user preference for reduced motion
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Luxury UK e-commerce celebration palette (Royal Brass, Champagne Gold, British Racing Green, Navy, Rose)
    const colors = [
      "#C89B3C", // Royal Brass
      "#E6CA7E", // Champagne Gold
      "#D9B45C", // Deep Brass
      "#15803D", // British Racing Green / Emerald
      "#22C55E", // Vivid Green
      "#34D399", // Fresh Mint
      "#00072D", // SAN Navy
      "#FAF8F5", // Ivory Linen
      "#F43F5E", // Celebration Rose
    ];

    interface Particle {
      x: number;
      y: number;
      w: number;
      h: number;
      color: string;
      vx: number;
      vy: number;
      rotation: number;
      vRot: number;
      opacity: number;
      wobble: number;
      wobbleSpeed: number;
      shape: "ribbon" | "rect" | "circle";
      spawnTime: number;
    }

    const particles: Particle[] = [];

    const createParticle = (originX: number, originY: number, angleRange: [number, number], speedMin: number, speedMax: number, spawnDelay = 0): Particle => {
      const angle = (Math.random() * (angleRange[1] - angleRange[0]) + angleRange[0]) * (Math.PI / 180);
      const speed = Math.random() * (speedMax - speedMin) + speedMin;
      const isRibbon = Math.random() > 0.4;

      return {
        x: originX,
        y: originY,
        w: isRibbon ? Math.random() * 5 + 4 : Math.random() * 7 + 5,
        h: isRibbon ? Math.random() * 12 + 8 : Math.random() * 7 + 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        rotation: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 6,
        opacity: 1,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: Math.random() * 0.08 + 0.04,
        shape: isRibbon ? "ribbon" : Math.random() > 0.4 ? "rect" : "circle",
        spawnTime: spawnDelay,
      };
    };

    // Wave 1: Immediate cannon blast from lower sides (t = 0)
    const wave1Count = Math.min(100, Math.floor(width / 12));
    for (let i = 0; i < wave1Count; i++) {
      const fromLeft = i % 2 === 0;
      particles.push(
        createParticle(
          fromLeft ? width * 0.15 : width * 0.85,
          height * 0.45,
          fromLeft ? [-80, -25] : [-155, -100],
          8,
          16,
          0
        )
      );
    }

    // Wave 2: Synchronized Victory Fountain right as checkmark finishes (t = 1200ms)
    const wave2Count = Math.min(80, Math.floor(width / 15));
    for (let i = 0; i < wave2Count; i++) {
      particles.push(
        createParticle(
          width * 0.5 + (Math.random() * 120 - 60),
          height * 0.35,
          [-130, -50],
          6,
          14,
          1200
        )
      );
    }

    // Wave 3: Gentle fluttering ceiling shower (t = 2800ms)
    const wave3Count = Math.min(60, Math.floor(width / 20));
    for (let i = 0; i < wave3Count; i++) {
      particles.push(
        createParticle(
          Math.random() * width,
          -20,
          [75, 105],
          1,
          3,
          2800
        )
      );
    }

    let animationId: number;
    const startTime = Date.now();
    const durationMs = 10000; // Sustained 10-second celebratory experience

    const render = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed > durationMs) {
        ctx.clearRect(0, 0, width, height);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      // Smooth fade out only during the final 2 seconds
      const fadeProgress = elapsed > 8000 ? (elapsed - 8000) / 2000 : 0;
      const globalAlpha = Math.max(0, 1 - fadeProgress);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Do not update before its wave spawn time
        if (elapsed < p.spawnTime) continue;

        // Realistic air fluttering physics
        p.wobble += p.wobbleSpeed;
        p.x += p.vx + Math.sin(p.wobble) * 1.8;
        p.y += p.vy;

        // Gentle gravity with soft terminal velocity for realistic slow-motion drift
        p.vy = Math.min(p.vy + 0.14, 3.2);
        p.vx *= 0.985;
        p.rotation += p.vRot;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = Math.max(0, p.opacity * globalAlpha);
        ctx.fillStyle = p.color;

        if (p.shape === "ribbon") {
          // Curved flutter ribbon
          ctx.beginPath();
          ctx.ellipse(0, 0, p.w / 2, p.h / 2, Math.PI / 4, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === "rect") {
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
    };
  }, [celebrationKey]);

  return (
    <>
      {/* Full-screen sustained celebratory confetti canvas */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-50 w-full h-full"
        aria-hidden="true"
      />

      {/* Large Heroic Checkmark Seal */}
      <div className="relative mx-auto flex flex-col items-center justify-center my-6">
        {/* Centered multi-tier ambient radiating aura */}
        <div className="absolute w-48 h-48 sm:w-60 sm:h-60 rounded-full bg-emerald-300/30 animate-pulse pointer-events-none" />
        <div className="absolute w-44 h-44 sm:w-52 sm:h-52 rounded-full bg-brass-400/20 pointer-events-none" />

        {/* Outer Ripple Wave on Checkmark Completion */}
        <div className="absolute w-36 h-36 sm:w-44 sm:h-44 rounded-full border-2 border-emerald-400/70 seal-ripple pointer-events-none" />

        {/* Master Grand Emerald Seal Emblem (Interactive on click) */}
        <button
          type="button"
          onClick={triggerCelebration}
          title="Click to replay celebration"
          aria-label="Order confirmed seal. Click to replay celebration"
          className="relative group w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-gradient-to-tr from-emerald-800 via-emerald-600 to-emerald-500 shadow-2xl shadow-emerald-950/35 border-4 border-white ring-4 ring-emerald-200/80 flex items-center justify-center seal-pop cursor-pointer hover:scale-105 active:scale-95 transition-transform"
        >
          <svg
            className="w-24 h-24 sm:w-28 sm:h-28"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ filter: "drop-shadow(0 4px 8px rgba(0, 0, 0, 0.32))" }}
          >
            {/* Elegant Inner Dashed Royal Ring */}
            <circle
              cx="50"
              cy="50"
              r="44"
              stroke="rgba(255, 255, 255, 0.38)"
              strokeWidth="2.5"
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

          {/* Interactive Replay Sparkle Badge */}
          <span className="absolute -bottom-2.5 px-3 py-0.5 rounded-full bg-navy-950/85 text-brass-300 text-[10px] font-bold uppercase tracking-wider border border-brass-400/40 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-brass-400" />
            Replay
          </span>
        </button>
      </div>

      {/* Synchronized CSS Animations */}
      <style jsx global>{`
        /* Phase 1: Majestic Seal Pop-in with Spring Bounce */
        .seal-pop {
          animation: sealPopEntrance 0.65s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        @keyframes sealPopEntrance {
          0% {
            transform: scale(0.2);
            opacity: 0;
          }
          60% {
            transform: scale(1.12);
            opacity: 1;
          }
          85% {
            transform: scale(0.96);
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
          animation: drawCheckmarkStroke 0.85s cubic-bezier(0.65, 0, 0.35, 1) 0.35s forwards;
        }

        @keyframes drawCheckmarkStroke {
          0% {
            stroke-dashoffset: 100;
            opacity: 0;
          }
          15% {
            opacity: 1;
          }
          100% {
            stroke-dashoffset: 0;
            opacity: 1;
          }
        }

        /* Phase 3: Expanding Emerald Wave upon Checkmark Completion */
        .seal-ripple {
          animation: rippleExpand 1.6s cubic-bezier(0.16, 1, 0.3, 1) 1.1s infinite;
        }

        @keyframes rippleExpand {
          0% {
            transform: scale(1);
            opacity: 0.8;
          }
          60% {
            transform: scale(1.4);
            opacity: 0.2;
          }
          100% {
            transform: scale(1.6);
            opacity: 0;
          }
        }
      `}</style>
    </>
  );
}
