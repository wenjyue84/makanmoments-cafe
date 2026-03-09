"use client";

import Image from "next/image";
import { useState, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Plus, Camera, Pencil, Check, X, Loader2 } from "lucide-react";
import { useTray } from "@/lib/tray-context";
import type { MenuItemWithRules } from "@/types/menu";
import { formatPrice, getLocalizedName } from "@/lib/utils";
import { DietaryBadge } from "./dietary-badge";
import { RecipeModal } from "./recipe-modal";
import { getRecipeInfo } from "@/data/recipe-info";

interface EditableMenuCardProps {
  item: MenuItemWithRules;
  priority?: boolean;
}

type EditTarget = "description" | "price" | null;

export function EditableMenuCard({ item, priority = false }: EditableMenuCardProps) {
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
      <div className="relative rounded-xl border border-amber-400/60 bg-card p-4 hover-lift">
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

          {localItem.featured && (
            <span className="absolute left-2 top-2 rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground">
              ★
            </span>
          )}
          {localItem.discountPercent && (
            <span className="absolute right-2 top-2 rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
              -{localItem.discountPercent}%
            </span>
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
        </div>

        {/* Content */}
        <div className="space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold leading-tight">{name}</h3>

            {/* Price — click pencil to edit */}
            {editing === "price" ? (
              <div className="flex shrink-0 items-center gap-1">
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
              <div className="flex shrink-0 items-center gap-1">
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
