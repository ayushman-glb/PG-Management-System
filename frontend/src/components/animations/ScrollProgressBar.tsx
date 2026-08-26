import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { useTheme } from "../../theme";

export function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });
  const opacity = useTransform(scrollYProgress, [0, 0.008, 0.02], [0, 0, 1]);
  const { darkMode } = useTheme();

  return (
    <motion.div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 h-1 z-50 origin-left pointer-events-none transition-opacity duration-300"
      style={{
        scaleX,
        opacity,
        background: darkMode
          ? "linear-gradient(90deg, #ff385c, #ff385c, #E8C98A)"
          : "linear-gradient(90deg, #ff385c, #ff385c, #E7C4A0)",
        boxShadow: darkMode
          ? "0 0 12px rgba(200, 154, 75, 0.6)"
          : "0 0 12px rgba(217, 168, 124, 0.6)",
      }}
    />
  );
}
