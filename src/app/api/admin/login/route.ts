import { NextResponse, type NextRequest } from "next/server";
import { signAdminToken, COOKIE_NAME } from "@/lib/auth";

export const runtime = "edge";

export async function POST(request: NextRequest) {
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
