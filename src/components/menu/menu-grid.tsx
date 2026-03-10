"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Eye, EyeOff, X } from "lucide-react";
import type { MenuItem } from "@/types/menu";
import { MenuCard } from "./menu-card";
import { ChefPickCard } from "./chef-pick-card";
import { EditableMenuCard } from "./editable-menu-card";
import { MenuFilter } from "./menu-filter";
import { FadeUp } from "@/components/ui/fade-up";
import { cn } from "@/lib/utils";
import { useFavorites } from "@/hooks/use-favorites";
import { useDebounce } from "@/hooks/use-debounce";
import { SPECIAL_DISPLAY_CATEGORIES } from "@/lib/constants";
import { useMenuFiltering, DC_PREFIX, isAvailableAtTime } from "@/hooks/useMenuFiltering";

interface MenuGridProps {
  items: MenuItem[];
  categories: string[];
  displayCategories?: string[];
  isAdmin?: boolean;
  highlightedByCategory?: Record<string, string>;
  initialCategory?: string | null;
  servingNowCategories?: string[];
  previewTime?: string | null;
  chefsCatId?: string | null;
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
  chefsCatId = null,
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
  const [removedFromChefsPick, setRemovedFromChefsPick] = useState<Set<string>>(new Set());

  const handleRemoveChefsPick = useCallback(
    async (itemId: string) => {
      setRemovedFromChefsPick((prev) => new Set([...prev, itemId]));
      if (chefsCatId) {
        await fetch(`/api/admin/display-categories/${chefsCatId}/items?itemId=${itemId}`, { method: "DELETE" });
      }
    },
    [chefsCatId]
  );
  const [highlightError, setHighlightError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const chipBarScrollRef = useRef<HTMLDivElement>(null);

  const {
    filtered,
    categorySections,
    heroItems,
    regularFlatItems,
    isFlatView,
    isFavoritesSelected,
    selectedDisplayCat,
    isChefsPick,
  } = useMenuFiltering({
    items,
    selectedCategory: category,
    searchQuery: debouncedSearch,
    highlights,
    displayCategories,
    categories,
    favorites,
    removedFromChefsPick,
  });

  const handleSetHighlight = useCallback(async (itemId: string, itemCategories: string[]) => {
    const prevHighlights = { ...highlights };
    // Optimistic update
    const newHighlights = { ...highlights };
    for (const cat of itemCategories) {
      newHighlights[cat] = itemId;
    }
    setHighlights(newHighlights);
    setHighlightError(null);

    try {
      await Promise.all(
        itemCategories.map(async (cat) => {
          const res = await fetch("/api/admin/highlights", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ category: cat, itemId }),
          });
          if (!res.ok) throw new Error("Failed to save highlight");
        })
      );
    } catch {
      // Rollback on error
      setHighlights(prevHighlights);
      setHighlightError("Failed to save Chef's Pick — change reverted");
    }
  }, [highlights]);

  const handleRemoveHighlight = useCallback(async (itemId: string, itemCategories: string[]) => {
    const prevHighlights = { ...highlights };
    // Optimistic update: remove this item from highlights for its categories
    const newHighlights = { ...highlights };
    for (const cat of itemCategories) {
      if (newHighlights[cat] === itemId) {
        delete newHighlights[cat];
      }
    }
    setHighlights(newHighlights);
    setHighlightError(null);

    try {
      const categoriesToClear = itemCategories.filter((cat) => prevHighlights[cat] === itemId);
      await Promise.all(
        categoriesToClear.map(async (cat) => {
          const res = await fetch("/api/admin/highlights", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ category: cat }),
          });
          if (!res.ok) throw new Error("Failed to remove highlight");
        })
      );
    } catch {
      // Rollback on error
      setHighlights(prevHighlights);
      setHighlightError("Failed to remove Chef's Pick — change reverted");
    }
  }, [highlights]);

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

      {/* Highlight error toast */}
      {highlightError && (
        <div className="flex items-center justify-between gap-2 rounded-lg bg-destructive px-3 py-2 text-sm text-destructive-foreground mb-2">
          <span>{highlightError}</span>
          <button type="button" onClick={() => setHighlightError(null)} aria-label="Dismiss">
            <X className="h-3.5 w-3.5" />
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
              : selectedDisplayCat === SPECIAL_DISPLAY_CATEGORIES.VEGETARIAN
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
                isChefsPick(item);
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
                  onRemoveChefsPick={isChefsPick(item) ? () => handleRemoveChefsPick(item.id) : undefined}
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
                    isAdmin={isAdmin}
                    onRemoveHighlight={isHighlighted ? () => handleRemoveHighlight(item.id, item.categories) : undefined}
                  />
                </FadeUp>
              );
            })}
          </div>
        </div>
      ) : (
        /* Category sections: Chef's Pick hero cards (max 2) + regular grid */
        <div className="mt-6 space-y-10">
          {categorySections.map(({ cat, heroItems: sectionHeroItems, rest }, sectionIdx) => (
            <section key={cat} id={`section-${cat}`} aria-labelledby={`cat-${cat}`} className="scroll-mt-[108px]">
              <h2
                id={`cat-${cat}`}
                className="sticky top-[108px] md:top-[68px] z-10 bg-background/95 backdrop-blur-sm -mx-4 px-4 py-3 mb-4 text-xs font-semibold tracking-widest uppercase text-muted-foreground border-b border-dashed border-border"
              >
                {cat}
              </h2>

              {/* Chef's Pick hero cards — up to 2 per category */}
              {isAdmin && isEditMode ? (
                <div className="space-y-4">
                  {sectionHeroItems.map((hero, heroIdx) => (
                    <EditableMenuCard
                      key={hero.id}
                      item={hero}
                      isHighlighted={true}
                      priority={sectionIdx === 0 && heroIdx === 0}
                      onSetHighlight={() => handleSetHighlight(hero.id, hero.categories)}
                      onRemoveChefsPick={isChefsPick(hero) ? () => handleRemoveChefsPick(hero.id) : undefined}
                      isUnavailableAtPreview={
                        hasPreviewTime ? !isAvailableAtTime(hero, previewHour!, previewMinute!) : false
                      }
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {sectionHeroItems.map((hero, heroIdx) => (
                    <FadeUp key={hero.id}>
                      <ChefPickCard item={hero} priority={sectionIdx === 0 && heroIdx === 0} />
                    </FadeUp>
                  ))}
                </div>
              )}

              {/* Remaining items in standard grid (overflow Chef's Picks appear at top-left with badge) */}
              {rest.length > 0 && (
                <div className="mt-4 grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {rest.map((item, index) => {
                    const isHighlighted =
                      item.categories.some((c) => highlights[c] === item.id) ||
                      isChefsPick(item);
                    const isUnavailableAtPreview =
                      hasPreviewTime ? !isAvailableAtTime(item, previewHour!, previewMinute!) : false;
                    return isAdmin && isEditMode ? (
                      <EditableMenuCard
                        key={item.id}
                        item={item}
                        isHighlighted={isHighlighted}
                        onSetHighlight={() => handleSetHighlight(item.id, item.categories)}
                        onRemoveChefsPick={isChefsPick(item) ? () => handleRemoveChefsPick(item.id) : undefined}
                        isUnavailableAtPreview={isUnavailableAtPreview}
                      />
                    ) : (
                      <FadeUp key={item.id} delay={(index % 3) * 50}>
                        <MenuCard
                          item={item}
                          isHighlighted={isHighlighted}
                          isFavorited={isFavorite(item.code)}
                          onToggleFavorite={() => toggleFavorite(item.code)}
                          isAdmin={isAdmin}
                          onRemoveHighlight={isHighlighted ? () => handleRemoveHighlight(item.id, item.categories) : undefined}
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
