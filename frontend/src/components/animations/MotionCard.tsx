import React from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { TIMING, EASING } from "./constants";
import { useReducedMotion } from "./useReducedMotion";

interface MotionCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  delay?: number;
  hoverScale?: number;
  hoverY?: number;
  tapScale?: number;
}

export function MotionCard({
  children,
  className = "",
  delay = 0,
  hoverScale = 1.015,
  hoverY = -4,
  tapScale = 0.985,
  style = {},
  ...props
}: MotionCardProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: prefersReducedMotion ? 0 : 12 }}
      transition={{
        duration: prefersReducedMotion ? 0 : TIMING.NORMAL,
        delay: prefersReducedMotion ? 0 : delay,
        ease: EASING.OUT_CUBIC,
      }}
      whileHover={
        prefersReducedMotion
          ? undefined
          : {
              y: hoverY,
              scale: hoverScale,
              transition: { duration: TIMING.MICRO, ease: "easeOut" },
            }
      }
      whileTap={
        prefersReducedMotion
          ? undefined
          : {
              scale: tapScale,
              transition: { duration: 0.1 },
            }
      }
      className={className}
      style={style}
      {...props}
    >
      {children}
    </motion.div>
  );
}

interface MotionButtonProps extends HTMLMotionProps<"button"> {
  hoverScale?: number;
  tapScale?: number;
}

export function MotionButton({
  children,
  className = "",
  hoverScale = 1.03,
  tapScale = 0.97,
  onClick,
  type = "button",
  ...props
}: MotionButtonProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.button
      type={type}
      whileHover={
        prefersReducedMotion
          ? undefined
          : {
              scale: hoverScale,
              transition: { duration: TIMING.MICRO, ease: "easeOut" },
            }
      }
      whileTap={prefersReducedMotion ? undefined : { scale: tapScale }}
      onClick={onClick}
      className={className}
      {...props}
    >
      {children}
    </motion.button>
  );
}

export function MotionRow({
  children,
  className = "",
  index = 0,
  ...props
}: HTMLMotionProps<"div"> & { index?: number }) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, x: prefersReducedMotion ? 0 : -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: prefersReducedMotion ? 0 : TIMING.MICRO,
        delay: prefersReducedMotion ? 0 : index * 0.04,
        ease: "easeOut",
      }}
      whileHover={
        prefersReducedMotion
          ? undefined
          : { backgroundColor: "var(--color-surface)" }
      }
      className={className}
      style={{ transition: "background-color 0.15s ease" }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
