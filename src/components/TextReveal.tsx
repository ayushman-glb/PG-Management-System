import { motion } from "framer-motion";

interface TextRevealProps {
  text: string;
  className?: string;
  delay?: number;
  mode?: "word" | "character";
}

export function TextReveal({
  text,
  className = "",
  delay = 0,
  mode = "word",
}: TextRevealProps) {
  const items = mode === "word" ? text.split(" ") : Array.from(text);

  const container = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { staggerChildren: mode === "word" ? 0.08 : 0.03, delayChildren: delay * i },
    }),
  };

  const child = {
    hidden: {
      opacity: 0,
      y: 12,
      filter: "blur(4px)",
    },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: {
        type: "spring" as const,
        damping: 18,
        stiffness: 120,
      },
    },
  };

  return (
    <motion.span
      className={`inline-flex flex-wrap ${className}`}
      variants={container}
      initial="hidden"
      animate="visible"
    >
      {items.map((item, idx) => (
        <motion.span
          key={idx}
          variants={child}
          className="inline-block mr-[0.25em] whitespace-nowrap"
        >
          {item === " " ? "\u00A0" : item}
        </motion.span>
      ))}
    </motion.span>
  );
}
