import { getTranslations } from "next-intl/server";
import { Facebook, Instagram, Phone, MapPin, Clock } from "lucide-react";
import Image from "next/image";
import { CAFE } from "@/lib/constants";

export async function Footer() {
  const t = await getTranslations("common");

  return (
    <footer className="border-t border-border bg-muted/50">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4 lg:gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2">
              <Image
                src="/images/logo.png"
                alt="Makan Moments Cafe logo"
                width={80}
                height={80}
                className="h-20 w-20 object-contain"
              />
            </div>
            <h3 className="mt-2 text-lg font-bold text-primary">
              {t("cafeName")}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("tagline")}
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              {CAFE.dietary.join(" · ")}
            </p>
          </div>

          {/* Hours & Location */}
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <Clock className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div className="text-sm">
                <p className="font-medium">Daily {CAFE.hours.daily}</p>
                <p className="text-muted-foreground">
                  Last order {CAFE.hours.lastOrder}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{CAFE.address}</p>
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <a
                href={`tel:${CAFE.phone.replace(/[- ]/g, "")}`}
                className="text-sm hover:text-primary"
              >
                {CAFE.phone}
              </a>
            </div>
          </div>

          {/* Social — /delight: each platform has its own hover colour */}
          <div>
            <p className="mb-3 text-sm font-medium">Follow Us</p>
            <div className="flex gap-2">
              <a
                href={CAFE.social.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg p-2 text-muted-foreground transition-all hover:bg-[#1877f2]/10 hover:text-[#1877f2]"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href={CAFE.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg p-2 text-muted-foreground transition-all hover:bg-[#e4405f]/10 hover:text-[#e4405f]"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href={CAFE.social.tiktok}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg p-2 text-muted-foreground transition-all hover:bg-foreground/8 hover:text-foreground"
                aria-label="TikTok"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <title>TikTok</title>
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1 0-5.78 2.92 2.92 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 3 15.57 6.33 6.33 0 0 0 9.37 22a6.33 6.33 0 0 0 6.33-6.33V9.14a8.16 8.16 0 0 0 3.89.98V6.69Z" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} Makan Moments Cafe (Kafe Kenangan
            Makan). All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
