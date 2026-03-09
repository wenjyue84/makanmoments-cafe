"use client";

import { useState, useMemo, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import type { MenuItem } from "@/types/menu";
import { getLocalizedName } from "@/lib/utils";
import { MenuCard } from "./menu-card";
import { EditableMenuCard } from "./editable-menu-card";
import { MenuFilter } from "./menu-filter";

interface MenuGridProps {
  items: MenuItem[];
  categories: string[];
  isAdmin?: boolean;
  highlightedByCategory?: Record<string, string>;
}

export function MenuGrid({
  items,
  categories,
  isAdmin = false,
  highlightedByCategory: initialHighlights = {},
}: MenuGridProps) {
  const t = useTranslations("common");
  const locale = useLocale();
  const [category, setCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [highlights, setHighlights] = useState<Record<string, string>>(initialHighlights);

  const filtered = useMemo(() => {
    let result = items;

    if (category) {
      result = result.filter((item) => item.categories.includes(category));
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((item) => {
        const name = getLocalizedName(item, locale).toLowerCase();
        return (
          name.includes(q) ||
          item.code.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q)
        );
      });
    }

    return result;
  }, [items, category, search, locale]);

  const handleSetHighlight = useCallback(async (itemId: string, itemCategories: string[]) => {
    // Optimistic update
    const newHighlights = { ...highlights };
    for (const cat of itemCategories) {
      newHighlights[cat] = itemId;
    }
    setHighlights(newHighlights);

    // Persist each category
    await Promise.all(
      itemCategories.map((cat) =>
        fetch("/api/admin/highlights", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ category: cat, itemId }),
        })
      )
    );
  }, [highlights]);

  return (
    <div>
      <MenuFilter
        categories={categories}
        selectedCategory={category}
        searchQuery={search}
        onCategoryChange={setCategory}
        onSearchChange={setSearch}
        itemCount={filtered.length}
      />

      {filtered.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-lg text-muted-foreground">{t("noResults")}</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => {
            const isHighlighted = item.categories.some((cat) => highlights[cat] === item.id);
            return isAdmin ? (
              <EditableMenuCard
                key={item.id}
                item={item}
                isHighlighted={isHighlighted}
                onSetHighlight={() => handleSetHighlight(item.id, item.categories)}
              />
            ) : (
              <MenuCard key={item.id} item={item} isHighlighted={isHighlighted} />
            );
          })}
        </div>
      )}
    </div>
  );
}
