import { Suspense } from "react";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { getFeaturedItems } from "@/lib/menu";
import { HeroSection } from "@/components/home/hero-section";
import { Highlights } from "@/components/home/highlights";
import { InfoStrip } from "@/components/home/info-strip";
import { PreorderBanner } from "@/components/home/preorder-banner";
import { HighlightsSkeleton } from "@/components/home/highlights-skeleton";
import { COOKIE_NAME, verifyAdminToken } from "@/lib/auth";
import { HomeInlineEditor, type HomeContent } from "@/components/admin/home-inline-editor";
import { CAFE } from "@/lib/constants";

export const revalidate = 3600;
export const runtime = "nodejs";

const HOME_FILE = path.join(process.cwd(), "content", "home.md");

function readHomeContent(fallback: HomeContent): HomeContent {
  if (!fs.existsSync(HOME_FILE)) return fallback;
  const raw = fs.readFileSync(HOME_FILE, "utf-8");
  const { data } = matter(raw);
  return {
    heroTitle: String(data.heroTitle || fallback.heroTitle),
    heroTagline: String(data.heroTagline || fallback.heroTagline),
    heroSubtitle: String(data.heroSubtitle || fallback.heroSubtitle),
    highlightsTitle: String(data.highlightsTitle || fallback.highlightsTitle),
    highlightsSubtitle: String(data.highlightsSubtitle || fallback.highlightsSubtitle),
  };
}

async function HighlightsLoader({
  highlightsTitle,
  highlightsSubtitle,
}: {
  highlightsTitle: string;
  highlightsSubtitle: string;
}) {
  const featured = await getFeaturedItems();
  return (
    <Highlights
      items={featured}
      highlightsTitle={highlightsTitle}
      highlightsSubtitle={highlightsSubtitle}
    />
  );
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });

  const fallback: HomeContent = {
    heroTitle: t("heroTitle"),
    heroTagline: CAFE.tagline.en,
    heroSubtitle: t("heroSubtitle"),
    highlightsTitle: t("highlightsTitle"),
    highlightsSubtitle: t("highlightsSubtitle"),
  };

  const content = readHomeContent(fallback);

  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const isAdmin = token ? await verifyAdminToken(token) : false;

  if (isAdmin) {
    const featured = await getFeaturedItems();
    return <HomeInlineEditor content={content} featuredItems={featured} />;
  }

  return (
    <>
      <HeroSection
        heroTitle={content.heroTitle}
        heroTagline={content.heroTagline}
        heroSubtitle={content.heroSubtitle}
      />
      <InfoStrip />
      <Suspense fallback={<HighlightsSkeleton />}>
        <HighlightsLoader
          highlightsTitle={content.highlightsTitle}
          highlightsSubtitle={content.highlightsSubtitle}
        />
      </Suspense>
    </>
  );
}
