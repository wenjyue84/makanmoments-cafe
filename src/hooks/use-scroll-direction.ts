"use client";

import { useState, useEffect } from "react";

type ScrollDirection = "up" | "down" | "none";

/**
 * Tracks scroll direction with a threshold to avoid jitter on tiny scrolls.
 * Returns "up" | "down" | "none" (initial state before first scroll).
 */
export function useScrollDirection(threshold = 10): ScrollDirection {
  const [direction, setDirection] = useState<ScrollDirection>("none");
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    let ticking = false;

    function update() {
      const currentScrollY = window.scrollY;
      const diff = currentScrollY - lastScrollY;

      if (Math.abs(diff) >= threshold) {
        setDirection(diff > 0 ? "down" : "up");
        setLastScrollY(currentScrollY);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastScrollY, threshold]);

  return direction;
}
