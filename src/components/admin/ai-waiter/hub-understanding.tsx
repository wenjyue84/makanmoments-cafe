"use client";

import { useState, useEffect, useRef } from "react";

const TABS = [
  { slug: "cafe-facts", label: "Cafe Facts" },
  { slug: "faq", label: "FAQ" },
  { slug: "menu-knowledge", label: "Menu Knowledge" },
] as const;

type Slug = (typeof TABS)[number]["slug"];

interface FileState {
  content: string;
  lastModified: string;
  loading: boolean;
  error: string | null;
}

const EMPTY: FileState = { content: "", lastModified: "", loading: false, error: null };

export function HubUnderstanding() {
  const [activeSlug, setActiveSlug] = useState<Slug>("cafe-facts");
  const [files, setFiles] = useState<Record<Slug, FileState>>({
    "cafe-facts": EMPTY,
    "faq": EMPTY,
    "menu-knowledge": EMPTY,
  });
  const [dirtySlug, setDirtySlug] = useState<Slug | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");
  const originalRef = useRef<Record<Slug, string>>({ "cafe-facts": "", "faq": "", "menu-knowledge": "" });

  async function loadFile(slug: Slug) {
    if (files[slug].content || files[slug].loading) return;
    setFiles(f => ({ ...f, [slug]: { ...EMPTY, loading: true } }));
    try {
      const res = await fetch(`/api/admin/knowledge/${slug}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setFiles(f => ({ ...f, [slug]: { content: data.content, lastModified: data.lastModified, loading: false, error: null } }));
      originalRef.current[slug] = data.content;
    } catch (err) {
      setFiles(f => ({ ...f, [slug]: { ...EMPTY, error: String(err) } }));
    }
  }

  // Load on first tab switch
  useEffect(() => {
    loadFile(activeSlug);
  }, [activeSlug]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleTabSwitch(slug: Slug) {
    if (slug === activeSlug) return;
    const current = files[activeSlug];
    const original = originalRef.current[activeSlug];
    if (current.content !== original && dirtySlug !== null) {
      const ok = window.confirm("You have unsaved changes. Switch tabs without saving?");
      if (!ok) return;
    }
    setActiveSlug(slug);
    setDirtySlug(null);
    setSaveStatus("idle");
  }

  function handleEdit(value: string) {
    setFiles(f => ({ ...f, [activeSlug]: { ...f[activeSlug], content: value } }));
    setDirtySlug(value !== originalRef.current[activeSlug] ? activeSlug : null);
  }

  async function handleSave() {
    setSaving(true);
    setSaveStatus("idle");
    try {
      const res = await fetch(`/api/admin/knowledge/${activeSlug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: files[activeSlug].content }),
      });
      if (!res.ok) throw new Error("Save failed");
      originalRef.current[activeSlug] = files[activeSlug].content;
      setDirtySlug(null);
      setSaveStatus("saved");
      // Update lastModified optimistically
      setFiles(f => ({ ...f, [activeSlug]: { ...f[activeSlug], lastModified: new Date().toISOString() } }));
    } catch {
      setSaveStatus("error");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  }

  const file = files[activeSlug];

  function formatDate(iso: string) {
    if (!iso) return "";
    try {
      return new Date(iso).toLocaleString("en-MY", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch { return iso; }
  }

  return (
    <div>
      <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#111827", marginBottom: "0.25rem" }}>
        Understanding
      </h2>
      <p style={{ color: "#6b7280", fontSize: "0.875rem", marginBottom: "1.25rem", marginTop: 0 }}>
        Edit the knowledge files that shape what the AI Waiter knows. Changes take effect on the next chat message.
      </p>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.25rem", borderBottom: "2px solid #e5e7eb", marginBottom: "1.25rem" }}>
        {TABS.map(tab => (
          <button
            key={tab.slug}
            onClick={() => handleTabSwitch(tab.slug)}
            style={{
              padding: "0.625rem 1rem",
              fontSize: "0.875rem",
              fontWeight: 500,
              color: activeSlug === tab.slug ? "#0ea5e9" : "#64748b",
              background: "none",
              border: "none",
              borderBottom: activeSlug === tab.slug ? "2px solid #0ea5e9" : "2px solid transparent",
              marginBottom: "-2px",
              cursor: "pointer",
              transition: "color 0.15s",
              display: "flex",
              alignItems: "center",
              gap: "0.375rem",
            }}
          >
            {tab.label}
            {dirtySlug === tab.slug && (
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#f59e0b", flexShrink: 0 }} title="Unsaved changes" />
            )}
          </button>
        ))}
      </div>

      {/* Note for menu-knowledge */}
      {activeSlug === "menu-knowledge" && (
        <div style={{ marginBottom: "1rem", padding: "0.75rem 1rem", background: "#fefce8", borderRadius: "0.5rem", border: "1px solid #fde68a", fontSize: "0.8125rem", color: "#854d0e" }}>
          <strong>Note:</strong> This is a fallback file — the AI fetches live menu data from the database on every conversation. Edit items in the <strong>Menu tab</strong> of the admin panel; changes there are reflected immediately. Only edit this file if the database is unavailable.
        </div>
      )}

      {/* Editor card */}
      <div style={{ background: "#fff", borderRadius: "1rem", border: "1px solid #e5e7eb", overflow: "hidden" }}>
        {/* Meta bar */}
        <div style={{ padding: "0.75rem 1.25rem", borderBottom: "1px solid #f3f4f6", background: "#f9fafb", display: "flex", alignItems: "center", gap: "1rem" }}>
          <span style={{ fontSize: "0.8125rem", color: "#94a3b8" }}>
            {file.lastModified ? `Last modified: ${formatDate(file.lastModified)}` : ""}
          </span>
          <span style={{ fontSize: "0.8125rem", color: "#94a3b8", marginLeft: "auto" }}>
            {file.content.length.toLocaleString()} chars · {Math.ceil(file.content.length / 4).toLocaleString()} est. tokens
          </span>
        </div>

        {/* Textarea */}
        <div style={{ padding: "1rem" }}>
          {file.loading && (
            <div style={{ color: "#94a3b8", fontSize: "0.875rem", padding: "2rem", textAlign: "center" }}>Loading…</div>
          )}
          {file.error && (
            <div style={{ color: "#dc2626", fontSize: "0.875rem", padding: "1rem" }}>Error: {file.error}</div>
          )}
          {!file.loading && !file.error && (
            <textarea
              value={file.content}
              onChange={e => handleEdit(e.target.value)}
              rows={22}
              spellCheck={false}
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: "0.5rem",
                border: "1px solid #e5e7eb",
                fontSize: "0.8125rem",
                fontFamily: "ui-monospace, 'Cascadia Code', monospace",
                color: "#111827",
                lineHeight: 1.65,
                resize: "vertical",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          )}
        </div>

        {/* Footer / Save */}
        <div style={{ padding: "0.75rem 1.25rem", borderTop: "1px solid #f3f4f6", background: "#f9fafb", display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {saveStatus === "saved" && <span style={{ fontSize: "0.8125rem", color: "#16a34a", fontWeight: 500 }}>✓ Saved — AI prompt cache cleared</span>}
          {saveStatus === "error" && <span style={{ fontSize: "0.8125rem", color: "#dc2626", fontWeight: 500 }}>Save failed</span>}
          <button
            onClick={handleSave}
            disabled={saving || !dirtySlug || file.loading}
            style={{
              marginLeft: "auto",
              padding: "0.5rem 1.25rem",
              background: "#0ea5e9",
              color: "#fff",
              border: "none",
              borderRadius: "0.5rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: saving || !dirtySlug || file.loading ? "not-allowed" : "pointer",
              opacity: saving || !dirtySlug || file.loading ? 0.5 : 1,
            }}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
