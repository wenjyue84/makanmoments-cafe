"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";

interface ImagePickerModalProps {
  open: boolean;
  code: string;
  onClose: () => void;
  onImageChanged: () => void;
}

export function ImagePickerModal({
  open,
  code,
  onClose,
  onImageChanged,
}: ImagePickerModalProps) {
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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
    }
  }, [open, fetchImages]);

  async function handleUpload(file: File) {
    setUploading(true);
    setError(null);
    const form = new FormData();
    form.append("file", file);
    form.append("code", code);
    try {
      const res = await fetch("/api/admin/images", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      onImageChanged();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload error");
    } finally {
      setUploading(false);
    }
  }

  async function handlePickExisting(filename: string) {
    // Copy the selected image as {code}.jpg by re-uploading via fetch from public
    setUploading(true);
    setError(null);
    try {
      // Fetch the existing image file
      const imgRes = await fetch(`/images/menu/${filename}`);
      const blob = await imgRes.blob();
      const ext = filename.split(".").pop() || "jpg";
      const newFile = new File([blob], `${code}.${ext}`, { type: blob.type });

      const form = new FormData();
      form.append("file", newFile);
      form.append("code", code);
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
      setUploading(false);
    }
  }

  const filtered = search
    ? images.filter((f) => f.toLowerCase().includes(search.toLowerCase()))
    : images;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative mx-4 flex max-h-[85vh] w-full max-w-3xl flex-col rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Image for {code}
            </h3>
            <p className="text-sm text-gray-500">
              Upload a new image or pick from existing ({images.length} images)
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

        {error && (
          <div className="mx-5 mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Current image + Upload */}
        <div className="flex items-start gap-4 border-b px-5 py-4">
          <div className="shrink-0">
            <p className="mb-1.5 text-xs font-medium text-gray-500">Current</p>
            <div className="relative h-24 w-32 overflow-hidden rounded-lg border bg-gray-50">
              <Image
                src={`/images/menu/${code}.jpg?t=${Date.now()}`}
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
            <p className="mb-1.5 text-xs font-medium text-gray-500">
              Upload new image
            </p>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleUpload(f);
              }}
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="rounded-lg border-2 border-dashed border-gray-300 px-6 py-4 text-sm text-gray-500 hover:border-orange-400 hover:text-orange-600 disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "Click to choose file (max 5MB)"}
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-5 pt-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search images by filename..."
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
                    disabled={uploading}
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
