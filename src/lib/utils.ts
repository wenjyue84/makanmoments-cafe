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
