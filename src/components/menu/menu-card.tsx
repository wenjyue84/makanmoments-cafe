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
import { useScrolling } from "@/lib/scrolling-context";

function getCategoryEmoji(categories: string[]): string {
  const cat = (categories[0] ?? "").toLowerCase();
  if (cat.includes("beverage") || cat.includes("drink") || cat.includes("juice")) return "🧋";
  if (cat.includes("noodle") || cat.includes("fried noodle")) return "🍜";
  if (cat.includes("soup")) return "🍲";
  if (cat.includes("rice") || cat.includes("nanyang")) return "🍚";
  if (cat.includes("toast") || cat.includes("bread")) return "🍞";
  if (cat.includes("snack")) return "🍟";
  if (cat.includes("ice cream") || cat.includes("dessert")) return "🍨";
  if (cat.includes("ayam") || cat.includes("chicken")) return "🍗";
  if (cat.includes("fish") || cat.includes("thai")) return "🐟";
  return "🍽️";
}

interface MenuCardProps {
  item: MenuItemWithRules;
  priority?: boolean;
  isHighlighted?: boolean;
  isFavorited?: boolean;
  onToggleFavorite?: () => void;
  isAdmin?: boolean;
  onRemoveHighlight?: () => void;
}

export function MenuCard({ item, priority = false, isHighlighted = false, isFavorited = false, onToggleFavorite, isAdmin = false, onRemoveHighlight }: MenuCardProps) {
  const locale = useLocale();
  const tc = useTranslations("common");
  const { addItem, decrementItem, items } = useTray();
  const name = getLocalizedName(item, locale);
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [recipeOpen, setRecipeOpen] = useState(false);
  const [pulsing, setPulsing] = useState(false);
  const [showDesc, setShowDesc] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [localShowFav, setLocalShowFav] = useState(false);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const favRevealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { isScrolling } = useScrolling();
  const longPressTriggered = useRef(false);
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
    ? `group w-full overflow-hidden rounded-xl border hover-lift transition-colors bg-green-50/40 dark:bg-green-900/10 ring-2 ring-green-400/40 ${isHighlighted ? "border-amber-400" : "border-green-300/60"}`
    : `group w-full overflow-hidden rounded-xl border bg-card hover-lift ${isHighlighted ? "border-amber-400 ring-2 ring-amber-400/60" : "border-border"}`;

  return (
    <>
      <div
        className={cardClass}
        onMouseEnter={() => {
          setShowInfo(true);
          hoverTimer.current = setTimeout(() => setShowDesc(true), 2000);
          favRevealTimer.current = setTimeout(() => setLocalShowFav(true), 2000);
        }}
        onMouseLeave={() => {
          setShowInfo(false);
          if (hoverTimer.current) clearTimeout(hoverTimer.current);
          if (favRevealTimer.current) clearTimeout(favRevealTimer.current);
          setLocalShowFav(false);
        }}
        onTouchStart={() => {
          favRevealTimer.current = setTimeout(() => setLocalShowFav(true), 2000);
        }}
        onTouchEnd={() => {
          if (favRevealTimer.current) clearTimeout(favRevealTimer.current);
          setLocalShowFav(false);
        }}
        onTouchCancel={() => {
          if (favRevealTimer.current) clearTimeout(favRevealTimer.current);
          setLocalShowFav(false);
        }}
      >
        {/* Photo — click to toggle description, touch-hold 2s to reveal info */}
        <div
          className={cn(
            "relative aspect-[4/3] overflow-hidden cursor-pointer",
            imgLoaded || !hasPhoto ? "bg-muted" : "bg-muted animate-pulse"
          )}
          onClick={() => {
            if (longPressTriggered.current) {
              longPressTriggered.current = false;
              return;
            }
            setShowDesc((v) => !v);
          }}
          onTouchStart={() => {
            longPressTriggered.current = false;
            longPressTimer.current = setTimeout(() => {
              longPressTriggered.current = true;
              setShowInfo(true);
            }, 2000);
          }}
          onTouchEnd={() => {
            if (longPressTimer.current) clearTimeout(longPressTimer.current);
            if (longPressTriggered.current) {
              longPressTriggered.current = false;
              setShowInfo(false);
            }
          }}
          onTouchCancel={() => {
            if (longPressTimer.current) clearTimeout(longPressTimer.current);
            longPressTriggered.current = false;
            setShowInfo(false);
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
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-amber-100 to-orange-200 dark:from-amber-900/40 dark:to-orange-900/30">
              <span className="text-4xl" aria-hidden="true">{getCategoryEmoji(item.categories)}</span>
            </div>
          )}
          {isHighlighted && (
            isAdmin && onRemoveHighlight ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveHighlight();
                }}
                className="absolute left-2 top-2 rounded-full bg-amber-400 px-2.5 py-0.5 text-xs font-bold text-amber-900 shadow cursor-pointer hover:opacity-75 transition-opacity"
                title="Click to remove from Chef's Pick"
              >
                ★ Chef&apos;s Pick ✕
              </button>
            ) : (
              <span className="absolute left-2 top-2 rounded-full bg-amber-400 px-2.5 py-0.5 text-xs font-bold text-amber-900 shadow">
                ★ Chef&apos;s Pick
              </span>
            )
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

        {/* Collapsible info drawer — slides down on hover (desktop) / 2s hold (mobile) */}
        <div
          className={cn(
            "overflow-hidden transition-[max-height,opacity] duration-300 ease-out",
            showInfo ? "max-h-48 opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <div
            className={cn(
              "px-4 pt-3 pb-4 transition-transform duration-300",
              showInfo ? "translate-y-0" : "-translate-y-2"
            )}
          >
            <div className="flex items-start justify-between gap-3">
              {/* Left: name + price + description + dietary */}
              <div className="flex-1 min-w-0 space-y-1">
                <p className="font-semibold leading-snug text-sm text-foreground truncate">{name}</p>
                <p className="text-xs font-bold text-primary">
                  {item.originalPrice ? (
                    <>
                      <s className="text-muted-foreground font-normal mr-1">{formatPrice(item.originalPrice)}</s>
                      {formatPrice(item.price)}
                    </>
                  ) : (
                    formatPrice(item.price)
                  )}
                </p>
                {item.description && (
                  <div
                    className={cn(
                      "text-xs text-muted-foreground overflow-hidden transition-all duration-300",
                      showDesc ? "max-h-40 opacity-100 pt-0.5" : "max-h-0 opacity-0"
                    )}
                  >
                    {item.description}
                  </div>
                )}
                {item.dietary.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {item.dietary.map((d) => (
                      <DietaryBadge key={d} label={d} />
                    ))}
                  </div>
                )}
              </div>

              {/* Right: action buttons */}
              <div className="shrink-0">
                {isInTray ? (
                  <div className={cn("flex items-center gap-1", pulsing ? "animate-pulse" : "")}>
                    <button
                      type="button"
                      onClick={() => decrementItem(item.code)}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary transition-all active:scale-95 hover:bg-primary hover:text-primary-foreground"
                      aria-label="Remove one"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-5 text-center text-sm font-semibold tabular-nums">
                      {trayItem?.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => addItem({ id: item.code, name, price: item.price })}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all active:scale-95 hover:bg-primary/90"
                      aria-label="Add one more"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => addItem({ id: item.code, name, price: item.price })}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary transition-all active:scale-95 hover:bg-primary hover:text-primary-foreground"
                    aria-label={tc("add")}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
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
