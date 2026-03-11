/** Format an ISO date string to human-readable date + time (en-MY locale).
 *  e.g. "Mar 11, 2026, 2:30 PM" */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-MY", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/** Compact date + time without year, suited for admin card lists.
 *  e.g. "Mar 11, 2:30 PM" */
export function formatDateTimeCompact(iso: string): string {
  return new Date(iso).toLocaleString("en-MY", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Format an ISO date string to time only (en-MY locale, 12h). */
export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-MY", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
