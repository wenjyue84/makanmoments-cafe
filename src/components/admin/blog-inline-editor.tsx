"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PostContent } from "@/components/blog/post-content";
import type { BlogPost } from "@/types/blog";

interface BlogInlineEditorProps {
  post: BlogPost;
}

export function BlogInlineEditor({ post }: BlogInlineEditorProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(post.title);
  const [content, setContent] = useState(post.content);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(`/api/admin/blog/${post.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
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
    setTitle(post.title);
    setContent(post.content);
    setError(null);
    setEditing(false);
  }

  if (!editing) {
    return (
      <>
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-amber-400/50 bg-amber-50 px-4 py-2.5 text-sm text-amber-800 dark:border-amber-500/40 dark:bg-amber-950/30 dark:text-amber-300">
          <span className="text-base">✎</span>
          <span>
            <strong>Edit mode</strong> — you are logged in as admin.
          </span>
          <button
            onClick={() => setEditing(true)}
            className="ml-auto rounded-md bg-amber-600 px-3 py-1 text-xs font-semibold text-white hover:bg-amber-700"
          >
            Edit Post
          </button>
          {saved && (
            <span className="text-xs font-medium text-green-700 dark:text-green-400">
              Saved!
            </span>
          )}
        </div>
        <h1 className="text-3xl font-bold lg:text-4xl">{title}</h1>
        <PostContent content={content} />
      </>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-lg border border-amber-400/50 bg-amber-50 px-4 py-2.5 text-sm text-amber-800 dark:border-amber-500/40 dark:bg-amber-950/30 dark:text-amber-300">
        <span>
          <strong>Editing post</strong> — changes will be saved to the source file.
        </span>
        <div className="flex gap-2">
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
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {error}
        </div>
      )}

      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          Title
        </label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-2xl font-bold outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 lg:text-3xl"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          Content (Markdown)
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={24}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 font-mono text-sm outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
        />
      </div>
    </div>
  );
}
