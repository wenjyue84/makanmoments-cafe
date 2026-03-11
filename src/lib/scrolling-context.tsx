"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

interface ScrollingContextValue {
  isScrolling: boolean;
}

const ScrollingContext = createContext<ScrollingContextValue>({ isScrolling: false });

export function ScrollingProvider({ children }: { children: ReactNode }) {
  const [isScrolling, setIsScrolling] = useState(false);
  const pathname = usePathname();
  const isMenuPage = pathname?.includes("/menu") ?? false;

  useEffect(() => {
    if (!isMenuPage) {
      setIsScrolling(false);
      return;
    }

    // Skip scroll fade if user prefers reduced motion
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let timer: ReturnType<typeof setTimeout>;
    const handleScroll = () => {
      setIsScrolling(true);
      clearTimeout(timer);
      timer = setTimeout(() => setIsScrolling(false), 200);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(timer);
      setIsScrolling(false);
    };
  }, [isMenuPage]);

  return (
    <ScrollingContext.Provider value={{ isScrolling }}>
      {children}
    </ScrollingContext.Provider>
  );
}

export function useScrolling() {
  return useContext(ScrollingContext);
}
