import { NextResponse, type NextRequest } from "next/server";
import { readdir, writeFile } from "fs/promises";
import { join } from "path";

export const runtime = "nodejs";

const MENU_IMAGES_DIR = join(process.cwd(), "public", "images", "menu");

/** GET /api/admin/images — list all images in public/images/menu/ */
export async function GET() {
  try {
    const files = await readdir(MENU_IMAGES_DIR);
    const images = files
      .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
      .sort((a, b) => a.localeCompare(b));
    return NextResponse.json({ images });
  } catch {
    return NextResponse.json({ images: [] });
  }
}

/** POST /api/admin/images — upload an image for a menu item code */
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const code = formData.get("code") as string | null;

  if (!file || !code) {
    return NextResponse.json(
      { error: "file and code are required" },
      { status: 400 }
    );
  }

  // Validate file type
  if (!file.type.startsWith("image/")) {
    return NextResponse.json(
      { error: "Only image files are allowed" },
      { status: 400 }
    );
  }

  // Limit to 5MB
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json(
      { error: "File must be under 5MB" },
      { status: 400 }
    );
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const filename = `${code}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  await writeFile(join(MENU_IMAGES_DIR, filename), buffer);

  return NextResponse.json({ filename, path: `/images/menu/${filename}` });
}
