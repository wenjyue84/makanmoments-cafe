"use client";

import { useState } from "react";
import type { MenuItem } from "@/types/menu";
import { cn } from "@/lib/utils";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DIETARY_OPTIONS = ["Spicy", "Vegetarian", "Vegan", "Gluten Free"];

interface AdminMenuTableProps {
  initialItems: MenuItem[];
  categories: string[];
}

type EditableItem = MenuItem & { _dirty?: boolean; _new?: boolean };

export function AdminMenuTable({
  initialItems,
  categories,
}: AdminMenuTableProps) {
  const [items, setItems] = useState<EditableItem[]>(initialItems);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          Menu Items ({items.length})
        </h2>
        <button
          onClick={addNewRow}
          className="rounded-lg bg-orange-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-orange-600"
        >
          + Add Item
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
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
            {items.map((item) => (
              <tr
                key={item.id}
                className={cn(
                  "align-top",
                  item._dirty ? "bg-amber-50" : "bg-white"
                )}
              >
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
                    value={item.price}
                    onChange={(e) =>
                      updateItem(item.id, { price: parseFloat(e.target.value) || 0 })
                    }
                    className="w-20 rounded border border-gray-300 px-2 py-1 text-xs"
                  />
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
    </div>
  );
}
