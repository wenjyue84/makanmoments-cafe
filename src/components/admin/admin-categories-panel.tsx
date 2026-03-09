"use client";

import { useState } from "react";

interface Category {
  id: number;
  name: string;
  sort_order: number;
}

interface AdminCategoriesPanelProps {
  initialCategories: string[];
}

export function AdminCategoriesPanel({
  initialCategories,
}: AdminCategoriesPanelProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Load full category objects on first interaction
  async function loadCategories() {
    if (loaded) return;
    const res = await fetch("/api/admin/categories");
    const data = await res.json();
    setCategories(data);
    setLoaded(true);
  }

  async function addCategory() {
    if (!newName.trim()) return;
    setError(null);
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), sortOrder: categories.length + 1 }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to add");
      return;
    }
    setCategories((prev) => [...prev, data]);
    setNewName("");
  }

  async function saveEdit(id: number) {
    if (!editName.trim()) return;
    const res = await fetch(`/api/admin/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName.trim() }),
    });
    const data = await res.json();
    if (res.ok) {
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, name: data.name } : c))
      );
      setEditingId(null);
    }
  }

  async function deleteCategory(id: number, name: string) {
    if (
      !confirm(
        `Delete "${name}"? This will also remove it from all menu items.`
      )
    )
      return;
    await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }

  async function reorder(id: number, direction: "up" | "down") {
    const idx = categories.findIndex((c) => c.id === id);
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === categories.length - 1) return;
    const newCats = [...categories];
    const swap = direction === "up" ? idx - 1 : idx + 1;
    [newCats[idx], newCats[swap]] = [newCats[swap], newCats[idx]];
    setCategories(newCats);
    // Persist both sort_orders
    await Promise.all([
      fetch(`/api/admin/categories/${newCats[idx].id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder: idx }),
      }),
      fetch(`/api/admin/categories/${newCats[swap].id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder: swap }),
      }),
    ]);
  }

  return (
    <div className="space-y-6" onClick={loadCategories}>
      <div className="rounded-xl border bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Categories</h2>

        {error && (
          <div className="mb-3 rounded bg-red-50 p-2 text-sm text-red-700">{error}</div>
        )}

        {/* Add new */}
        <div className="mb-6 flex gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCategory()}
            placeholder="New category name"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
          />
          <button
            onClick={addCategory}
            className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
          >
            Add
          </button>
        </div>

        {/* List */}
        {!loaded ? (
          <p className="text-sm text-gray-500">
            Click anywhere to load categories…
          </p>
        ) : categories.length === 0 ? (
          <p className="text-sm text-gray-500">No categories yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {categories.map((cat, idx) => (
              <li
                key={cat.id}
                className="flex items-center justify-between py-2.5"
              >
                <div className="flex items-center gap-2">
                  <span className="w-6 text-xs text-gray-400">{idx + 1}</span>
                  {editingId === cat.id ? (
                    <input
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEdit(cat.id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      className="rounded border border-orange-300 px-2 py-1 text-sm outline-none"
                    />
                  ) : (
                    <span
                      className="cursor-pointer text-sm hover:text-orange-600"
                      onClick={() => {
                        setEditingId(cat.id);
                        setEditName(cat.name);
                      }}
                    >
                      {cat.name}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {editingId === cat.id ? (
                    <>
                      <button
                        onClick={() => saveEdit(cat.id)}
                        className="rounded bg-green-50 px-2 py-1 text-xs text-green-700 hover:bg-green-100"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="rounded bg-gray-50 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => reorder(cat.id, "up")}
                        disabled={idx === 0}
                        className="rounded px-1.5 py-0.5 text-xs text-gray-400 hover:bg-gray-100 disabled:opacity-30"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => reorder(cat.id, "down")}
                        disabled={idx === categories.length - 1}
                        className="rounded px-1.5 py-0.5 text-xs text-gray-400 hover:bg-gray-100 disabled:opacity-30"
                      >
                        ↓
                      </button>
                      <button
                        onClick={() => deleteCategory(cat.id, cat.name)}
                        className="rounded px-2 py-0.5 text-xs text-red-500 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Preview (from initial server data) */}
      {!loaded && (
        <div className="rounded-xl border bg-white p-6">
          <p className="mb-2 text-sm font-medium text-gray-600">
            Current categories ({initialCategories.length}):
          </p>
          <div className="flex flex-wrap gap-2">
            {initialCategories.map((cat) => (
              <span
                key={cat}
                className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-700"
              >
                {cat}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
