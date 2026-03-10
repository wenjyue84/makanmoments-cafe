"use client";

import Image from "next/image";
import { useState, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Plus, Minus, Info } from "lucide-react";
import { useTray } from "@/lib/tray-context";
import type { MenuItemWithRules } from "@/types/menu";
import { formatPrice, getLocalizedName, cn } from "@/lib/utils";
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
  const { addItem, decrementItem, items } = useTray();
  const name = getLocalizedName(item, locale);
  const [imgError, setImgError] = useState(false);
  const [recipeOpen, setRecipeOpen] = useState(false);
  const [showDesc, setShowDesc] = useState(false);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const trayItem = items.find((i) => i.id === item.code);
  const isInTray = !!trayItem;
  const hasPhoto = !!item.code && !imgError;
  const hasRecipe = !!getRecipeInfo(item.nameEn);
  const imgVersion = item.updatedAt ? new Date(item.updatedAt).getTime() : 0;
  const imgSrc = `/images/menu/${item.code}.jpg${imgVersion ? `?v=${imgVersion}` : ""}`;

  return (
    <>
      <div
        className="group w-full rounded-xl border-2 border-amber-400 ring-2 ring-amber-400/40 bg-card overflow-hidden hover-lift"
      >
        {/* Full-width landscape image */}
        <div
          className="relative aspect-video w-full overflow-hidden bg-muted cursor-pointer"
          onClick={() => setShowDesc((v) => !v)}
          onMouseEnter={() => {
            hoverTimer.current = setTimeout(() => setShowDesc(true), 2000);
          }}
          onMouseLeave={() => {
            if (hoverTimer.current) clearTimeout(hoverTimer.current);
          }}
          role="button"
          aria-label={`Toggle description for ${name}`}
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && setShowDesc((v) => !v)}
        >
          {hasPhoto ? (
            <Image
              src={imgSrc}
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

          {/* Info icon — clickable to open recipe modal */}
          {hasRecipe && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setRecipeOpen(true);
              }}
              className="absolute bottom-3 right-3 rounded-full bg-black/50 p-1.5 opacity-0 transition-opacity group-hover:opacity-100"
              aria-label={`View ingredients for ${name}`}
            >
              <Info className="h-4 w-4 text-white" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5">
          <h3 className="text-xl font-bold leading-snug">{name}</h3>

          {item.description && (
            <div
              className={cn(
                "text-base text-muted-foreground overflow-hidden transition-all duration-300",
                showDesc ? "max-h-48 opacity-100 mt-1.5" : "max-h-0 opacity-0"
              )}
            >
              {item.description}
            </div>
          )}

          {item.dietary.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {item.dietary.map((d) => (
                <DietaryBadge key={d} label={d} />
              ))}
            </div>
          )}

          {/* Price + Action row */}
          <div className="mt-4 flex items-center justify-between border-t pt-3">
            <span className="text-base font-bold text-primary">
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

            {isInTray ? (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => decrementItem(item.code)}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                  aria-label="Remove one"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-7 text-center text-base font-semibold tabular-nums">
                  {trayItem?.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => addItem({ id: item.code, name, price: item.price })}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
                  aria-label="Add one more"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => addItem({ id: item.code, name, price: item.price })}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                aria-label={tc("add")}
              >
                <Plus className="h-4 w-4" />
              </button>
            )}
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
