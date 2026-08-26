import React, { useEffect, useRef } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export interface SmoothScrollProps {
  children: React.ReactNode;
  /** Explicit override to disable smooth scroll on specific pages/routes */
  disabled?: boolean;
}

export function SmoothScroll({ children, disabled = false }: SmoothScrollProps) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Reduced Motion Compliance
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // 2. Mobile Touch Screen Detection (Native scroll is preferred on touch)
    const isTouchDevice =
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      window.matchMedia("(pointer: coarse)").matches ||
      window.innerWidth < 768;

    if (prefersReducedMotion || isTouchDevice || disabled) {
      return;
    }

    // 3. Initialize Scoped Lenis Instance
    const lenis = new Lenis({
      duration: 0.9,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.0,
      wheelMultiplier: 1.0,
      prevent: (node: HTMLElement) => {
        if (!node) return false;
        return (
          node.hasAttribute?.("data-lenis-prevent") ||
          !!node.closest?.("[data-lenis-prevent]") ||
          !!node.closest?.(".table-responsive") ||
          !!node.closest?.(".modal-responsive") ||
          !!node.closest?.("[role='dialog']") ||
          !!node.closest?.(".overflow-y-auto") ||
          !!node.closest?.(".overflow-auto") ||
          !!node.closest?.(".overflow-y-scroll") ||
          !!node.closest?.("aside") ||
          !!node.closest?.("nav")
        );
      },
    });

    lenisRef.current = lenis;

    // 4. Connect Lenis scroll events to GSAP ScrollTrigger
    lenis.on("scroll", ScrollTrigger.update);

    const updateLenis = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(updateLenis);
    gsap.ticker.lagSmoothing(0);

    (window as unknown as Record<string, unknown>).__lenis = lenis;

    // 5. Cleanup on Unmount
    return () => {
      gsap.ticker.remove(updateLenis);
      lenis.destroy();
      lenisRef.current = null;
      delete (window as unknown as Record<string, unknown>).__lenis;
    };
  }, [disabled]);

  return <>{children}</>;
}

export default SmoothScroll;
