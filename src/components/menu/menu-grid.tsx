"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Eye, EyeOff, X, GripHorizontal } from "lucide-react";
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
import { useScrolling } from "@/lib/scrolling-context";
import { BottomSearchBar } from "./bottom-search-bar";

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
  const [chefPickOrder, setChefPickOrder] = useState<string[]>([]);
  const [dragHeroIdx, setDragHeroIdx] = useState<number | null>(null);
  const [dragOverHeroIdx, setDragOverHeroIdx] = useState<number | null>(null);
  const [signatureItemId, setSignatureItemId] = useState<string | null>(
    () => items.find((i) => i.isSignature)?.id ?? null
  );

  // Fetch saved Chef's Pick order from DB (admin mode only)
  useEffect(() => {
    if (!isAdmin || !chefsCatId) return;
    fetch(`/api/admin/display-categories/${chefsCatId}/items`)
      .then((r) => r.json())
      .then((data: unknown) => {
        if (Array.isArray(data)) {
          setChefPickOrder((data as { id: string }[]).map((i) => i.id));
        }
      })
      .catch(() => {});
  }, [isAdmin, chefsCatId]);

  const handleRemoveChefsPick = useCallback(
    async (itemId: string) => {
      setRemovedFromChefsPick((prev) => new Set([...prev, itemId]));
      if (chefsCatId) {
        await fetch(`/api/admin/display-categories/${chefsCatId}/items?itemId=${itemId}`, { method: "DELETE" });
      }
    },
    [chefsCatId]
  );
  const handleSetSignature = useCallback(async (itemId: string) => {
    setSignatureItemId(itemId); // optimistic update
    await fetch(`/api/admin/menu/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isSignature: true }),
    });
  }, []);

  const [highlightError, setHighlightError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const chipBarScrollRef = useRef<HTMLDivElement>(null);
  const { isScrolling } = useScrolling();

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

  // Apply saved DB order to heroItems (admin only; falls back to natural order)
  const orderedHeroItems = useMemo(() => {
    if (!isAdmin || chefPickOrder.length === 0) return heroItems;
    return [...heroItems].sort((a, b) => {
      const ai = chefPickOrder.indexOf(a.id);
      const bi = chefPickOrder.indexOf(b.id);
      if (ai === -1 && bi === -1) return 0;
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
  }, [heroItems, chefPickOrder, isAdmin]);

  // Persist new Chef's Pick hero order after drag-and-drop
  const handleHeroDrop = useCallback(
    async (dropIdx: number) => {
      if (dragHeroIdx === null || dragHeroIdx === dropIdx) return;
      const newOrder = [...orderedHeroItems];
      const [removed] = newOrder.splice(dragHeroIdx, 1);
      newOrder.splice(dropIdx, 0, removed);
      const newIds = newOrder.map((i) => i.id);
      setChefPickOrder(newIds); // optimistic update
      setDragHeroIdx(null);
      setDragOverHeroIdx(null);
      if (chefsCatId) {
        await fetch(`/api/admin/display-categories/${chefsCatId}/items`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemIds: newIds }),
        });
      }
    },
    [dragHeroIdx, orderedHeroItems, chefsCatId]
  );

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
        <div className={cn(
          "sticky top-16 z-30 md:hidden bg-background/95 backdrop-blur-sm border-b border-border -mx-4 px-4 py-2 mb-2 transition-opacity duration-150",
          isScrolling && "opacity-30"
        )}>
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
          {/* Chef's Pick hero cards — shown in all modes; admin sees remove button + drag handle */}
          {orderedHeroItems.length > 0 && (
            <div className={cn(
              "mb-6",
              orderedHeroItems.length === 2
                ? "grid grid-cols-2 gap-3 items-stretch"
                : "space-y-4"
            )}>
              {orderedHeroItems.map((item, idx) => {
                const removeCallback = isAdmin && isEditMode
                  ? (isChefsPick(item)
                    ? () => handleRemoveChefsPick(item.id)
                    : item.categories.some((cat) => highlights[cat] === item.id)
                      ? () => handleRemoveHighlight(item.id, item.categories)
                      : undefined)
                  : undefined;
                const isDraggable = isAdmin && isEditMode && orderedHeroItems.length > 1 && isChefsPick(item);
                return (
                  <FadeUp key={item.id} delay={idx * 50} className={orderedHeroItems.length === 2 ? "h-full" : ""}>
                    <div
                      draggable={isDraggable}
                      onDragStart={(e) => {
                        if (!isDraggable) return;
                        setDragHeroIdx(idx);
                        e.dataTransfer.effectAllowed = "move";
                      }}
                      onDragOver={(e) => {
                        if (!isDraggable) return;
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "move";
                        if (dragHeroIdx !== null && dragHeroIdx !== idx) setDragOverHeroIdx(idx);
                      }}
                      onDrop={(e) => { e.preventDefault(); handleHeroDrop(idx); }}
                      onDragEnd={() => { setDragHeroIdx(null); setDragOverHeroIdx(null); }}
                      className={cn(
                        "relative",
                        orderedHeroItems.length === 2 ? "h-full" : "",
                        isDraggable && "cursor-grab active:cursor-grabbing",
                        dragOverHeroIdx === idx && dragHeroIdx !== idx && "ring-2 ring-primary ring-offset-2 rounded-xl",
                        dragHeroIdx === idx && "opacity-50"
                      )}
                    >
                      {isDraggable && (
                        <div className="absolute bottom-3 left-3 z-20 pointer-events-none rounded-md bg-black/50 p-1.5 text-white opacity-60">
                          <GripHorizontal className="h-4 w-4" />
                        </div>
                      )}
                      <ChefPickCard
                        item={item}
                        priority={idx === 0}
                        compact={orderedHeroItems.length === 2}
                        isAdmin={isAdmin && isEditMode}
                        isSignature={signatureItemId === item.id}
                        onRemoveChefsPick={removeCallback}
                        onSetSignature={isAdmin && isEditMode ? () => handleSetSignature(item.id) : undefined}
                      />
                    </div>
                  </FadeUp>
                );
              })}
            </div>
          )}

          {/* Regular grid — heroes excluded via regularFlatItems in both admin and customer mode */}
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {regularFlatItems.map((item, index) => {
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

              {/* Chef's Pick hero cards — up to 2 per category, shown in all modes */}
              <div className={cn(
                sectionHeroItems.length === 2
                  ? "grid grid-cols-2 gap-3 items-stretch"
                  : "space-y-4"
              )}>
                {sectionHeroItems.map((hero, heroIdx) => {
                  const removeCallback = isAdmin && isEditMode
                    ? (isChefsPick(hero)
                      ? () => handleRemoveChefsPick(hero.id)
                      : hero.categories.some((cat) => highlights[cat] === hero.id)
                        ? () => handleRemoveHighlight(hero.id, hero.categories)
                        : undefined)
                    : undefined;
                  return (
                    <FadeUp key={hero.id} className={sectionHeroItems.length === 2 ? "h-full" : ""}>
                      <ChefPickCard
                        item={hero}
                        priority={sectionIdx === 0 && heroIdx === 0}
                        compact={sectionHeroItems.length === 2}
                        isAdmin={isAdmin && isEditMode}
                        isSignature={signatureItemId === hero.id}
                        onRemoveChefsPick={removeCallback}
                        onSetSignature={isAdmin && isEditMode ? () => handleSetSignature(hero.id) : undefined}
                      />
                    </FadeUp>
                  );
                })}
              </div>

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
      {/* Bottom search pill — mobile only, synced with top MenuFilter search */}
      <BottomSearchBar search={search} onSearchChange={setSearch} />
    </div>
  );
}
