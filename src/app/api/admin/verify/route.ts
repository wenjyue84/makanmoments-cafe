import { cookies } from "next/headers";
import { COOKIE_NAME, verifyAdminToken } from "@/lib/auth";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const valid = token ? await verifyAdminToken(token) : false;
  if (!valid) {
    return Response.json({ ok: false }, { status: 401 });
  }
  return Response.json({ ok: true });
}
