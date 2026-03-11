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

export function getCategoryEmoji(categories: string[]): string {
  const cat = (categories[0] ?? "").toLowerCase();
  if (cat.includes("beverage") || cat.includes("drink") || cat.includes("juice")) return "🧋";
  if (cat.includes("noodle") || cat.includes("fried noodle")) return "🍜";
  if (cat.includes("soup")) return "🍲";
  if (cat.includes("rice") || cat.includes("nanyang")) return "🍚";
  if (cat.includes("toast") || cat.includes("bread")) return "🍞";
  if (cat.includes("snack")) return "🍟";
  if (cat.includes("ice cream") || cat.includes("dessert")) return "🍨";
  if (cat.includes("ayam") || cat.includes("chicken")) return "🍗";
  if (cat.includes("fish") || cat.includes("thai")) return "🐟";
  return "🍽️";
}

export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 8000
): Promise<Response> {
  const controller = new AbortController();
  const timerId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timerId);
  }
}
