"use client";

import { useEffect, useRef, useState } from "react";

// Shared IntersectionObserver singleton — one observer for all FadeUp instances
const callbacks = new Map<Element, (entry: IntersectionObserverEntry) => void>();
let sharedObserver: IntersectionObserver | null = null;

function getSharedObserver(threshold: number): IntersectionObserver {
  if (!sharedObserver) {
    sharedObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const cb = callbacks.get(entry.target);
          if (cb) cb(entry);
        }
      },
      { threshold }
    );
  }
  return sharedObserver;
}

export function useIntersectionObserver(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = getSharedObserver(threshold);
    callbacks.set(el, (entry) => {
      if (entry.isIntersecting) {
        setInView(true);
        observer.unobserve(el);
        callbacks.delete(el);
      }
    });
    observer.observe(el);

    return () => {
      observer.unobserve(el);
      callbacks.delete(el);
    };
  }, [threshold]);

  return { ref, inView };
}
