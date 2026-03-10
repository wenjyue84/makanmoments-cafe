import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import fs from "fs";
import path from "path";
import matter from "gray-matter";

export const runtime = "nodejs";

const CONTACT_FILE = path.join(process.cwd(), "content", "contact.md");

export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    title,
    subtitle,
    address,
    neighborhood,
    phone,
    hoursDaily,
    hoursLastOrder,
    googleMapsEmbed,
  } = body as {
    title?: string;
    subtitle?: string;
    address?: string;
    neighborhood?: string;
    phone?: string;
    hoursDaily?: string;
    hoursLastOrder?: string;
    googleMapsEmbed?: string;
  };

  try {
    const raw = fs.existsSync(CONTACT_FILE)
      ? fs.readFileSync(CONTACT_FILE, "utf-8")
      : "---\n---\n";
    const { data, content: existingContent } = matter(raw);

    if (title !== undefined) data.title = title;
    if (subtitle !== undefined) data.subtitle = subtitle;
    if (address !== undefined) data.address = address;
    if (neighborhood !== undefined) data.neighborhood = neighborhood;
    if (phone !== undefined) data.phone = phone;
    if (hoursDaily !== undefined) data.hoursDaily = hoursDaily;
    if (hoursLastOrder !== undefined) data.hoursLastOrder = hoursLastOrder;
    if (googleMapsEmbed !== undefined) data.googleMapsEmbed = googleMapsEmbed;

    const updated = matter.stringify(existingContent, data);
    fs.writeFileSync(CONTACT_FILE, updated, "utf-8");

    revalidatePath("/[locale]/contact", "page");

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Failed to update contact page content:", err);
    return NextResponse.json(
      { error: "Failed to save content" },
      { status: 500 }
    );
  }
}
