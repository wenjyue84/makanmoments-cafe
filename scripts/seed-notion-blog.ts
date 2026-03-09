/**
 * Seed Notion Blog Database from local post files
 *
 * Usage:
 *   npx tsx scripts/seed-notion-blog.ts
 *
 * Only includes SHOP-perspective posts, excludes customer-perspective posts.
 */

import { Client } from "@notionhq/client";
import { readFileSync, readdirSync, statSync } from "fs";
import { join, basename } from "path";

// Load env
const envPath = join(__dirname, "..", ".env.local");
const envContent = readFileSync(envPath, "utf-8");
for (const line of envContent.split(/\r?\n/)) {
  const match = line.match(/^([^#=\s]+)\s*=\s*(.*)$/);
  if (match) {
    const key = match[1].trim();
    const val = match[2].trim();
    if (val && !process.env[key]) process.env[key] = val;
  }
}

const NOTION_API_KEY = process.env.NOTION_API_KEY || "";
const NOTION_BLOG_DB_ID = process.env.NOTION_BLOG_DB_ID || "";

if (!NOTION_API_KEY || !NOTION_BLOG_DB_ID) {
  console.error("Missing NOTION_API_KEY or NOTION_BLOG_DB_ID in .env.local");
  process.exit(1);
}

const notion = new Client({ auth: NOTION_API_KEY });

const POSTS_ROOT =
  "C:/Users/Jyue/Documents/2-areas/makan-moments-cafe/3-resources/posts";

// --- Customer-perspective ai-posts to EXCLUDE ---
const CUSTOMER_AI_POSTS = new Set([
  "2026-02-07-Post-4-Curry-Noodle-Story.md",
  "2026-02-07-Post-5-Local-Discovery.md",
  "2026-02-07-Post-6-Ice-Cream-Quick.md",
  "2026-02-08-Post-1-Weekend-Lunch-Special-v2.md",
  "2026-02-08-Post-2-Merry-Ice-Cream-v2.md",
  "2026-02-08-Post-2-Student-Study-Haven.md",
  "2026-02-08-Post-4-Corner-Shop-Discovery.md",
  "2026-02-08-Post-4-Corner-Shop-Discovery-v2.md",
  "2026-02-08-Post-4-Dinner-Date-Spot.md",
  "2026-02-08-Post-5-Ice-Cream-Kids.md",
  "2026-02-08-Post-5-Ice-Cream-Kids-v2.md",
  "2026-02-08-Post-5-JB-Hidden-Gem-Discovery.md",
  "2026-02-08-Post-6-Office-Worker-Drinks.md",
  "2026-02-08-Post-6-Quick-Recommend.md",
  "2026-02-08-Post-6-Vegetarian-Friendly.md",
  "2026-02-09-Post-4-Family-Dinner-Experience.md",
  "2026-02-09-Post-4-Student-Study-Spot.md",
  "2026-02-09-Post-5-Cat-Cafe-Vibes.md",
  "2026-02-09-Post-5-Family-Dinner.md",
  "2026-02-09-Post-6-Couple-Dinner-Date.md",
  "2026-02-09-Post-6-Hidden-Gem-Discovery.md",
  "2026-02-10-Post-2-Student-Study-Spot.md",
  "2026-02-10-Post-4-Cat-Cafe-Vibes.md",
  "2026-02-10-Post-6-Community-Story.md",
  "2026-02-11-Post-2-Student-Study-Spot.md",
  "2026-02-11-Post-4-Fish-Review.md",
  "2026-02-11-Post-4-Weekend-Lunch-Deal.md",
  "2026-02-11-Post-5-Cat-Cafe-Vibes.md",
  "2026-02-11-Post-6-Ice-Cream-Flavors.md",
  "2026-02-11-Post-6-Neighborhood-Discovery.md",
  "2026-02-12-Post-4-Nasi-Lemak-Story.md",
  "2026-02-12-Post-5-Family-Dining.md",
  "2026-02-12-Post-5-Vegetarian-Surprise.md",
  "2026-02-12-Post-6-Cat-Cafe-Moments.md",
  "2026-02-12-Post-6-Solo-Work-Vibes.md",
  "2026-02-13-Post-1-Pineapple-Fried-Rice.md",
  "2026-02-13-Post-2-Tea-Time.md",
  "2026-02-13-Post-3-Luo-Han-Guo.md",
  "2026-02-13-Post-4-Lunch-Promo-Customer.md",
  "2026-02-13-Post-4-Friends-Gathering.md",
  "2026-02-13-Post-5-Hidden-Gem-Discovery.md",
  "2026-02-13-Post-5-Hidden-Gem.md",
  "2026-02-13-Post-6-Breakfast.md",
  "2026-02-13-Post-6-Weekend-Treat-Yourself.md",
  "2026-02-15-Post-2-Student-Study-Spot.md",
  "2026-02-15-Post-4-Cat-Cafe-Vibes.md",
  "2026-02-15-Post-4-Pineapple-Fried-Rice-Review.md",
  "2026-02-15-Post-5-Family-Dinner-Experience.md",
  "2026-02-15-Post-6-Couple-Date-Spot.md",
  "2026-02-15-Post-6-Lunch-Set-Deal.md",
  "2026-02-16-Post-2-Solo-Work-Space.md",
  "2026-02-16-Post-2-Student-Study-Heaven.md",
  "2026-02-16-Post-4-Family-Dinner-Kids.md",
  "2026-02-16-Post-5-Hidden-Gem.md",
  "2026-02-16-Post-6-Malaysian-Ice-Cream.md",
  "2026-02-16-Post-6-Monday-Blues-Cure.md",
  "2026-02-17-Post-4-Friends-Gathering-Surprise.md",
  "2026-02-17-Post-5-Solo-Chill-WorkFromCafe.md",
  "2026-02-17-Post-6-Birthday-Celebration.md",
  "2026-02-18-Post-11-JB-Hidden-Gem.md",
  "2026-02-18-Post-2-Student-Study-Spot.md",
  "2026-02-18-Post-3-Family-Dinner-Kids.md",
  "2026-02-18-Post-6-Supper-Late-Night.md",
  "2026-02-18-Post-8-Date-Night-Review.md",
  "2026-02-18-Post-9-Birthday-Celebration.md",
  "2026-02-19-Post-4-Cat-Cafe-Vibes.md",
  "2026-02-19-Post-5-Family-Dinner.md",
  "2026-02-19-Post-6-JB-Hidden-Gem.md",
]);

// Folders to include (all posts are shop-perspective)
const FULL_INCLUDE_FOLDERS = [
  "engagement",
  "menu-features",
  "operations",
  "promotions",
  "stories",
];

// Tag mapping from Content Type keywords to blog tags
function mapTags(contentType: string, folder: string): string[] {
  const tags: string[] = [];
  const ct = contentType.toLowerCase();

  if (ct.includes("promotion") || ct.includes("menu highlight") || ct.includes("event"))
    tags.push("promotion");
  if (ct.includes("story") || ct.includes("testimonial")) tags.push("story");
  if (ct.includes("announcement")) tags.push("announcement");
  if (ct.includes("behind-the-scenes") || ct.includes("behind the scenes"))
    tags.push("behind-the-scenes");
  if (ct.includes("recipe") || ct.includes("tips")) tags.push("recipe");

  // Fallback based on folder
  if (tags.length === 0) {
    switch (folder) {
      case "engagement":
        tags.push("promotion");
        break;
      case "menu-features":
        tags.push("promotion");
        break;
      case "operations":
        tags.push("announcement");
        break;
      case "promotions":
        tags.push("promotion");
        break;
      case "stories":
        tags.push("story");
        break;
      case "ai-posts":
        tags.push("promotion");
        break;
    }
  }

  return tags;
}

// Detect language from content
function detectLanguage(text: string): string {
  const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  const totalChars = text.replace(/\s/g, "").length || 1;
  const chineseRatio = chineseChars / totalChars;

  if (chineseRatio > 0.15) return "zh";
  if (/\b(kami|anda|makanan|minuman|sedap)\b/i.test(text)) return "ms";
  return "en";
}

// Generate slug from title
function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "") // remove non-word chars (keeps Chinese removed too)
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "untitled";
}

interface PostData {
  title: string;
  slug: string;
  date: string;
  excerpt: string;
  tags: string[];
  language: string;
  content: string;
  folder: string;
}

function parsePost(filepath: string, folder: string): PostData | null {
  const raw = readFileSync(filepath, "utf-8");
  const filename = basename(filepath);

  // Extract title from first # heading
  const titleMatch = raw.match(/^#\s+(.+)$/m);
  let title = titleMatch ? titleMatch[1].replace(/[🎉🍽️👵🖥️🆓🍛🌶️💝🍜📝📋🥗🔟🍱👔🍽🌿📊🐟🎊🧧💚🔥🍚🥤☕🍨🧁🐱🌱💐🌸🎄🪔✨🎁🏠🤝]/g, "").trim() : filename.replace(/\.md$/, "");

  // Extract date from Created field or filename
  const createdMatch = raw.match(/\*\*Created:\*\*\s*(\d{4}-\d{2}-\d{2})/);
  const filenameDateMatch = filename.match(/^(\d{4}-\d{2}-\d{2})/);
  const date = createdMatch?.[1] || filenameDateMatch?.[1] || "2026-01-24";

  // Extract AI summary as excerpt
  const summaryMatch = raw.match(/\*\*AI summary:\*\*\s*(.+)/);
  let excerpt = summaryMatch?.[1]?.trim() || "";

  // Skip empty posts
  if (excerpt === "没有内容" || excerpt === "") {
    // Try to get excerpt from body content
    const bodyMatch = raw.match(/## 文案内容[^\n]*\n\n(.+)/);
    if (bodyMatch) {
      excerpt = bodyMatch[1].replace(/[*#🎉🔥💚✅📍⏰📞💬👫🧊🍛🐟]/g, "").trim().slice(0, 200);
    }
  }

  if (!excerpt || excerpt === "没有内容") {
    // Last resort: grab first meaningful paragraph
    const lines = raw.split(/\r?\n/).filter(
      (l) =>
        l.trim() &&
        !l.startsWith("#") &&
        !l.startsWith("**") &&
        !l.startsWith("---") &&
        !l.startsWith("-")
    );
    excerpt = lines[0]?.trim().slice(0, 200) || "";
  }

  if (!excerpt) return null; // Skip posts with no content at all

  // Extract Content Type
  const contentTypeMatch = raw.match(/\*\*Content Type:\*\*\s*(.+)/);
  const postTypeMatch = raw.match(/## Post Type:\s*(.+)/);
  const contentType = contentTypeMatch?.[1] || postTypeMatch?.[1] || "";

  const tags = mapTags(contentType, folder);
  const language = detectLanguage(raw);

  // Extract body content for ai-posts (after "## 文案内容")
  let content = "";
  const bodyStart = raw.indexOf("## 文案内容");
  if (bodyStart !== -1) {
    const afterHeader = raw.slice(bodyStart);
    const nextSection = afterHeader.indexOf("\n---\n", 10);
    content = nextSection !== -1 ? afterHeader.slice(0, nextSection).trim() : afterHeader.trim();
  }

  const slug = slugify(title) || slugify(filename.replace(/\.md$/, ""));

  return { title, slug, date, excerpt: excerpt.slice(0, 300), tags, language, content, folder };
}

function listMdFiles(dir: string): string[] {
  try {
    return readdirSync(dir)
      .filter((f) => f.endsWith(".md") && f !== "README.md" && f !== "INDEX.md")
      .map((f) => join(dir, f));
  } catch {
    return [];
  }
}

async function seed() {
  const allPosts: PostData[] = [];

  // 1. Full-include folders
  for (const folder of FULL_INCLUDE_FOLDERS) {
    const dir = join(POSTS_ROOT, folder);
    const files = listMdFiles(dir);
    console.log(`[${folder}] Found ${files.length} files`);

    for (const filepath of files) {
      const post = parsePost(filepath, folder);
      if (post) allPosts.push(post);
    }
  }

  // 2. ai-posts (filtered — exclude customer perspective)
  const aiDir = join(POSTS_ROOT, "ai-posts");
  const aiFiles = listMdFiles(aiDir);
  console.log(`[ai-posts] Found ${aiFiles.length} files total`);

  let aiIncluded = 0;
  let aiExcluded = 0;
  for (const filepath of aiFiles) {
    const filename = basename(filepath);
    if (CUSTOMER_AI_POSTS.has(filename)) {
      aiExcluded++;
      continue;
    }
    const post = parsePost(filepath, "ai-posts");
    if (post) {
      allPosts.push(post);
      aiIncluded++;
    }
  }
  console.log(`[ai-posts] Included: ${aiIncluded}, Excluded (customer): ${aiExcluded}`);

  // Deduplicate by slug
  const seen = new Set<string>();
  const uniquePosts: PostData[] = [];
  for (const post of allPosts) {
    if (!seen.has(post.slug)) {
      seen.add(post.slug);
      uniquePosts.push(post);
    } else {
      // Make slug unique by appending number
      let i = 2;
      let newSlug = `${post.slug}-${i}`;
      while (seen.has(newSlug)) {
        i++;
        newSlug = `${post.slug}-${i}`;
      }
      seen.add(newSlug);
      post.slug = newSlug;
      uniquePosts.push(post);
    }
  }

  console.log(`\nTotal posts to seed: ${uniquePosts.length}`);

  let created = 0;
  let errors = 0;

  for (const post of uniquePosts) {
    try {
      const properties: Record<string, unknown> = {
        Title: { title: [{ text: { content: post.title } }] },
        Slug: { rich_text: [{ text: { content: post.slug } }] },
        Published: { checkbox: true },
        Date: { date: { start: post.date } },
        Excerpt: { rich_text: [{ text: { content: post.excerpt } }] },
        Language: { select: { name: post.language } },
      };

      if (post.tags.length > 0) {
        properties.Tags = {
          multi_select: post.tags.map((t) => ({ name: t })),
        };
      }

      await notion.pages.create({
        parent: { database_id: NOTION_BLOG_DB_ID },
        properties: properties as Parameters<typeof notion.pages.create>[0]["properties"],
        ...(post.content
          ? {
              children: [
                {
                  object: "block" as const,
                  type: "paragraph" as const,
                  paragraph: {
                    rich_text: [
                      {
                        type: "text" as const,
                        text: { content: post.content.slice(0, 2000) },
                      },
                    ],
                  },
                },
              ],
            }
          : {}),
      });

      created++;
      if (created % 20 === 0) {
        console.log(`Progress: ${created}/${uniquePosts.length}`);
      }

      // Notion API rate limit
      await new Promise((r) => setTimeout(r, 350));
    } catch (err: unknown) {
      errors++;
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`Error creating "${post.title}": ${msg}`);
    }
  }

  console.log(`\nDone! Created: ${created}, Errors: ${errors}`);

  // Print tag distribution
  const tagCounts: Record<string, number> = {};
  for (const p of uniquePosts) {
    for (const t of p.tags) tagCounts[t] = (tagCounts[t] || 0) + 1;
  }
  console.log("Tag distribution:", tagCounts);

  const langCounts: Record<string, number> = {};
  for (const p of uniquePosts) langCounts[p.language] = (langCounts[p.language] || 0) + 1;
  console.log("Language distribution:", langCounts);
}

seed().catch(console.error);
