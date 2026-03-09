"use client";

import { useState, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import type { MenuItem } from "@/types/menu";
import { getLocalizedName } from "@/lib/utils";
import { MenuCard } from "./menu-card";
import { MenuFilter } from "./menu-filter";

interface MenuGridProps {
  items: MenuItem[];
  categories: string[];
}

export function MenuGrid({ items, categories }: MenuGridProps) {
  const t = useTranslations("common");
  const locale = useLocale();
  const [category, setCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");

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
          {filtered.map((item) => (
            <MenuCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
