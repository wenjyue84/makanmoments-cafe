import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const SLOTS_PATH = join(process.cwd(), "data", "time-slots.json");

export interface TimeSlot {
  id: string;
  label: string;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  defaultCategory: string;
}

export interface TimeSlotsConfig {
  slots: TimeSlot[];
}

export const DEFAULT_TIME_SLOTS: TimeSlotsConfig = {
  slots: [
    {
      id: "breakfast",
      label: "Breakfast",
      startHour: 7,
      startMinute: 0,
      endHour: 11,
      endMinute: 0,
      defaultCategory: "Chef's Picks",
    },
    {
      id: "lunch",
      label: "Lunch",
      startHour: 11,
      startMinute: 0,
      endHour: 15,
      endMinute: 0,
      defaultCategory: "Chef's Picks",
    },
    {
      id: "dinner",
      label: "Dinner",
      startHour: 15,
      startMinute: 0,
      endHour: 22,
      endMinute: 30,
      defaultCategory: "Chef's Picks",
    },
  ],
};

export function readTimeSlots(): TimeSlotsConfig {
  try {
    if (!existsSync(SLOTS_PATH)) return { ...DEFAULT_TIME_SLOTS };
    const raw = readFileSync(SLOTS_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.slots)) return parsed as TimeSlotsConfig;
    return { ...DEFAULT_TIME_SLOTS };
  } catch {
    return { ...DEFAULT_TIME_SLOTS };
  }
}

export function writeTimeSlots(config: TimeSlotsConfig): void {
  const dir = join(process.cwd(), "data");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(SLOTS_PATH, JSON.stringify(config, null, 2), "utf-8");
}

function toMinutes(hour: number, minute: number): number {
  return hour * 60 + minute;
}

/** Returns current Malaysia time hour and minute using server timezone API */
function getMalaysiaTime(): { hour: number; minute: number } {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kuala_Lumpur",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(now);
  const hour = parseInt(parts.find((p) => p.type === "hour")?.value ?? "0", 10);
  const minute = parseInt(parts.find((p) => p.type === "minute")?.value ?? "0", 10);
  return { hour, minute };
}

/** Returns the current Malaysia time formatted for display, e.g. "11:45 AM". */
export function getMalaysiaTimeString(): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kuala_Lumpur",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date());
}

/** Returns the active slot for a given hour/minute, or null if outside all slots. */
function getActiveSlotForTime(hour: number, minute: number): TimeSlot | null {
  const config = readTimeSlots();
  const now = toMinutes(hour, minute);
  for (const slot of config.slots) {
    const start = toMinutes(slot.startHour, slot.startMinute);
    const end = toMinutes(slot.endHour, slot.endMinute);
    if (now >= start && now < end) return slot;
  }
  return null;
}

/** Returns the active time slot for the current Malaysia time, or null if outside all slots. */
export function getActiveSlot(): TimeSlot | null {
  const { hour, minute } = getMalaysiaTime();
  return getActiveSlotForTime(hour, minute);
}

/**
 * Returns the default category for the given time (HH:MM), or current Malaysia time if omitted.
 * @param overrideTime - Optional "HH:MM" string, e.g. "08:00" for admin preview.
 */
export function getDefaultCategoryForTime(overrideTime?: string | null): string | null {
  if (overrideTime) {
    const [h, m] = overrideTime.split(":").map(Number);
    if (!isNaN(h) && !isNaN(m)) {
      return getActiveSlotForTime(h, m)?.defaultCategory ?? null;
    }
  }
  return getActiveSlot()?.defaultCategory ?? null;
}

/**
 * Returns the set of "serving now" default categories (Display Category names).
 * Falls back to Chef's Picks when outside all time windows.
 * @param overrideTime - Optional "HH:MM" string for admin preview.
 */
export function getServingNowCategories(overrideTime?: string | null): string[] {
  if (overrideTime) {
    const [h, m] = overrideTime.split(":").map(Number);
    if (!isNaN(h) && !isNaN(m)) {
      const slot = getActiveSlotForTime(h, m);
      return slot ? [slot.defaultCategory] : ["Chef's Picks"];
    }
  }
  const slot = getActiveSlot();
  return slot ? [slot.defaultCategory] : ["Chef's Picks"];
}
