"use client";

import type { ReactNode } from "react";
import { useState, useEffect } from "react";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";

interface FadeUpProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

/**
 * Scroll-triggered fade-up animation wrapper.
 * - SSR renders with no animation class → content visible without JS
 * - After hydration: `scroll-reveal` applied, then `in-view` added by IntersectionObserver
 * - prefers-reduced-motion handled via CSS (.scroll-reveal resets to opacity:1 / no transform)
 */
export function FadeUp({ children, className = "", delay = 0 }: FadeUpProps) {
  const [mounted, setMounted] = useState(false);
  const { ref, inView } = useIntersectionObserver();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Before hydration: no class → content visible (works without JS)
  const animClass = mounted ? `scroll-reveal${inView ? " in-view" : ""}` : "";

  return (
    <div
      ref={ref}
      className={[animClass, className].filter(Boolean).join(" ")}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
