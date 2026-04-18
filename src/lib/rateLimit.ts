const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS = 5;

// In-memory store: IP → array of request timestamps within the current window.
// Note: this store is per-process. On Vercel serverless each cold start gets a
// fresh store, which is acceptable for "simple" rate limiting as described in
// the requirements.
const store = new Map<string, number[]>();

/**
 * Returns true if the request from `ip` is within the allowed rate limit,
 * false if it should be rejected (HTTP 429).
 */
export function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;
  const timestamps = (store.get(ip) ?? []).filter((t) => t > windowStart);
  if (timestamps.length >= MAX_REQUESTS) {
    // Keep the pruned list so subsequent checks stay fast
    store.set(ip, timestamps);
    return false;
  }
  timestamps.push(now);
  store.set(ip, timestamps);
  return true;
}

/**
 * Remove entries that have had no requests within the last window.
 * Call periodically (e.g. from a route handler) to prevent unbounded growth.
 */
export function pruneRateLimitStore(): void {
  const windowStart = Date.now() - WINDOW_MS;
  for (const [ip, timestamps] of store.entries()) {
    if (!timestamps.some((t) => t > windowStart)) {
      store.delete(ip);
    }
  }
}
