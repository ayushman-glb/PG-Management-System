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
          ? "linear-gradient(90deg, #007A99, #9B336D, #4F6E52)"
          : "linear-gradient(90deg, #004D61, #822659, #3E5641)",
        boxShadow: darkMode
          ? "0 0 12px rgba(0, 122, 153, 0.5)"
          : "0 0 12px rgba(0, 77, 97, 0.4)",
      }}
    />
  );
}
