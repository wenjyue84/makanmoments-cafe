"use client";

import { useState, useMemo, useCallback } from "react";
import { useTranslations } from "next-intl";
import type { MenuItem } from "@/types/menu";
import { MenuCard } from "./menu-card";
import { ChefPickCard } from "./chef-pick-card";
import { EditableMenuCard } from "./editable-menu-card";
import { MenuFilter } from "./menu-filter";

// Display category values are prefixed with "__dc__" to distinguish from POS categories
const DC_PREFIX = "__dc__";

interface MenuGridProps {
  items: MenuItem[];
  categories: string[];
  displayCategories?: string[];
  isAdmin?: boolean;
  highlightedByCategory?: Record<string, string>;
  initialCategory?: string | null;
  servingNowCategories?: string[];
  previewTime?: string | null;
}

/** Returns false if an item has a time restriction and the given hour/minute is outside it. */
function isAvailableAtTime(item: MenuItem, hour: number, minute: number): boolean {
  if (!item.available) return false;
  const { timeFrom, timeUntil } = item;
  if (!timeFrom || !timeUntil) return true;
  const [fh, fm] = timeFrom.split(":").map(Number);
  const [uh, um] = timeUntil.split(":").map(Number);
  const mins = hour * 60 + minute;
  return mins >= fh * 60 + fm && mins < uh * 60 + um;
}

export function MenuGrid({
  items,
  categories,
  displayCategories = [],
  isAdmin = false,
  highlightedByCategory: initialHighlights = {},
  initialCategory = null,
  servingNowCategories = [],
  previewTime = null,
}: MenuGridProps) {
  // Parse preview time once
  const previewHour = previewTime ? parseInt(previewTime.split(":")[0], 10) : null;
  const previewMinute = previewTime ? parseInt(previewTime.split(":")[1], 10) : null;
  const hasPreviewTime = previewHour !== null && previewMinute !== null && !isNaN(previewHour) && !isNaN(previewMinute);
  const t = useTranslations("common");
  // Validate initialCategory — fall back to null if the category doesn't exist in known lists
  const [category, setCategory] = useState<string | null>(() => {
    if (!initialCategory) return null;
    if (categories.includes(initialCategory)) return initialCategory;
    const dcPrefixed = displayCategories.map((dc) => `${DC_PREFIX}${dc}`);
    if (dcPrefixed.includes(initialCategory)) return initialCategory;
    return null;
  });
  const [search, setSearch] = useState("");
  const [highlights, setHighlights] = useState<Record<string, string>>(initialHighlights);

  // Resolve whether selected tab is a POS category or display category
  const isDisplayCategorySelected = category?.startsWith(DC_PREFIX) ?? false;
  const selectedDisplayCat = isDisplayCategorySelected ? category!.slice(DC_PREFIX.length) : null;
  const selectedPosCat = !isDisplayCategorySelected ? category : null;

  const filtered = useMemo(() => {
    let result = items;

    if (selectedDisplayCat) {
      result = result.filter((item) => item.displayCategories.includes(selectedDisplayCat));
    } else if (selectedPosCat) {
      result = result.filter((item) => item.categories.includes(selectedPosCat));
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((item) => {
        return (
          item.nameEn.toLowerCase().includes(q) ||
          item.nameMs.toLowerCase().includes(q) ||
          item.nameZh.toLowerCase().includes(q) ||
          item.code.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q)
        );
      });
    }

    return result;
  }, [items, selectedPosCat, selectedDisplayCat, search]);

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
    if (selectedDisplayCat) {
      // Display category selected: flat list, no chef's pick hierarchy
      return [];
    }
    const activeCats = selectedPosCat ? [selectedPosCat] : categories;
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
  }, [filtered, categories, selectedPosCat, selectedDisplayCat, highlights]);

  const isSearching = search.trim().length > 0;
  // When a display category is selected, show flat grid (no grouping)
  const isFlatView = isSearching || isDisplayCategorySelected;

  return (
    <div className="pb-48 md:pb-0">
      <MenuFilter
        categories={categories}
        displayCategories={displayCategories}
        selectedCategory={category}
        searchQuery={search}
        onCategoryChange={setCategory}
        onSearchChange={setSearch}
        itemCount={filtered.length}
        servingNowCategories={servingNowCategories}
      />

      {filtered.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-lg text-muted-foreground">{t("noResults")}</p>
        </div>
      ) : isFlatView ? (
        /* Search results or display category: flat grid */
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => {
            const isHighlighted = item.categories.some((cat) => highlights[cat] === item.id);
            const isUnavailableAtPreview =
              isAdmin && hasPreviewTime
                ? !isAvailableAtTime(item, previewHour!, previewMinute!)
                : false;
            return isAdmin ? (
              <EditableMenuCard
                key={item.id}
                item={item}
                isHighlighted={isHighlighted}
                onSetHighlight={() => handleSetHighlight(item.id, item.categories)}
                isUnavailableAtPreview={isUnavailableAtPreview}
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
