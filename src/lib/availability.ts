import fs from "fs";
import path from "path";
import type { MenuItem } from "@/types/menu";

// ── Operating Hours ──────────────────────────────────────────────────────────

export interface OperatingHoursConfig {
  openHour: number;
  openMinute: number;
  lastOrderHour: number;
  lastOrderMinute: number;
  closeHour: number;
  closeMinute: number;
}

export type OperatingStatus = "open" | "after_last_order" | "closed";

const DEFAULT_HOURS: OperatingHoursConfig = {
  openHour: 11, openMinute: 0, lastOrderHour: 22, lastOrderMinute: 30, closeHour: 23, closeMinute: 0,
};

export function readOperatingHours(): OperatingHoursConfig {
  try {
    const filePath = path.join(process.cwd(), "data", "operating-hours.json");
    const raw = fs.readFileSync(filePath, "utf-8");
    return { ...DEFAULT_HOURS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_HOURS;
  }
}

export function writeOperatingHours(data: OperatingHoursConfig): void {
  const filePath = path.join(process.cwd(), "data", "operating-hours.json");
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

export function getOperatingStatus(): OperatingStatus {
  const cfg = readOperatingHours();

  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kuala_Lumpur",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = Object.fromEntries(fmt.formatToParts(new Date()).map((x) => [x.type, x.value]));
  const nowMins = parseInt(parts.hour) * 60 + parseInt(parts.minute);

  const openMins = cfg.openHour * 60 + cfg.openMinute;
  const lastOrderMins = cfg.lastOrderHour * 60 + cfg.lastOrderMinute;
  const closeMins = cfg.closeHour * 60 + cfg.closeMinute;

  if (nowMins < openMins || nowMins >= closeMins) return "closed";
  if (nowMins >= lastOrderMins) return "after_last_order";
  return "open";
}

export function isItemAvailableNow(item: MenuItem): boolean {
  if (!item.available) return false;
  const { availableDays, timeFrom, timeUntil, specialDates } = item;
  if (!availableDays.length && !timeFrom && !timeUntil && !specialDates.length) return true;

  const now = new Date();
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kuala_Lumpur",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    weekday: "short",
  });
  const p = Object.fromEntries(fmt.formatToParts(now).map((x) => [x.type, x.value]));
  const date = `${p.year}-${p.month}-${p.day}`;
  const day = p.weekday; // "Mon", "Tue", …
  const mins = parseInt(p.hour) * 60 + parseInt(p.minute);

  if (specialDates.length) return specialDates.includes(date);
  if (availableDays.length && !availableDays.includes(day)) return false;
  if (timeFrom && timeUntil) {
    const [fh, fm] = timeFrom.split(":").map(Number);
    const [uh, um] = timeUntil.split(":").map(Number);
    if (mins < fh * 60 + fm || mins >= uh * 60 + um) return false;
  }
  return true;
}

export function filterByAvailability(items: MenuItem[]): MenuItem[] {
  return items.filter(isItemAvailableNow);
}

/**
 * Checks if an item would be available at the given hour/minute (preview only).
 * Only checks time-based rules (timeFrom/timeUntil); ignores day/date constraints.
 */
export function isItemAvailableAtPreviewTime(item: MenuItem, hour: number, minute: number): boolean {
  if (!item.available) return false;
  const { timeFrom, timeUntil } = item;
  if (!timeFrom || !timeUntil) return true;
  const [fh, fm] = timeFrom.split(":").map(Number);
  const [uh, um] = timeUntil.split(":").map(Number);
  const mins = hour * 60 + minute;
  return mins >= fh * 60 + fm && mins < uh * 60 + um;
}
