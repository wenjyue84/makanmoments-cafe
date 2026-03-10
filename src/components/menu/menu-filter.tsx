"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Search, Heart, Mic } from "lucide-react";
import { cn } from "@/lib/utils";

const speechSupported =
  typeof window !== "undefined" &&
  ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

const FAV_KEY = "__favorites__";

interface MenuFilterProps {
  categories: string[];
  displayCategories?: string[];
  selectedCategory: string | null;
  searchQuery: string;
  onCategoryChange: (category: string | null) => void;
  onSearchChange: (query: string) => void;
  itemCount: number;
  servingNowCategories?: string[];
  favoritesCount?: number;
}

export function MenuFilter({
  categories,
  displayCategories = [],
  selectedCategory,
  searchQuery,
  onCategoryChange,
  onSearchChange,
  itemCount,
  servingNowCategories = [],
  favoritesCount = 0,
}: MenuFilterProps) {
  const t = useTranslations("menu");
  const tc = useTranslations("common");
  const [isListening, setIsListening] = useState(false);
  const [voiceReady, setVoiceReady] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  // Reveal mic after hydration to avoid SSR mismatch
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setVoiceReady(speechSupported); }, []);

  function toggleVoice() {
    if (!speechSupported) return;
    try {
      if (isListening && recognitionRef.current) {
        recognitionRef.current.stop();
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const Win = window as any;
      const SpeechRecognitionCtor = Win.SpeechRecognition || Win.webkitSpeechRecognition;
      const recognition = new SpeechRecognitionCtor();
      recognition.lang = "en-US";
      recognition.continuous = false;
      recognition.interimResults = true;

      const session = { transcript: "" };

      recognition.onstart = () => setIsListening(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        session.transcript = text;
        onSearchChange(text);
      };
      recognition.onend = () => {
        setIsListening(false);
        recognitionRef.current = null;
      };
      recognition.onerror = () => {
        setIsListening(false);
        recognitionRef.current = null;
        session.transcript = "";
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
    }
  }

  return (
    <div
      className={cn(
        // Mobile: fixed bottom bar above tray/chat widgets (bottom-16 = 4rem gap)
        "fixed bottom-16 left-0 right-0 z-40",
        "border-t border-border bg-background/95 backdrop-blur-sm",
        "px-4 pt-3",
        // Desktop: inline layout at top, full reset
        "md:relative md:bottom-auto md:left-auto md:right-auto",
        "md:border-0 md:bg-transparent md:backdrop-blur-none",
        "md:px-0 md:pt-0 md:pb-0 md:mb-6 md:space-y-4"
      )}
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      {/* Search */}
      <div className="relative mb-2 md:mb-0">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder={isListening ? t("listening") : t("searchPlaceholder")}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className={cn(
            "w-full rounded-lg border border-input bg-background py-2.5 pl-10 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary",
            voiceReady ? "pr-10" : "pr-4"
          )}
        />
        {voiceReady && (
          <button
            type="button"
            onClick={toggleVoice}
            className={cn(
              "absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 transition-colors",
              isListening
                ? "animate-pulse text-red-500"
                : "text-muted-foreground hover:text-foreground"
            )}
            aria-label={isListening ? "Stop voice search" : "Voice search"}
          >
            <Mic className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Category pills — horizontally scrollable on mobile, wrapping on desktop */}
      <div className="flex flex-nowrap gap-2 overflow-x-auto pb-0.5 md:flex-wrap md:overflow-visible">
        {/* All button */}
        <button
          onClick={() => onCategoryChange(null)}
          className={cn(
            "flex-shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
            selectedCategory === null
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          )}
        >
          {tc("allCategories")}
        </button>

        {/* POS categories */}
        {categories.map((cat) => {
          const isServingNow = servingNowCategories.includes(cat);
          return (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat)}
              className={cn(
                "flex-shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors active:scale-95",
                selectedCategory === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              )}
            >
              {isServingNow && (
                <span
                  className="inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-green-500"
                  title="Serving now"
                />
              )}
              {cat}
            </button>
          );
        })}

        {/* Display categories — visually distinct with amber styling */}
        {displayCategories.map((cat) => (
          <button
            key={`dc-${cat}`}
            onClick={() => onCategoryChange(`__dc__${cat}`)}
            className={cn(
              "flex-shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors active:scale-95",
              selectedCategory === `__dc__${cat}`
                ? "bg-amber-500 text-white"
                : "border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
            )}
          >
            {cat}
          </button>
        ))}

        {/* Favorites — shown only when the user has hearted at least one item */}
        {favoritesCount > 0 && (
          <button
            onClick={() => onCategoryChange(FAV_KEY)}
            className={cn(
              "flex-shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors active:scale-95",
              selectedCategory === FAV_KEY
                ? "bg-red-500 text-white"
                : "border border-red-300 bg-red-50 text-red-600 hover:bg-red-100"
            )}
          >
            <Heart className={cn("h-3.5 w-3.5", selectedCategory === FAV_KEY ? "fill-white text-white" : "fill-red-400 text-red-400")} />
            {tc("favorites")}
            <span className="rounded-full bg-current/20 px-1.5 py-0 text-xs">{favoritesCount}</span>
          </button>
        )}
      </div>

      {/* Count — desktop only */}
      <p className="hidden md:block text-sm text-muted-foreground">
        {t("itemsCount", { count: itemCount })}
      </p>
    </div>
  );
}
