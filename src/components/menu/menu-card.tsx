"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Plus, Check, Info } from "lucide-react";
import { useTray } from "@/lib/tray-context";
import type { MenuItemWithRules } from "@/types/menu";
import { formatPrice, getLocalizedName } from "@/lib/utils";
import { DietaryBadge } from "./dietary-badge";
import { RecipeModal } from "./recipe-modal";
import { getRecipeInfo } from "@/data/recipe-info";

interface MenuCardProps {
  item: MenuItemWithRules;
  priority?: boolean;
  isHighlighted?: boolean;
}

export function MenuCard({ item, priority = false, isHighlighted = false }: MenuCardProps) {
  const locale = useLocale();
  const tc = useTranslations("common");
  const { addItem, items } = useTray();
  const name = getLocalizedName(item, locale);
  const [imgError, setImgError] = useState(false);
  const [recipeOpen, setRecipeOpen] = useState(false);
  const [pulsing, setPulsing] = useState(false);
  const prevQuantityRef = useRef<number>(0);
  const imgVersion = item.updatedAt ? new Date(item.updatedAt).getTime() : 0;
  const hasPhoto = !!item.code && !imgError;
  const hasRecipe = !!getRecipeInfo(item.nameEn);

  const trayItem = items.find((i) => i.id === item.code);
  const isInTray = !!trayItem;

  // Pulse when quantity increases (re-add)
  useEffect(() => {
    const qty = trayItem?.quantity ?? 0;
    if (qty > prevQuantityRef.current && prevQuantityRef.current > 0) {
      setPulsing(true);
      const t = setTimeout(() => setPulsing(false), 600);
      return () => clearTimeout(t);
    }
    prevQuantityRef.current = qty;
  }, [trayItem?.quantity]);

  const cardClass = isInTray
    ? `group rounded-xl border p-4 hover-lift transition-colors bg-green-50/40 dark:bg-green-900/10 ring-2 ring-green-400/40 ${isHighlighted ? "border-amber-400" : "border-green-300/60"}`
    : `group rounded-xl border bg-card p-4 hover-lift ${isHighlighted ? "border-amber-400 ring-2 ring-amber-400/60" : "border-border"}`;

  return (
    <>
      <div className={cardClass}>
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
              src={`/images/menu/${item.code}.jpg${imgVersion ? `?v=${imgVersion}` : ""}`}
              alt={name}
              fill
              className="object-cover img-scale"
              style={{ objectPosition: item.imagePosition || "50% 50%" }}
              sizes="(max-width: 640px) calc(100vw - 32px), (max-width: 1024px) 50vw, 33vw"
              priority={priority}
              loading={priority ? "eager" : "lazy"}
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-3xl text-muted-foreground/30">
              🍽️
            </div>
          )}
          {isHighlighted && (
            <span className="absolute left-2 top-2 rounded-full bg-amber-400 px-2.5 py-0.5 text-xs font-bold text-amber-900 shadow">
              ★ Chef&apos;s Pick
            </span>
          )}
          {!isHighlighted && item.featured && (
            <span className="absolute left-2 top-2 rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground">
              ★
            </span>
          )}
          {item.discountPercent && (
            <span className="absolute right-2 top-2 rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
              -{item.discountPercent}%
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
          <div className="space-y-0.5">
            <h3 className="font-semibold leading-snug">{name}</h3>
            <span className="block text-sm font-bold text-primary">
              {item.originalPrice ? (
                <>
                  <s className="text-muted-foreground text-xs font-normal mr-1">
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

        <div className="mt-3 flex items-center justify-end border-t pt-3">
          <button
            type="button"
            onClick={() => addItem({ id: item.code, name, price: item.price })}
            className={`flex min-h-[36px] items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold transition-colors ${
              isInTray
                ? `bg-green-500 text-white hover:bg-green-600 ${pulsing ? "animate-pulse" : ""}`
                : "bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground"
            }`}
          >
            {isInTray ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {isInTray ? tc("added") : tc("add")}
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
