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
    if (!res.ok) return NextResponse.json({ online: false });

    // Also verify the root page allows iframe embedding — if X-Frame-Options
    // is DENY or SAMEORIGIN (cross-origin), the iframe will be blocked by the browser.
    try {
      const rootRes = await fetch("http://localhost:3002/", {
        signal: AbortSignal.timeout(3000),
        redirect: "follow",
      });
      const xfo = rootRes.headers.get("x-frame-options") ?? "";
      const csp = rootRes.headers.get("content-security-policy") ?? "";
      const blocksFraming =
        xfo.toLowerCase() === "deny" ||
        xfo.toLowerCase() === "sameorigin" ||
        /frame-ancestors\s+['"]?none['"]?/.test(csp);
      return NextResponse.json({ online: !blocksFraming });
    } catch {
      // If root fetch fails but /health is ok, still consider it online
      return NextResponse.json({ online: true });
    }
  } catch {
    return NextResponse.json({ online: false });
  }
}
