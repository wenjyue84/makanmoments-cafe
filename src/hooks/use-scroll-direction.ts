"use client";

import { useState, useEffect, useRef } from "react";

type ScrollDirection = "up" | "down" | "none";

/**
 * Tracks scroll direction with a threshold to avoid jitter on tiny scrolls.
 * Returns "up" | "down" | "none" (initial state before first scroll).
 *
 * Uses a ref for lastScrollY so the effect never re-runs on scroll updates,
 * preventing the listener teardown/re-attach cycle that caused header flickering.
 */
export function useScrollDirection(threshold = 10): ScrollDirection {
  const [direction, setDirection] = useState<ScrollDirection>("none");
  const lastScrollYRef = useRef(0);

  useEffect(() => {
    let ticking = false;

    function update() {
      const currentScrollY = window.scrollY;
      const diff = currentScrollY - lastScrollYRef.current;

      if (Math.abs(diff) >= threshold) {
        setDirection(diff > 0 ? "down" : "up");
        lastScrollYRef.current = currentScrollY;
      }

      ticking = false;
    }

    function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]); // threshold is stable — effect runs once on mount

  return direction;
}
