import { getTranslations } from "next-intl/server";
import { Clock, MapPin, Leaf, Wifi } from "lucide-react";

export async function InfoStrip() {
  const t = await getTranslations("home");

  const items = [
    { icon: Clock, text: t("infoHours"), detail: "Last order 10:30 PM" },
    { icon: MapPin, text: t("infoLocation"), detail: "Skudai, Johor" },
    { icon: Leaf, text: t("infoDietary"), detail: "Everyone welcome" },
    { icon: Wifi, text: t("infoWifi"), detail: "Password: ilovemakan" },
  ];

  return (
    <section className="border-y border-border bg-muted/40">
      {/* /bolder: Asymmetric layout — scrollable on mobile, 4-col on desktop */}
      <div className="mx-auto max-w-6xl overflow-x-auto px-4 py-5">
        <div className="flex min-w-max gap-8 lg:grid lg:min-w-0 lg:grid-cols-4 lg:gap-6">
          {items.map((item, i) => (
            <div
              key={i}
              className="flex flex-shrink-0 items-center gap-3 lg:flex-shrink"
            >
              {/* /colorize: Icon uses primary with warm bg — slightly more saturated */}
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/12 transition-colors group-hover:bg-primary/20">
                <item.icon className="h-4.5 w-4.5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold leading-tight">{item.text}</p>
                {/* /delight: Secondary detail appears beneath — adds depth */}
                <p className="mt-0.5 text-xs text-muted-foreground">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
