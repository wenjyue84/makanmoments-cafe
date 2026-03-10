import { getSiteSettings, writeSiteSettings } from "@/lib/site-settings";
import type { SiteSettings } from "@/lib/site-settings";
import { createErrorResponse } from "@/lib/api-response";

export const runtime = "nodejs";

export async function GET() {
  return Response.json(getSiteSettings());
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<SiteSettings>;
    const current = getSiteSettings();

    const VALID_LOCALES = ["en", "ms", "zh"];
    if (body.defaultLocale && !VALID_LOCALES.includes(body.defaultLocale)) {
      return createErrorResponse("Invalid defaultLocale", 400);
    }

    const updated: SiteSettings = {
      ...current,
      ...body,
      operatingHours: {
        ...current.operatingHours,
        ...(body.operatingHours ?? {}),
      },
    };

    writeSiteSettings(updated);
    return Response.json({ ok: true, settings: updated });
  } catch (err) {
    console.error("[settings] Failed to save:", err);
    return createErrorResponse("Failed to save settings", 500);
  }
}
