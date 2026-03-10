"use client";

import { useEffect } from "react";

/**
 * PwaInit registers the service worker on mount.
 * Add this once to the locale layout — it runs client-side only.
 */
export function PwaInit() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((reg) => {
          console.debug("[PWA] SW registered:", reg.scope);
        })
        .catch((err) => {
          console.warn("[PWA] SW registration failed:", err);
        });
    }
  }, []);

  return null;
}
