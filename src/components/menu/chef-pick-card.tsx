"use client";

import Image from "next/image";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Plus, Info } from "lucide-react";
import { useTray } from "@/lib/tray-context";
import type { MenuItemWithRules } from "@/types/menu";
import { formatPrice, getLocalizedName } from "@/lib/utils";
import { DietaryBadge } from "./dietary-badge";
import { RecipeModal } from "./recipe-modal";
import { getRecipeInfo } from "@/data/recipe-info";

interface ChefPickCardProps {
  item: MenuItemWithRules;
  priority?: boolean;
}

export function ChefPickCard({ item, priority = false }: ChefPickCardProps) {
  const locale = useLocale();
  const tc = useTranslations("common");
  const { addItem } = useTray();
  const name = getLocalizedName(item, locale);
  const [imgError, setImgError] = useState(false);
  const [recipeOpen, setRecipeOpen] = useState(false);
  const hasPhoto = !!item.code && !imgError;
  const hasRecipe = !!getRecipeInfo(item.nameEn);

  return (
    <>
      <div
        className="group w-full rounded-xl border-2 border-amber-400 ring-2 ring-amber-400/40 bg-card overflow-hidden hover-lift"
      >
        {/* Full-width landscape image */}
        <div
          className={`relative aspect-video w-full overflow-hidden bg-muted ${hasRecipe ? "cursor-pointer" : ""}`}
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
              className="object-cover img-scale"
              style={{ objectPosition: item.imagePosition || "50% 50%" }}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 800px"
              priority={priority}
              loading={priority ? "eager" : "lazy"}
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-5xl text-muted-foreground/30">
              🍽️
            </div>
          )}

          {/* Chef's Pick badge */}
          <span className="absolute left-3 top-3 rounded-full bg-amber-400 px-3 py-1 text-sm font-bold text-amber-900 shadow-md">
            ★ Chef&apos;s Pick
          </span>

          {item.discountPercent && (
            <span className="absolute right-3 top-3 rounded-full bg-red-500 px-2.5 py-1 text-sm font-bold text-white">
              -{item.discountPercent}%
            </span>
          )}

          {/* Info icon for recipe */}
          {hasRecipe && (
            <span className="absolute bottom-3 right-3 rounded-full bg-black/50 p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
              <Info className="h-4 w-4 text-white" />
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5">
          <div className="space-y-0.5">
            <h3 className="text-xl font-bold leading-snug">{name}</h3>
            <span className="block text-base font-bold text-primary">
              {item.originalPrice ? (
                <>
                  <s className="mr-1 text-sm font-normal text-muted-foreground">
                    {formatPrice(item.originalPrice)}
                  </s>
                  {formatPrice(item.price)}
                </>
              ) : (
                formatPrice(item.price)
              )}
            </span>
          </div>

          {item.description && (
            <p className="mt-1.5 line-clamp-3 text-base text-muted-foreground">
              {item.description}
            </p>
          )}

          {item.dietary.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {item.dietary.map((d) => (
                <DietaryBadge key={d} label={d} />
              ))}
            </div>
          )}

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={() => addItem({ id: item.code, name, price: item.price })}
              className="flex items-center gap-1.5 rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              <Plus className="h-4 w-4" />
              {tc("add")}
            </button>
          </div>
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
