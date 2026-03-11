"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

// "idle"     → never scrolled, or reduced-motion: show normally
// "scrolling" → actively scrolling: hide completely
// "resting"  → just stopped: play fade-in animation (0.15 → 1 over 2s)
export type ScrollPhase = "idle" | "scrolling" | "resting";

interface ScrollingContextValue {
  scrollPhase: ScrollPhase;
  isScrolling: boolean; // kept for any legacy consumers
}

const ScrollingContext = createContext<ScrollingContextValue>({
  scrollPhase: "idle",
  isScrolling: false,
});

export function ScrollingProvider({ children }: { children: ReactNode }) {
  const [scrollPhase, setScrollPhase] = useState<ScrollPhase>("idle");
  const pathname = usePathname();
  const isMenuPage = pathname?.includes("/menu") ?? false;

  useEffect(() => {
    if (!isMenuPage) {
      setScrollPhase("idle");
      return;
    }

    // Skip scroll fade if user prefers reduced motion
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let timer: ReturnType<typeof setTimeout>;
    const handleScroll = () => {
      setScrollPhase("scrolling");
      clearTimeout(timer);
      // Wait 1s after scroll stops, then trigger fade-in from 15%
      timer = setTimeout(() => setScrollPhase("resting"), 1000);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(timer);
      setScrollPhase("idle");
    };
  }, [isMenuPage]);

  return (
    <ScrollingContext.Provider value={{ scrollPhase, isScrolling: scrollPhase === "scrolling" }}>
      {children}
    </ScrollingContext.Provider>
  );
}

export function useScrolling() {
  return useContext(ScrollingContext);
}
