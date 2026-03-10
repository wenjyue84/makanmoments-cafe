import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import fs from "fs";
import path from "path";
import matter from "gray-matter";

export const runtime = "nodejs";

const HOME_FILE = path.join(process.cwd(), "content", "home.md");

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { heroTitle, heroTagline, heroSubtitle, highlightsTitle, highlightsSubtitle } = body as {
    heroTitle?: string;
    heroTagline?: string;
    heroSubtitle?: string;
    highlightsTitle?: string;
    highlightsSubtitle?: string;
  };

  try {
    const raw = fs.existsSync(HOME_FILE) ? fs.readFileSync(HOME_FILE, "utf-8") : "---\n---\n";
    const { data, content: existingContent } = matter(raw);

    if (heroTitle !== undefined) data.heroTitle = heroTitle;
    if (heroTagline !== undefined) data.heroTagline = heroTagline;
    if (heroSubtitle !== undefined) data.heroSubtitle = heroSubtitle;
    if (highlightsTitle !== undefined) data.highlightsTitle = highlightsTitle;
    if (highlightsSubtitle !== undefined) data.highlightsSubtitle = highlightsSubtitle;

    const updated = matter.stringify(existingContent, data);
    fs.writeFileSync(HOME_FILE, updated, "utf-8");

    revalidatePath("/[locale]", "page");

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Failed to update home page content:", err);
    return NextResponse.json({ error: "Failed to save content" }, { status: 500 });
  }
}
