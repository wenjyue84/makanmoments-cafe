"use client";

import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface MenuFilterProps {
  categories: string[];
  selectedCategory: string | null;
  searchQuery: string;
  onCategoryChange: (category: string | null) => void;
  onSearchChange: (query: string) => void;
  itemCount: number;
}

export function MenuFilter({
  categories,
  selectedCategory,
  searchQuery,
  onCategoryChange,
  onSearchChange,
  itemCount,
}: MenuFilterProps) {
  const t = useTranslations("menu");
  const tc = useTranslations("common");

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
          placeholder={t("searchPlaceholder")}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-4 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Category pills — horizontally scrollable on mobile, wrapping on desktop */}
      <div className="flex flex-nowrap gap-2 overflow-x-auto md:flex-wrap md:overflow-visible">
        <button
          onClick={() => onCategoryChange(null)}
          className={cn(
            "flex-shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
            selectedCategory === null
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          )}
        >
          {tc("allCategories")}
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => onCategoryChange(cat)}
            className={cn(
              "flex-shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
              selectedCategory === cat
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Count — desktop only */}
      <p className="hidden md:block text-sm text-muted-foreground">
        {t("itemsCount", { count: itemCount })}
      </p>
    </div>
  );
}
