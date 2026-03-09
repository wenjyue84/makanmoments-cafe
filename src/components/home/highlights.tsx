import type { CSSProperties } from "react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { MenuItem } from "@/types/menu";
import { MenuCard } from "@/components/menu/menu-card";

interface HighlightsProps {
  items: MenuItem[];
}

export async function Highlights({ items }: HighlightsProps) {
  const t = await getTranslations("home");
  const tc = await getTranslations("common");

  if (items.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <div className="mb-8">
        <h2 className="font-display text-3xl font-bold">{t("highlightsTitle")}</h2>
        <p className="mt-2 text-muted-foreground">{t("highlightsSubtitle")}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.slice(0, 6).map((item, index) => (
          <div
            key={item.id}
            className="animate-fade-up"
            style={{ "--delay": `${index * 60}ms` } as CSSProperties}
          >
            <MenuCard item={item} priority={index < 3} />
          </div>
        ))}
      </div>
      <div className="mt-10 text-center">
        <Link
          href="/menu"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {tc("viewMenu")}
        </Link>
      </div>
    </section>
  );
}
