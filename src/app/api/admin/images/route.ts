import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { readdir, writeFile, unlink } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import sql from "@/lib/db";

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
  const imageIndexRaw = formData.get("imageIndex") as string | null;
  const imageIndex = imageIndexRaw ? parseInt(imageIndexRaw, 10) : 1;

  if (!file || !code) {
    return NextResponse.json(
      { error: "file and code are required" },
      { status: 400 }
    );
  }

  if (isNaN(imageIndex) || imageIndex < 1 || imageIndex > 3) {
    return NextResponse.json(
      { error: "imageIndex must be 1, 2, or 3" },
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
  const filename =
    imageIndex === 1 ? `${code}.${ext}` : `${code}-${imageIndex}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  await writeFile(join(MENU_IMAGES_DIR, filename), buffer);

  // Touch updated_at so the image cache-busting version changes on next page render
  await sql`UPDATE menu_items SET updated_at = NOW() WHERE code = ${code}`;

  // Revalidate ISR cache for menu pages across all locales
  revalidatePath("/en/menu");
  revalidatePath("/ms/menu");
  revalidatePath("/zh/menu");

  return NextResponse.json({ filename, path: `/images/menu/${filename}` });
}

/** DELETE /api/admin/images — delete a secondary image ({code}-2 or {code}-3) */
export async function DELETE(request: NextRequest) {
  const body = (await request.json()) as { code?: string; imageIndex?: number };
  const { code, imageIndex } = body;

  if (!code || !imageIndex || imageIndex < 2 || imageIndex > 3) {
    return NextResponse.json(
      { error: "code and imageIndex (2 or 3) are required" },
      { status: 400 }
    );
  }

  // Try common extensions
  for (const ext of ["jpg", "jpeg", "png", "webp"]) {
    const filepath = join(MENU_IMAGES_DIR, `${code}-${imageIndex}.${ext}`);
    if (existsSync(filepath)) {
      await unlink(filepath);
      await sql`UPDATE menu_items SET updated_at = NOW() WHERE code = ${code}`;
      revalidatePath("/en/menu");
      revalidatePath("/ms/menu");
      revalidatePath("/zh/menu");
      return NextResponse.json({ success: true });
    }
  }

  return NextResponse.json({ error: "Image not found" }, { status: 404 });
}
