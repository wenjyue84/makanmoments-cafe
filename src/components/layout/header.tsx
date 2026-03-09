"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { Menu, X, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import type { Locale } from "@/i18n/routing";

const NAV_ITEMS = [
  { key: "home", href: "/" },
  { key: "menu", href: "/menu" },
  { key: "blog", href: "/blog" },
  { key: "about", href: "/about" },
  { key: "contact", href: "/contact" },
] as const;

const LOCALE_LABELS: Record<string, string> = {
  en: "EN",
  ms: "BM",
  zh: "中文",
};

export function Header() {
  const t = useTranslations("common");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  // /harden: Close mobile menu and lang picker on Escape key
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMobileOpen(false);
        setLangOpen(false);
      }
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  function switchLocale(newLocale: string) {
    router.replace(pathname, { locale: newLocale as Locale });
    setLangOpen(false);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-primary">
            {locale === "zh" ? "食光记忆" : "Makan Moments"}
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                pathname === item.href
                  ? "bg-accent text-accent-foreground"
                  : "text-foreground/70 hover:text-foreground"
              )}
            >
              {t(item.key)}
            </Link>
          ))}

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Language Switcher */}
          <div className="relative ml-1">
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <Globe className="h-4 w-4" />
              {LOCALE_LABELS[locale]}
            </button>
            {langOpen && (
              <div className="absolute right-0 top-full mt-1 w-24 rounded-md border border-border bg-popover p-1 shadow-md">
                {Object.entries(LOCALE_LABELS).map(([loc, label]) => (
                  <button
                    key={loc}
                    onClick={() => switchLocale(loc)}
                    className={cn(
                      "block w-full rounded-sm px-3 py-1.5 text-left text-sm transition-colors hover:bg-accent",
                      locale === loc && "bg-accent font-medium"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* Mobile controls */}
        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
          <button
            className="rounded-md p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
        >
          {mobileOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="border-t border-border bg-background px-4 pb-4 md:hidden">
          <nav className="flex flex-col gap-1 pt-2">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent"
                )}
              >
                {t(item.key)}
              </Link>
            ))}
            <div className="mt-2 flex gap-2 border-t border-border pt-2">
              {Object.entries(LOCALE_LABELS).map(([loc, label]) => (
                <button
                  key={loc}
                  onClick={() => {
                    switchLocale(loc);
                    setMobileOpen(false);
                  }}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm transition-colors",
                    locale === loc
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
