"use client";

import { useState, useMemo, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import type { MenuItem } from "@/types/menu";
import { getLocalizedName } from "@/lib/utils";
import { MenuCard } from "./menu-card";
import { ChefPickCard } from "./chef-pick-card";
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

  // Build category sections for grouped view (used when no search text)
  const categorySections = useMemo(() => {
    const activeCats = category ? [category] : categories;
    return activeCats
      .map((cat) => {
        const catItems = filtered.filter((item) => item.categories.includes(cat));
        if (catItems.length === 0) return null;
        const highlightedId = highlights[cat];
        const chefPick = catItems.find((i) => i.id === highlightedId) ?? catItems[0];
        const rest = catItems.filter((i) => i.id !== chefPick.id);
        return { cat, chefPick, rest };
      })
      .filter((s): s is NonNullable<typeof s> => s !== null);
  }, [filtered, categories, category, highlights]);

  const isSearching = search.trim().length > 0;

  return (
    <div className="pb-48 md:pb-0">
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
      ) : isSearching ? (
        /* Search results: flat grid */
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
      ) : (
        /* Category sections: Chef's Pick hero + regular grid */
        <div className="mt-6 space-y-10">
          {categorySections.map(({ cat, chefPick, rest }, sectionIdx) => (
            <section key={cat} aria-labelledby={`cat-${cat}`}>
              <h2
                id={`cat-${cat}`}
                className="mb-4 text-lg font-bold tracking-tight text-foreground border-b border-border pb-2"
              >
                {cat}
              </h2>

              {/* Chef's Pick hero card — full-width */}
              {isAdmin ? (
                <EditableMenuCard
                  item={chefPick}
                  isHighlighted={true}
                  priority={sectionIdx === 0}
                  onSetHighlight={() => handleSetHighlight(chefPick.id, chefPick.categories)}
                />
              ) : (
                <ChefPickCard item={chefPick} priority={sectionIdx === 0} />
              )}

              {/* Remaining items in standard grid */}
              {rest.length > 0 && (
                <div className="mt-4 grid gap-4 grid-cols-2 sm:grid-cols-3">
                  {rest.map((item) => {
                    const isHighlighted = item.categories.some((c) => highlights[c] === item.id);
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
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
