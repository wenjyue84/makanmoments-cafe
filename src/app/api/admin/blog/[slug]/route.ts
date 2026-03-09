import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import sql from "@/lib/db";

export const runtime = "nodejs";

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

function isLocalPost(slug: string): boolean {
  return fs.existsSync(path.join(BLOG_DIR, `${slug}.md`));
}

async function updateLocalPost(
  slug: string,
  title: string | undefined,
  content: string | undefined
): Promise<void> {
  const filePath = path.join(BLOG_DIR, `${slug}.md`);
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content: existingContent } = matter(raw);

  if (title !== undefined) {
    data.title = title;
  }

  const newContent = content !== undefined ? content : existingContent;
  const updated = matter.stringify(newContent, data);
  fs.writeFileSync(filePath, updated, "utf-8");
}

async function updateSqlPost(
  slug: string,
  title: string | undefined,
  content: string | undefined
): Promise<boolean> {
  const rows = await sql`
    UPDATE blog_posts SET
      title = COALESCE(${title ?? null}, title),
      content = COALESCE(${content ?? null}, content),
      updated_at = now()
    WHERE slug = ${slug}
    RETURNING id
  `;
  return rows.length > 0;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const body = await request.json();
  const { title, content } = body as { title?: string; content?: string };

  if (!title && !content) {
    return NextResponse.json(
      { error: "At least title or content is required" },
      { status: 400 }
    );
  }

  try {
    if (isLocalPost(slug)) {
      await updateLocalPost(slug, title, content);
    } else {
      const found = await updateSqlPost(slug, title, content);
      if (!found) {
        return NextResponse.json({ error: "Post not found" }, { status: 404 });
      }
    }

    revalidatePath("/[locale]/blog", "page");
    revalidatePath(`/[locale]/blog/${slug}`, "page");

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Failed to update blog post:", err);
    return NextResponse.json(
      { error: "Failed to update post" },
      { status: 500 }
    );
  }
}
