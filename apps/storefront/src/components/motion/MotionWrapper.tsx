"use client";

import React from "react";
import { motion, type HTMLMotionProps, type Variants } from "framer-motion";

/**
 * Premium Luxury Easing (Apple / Bang & Olufsen gentle deceleration curve)
 * Gives a noticeable, buttery-smooth cinematic motion that users can clearly see and appreciate.
 */
export const LUXURY_EASE = [0.22, 1, 0.36, 1] as const;

/**
 * 1. PageTransition
 * Wraps page content to provide an unmistakable, graceful entrance when a route is mounted.
 * Keeps route changes from shifting the page while content loads.
 */
export function PageTransition({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25, ease: LUXURY_EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * 2. ScrollReveal
 * Distinct, visible scroll-triggered animations.
 * Uses a restrained entrance so sections remain visually stable while appearing.
 */
interface ScrollRevealProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  direction?: "up" | "down" | "left" | "right" | "fade" | "scale";
  delay?: number;
  duration?: number;
  distance?: number;
  className?: string;
  once?: boolean;
}

export function ScrollReveal({
  children,
  direction = "up",
  delay = 0,
  duration = 0.65,
  distance = 12,
  className = "",
  once = true,
  ...props
}: ScrollRevealProps) {
  const getInitialPosition = () => {
    switch (direction) {
      case "up":
        return { opacity: 0.94, y: 0 };
      case "down":
        return { opacity: 0.94, y: 0 };
      case "left":
        return { opacity: 0.94, x: distance };
      case "right":
        return { opacity: 0.94, x: -distance };
      case "scale":
        return { opacity: 0.94, y: 0 };
      case "fade":
      default:
        return { opacity: 0.94 };
    }
  };

  const getTargetPosition = () => {
    switch (direction) {
      default:
        return { opacity: 1, x: 0, y: 0 };
    }
  };

  return (
    <motion.div
      initial={getInitialPosition()}
      whileInView={getTargetPosition()}
      viewport={{ once, amount: 0.12 }}
      transition={{
        duration,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      style={{
        willChange: "transform, opacity",
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
        ...props.style,
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * 3. StaggerContainer & StaggerItem
 * Smoothly reveals product cards in sequence without shifting their layout.
 */
export const staggerItemVariants: Variants = {
  hidden: { opacity: 0.92 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: LUXURY_EASE,
    },
  },
};

export function StaggerContainer({
  children,
  className = "",
  delay = 0,
  stagger = 0.045,
  once = true,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  stagger?: number;
  once?: boolean;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 1 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: stagger,
            delayChildren: delay,
          },
        },
      }}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount: 0.05 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className = "",
  style,
  ...props
}: HTMLMotionProps<"div">) {
  return (
    <motion.div
      variants={staggerItemVariants}
      initial={{ opacity: 0.92 }}
      style={{
        willChange: "opacity",
        ...style,
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * 4. CardHover
 * Tactile micro-motion for interactive furniture cards.
 */
export function CardHover({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -6, transition: { duration: 0.28, ease: "easeOut" } }}
      whileTap={{ scale: 0.97, transition: { duration: 0.12 } }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
