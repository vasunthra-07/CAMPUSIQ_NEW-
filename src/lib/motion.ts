/**
 * CampusIQ Motion System
 * Framer Motion variants + CSS animation helpers
 */

import type { Variants, Transition } from "framer-motion";
import type React from "react";

export const TRANSITION_DURATIONS = {
  fast: "150ms",
  base: "250ms",
  slow: "400ms",
  verySlow: "700ms",
} as const;

export const EASING = {
  smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
  spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
  out: "cubic-bezier(0, 0, 0.2, 1)",
} as const;

export const motionTransition: Transition = {
  duration: 0.35,
  ease: [0.25, 0.1, 0.25, 1],
};

export const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

export function staggerDelay(index: number, base = 50): string {
  return `${index * base}ms`;
}

export function fadeUpStyle(index = 0, baseDelayMs = 0): React.CSSProperties {
  return {
    animation: `fade-up 0.4s ${EASING.smooth} ${baseDelayMs + index * 50}ms both`,
  };
}

export function scaleInStyle(index = 0, baseDelayMs = 0): React.CSSProperties {
  return {
    animation: `scale-in 0.3s ${EASING.out} ${baseDelayMs + index * 40}ms both`,
  };
}
