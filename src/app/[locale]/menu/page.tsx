import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { getMenuItems, getCategories, getDisplayCategories } from "@/lib/menu";
import { getHighlightsFromDB, computeEffectiveHighlights } from "@/lib/highlights";
import { MenuGrid } from "@/components/menu/menu-grid";
import { MenuPageJsonLd } from "@/components/seo/json-ld";
import { COOKIE_NAME, verifyAdminToken } from "@/lib/auth";
import { getDefaultCategoryForTime, getServingNowCategories } from "@/lib/time-slots";

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

export default async function MenuPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const isAdmin = token ? await verifyAdminToken(token) : false;

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

  const initialCategory = getDefaultCategoryForTime();
  const servingNowCategories = getServingNowCategories();

  return (
    <>
      <MenuPageJsonLd />
      <div className="mx-auto max-w-6xl px-4 py-12 pb-40 md:pb-12">
        {isAdmin && <AdminEditBanner />}
        <MenuPageHeader />
        <MenuGrid
          items={items}
          categories={categories}
          displayCategories={displayCategoryNames}
          isAdmin={isAdmin}
          highlightedByCategory={highlightedByCategory}
          initialCategory={initialCategory}
          servingNowCategories={servingNowCategories}
        />
      </div>
    </>
  );
}

function AdminEditBanner() {
  return (
    <div className="mb-6 flex items-center gap-2 rounded-lg border border-amber-400/50 bg-amber-50 px-4 py-2.5 text-sm text-amber-800 dark:border-amber-500/40 dark:bg-amber-950/30 dark:text-amber-300">
      <span className="text-base">✎</span>
      <span>
        <strong>Edit mode</strong> — hover any item to edit its image, description, or price. Changes save instantly to the database.
      </span>
    </div>
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
