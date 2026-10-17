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
 * Distinct 750ms duration with subtle lift and scale.
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
      initial={{ opacity: 0, y: 28, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -16, scale: 0.99 }}
      transition={{ duration: 0.75, ease: LUXURY_EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * 2. ScrollReveal
 * Distinct, visible scroll-triggered animations.
 * Moves 48px with 850ms duration so every section entrance is clearly perceived.
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
  duration = 0.85,
  distance = 48,
  className = "",
  once = true,
  ...props
}: ScrollRevealProps) {
  const getInitialPosition = () => {
    switch (direction) {
      case "up":
        return { opacity: 0, y: distance };
      case "down":
        return { opacity: 0, y: -distance };
      case "left":
        return { opacity: 0, x: distance };
      case "right":
        return { opacity: 0, x: -distance };
      case "scale":
        return { opacity: 0, scale: 0.90, y: 28 };
      case "fade":
      default:
        return { opacity: 0 };
    }
  };

  const getTargetPosition = () => {
    switch (direction) {
      case "scale":
        return { opacity: 1, scale: 1, y: 0 };
      default:
        return { opacity: 1, x: 0, y: 0 };
    }
  };

  return (
    <motion.div
      initial={getInitialPosition()}
      whileInView={getTargetPosition()}
      viewport={{ once, margin: "-30px", amount: 0.15 }}
      transition={{
        duration,
        delay,
        ease: LUXURY_EASE,
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
 * Creates a clear, noticeable domino/cascading entrance animation for product grids,
 * room categories, and customer reviews.
 * Stagger time of 140ms per item ensures sequential animation is unmistakable.
 */
export const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 48, scale: 0.94 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.8,
      ease: LUXURY_EASE,
    },
  },
};

export function StaggerContainer({
  children,
  className = "",
  delay = 0.05,
  stagger = 0.14,
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
        hidden: { opacity: 0 },
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
      viewport={{ once, margin: "-30px", amount: 0.1 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div variants={staggerItemVariants} className={className}>
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
