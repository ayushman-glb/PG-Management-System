/**
 * RoomBae Next-Gen Motion Constants
 * Standardized timing, easings, and spring physics.
 */

export const TIMING = {
  /** 150ms – 220ms: Toggles, buttons, icon micro-interactions */
  MICRO: 0.18,
  /** 250ms – 380ms: Cards, dropdowns, modal scales, tab indicators */
  NORMAL: 0.32,
  /** 400ms – 650ms: Viewport scroll reveals, list cascades */
  SECTION: 0.55,
  /** 700ms – 1100ms: Hero sequences, cinematic storytelling */
  CINEMATIC: 0.85,
} as const;

export const EASING = {
  /** Natural deceleration curve */
  OUT_CUBIC: [0.22, 1, 0.36, 1] as const,
  /** Smooth standard motion */
  SMOOTH: [0.25, 0.1, 0.25, 1] as const,
  /** Expressive overshoot for tactile triggers */
  OVERSHOOT: [0.34, 1.56, 0.64, 1] as const,
  /** GSAP string equivalents */
  GSAP_OUT: "power3.out",
  GSAP_SMOOTH: "power2.out",
  GSAP_IN_OUT: "power2.inOut",
} as const;

export const SPRINGS = {
  /** Snappy feedback for tabs and button clicks */
  SNAPPY: { type: "spring", stiffness: 420, damping: 30 } as const,
  /** Gentle spring for modals and floating drawers */
  GENTLE: { type: "spring", stiffness: 320, damping: 26 } as const,
  /** Bouncy accent for badges and attention-grabbers */
  BOUNCY: { type: "spring", stiffness: 500, damping: 20 } as const,
} as const;
