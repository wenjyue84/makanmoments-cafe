import type { CSSProperties } from "react";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { HERO_BLUR } from "@/data/hero-blur";
import { CAFE } from "@/lib/constants";

interface HeroSectionProps {
  heroTitle?: string;
  heroTagline?: string;
  heroSubtitle?: string;
}

export async function HeroSection({ heroTitle, heroTagline, heroSubtitle }: HeroSectionProps = {}) {
  const t = await getTranslations("home");
  const tc = await getTranslations("common");

  const title = heroTitle || t("heroTitle");
  const tagline = heroTagline || CAFE.tagline.en;
  const subtitle = heroSubtitle || t("heroSubtitle");

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/8 via-background to-accent/15">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-16 lg:py-24">
        <div className="flex flex-col gap-6 lg:grid lg:grid-cols-2 lg:items-center lg:gap-16">

          {/* Mobile hero image — FIRST so food is above the fold on mobile */}
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl shadow-2xl lg:hidden animate-fade-in">
            <Image
              src="/images/hero/hero-mobile.webp"
              alt="RM55.90 Steamed Fish Promo Set — premium Thai-style steamed fish at Makan Moments Cafe"
              fill
              className="object-cover img-scale"
              sizes="100vw"
              priority
              placeholder="blur"
              blurDataURL={HERO_BLUR.heroMobile}
            />
            {/* /delight: Overlay label on mobile image */}
            <div className="absolute bottom-3 left-3 rounded-full bg-background/80 px-3 py-1 text-xs font-medium backdrop-blur-sm">
              RM55.90 Steamed Fish Promo
            </div>
          </div>

          {/* Text — /bolder: much larger h1, Playfair Display, italic tagline */}
          <div>
            {/* /delight: Tagline badge above h1 */}
            <div
              className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-3 py-1 text-xs font-medium text-primary animate-fade-in"
              style={{ "--delay": "0ms" } as CSSProperties}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              {CAFE.neighborhood}
            </div>

            <h1
              className="font-display text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl animate-fade-up"
              style={{ "--delay": "80ms" } as CSSProperties}
            >
              <span className="text-primary">{title}</span>
            </h1>

            {/* /bolder: Italic tagline with Playfair Display */}
            <p
              className="mt-3 font-display text-lg italic text-primary/75 animate-fade-up"
              style={{ "--delay": "160ms" } as CSSProperties}
            >
              {tagline}
            </p>

            <p
              className="mt-5 text-base leading-8 text-muted-foreground sm:text-lg animate-fade-up"
              style={{ "--delay": "240ms" } as CSSProperties}
            >
              {subtitle}
            </p>

            <div
              className="mt-8 flex flex-wrap gap-3 animate-fade-up"
              style={{ "--delay": "320ms" } as CSSProperties}
            >
              <Link href="/menu">
                <Button size="lg" className="min-h-[48px] px-8 text-base font-semibold">
                  {tc("viewMenu")}
                </Button>
              </Link>
              <Link href="/contact">
                <Button
                  variant="outline"
                  size="lg"
                  className="min-h-[48px] border-primary/40 text-base font-medium text-primary hover:bg-primary/8 hover:text-primary transition-colors"
                >
                  {tc("orderNow")}
                </Button>
              </Link>
            </div>

            {/* /delight: Dietary trust badges */}
            <div
              className="mt-6 flex flex-wrap gap-2 animate-fade-in"
              style={{ "--delay": "400ms" } as CSSProperties}
            >
              {CAFE.dietary.map((d) => (
                <span key={d} className="text-xs text-muted-foreground">
                  ✓ {d}
                </span>
              ))}
            </div>
          </div>

          {/* Desktop hero image — /bolder + /delight: hover lift */}
          <div className="relative hidden w-full lg:block lg:pl-8">
            <div
              className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl shadow-xl hover-lift"
              style={{ "--delay": "0ms" } as CSSProperties}
            >
              <Image
                src="/images/hero/hero-mobile.webp"
                alt="RM55.90 Steamed Fish Promo Set — premium Thai-style steamed fish at Makan Moments Cafe"
                fill
                className="object-cover img-scale"
                sizes="(max-width: 1024px) 50vw, 800px"
                priority
                placeholder="blur"
                blurDataURL={HERO_BLUR.heroMobile}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-black/5 to-transparent" />
              <div className="absolute bottom-4 left-4 rounded-full bg-background/90 px-4 py-1.5 text-sm font-semibold text-foreground backdrop-blur-md shadow-sm">
                RM55.90 Steamed Fish Promo Set
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* /delight: Decorative gradient orbs — desktop only */}
      <div className="pointer-events-none absolute -right-20 -top-20 hidden h-80 w-80 rounded-full bg-primary/8 blur-3xl lg:block" />
      <div className="pointer-events-none absolute -bottom-12 -left-12 hidden h-56 w-56 rounded-full bg-accent/25 blur-3xl lg:block" />
    </section>
  );
}
