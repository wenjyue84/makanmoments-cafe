import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Noto_Sans, Noto_Sans_SC } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { CAFE } from "@/lib/constants";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ChatWidget } from "@/components/chat/chat-widget";
import { RestaurantJsonLd } from "@/components/seo/json-ld";
import "../globals.css";
import { TrayProvider } from "@/lib/tray-context";
import { ErrorBoundary } from "@/components/error-boundary";

const notoSans = Noto_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const notoSansSC = Noto_Sans_SC({
  subsets: ["latin"],
  variable: "--font-zh",
  weight: ["400", "500", "700"],
  display: "swap",
  preload: false, // only activated when zh locale is active; avoids loading large CJK font for EN/MS
});

export function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  return params.then(({ locale }) => {
    const name = CAFE.name[locale as keyof typeof CAFE.name] || CAFE.name.en;
    const tagline =
      CAFE.tagline[locale as keyof typeof CAFE.tagline] || CAFE.tagline.en;
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "https://makanmoments.cafe";

    return {
      title: {
        default: `${name} — ${tagline}`,
        template: `%s | ${name}`,
      },
      description: `${name} — Thai-Malaysian fusion cafe in Skudai, Johor. ${tagline}`,
      metadataBase: new URL(siteUrl),
      alternates: {
        canonical: `/${locale}`,
        languages: {
          en: "/en",
          ms: "/ms",
          zh: "/zh",
        },
      },
      openGraph: {
        type: "website",
        locale: locale === "zh" ? "zh_CN" : locale === "ms" ? "ms_MY" : "en_US",
        siteName: name,
        title: `${name} — ${tagline}`,
        description: `Thai-Malaysian fusion cafe in Skudai, Johor. Open daily 11AM-11PM.`,
        images: [{ url: "/images/og-image.jpg", width: 1200, height: 630 }],
      },
      robots: { index: true, follow: true },
    };
  });
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const messages = (await import(`../../../messages/${locale}.json`)).default;

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <RestaurantJsonLd />
      </head>
      <body
        className={`${notoSans.variable} ${locale === "zh" ? notoSansSC.variable : ""} font-sans antialiased`}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          <TrayProvider>
            <div className="flex min-h-screen flex-col">
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
            <ErrorBoundary fallback={null}><ChatWidget /></ErrorBoundary>
          </TrayProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
