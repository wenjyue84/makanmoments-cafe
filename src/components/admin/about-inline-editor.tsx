"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export interface AboutContent {
  title: string;
  subtitle: string;
  storyTitle: string;
  storyContent: string;
  ambianceTitle: string;
  valuesTitle: string;
  valueQuality: string;
  valueQualityDesc: string;
  valueCommunity: string;
  valueCommunityDesc: string;
  valueHalal: string;
  valueHalalDesc: string;
}

interface AboutInlineEditorProps {
  content: AboutContent;
  ambianceFeatures: readonly string[];
}

export function AboutInlineEditor({
  content,
  ambianceFeatures,
}: AboutInlineEditorProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [fields, setFields] = useState<AboutContent>(content);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function setField<K extends keyof AboutContent>(key: K, value: AboutContent[K]) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/admin/content/about", {
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
    <div className="mx-auto max-w-4xl px-4 py-12">
      {/* Admin banner */}
      <div className="mb-6 flex items-center gap-3 rounded-lg border border-amber-400/50 bg-amber-50 px-4 py-2.5 text-sm text-amber-800 dark:border-amber-500/40 dark:bg-amber-950/30 dark:text-amber-300">
        <span className="text-base">✎</span>
        <span>
          <strong>Admin</strong> — you can edit the about page content.
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
          <span className="text-xs font-medium text-green-700 dark:text-green-400">
            Saved!
          </span>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="mb-12">
        {editing ? (
          <>
            <input
              value={fields.title}
              onChange={(e) => setField("title", e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 font-display text-3xl font-bold outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 lg:text-4xl"
            />
            <input
              value={fields.subtitle}
              onChange={(e) => setField("subtitle", e.target.value)}
              className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-lg text-muted-foreground outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
            />
          </>
        ) : (
          <>
            <h1 className="font-display text-3xl font-bold lg:text-4xl">{fields.title}</h1>
            <p className="mt-2 text-lg text-muted-foreground">{fields.subtitle}</p>
          </>
        )}
      </div>

      {/* Story section */}
      <section className="mb-16">
        <div className="mb-1 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Our Story</span>
          <div className="h-px flex-1 bg-border" />
        </div>
        {editing ? (
          <>
            <input
              value={fields.storyTitle}
              onChange={(e) => setField("storyTitle", e.target.value)}
              className="mt-5 mb-4 w-full rounded-lg border border-input bg-background px-3 py-2 font-display text-2xl font-bold outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
            />
            <textarea
              value={fields.storyContent}
              onChange={(e) => setField("storyContent", e.target.value)}
              rows={5}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm leading-8 text-muted-foreground outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
            />
          </>
        ) : (
          <>
            <h2 className="mt-5 mb-4 font-display text-2xl font-bold">{fields.storyTitle}</h2>
            <p className="max-w-2xl leading-8 text-muted-foreground">{fields.storyContent}</p>
          </>
        )}
      </section>

      {/* Ambiance */}
      <section className="mb-16">
        {editing ? (
          <input
            value={fields.ambianceTitle}
            onChange={(e) => setField("ambianceTitle", e.target.value)}
            className="mb-6 w-full rounded-lg border border-input bg-background px-3 py-2 font-display text-2xl font-bold outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
          />
        ) : (
          <h2 className="mb-6 font-display text-2xl font-bold">{fields.ambianceTitle}</h2>
        )}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ambianceFeatures.map((feature) => (
            <div
              key={feature}
              className="rounded-lg border border-border bg-card p-4 text-sm font-medium"
            >
              {feature}
            </div>
          ))}
        </div>
      </section>

      {/* Values */}
      <section>
        {editing ? (
          <input
            value={fields.valuesTitle}
            onChange={(e) => setField("valuesTitle", e.target.value)}
            className="mb-6 w-full rounded-lg border border-input bg-background px-3 py-2 font-display text-2xl font-bold outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
          />
        ) : (
          <h2 className="mb-6 font-display text-2xl font-bold">{fields.valuesTitle}</h2>
        )}
        <div className="grid gap-4 sm:grid-cols-3">
          {(
            [
              { qualityKey: "valueQuality", descKey: "valueQualityDesc" },
              { qualityKey: "valueCommunity", descKey: "valueCommunityDesc" },
              { qualityKey: "valueHalal", descKey: "valueHalalDesc" },
            ] as Array<{ qualityKey: keyof AboutContent; descKey: keyof AboutContent }>
          ).map(({ qualityKey, descKey }) => (
            <div
              key={qualityKey}
              className="rounded-xl border border-border bg-card p-5"
            >
              {editing ? (
                <>
                  <input
                    value={fields[qualityKey]}
                    onChange={(e) => setField(qualityKey, e.target.value)}
                    className="mb-2 w-full rounded border border-input bg-background px-2 py-1 text-sm font-semibold outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                  />
                  <textarea
                    value={fields[descKey]}
                    onChange={(e) => setField(descKey, e.target.value)}
                    rows={3}
                    className="w-full rounded border border-input bg-background px-2 py-1 text-xs text-muted-foreground outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                  />
                </>
              ) : (
                <>
                  <h3 className="mb-1 font-semibold">{fields[qualityKey]}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {fields[descKey]}
                  </p>
                </>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
