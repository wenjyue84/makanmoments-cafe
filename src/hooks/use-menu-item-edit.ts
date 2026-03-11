"use client";

import { useState, useRef, useEffect } from "react";
import type { MenuItemWithRules } from "@/types/menu";

export type EditTarget = "description" | "price" | "names" | null;

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

export function useMenuItemEdit(item: MenuItemWithRules) {
  const [localItem, setLocalItem] = useState<MenuItemWithRules>(item);

  const imgInitVersion = item.updatedAt ? new Date(item.updatedAt).getTime() : 0;
  const [imgSrc, setImgSrc] = useState(
    `${item.photo}${imgInitVersion ? `?v=${imgInitVersion}` : ""}`
  );
  const [imgError, setImgError] = useState(false);
  const [isLocalUpload, setIsLocalUpload] = useState(false);

  const [editing, setEditing] = useState<EditTarget>(null);
  const [draftValue, setDraftValue] = useState("");
  const [draftNameEn, setDraftNameEn] = useState("");
  const [draftNameMs, setDraftNameMs] = useState("");
  const [draftNameZh, setDraftNameZh] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [showSignatureConfirm, setShowSignatureConfirm] = useState(false);

  const [imagePosition, setImagePosition] = useState(item.imagePosition || "50% 50%");
  const [positionDirty, setPositionDirty] = useState(false);
  const [savingPosition, setSavingPosition] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  // Secondary photos — all photos after the primary (unlimited)
  const [secondaryPhotos, setSecondaryPhotos] = useState<string[]>(() => {
    const all = item.photos ?? [];
    return all.slice(1); // everything after primary
  });

  useEffect(() => {
    setIsTouchDevice(window.matchMedia("(hover: none) and (pointer: coarse)").matches);
  }, []);

  async function patchItem(updates: Record<string, unknown>): Promise<boolean> {
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
        available: row.available !== undefined ? Boolean(row.available) : prev.available,
        nameEn: (row.name_en as string | undefined) ?? prev.nameEn,
        nameMs: (row.name_ms as string | undefined) ?? prev.nameMs,
        nameZh: (row.name_zh as string | undefined) ?? prev.nameZh,
      }));
      return true;
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Save failed");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function archiveItem(onArchive?: (id: string) => void) {
    const ok = await patchItem({ archived: true });
    if (ok) {
      setSuccessMsg("Archived. Scroll to '\u{1F4E6} Archived Items' at the bottom to restore.");
      setTimeout(() => setSuccessMsg(null), 6000);
      onArchive?.(localItem.id);
    }
  }

  function startEdit(target: EditTarget) {
    if (target === "description") setDraftValue(localItem.description || "");
    if (target === "price") setDraftValue(String(localItem.price));
    if (target === "names") {
      setDraftNameEn(localItem.nameEn || "");
      setDraftNameMs(localItem.nameMs || "");
      setDraftNameZh(localItem.nameZh || "");
    }
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
    if (editing === "names") {
      const enName = draftNameEn.trim();
      if (!enName) { cancelEdit(); return; }
      await patchItem({
        nameEn: enName,
        nameMs: draftNameMs.trim() || enName,
        nameZh: draftNameZh.trim() || enName,
      });
    }
    setEditing(null);
  }

  function cancelEdit() {
    setEditing(null);
    setErrorMsg(null);
  }

  async function toggleAvailable() {
    await patchItem({ available: !localItem.available });
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

  async function uploadPrimaryFile(file: File) {
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
      setIsLocalUpload(true);
      setSuccessMsg("Image saved \u2014 menu page cache cleared");
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setSaving(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadPrimaryFile(file);
  }

  async function handleSecondaryUpload(
    e: React.ChangeEvent<HTMLInputElement>,
    imageIndex: number
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSaving(true);
    setErrorMsg(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("code", localItem.code);
      fd.append("imageIndex", String(imageIndex));
      const res = await fetch("/api/admin/images", { method: "POST", body: fd });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || "Upload failed");
      }
      const { path } = (await res.json()) as { path: string };
      // Add or replace in the secondary photos list
      const slotIndex = imageIndex - 2; // secondaryPhotos[0] = image index 2
      setSecondaryPhotos((prev) => {
        const next = [...prev];
        if (slotIndex >= next.length) {
          // Adding a new photo
          next.push(`${path}?v=${Date.now()}`);
        } else {
          // Replacing existing
          next[slotIndex] = `${path}?v=${Date.now()}`;
        }
        return next;
      });
      setSuccessMsg("Secondary image saved");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setSaving(false);
    }
  }

  async function handlePrimaryDelete() {
    setSaving(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/admin/images", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: localItem.code, imageIndex: 1 }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || "Delete failed");
      }
      setImgError(true);
      setIsLocalUpload(false);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleSecondaryDelete(imageIndex: number) {
    setSaving(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/admin/images", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: localItem.code, imageIndex }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || "Delete failed");
      }
      const slotIndex = imageIndex - 2;
      setSecondaryPhotos((prev) => prev.filter((_, i) => i !== slotIndex));
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setSaving(false);
    }
  }

  /** The next available image index for adding a new secondary photo */
  const nextSecondaryIndex = secondaryPhotos.length + 2;

  return {
    localItem,
    imgSrc,
    imgError,
    setImgError,
    isLocalUpload,
    editing,
    draftValue,
    setDraftValue,
    draftNameEn,
    setDraftNameEn,
    draftNameMs,
    setDraftNameMs,
    draftNameZh,
    setDraftNameZh,
    saving,
    errorMsg,
    setErrorMsg,
    successMsg,
    setSuccessMsg,
    isTouchDevice,
    showSignatureConfirm,
    setShowSignatureConfirm,
    imagePosition,
    setImagePosition,
    positionDirty,
    setPositionDirty,
    savingPosition,
    secondaryPhotos,
    nextSecondaryIndex,
    fileRef,
    patchItem,
    archiveItem,
    startEdit,
    commitEdit,
    cancelEdit,
    toggleAvailable,
    adjustPosition,
    savePosition,
    uploadPrimaryFile,
    handleImageUpload,
    handlePrimaryDelete,
    handleSecondaryUpload,
    handleSecondaryDelete,
  };
}
