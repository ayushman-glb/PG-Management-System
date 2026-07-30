import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Respect prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) return;

    const lenis = new Lenis({
      duration: 1.0,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.5,
      wheelMultiplier: 1.0,
      prevent: (node: HTMLElement) => {
        // Prevent Lenis smooth scroll hijacking inside modals and scrollable elements
        return (
          node.hasAttribute("data-lenis-prevent") ||
          !!node.closest("[data-lenis-prevent]")
        );
      },
    });

    // Synchronize Lenis scroll events with GSAP ScrollTrigger
    lenis.on("scroll", ScrollTrigger.update);

    // Tick Lenis inside GSAP RAF for perfect synchronization
    const updateLenis = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(updateLenis);
    gsap.ticker.lagSmoothing(0);

    // Expose lenis globally for modal scroll lock/unlock control
    (window as unknown as Record<string, unknown>).__lenis = lenis;

    return () => {
      gsap.ticker.remove(updateLenis);
      lenis.destroy();
      delete (window as unknown as Record<string, unknown>).__lenis;
    };
  }, []);

  return <>{children}</>;
}
