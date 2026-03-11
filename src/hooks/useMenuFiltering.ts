import { useMemo } from "react";
import Fuse from "fuse.js";
import type { MenuItem } from "@/types/menu";
import { SPECIAL_DISPLAY_CATEGORIES } from "@/lib/constants";

// Display category values are prefixed with "__dc__" to distinguish from POS categories
export const DC_PREFIX = "__dc__";

/** Returns false if an item has a time restriction and the given hour/minute is outside it. */
export function isAvailableAtTime(item: MenuItem, hour: number, minute: number): boolean {
  if (!item.available) return false;
  const { timeFrom, timeUntil } = item;
  if (!timeFrom || !timeUntil) return true;
  const [fh, fm] = timeFrom.split(":").map(Number);
  const [uh, um] = timeUntil.split(":").map(Number);
  const mins = hour * 60 + minute;
  return mins >= fh * 60 + fm && mins < uh * 60 + um;
}

// Special filter key for user-favorited items
export const FAVORITES_FILTER = "__favorites__";

// Fuse.js options defined at module level to prevent stale closure re-creation
const fuseOptions = {
  keys: ["nameEn", "nameMs", "nameZh", "description", "categories"],
  threshold: 0.4,
  minMatchCharLength: 2,
  includeScore: true,
};

export interface CategorySection {
  cat: string;
  heroItems: MenuItem[];
  rest: MenuItem[];
}

export interface UseMenuFilteringParams {
  items: MenuItem[];
  selectedCategory: string | null;
  searchQuery: string;
  highlights: Record<string, string>;
  displayCategories: string[];
  categories: string[];
  favorites: string[];
  removedFromChefsPick: Set<string>;
}

export interface UseMenuFilteringResult {
  filtered: MenuItem[];
  categorySections: CategorySection[];
  heroItems: MenuItem[];
  regularFlatItems: MenuItem[];
  isFlatView: boolean;
  isSearching: boolean;
  isFavoritesSelected: boolean;
  isDisplayCategorySelected: boolean;
  selectedDisplayCat: string | null;
  selectedPosCat: string | null;
  fuse: Fuse<MenuItem>;
  isChefsPick: (item: MenuItem) => boolean;
}

