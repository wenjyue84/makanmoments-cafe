import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { getMenuItems, getAllMenuItemsWithRulesForAdmin, getDisplayCategories, getCategories } from "@/lib/menu";
import { getHighlightsFromDB, computeEffectiveHighlights } from "@/lib/highlights";
import { MenuGrid } from "@/components/menu/menu-grid";
import { MenuPageJsonLd } from "@/components/seo/json-ld";
import { COOKIE_NAME, verifyAdminToken } from "@/lib/auth";
import { getDefaultCategoryForTime, getServingNowCategories, getMalaysiaTimeString } from "@/lib/time-slots";
import { AdminPreviewBanner } from "@/components/menu/admin-preview-banner";

export const revalidate = 3600;

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

  const [items, displayCats, persistedHighlights, categories] = await Promise.all([
    isAdmin ? getAllMenuItemsWithRulesForAdmin() : getMenuItems(),
    getDisplayCategories(),
    getHighlightsFromDB(),
    getCategories(),
  ]);

  const highlightedByCategory = computeEffectiveHighlights(items, persistedHighlights);
  const activeDisplayCats = displayCats.filter((dc) => dc.active);
  const displayCategoryNames = activeDisplayCats.map((dc) => dc.name);
  // Default to Chef's Pick display category on first load; fall back to time-based default
  const chefsCat = activeDisplayCats.find((dc) => dc.name.toLowerCase().includes("chef"));
  const chefsCatId = chefsCat?.id?.toString() ?? null;
  const initialCategory = chefsCat
    ? `__dc__${chefsCat.name}`
    : getDefaultCategoryForTime(previewTime);
  const servingNowCategories = getServingNowCategories(previewTime);
  const currentTime = getMalaysiaTimeString();

  return (
    <>
      <MenuPageJsonLd />
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
          chefsCatId={chefsCatId}
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
      <p className="mt-2 hidden text-muted-foreground sm:block">{t("subtitle")}</p>
    </div>
  );
}
