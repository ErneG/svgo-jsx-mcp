import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get user's API keys
  const userKeys = await prisma.apiKey.findMany({
    where: { userId: session.user.id },
    select: { id: true },
  });

  const userKeyIds = userKeys.map((k) => k.id);

  // Get stats for user's keys
  const [globalStats, userRequests24h, userKeyStats] = await Promise.all([
    // Global stats (read-only view)
    prisma.stats.findUnique({ where: { id: "global" } }),

    // User's requests in last 24 hours
    prisma.request.count({
      where: {
        apiKeyId: { in: userKeyIds },
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    }),

    // User's key usage breakdown
    prisma.request.groupBy({
      by: ["apiKeyId"],
      where: {
        apiKeyId: { in: userKeyIds },
      },
      _count: { id: true },
      _sum: { savedBytes: true },
      orderBy: { _count: { id: "desc" } },
    }),
  ]);

  // Get key names for the breakdown
  const keyDetails = await prisma.apiKey.findMany({
    where: { id: { in: userKeyIds } },
    select: { id: true, name: true, key: true },
  });

  const keyNameMap = new Map(
    keyDetails.map((k) => [k.id, k.name || k.key.substring(0, 12) + "..."])
  );

  return NextResponse.json({
    global: {
      totalRequests: globalStats?.totalRequests || 0,
      totalBytesSaved: globalStats?.totalBytesSaved?.toString() || "0",
      successCount: globalStats?.successCount || 0,
      errorCount: globalStats?.errorCount || 0,
      updatedAt: globalStats?.updatedAt?.toISOString() || null,
    },
    user: {
      last24Hours: {
        requests: userRequests24h,
      },
      keyStats: userKeyStats.map((k) => ({
        apiKeyId: k.apiKeyId,
        keyName: keyNameMap.get(k.apiKeyId) || "Unknown",
        requestCount: k._count.id,
        bytesSaved: k._sum.savedBytes || 0,
      })),
    },
  });
}