export function useMenuFiltering({
  items,
  selectedCategory,
  searchQuery,
  highlights,
  displayCategories: _displayCategories,
  categories,
  favorites,
  removedFromChefsPick,
}: UseMenuFilteringParams): UseMenuFilteringResult {
  // Fuse.js instance for fuzzy search across all items (memoized to avoid re-init on every render)
  const fuse = useMemo(() => new Fuse(items, fuseOptions), [items]);

  // Resolve whether selected tab is a POS category or display category or favorites
  const isFavoritesSelected = selectedCategory === FAVORITES_FILTER;
  const isDisplayCategorySelected =
    !isFavoritesSelected && (selectedCategory?.startsWith(DC_PREFIX) ?? false);
  const selectedDisplayCat = isDisplayCategorySelected
    ? selectedCategory!.slice(DC_PREFIX.length)
    : null;
  const selectedPosCat =
    !isDisplayCategorySelected && !isFavoritesSelected ? selectedCategory : null;

  const isChefsPick = (item: MenuItem) =>
    item.displayCategories.includes(SPECIAL_DISPLAY_CATEGORIES.CHEFS_PICKS) &&
    !removedFromChefsPick.has(item.id);

  const isSearching = searchQuery.trim().length > 0;
  const isFlatView =
    isSearching ||
    isDisplayCategorySelected ||
    isFavoritesSelected ||
    categories.length === 0;

  const filtered = useMemo(() => {
    // Fuzzy search takes precedence — search across ALL items regardless of selected category
    if (searchQuery.trim().length >= 2) {
      return fuse.search(searchQuery).map((r) => r.item);
    }

    let result = items;

    if (isFavoritesSelected) {
      result = items.filter((i) => favorites.includes(i.code));
    } else if (selectedDisplayCat) {
      if (selectedDisplayCat === SPECIAL_DISPLAY_CATEGORIES.CHEFS_PICKS) {
        // Chef's Picks: use junction table rows, fall back to featured=true items if empty
        const fromJunction = items.filter((item) =>
          item.displayCategories.includes(selectedDisplayCat)
        );
        result = fromJunction.length > 0 ? fromJunction : items.filter((i) => i.featured);
      } else if (selectedDisplayCat === SPECIAL_DISPLAY_CATEGORIES.UNDER_RM15) {
        // Under RM15: auto-computed from price, excluding drinks
        result = items.filter(
          (i) =>
            i.price < 15 &&
            !i.displayCategories.some(
              (dc) => dc === "Hot Drinks" || dc === "Cold Drinks & Juice"
            )
        );
      } else if (selectedDisplayCat === SPECIAL_DISPLAY_CATEGORIES.VEGETARIAN) {
        // Vegetarian: auto-computed from dietary tags, no junction table needed
        result = items.filter((i) =>
          i.dietary?.some((d) => d.toLowerCase() === "vegetarian")
        );
      } else {
        result = result.filter((item) =>
          item.displayCategories.includes(selectedDisplayCat)
        );
      }
    } else if (selectedPosCat) {
      result = result.filter((item) => item.categories.includes(selectedPosCat));
    }

    return result;
  }, [items, selectedPosCat, selectedDisplayCat, isFavoritesSelected, favorites, searchQuery, fuse]);

  // Build category sections for grouped view (used when no search text)
  const categorySections = useMemo<CategorySection[]>(() => {
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
        // All items tagged as Chef's Pick (admin-highlighted or in Chef's Picks display category)
        const featuredItems = catItems.filter(
          (i) =>
            i.id === highlightedId ||
            i.displayCategories.includes(SPECIAL_DISPLAY_CATEGORIES.CHEFS_PICKS)
        );
        // Fall back to first item if nothing is featured
        const effectiveFeatured =
          featuredItems.length > 0 ? featuredItems : [catItems[0]];
        // Max 2 hero cards per category
        const heroItems = effectiveFeatured.slice(0, 2);
        const heroIds = new Set(heroItems.map((i) => i.id));
        // Overflow featured items (3rd+): still Chef's Pick, but shown as regular cards
        const overflowFeatured = effectiveFeatured.slice(2);
        const overflowIds = new Set(overflowFeatured.map((i) => i.id));
        // rest = all non-hero items, with overflow featured prepended so they appear at top-left
        const nonHero = catItems.filter((i) => !heroIds.has(i.id));
        const rest = [
          ...nonHero.filter((i) => overflowIds.has(i.id)),
          ...nonHero.filter((i) => !overflowIds.has(i.id)),
        ];
        return { cat, heroItems, rest };
      })
      .filter((s): s is NonNullable<typeof s> => s !== null);
  }, [filtered, categories, selectedPosCat, selectedDisplayCat, highlights]);

  // In flat view (customer mode): items tagged as Chef's Picks float to top as hero cards.
  // When a specific display category is selected, also elevate items highlighted for their POS category.
  const heroItems = useMemo(() => {
    if (!isFlatView || isSearching || isFavoritesSelected) return [];
    if (selectedDisplayCat === SPECIAL_DISPLAY_CATEGORIES.CHEFS_PICKS)
      return filtered.slice(0, 2);
    const isChefPick = (i: MenuItem) =>
      i.displayCategories.includes(SPECIAL_DISPLAY_CATEGORIES.CHEFS_PICKS) &&
      !removedFromChefsPick.has(i.id);
    const isCategoryHighlighted = (i: MenuItem) =>
      i.categories.some((cat) => highlights[cat] === i.id) &&
      !removedFromChefsPick.has(i.id);
    if (selectedDisplayCat) {
      // Specific category view: elevate Chef's Picks AND category-highlighted items, max 2
      return filtered.filter((i) => isChefPick(i) || isCategoryHighlighted(i)).slice(0, 2);
    }
    // "All" view: only explicit Chef's Picks as heroes (no limit needed, all are intentional)
    return filtered.filter((i) => isChefPick(i));
  }, [filtered, isFlatView, isSearching, isFavoritesSelected, selectedDisplayCat, removedFromChefsPick, highlights]);

  const regularFlatItems = useMemo(() => {
    const heroIds = new Set(heroItems.map((i) => i.id));
    return filtered.filter((i) => !heroIds.has(i.id));
  }, [filtered, heroItems]);

  return {
    filtered,
    categorySections,
    heroItems,
    regularFlatItems,
    isFlatView,
    isSearching,
    isFavoritesSelected,
    isDisplayCategorySelected,
    selectedDisplayCat,
    selectedPosCat,
    fuse,
    isChefsPick,
  };
}
