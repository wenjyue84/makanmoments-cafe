"use client";

import Image from "next/image";
import { useState } from "react";
import { useLocale } from "next-intl";
import { Plus, Info } from "lucide-react";
import { useTray } from "@/lib/tray-context";
import type { MenuItem } from "@/types/menu";
import { formatPrice, getLocalizedName } from "@/lib/utils";
import { DietaryBadge } from "./dietary-badge";
import { RecipeModal } from "./recipe-modal";
import { getRecipeInfo } from "@/data/recipe-info";

interface MenuCardProps {
  item: MenuItem;
  priority?: boolean;
}

export function MenuCard({ item, priority = false }: MenuCardProps) {
  const locale = useLocale();
  const { addItem } = useTray();
  const name = getLocalizedName(item, locale);
  const [imgError, setImgError] = useState(false);
  const [recipeOpen, setRecipeOpen] = useState(false);
  const hasPhoto = !!item.code && !imgError;
  const hasRecipe = !!getRecipeInfo(item.nameEn);

  return (
    <>
      <div className="group rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-md">
        {/* Photo — clickable only when recipe data exists */}
        <div
          className={`mb-3 relative aspect-[4/3] overflow-hidden rounded-lg bg-muted ${hasRecipe ? "cursor-pointer" : ""}`}
          onClick={hasRecipe ? () => setRecipeOpen(true) : undefined}
          role={hasRecipe ? "button" : undefined}
          aria-label={hasRecipe ? `View ingredients for ${name}` : undefined}
          tabIndex={hasRecipe ? 0 : undefined}
          onKeyDown={hasRecipe ? (e) => e.key === "Enter" && setRecipeOpen(true) : undefined}
        >
          {hasPhoto ? (
            <Image
              src={`/images/menu/${item.code}.jpg`}
              alt={name}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              priority={priority}
              loading={priority ? "eager" : "lazy"}
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-3xl text-muted-foreground/30">
              🍽️
            </div>
          )}
          {item.featured && (
            <span className="absolute left-2 top-2 rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground">
              ★
            </span>
          )}
          {/* Info icon — only shown when recipe exists, appears on hover */}
          {hasRecipe && (
            <span className="absolute bottom-2 right-2 rounded-full bg-black/50 p-1 opacity-0 transition-opacity group-hover:opacity-100">
              <Info className="h-3.5 w-3.5 text-white" />
            </span>
          )}
        </div>

        {/* Content */}
        <div className="space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold leading-tight">{name}</h3>
            <span className="shrink-0 text-sm font-bold text-primary">
              {formatPrice(item.price)}
            </span>
          </div>
          {item.description && (
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {item.description}
            </p>
          )}
          {item.dietary.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {item.dietary.map((d) => (
                <DietaryBadge key={d} label={d} />
              ))}
            </div>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between border-t pt-3">
          <p className="text-xs text-muted-foreground/60">{item.code}</p>
          <button
            type="button"
            onClick={() => addItem({ id: item.code, name, price: item.price })}
            className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        </div>
      </div>

      {hasRecipe && (
        <RecipeModal
          item={item}
          open={recipeOpen}
          onClose={() => setRecipeOpen(false)}
        />
      )}
    </>
  );
}
