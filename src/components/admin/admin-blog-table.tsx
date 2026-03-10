"use client";

import { useState, useRef, useEffect } from "react";
import { Pencil } from "lucide-react";
import type { BlogPost } from "@/types/blog";
import { AdminBlogEditor } from "./admin-blog-editor";

interface AdminBlogTableProps {
  initialPosts: BlogPost[];
}

export function AdminBlogTable({ initialPosts }: AdminBlogTableProps) {
  const [posts, setPosts] = useState<BlogPost[]>(initialPosts);
  const [editingPost, setEditingPost] = useState<BlogPost | "new" | null>(null);
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingTitleId && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [editingTitleId]);

  function startEditTitle(post: BlogPost) {
    setEditingTitleId(post.id);
    setEditTitle(post.title);
  }

  function cancelEditTitle() {
    setEditingTitleId(null);
    setEditTitle("");
  }

  async function saveTitle(postId: string) {
    const trimmed = editTitle.trim();
    if (!trimmed) {
      cancelEditTitle();
      return;
    }
    const res = await fetch(`/api/admin/blog/by-id/${postId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: trimmed }),
    });
    if (res.ok) {
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, title: trimmed } : p))
      );
    }
    setEditingTitleId(null);
    setEditTitle("");
  }

  async function togglePublished(post: BlogPost) {
    const res = await fetch(`/api/admin/blog/by-id/${post.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !post.published }),
    });
    if (res.ok) {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === post.id ? { ...p, published: !p.published } : p
        )
      );
    }
  }

  async function deletePost(id: string) {
    if (!confirm("Delete this blog post?")) return;
    await fetch(`/api/admin/blog/by-id/${id}`, { method: "DELETE" });
    setPosts((prev) => prev.filter((p) => p.id !== id));
  }

  function handleSaved(post: BlogPost) {
    setPosts((prev) => {
      const exists = prev.find((p) => p.id === post.id);
      if (exists) return prev.map((p) => (p.id === post.id ? post : p));
      return [post, ...prev];
    });
    setEditingPost(null);
  }

  if (editingPost !== null) {
    return (
      <AdminBlogEditor
        post={editingPost === "new" ? null : editingPost}
        onSaved={handleSaved}
        onCancel={() => setEditingPost(null)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          Blog Posts ({posts.length})
        </h2>
        <button
          onClick={() => setEditingPost("new")}
          className="rounded-lg bg-orange-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-orange-600"
        >
          + New Post
        </button>
      </div>

      {/* Mobile card list */}
      <div className="md:hidden space-y-3">
        {posts.length === 0 && (
          <p className="py-8 text-center text-sm text-gray-400">
            No posts yet. Create your first post.
          </p>
        )}
        {posts.map((post) => (
          <div key={post.id} className="rounded-xl border bg-white p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                {editingTitleId === post.id ? (
                  <input
                    ref={titleInputRef}
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={() => saveTitle(post.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveTitle(post.id);
                      if (e.key === "Escape") cancelEditTitle();
                    }}
                    className="w-full rounded border border-orange-300 bg-orange-50 px-2 py-0.5 text-sm font-medium text-gray-900 focus:outline-none focus:ring-1 focus:ring-orange-400"
                  />
                ) : (
                  <div className="group flex cursor-text items-center gap-1" onClick={() => startEditTitle(post)}>
                    <p className="truncate font-medium text-gray-900 group-hover:underline">{post.title}</p>
                    <Pencil className="h-3 w-3 shrink-0 text-gray-400 opacity-0 group-hover:opacity-60" />
                  </div>
                )}
                <p className="truncate text-xs text-gray-400">{post.slug}</p>
                <p className="mt-1 text-xs text-gray-500">{post.publishedAt || "No date"}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium uppercase">
                  {post.language}
                </span>
                <button
                  onClick={() => togglePublished(post)}
                  className={`h-6 w-10 rounded-full transition-colors ${
                    post.published ? "bg-green-500" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow transition-transform ${
                      post.published && "translate-x-4"
                    }`}
                  />
                </button>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => setEditingPost(post)}
                className="min-h-[44px] flex-1 rounded-lg bg-gray-100 text-sm hover:bg-gray-200"
              >
                Edit
              </button>
              <button
                onClick={() => deletePost(post.id)}
                className="min-h-[44px] flex-1 rounded-lg bg-red-50 text-sm text-red-600 hover:bg-red-100"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-xl border bg-white md:block">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Lang</th>
              <th className="px-4 py-3">Published</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {posts.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-sm text-gray-400"
                >
                  No posts yet. Create your first post.
                </td>
              </tr>
            )}
            {posts.map((post) => (
              <tr key={post.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">
                  {editingTitleId === post.id ? (
                    <input
                      ref={editingTitleId === post.id ? titleInputRef : undefined}
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onBlur={() => saveTitle(post.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveTitle(post.id);
                        if (e.key === "Escape") cancelEditTitle();
                      }}
                      className="w-full rounded border border-orange-300 bg-orange-50 px-2 py-0.5 font-medium text-gray-900 focus:outline-none focus:ring-1 focus:ring-orange-400"
                    />
                  ) : (
                    <div className="group flex cursor-text items-center gap-1" onClick={() => startEditTitle(post)}>
                      <span className="group-hover:underline">{post.title}</span>
                      <Pencil className="h-3 w-3 shrink-0 text-gray-400 opacity-0 group-hover:opacity-60" />
                    </div>
                  )}
                  <div className="text-xs text-gray-400">{post.slug}</div>
                </td>
                <td className="px-4 py-3">
                  <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium uppercase">
                    {post.language}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => togglePublished(post)}
                    className={`h-6 w-10 rounded-full transition-colors ${
                      post.published ? "bg-green-500" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow transition-transform ${
                        post.published && "translate-x-4"
                      }`}
                    />
                  </button>
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {post.publishedAt || "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingPost(post)}
                      className="rounded bg-gray-100 px-2 py-1 text-xs hover:bg-gray-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deletePost(post.id)}
                      className="rounded bg-red-50 px-2 py-1 text-xs text-red-600 hover:bg-red-100"
                    >
                      Delete
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
