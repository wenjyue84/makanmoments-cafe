"use client";

import type { CSSProperties } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { HERO_BLUR } from "@/data/hero-blur";
import type { MenuItem } from "@/types/menu";
import { MenuCard } from "@/components/menu/menu-card";

export interface HomeContent {
  heroTitle: string;
  heroTagline: string;
  heroSubtitle: string;
  highlightsTitle: string;
  highlightsSubtitle: string;
}

interface HomeInlineEditorProps {
  content: HomeContent;
  featuredItems: MenuItem[];
  signatureDish?: MenuItem | null;
}

export function HomeInlineEditor({ content, featuredItems, signatureDish }: HomeInlineEditorProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [fields, setFields] = useState<HomeContent>(content);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function setField<K extends keyof HomeContent>(key: K, value: HomeContent[K]) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/admin/content/home", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      setSaved(true);
      setEditing(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error saving");
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setFields(content);
    setError(null);
    setEditing(false);
  }

  return (
    <div>
      {/* Admin banner */}
      <div className="sticky top-0 z-40 flex items-center gap-3 border-b border-amber-400/50 bg-amber-50 px-4 py-2.5 text-sm text-amber-800 dark:border-amber-500/40 dark:bg-amber-950/30 dark:text-amber-300">
        <span className="text-base">✎</span>
        <span>
          <strong>Admin</strong> — you can edit the landing page content.
        </span>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="ml-auto rounded-md bg-amber-600 px-3 py-1 text-xs font-semibold text-white hover:bg-amber-700"
          >
            Edit Mode
          </button>
        )}
        {editing && (
          <div className="ml-auto flex gap-2">
            <button
              onClick={handleCancel}
              className="rounded-md border border-amber-600 px-3 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-100 dark:text-amber-300"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-md bg-amber-600 px-3 py-1 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        )}
        {saved && !editing && (
          <span className="ml-auto text-xs font-medium text-green-700 dark:text-green-400">
            Saved!
          </span>
        )}
      </div>

      {error && (
        <div className="mx-4 mt-3 rounded-lg border border-red-300 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Hero section preview */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/8 via-background to-accent/15">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:py-16">
          <div className="flex flex-col gap-6 lg:grid lg:grid-cols-2 lg:items-center lg:gap-16">
            {/* Mobile hero image — FIRST so food is above the fold on mobile */}
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl shadow-2xl lg:hidden animate-fade-in">
              <Image
                src={signatureDish ? `/images/menu/${signatureDish.code}.jpg` : "/images/hero/hero-mobile.webp"}
                alt={signatureDish ? `${signatureDish.nameEn} — Signature dish` : "RM55.90 Steamed Fish Promo Set"}
                fill
                className="object-cover img-scale"
                sizes="100vw"
                priority
                {...(!signatureDish && { placeholder: "blur" as const, blurDataURL: HERO_BLUR.heroMobile })}
              />
              <div className="absolute bottom-3 left-3 rounded-full bg-background/80 px-3 py-1 text-xs font-medium backdrop-blur-sm">
                {signatureDish ? `${signatureDish.nameEn} — RM${signatureDish.price.toFixed(2)}` : "RM55.90 Steamed Fish Promo"}
              </div>
            </div>

            <div>
              {/* Hero title */}
              <div className="mb-3">
                <label className="mb-1 block text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  Hero Title
                </label>
                {editing ? (
                  <input
                    value={fields.heroTitle}
                    onChange={(e) => setField("heroTitle", e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 font-display text-4xl font-bold text-primary outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                    placeholder="Thai-Malaysian Fusion"
                  />
                ) : (
                  <h1 className="font-display text-5xl font-bold tracking-tight text-primary">
                    {fields.heroTitle}
                  </h1>
                )}
              </div>

              {/* Hero tagline */}
              <div className="mb-3">
                <label className="mb-1 block text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  Tagline (italic)
                </label>
                {editing ? (
                  <input
                    value={fields.heroTagline}
                    onChange={(e) => setField("heroTagline", e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 font-display text-lg italic text-primary/75 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                    placeholder="Thai Begins, Moments Stay"
                  />
                ) : (
                  <p className="font-display text-lg italic text-primary/75">
                    {fields.heroTagline}
                  </p>
                )}
              </div>

              {/* Hero subtitle */}
              <div className="mb-3">
                <label className="mb-1 block text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  Description
                </label>
                {editing ? (
                  <textarea
                    value={fields.heroSubtitle}
                    onChange={(e) => setField("heroSubtitle", e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-base leading-8 text-muted-foreground outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                    placeholder="Bold Thai flavours, Johor soul…"
                  />
                ) : (
                  <p className="text-base leading-8 text-muted-foreground">
                    {fields.heroSubtitle}
                  </p>
                )}
              </div>
            </div>

            {/* Desktop hero image */}
            <div className="relative hidden w-full lg:block lg:pl-8">
              <div
                className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl shadow-xl hover-lift"
                style={{ "--delay": "0ms" } as CSSProperties}
              >
                <Image
                  src={signatureDish ? `/images/menu/${signatureDish.code}.jpg` : "/images/hero/hero-mobile.webp"}
                  alt={signatureDish ? `${signatureDish.nameEn} — Signature dish` : "RM55.90 Steamed Fish Promo Set"}
                  fill
                  className="object-cover img-scale"
                  sizes="(max-width: 1024px) 50vw, 800px"
                  priority
                  {...(!signatureDish && { placeholder: "blur" as const, blurDataURL: HERO_BLUR.heroMobile })}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-black/5 to-transparent" />
                <div className="absolute bottom-4 left-4 rounded-full bg-background/90 px-4 py-1.5 text-sm font-semibold text-foreground backdrop-blur-md shadow-sm">
                  {signatureDish ? `${signatureDish.nameEn} — RM${signatureDish.price.toFixed(2)}` : "RM55.90 Steamed Fish Promo"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Highlights section preview */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-8">
          <div className="mb-3">
            <label className="mb-1 block text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Highlights Section Title
            </label>
            {editing ? (
              <input
                value={fields.highlightsTitle}
                onChange={(e) => setField("highlightsTitle", e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 font-display text-3xl font-bold outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                placeholder="Crowd Favourites"
              />
            ) : (
              <h2 className="font-display text-3xl font-bold">{fields.highlightsTitle}</h2>
            )}
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Highlights Subtitle
            </label>
            {editing ? (
              <input
                value={fields.highlightsSubtitle}
                onChange={(e) => setField("highlightsSubtitle", e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-muted-foreground outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                placeholder="The dishes our regulars keep coming back for"
              />
            ) : (
              <p className="mt-2 text-muted-foreground">{fields.highlightsSubtitle}</p>
            )}
          </div>
        </div>

        {featuredItems.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featuredItems.slice(0, 6).map((item, index) => (
              <MenuCard key={item.id} item={item} priority={index < 3} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
            No featured items — toggle the Featured flag on items in Admin → Menu to show them here.
          </div>
        )}

        <p className="mt-4 text-xs text-muted-foreground">
          Manage featured items in Admin → Menu → toggle the Featured flag on any item.
        </p>
      </section>
    </div>
  );
}
