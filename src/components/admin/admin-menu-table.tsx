"use client";

import { Fragment, useState, useEffect } from "react";
import Image from "next/image";
import type { MenuItemWithRules } from "@/types/menu";
import { cn } from "@/lib/utils";
import { ImagePickerModal } from "./image-picker-modal";
import { ChevronDown, ChevronUp } from "lucide-react";

const MISSING_PHOTOS_DISMISSED_KEY = "admin_missing_photos_dismissed";

const COLUMN_TOOLTIPS: Record<string, string> = {
  IMAGE: "Item photo — click the image in a row to upload a new one",
  CODE: "POS item code (read-only) — used to match photos and rules",
  NAME: "Item name in English, Malay, and Chinese — all 3 are shown on the menu",
  PRICE: "Selling price in RM — displayed on the public menu",
  ON: "Toggle item visibility on the public menu (on/off switch)",
  STAR: "Featured — marks item for the homepage highlights section",
  CATEGORIES: "POS categories this item belongs to (e.g. Rice, Noodles, Drinks)",
  DIETARY: "Dietary tags shown to customers (Spicy, Vegetarian, Vegan, Gluten Free)",
  DAYS: "Days of week this item is available (e.g., Mon-Fri only)",
  TIME: "Time window this item is served (e.g., 11:00-15:00)",
  DATES: "Special dates this item is available or unavailable",
  SORT: "Display order within its category — lower number appears first",
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DIETARY_OPTIONS = ["Spicy", "Vegetarian", "Vegan", "Gluten Free"];

interface AdminMenuTableProps {
  initialItems: MenuItemWithRules[];
  categories: string[];
  displayCategories?: string[];
}

type EditableItem = MenuItemWithRules & { _dirty?: boolean; _new?: boolean };

// — Grouping helper —

function groupByPrimaryCategory(
  items: EditableItem[],
  categories: string[]
): { cat: string; label: string; items: EditableItem[] }[] {
  const catMap = new Map<string, EditableItem[]>();
  for (const cat of categories) catMap.set(cat, []);
  catMap.set("__none__", []);

  for (const item of items) {
    const primaryCat = item.categories[0] ?? "__none__";
    if (!catMap.has(primaryCat)) catMap.set(primaryCat, []);
    catMap.get(primaryCat)!.push(item);
  }

  const result: { cat: string; label: string; items: EditableItem[] }[] = [];
  for (const [cat, catItems] of catMap) {
    result.push({
      cat,
      label: cat === "__none__" ? "Uncategorized" : cat,
      items: catItems,
    });
  }
  return result;
}

// Helper: filter items by display category name (handles special computed cats)
function filterByDisplayCat(item: EditableItem, dc: string): boolean {
  const lc = dc.toLowerCase();
  if (lc.includes("rm15"))
    return (
      item.price < 15 &&
      !item.displayCategories.some(
        (d) => d === "Hot Drinks" || d === "Cold Drinks & Juice"
      )
    );
  if (lc.includes("vegetarian"))
    return item.dietary?.some((d) => d.toLowerCase() === "vegetarian") ?? false;
  return item.displayCategories.includes(dc);
}

// Group items by their first display category
function groupByDisplayCategory(
  items: EditableItem[],
  displayCategories: string[]
): { cat: string; label: string; items: EditableItem[] }[] {
  const catMap = new Map<string, EditableItem[]>();
  for (const dc of displayCategories) catMap.set(dc, []);
  catMap.set("__none__", []);

  for (const item of items) {
    const primaryDC = item.displayCategories[0] ?? "__none__";
    if (!catMap.has(primaryDC)) catMap.set(primaryDC, []);
    catMap.get(primaryDC)!.push(item);
  }

  return [...catMap.entries()]
    .map(([cat, catItems]) => ({
      cat,
      label: cat === "__none__" ? "Uncategorized" : cat,
      items: catItems,
    }))
    .filter(({ cat: filterCat, items: catItems }) => catItems.length > 0 || displayCategories.includes(filterCat));
}

export function AdminMenuTable({
  initialItems,
  categories,
  displayCategories = [],
}: AdminMenuTableProps) {
  const [items, setItems] = useState<EditableItem[]>(initialItems);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imagePickerCode, setImagePickerCode] = useState<string | null>(null);
  const [imgVersion, setImgVersion] = useState(0);
  const [missingPhotos, setMissingPhotos] = useState<{ id: string; code: string; nameEn: string }[]>([]);
  const [photoAlertDismissed, setPhotoAlertDismissed] = useState(false);
  const [isAlertExpanded, setIsAlertExpanded] = useState(false);
  const [highlightedCode, setHighlightedCode] = useState<string | null>(null);
  const [suggesting, setSuggesting] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");

  useEffect(() => {
    const dismissed = sessionStorage.getItem(MISSING_PHOTOS_DISMISSED_KEY);
    if (dismissed) {
      setPhotoAlertDismissed(true);
      return;
    }
    fetch("/api/admin/menu/missing-photos")
      .then((r) => r.json())
      .then((data) => setMissingPhotos(data))
      .catch(() => {});
  }, []);

  function dismissPhotoAlert() {
    sessionStorage.setItem(MISSING_PHOTOS_DISMISSED_KEY, "1");
    setPhotoAlertDismissed(true);
  }

  function scrollToItem(code: string) {
    setHighlightedCode(code);
    const el = document.getElementById(`menu-row-${code}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => setHighlightedCode(null), 2000);
    }
  }

  function updateItem(id: string, patch: Partial<EditableItem>) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, ...patch, _dirty: true } : item
      )
    );
  }

  function addNewRow() {
    const tempId = `new-${Date.now()}`;
    setItems((prev) => [
      {
        id: tempId,
        code: "",
        nameEn: "",
        nameMs: "",
        nameZh: "",
        price: 0,
        description: "",
        dietary: [],
        categories: [],
        displayCategories: [],
        available: true,
        featured: false,
        photo: null,
        photos: [],
        sortOrder: 0,
        availableDays: [],
        timeFrom: "",
        timeUntil: "",
        specialDates: [],
        imagePosition: "50% 50%",
        updatedAt: new Date().toISOString(),
        _new: true,
        _dirty: true,
      },
      ...prev,
    ]);
  }

  async function saveItem(item: EditableItem) {
    setSaving(item.id);
    setError(null);
    const body = {
      code: item.code,
      nameEn: item.nameEn,
      nameMs: item.nameMs,
      nameZh: item.nameZh,
      price: item.price,
      description: item.description,
      dietary: item.dietary,
      categories: item.categories,
      available: item.available,
      featured: item.featured,
      sortOrder: item.sortOrder,
      availableDays: item.availableDays,
      timeFrom: item.timeFrom,
      timeUntil: item.timeUntil,
      specialDates: item.specialDates,
    };

    try {
      if (item._new) {
        const res = await fetch("/api/admin/menu", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create");
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...data, photo: `/images/menu/${data.code}.jpg` } : i
          )
        );
      } else {
        const res = await fetch(`/api/admin/menu/${item.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update");
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? { ...data, photo: `/images/menu/${data.code}.jpg`, _dirty: false }
              : i
          )
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error saving");
    } finally {
      setSaving(null);
    }
  }

  async function deleteItem(id: string) {
    if (!confirm("Delete this menu item?")) return;
    await fetch(`/api/admin/menu/${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function toggleDay(item: EditableItem, day: string) {
    const days = item.availableDays.includes(day)
      ? item.availableDays.filter((d) => d !== day)
      : [...item.availableDays, day];
    updateItem(item.id, { availableDays: days });
  }

  function toggleDietary(item: EditableItem, d: string) {
    const dietary = item.dietary.includes(d)
      ? item.dietary.filter((x) => x !== d)
      : [...item.dietary, d];
    updateItem(item.id, { dietary });
  }

  async function suggestTranslation(item: EditableItem, lang: "ms" | "zh") {
    if (!item.nameEn) return;
    const key = `${item.id}-${lang}`;
    setSuggesting((prev) => ({ ...prev, [key]: true }));
    try {
      const res = await fetch("/api/admin/menu/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nameEn: item.nameEn, targetLanguage: lang }),
      });
      const data = await res.json();
      if (res.ok && data.translation) {
        updateItem(item.id, lang === "ms" ? { nameMs: data.translation } : { nameZh: data.translation });
      }
    } catch {
      // silently fail — user can retry
    } finally {
      setSuggesting((prev) => ({ ...prev, [key]: false }));
    }
  }

  function toggleCategory(item: EditableItem, cat: string) {
    const cats = item.categories.includes(cat)
      ? item.categories.filter((c) => c !== cat)
      : [...item.categories, cat];
    updateItem(item.id, { categories: cats });
  }

  const searchedItems =
    search === ""
      ? items
      : items.filter((item) =>
          [item.code, item.nameEn, item.nameMs, item.nameZh].some((v) =>
            v?.toLowerCase().includes(search.toLowerCase())
          )
        );

  const DC_PREFIX = "__dc__";
  const isDisplayCatFilter = !!(activeCategory?.startsWith(DC_PREFIX));
  const selectedDcName = isDisplayCatFilter ? activeCategory!.slice(DC_PREFIX.length) : null;

  const filteredItems = activeCategory
    ? isDisplayCatFilter
      ? searchedItems.filter((i) => filterByDisplayCat(i, selectedDcName!))
      : searchedItems.filter((i) => i.categories.includes(activeCategory))
    : searchedItems;

  const groupedItems = displayCategories.length > 0
    ? groupByDisplayCategory(searchedItems, displayCategories)
    : groupByPrimaryCategory(searchedItems, categories);

  return (
    <div className="space-y-4">
      {!photoAlertDismissed && missingPhotos.length > 0 && (
        <div className="rounded-lg border border-amber-400 bg-amber-50 p-3 text-sm text-amber-800">
          <div className="flex items-center justify-between gap-2">
            <p className="font-medium">
              ⚠️ {missingPhotos.length} item{missingPhotos.length !== 1 ? "s" : ""} have no photo. Consider adding photos to improve the menu page.
            </p>
            <div className="flex shrink-0 items-center gap-1">
              <button
                onClick={() => setIsAlertExpanded((v) => !v)}
                className="rounded p-0.5 hover:bg-amber-100"
                aria-label={isAlertExpanded ? "Collapse item list" : "Expand item list"}
              >
                {isAlertExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
              <button
                onClick={dismissPhotoAlert}
                className="rounded px-2 py-0.5 text-xs font-medium hover:bg-amber-100"
              >
                Dismiss
              </button>
            </div>
          </div>
          {isAlertExpanded && (
            <p className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5">
              {missingPhotos.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToItem(item.code)}
                  className="underline hover:text-amber-900"
                >
                  {item.nameEn}
                </button>
              ))}
            </p>
          )}
        </div>
      )}
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}
      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name or code..."
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
      />
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={activeCategory ?? ""}
          onChange={(e) => setActiveCategory(e.target.value || null)}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
        >
          <option value="">All Categories ({items.length} items)</option>
          {displayCategories.length > 0 && (
            <optgroup label="Display Categories">
              {displayCategories.map((dc) => {
                const count = items.filter((i) => filterByDisplayCat(i, dc)).length;
                return (
                  <option key={`__dc__${dc}`} value={`__dc__${dc}`}>
                    {dc} ({count} item{count !== 1 ? "s" : ""})
                  </option>
                );
              })}
            </optgroup>
          )}
          <optgroup label="POS Categories (internal)">
            {categories.map((cat) => {
              const count = items.filter((i) => i.categories.includes(cat)).length;
              return (
                <option key={cat} value={cat}>
                  {cat} ({count} item{count !== 1 ? "s" : ""})
                </option>
              );
            })}
          </optgroup>
        </select>
        <h2 className="flex-1 text-lg font-semibold text-gray-900">
          {activeCategory
            ? `${selectedDcName ?? activeCategory} (${filteredItems.length} item${filteredItems.length !== 1 ? "s" : ""})`
            : `Menu Items (${items.length})`}
        </h2>
        <button
          onClick={addNewRow}
          className="rounded-lg bg-orange-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-orange-600"
        >
          + Add Item
        </button>
      </div>

      {filteredItems.length === 0 && search !== "" && (
        <p className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
          No items match &ldquo;{search}&rdquo;
        </p>
      )}

      {activeCategory === null ? (
        /* ——— Display Category Grouped View (All) ——— */
        <>
          {/* Mobile grouped view */}
          <div className="md:hidden space-y-4">
            {groupedItems.map(({ cat, label, items: groupItems }) => (
              <div key={cat} className="space-y-2">
                <div className="rounded px-2 py-1.5 text-xs font-semibold uppercase tracking-wide bg-amber-50 text-amber-800 border border-amber-200">
                  {label} ({groupItems.length})
                </div>
                {groupItems.length === 0 && (
                  <p className="px-2 text-xs italic text-gray-400">No items</p>
                )}
                {groupItems.map((item) => (
                  <div
                    key={item.id}
                    id={item.code ? `menu-row-${item.code}` : undefined}
                    className={cn(
                      "rounded-xl border p-4",
                      highlightedCode === item.code
                        ? "ring-2 ring-amber-400 bg-amber-50"
                        : item.disabledByRule
                          ? "bg-red-50/60"
                          : item._dirty
                            ? "bg-amber-50"
                            : "bg-white"
                    )}
                  >
                    <div className="flex gap-3">
                      {/* Image */}
                      <button
                        onClick={() => item.code && setImagePickerCode(item.code)}
                        disabled={!item.code}
                        className="group relative h-16 w-20 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-50"
                        title={item.code ? `Change image for ${item.code}` : "Set code first"}
                      >
                        {item.code && (
                          <Image
                            src={`/images/menu/${item.code}.jpg?v=${imgVersion}`}
                            alt={item.code}
                            fill
                            className="object-cover"
                            sizes="80px"
                            unoptimized
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                            }}
                          />
                        )}
                      </button>

                      {/* Key fields */}
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <input
                          value={item.code}
                          onChange={(e) => updateItem(item.id, { code: e.target.value })}
                          className="w-full rounded border border-gray-300 px-2 py-1 text-xs"
                          placeholder="CODE"
                        />
                        <div className="flex items-center gap-1">
                          <input
                            value={item.nameEn}
                            onChange={(e) => updateItem(item.id, { nameEn: e.target.value })}
                            className="flex-1 rounded border border-gray-300 px-2 py-1.5 text-sm"
                            placeholder="English name"
                          />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-gray-500">RM</span>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={item.originalPrice ?? item.price}
                            onChange={(e) =>
                              updateItem(item.id, { price: parseFloat(e.target.value) || 0 })
                            }
                            className="w-20 rounded border border-gray-300 px-2 py-1 text-sm"
                          />
                        </div>
                      </div>

                      {/* Toggles */}
                      <div className="flex shrink-0 flex-col items-center gap-2">
                        <button
                          onClick={() => updateItem(item.id, { available: !item.available })}
                          className={cn(
                            "h-7 w-12 rounded-full transition-colors",
                            item.available ? "bg-green-500" : "bg-gray-300"
                          )}
                          aria-label={item.available ? "Available" : "Unavailable"}
                        >
                          <span
                            className={cn(
                              "block h-5 w-5 translate-x-1 rounded-full bg-white shadow transition-transform",
                              item.available && "translate-x-6"
                            )}
                          />
                        </button>
                        <button
                          onClick={() => updateItem(item.id, { featured: !item.featured })}
                          className={cn("text-xl leading-none", item.featured ? "text-yellow-400" : "text-gray-300")}
                          aria-label="Toggle featured"
                        >
                          ★
                        </button>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => saveItem(item)}
                        disabled={saving === item.id || !item._dirty}
                        className="min-h-[44px] flex-1 rounded-lg bg-orange-500 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-40"
                      >
                        {saving === item.id ? "Saving…" : "Save"}
                      </button>
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="min-h-[44px] min-w-[44px] rounded-lg border border-red-200 px-3 text-sm text-red-600 hover:bg-red-50"
                      >
                        Del
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Desktop grouped table */}
          <div className="hidden overflow-x-auto rounded-xl border bg-white md:block">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="px-3 py-3"><span title={COLUMN_TOOLTIPS.IMAGE} className="cursor-help border-b border-dashed border-gray-400">Image</span></th>
                  <th className="px-3 py-3"><span title={COLUMN_TOOLTIPS.CODE} className="cursor-help border-b border-dashed border-gray-400">Code</span></th>
                  <th className="px-3 py-3"><span title={COLUMN_TOOLTIPS.NAME} className="cursor-help border-b border-dashed border-gray-400">Name EN / MS / ZH</span></th>
                  <th className="px-3 py-3"><span title={COLUMN_TOOLTIPS.PRICE} className="cursor-help border-b border-dashed border-gray-400">Price</span></th>
                  <th className="px-3 py-3"><span title={COLUMN_TOOLTIPS.ON} className="cursor-help border-b border-dashed border-gray-400">On</span></th>
                  <th className="px-3 py-3"><span title={COLUMN_TOOLTIPS.STAR} className="cursor-help border-b border-dashed border-gray-400">★</span></th>
                  <th className="px-3 py-3"><span title={COLUMN_TOOLTIPS.CATEGORIES} className="cursor-help border-b border-dashed border-gray-400">POS Categories</span></th>
                  <th className="px-3 py-3"><span title="Display categories (website groups)" className="cursor-help border-b border-dashed border-gray-400">Display Cats</span></th>
                  <th className="px-3 py-3"><span title={COLUMN_TOOLTIPS.DIETARY} className="cursor-help border-b border-dashed border-gray-400">Dietary</span></th>
                  <th className="px-3 py-3"><span title={COLUMN_TOOLTIPS.DAYS} className="cursor-help border-b border-dashed border-gray-400">Days</span></th>
                  <th className="px-3 py-3"><span title={COLUMN_TOOLTIPS.TIME} className="cursor-help border-b border-dashed border-gray-400">Time</span></th>
                  <th className="px-3 py-3"><span title={COLUMN_TOOLTIPS.DATES} className="cursor-help border-b border-dashed border-gray-400">Dates</span></th>
                  <th className="px-3 py-3"><span title={COLUMN_TOOLTIPS.SORT} className="cursor-help border-b border-dashed border-gray-400">Sort</span></th>
                  <th className="px-3 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {groupedItems.map(({ cat, label, items: groupItems }) => (
                  <Fragment key={cat}>
                    {/* Category header row */}
                    <tr className="border-t border-b border-gray-200 bg-amber-50/60">
                      <td colSpan={14} className="px-3 py-1.5">
                        <div className="rounded px-2 py-1 text-xs font-semibold uppercase tracking-wide text-amber-800">
                          {label} ({groupItems.length})
                        </div>
                      </td>
                    </tr>
                    {groupItems.map((item) => (
                      <tr
                        key={item.id}
                        id={item.code ? `menu-row-${item.code}` : undefined}
                        className={cn(
                          "align-top",
                          highlightedCode === item.code
                            ? "ring-2 ring-amber-400 bg-amber-50"
                            : item.disabledByRule
                              ? "bg-red-50/60"
                              : item._dirty
                                ? "bg-amber-50"
                                : "bg-white"
                        )}
                      >
                        {/* Image */}
                        <td className="px-3 py-2">
                          <button
                            onClick={() => item.code && setImagePickerCode(item.code)}
                            className="group relative h-12 w-16 overflow-hidden rounded-lg border border-gray-200 bg-gray-50 hover:border-orange-400 hover:shadow-sm transition-all"
                            title={item.code ? `Change image for ${item.code}` : "Set code first"}
                            disabled={!item.code}
                          >
                            {item.code ? (
                              <Image
                                src={`/images/menu/${item.code}.jpg?v=${imgVersion}`}
                                alt={item.code}
                                fill
                                className="object-cover"
                                sizes="64px"
                                unoptimized
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = "none";
                                }}
                              />
                            ) : null}
                            <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-transparent group-hover:bg-black/40 group-hover:text-white transition-all text-[10px] font-medium">
                              {item.code ? "Edit" : "—"}
                            </span>
                          </button>
                        </td>

                        {/* Code */}
                        <td className="px-3 py-2">
                          <input
                            value={item.code}
                            onChange={(e) => updateItem(item.id, { code: e.target.value })}
                            className="w-20 rounded border border-gray-300 px-2 py-1 text-xs"
                            placeholder="CODE"
                          />
                        </td>

                        {/* Names */}
                        <td className="px-3 py-2">
                          <div className="flex flex-col gap-1">
                            <input
                              value={item.nameEn}
                              onChange={(e) => updateItem(item.id, { nameEn: e.target.value })}
                              className="w-48 rounded border border-gray-300 px-2 py-1 text-sm"
                              placeholder="English name"
                            />
                            <input
                              value={item.nameMs}
                              onChange={(e) => updateItem(item.id, { nameMs: e.target.value })}
                              className="w-48 rounded border border-gray-300 px-2 py-1 text-xs text-gray-500"
                              placeholder="Malay name"
                            />
                            <input
                              value={item.nameZh}
                              onChange={(e) => updateItem(item.id, { nameZh: e.target.value })}
                              className="w-48 rounded border border-gray-300 px-2 py-1 text-xs text-gray-500"
                              placeholder="Chinese name"
                            />
                          </div>
                        </td>

                        {/* Price */}
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={item.originalPrice ?? item.price}
                            onChange={(e) =>
                              updateItem(item.id, { price: parseFloat(e.target.value) || 0 })
                            }
                            className="w-16 rounded border border-gray-300 px-2 py-1 text-sm"
                          />
                        </td>

                        {/* On (available toggle) */}
                        <td className="px-3 py-2">
                          <button
                            onClick={() => updateItem(item.id, { available: !item.available })}
                            className={cn(
                              "h-7 w-12 rounded-full transition-colors",
                              item.available ? "bg-green-500" : "bg-gray-300"
                            )}
                            aria-label={item.available ? "Available" : "Unavailable"}
                          >
                            <span
                              className={cn(
                                "block h-5 w-5 translate-x-1 rounded-full bg-white shadow transition-transform",
                                item.available && "translate-x-6"
                              )}
                            />
                          </button>
                        </td>

                        {/* Featured star */}
                        <td className="px-3 py-2">
                          <button
                            onClick={() => updateItem(item.id, { featured: !item.featured })}
                            className={cn("text-xl leading-none", item.featured ? "text-yellow-400" : "text-gray-300")}
                            aria-label="Toggle featured"
                          >
                            ★
                          </button>
                        </td>

                        {/* POS Categories */}
                        <td className="px-3 py-2">
                          <div className="flex flex-wrap gap-1 max-w-[160px]">
                            {item.categories.map((c) => (
                              <span key={c} className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600">
                                {c}
                              </span>
                            ))}
                          </div>
                        </td>

                        {/* Display Categories */}
                        <td className="px-3 py-2">
                          <div className="flex flex-wrap gap-1 max-w-[140px]">
                            {item.displayCategories.map((dc) => (
                              <span key={dc} className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-800">
                                {dc}
                              </span>
                            ))}
                          </div>
                        </td>

                        {/* Dietary */}
                        <td className="px-3 py-2">
                          <div className="flex flex-wrap gap-1">
                            {DIETARY_OPTIONS.map((d) => (
                              <button
                                key={d}
                                onClick={() => toggleDietary(item, d)}
                                className={cn(
                                  "rounded-full border px-1.5 py-0.5 text-[10px] font-medium transition-colors",
                                  item.dietary.includes(d)
                                    ? "border-green-400 bg-green-100 text-green-800"
                                    : "border-gray-300 bg-gray-100 text-gray-400"
                                )}
                              >
                                {d}
                              </button>
                            ))}
                          </div>
                        </td>

                        {/* Days */}
                        <td className="px-3 py-2">
                          <div className="flex flex-wrap gap-0.5">
                            {DAYS.map((day) => (
                              <button
                                key={day}
                                onClick={() => toggleDay(item, day)}
                                className={cn(
                                  "rounded px-1 py-0.5 text-[10px] font-medium transition-colors",
                                  item.availableDays.length > 0 && item.availableDays.includes(day)
                                    ? "bg-blue-500 text-white"
                                    : item.availableDays.length === 0
                                      ? "bg-blue-100 text-blue-400"
                                      : "bg-gray-200 text-gray-400"
                                )}
                              >
                                {day}
                              </button>
                            ))}
                          </div>
                        </td>

                        {/* Time */}
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1">
                            <input
                              type="time"
                              value={item.timeFrom || ""}
                              onChange={(e) => updateItem(item.id, { timeFrom: e.target.value })}
                              className="w-24 rounded border border-gray-300 px-1 py-0.5 text-xs"
                            />
                            <span className="text-xs text-gray-400">–</span>
                            <input
                              type="time"
                              value={item.timeUntil || ""}
                              onChange={(e) => updateItem(item.id, { timeUntil: e.target.value })}
                              className="w-24 rounded border border-gray-300 px-1 py-0.5 text-xs"
                            />
                          </div>
                        </td>

                        {/* Dates */}
                        <td className="px-3 py-2">
                          <input
                            value={item.specialDates?.join(", ") || ""}
                            onChange={(e) =>
                              updateItem(item.id, {
                                specialDates: e.target.value
                                  .split(",")
                                  .map((d) => d.trim())
                                  .filter(Boolean),
                              })
                            }
                            className="w-28 rounded border border-gray-300 px-2 py-1 text-xs"
                            placeholder="YYYY-MM-DD"
                          />
                        </td>

                        {/* Sort */}
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            value={item.sortOrder}
                            onChange={(e) =>
                              updateItem(item.id, { sortOrder: parseInt(e.target.value) || 0 })
                            }
                            className="w-16 rounded border border-gray-300 px-2 py-1 text-xs"
                          />
                        </td>

                        {/* Actions */}
                        <td className="px-3 py-2">
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={() => saveItem(item)}
                              disabled={saving === item.id || !item._dirty}
                              className="rounded bg-orange-500 px-2 py-1 text-xs font-medium text-white hover:bg-orange-600 disabled:opacity-40"
                            >
                              {saving === item.id ? "…" : "Save"}
                            </button>
                            <button
                              onClick={() => deleteItem(item.id)}
                              className="rounded bg-red-50 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-100"
                            >
                              Del
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        /* ——— Filtered Flat View (Category selected) ——— */
        <>
          {/* Mobile card list */}
          <div className="md:hidden space-y-3">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                id={item.code ? `menu-row-${item.code}` : undefined}
                className={cn(
                  "rounded-xl border p-4",
                  highlightedCode === item.code
                    ? "ring-2 ring-amber-400 bg-amber-50"
                    : item.disabledByRule
                      ? "bg-red-50/60"
                      : item._dirty
                        ? "bg-amber-50"
                        : "bg-white"
                )}
              >
                <div className="flex gap-3">
                  {/* Image */}
                  <button
                    onClick={() => item.code && setImagePickerCode(item.code)}
                    disabled={!item.code}
                    className="group relative h-16 w-20 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-50"
                    title={item.code ? `Change image for ${item.code}` : "Set code first"}
                  >
                    {item.code && (
                      <Image
                        src={`/images/menu/${item.code}.jpg?v=${imgVersion}`}
                        alt={item.code}
                        fill
                        className="object-cover"
                        sizes="80px"
                        unoptimized
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    )}
                  </button>

                  {/* Key fields */}
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <input
                      value={item.code}
                      onChange={(e) => updateItem(item.id, { code: e.target.value })}
                      className="w-full rounded border border-gray-300 px-2 py-1 text-xs"
                      placeholder="CODE"
                    />
                    <div className="flex items-center gap-1">
                      <input
                        value={item.nameEn}
                        onChange={(e) => updateItem(item.id, { nameEn: e.target.value })}
                        className="flex-1 rounded border border-gray-300 px-2 py-1.5 text-sm"
                        placeholder="English name"
                      />
                      <span title="Missing translations" className="shrink-0 text-sm">🌐</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <input
                        value={item.nameMs}
                        onChange={(e) => updateItem(item.id, { nameMs: e.target.value })}
                        className="flex-1 rounded border border-gray-300 px-2 py-1 text-xs"
                        placeholder="Malay name"
                      />
                      <button
                        onClick={() => suggestTranslation(item, "ms")}
                        disabled={!item.nameEn || suggesting[`${item.id}-ms`]}
                        className="shrink-0 rounded border border-blue-200 bg-blue-50 px-1.5 py-1 text-xs text-blue-600 hover:bg-blue-100 disabled:opacity-40"
                        title="Suggest Malay translation"
                      >
                        {suggesting[`${item.id}-ms`] ? "…" : "✨"}
                      </button>
                    </div>
                    <div className="flex items-center gap-1">
                      <input
                        value={item.nameZh}
                        onChange={(e) => updateItem(item.id, { nameZh: e.target.value })}
                        className="flex-1 rounded border border-gray-300 px-2 py-1 text-xs"
                        placeholder="Chinese name"
                      />
                      <button
                        onClick={() => suggestTranslation(item, "zh")}
                        disabled={!item.nameEn || suggesting[`${item.id}-zh`]}
                        className="shrink-0 rounded border border-blue-200 bg-blue-50 px-1.5 py-1 text-xs text-blue-600 hover:bg-blue-100 disabled:opacity-40"
                        title="Suggest Chinese translation"
                      >
                        {suggesting[`${item.id}-zh`] ? "…" : "✨"}
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-gray-500">RM</span>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={item.originalPrice ?? item.price}
                        onChange={(e) =>
                          updateItem(item.id, { price: parseFloat(e.target.value) || 0 })
                        }
                        className="w-20 rounded border border-gray-300 px-2 py-1 text-sm"
                      />
                    </div>
                  </div>

                  {/* Toggles */}
                  <div className="flex shrink-0 flex-col items-center gap-2">
                    <button
                      onClick={() => updateItem(item.id, { available: !item.available })}
                      className={cn(
                        "h-7 w-12 rounded-full transition-colors",
                        item.available ? "bg-green-500" : "bg-gray-300"
                      )}
                      aria-label={item.available ? "Available" : "Unavailable"}
                    >
                      <span
                        className={cn(
                          "block h-5 w-5 translate-x-1 rounded-full bg-white shadow transition-transform",
                          item.available && "translate-x-6"
                        )}
                      />
                    </button>
                    <button
                      onClick={() => updateItem(item.id, { featured: !item.featured })}
                      className={cn("text-xl leading-none", item.featured ? "text-yellow-400" : "text-gray-300")}
                      aria-label="Toggle featured"
                    >
                      ★
                    </button>
                  </div>
                </div>

                {/* Categories (mobile) */}
                <div className="mt-2 flex flex-wrap items-center gap-1">
                  <span className="text-xs text-gray-500 shrink-0">In:</span>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => toggleCategory(item, cat)}
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-xs font-medium transition-colors",
                        item.categories.includes(cat)
                          ? "border-orange-400 bg-orange-100 text-orange-800"
                          : "border-gray-300 bg-gray-100 text-gray-500"
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Actions */}
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => saveItem(item)}
                    disabled={saving === item.id || !item._dirty}
                    className="min-h-[44px] flex-1 rounded-lg bg-orange-500 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-40"
                  >
                    {saving === item.id ? "Saving…" : "Save"}
                  </button>
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="min-h-[44px] min-w-[44px] rounded-lg border border-red-200 px-3 text-sm text-red-600 hover:bg-red-50"
                  >
                    Del
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden overflow-x-auto rounded-xl border bg-white md:block">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="px-3 py-3"><span title={COLUMN_TOOLTIPS.IMAGE} className="cursor-help border-b border-dashed border-gray-400">Image</span></th>
                  <th className="px-3 py-3"><span title={COLUMN_TOOLTIPS.CODE} className="cursor-help border-b border-dashed border-gray-400">Code</span></th>
                  <th className="px-3 py-3"><span title={COLUMN_TOOLTIPS.NAME} className="cursor-help border-b border-dashed border-gray-400">Name EN / MS / ZH</span></th>
                  <th className="px-3 py-3"><span title={COLUMN_TOOLTIPS.PRICE} className="cursor-help border-b border-dashed border-gray-400">Price</span></th>
                  <th className="px-3 py-3"><span title={COLUMN_TOOLTIPS.ON} className="cursor-help border-b border-dashed border-gray-400">On</span></th>
                  <th className="px-3 py-3"><span title={COLUMN_TOOLTIPS.STAR} className="cursor-help border-b border-dashed border-gray-400">★</span></th>
                  <th className="px-3 py-3"><span title={COLUMN_TOOLTIPS.CATEGORIES} className="cursor-help border-b border-dashed border-gray-400">Categories</span></th>
                  <th className="px-3 py-3"><span title={COLUMN_TOOLTIPS.DIETARY} className="cursor-help border-b border-dashed border-gray-400">Dietary</span></th>
                  <th className="px-3 py-3"><span title={COLUMN_TOOLTIPS.DAYS} className="cursor-help border-b border-dashed border-gray-400">Days</span></th>
                  <th className="px-3 py-3"><span title={COLUMN_TOOLTIPS.TIME} className="cursor-help border-b border-dashed border-gray-400">Time</span></th>
                  <th className="px-3 py-3"><span title={COLUMN_TOOLTIPS.DATES} className="cursor-help border-b border-dashed border-gray-400">Dates</span></th>
                  <th className="px-3 py-3"><span title={COLUMN_TOOLTIPS.SORT} className="cursor-help border-b border-dashed border-gray-400">Sort</span></th>
                  <th className="px-3 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    id={item.code ? `menu-row-${item.code}` : undefined}
                    className={cn(
                      "align-top",
                      highlightedCode === item.code
                        ? "ring-2 ring-amber-400 bg-amber-50"
                        : item.disabledByRule
                          ? "bg-red-50/60"
                          : item._dirty
                            ? "bg-amber-50"
                            : "bg-white"
                    )}
                  >
                    {/* Image */}
                    <td className="px-3 py-2">
                      <button
                        onClick={() => item.code && setImagePickerCode(item.code)}
                        className="group relative h-12 w-16 overflow-hidden rounded-lg border border-gray-200 bg-gray-50 hover:border-orange-400 hover:shadow-sm transition-all"
                        title={item.code ? `Change image for ${item.code}` : "Set code first"}
                        disabled={!item.code}
                      >
                        {item.code ? (
                          <Image
                            src={`/images/menu/${item.code}.jpg?v=${imgVersion}`}
                            alt={item.code}
                            fill
                            className="object-cover"
                            sizes="64px"
                            unoptimized
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                            }}
                          />
                        ) : null}
                        <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-transparent group-hover:bg-black/40 group-hover:text-white transition-all text-[10px] font-medium">
                          {item.code ? "Edit" : "—"}
                        </span>
                      </button>
                    </td>

                    {/* Code */}
                    <td className="px-3 py-2">
                      <input
                        value={item.code}
                        onChange={(e) => updateItem(item.id, { code: e.target.value })}
                        className="w-20 rounded border border-gray-300 px-2 py-1 text-xs"
                        placeholder="CODE"
                      />
                    </td>

                    {/* Names */}
                    <td className="px-3 py-2">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1">
                          <input
                            value={item.nameEn}
                            onChange={(e) => updateItem(item.id, { nameEn: e.target.value })}
                            className="w-40 rounded border border-gray-300 px-2 py-1 text-xs"
                            placeholder="English"
                          />
                          <span title="Missing translations" className="shrink-0 text-sm">🌐</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <input
                            value={item.nameMs}
                            onChange={(e) => updateItem(item.id, { nameMs: e.target.value })}
                            className="w-36 rounded border border-gray-300 px-2 py-1 text-xs"
                            placeholder="Melayu"
                          />
                          <button
                            onClick={() => suggestTranslation(item, "ms")}
                            disabled={!item.nameEn || suggesting[`${item.id}-ms`]}
                            className="shrink-0 rounded border border-blue-200 bg-blue-50 px-1.5 py-1 text-xs text-blue-600 hover:bg-blue-100 disabled:opacity-40"
                            title="Suggest Malay translation"
                          >
                            {suggesting[`${item.id}-ms`] ? "…" : "✨"}
                          </button>
                        </div>
                        <div className="flex items-center gap-1">
                          <input
                            value={item.nameZh}
                            onChange={(e) => updateItem(item.id, { nameZh: e.target.value })}
                            className="w-36 rounded border border-gray-300 px-2 py-1 text-xs"
                            placeholder="中文"
                          />
                          <button
                            onClick={() => suggestTranslation(item, "zh")}
                            disabled={!item.nameEn || suggesting[`${item.id}-zh`]}
                            className="shrink-0 rounded border border-blue-200 bg-blue-50 px-1.5 py-1 text-xs text-blue-600 hover:bg-blue-100 disabled:opacity-40"
                            title="Suggest Chinese translation"
                          >
                            {suggesting[`${item.id}-zh`] ? "…" : "✨"}
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* Price */}
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={item.originalPrice ?? item.price}
                        onChange={(e) =>
                          updateItem(item.id, { price: parseFloat(e.target.value) || 0 })
                        }
                        className="w-20 rounded border border-gray-300 px-2 py-1 text-xs"
                      />
                      {item.discountPercent && item.discountPercent > 0 && (
                        <div className="mt-1 flex items-center gap-1">
                          <span className="text-xs text-gray-400 line-through">
                            RM{(item.originalPrice ?? item.price).toFixed(2)}
                          </span>
                          <span className="text-xs font-medium text-green-700">
                            RM{item.price.toFixed(2)}
                          </span>
                          <span className="rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700">
                            -{item.discountPercent}%
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Available toggle */}
                    <td className="px-3 py-2">
                      <button
                        onClick={() => updateItem(item.id, { available: !item.available })}
                        className={cn(
                          "h-6 w-10 rounded-full transition-colors",
                          item.available ? "bg-green-500" : "bg-gray-300"
                        )}
                      >
                        <span
                          className={cn(
                            "block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow transition-transform",
                            item.available && "translate-x-4"
                          )}
                        />
                      </button>
                      {item.disabledByRule && (
                        <span
                          className="mt-0.5 block rounded-full bg-red-100 px-1.5 py-0.5 text-center text-[10px] font-medium text-red-700 whitespace-nowrap"
                          title={item.appliedRules?.filter((r) => r.ruleType === "disable").map((r) => r.ruleName).join(", ")}
                        >
                          Disabled: {item.appliedRules?.find((r) => r.ruleType === "disable")?.ruleName ?? "rule"}
                        </span>
                      )}
                    </td>

                    {/* Featured star */}
                    <td className="px-3 py-2">
                      <button
                        onClick={() => updateItem(item.id, { featured: !item.featured })}
                        className={cn(
                          "text-xl",
                          item.featured ? "text-yellow-400" : "text-gray-300"
                        )}
                      >
                        ★
                      </button>
                      {item.featuredByRule && (
                        <span className="mt-0.5 block rounded-full bg-amber-100 px-1.5 py-0.5 text-center text-[10px] font-medium text-amber-700">
                          Rule
                        </span>
                      )}
                    </td>

                    {/* Categories */}
                    <td className="px-3 py-2">
                      <div className="relative group">
                        <button className="rounded border border-gray-300 px-2 py-1 text-xs">
                          {item.categories.length > 0
                            ? item.categories.join(", ").slice(0, 20) + (item.categories.join(", ").length > 20 ? "…" : "")
                            : "None"}
                        </button>
                        <div className="absolute left-0 top-8 z-10 hidden max-h-48 w-48 overflow-y-auto rounded-lg border bg-white p-2 shadow-lg group-focus-within:block group-hover:block">
                          {categories.map((cat) => (
                            <label key={cat} className="flex items-center gap-1.5 py-0.5 text-xs cursor-pointer hover:bg-gray-50 rounded px-1">
                              <input
                                type="checkbox"
                                checked={item.categories.includes(cat)}
                                onChange={() => toggleCategory(item, cat)}
                              />
                              {cat}
                            </label>
                          ))}
                        </div>
                      </div>
                    </td>

                    {/* Dietary */}
                    <td className="px-3 py-2">
                      <div className="relative group">
                        <button className="rounded border border-gray-300 px-2 py-1 text-xs">
                          {item.dietary.length > 0 ? item.dietary.join(", ") : "None"}
                        </button>
                        <div className="absolute left-0 top-8 z-10 hidden w-40 rounded-lg border bg-white p-2 shadow-lg group-focus-within:block group-hover:block">
                          {DIETARY_OPTIONS.map((d) => (
                            <label key={d} className="flex items-center gap-1.5 py-0.5 text-xs cursor-pointer hover:bg-gray-50 rounded px-1">
                              <input
                                type="checkbox"
                                checked={item.dietary.includes(d)}
                                onChange={() => toggleDietary(item, d)}
                              />
                              {d}
                            </label>
                          ))}
                        </div>
                      </div>
                    </td>

                    {/* Days */}
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-0.5">
                        {DAYS.map((day) => (
                          <button
                            key={day}
                            onClick={() => toggleDay(item, day)}
                            className={cn(
                              "rounded px-1.5 py-0.5 text-xs font-medium",
                              item.availableDays.includes(day)
                                ? "bg-orange-500 text-white"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            )}
                          >
                            {day.slice(0, 2)}
                          </button>
                        ))}
                      </div>
                    </td>

                    {/* Time */}
                    <td className="px-3 py-2">
                      <div className="flex flex-col gap-1">
                        <input
                          type="time"
                          value={item.timeFrom}
                          onChange={(e) => updateItem(item.id, { timeFrom: e.target.value })}
                          className="rounded border border-gray-300 px-1 py-0.5 text-xs"
                        />
                        <input
                          type="time"
                          value={item.timeUntil}
                          onChange={(e) => updateItem(item.id, { timeUntil: e.target.value })}
                          className="rounded border border-gray-300 px-1 py-0.5 text-xs"
                        />
                      </div>
                    </td>

                    {/* Special Dates */}
                    <td className="px-3 py-2">
                      <input
                        value={item.specialDates.join(",")}
                        onChange={(e) =>
                          updateItem(item.id, {
                            specialDates: e.target.value
                              .split(",")
                              .map((d) => d.trim())
                              .filter(Boolean),
                          })
                        }
                        className="w-28 rounded border border-gray-300 px-2 py-1 text-xs"
                        placeholder="YYYY-MM-DD"
                      />
                    </td>

                    {/* Sort */}
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        value={item.sortOrder}
                        onChange={(e) =>
                          updateItem(item.id, { sortOrder: parseInt(e.target.value) || 0 })
                        }
                        className="w-16 rounded border border-gray-300 px-2 py-1 text-xs"
                      />
                    </td>

                    {/* Actions */}
                    <td className="px-3 py-2">
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => saveItem(item)}
                          disabled={saving === item.id || !item._dirty}
                          className="rounded bg-orange-500 px-2 py-1 text-xs font-medium text-white hover:bg-orange-600 disabled:opacity-40"
                        >
                          {saving === item.id ? "…" : "Save"}
                        </button>
                        <button
                          onClick={() => deleteItem(item.id)}
                          className="rounded bg-red-50 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-100"
                        >
                          Del
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <ImagePickerModal
        open={!!imagePickerCode}
        code={imagePickerCode || ""}
        onClose={() => setImagePickerCode(null)}
        onImageChanged={() => setImgVersion((v) => v + 1)}
      />
    </div>
  );
}
