"use client";

import Image from "next/image";
import { useState, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Plus, Camera, Pencil, Check, X, Loader2, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from "lucide-react";
import { useTray } from "@/lib/tray-context";
import type { MenuItemWithRules } from "@/types/menu";
import { formatPrice, getLocalizedName } from "@/lib/utils";
import { DietaryBadge } from "./dietary-badge";
import { RecipeModal } from "./recipe-modal";
import { getRecipeInfo } from "@/data/recipe-info";

interface EditableMenuCardProps {
  item: MenuItemWithRules;
  priority?: boolean;
  isHighlighted?: boolean;
  onSetHighlight?: () => void;
  isUnavailableAtPreview?: boolean;
}

type EditTarget = "description" | "price" | null;

function parsePosition(pos: string): [number, number] {
  const parts = pos.split(" ").map((p) => parseInt(p, 10));
  return [isNaN(parts[0]) ? 50 : parts[0], isNaN(parts[1]) ? 50 : parts[1]];
}

function shiftPosition(pos: string, dx: number, dy: number): string {
  const [x, y] = parsePosition(pos);
  const nx = Math.max(0, Math.min(100, x + dx));
  const ny = Math.max(0, Math.min(100, y + dy));
  return `${nx}% ${ny}%`;
}

export function EditableMenuCard({
  item,
  priority = false,
  isHighlighted = false,
  onSetHighlight,
  isUnavailableAtPreview = false,
}: EditableMenuCardProps) {
  const locale = useLocale();
  const tc = useTranslations("common");
  const { addItem } = useTray();

  const [localItem, setLocalItem] = useState<MenuItemWithRules>(item);
  const [imgSrc, setImgSrc] = useState(`/images/menu/${item.code}.jpg`);
  const [imgError, setImgError] = useState(false);

  const [editing, setEditing] = useState<EditTarget>(null);
  const [draftValue, setDraftValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [recipeOpen, setRecipeOpen] = useState(false);

  // Focal point state
  const [imagePosition, setImagePosition] = useState(item.imagePosition || "50% 50%");
  const [positionDirty, setPositionDirty] = useState(false);
  const [savingPosition, setSavingPosition] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  const name = getLocalizedName(localItem, locale);
  const hasPhoto = !imgError;
  const hasRecipe = !!getRecipeInfo(localItem.nameEn);

  async function patchItem(updates: Record<string, unknown>) {
    setSaving(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/admin/menu/${localItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || "Save failed");
      }
      const row = await res.json();
      setLocalItem((prev) => ({
        ...prev,
        price: row.price !== undefined ? Number(row.price) : prev.price,
        description: row.description ?? prev.description,
      }));
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(target: EditTarget) {
    if (target === "description") setDraftValue(localItem.description || "");
    if (target === "price") setDraftValue(String(localItem.price));
    setEditing(target);
  }

  async function commitEdit() {
    if (!editing) return;
    if (editing === "price") {
      const val = parseFloat(draftValue);
      if (isNaN(val) || val <= 0) { cancelEdit(); return; }
      await patchItem({ price: val });
    }
    if (editing === "description") {
      await patchItem({ description: draftValue.trim() });
    }
    setEditing(null);
  }

  function cancelEdit() {
    setEditing(null);
    setErrorMsg(null);
  }

  function adjustPosition(dx: number, dy: number) {
    const newPos = shiftPosition(imagePosition, dx, dy);
    setImagePosition(newPos);
    setPositionDirty(true);
  }

  async function savePosition() {
    setSavingPosition(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/admin/menu/${localItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imagePosition }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || "Save failed");
      }
      setLocalItem((prev) => ({ ...prev, imagePosition }));
      setPositionDirty(false);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSavingPosition(false);
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSaving(true);
    setErrorMsg(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("code", localItem.code);
      const res = await fetch("/api/admin/images", { method: "POST", body: fd });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || "Upload failed");
      }
      const { path } = (await res.json()) as { path: string };
      setImgError(false);
      setImgSrc(`${path}?v=${Date.now()}`);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setSaving(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <>
      <div className={`relative rounded-xl border bg-card p-4 hover-lift group/card ${isHighlighted ? "border-amber-400 ring-2 ring-amber-400/60" : "border-amber-400/60"} ${isUnavailableAtPreview ? "opacity-50" : ""}`}>
        {/* Preview-unavailable overlay */}
        {isUnavailableAtPreview && (
          <div className="absolute inset-x-3 top-2 z-20 flex items-center justify-center">
            <span className="rounded-full bg-slate-700/80 px-2.5 py-0.5 text-xs font-medium text-white">
              Not serving at preview time
            </span>
          </div>
        )}

        {/* Saving overlay */}
        {saving && (
          <div className="absolute inset-0 z-30 flex items-center justify-center rounded-xl bg-black/40">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        )}

        {/* Error toast */}
        {errorMsg && (
          <div className="absolute inset-x-3 top-2 z-30 flex items-center justify-between gap-2 rounded bg-destructive px-3 py-1.5 text-xs text-destructive-foreground">
            <span>{errorMsg}</span>
            <button type="button" onClick={() => setErrorMsg(null)}>
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleImageUpload}
        />

        {/* Image area */}
        <div className="mb-3 relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">
          {hasPhoto ? (
            <Image
              src={imgSrc}
              alt={name}
              fill
              className="object-cover img-scale"
              style={{ objectPosition: imagePosition }}
              sizes="(max-width: 640px) calc(100vw - 32px), (max-width: 1024px) 50vw, 33vw"
              priority={priority}
              loading={priority ? "eager" : "lazy"}
              onError={() => setImgError(true)}
              unoptimized={imgSrc.includes("?v=")}
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
          {!isHighlighted && localItem.featured && (
            <span className="absolute left-2 top-2 rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground">
              ★
            </span>
          )}
          {localItem.discountPercent && (
            <span className="absolute right-2 top-2 rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
              -{localItem.discountPercent}%
            </span>
          )}

          {/* Set as Highlight button — visible on hover in admin mode */}
          {!isHighlighted && onSetHighlight && (
            <button
              type="button"
              onClick={onSetHighlight}
              className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-amber-400/90 px-2.5 py-1.5 text-xs font-bold text-amber-900 opacity-0 transition-opacity group-hover/card:opacity-100 hover:bg-amber-400"
              title="Set as Chef's Pick for this category"
            >
              ★ Set as Highlight
            </button>
          )}

          {/* Camera button — always visible in edit mode */}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/70 px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-black/90"
            title="Change photo"
          >
            <Camera className="h-3.5 w-3.5" />
            Photo
          </button>

          {/* Focal point arrow controls — shown on hover */}
          {hasPhoto && (
            <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 transition-opacity group-hover/card:opacity-100 pointer-events-none">
              <div className="pointer-events-auto flex flex-col items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => adjustPosition(0, -5)}
                  className="rounded bg-black/60 p-1 text-white hover:bg-black/80"
                  title="Pan up"
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <div className="flex gap-0.5">
                  <button
                    type="button"
                    onClick={() => adjustPosition(-5, 0)}
                    className="rounded bg-black/60 p-1 text-white hover:bg-black/80"
                    title="Pan left"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                  </button>
                  <div className="h-7 w-7" />
                  <button
                    type="button"
                    onClick={() => adjustPosition(5, 0)}
                    className="rounded bg-black/60 p-1 text-white hover:bg-black/80"
                    title="Pan right"
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => adjustPosition(0, 5)}
                  className="rounded bg-black/60 p-1 text-white hover:bg-black/80"
                  title="Pan down"
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Save position button — shown when position changed */}
        {positionDirty && (
          <div className="mb-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => void savePosition()}
              disabled={savingPosition}
              className="flex items-center gap-1 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {savingPosition ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
              Save Position
            </button>
            <button
              type="button"
              onClick={() => { setImagePosition(localItem.imagePosition || "50% 50%"); setPositionDirty(false); }}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Reset
            </button>
          </div>
        )}

        {/* Content */}
        <div className="space-y-1.5">
          <div className="space-y-0.5">
            <h3 className="font-semibold leading-snug">{name}</h3>

            {/* Price — click pencil to edit */}
            {editing === "price" ? (
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">RM</span>
                <input
                  autoFocus
                  type="number"
                  step="0.10"
                  min="0"
                  value={draftValue}
                  onChange={(e) => setDraftValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitEdit();
                    if (e.key === "Escape") cancelEdit();
                  }}
                  className="w-16 rounded border bg-background px-1 py-0.5 text-right text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button type="button" onClick={commitEdit} className="rounded bg-primary p-0.5 text-primary-foreground">
                  <Check className="h-3 w-3" />
                </button>
                <button type="button" onClick={cancelEdit} className="rounded bg-muted p-0.5 text-muted-foreground">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <span className="text-sm font-bold text-primary">
                  {localItem.originalPrice ? (
                    <>
                      <s className="mr-1 text-xs font-normal text-muted-foreground">
                        {formatPrice(localItem.originalPrice)}
                      </s>
                      {formatPrice(localItem.price)}
                    </>
                  ) : (
                    formatPrice(localItem.price)
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => startEdit("price")}
                  className="rounded p-0.5 text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/30"
                  title="Edit price"
                >
                  <Pencil className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>

          {/* Description — click pencil to edit */}
          {editing === "description" ? (
            <div>
              <textarea
                autoFocus
                value={draftValue}
                onChange={(e) => setDraftValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Escape") cancelEdit(); }}
                className="w-full resize-none rounded border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                rows={3}
              />
              <div className="mt-1 flex justify-end gap-2">
                <button type="button" onClick={cancelEdit} className="rounded px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground">
                  Cancel
                </button>
                <button type="button" onClick={commitEdit} className="flex items-center gap-1 rounded bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
                  <Check className="h-3 w-3" /> Save
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-1">
              <p className="flex-1 line-clamp-2 text-sm text-muted-foreground">
                {localItem.description || (
                  <span className="italic opacity-40">No description</span>
                )}
              </p>
              <button
                type="button"
                onClick={() => startEdit("description")}
                className="mt-0.5 shrink-0 rounded p-0.5 text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/30"
                title="Edit description"
              >
                <Pencil className="h-3 w-3" />
              </button>
            </div>
          )}

          {localItem.dietary.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {localItem.dietary.map((d) => (
                <DietaryBadge key={d} label={d} />
              ))}
            </div>
          )}
        </div>

        <div className="mt-3 flex items-center justify-end border-t pt-3">
          <button
            type="button"
            onClick={() => addItem({ id: localItem.code, name, price: localItem.price })}
            className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            <Plus className="h-4 w-4" />
            {tc("add")}
          </button>
        </div>
      </div>

      {hasRecipe && (
        <RecipeModal
          item={localItem}
          open={recipeOpen}
          onClose={() => setRecipeOpen(false)}
        />
      )}
    </>
  );
}
