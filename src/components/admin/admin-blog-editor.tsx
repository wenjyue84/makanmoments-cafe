"use client";

import { useState } from "react";
import type { BlogPost } from "@/types/blog";

interface AdminBlogEditorProps {
  post: BlogPost | null;
  onSaved: (post: BlogPost) => void;
  onCancel: () => void;
}

export function AdminBlogEditor({
  post,
  onSaved,
  onCancel,
}: AdminBlogEditorProps) {
  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [language, setLanguage] = useState(post?.language ?? "en");
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [content, setContent] = useState(post?.content ?? "");
  const [coverImage, setCoverImage] = useState(post?.coverImage ?? "");
  const [tags, setTags] = useState(post?.tags.join(", ") ?? "");
  const [publishedAt, setPublishedAt] = useState(post?.publishedAt ?? "");
  const [published, setPublished] = useState(post?.published ?? false);
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function generateSlug(t: string) {
    return t
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function handleTitleChange(val: string) {
    setTitle(val);
    if (!post) setSlug(generateSlug(val));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    const body = {
      slug,
      title,
      excerpt,
      content,
      coverImage,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      language,
      published,
      publishedAt: publishedAt || null,
    };

    try {
      const res = post
        ? await fetch(`/api/admin/blog/${post.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })
        : await fetch("/api/admin/blog", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");

      // Normalize the response to BlogPost shape
      const saved: BlogPost = {
        id: data.id,
        slug: data.slug,
        title: data.title,
        excerpt: data.excerpt ?? "",
        content: data.content ?? "",
        coverImage: data.cover_image || null,
        tags: data.tags ?? [],
        language: data.language ?? "en",
        published: data.published,
        publishedAt: data.published_at ?? null,
      };
      onSaved(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error saving");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border bg-white p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          {post ? "Edit Post" : "New Post"}
        </h2>
        <button
          onClick={onCancel}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back to list
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {/* Title */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Title
          </label>
          <input
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
            placeholder="Post title"
          />
        </div>

        {/* Slug + Language row */}
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Slug
            </label>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
              placeholder="url-slug"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Language
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
            >
              <option value="en">EN</option>
              <option value="ms">MS</option>
              <option value="zh">ZH</option>
            </select>
          </div>
        </div>

        {/* Excerpt */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Excerpt
          </label>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
            placeholder="Short description (1–2 sentences)"
          />
        </div>

        {/* Content with preview toggle */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              Content (Markdown)
            </label>
            <button
              onClick={() => setPreview(!preview)}
              className="text-xs text-orange-600 hover:underline"
            >
              {preview ? "Edit" : "Preview"}
            </button>
          </div>
          {preview ? (
            <div className="min-h-64 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm">
              <MarkdownPreview content={content} />
            </div>
          ) : (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={16}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
              placeholder="Write in Markdown..."
            />
          )}
        </div>

        {/* Cover Image */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Cover Image URL
          </label>
          <input
            value={coverImage}
            onChange={(e) => setCoverImage(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
            placeholder="https://... or /images/blog/..."
          />
        </div>

        {/* Tags + Published At row */}
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Tags (comma-separated)
            </label>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
              placeholder="thai, recipe, story"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Published At
            </label>
            <input
              type="date"
              value={publishedAt}
              onChange={(e) => setPublishedAt(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
            />
          </div>
        </div>

        {/* Published toggle + Save */}
        <div className="flex items-center justify-between pt-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <button
              onClick={() => setPublished(!published)}
              className={`h-6 w-10 rounded-full transition-colors ${
                published ? "bg-green-500" : "bg-gray-300"
              }`}
            >
              <span
                className={`block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow transition-transform ${
                  published && "translate-x-4"
                }`}
              />
            </button>
            <span className="text-sm text-gray-700">Published</span>
          </label>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-orange-500 px-6 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save Post"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Simple inline markdown preview (basic rendering without react-markdown for the editor)
function MarkdownPreview({ content }: { content: string }) {
  if (!content) return <p className="text-gray-400">Nothing to preview.</p>;
  // Split into lines and render basic markdown
  const lines = content.split("\n");
  return (
    <div className="prose prose-sm max-w-none">
      {lines.map((line, i) => {
        if (line.startsWith("# ")) return <h1 key={i}>{line.slice(2)}</h1>;
        if (line.startsWith("## ")) return <h2 key={i}>{line.slice(3)}</h2>;
        if (line.startsWith("### ")) return <h3 key={i}>{line.slice(4)}</h3>;
        if (line.startsWith("- ")) return <li key={i}>{line.slice(2)}</li>;
        if (line === "") return <br key={i} />;
        return <p key={i}>{line}</p>;
      })}
    </div>
  );
}
