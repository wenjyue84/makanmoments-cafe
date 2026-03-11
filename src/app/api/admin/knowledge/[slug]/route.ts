import { readFileSync, writeFileSync, statSync } from "fs";
import { join } from "path";
import { invalidateSystemPromptCache } from "@/lib/chat/system-prompt";
import { cookies } from "next/headers";
import { verifyAdminToken, COOKIE_NAME } from "@/lib/auth";
import { type NextRequest } from "next/server";

export const runtime = "nodejs";

const ALLOWED_SLUGS = ["cafe-facts", "faq", "menu-knowledge"];

async function checkAuth(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value ?? "";
  return token ? verifyAdminToken(token) : false;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  if (!ALLOWED_SLUGS.includes(slug)) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const isAdmin = await checkAuth();
  if (!isAdmin) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const filePath = join(process.cwd(), "knowledge", `${slug}.md`);
  try {
    const content = readFileSync(filePath, "utf-8");
    const stat = statSync(filePath);
    return Response.json({ content, lastModified: stat.mtime.toISOString() });
  } catch {
    return Response.json({ error: "File not found" }, { status: 404 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  if (!ALLOWED_SLUGS.includes(slug)) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const isAdmin = await checkAuth();
  if (!isAdmin) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  if (typeof body.content !== "string") {
    return Response.json({ error: "content is required" }, { status: 400 });
  }

  const filePath = join(process.cwd(), "knowledge", `${slug}.md`);
  writeFileSync(filePath, body.content, "utf-8");
  invalidateSystemPromptCache();

  return Response.json({ ok: true });
}
