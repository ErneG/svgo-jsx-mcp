import type { Context, Next } from "hono";
import { prisma } from "./db.js";

export interface AuthContext {
  apiKey: {
    id: string;
    key: string;
    name: string | null;
    rateLimit: number;
  };
}

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header("Authorization");
  const apiKeyHeader = c.req.header("X-API-Key");

  let key: string | undefined;

  if (authHeader?.startsWith("Bearer ")) {
    key = authHeader.slice(7);
  } else if (apiKeyHeader) {
    key = apiKeyHeader;
  }

  if (!key) {
    return c.json({ error: "Missing API key" }, 401);
  }

  const apiKey = await prisma.apiKey.findUnique({
    where: { key },
    select: { id: true, key: true, name: true, enabled: true, rateLimit: true },
  });

  if (!apiKey) {
    return c.json({ error: "Invalid API key" }, 401);
  }

  if (!apiKey.enabled) {
    return c.json({ error: "API key is disabled" }, 403);
  }

  c.set("apiKey", {
    id: apiKey.id,
    key: apiKey.key,
    name: apiKey.name,
    rateLimit: apiKey.rateLimit,
  });

  await next();
}
