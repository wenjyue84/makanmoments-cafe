import { getTranslations } from "next-intl/server";
import { Clock, MapPin, Leaf, Wifi } from "lucide-react";

export async function InfoStrip() {
  const t = await getTranslations("home");

  const items = [
    { icon: Clock, text: t("infoHours") },
    { icon: MapPin, text: t("infoLocation") },
    { icon: Leaf, text: t("infoDietary") },
    { icon: Wifi, text: t("infoWifi") },
  ];

  return (
    <section className="border-y border-border bg-muted/30">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-4 px-4 py-6 lg:grid-cols-4">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <item.icon className="h-5 w-5 text-primary" />
            </div>
            <span className="text-sm font-medium">{item.text}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
