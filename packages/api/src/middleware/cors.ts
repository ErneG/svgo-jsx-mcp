import { cors } from "hono/cors";

export function createCorsMiddleware() {
  const origins = process.env.CORS_ORIGINS || "*";

  return cors({
    origin: origins === "*" ? "*" : origins.split(",").map((o) => o.trim()),
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "X-API-Key"],
    exposeHeaders: ["X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset"],
    maxAge: 86400,
    credentials: true,
  });
}
