"use client";

import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useScrolling } from "@/lib/scrolling-context";

interface BottomSearchBarProps {
  search: string;
  onSearchChange: (value: string) => void;
}

export function BottomSearchBar({ search, onSearchChange }: BottomSearchBarProps) {
  const { isScrolling } = useScrolling();

  return (
    <div
      className={cn(
        "fixed bottom-6 left-4 z-50 lg:hidden",
        "transition-opacity duration-150",
        isScrolling && "opacity-30"
      )}
    >
      <div className="flex items-center gap-2 rounded-full bg-background border border-input shadow-md px-3 py-2 text-sm">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search menu..."
          className="bg-transparent outline-none min-w-0 w-32 placeholder:text-muted-foreground text-foreground"
          aria-label="Search menu items"
        />
        {search !== "" && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            aria-label="Clear search"
            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
