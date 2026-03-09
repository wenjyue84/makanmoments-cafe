interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_PER_WINDOW = 10;
const DAILY_WINDOW_MS = 24 * 60 * 60 * 1000;
const MAX_PER_DAY = 100;

// Clean up stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

export function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();

  // Per-minute check
  const minuteKey = `min:${ip}`;
  const minuteEntry = store.get(minuteKey);

  if (minuteEntry) {
    if (now > minuteEntry.resetAt) {
      store.set(minuteKey, { count: 1, resetAt: now + WINDOW_MS });
    } else if (minuteEntry.count >= MAX_PER_WINDOW) {
      return {
        allowed: false,
        retryAfter: Math.ceil((minuteEntry.resetAt - now) / 1000),
      };
    } else {
      minuteEntry.count++;
    }
  } else {
    store.set(minuteKey, { count: 1, resetAt: now + WINDOW_MS });
  }

  // Per-day check
  const dayKey = `day:${ip}`;
  const dayEntry = store.get(dayKey);

  if (dayEntry) {
    if (now > dayEntry.resetAt) {
      store.set(dayKey, { count: 1, resetAt: now + DAILY_WINDOW_MS });
    } else if (dayEntry.count >= MAX_PER_DAY) {
      return {
        allowed: false,
        retryAfter: Math.ceil((dayEntry.resetAt - now) / 1000),
      };
    } else {
      dayEntry.count++;
    }
  } else {
    store.set(dayKey, { count: 1, resetAt: now + DAILY_WINDOW_MS });
  }

  return { allowed: true };
}
