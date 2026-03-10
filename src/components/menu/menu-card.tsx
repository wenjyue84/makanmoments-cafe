"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Plus, Minus, Info, Heart } from "lucide-react";
import { useTray } from "@/lib/tray-context";
import type { MenuItemWithRules } from "@/types/menu";
import { formatPrice, getLocalizedName, cn } from "@/lib/utils";
import { DietaryBadge } from "./dietary-badge";
import { RecipeModal } from "./recipe-modal";
import { getRecipeInfo } from "@/data/recipe-info";
import { ImageCarousel } from "./image-carousel";

interface MenuCardProps {
  item: MenuItemWithRules;
  priority?: boolean;
  isHighlighted?: boolean;
  isFavorited?: boolean;
  onToggleFavorite?: () => void;
}

export function MenuCard({ item, priority = false, isHighlighted = false, isFavorited = false, onToggleFavorite }: MenuCardProps) {
  const locale = useLocale();
  const tc = useTranslations("common");
  const { addItem, decrementItem, items } = useTray();
  const name = getLocalizedName(item, locale);
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [recipeOpen, setRecipeOpen] = useState(false);
  const [pulsing, setPulsing] = useState(false);
  const [addScaling, setAddScaling] = useState(false);
  const [showDesc, setShowDesc] = useState(false);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
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
        {/* Photo — click/hover to reveal description */}
        <div
          className={cn(
            "mb-3 relative aspect-[4/3] overflow-hidden rounded-lg cursor-pointer",
            imgLoaded || !hasPhoto ? "bg-muted" : "bg-muted animate-pulse"
          )}
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
            item.photos && item.photos.length > 1 ? (
              <ImageCarousel
                photos={item.photos}
                alt={name}
                priority={priority}
                imagePosition={item.imagePosition}
                version={imgVersion || undefined}
              />
            ) : (
              <Image
                src={`/images/menu/${item.code}.jpg${imgVersion ? `?v=${imgVersion}` : ""}`}
                alt={name}
                fill
                className="object-cover img-scale"
                style={{ objectPosition: item.imagePosition || "50% 50%" }}
                sizes="(max-width: 640px) calc(100vw - 32px), (max-width: 1024px) 50vw, 33vw"
                priority={priority}
                loading={priority ? "eager" : "lazy"}
                onLoad={() => setImgLoaded(true)}
                onError={() => setImgError(true)}
              />
            )
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
            <span className="absolute left-2 bottom-2 rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
              -{item.discountPercent}%
            </span>
          )}
          {/* Heart / Favorite toggle — top-right of image */}
          {onToggleFavorite && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite();
              }}
              className="absolute top-2 right-2 z-10 rounded-full bg-black/40 p-1.5 transition-colors hover:bg-black/60"
              aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
            >
              <Heart
                className={cn(
                  "h-4 w-4 transition-colors",
                  isFavorited ? "fill-red-500 text-red-500" : "fill-transparent text-white"
                )}
              />
            </button>
          )}
          {/* Info icon — clickable to open recipe modal when recipe exists */}
          {hasRecipe && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setRecipeOpen(true);
              }}
              className="absolute bottom-2 right-2 rounded-full bg-black/50 p-1 opacity-0 transition-opacity group-hover:opacity-100"
              aria-label={`View ingredients for ${name}`}
            >
              <Info className="h-3.5 w-3.5 text-white" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="space-y-1.5">
          <h3 className="font-semibold leading-snug">{name}</h3>
          {item.description && (
            <div
              className={cn(
                "text-sm text-muted-foreground overflow-hidden transition-all duration-300",
                showDesc ? "max-h-40 opacity-100 mt-1" : "max-h-0 opacity-0"
              )}
            >
              {item.description}
            </div>
          )}
          {item.dietary.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {item.dietary.map((d) => (
                <DietaryBadge key={d} label={d} />
              ))}
            </div>
          )}
        </div>

        {/* Price + Action row */}
        <div className="mt-3 flex items-center justify-between border-t pt-3">
          <span className="text-sm font-bold text-primary">
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

          {isInTray ? (
            <div className={cn("flex items-center gap-1", pulsing ? "animate-pulse" : "")}>
              <button
                type="button"
                onClick={() => decrementItem(item.code)}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary transition-all hover:bg-primary hover:text-primary-foreground active:scale-90"
                aria-label="Remove one"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-6 text-center text-sm font-semibold tabular-nums">
                {trayItem?.quantity}
              </span>
              <button
                type="button"
                onClick={() => {
                  addItem({ id: item.code, name, price: item.price });
                  setAddScaling(true);
                  setTimeout(() => setAddScaling(false), 150);
                }}
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all hover:bg-primary/90",
                  addScaling ? "scale-110" : "scale-100"
                )}
                aria-label="Add one more"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                addItem({ id: item.code, name, price: item.price });
                setAddScaling(true);
                setTimeout(() => setAddScaling(false), 150);
              }}
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary transition-all hover:bg-primary hover:text-primary-foreground",
                addScaling ? "scale-110" : "scale-100"
              )}
              aria-label={tc("add")}
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
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
