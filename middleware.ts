import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./src/i18n/routing";
import { verifyAdminToken, COOKIE_NAME } from "./src/lib/auth";

const intlMiddleware = createMiddleware(routing);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    const isOpen =
      pathname === "/admin/login" ||
      pathname.startsWith("/api/admin/login") ||
      pathname.startsWith("/api/admin/logout");
    if (!isOpen) {
      const token = request.cookies.get(COOKIE_NAME)?.value;
      const valid = token ? await verifyAdminToken(token) : false;
      if (!valid)
        return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    return NextResponse.next();
  }
  return intlMiddleware(request);
}

export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/api/admin/:path*",
    "/((?!api|_next|_vercel|.*\\..*).*)",
  ],
};
