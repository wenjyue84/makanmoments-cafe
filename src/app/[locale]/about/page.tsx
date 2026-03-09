import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CAFE } from "@/lib/constants";
import { Leaf, Users, ShieldCheck } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });
  return {
    title: t("title"),
    description: t("subtitle"),
  };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });

  const values = [
    {
      icon: Leaf,
      title: t("valueQuality"),
      description: t("valueQualityDesc"),
    },
    {
      icon: Users,
      title: t("valueCommunity"),
      description: t("valueCommunityDesc"),
    },
    {
      icon: ShieldCheck,
      title: t("valueHalal"),
      description: t("valueHalalDesc"),
    },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      {/* Header */}
      <div className="mb-12">
        <h1 className="font-display text-3xl font-bold lg:text-4xl">{t("title")}</h1>
        <p className="mt-2 text-lg text-muted-foreground">{t("subtitle")}</p>
      </div>

      {/* Story — /critique: break the wall of text with a decorative element */}
      <section className="mb-16">
        <div className="mb-1 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Our Story</span>
          <div className="h-px flex-1 bg-border" />
        </div>
        <h2 className="mt-5 mb-4 font-display text-2xl font-bold">{t("storyTitle")}</h2>
        <p className="max-w-2xl leading-8 text-muted-foreground">{t("storyContent")}</p>
      </section>

      {/* Ambiance */}
      <section className="mb-16">
        <h2 className="mb-6 font-display text-2xl font-bold">{t("ambianceTitle")}</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CAFE.ambiance.map((feature) => (
            <div
              key={feature}
              className="rounded-lg border border-border bg-card p-4 text-sm font-medium"
            >
              {feature}
            </div>
          ))}
        </div>
      </section>

      {/* Values */}
      <section>
        <h2 className="mb-6 font-display text-2xl font-bold">{t("valuesTitle")}</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {values.map((value) => (
            <div
              key={value.title}
              className="rounded-xl border border-border bg-card p-5"
            >
              <div className="mb-3 flex items-center gap-3">
                <value.icon className="h-5 w-5 shrink-0 text-primary" />
                <h3 className="font-semibold">{value.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {value.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
