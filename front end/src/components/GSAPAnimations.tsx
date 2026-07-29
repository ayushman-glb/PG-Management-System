/**
 * GSAPAnimations.tsx
 * Centralized GSAP + ScrollTrigger utility hooks for RoomBae.
 *
 * Design Principles:
 * - All hooks check `prefers-reduced-motion` before registering animations.
 * - All effects clean up via `ctx.revert()` on unmount.
 * - Hooks are composable: use one or many per component.
 * - Only `transform` and `opacity` are animated to maintain 60fps.
 */

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// ─── Shared Utilities ────────────────────────────────────────────────────────

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ─── 1. useScrollReveal ───────────────────────────────────────────────────────
// Fade + translateY reveal for a selector inside a container ref.

export interface ScrollRevealConfig {
  /** GSAP selector string (e.g. ".reveal-up") */
  selector?: string;
  /** Starting Y offset in px. Default: 32 */
  yOffset?: number;
  /** Starting X offset in px. Default: 0 */
  xOffset?: number;
  /** Animation duration in seconds. Default: 0.7 */
  duration?: number;
  /** Stagger delay between children. Default: 0 (single element) */
  stagger?: number;
  /** ScrollTrigger start position. Default: "top 88%" */
  start?: string;
  /** GSAP ease string. Default: "power3.out" */
  ease?: string;
}

export function useScrollReveal(
  containerRef: React.RefObject<Element | null>,
  config: ScrollRevealConfig = {}
) {
  const {
    selector = ".reveal-up",
    yOffset = 32,
    xOffset = 0,
    duration = 0.7,
    stagger = 0,
    start = "top 88%",
    ease = "power3.out",
  } = config;

  useEffect(() => {
    if (prefersReducedMotion() || !containerRef.current) return;

    const ctx = gsap.context(() => {
      const targets = containerRef.current!.querySelectorAll(selector);
      if (!targets.length) return;

      gsap.fromTo(
        targets,
        { opacity: 0, y: yOffset, x: xOffset },
        {
          opacity: 1,
          y: 0,
          x: 0,
          duration,
          stagger,
          ease,
          scrollTrigger: {
            trigger: containerRef.current,
            start,
            toggleActions: "play none none none",
          },
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, [containerRef, selector, yOffset, xOffset, duration, stagger, start, ease]);
}

// ─── 2. useStaggerReveal ─────────────────────────────────────────────────────
// Stagger-reveal a set of child elements inside a container ref.

export function useStaggerReveal(
  containerRef: React.RefObject<Element | null>,
  options: {
    childSelector?: string;
    stagger?: number;
    yOffset?: number;
    duration?: number;
    start?: string;
    ease?: string;
    delay?: number;
  } = {}
) {
  const {
    childSelector = ":scope > *",
    stagger = 0.08,
    yOffset = 24,
    duration = 0.6,
    start = "top 88%",
    ease = "power2.out",
    delay = 0,
  } = options;

  useEffect(() => {
    if (prefersReducedMotion() || !containerRef.current) return;

    const ctx = gsap.context(() => {
      const children = containerRef.current!.querySelectorAll(childSelector);
      if (!children.length) return;

      gsap.fromTo(
        children,
        { opacity: 0, y: yOffset },
        {
          opacity: 1,
          y: 0,
          duration,
          stagger,
          ease,
          delay,
          scrollTrigger: {
            trigger: containerRef.current,
            start,
            toggleActions: "play none none none",
          },
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, [containerRef, childSelector, stagger, yOffset, duration, start, ease, delay]);
}

// ─── 3. useParallax ──────────────────────────────────────────────────────────
// Subtle parallax Y translation on scroll for a given element ref.

export function useParallax(
  ref: React.RefObject<Element | null>,
  speed: number = 0.15
) {
  useEffect(() => {
    if (prefersReducedMotion() || !ref.current) return;

    const ctx = gsap.context(() => {
      gsap.to(ref.current, {
        y: () => window.innerHeight * speed,
        ease: "none",
        scrollTrigger: {
          trigger: ref.current,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      });
    }, ref);

    return () => ctx.revert();
  }, [ref, speed]);
}

// ─── 4. useCounterAnimation ──────────────────────────────────────────────────
// Animates a DOM element's textContent as a number counter on scroll entry.

export function useCounterAnimation(
  ref: React.RefObject<HTMLElement | null>,
  target: number,
  options: {
    duration?: number;
    start?: string;
    prefix?: string;
    suffix?: string;
    decimals?: number;
  } = {}
) {
  const {
    duration = 1.8,
    start = "top 85%",
    prefix = "",
    suffix = "",
    decimals = 0,
  } = options;

  useEffect(() => {
    if (!ref.current) return;

    const obj = { value: 0 };
    const el = ref.current;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        obj,
        { value: 0 },
        {
          value: target,
          duration: prefersReducedMotion() ? 0 : duration,
          ease: "power2.out",
          onUpdate: () => {
            el.textContent =
              prefix +
              obj.value.toLocaleString("en-US", {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals,
              }) +
              suffix;
          },
          scrollTrigger: {
            trigger: el,
            start,
            toggleActions: "play none none none",
          },
        }
      );
    });

    return () => ctx.revert();
  }, [ref, target, duration, start, prefix, suffix, decimals]);
}

// ─── 5. useNavbarHide ────────────────────────────────────────────────────────
// Hides navbar on scroll-down, shows on scroll-up. Uses GSAP ScrollTrigger.

export function useNavbarHide(navRef: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (prefersReducedMotion() || !navRef.current) return;

    const nav = navRef.current;
    let lastY = 0;
    let hidden = false;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        start: "top -80",
        onUpdate: (self) => {
          const currentY = self.scroll();
          const scrollingDown = currentY > lastY;

          if (scrollingDown && !hidden && currentY > 120) {
            gsap.to(nav, {
              y: "-100%",
              duration: 0.35,
              ease: "power2.inOut",
            });
            hidden = true;
          } else if (!scrollingDown && hidden) {
            gsap.to(nav, {
              y: "0%",
              duration: 0.4,
              ease: "power3.out",
            });
            hidden = false;
          }

          lastY = currentY;
        },
      });
    });

    return () => ctx.revert();
  }, [navRef]);
}

// ─── 6. useHeroTimeline ──────────────────────────────────────────────────────
// Cinematic hero entrance timeline. Targets CSS class-based elements.
// Classes: .hero-badge .hero-title .hero-sub .hero-cta .hero-stats .hero-mockup

export function useHeroTimeline(containerRef: React.RefObject<Element | null>) {
  useEffect(() => {
    if (!containerRef.current) return;
    if (prefersReducedMotion()) {
      // Just ensure everything is visible
      gsap.set(
        [
          ".hero-badge",
          ".hero-title",
          ".hero-sub",
          ".hero-cta",
          ".hero-stats",
          ".hero-mockup",
        ],
        { opacity: 1, y: 0, x: 0, scale: 1, clipPath: "none" }
      );
      return;
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: "power3.out" },
        delay: 0.1,
      });

      tl.fromTo(".hero-badge", { opacity: 0, y: -16 }, { opacity: 1, y: 0, duration: 0.55 })
        .fromTo(
          ".hero-title",
          {
            opacity: 0,
            y: 30,
            clipPath: "inset(100% 0 0 0)",
          },
          {
            opacity: 1,
            y: 0,
            clipPath: "inset(0% 0 0 0)",
            duration: 0.75,
          },
          "-=0.35"
        )
        .fromTo(
          ".hero-sub",
          { opacity: 0, y: 18 },
          { opacity: 1, y: 0, duration: 0.6 },
          "-=0.45"
        )
        .fromTo(
          ".hero-cta",
          { opacity: 0, y: 14, scale: 0.96 },
          { opacity: 1, y: 0, scale: 1, duration: 0.5 },
          "-=0.4"
        )
        .fromTo(
          ".hero-stats",
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.55, stagger: 0.08 },
          "-=0.35"
        )
        .fromTo(
          ".hero-mockup",
          { opacity: 0, y: 50, scale: 0.97 },
          { opacity: 1, y: 0, scale: 1, duration: 0.85, ease: "power2.out" },
          "-=0.5"
        );
    }, containerRef);

    return () => ctx.revert();
  }, [containerRef]);
}

