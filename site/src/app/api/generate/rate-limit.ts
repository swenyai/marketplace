/**
 * Best-effort in-memory rate limiter.
 *
 * This is scoped to a single serverless instance — on Vercel's runtime,
 * multiple concurrent invocations can land on different instances and
 * will each maintain their own counter. We treat the limit as a soft
 * ceiling to discourage abuse from a single warm instance, not as a
 * hard security boundary. Swap for Upstash Ratelimit when traffic
 * grows.
 */

export interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export interface RateLimitOptions {
  /** Max requests per window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
  /** Injected clock for testability. */
  now?: () => number;
}

/** Create a rate limiter backed by an in-memory Map. */
export function createRateLimiter(opts: RateLimitOptions) {
  const store = new Map<string, RateLimitEntry>();
  const { limit, windowMs } = opts;
  const now = opts.now ?? Date.now;

  return {
    check(key: string): RateLimitResult {
      const t = now();
      const entry = store.get(key);
      if (!entry || t >= entry.resetAt) {
        const resetAt = t + windowMs;
        store.set(key, { count: 1, resetAt });
        return { allowed: true, remaining: limit - 1, resetAt };
      }
      if (entry.count >= limit) {
        return { allowed: false, remaining: 0, resetAt: entry.resetAt };
      }
      entry.count++;
      return {
        allowed: true,
        remaining: limit - entry.count,
        resetAt: entry.resetAt,
      };
    },
    /** Exposed for testing. */
    _store: store,
  };
}

/**
 * Extract the client IP from request headers. Vercel sets x-forwarded-for
 * to a comma-separated list with the client IP first; we trust only the
 * first entry. Returns "unknown" when no header is present.
 */
export function extractClientIp(headers: Headers): string {
  const xff = headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}
