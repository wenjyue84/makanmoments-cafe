/**
 * One-time migration: Notion → Neon
 * Run: npx tsx scripts/migrate-notion-to-neon.ts
 *
 * Requires both NOTION_* and DATABASE_URL env vars to be set.
 */

import { Client } from "@notionhq/client";
import { neon } from "@neondatabase/serverless";

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const sql = neon(process.env.DATABASE_URL!);

const MENU_DB_ID = process.env.NOTION_MENU_DB_ID!;
const BLOG_DB_ID = process.env.NOTION_BLOG_DB_ID!;

// ── Notion helpers ──────────────────────────────────────────────────────────

function getTitle(props: Record<string, unknown>, key: string): string {
  const p = props[key] as { title?: Array<{ plain_text: string }> } | undefined;
  return p?.title?.map((t) => t.plain_text).join("") ?? "";
}

function getRichText(props: Record<string, unknown>, key: string): string {
  const p = props[key] as { rich_text?: Array<{ plain_text: string }> } | undefined;
  return p?.rich_text?.map((t) => t.plain_text).join("") ?? "";
}

function getNumber(props: Record<string, unknown>, key: string): number {
  const p = props[key] as { number?: number } | undefined;
  return p?.number ?? 0;
}

function getCheckbox(props: Record<string, unknown>, key: string): boolean {
  const p = props[key] as { checkbox?: boolean } | undefined;
  return p?.checkbox ?? false;
}

function getSelect(props: Record<string, unknown>, key: string): string {
  const p = props[key] as { select?: { name: string } } | undefined;
  return p?.select?.name ?? "";
}

function getMultiSelect(props: Record<string, unknown>, key: string): string[] {
  const p = props[key] as { multi_select?: Array<{ name: string }> } | undefined;
  return p?.multi_select?.map((x) => x.name) ?? [];
}

function getDate(props: Record<string, unknown>, key: string): string {
  const p = props[key] as { date?: { start: string } } | undefined;
  return p?.date?.start ?? "";
}

// ── Block → Markdown ────────────────────────────────────────────────────────

interface NotionBlock {
  type: string;
  content: string;
  imageUrl?: string;
}

function blocksToMarkdown(blocks: NotionBlock[]): string {
  return blocks
    .map((b) => {
      switch (b.type) {
        case "heading_1": return `# ${b.content}`;
        case "heading_2": return `## ${b.content}`;
        case "heading_3": return `### ${b.content}`;
        case "paragraph": return b.content;
        case "bulleted_list_item": return `- ${b.content}`;
        case "numbered_list_item": return `1. ${b.content}`;
        case "quote": return `> ${b.content}`;
        case "code": return `\`\`\`\n${b.content}\n\`\`\``;
        case "divider": return "---";
        case "image": return b.imageUrl ? `![image](${b.imageUrl})` : "";
        default: return b.content;
      }
    })
    .join("\n\n");
}

async function fetchPageBlocks(pageId: string): Promise<NotionBlock[]> {
  const blocks: NotionBlock[] = [];
  let cursor: string | undefined;

  do {
    const response = await notion.blocks.children.list({
      block_id: pageId,
      start_cursor: cursor,
      page_size: 100,
    });

    for (const block of response.results) {
      if (!("type" in block)) continue;
      const b = block as Record<string, unknown>;
      const type = b.type as string;
      const data = b[type] as Record<string, unknown> | undefined;

      if (type === "image") {
        const imgData = data as { type?: string; external?: { url: string }; file?: { url: string } } | undefined;
        const imageUrl =
          imgData?.type === "external" ? (imgData.external?.url ?? "") :
          imgData?.type === "file" ? (imgData.file?.url ?? "") : "";
        blocks.push({ type: "image", content: "", imageUrl });
        continue;
      }

      const richText = data?.rich_text as Array<{ plain_text: string }> | undefined;
      blocks.push({ type, content: richText?.map((t) => t.plain_text).join("") ?? "" });
    }

    cursor = response.has_more ? response.next_cursor ?? undefined : undefined;
  } while (cursor);

  return blocks;
}