// ─── 7. useClipReveal ────────────────────────────────────────────────────────
// Clip-path reveal: slides content up from bottom of clipping region on scroll.

export function useClipReveal(
  ref: React.RefObject<Element | null>,
  options: {
    start?: string;
    duration?: number;
    delay?: number;
  } = {}
) {
  const { start = "top 85%", duration = 0.8, delay = 0 } = options;

  useEffect(() => {
    if (prefersReducedMotion() || !ref.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ref.current,
        { clipPath: "inset(100% 0 0 0)", opacity: 0 },
        {
          clipPath: "inset(0% 0 0 0)",
          opacity: 1,
          duration,
          delay,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ref.current,
            start,
            toggleActions: "play none none none",
          },
        }
      );
    });

    return () => ctx.revert();
  }, [ref, start, duration, delay]);
}

// ─── 8. useFadeInSection ─────────────────────────────────────────────────────
// Simple fade + Y reveal for a single section ref on scroll entry.

export function useFadeInSection(
  ref: React.RefObject<Element | null>,
  options: {
    yOffset?: number;
    duration?: number;
    start?: string;
    delay?: number;
  } = {}
) {
  const { yOffset = 28, duration = 0.7, start = "top 87%", delay = 0 } = options;

  useEffect(() => {
    if (prefersReducedMotion() || !ref.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ref.current,
        { opacity: 0, y: yOffset },
        {
          opacity: 1,
          y: 0,
          duration,
          delay,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ref.current,
            start,
            toggleActions: "play none none none",
          },
        }
      );
    });

    return () => ctx.revert();
  }, [ref, yOffset, duration, start, delay]);
}

// ─── 9. useMouseParallax ─────────────────────────────────────────────────────
// Subtle mouse-tracking parallax movement for a decorative element.

export function useMouseParallax(
  ref: React.RefObject<HTMLElement | null>,
  strength: number = 0.02
) {
  useEffect(() => {
    if (prefersReducedMotion() || !ref.current) return;

    const el = ref.current;

    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const x = (e.clientX - innerWidth / 2) * strength;
      const y = (e.clientY - innerHeight / 2) * strength;
      gsap.to(el, { x, y, duration: 1.2, ease: "power1.out" });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      gsap.to(el, { x: 0, y: 0, duration: 0.8 });
    };
  }, [ref, strength]);
}
