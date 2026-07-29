import { useEffect, useRef, useState } from "react";
import { motion, type Variants } from "framer-motion";

type RevealVariant = "fadeUp" | "clipReveal" | "blurIn" | "slideLeft";

interface TextRevealProps {
  text: string;
  className?: string;
  delay?: number;
  mode?: "word" | "character";
  variant?: RevealVariant;
  /** If true, uses IntersectionObserver to trigger when scrolled into view */
  scrollTrigger?: boolean;
  threshold?: number;
}

// Strongly typed variant maps for Framer Motion compliance
const variantMaps: Record<RevealVariant, Variants> = {
  fadeUp: {
    hidden: { opacity: 0, y: 14 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", damping: 20, stiffness: 110 } },
  },
  clipReveal: {
    hidden: { opacity: 0, y: 18, clipPath: "inset(100% 0 0 0)" },
    visible: { opacity: 1, y: 0, clipPath: "inset(0% 0 0 0)", transition: { type: "spring", damping: 22, stiffness: 130 } },
  },
  blurIn: {
    hidden: { opacity: 0, filter: "blur(8px)", y: 8 },
    visible: { opacity: 1, filter: "blur(0px)", y: 0, transition: { type: "spring", damping: 18, stiffness: 100 } },
  },
  slideLeft: {
    hidden: { opacity: 0, x: -16 },
    visible: { opacity: 1, x: 0, transition: { type: "spring", damping: 20, stiffness: 120 } },
  },
};

const reducedMotionVariant: Variants = {
  hidden: { opacity: 1 },
  visible: { opacity: 1, transition: { duration: 0 } },
};

export function TextReveal({
  text,
  className = "",
  delay = 0,
  mode = "word",
  variant = "fadeUp",
  scrollTrigger = false,
  threshold = 0.2,
}: TextRevealProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [inView, setInView] = useState(!scrollTrigger);

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (!scrollTrigger || !ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [scrollTrigger, threshold]);

  const items = mode === "word" ? text.split(" ") : Array.from(text);

  const childVariants: Variants = prefersReducedMotion
    ? reducedMotionVariant
    : variantMaps[variant];

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: mode === "word" ? 0.07 : 0.025,
        delayChildren: delay,
      },
    },
  };

  return (
    <motion.span
      ref={ref}
      className={`inline-flex flex-wrap ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
    >
      {items.map((item, idx) => (
        <motion.span
          key={idx}
          variants={childVariants}
          className="inline-block mr-[0.25em] whitespace-nowrap overflow-hidden"
          style={variant === "clipReveal" ? { display: "inline-block" } : undefined}
        >
          {item === " " ? "\u00A0" : item}
        </motion.span>
      ))}
    </motion.span>
  );
}
