import { Hono } from "hono";
import { prisma } from "../db.js";
import { authMiddleware, type AuthContext } from "../auth.js";

type Variables = AuthContext;

const stats = new Hono<{ Variables: Variables }>();

stats.use("/*", authMiddleware);

stats.get("/", async (c) => {
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
      updatedAt: globalStats?.updatedAt || null,
    },
    last24Hours: {
      requests: recentRequests,
    },
    topKeys: topKeys.map((k: (typeof topKeys)[number]) => ({
      apiKeyId: k.apiKeyId,
      requestCount: k._count.id,
      bytesSaved: k._sum.savedBytes || 0,
    })),
  });
});

stats.get("/:keyId", async (c) => {
  const keyId = c.req.param("keyId");

  const [apiKey, requestCount, bytesSaved, recentRequests] = await Promise.all([
    prisma.apiKey.findUnique({
      where: { id: keyId },
      select: { id: true, name: true, createdAt: true, rateLimit: true },
    }),
    prisma.request.count({ where: { apiKeyId: keyId } }),
    prisma.request.aggregate({
      where: { apiKeyId: keyId },
      _sum: { savedBytes: true },
    }),
    prisma.request.findMany({
      where: { apiKeyId: keyId },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        filename: true,
        originalSize: true,
        optimizedSize: true,
        savedBytes: true,
        success: true,
        createdAt: true,
      },
    }),
  ]);

  if (!apiKey) {
    return c.json({ error: "API key not found" }, 404);
  }

  return c.json({
    apiKey: {
      id: apiKey.id,
      name: apiKey.name,
      createdAt: apiKey.createdAt,
      rateLimit: apiKey.rateLimit,
    },
    stats: {
      totalRequests: requestCount,
      totalBytesSaved: bytesSaved._sum.savedBytes || 0,
    },
    recentRequests,
  });
});

export default stats;
