"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

const ChatWidget = dynamic(
  () => import("./chat-widget").then((m) => m.ChatWidget),
  { ssr: false, loading: () => null }
);

export function ChatWidgetLoader() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (mounted) return;

    function trigger() {
      setMounted(true);
    }

    window.addEventListener("scroll", trigger, { once: true, passive: true });
    window.addEventListener("click", trigger, { once: true });

    return () => {
      window.removeEventListener("scroll", trigger);
      window.removeEventListener("click", trigger);
    };
  }, [mounted]);

  if (!mounted) return null;

  return <ChatWidget />;
}
