import type { Context, Next } from "hono";
import type { AuthContext } from "../auth.js";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

const WINDOW_MS = 60 * 1000; // 1 minute

export async function rateLimitMiddleware(c: Context<{ Variables: AuthContext }>, next: Next) {
  const apiKey = c.get("apiKey");
  if (!apiKey) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const now = Date.now();
  const key = apiKey.id;
  const limit = apiKey.rateLimit;

  let entry = rateLimitStore.get(key);

  if (!entry || now >= entry.resetAt) {
    entry = { count: 0, resetAt: now + WINDOW_MS };
    rateLimitStore.set(key, entry);
  }

  entry.count++;

  c.header("X-RateLimit-Limit", String(limit));
  c.header("X-RateLimit-Remaining", String(Math.max(0, limit - entry.count)));
  c.header("X-RateLimit-Reset", String(Math.ceil(entry.resetAt / 1000)));

  if (entry.count > limit) {
    return c.json(
      {
        error: "Rate limit exceeded",
        retryAfter: Math.ceil((entry.resetAt - now) / 1000),
      },
      429
    );
  }

  await next();
}

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore) {
    if (now >= entry.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}, WINDOW_MS);
