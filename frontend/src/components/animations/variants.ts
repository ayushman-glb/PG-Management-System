import { Variants } from "framer-motion";
import { EASING, TIMING } from "./constants";

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: TIMING.NORMAL, ease: EASING.SMOOTH },
  },
  exit: {
    opacity: 0,
    transition: { duration: TIMING.MICRO, ease: EASING.SMOOTH },
  },
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: TIMING.SECTION, ease: EASING.OUT_CUBIC },
  },
  exit: {
    opacity: 0,
    y: -16,
    transition: { duration: TIMING.MICRO, ease: EASING.SMOOTH },
  },
};

export const fadeDown: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: TIMING.NORMAL, ease: EASING.OUT_CUBIC },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: TIMING.MICRO, ease: EASING.SMOOTH },
  },
};

export const fadeLeft: Variants = {
  hidden: { opacity: 0, x: -24 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: TIMING.SECTION, ease: EASING.OUT_CUBIC },
  },
  exit: {
    opacity: 0,
    x: -12,
    transition: { duration: TIMING.MICRO, ease: EASING.SMOOTH },
  },
};

export const fadeRight: Variants = {
  hidden: { opacity: 0, x: 24 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: TIMING.SECTION, ease: EASING.OUT_CUBIC },
  },
  exit: {
    opacity: 0,
    x: 12,
    transition: { duration: TIMING.MICRO, ease: EASING.SMOOTH },
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: TIMING.NORMAL, ease: EASING.OUT_CUBIC },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    transition: { duration: TIMING.MICRO, ease: EASING.SMOOTH },
  },
};

export const modalOverlay: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: TIMING.MICRO, ease: EASING.SMOOTH },
  },
  exit: {
    opacity: 0,
    transition: { duration: TIMING.MICRO, ease: EASING.SMOOTH },
  },
};

export const modalContent: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 16 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", stiffness: 380, damping: 28 },
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    y: 12,
    transition: { duration: TIMING.MICRO, ease: EASING.SMOOTH },
  },
};

export const staggerContainer = (stagger = 0.08, delayStart = 0): Variants => ({
  hidden: {},
  visible: {
    transition: {
      staggerChildren: stagger,
      delayChildren: delayStart,
    },
  },
});

export const pageTransition: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: TIMING.MICRO, ease: EASING.OUT_CUBIC },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: TIMING.MICRO, ease: EASING.SMOOTH },
  },
};
