import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { getMenuItems, getCategories, getDisplayCategories } from "@/lib/menu";
import { getHighlightsFromDB, computeEffectiveHighlights } from "@/lib/highlights";
import { MenuGrid } from "@/components/menu/menu-grid";
import { MenuPageJsonLd } from "@/components/seo/json-ld";
import { COOKIE_NAME, verifyAdminToken } from "@/lib/auth";
import { getDefaultCategoryForTime, getServingNowCategories, getMalaysiaTimeString } from "@/lib/time-slots";
import { getOperatingStatus } from "@/lib/availability";
import { OperatingHoursAlert } from "@/components/menu/operating-hours-alert";
import { AdminPreviewBanner } from "@/components/menu/admin-preview-banner";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "menu" });
  return {
    title: t("title"),
    description: t("subtitle"),
  };
}

export default async function MenuPage({
  searchParams,
}: {
  searchParams: Promise<{ previewTime?: string }>;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const isAdmin = token ? await verifyAdminToken(token) : false;

  const resolvedParams = await searchParams;
  // previewTime is admin-only; strip it for customers
  const previewTime = isAdmin ? (resolvedParams.previewTime ?? null) : null;

  const [items, categories, displayCats, persistedHighlights] = await Promise.all([
    getMenuItems(),
    getCategories(),
    getDisplayCategories(),
    getHighlightsFromDB(),
  ]);

  const highlightedByCategory = computeEffectiveHighlights(items, persistedHighlights);
  const displayCategoryNames = displayCats
    .filter((dc) => dc.active)
    .map((dc) => dc.name);

  const initialCategory = getDefaultCategoryForTime(previewTime);
  const servingNowCategories = getServingNowCategories(previewTime);
  const operatingStatus = isAdmin ? "open" : getOperatingStatus();
  const currentTime = getMalaysiaTimeString();

  return (
    <>
      <MenuPageJsonLd />
      <OperatingHoursAlert status={operatingStatus} />
      <div className="mx-auto max-w-6xl px-4 py-12 pb-40 md:pb-12">
        {isAdmin && (
          <AdminPreviewBanner currentTime={currentTime} previewTime={previewTime} />
        )}
        <MenuPageHeader />
        <MenuGrid
          items={items}
          categories={categories}
          displayCategories={displayCategoryNames}
          isAdmin={isAdmin}
          highlightedByCategory={highlightedByCategory}
          initialCategory={initialCategory}
          servingNowCategories={servingNowCategories}
          previewTime={previewTime}
        />
      </div>
    </>
  );
}

async function MenuPageHeader() {
  const t = await getTranslations("menu");
  return (
    <div className="mb-8">
      <h1 className="font-display text-3xl font-bold lg:text-4xl">{t("title")}</h1>
      <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
    </div>
  );
}
