interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// ── Generic factory ──────────────────────────────────────────────────────────

/**
 * Creates a single-window in-memory rate limiter.
 *
 * @example
 * const limiter = createRateLimiter({ windowMs: 60_000, max: 5, name: 'POST /api/orders' });
 * const result = limiter(ip);
 * if (!result.allowed) return 429;
 */
export function createRateLimiter(options: {
  windowMs: number;
  max: number;
  name?: string;
}): (ip: string) => { allowed: boolean; retryAfter?: number } {
  const { windowMs, max, name = "rate-limit" } = options;
  const store = new Map<string, RateLimitEntry>();

  // Prune stale entries every 5 minutes
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now > entry.resetAt) store.delete(key);
    }
  }, 5 * 60 * 1000);

  return function check(ip: string): { allowed: boolean; retryAfter?: number } {
    const now = Date.now();
    const entry = store.get(ip);

    if (entry) {
      if (now > entry.resetAt) {
        store.set(ip, { count: 1, resetAt: now + windowMs });
      } else if (entry.count >= max) {
        const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
        console.warn(`[rate-limit] ${name} exceeded for IP: ${ip}`);
        return { allowed: false, retryAfter };
      } else {
        entry.count++;
      }
    } else {
      store.set(ip, { count: 1, resetAt: now + windowMs });
    }

    return { allowed: true };
  };
}

// ── Backward-compatible export for /api/chat ─────────────────────────────────
// Chat uses a dual-window model (10/min + 100/day) preserved here.

const chatStore = new Map<string, RateLimitEntry>();

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_PER_WINDOW = 10;
const DAILY_WINDOW_MS = 24 * 60 * 60 * 1000;
const MAX_PER_DAY = 100;

// Prune stale chat entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of chatStore) {
    if (now > entry.resetAt) chatStore.delete(key);
  }
}, 5 * 60 * 1000);

export function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();

  // Per-minute check
  const minuteKey = `min:${ip}`;
  const minuteEntry = chatStore.get(minuteKey);

  if (minuteEntry) {
    if (now > minuteEntry.resetAt) {
      chatStore.set(minuteKey, { count: 1, resetAt: now + WINDOW_MS });
    } else if (minuteEntry.count >= MAX_PER_WINDOW) {
      return {
        allowed: false,
        retryAfter: Math.ceil((minuteEntry.resetAt - now) / 1000),
      };
    } else {
      minuteEntry.count++;
    }
  } else {
    chatStore.set(minuteKey, { count: 1, resetAt: now + WINDOW_MS });
  }

  // Per-day check
  const dayKey = `day:${ip}`;
  const dayEntry = chatStore.get(dayKey);

  if (dayEntry) {
    if (now > dayEntry.resetAt) {
      chatStore.set(dayKey, { count: 1, resetAt: now + DAILY_WINDOW_MS });
    } else if (dayEntry.count >= MAX_PER_DAY) {
      return {
        allowed: false,
        retryAfter: Math.ceil((dayEntry.resetAt - now) / 1000),
      };
    } else {
      dayEntry.count++;
    }
  } else {
    chatStore.set(dayKey, { count: 1, resetAt: now + DAILY_WINDOW_MS });
  }

  return { allowed: true };
}
