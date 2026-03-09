import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { BlogPost } from "@/types/blog";

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

/**
 * Extract date from filename prefix (YYYY-MM-DD-...).
 * Falls back to today's date if not found.
 */
function extractDateFromFilename(filename: string): string {
  const match = filename.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : new Date().toISOString().slice(0, 10);
}

/**
 * Extract title from markdown content.
 * Looks for the first `# Heading` line.
 */
function extractTitle(content: string, filename: string): string {
  const headingMatch = content.match(/^#\s+(.+)$/m);
  if (headingMatch) {
    // Strip emoji and trim
    return headingMatch[1].replace(/[\u{1F600}-\u{1FFFF}]/gu, "").trim();
  }
  // Fall back to filename: strip date + Post-N prefix, convert kebab to words
  const nameWithoutDate = filename
    .replace(/^\d{4}-\d{2}-\d{2}-Post-\d+-/i, "")
    .replace(/\.md$/, "")
    .replace(/-/g, " ");
  return nameWithoutDate;
}

/**
 * Extract hashtags from content (e.g. #cafe #copy).
 * Filters out Obsidian-style wiki links.
 */
function extractTags(content: string): string[] {
  // Look for **Tags:** line first
  const tagsLineMatch = content.match(/\*\*Tags:\*\*\s*([^\n]+)/);
  if (tagsLineMatch) {
    const tagsPart = tagsLineMatch[1];
    const tags = Array.from(tagsPart.matchAll(/#([\w\u4e00-\u9fff-]+)/gu)).map(
      (m) => m[1]
    );
    // Filter out meta tags like 'ai-generated', 'facebook', 'copy', '文案'
    const filterOut = new Set(["ai-generated", "facebook", "copy", "文案"]);
    return tags.filter((t) => !filterOut.has(t)).slice(0, 5);
  }
  return [];
}

/**
 * Extract excerpt: the first non-empty paragraph that isn't a heading,
 * metadata line, or horizontal rule, with content longer than 30 chars.
 */
function extractExcerpt(content: string): string {
  const lines = content.split("\n");
  const skipPatterns = [
    /^#/, // headings
    /^\*\*[A-Z]/, // **Type:**, **Created:**, etc.
    /^---/, // horizontal rules / frontmatter
    /^\s*$/, // empty lines
    /^\[\[/, // Obsidian links
    /^>\s/, // blockquotes
    /^!\[/, // images
  ];

  const candidates: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (skipPatterns.some((p) => p.test(trimmed))) continue;
    // Strip markdown bold/italic markers for excerpt
    const clean = trimmed
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .replace(/_{1,2}/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/#+\s*/g, "");
    if (clean.length >= 30) {
      candidates.push(clean);
    }
    if (candidates.length >= 2) break;
  }
  const excerpt = candidates.slice(0, 2).join(" ");
  return excerpt.slice(0, 200) + (excerpt.length > 200 ? "…" : "");
}

/**
 * Parse a single markdown file into a BlogPost.
 */
function parsePost(filename: string): BlogPost | null {
  const filePath = path.join(BLOG_DIR, filename);
  const raw = fs.readFileSync(filePath, "utf-8");

  // gray-matter handles YAML frontmatter (---...---) and strips it from content
  const { data, content } = matter(raw);

  const slug = filename.replace(/\.md$/, "");
  // gray-matter may parse Date fields as JS Date objects
  const rawDate = data.Date || data.date;
  const publishedAt = rawDate
    ? rawDate instanceof Date
      ? rawDate.toISOString().slice(0, 10)
      : String(rawDate).slice(0, 10)
    : extractDateFromFilename(filename);

  const title =
    (data.title as string) ||
    (data.Title as string) ||
    extractTitle(content, filename);

  const tags: string[] =
    Array.isArray(data.tags)
      ? (data.tags as string[])
      : typeof data.tags === "string"
        ? [data.tags]
        : extractTags(raw); // use raw to pick up **Tags:** line

  const excerpt = (data.excerpt as string) || extractExcerpt(content);

  // Normalize date to YYYY-MM-DD
  const normalizedDate = publishedAt
    ? String(publishedAt).slice(0, 10)
    : null;

  return {
    id: `local-${slug}`,
    slug,
    title: title || slug,
    excerpt,
    content, // raw markdown — PostContent renders it via react-markdown
    coverImage: (data.coverImage as string) || (data.image as string) || null,
    tags,
    language: "zh", // most posts are Chinese; override via frontmatter if needed
    published: true,
    publishedAt: normalizedDate,
  };
}

/**
 * Read all local markdown posts from content/blog/.
 * Returns an empty array if the directory doesn't exist.
 */
export function readLocalPosts(): BlogPost[] {
  if (!fs.existsSync(BLOG_DIR)) return [];

  const files = fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith(".md"))
    .sort(); // sort by filename = sort by date

  const posts: BlogPost[] = [];
  for (const file of files) {
    try {
      const post = parsePost(file);
      if (post) posts.push(post);
    } catch {
      // Skip unparseable files silently
    }
  }
  return posts;
}

/**
 * Get a single local post by slug.
 */
export function getLocalPost(slug: string): BlogPost | null {
  const filePath = path.join(BLOG_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;
  try {
    return parsePost(`${slug}.md`);
  } catch {
    return null;
  }
}

/**
 * Get all slugs from local markdown files.
 */
export function getLocalSlugs(): string[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""));
}
