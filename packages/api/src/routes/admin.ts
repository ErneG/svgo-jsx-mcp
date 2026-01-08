import { Hono } from "hono";
import type { Context, Next } from "hono";
import { prisma } from "../db.js";
import { randomBytes } from "crypto";

const admin = new Hono();

// Admin authentication middleware
async function adminAuthMiddleware(c: Context, next: Next) {
  const adminSecret = c.req.header("X-Admin-Secret");
  const expectedSecret = process.env.ADMIN_SECRET;

  if (!expectedSecret) {
    return c.json({ error: "Admin secret not configured" }, 500);
  }

  if (!adminSecret || adminSecret !== expectedSecret) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  await next();
}

admin.use("/*", adminAuthMiddleware);

// List all API keys
admin.get("/keys", async (c) => {
  const keys = await prisma.apiKey.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      key: true,
      name: true,
      enabled: true,
      rateLimit: true,
      createdAt: true,
      _count: {
        select: { requests: true },
      },
    },
  });

  return c.json(
    keys.map((k) => ({
      id: k.id,
      key: k.key,
      name: k.name,
      enabled: k.enabled,
      rateLimit: k.rateLimit,
      createdAt: k.createdAt.toISOString(),
      requestCount: k._count.requests,
    }))
  );
});

// Create new API key
admin.post("/keys", async (c) => {
  const body = await c.req.json();
  const { name, rateLimit = 100 } = body;

  const key = `sk_${randomBytes(24).toString("hex")}`;

  const apiKey = await prisma.apiKey.create({
    data: {
      key,
      name: name || null,
      rateLimit,
    },
  });

  return c.json({
    id: apiKey.id,
    key: apiKey.key,
    name: apiKey.name,
    enabled: apiKey.enabled,
    rateLimit: apiKey.rateLimit,
    createdAt: apiKey.createdAt.toISOString(),
  });
});

// Update API key
admin.patch("/keys/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const { enabled, rateLimit, name } = body;

  const updateData: Record<string, unknown> = {};
  if (typeof enabled === "boolean") updateData.enabled = enabled;
  if (typeof rateLimit === "number") updateData.rateLimit = rateLimit;
  if (typeof name === "string") updateData.name = name;

  const apiKey = await prisma.apiKey.update({
    where: { id },
    data: updateData,
  });

  return c.json({
    id: apiKey.id,
    key: apiKey.key,
    name: apiKey.name,
    enabled: apiKey.enabled,
    rateLimit: apiKey.rateLimit,
    createdAt: apiKey.createdAt.toISOString(),
  });
});

// Delete API key
admin.delete("/keys/:id", async (c) => {
  const id = c.req.param("id");

  await prisma.apiKey.delete({
    where: { id },
  });

  return c.json({ ok: true });
});

// Get statistics
admin.get("/stats", async (c) => {
  const [globalStats, recentRequests, topKeys] = await Promise.all([
    prisma.stats.findUnique({ where: { id: "global" } }),
    prisma.request.count({
      where: {
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.request.groupBy({
      by: ["apiKeyId"],
      _count: { id: true },
      _sum: { savedBytes: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    }),
  ]);

  return c.json({
    global: {
      totalRequests: globalStats?.totalRequests || 0,
      totalBytesSaved: globalStats?.totalBytesSaved?.toString() || "0",
      successCount: globalStats?.successCount || 0,
      errorCount: globalStats?.errorCount || 0,
      updatedAt: globalStats?.updatedAt?.toISOString() || null,
    },
    last24Hours: {
      requests: recentRequests,
    },
    topKeys: topKeys.map((k) => ({
      apiKeyId: k.apiKeyId,
      requestCount: k._count.id,
      bytesSaved: k._sum.savedBytes || 0,
    })),
  });
});

export default admin;
