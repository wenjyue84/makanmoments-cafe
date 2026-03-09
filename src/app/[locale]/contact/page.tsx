import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CAFE } from "@/lib/constants";
import { MapPin, Clock, Phone, Wifi, Facebook, Instagram } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact" });
  return {
    title: t("title"),
    description: t("subtitle"),
  };
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact" });

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-12">
        <h1 className="text-3xl font-bold lg:text-4xl">{t("title")}</h1>
        <p className="mt-2 text-lg text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Info cards */}
        <div className="space-y-6">
          {/* Address */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="mb-3 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">{t("addressTitle")}</h2>
            </div>
            <p className="text-sm text-muted-foreground">{CAFE.address}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {CAFE.neighborhood}
            </p>
          </div>

          {/* Hours */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="mb-3 flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">{t("hoursTitle")}</h2>
            </div>
            <p className="text-sm">Daily: {CAFE.hours.daily}</p>
            <p className="text-sm text-muted-foreground">
              Last order: {CAFE.hours.lastOrder}
            </p>
          </div>

          {/* Phone */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="mb-3 flex items-center gap-2">
              <Phone className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">{t("phoneTitle")}</h2>
            </div>
            <a
              href={`tel:${CAFE.phone.replace(/[- ]/g, "")}`}
              className="text-sm text-primary hover:underline"
            >
              {CAFE.phone}
            </a>
          </div>

          {/* WiFi */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="mb-3 flex items-center gap-2">
              <Wifi className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">{t("wifiTitle")}</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              {t("wifiPassword")}
            </p>
          </div>

          {/* Social */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-3 font-semibold">{t("socialTitle")}</h2>
            <div className="flex gap-3">
              <a
                href={CAFE.social.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm hover:bg-secondary/80"
              >
                <Facebook className="h-4 w-4" /> Facebook
              </a>
              <a
                href={CAFE.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm hover:bg-secondary/80"
              >
                <Instagram className="h-4 w-4" /> Instagram
              </a>
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="overflow-hidden rounded-xl border border-border">
          <iframe
            src={CAFE.googleMapsEmbed}
            width="100%"
            height="100%"
            style={{ minHeight: "400px", border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Makan Moments Cafe location"
          />
        </div>
      </div>
    </div>
  );
}
