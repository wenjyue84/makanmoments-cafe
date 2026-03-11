"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { X, Upload, Info, Plus } from "lucide-react";

interface ImagePickerModalProps {
  open: boolean;
  code: string;
  onClose: () => void;
  onImageChanged: () => void;
}

/** Parse existing secondary images for a given code from the full image list */
function getSecondaryIndices(images: string[], code: string): number[] {
  const indices: number[] = [];
  const pattern = new RegExp(`^${code.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}-(\\d+)\\.(jpe?g|png|webp)$`, "i");
  for (const file of images) {
    const m = file.match(pattern);
    if (m) {
      const idx = parseInt(m[1], 10);
      if (idx >= 2) indices.push(idx);
    }
  }
  return indices.sort((a, b) => a - b);
}

export function ImagePickerModal({
  open,
  code,
  onClose,
  onImageChanged,
}: ImagePickerModalProps) {
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [imgTimestamp, setImgTimestamp] = useState(Date.now());
  const [confirmReplace, setConfirmReplace] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const addFileRef = useRef<HTMLInputElement>(null);
  // Ref map for per-slot replacement uploads
  const slotFileRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const fetchImages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/images");
      const data = await res.json();
      setImages(data.images || []);
    } catch {
      setImages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchImages();
      setSearch("");
      setError(null);
      setConfirmReplace(false);
      setImgTimestamp(Date.now());
    }
  }, [open, fetchImages]);

  const secondaryIndices = getSecondaryIndices(images, code);
  const nextIndex = secondaryIndices.length > 0 ? Math.max(...secondaryIndices) + 1 : 2;

  async function handleUpload(file: File, imageIndex: number = 1) {
    setUploading(imageIndex);
    setError(null);
    const form = new FormData();
    form.append("file", file);
    form.append("code", code);
    form.append("imageIndex", String(imageIndex));
    try {
      const res = await fetch("/api/admin/images", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setImgTimestamp(Date.now());
      await fetchImages();
      onImageChanged();
      if (imageIndex === 1) onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload error");
    } finally {
      setUploading(null);
    }
  }

  async function handleDeleteSecondary(imageIndex: number) {
    setDeleting(imageIndex);
    setError(null);
    try {
      const res = await fetch("/api/admin/images", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, imageIndex }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      setImgTimestamp(Date.now());
      await fetchImages();
      onImageChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete error");
    } finally {
      setDeleting(null);
    }
  }

  async function handlePickExisting(filename: string) {
    setUploading(1);
    setError(null);
    try {
      const imgRes = await fetch(`/images/menu/${filename}`);
      const blob = await imgRes.blob();
      const ext = filename.split(".").pop() || "jpg";
      const newFile = new File([blob], `${code}.${ext}`, { type: blob.type });

      const form = new FormData();
      form.append("file", newFile);
      form.append("code", code);
      form.append("imageIndex", "1");
      const res = await fetch("/api/admin/images", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to assign image");
      onImageChanged();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error assigning image");
    } finally {
      setUploading(null);
    }
  }

  const filtered = search
    ? images.filter((f) => f.toLowerCase().includes(search.toLowerCase()))
    : images;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative mx-4 flex max-h-[90vh] w-full max-w-3xl flex-col rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Images for {code}
            </h3>
            <p className="text-sm text-gray-500">
              Primary + unlimited secondary images (carousel on menu page)
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Compression notice */}
        <div className="mx-5 mt-3 flex items-start gap-2 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            Uploaded photos are automatically compressed and converted to WebP (max 800px wide) for fast mobile loading.
          </span>
        </div>

        {error && (
          <div className="mx-5 mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Primary image + Upload */}
        <div className="border-b px-5 py-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Primary Image</p>
          <div className="flex items-start gap-4">
            <div className="shrink-0">
              <div className="relative h-24 w-32 overflow-hidden rounded-lg border bg-gray-50">
                <Image
                  src={`/images/menu/${code}.jpg?t=${imgTimestamp}`}
                  alt={code}
                  fill
                  className="object-cover"
                  unoptimized
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                <div className="flex h-full items-center justify-center text-2xl text-gray-300">
                  🍽️
                </div>
              </div>
            </div>
            <div className="flex-1">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleUpload(f, 1);
                  setConfirmReplace(false);
                }}
              />
              {confirmReplace ? (
                <div className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-3">
                  <p className="mb-3 text-sm font-medium text-orange-800">
                    Replace the current primary photo?
                  </p>
                  <p className="mb-3 text-xs text-orange-600">
                    The existing photo will be overwritten and cannot be recovered.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => fileRef.current?.click()}
                      disabled={uploading !== null}
                      className="flex-1 rounded-lg bg-orange-500 px-3 py-2 text-xs font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
                    >
                      Yes, replace it
                    </button>
                    <button
                      onClick={() => setConfirmReplace(false)}
                      className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-600 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmReplace(true)}
                  disabled={uploading !== null}
                  className="rounded-lg border-2 border-dashed border-gray-300 px-6 py-4 text-sm text-gray-500 hover:border-orange-400 hover:text-orange-600 disabled:opacity-50"
                >
                  {uploading === 1 ? "Compressing & uploading..." : "Click to replace primary image (max 5MB)"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Secondary images — dynamic unlimited */}
        <div className="border-b px-5 py-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Secondary Images (optional — shown in carousel)
          </p>
          <div className="flex flex-wrap gap-4">
            {secondaryIndices.map((idx) => (
              <div key={idx} className="flex flex-col gap-2">
                <p className="text-xs text-gray-500">Image {idx}</p>
                <div className="relative h-24 w-32 overflow-hidden rounded-lg border bg-gray-50 group">
                  <Image
                    src={`/images/menu/${code}-${idx}.webp?t=${imgTimestamp}`}
                    alt={`${code} image ${idx}`}
                    fill
                    className="object-cover"
                    unoptimized
                    onError={(e) => {
                      // Try jpg fallback
                      const el = e.target as HTMLImageElement;
                      if (el.src.includes(".webp")) {
                        el.src = `/images/menu/${code}-${idx}.jpg?t=${imgTimestamp}`;
                      } else {
                        el.style.display = "none";
                      }
                    }}
                  />
                  <div className="flex h-full items-center justify-center text-2xl text-gray-300">
                    +
                  </div>
                </div>
                <div className="flex gap-1">
                  <input
                    ref={(el) => { slotFileRefs.current[idx] = el; }}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleUpload(f, idx);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => slotFileRefs.current[idx]?.click()}
                    disabled={uploading !== null || deleting !== null}
                    className="flex items-center gap-1 rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:border-orange-400 hover:text-orange-600 disabled:opacity-50"
                  >
                    <Upload className="h-3 w-3" />
                    {uploading === idx ? "Compressing..." : "Replace"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteSecondary(idx)}
                    disabled={uploading !== null || deleting !== null}
                    className="flex items-center gap-1 rounded-md border border-red-200 px-2 py-1 text-xs text-red-500 hover:bg-red-50 disabled:opacity-50"
                  >
                    <X className="h-3 w-3" />
                    {deleting === idx ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            ))}

            {/* Add new secondary image button */}
            <div className="flex flex-col gap-2">
              <p className="text-xs text-gray-500">Add photo</p>
              <input
                ref={addFileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleUpload(f, nextIndex);
                  // Reset so the same file can be re-selected
                  if (addFileRef.current) addFileRef.current.value = "";
                }}
              />
              <button
                type="button"
                onClick={() => addFileRef.current?.click()}
                disabled={uploading !== null || deleting !== null}
                className="flex h-24 w-32 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 text-gray-400 transition-colors hover:border-orange-400 hover:text-orange-600 disabled:opacity-50"
              >
                {uploading === nextIndex ? (
                  <span className="text-xs">Compressing...</span>
                ) : (
                  <Plus className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="px-5 pt-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search existing images to set as primary..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
          />
        </div>

        {/* Image grid */}
        <div className="flex-1 overflow-y-auto px-5 py-3">
          {loading ? (
            <div className="py-12 text-center text-sm text-gray-400">
              Loading images...
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-3 sm:grid-cols-5 md:grid-cols-6">
              {filtered.map((filename) => {
                const isCurrentCode =
                  filename.replace(/\.\w+$/, "").toUpperCase() ===
                  code.toUpperCase();
                return (
                  <button
                    key={filename}
                    onClick={() => handlePickExisting(filename)}
                    disabled={uploading !== null}
                    className={`group relative aspect-[4/3] overflow-hidden rounded-lg border-2 transition-all hover:border-orange-400 hover:shadow-md ${
                      isCurrentCode
                        ? "border-orange-500 ring-2 ring-orange-200"
                        : "border-transparent"
                    }`}
                    title={filename}
                  >
                    <Image
                      src={`/images/menu/${filename}`}
                      alt={filename}
                      fill
                      className="object-cover"
                      sizes="120px"
                      unoptimized
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-1 pb-1 pt-4">
                      <span className="text-[10px] font-medium leading-none text-white">
                        {filename.replace(/\.\w+$/, "")}
                      </span>
                    </div>
                    {isCurrentCode && (
                      <div className="absolute right-1 top-1 rounded-full bg-orange-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
                        Current
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <div className="py-12 text-center text-sm text-gray-400">
              No images found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
