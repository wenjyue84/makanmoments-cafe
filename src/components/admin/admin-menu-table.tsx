"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import type { MenuItemWithRules } from "@/types/menu";
import { cn } from "@/lib/utils";
import { ImagePickerModal } from "./image-picker-modal";

const MISSING_PHOTOS_DISMISSED_KEY = "admin_missing_photos_dismissed";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DIETARY_OPTIONS = ["Spicy", "Vegetarian", "Vegan", "Gluten Free"];

interface AdminMenuTableProps {
  initialItems: MenuItemWithRules[];
  categories: string[];
}

type EditableItem = MenuItemWithRules & { _dirty?: boolean; _new?: boolean };

export function AdminMenuTable({
  initialItems,
  categories,
}: AdminMenuTableProps) {
  const [items, setItems] = useState<EditableItem[]>(initialItems);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imagePickerCode, setImagePickerCode] = useState<string | null>(null);
  const [imgVersion, setImgVersion] = useState(0);
  const [missingPhotos, setMissingPhotos] = useState<{ id: string; code: string; nameEn: string }[]>([]);
  const [photoAlertDismissed, setPhotoAlertDismissed] = useState(false);
  const [highlightedCode, setHighlightedCode] = useState<string | null>(null);

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
        sortOrder: 0,
        availableDays: [],
        timeFrom: "",
        timeUntil: "",
        specialDates: [],
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

  function toggleCategory(item: EditableItem, cat: string) {
    const cats = item.categories.includes(cat)
      ? item.categories.filter((c) => c !== cat)
      : [...item.categories, cat];
    updateItem(item.id, { categories: cats });
  }

  const filteredItems = activeCategory
    ? items.filter((i) => i.categories.includes(activeCategory))
    : items;

  return (
    <div className="space-y-4">
      {!photoAlertDismissed && missingPhotos.length > 0 && (
        <div className="rounded-lg border border-amber-400 bg-amber-50 p-3 text-sm text-amber-800">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium">
                ⚠️ {missingPhotos.length} item{missingPhotos.length !== 1 ? "s" : ""} have no photo. Consider adding photos to improve the menu page.
              </p>
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
            </div>
            <button
              onClick={dismissPhotoAlert}
              className="shrink-0 rounded px-2 py-0.5 text-xs font-medium hover:bg-amber-100"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={activeCategory ?? ""}
          onChange={(e) => setActiveCategory(e.target.value || null)}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
        >
          <option value="">All Categories ({items.length} items)</option>
          {categories.map((cat) => {
            const count = items.filter((i) => i.categories.includes(cat)).length;
            return (
              <option key={cat} value={cat}>
                {cat} ({count} item{count !== 1 ? "s" : ""})
              </option>
            );
          })}
        </select>
        <h2 className="flex-1 text-lg font-semibold text-gray-900">
          {activeCategory
            ? `${activeCategory} (${filteredItems.length} item${filteredItems.length !== 1 ? "s" : ""})`
            : `Menu Items (${items.length})`}
        </h2>
        <button
          onClick={addNewRow}
          className="rounded-lg bg-orange-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-orange-600"
        >
          + Add Item
        </button>
      </div>

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
                <input
                  value={item.nameEn}
                  onChange={(e) => updateItem(item.id, { nameEn: e.target.value })}
                  className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                  placeholder="English name"
                />
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

      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-xl border bg-white md:block">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <th className="px-3 py-3">Image</th>
              <th className="px-3 py-3">Code</th>
              <th className="px-3 py-3">Name EN / MS / ZH</th>
              <th className="px-3 py-3">Price</th>
              <th className="px-3 py-3">On</th>
              <th className="px-3 py-3">★</th>
              <th className="px-3 py-3">Categories</th>
              <th className="px-3 py-3">Dietary</th>
              <th className="px-3 py-3">Days</th>
              <th className="px-3 py-3">Time</th>
              <th className="px-3 py-3">Dates</th>
              <th className="px-3 py-3">Sort</th>
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
                    <input
                      value={item.nameEn}
                      onChange={(e) => updateItem(item.id, { nameEn: e.target.value })}
                      className="w-44 rounded border border-gray-300 px-2 py-1 text-xs"
                      placeholder="English"
                    />
                    <input
                      value={item.nameMs}
                      onChange={(e) => updateItem(item.id, { nameMs: e.target.value })}
                      className="w-44 rounded border border-gray-300 px-2 py-1 text-xs"
                      placeholder="Melayu"
                    />
                    <input
                      value={item.nameZh}
                      onChange={(e) => updateItem(item.id, { nameZh: e.target.value })}
                      className="w-44 rounded border border-gray-300 px-2 py-1 text-xs"
                      placeholder="中文"
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

      <ImagePickerModal
        open={!!imagePickerCode}
        code={imagePickerCode || ""}
        onClose={() => setImagePickerCode(null)}
        onImageChanged={() => setImgVersion((v) => v + 1)}
      />
    </div>
  );
}
