import { NextResponse } from "next/server";
import { verifyAdminToken, COOKIE_NAME } from "@/lib/auth";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const valid = token ? await verifyAdminToken(token) : false;
  if (!valid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const res = await fetch("http://localhost:3002/health", {
      signal: AbortSignal.timeout(3000),
    });
    return NextResponse.json({ online: res.ok });
  } catch {
    return NextResponse.json({ online: false });
  }
}
