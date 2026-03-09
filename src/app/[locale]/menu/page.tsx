import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getMenuItems, getCategories } from "@/lib/menu";
import { MenuGrid } from "@/components/menu/menu-grid";
import { MenuPageJsonLd } from "@/components/seo/json-ld";

export const revalidate = 1800;

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
  const [items, categories] = await Promise.all([
    getMenuItems(),
    getCategories(),
  ]);

  return (
    <>
      <MenuPageJsonLd />
      <div className="mx-auto max-w-6xl px-4 py-12">
        <MenuPageHeader />
        <MenuGrid items={items} categories={categories} />
      </div>
    </>
  );
}

async function MenuPageHeader() {
  const t = await getTranslations("menu");
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold">{t("title")}</h1>
      <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
    </div>
  );
}
