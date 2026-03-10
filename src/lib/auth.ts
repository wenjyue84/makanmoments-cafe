import { SignJWT, jwtVerify } from "jose";

export const COOKIE_NAME = "admin_session";
export const KDS_COOKIE_NAME = "kds_session";

// Lazy — computed at call time, not module load, so missing env var doesn't
// crash middleware import in the Edge runtime.
function getSecret(): Uint8Array {
  const raw = process.env.ADMIN_JWT_SECRET;
  if (!raw) throw new Error("ADMIN_JWT_SECRET is not set in .env.local");
  return new TextEncoder().encode(raw);
}

export async function signAdminToken(): Promise<string> {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(getSecret());
}

export async function verifyAdminToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, getSecret());
    return true;
  } catch {
    return false;
  }
}

export async function signKdsToken(): Promise<string> {
  return new SignJWT({ role: "kds" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(getSecret());
}

export async function verifyKdsToken(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload.role === "kds";
  } catch {
    return false;
  }
}
