import type { MenuItem } from "@/types/menu";

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
