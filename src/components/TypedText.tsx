import { useEffect, useRef } from "react";
import Typed from "typed.js";

interface TypedTextProps {
  strings: string[];
  typeSpeed?: number;
  backSpeed?: number;
  backDelay?: number;
  loop?: boolean;
  className?: string;
}

export function TypedText({
  strings,
  typeSpeed = 50,
  backSpeed = 30,
  backDelay = 1800,
  loop = true,
  className = "",
}: TypedTextProps) {
  const elRef = useRef<HTMLSpanElement>(null);
  const typedRef = useRef<Typed | null>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion || !elRef.current) return;

    typedRef.current = new Typed(elRef.current, {
      strings,
      typeSpeed,
      backSpeed,
      backDelay,
      loop,
      showCursor: true,
      cursorChar: "│",
      smartBackspace: true,
    });

    return () => {
      typedRef.current?.destroy();
    };
  }, [strings, typeSpeed, backSpeed, backDelay, loop]);

  return <span ref={elRef} className={`inline-block ${className}`} />;
}
