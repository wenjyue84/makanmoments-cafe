import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { HERO_BLUR } from "@/data/hero-blur";

export async function HeroSection() {
  const t = await getTranslations("home");
  const tc = await getTranslations("common");

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/10">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:py-24">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Text */}
          <div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              <span className="text-primary">{t("heroTitle")}</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              {t("heroSubtitle")}
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/menu">
                <Button size="lg" className="min-h-[44px] text-base">
                  {tc("viewMenu")}
                </Button>
              </Link>
              <Link href="/contact" className="hidden sm:inline-flex">
                <Button variant="outline" size="lg" className="min-h-[44px] text-base animate-glow-pulse border-primary/50 text-primary hover:bg-primary/10 transition-colors">
                  {tc("orderNow")}
                </Button>
              </Link>
            </div>
          </div>

          {/* Mobile hero image — visible only below lg breakpoint */}
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl shadow-xl lg:hidden">
            <Image
              src="/images/hero/featured-dish.jpg"
              alt="Seafood Tom Yum"
              fill
              className="object-cover"
              sizes="100vw"
              priority
              placeholder="blur"
              blurDataURL={HERO_BLUR.featuredDish}
            />
          </div>

          {/* Desktop photo grid — hidden on mobile */}
          <div className="relative hidden w-full lg:block lg:pl-12">
            <div className="grid grid-cols-2 gap-6">
              <div className="flex flex-col gap-6 pt-12">
                <div className="relative h-[240px] w-full overflow-hidden rounded-2xl shadow-xl transition-all hover:scale-[1.02] hover:shadow-2xl animate-bob">
                  <Image
                    src="/images/hero/featured-dish.jpg"
                    alt="Seafood Tom Yum"
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 300px"
                    priority
                    placeholder="blur"
                    blurDataURL={HERO_BLUR.featuredDish}
                  />
                </div>
                <div className="relative h-[180px] w-full overflow-hidden rounded-2xl shadow-xl transition-all hover:scale-[1.02] hover:shadow-2xl animate-bob-delayed">
                  <Image
                    src="/images/hero/pineapple-fried-rice.jpg"
                    alt="Pineapple Fried Rice"
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 300px"
                    priority
                    placeholder="blur"
                    blurDataURL={HERO_BLUR.pineappleFriedRice}
                  />
                </div>
              </div>
              <div className="flex flex-col pb-12">
                <div className="relative h-[444px] w-full overflow-hidden rounded-2xl shadow-xl transition-all hover:scale-[1.02] hover:shadow-2xl">
                  <Image
                    src="/images/hero/exterior.jpg"
                    alt="Makan Moments Cafe"
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
                    priority
                    placeholder="blur"
                    blurDataURL={HERO_BLUR.exterior}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Decorative gradient orbs — desktop only to reduce mobile paint cost */}
      <div className="pointer-events-none absolute -right-20 -top-20 hidden h-72 w-72 rounded-full bg-primary/10 blur-3xl lg:block" />
      <div className="pointer-events-none absolute -bottom-10 -left-10 hidden h-48 w-48 rounded-full bg-accent/20 blur-3xl lg:block" />
    </section>
  );
}
