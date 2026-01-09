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

  // Parse pagination params
  const searchParams = request.nextUrl.searchParams;
  const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);
  const offset = parseInt(searchParams.get("offset") || "0", 10);

  // Get user's API keys
  const userKeys = await prisma.apiKey.findMany({
    where: { userId: session.user.id },
    select: { id: true, name: true, key: true },
  });

  const userKeyIds = userKeys.map((k) => k.id);
  const keyNameMap = new Map(userKeys.map((k) => [k.id, k.name || k.key.substring(0, 12) + "..."]));

  // Fetch recent requests
  const [requests, totalCount] = await Promise.all([
    prisma.request.findMany({
      where: { apiKeyId: { in: userKeyIds } },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      select: {
        id: true,
        filename: true,
        originalSize: true,
        optimizedSize: true,
        savedBytes: true,
        success: true,
        errorMessage: true,
        createdAt: true,
        apiKeyId: true,
      },
    }),
    prisma.request.count({
      where: { apiKeyId: { in: userKeyIds } },
    }),
  ]);

  return NextResponse.json({
    requests: requests.map((r) => ({
      id: r.id,
      filename: r.filename || "unnamed",
      originalSize: r.originalSize,
      optimizedSize: r.optimizedSize,
      savedBytes: r.savedBytes,
      savedPercent: r.originalSize > 0 ? ((r.savedBytes / r.originalSize) * 100).toFixed(1) : "0",
      success: r.success,
      errorMessage: r.errorMessage,
      createdAt: r.createdAt.toISOString(),
      keyName: keyNameMap.get(r.apiKeyId) || "Unknown",
    })),
    pagination: {
      total: totalCount,
      limit,
      offset,
      hasMore: offset + requests.length < totalCount,
    },
  });
}
