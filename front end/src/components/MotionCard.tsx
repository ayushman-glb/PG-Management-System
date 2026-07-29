import { motion, type HTMLMotionProps } from "framer-motion";
import React from "react";

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
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{
        duration: 0.4,
        delay,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      whileHover={{
        y: hoverY,
        scale: hoverScale,
        transition: { duration: 0.2, ease: "easeOut" },
      }}
      whileTap={{
        scale: tapScale,
        transition: { duration: 0.1 },
      }}
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
  return (
    <motion.button
      type={type}
      whileHover={{
        scale: hoverScale,
        transition: { duration: 0.15, ease: "easeOut" },
      }}
      whileTap={{ scale: tapScale }}
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
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: 0.3,
        delay: index * 0.05,
        ease: "easeOut",
      }}
      whileHover={{ backgroundColor: "rgba(217, 168, 124, 0.06)" }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}
