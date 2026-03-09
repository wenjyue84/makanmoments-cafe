import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import fs from "fs";
import path from "path";
import matter from "gray-matter";

export const runtime = "nodejs";

const ABOUT_FILE = path.join(process.cwd(), "content", "about.md");

export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    title,
    subtitle,
    storyTitle,
    storyContent,
    ambianceTitle,
    valuesTitle,
    valueQuality,
    valueQualityDesc,
    valueCommunity,
    valueCommunityDesc,
    valueHalal,
    valueHalalDesc,
  } = body as {
    title?: string;
    subtitle?: string;
    storyTitle?: string;
    storyContent?: string;
    ambianceTitle?: string;
    valuesTitle?: string;
    valueQuality?: string;
    valueQualityDesc?: string;
    valueCommunity?: string;
    valueCommunityDesc?: string;
    valueHalal?: string;
    valueHalalDesc?: string;
  };

  try {
    const raw = fs.existsSync(ABOUT_FILE)
      ? fs.readFileSync(ABOUT_FILE, "utf-8")
      : "---\n---\n";
    const { data, content: existingContent } = matter(raw);

    if (title !== undefined) data.title = title;
    if (subtitle !== undefined) data.subtitle = subtitle;
    if (storyTitle !== undefined) data.storyTitle = storyTitle;
    if (ambianceTitle !== undefined) data.ambianceTitle = ambianceTitle;
    if (valuesTitle !== undefined) data.valuesTitle = valuesTitle;
    if (valueQuality !== undefined) data.valueQuality = valueQuality;
    if (valueQualityDesc !== undefined) data.valueQualityDesc = valueQualityDesc;
    if (valueCommunity !== undefined) data.valueCommunity = valueCommunity;
    if (valueCommunityDesc !== undefined) data.valueCommunityDesc = valueCommunityDesc;
    if (valueHalal !== undefined) data.valueHalal = valueHalal;
    if (valueHalalDesc !== undefined) data.valueHalalDesc = valueHalalDesc;

    const newContent =
      storyContent !== undefined ? storyContent : existingContent;
    const updated = matter.stringify(newContent, data);
    fs.writeFileSync(ABOUT_FILE, updated, "utf-8");

    revalidatePath("/[locale]/about", "page");

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Failed to update about page content:", err);
    return NextResponse.json(
      { error: "Failed to save content" },
      { status: 500 }
    );
  }
}
