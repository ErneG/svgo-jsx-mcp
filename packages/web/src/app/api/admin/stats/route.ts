import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse days parameter (0 = all time)
  const searchParams = request.nextUrl.searchParams;
  const daysParam = searchParams.get("days");
  const days = daysParam ? parseInt(daysParam, 10) : 0;
  const dateFilter =
    days > 0 ? { gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) } : undefined;

  // Get user's API keys
  const userKeys = await prisma.apiKey.findMany({
    where: { userId: session.user.id },
    select: { id: true },
  });

  const userKeyIds = userKeys.map((k) => k.id);

  // Get stats for user's keys - computed from Request table for accuracy
  const [userStats, userRequests24h, userKeyStats] = await Promise.all([
    // User's aggregate stats computed from Request table
    prisma.request.aggregate({
      where: {
        apiKeyId: { in: userKeyIds },
        ...(dateFilter && { createdAt: dateFilter }),
      },
      _count: { id: true },
      _sum: { savedBytes: true, originalSize: true },
    }),

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
        ...(dateFilter && { createdAt: dateFilter }),
      },
      _count: { id: true },
      _sum: { savedBytes: true },
      orderBy: { _count: { id: "desc" } },
    }),
  ]);

  // Get success/error counts separately (Prisma aggregate doesn't support conditional counts)
  const [successCount, errorCount, keySuccessCounts] = await Promise.all([
    prisma.request.count({
      where: {
        apiKeyId: { in: userKeyIds },
        success: true,
        ...(dateFilter && { createdAt: dateFilter }),
      },
    }),
    prisma.request.count({
      where: {
        apiKeyId: { in: userKeyIds },
        success: false,
        ...(dateFilter && { createdAt: dateFilter }),
      },
    }),
    // Success counts per key for success rate calculation
    prisma.request.groupBy({
      by: ["apiKeyId"],
      where: {
        apiKeyId: { in: userKeyIds },
        success: true,
        ...(dateFilter && { createdAt: dateFilter }),
      },
      _count: { id: true },
    }),
  ]);

  // Map key success counts for lookup
  const keySuccessMap = new Map(keySuccessCounts.map((k) => [k.apiKeyId, k._count.id]));

  // Get key names for the breakdown
  const keyDetails = await prisma.apiKey.findMany({
    where: { id: { in: userKeyIds } },
    select: { id: true, name: true, key: true },
  });

  const keyNameMap = new Map(
    keyDetails.map((k) => [k.id, k.name || k.key.substring(0, 12) + "..."])
  );

  const totalRequests = userStats._count.id || 0;
  const totalBytesSaved = userStats._sum.savedBytes || 0;
  const totalOriginalSize = userStats._sum.originalSize || 0;

  // Calculate average optimization percentage: (savedBytes / originalSize) * 100
  const averageOptimizationPercent =
    totalOriginalSize > 0
      ? ((Number(totalBytesSaved) / Number(totalOriginalSize)) * 100).toFixed(1)
      : "0";

  return NextResponse.json({
    // Keep global for backward compatibility (same as user stats for now)
    global: {
      totalRequests,
      totalBytesSaved: totalBytesSaved.toString(),
      successCount,
      errorCount,
      averageOptimizationPercent,
      updatedAt: new Date().toISOString(),
    },
    user: {
      // User-specific totals computed from Request table
      totalRequests,
      totalBytesSaved: totalBytesSaved.toString(),
      successCount,
      errorCount,
      averageOptimizationPercent,
      last24Hours: {
        requests: userRequests24h,
      },
      keyStats: userKeyStats.map((k) => {
        const keyRequestCount = k._count.id;
        const keySuccessCount = keySuccessMap.get(k.apiKeyId) || 0;
        const keySuccessRate =
          keyRequestCount > 0 ? ((keySuccessCount / keyRequestCount) * 100).toFixed(1) : "0";
        return {
          apiKeyId: k.apiKeyId,
          keyName: keyNameMap.get(k.apiKeyId) || "Unknown",
          requestCount: keyRequestCount,
          bytesSaved: k._sum.savedBytes || 0,
          successCount: keySuccessCount,
          successRate: keySuccessRate,
        };
      }),
    },
  });
}
