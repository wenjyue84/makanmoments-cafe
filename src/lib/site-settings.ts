import fs from "fs";
import path from "path";

export interface SiteSettings {
  defaultLocale: string;
  cafeName: string;
  currency: string;
  operatingHours: {
    open: string;
    lastOrder: string;
    close: string;
  };
  preOrderEnabled: boolean;
  depositRequired: boolean;
  paymentMethods: string[];
}

const DEFAULT_SETTINGS: SiteSettings = {
  defaultLocale: "en",
  cafeName: "Makan Moments",
  currency: "RM",
  operatingHours: {
    open: "11:00",
    lastOrder: "22:30",
    close: "23:00",
  },
  preOrderEnabled: true,
  depositRequired: false,
  paymentMethods: ["Touch & Go", "Cash on Arrival"],
};

const SETTINGS_PATH = path.join(process.cwd(), "data", "site-settings.json");

export function getSiteSettings(): SiteSettings {
  try {
    const raw = fs.readFileSync(SETTINGS_PATH, "utf-8");
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function writeSiteSettings(data: SiteSettings): void {
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(data, null, 2));
}
