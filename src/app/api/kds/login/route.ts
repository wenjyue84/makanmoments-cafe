import { NextResponse, type NextRequest } from "next/server";
import { signKdsToken, KDS_COOKIE_NAME } from "@/lib/auth";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  const { username, password } = await request.json();

  const expectedUsername =
    process.env.KITCHEN_USERNAME ?? "kitchen";
  const expectedPassword =
    process.env.KITCHEN_PASSWORD ?? "kitchen123";

  if (username !== expectedUsername || password !== expectedPassword) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = await signKdsToken();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(KDS_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 12, // 12 hours
    path: "/",
  });
  return response;
}
