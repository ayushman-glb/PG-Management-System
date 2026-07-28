import { motion, useScroll, useSpring } from "framer-motion";
import { useTheme } from "../theme";

export function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });
  const { darkMode } = useTheme();

  return (
    <motion.div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 h-1 z-50 origin-left pointer-events-none"
      style={{
        scaleX,
        background: darkMode
          ? "linear-gradient(90deg, #C89A4B, #D8B36A, #E8C98A)"
          : "linear-gradient(90deg, #D9A87C, #C58B63, #E7C4A0)",
        boxShadow: darkMode
          ? "0 0 12px rgba(200, 154, 75, 0.6)"
          : "0 0 12px rgba(217, 168, 124, 0.6)",
      }}
    />
  );
}