// ── Menu Migration ──────────────────────────────────────────────────────────

async function migrateMenu(): Promise<number> {
  let count = 0;
  let cursor: string | undefined;

  do {
    const response = await notion.databases.query({
      database_id: MENU_DB_ID,
      start_cursor: cursor,
      page_size: 100,
    });

    for (const page of response.results) {
      if (!("properties" in page)) continue;
      const props = page.properties as Record<string, Record<string, unknown>>;

      const code = getRichText(props, "Code");
      const nameEn = getTitle(props, "Name (EN)");
      const nameMs = getRichText(props, "Name (MS)");
      const nameZh = getRichText(props, "Name (ZH)");
      const price = getNumber(props, "Price");
      const description = getRichText(props, "Description");
      const dietary = getMultiSelect(props, "Dietary");
      const category = getSelect(props, "Category");
      const available = getCheckbox(props, "Available");
      const featured = getCheckbox(props, "Featured");
      const sortOrder = getNumber(props, "Sort Order");

      await sql`
        INSERT INTO menu_items
          (code, name_en, name_ms, name_zh, price, description, dietary, categories,
           available, featured, sort_order)
        VALUES
          (${code}, ${nameEn}, ${nameMs}, ${nameZh}, ${price}, ${description},
           ${dietary}, ${category ? [category] : []}, ${available}, ${featured}, ${sortOrder})
        ON CONFLICT (code) DO NOTHING
      `;
      count++;
    }

    cursor = response.has_more ? response.next_cursor ?? undefined : undefined;
  } while (cursor);

  return count;
}

// ── Blog Migration ──────────────────────────────────────────────────────────

async function migrateBlog(): Promise<number> {
  let count = 0;

  const response = await notion.databases.query({
    database_id: BLOG_DB_ID,
    page_size: 100,
  });

  for (const page of response.results) {
    if (!("properties" in page)) continue;
    const props = page.properties as Record<string, Record<string, unknown>>;

    const slug = getRichText(props, "Slug");
    const title = getTitle(props, "Title");
    const excerpt = getRichText(props, "Excerpt");
    const tags = getMultiSelect(props, "Tags");
    const language = getSelect(props, "Language") || "en";
    const published = getCheckbox(props, "Published");
    const publishedAt = getDate(props, "Date") || null;

    // Fetch blocks and convert to Markdown
    const notionBlocks = await fetchPageBlocks(page.id);
    const content = blocksToMarkdown(notionBlocks);

    // Cover image
    const p = page as { cover?: { type: string; external?: { url: string }; file?: { url: string } } | null };
    const coverImage =
      p.cover?.type === "external" ? (p.cover.external?.url ?? "") :
      p.cover?.type === "file" ? (p.cover.file?.url ?? "") : "";

    if (!slug) {
      console.warn(`Skipping blog post "${title}" — no slug`);
      continue;
    }

    await sql`
      INSERT INTO blog_posts
        (slug, title, excerpt, content, cover_image, tags, language, published, published_at)
      VALUES
        (${slug}, ${title}, ${excerpt}, ${content}, ${coverImage}, ${tags},
         ${language}, ${published}, ${publishedAt})
      ON CONFLICT (slug) DO NOTHING
    `;
    count++;
  }

  return count;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("Starting Notion → Neon migration…\n");

  if (!process.env.NOTION_API_KEY || !MENU_DB_ID || !BLOG_DB_ID) {
    console.error("Missing NOTION_API_KEY, NOTION_MENU_DB_ID, or NOTION_BLOG_DB_ID");
    process.exit(1);
  }
  if (!process.env.DATABASE_URL) {
    console.error("Missing DATABASE_URL");
    process.exit(1);
  }

  console.log("Migrating menu items…");
  const menuCount = await migrateMenu();
  console.log(`  ✓ ${menuCount} menu items migrated`);

  console.log("Migrating blog posts…");
  const blogCount = await migrateBlog();
  console.log(`  ✓ ${blogCount} blog posts migrated`);

  console.log("\nMigration complete!");
  console.log(`Total: ${menuCount} menu items, ${blogCount} blog posts`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
