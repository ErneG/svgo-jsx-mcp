import type { Context, Next } from "hono";

export async function loggingMiddleware(c: Context, next: Next) {
  const start = Date.now();
  const method = c.req.method;
  const path = c.req.path;

  await next();

  const duration = Date.now() - start;
  const status = c.res.status;
  const apiKey = c.get("apiKey");
  const keyName = apiKey?.name || "anonymous";

  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      method,
      path,
      status,
      duration,
      apiKey: keyName,
    })
  );
}
