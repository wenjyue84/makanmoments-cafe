"use client";

import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";

const ChatPanel = dynamic(() => import("./chat-panel").then((mod) => mod.ChatPanel), {
  ssr: false,
});

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);

  function handleOpen() {
    setOpen(true);
    setHasUnread(false);
  }

  return (
    <>
      {/* Chat Panel */}
      {open && (
        <>
          {/* Mobile: full-screen overlay */}
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md md:hidden">
            <ChatPanel onClose={() => setOpen(false)} />
          </div>

          {/* Desktop: floating panel */}
          <div className="fixed bottom-20 right-4 z-50 hidden h-[600px] w-[400px] overflow-hidden rounded-2xl border border-border/60 bg-background/80 shadow-2xl backdrop-blur-md md:block">
            <ChatPanel onClose={() => setOpen(false)} />
          </div>
        </>
      )}

      {/* Floating button */}
      <button
        onClick={() => (open ? setOpen(false) : handleOpen())}
        className={cn(
          "fixed bottom-4 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-110",
          !open && "animate-breathe",
          open && "md:flex hidden"
        )}
        aria-label="Open AI Waiter chat"
      >
        {open ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}

        {/* Unread badge */}
        {!open && hasUnread && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-background">
            1
          </span>
        )}
      </button>
    </>
  );
}

