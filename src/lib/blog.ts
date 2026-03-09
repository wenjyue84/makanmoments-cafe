import sql from "./db";
import type { BlogPost } from "@/types/blog";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToBlogPost(row: any): BlogPost {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt ?? "",
    content: row.content ?? "",
    coverImage: row.cover_image || null,
    tags: row.tags ?? [],
    language: row.language ?? "en",
    published: row.published,
    publishedAt: row.published_at
      ? (row.published_at instanceof Date
          ? row.published_at.toISOString().slice(0, 10)
          : String(row.published_at).slice(0, 10))
      : null,
  };
}

export async function getBlogPosts(locale?: string): Promise<BlogPost[]> {
  const rows = locale
    ? await sql`SELECT * FROM blog_posts WHERE published = true AND language = ${locale} ORDER BY published_at DESC`
    : await sql`SELECT * FROM blog_posts WHERE published = true ORDER BY published_at DESC`;
  return rows.map(rowToBlogPost);
}

export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  const rows = await sql`
    SELECT * FROM blog_posts WHERE slug = ${slug} AND published = true LIMIT 1
  `;
  return rows[0] ? rowToBlogPost(rows[0]) : null;
}

export async function getBlogSlugs(): Promise<string[]> {
  const rows = await sql`SELECT slug FROM blog_posts WHERE published = true`;
  return rows.map((r: Record<string, unknown>) => r.slug as string);
}

// Admin — all posts including drafts
export async function getAllBlogPostsForAdmin(): Promise<BlogPost[]> {
  const rows = await sql`SELECT * FROM blog_posts ORDER BY created_at DESC`;
  return rows.map(rowToBlogPost);
}
