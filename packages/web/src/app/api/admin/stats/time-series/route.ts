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

  const searchParams = request.nextUrl.searchParams;
  const days = parseInt(searchParams.get("days") || "7", 10);

  // Get user's API keys
  const userKeys = await prisma.apiKey.findMany({
    where: { userId: session.user.id },
    select: { id: true },
  });

  const userKeyIds = userKeys.map((k) => k.id);

  // Calculate date range
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Get requests grouped by date
  const requests = await prisma.request.findMany({
    where: {
      apiKeyId: { in: userKeyIds },
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      createdAt: true,
      savedBytes: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  // Aggregate by date
  const dateMap = new Map<string, { requests: number; bytesSaved: number }>();

  // Initialize all dates in the range
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split("T")[0];
    dateMap.set(dateStr, { requests: 0, bytesSaved: 0 });
  }

  // Aggregate requests
  for (const req of requests) {
    const dateStr = req.createdAt.toISOString().split("T")[0];
    const current = dateMap.get(dateStr) || { requests: 0, bytesSaved: 0 };
    current.requests += 1;
    current.bytesSaved += req.savedBytes || 0;
    dateMap.set(dateStr, current);
  }

  // Convert to array
  const result = Array.from(dateMap.entries())
    .map(([date, data]) => ({
      date,
      requests: data.requests,
      bytesSaved: data.bytesSaved,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return NextResponse.json(result);
}
