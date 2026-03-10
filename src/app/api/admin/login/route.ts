import { NextResponse, type NextRequest } from "next/server";
import { signAdminToken, COOKIE_NAME } from "@/lib/auth";
import { createRateLimiter } from "@/lib/chat/rate-limit";

// Must use nodejs runtime — edge runtime does not support in-memory state
export const runtime = "nodejs";

// 10 attempts per 15 minutes per IP
const loginRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  name: "POST /api/admin/login",
});

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "127.0.0.1";
  const rateCheck = loginRateLimiter(ip);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: "Too many login attempts. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(rateCheck.retryAfter ?? 60) },
      }
    );
  }

  const { username, password } = await request.json();

  const isAdmin =
    username === process.env.ADMIN_USERNAME &&
    password === process.env.ADMIN_PASSWORD;
  const isDemo =
    process.env.ENABLE_DEMO_LOGIN === "true" &&
    username === "admin" &&
    password === "admin123";

  if (!isAdmin && !isDemo) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = await signAdminToken();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 8, // 8 hours
    path: "/",
  });
  return response;
}
