"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Eye, EyeOff } from "lucide-react";
import Fuse from "fuse.js";
import type { MenuItem } from "@/types/menu";
import { MenuCard } from "./menu-card";
import { ChefPickCard } from "./chef-pick-card";
import { EditableMenuCard } from "./editable-menu-card";
import { MenuFilter } from "./menu-filter";
import { FadeUp } from "@/components/ui/fade-up";
import { cn } from "@/lib/utils";
import { useFavorites } from "@/hooks/use-favorites";
import { useDebounce } from "@/hooks/use-debounce";

// Display category values are prefixed with "__dc__" to distinguish from POS categories
const DC_PREFIX = "__dc__";
// Special filter key for user-favorited items
const FAVORITES_FILTER = "__favorites__";

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
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  // Validate initialCategory — fall back to null if the category doesn't exist in known lists
  const [category, setCategory] = useState<string | null>(() => {
    if (!initialCategory) return null;
    if (categories.includes(initialCategory)) return initialCategory;
    const dcPrefixed = displayCategories.map((dc) => `${DC_PREFIX}${dc}`);
    if (dcPrefixed.includes(initialCategory)) return initialCategory;
    return null;
  });
  const [isEditMode, setIsEditMode] = useState(true);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [highlights, setHighlights] = useState<Record<string, string>>(initialHighlights);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const chipBarScrollRef = useRef<HTMLDivElement>(null);

  // Resolve whether selected tab is a POS category or display category or favorites
  const isFavoritesSelected = category === FAVORITES_FILTER;
  const isDisplayCategorySelected = !isFavoritesSelected && (category?.startsWith(DC_PREFIX) ?? false);
  const selectedDisplayCat = isDisplayCategorySelected ? category!.slice(DC_PREFIX.length) : null;
  const selectedPosCat = !isDisplayCategorySelected && !isFavoritesSelected ? category : null;

  // Fuse.js instance for fuzzy search across all items (memoized to avoid re-init on every render)
  const fuse = useMemo(
    () =>
      new Fuse(items, {
        keys: ["nameEn", "nameMs", "nameZh", "description", "categories"],
        threshold: 0.4,
        minMatchCharLength: 2,
        includeScore: true,
      }),
    [items]
  );

  const filtered = useMemo(() => {
    // Fuzzy search takes precedence — search across ALL items regardless of selected category
    if (debouncedSearch.trim().length >= 2) {
      return fuse.search(debouncedSearch).map((r) => r.item);
    }

    let result = items;

    if (isFavoritesSelected) {
      result = items.filter((i) => favorites.includes(i.code));
    } else if (selectedDisplayCat) {
      const lc = selectedDisplayCat.toLowerCase();
      if (lc.includes("chef")) {
        // Chef's Picks: use junction table rows, fall back to featured=true items if empty
        const fromJunction = items.filter((item) => item.displayCategories.includes(selectedDisplayCat));
        result = fromJunction.length > 0 ? fromJunction : items.filter((i) => i.featured);
      } else if (lc.includes("rm15")) {
        // Under RM15: auto-computed from price, no junction table needed
        result = items.filter((i) => i.price < 15);
      } else if (lc.includes("vegetarian")) {
        // Vegetarian: auto-computed from dietary tags, no junction table needed
        result = items.filter((i) => i.dietary?.some((d) => d.toLowerCase() === "vegetarian"));
      } else {
        result = result.filter((item) => item.displayCategories.includes(selectedDisplayCat));
      }
    } else if (selectedPosCat) {
      result = result.filter((item) => item.categories.includes(selectedPosCat));
    }

    return result;
  }, [items, selectedPosCat, selectedDisplayCat, isFavoritesSelected, favorites, debouncedSearch, fuse]);

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
  // Note: isFlatView is used in effects below — computed after categorySections
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

  const isSearching = debouncedSearch.trim().length > 0;
  // Flat grid when: searching, display category selected, favorites, or no POS categories (all-display-category setup)
  const isFlatView = isSearching || isDisplayCategorySelected || isFavoritesSelected || categories.length === 0;

  // In flat view (customer mode): items tagged as Chef's Picks float to top as hero cards (max 2)
  const heroItems = useMemo(() => {
    if (!isFlatView || isSearching || isFavoritesSelected) return [];
    if (selectedDisplayCat?.toLowerCase().includes("chef")) return filtered.slice(0, 2);
    return filtered.filter((i) => i.displayCategories.includes("Chef's Picks")).slice(0, 2);
  }, [filtered, isFlatView, isSearching, isFavoritesSelected, selectedDisplayCat]);

  const regularFlatItems = useMemo(() => {
    const heroIds = new Set(heroItems.map((i) => i.id));
    return filtered.filter((i) => !heroIds.has(i.id));
  }, [filtered, heroItems]);

  // IntersectionObserver: update active chip as user scrolls through sections
  useEffect(() => {
    if (isFlatView || categorySections.length <= 1) {
      setActiveSection(null);
      return;
    }
    // Init first section as active
    setActiveSection((prev) => prev ?? (categorySections[0]?.cat ?? null));

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id.replace("section-", ""));
            break;
          }
        }
      },
      { rootMargin: "-108px 0px -50% 0px", threshold: 0 }
    );

    categorySections.forEach(({ cat }) => {
      const el = document.getElementById(`section-${cat}`);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [categorySections, isFlatView]);

  // Auto-scroll chip bar to keep the active chip visible
  useEffect(() => {
    if (!chipBarScrollRef.current || !activeSection) return;
    const chip = chipBarScrollRef.current.querySelector<HTMLElement>(`[data-chip="${activeSection}"]`);
    chip?.scrollIntoView({ behavior: "smooth", inline: "nearest", block: "nearest" });
  }, [activeSection]);

  const handleChipClick = useCallback((cat: string) => {
    document.getElementById(`section-${cat}`)?.scrollIntoView({ behavior: "smooth" });
  }, []);

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
        favoritesCount={favorites.length}
      />

      {/* Admin edit/customer mode toggle */}
      {isAdmin && (
        <div className="flex justify-end mb-1">
          <button
            type="button"
            onClick={() => setIsEditMode((v) => !v)}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold border transition-colors",
              isEditMode
                ? "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700"
                : "bg-green-50 text-green-800 border-green-300 hover:bg-green-100 dark:bg-green-950/40 dark:text-green-300 dark:border-green-700"
            )}
          >
            {isEditMode ? (
              <><Eye className="h-3.5 w-3.5" /> Customer View</>
            ) : (
              <><EyeOff className="h-3.5 w-3.5" /> Edit Mode</>
            )}
          </button>
        </div>
      )}

      {/* Quick-jump chip bar — mobile only, shown when browsing all sections */}
      {!isFlatView && categorySections.length > 1 && (
        <div className="sticky top-16 z-30 md:hidden bg-background/95 backdrop-blur-sm border-b border-border -mx-4 px-4 py-2 mb-2">
          <div
            ref={chipBarScrollRef}
            className="flex gap-2 overflow-x-auto pb-0.5 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]"
          >
            {categorySections.map(({ cat }) => (
              <button
                key={cat}
                data-chip={cat}
                onClick={() => handleChipClick(cat)}
                className={cn(
                  "flex-shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                  activeSection === cat
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-lg text-muted-foreground">
            {isFavoritesSelected
              ? t("noFavorites")
              : selectedDisplayCat?.toLowerCase().includes("vegetarian")
              ? t("noVegetarianItems")
              : t("noResults")}
          </p>
        </div>
      ) : isFlatView ? (
        /* Search results or display category: hero cards + flat grid */
        <div className="mt-6">
          {/* Chef's Pick hero cards — customer mode only, not while searching */}
          {(!isAdmin || !isEditMode) && heroItems.length > 0 && (
            <div className="space-y-4 mb-6">
              {heroItems.map((item, idx) => (
                <FadeUp key={item.id} delay={idx * 50}>
                  <ChefPickCard item={item} priority={idx === 0} />
                </FadeUp>
              ))}
            </div>
          )}

          {/* Regular grid */}
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {(isAdmin && isEditMode ? filtered : regularFlatItems).map((item, index) => {
              const isHighlighted =
                item.categories.some((cat) => highlights[cat] === item.id) ||
                item.displayCategories.includes("Chef's Picks");
              const isUnavailableAtPreview =
                isAdmin && hasPreviewTime
                  ? !isAvailableAtTime(item, previewHour!, previewMinute!)
                  : false;
              return isAdmin && isEditMode ? (
                <EditableMenuCard
                  key={item.id}
                  item={item}
                  isHighlighted={isHighlighted}
                  onSetHighlight={() => handleSetHighlight(item.id, item.categories)}
                  isUnavailableAtPreview={isUnavailableAtPreview}
                />
              ) : (
                <FadeUp key={item.id} delay={(index % 3) * 50}>
                  <MenuCard
                    item={item}
                    priority={index === 0}
                    isHighlighted={isHighlighted}
                    isFavorited={isFavorite(item.code)}
                    onToggleFavorite={() => toggleFavorite(item.code)}
                  />
                </FadeUp>
              );
            })}
          </div>
        </div>
      ) : (
        /* Category sections: Chef's Pick hero + regular grid */
        <div className="mt-6 space-y-10">
          {categorySections.map(({ cat, chefPick, rest }, sectionIdx) => (
            <section key={cat} id={`section-${cat}`} aria-labelledby={`cat-${cat}`} className="scroll-mt-[108px]">
              <h2
                id={`cat-${cat}`}
                className="sticky top-[108px] md:top-[68px] z-10 bg-background/95 backdrop-blur-sm -mx-4 px-4 py-3 mb-4 text-xs font-semibold tracking-widest uppercase text-muted-foreground border-b border-dashed border-border"
              >
                {cat}
              </h2>

              {/* Chef's Pick hero card — full-width */}
              {isAdmin && isEditMode ? (
                <EditableMenuCard
                  item={chefPick}
                  isHighlighted={true}
                  priority={sectionIdx === 0}
                  onSetHighlight={() => handleSetHighlight(chefPick.id, chefPick.categories)}
                  isUnavailableAtPreview={
                    hasPreviewTime ? !isAvailableAtTime(chefPick, previewHour!, previewMinute!) : false
                  }
                />
              ) : (
                <FadeUp>
                  <ChefPickCard item={chefPick} priority={sectionIdx === 0} />
                </FadeUp>
              )}

              {/* Remaining items in standard grid */}
              {rest.length > 0 && (
                <div className="mt-4 grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {rest.map((item, index) => {
                    const isHighlighted = item.categories.some((c) => highlights[c] === item.id);
                    const isUnavailableAtPreview =
                      hasPreviewTime ? !isAvailableAtTime(item, previewHour!, previewMinute!) : false;
                    return isAdmin && isEditMode ? (
                      <EditableMenuCard
                        key={item.id}
                        item={item}
                        isHighlighted={isHighlighted}
                        onSetHighlight={() => handleSetHighlight(item.id, item.categories)}
                        isUnavailableAtPreview={isUnavailableAtPreview}
                      />
                    ) : (
                      <FadeUp key={item.id} delay={(index % 3) * 50}>
                        <MenuCard
                          item={item}
                          isHighlighted={isHighlighted}
                          isFavorited={isFavorite(item.code)}
                          onToggleFavorite={() => toggleFavorite(item.code)}
                        />
                      </FadeUp>
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
