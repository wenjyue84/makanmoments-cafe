import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  return `RM ${price.toFixed(2)}`;
}

export function getLocalizedName(
  item: { nameEn: string; nameMs: string; nameZh: string },
  locale: string
): string {
  switch (locale) {
    case "zh":
      return item.nameZh || item.nameEn;
    case "ms":
      return item.nameMs || item.nameEn;
    default:
      return item.nameEn;
  }
}
