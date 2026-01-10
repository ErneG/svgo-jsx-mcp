import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { randomBytes } from "crypto";

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

  const keys = await prisma.apiKey.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      key: true,
      name: true,
      enabled: true,
      rateLimit: true,
      webhookUrl: true,
      createdAt: true,
      _count: {
        select: { requests: true },
      },
    },
  });

  return NextResponse.json(
    keys.map((k) => ({
      id: k.id,
      key: k.key,
      name: k.name,
      enabled: k.enabled,
      rateLimit: k.rateLimit,
      webhookUrl: k.webhookUrl,
      createdAt: k.createdAt.toISOString(),
      requestCount: k._count.requests,
    }))
  );
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { name?: string; rateLimit?: number; webhookUrl?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Validate webhook URL if provided
  if (body.webhookUrl) {
    try {
      const url = new URL(body.webhookUrl);
      const isHttps = url.protocol === "https:";
      const isLocalhost =
        url.protocol === "http:" && (url.hostname === "localhost" || url.hostname === "127.0.0.1");
      if (!isHttps && !isLocalhost) {
        return NextResponse.json(
          { error: "Webhook URL must use HTTPS (or HTTP for localhost)" },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json({ error: "Invalid webhook URL" }, { status: 400 });
    }
  }

  const key = `sk_${randomBytes(24).toString("hex")}`;

  const apiKey = await prisma.apiKey.create({
    data: {
      key,
      name: body.name || null,
      rateLimit: body.rateLimit || 100,
      webhookUrl: body.webhookUrl || null,
      userId: session.user.id,
    },
  });

  return NextResponse.json({
    id: apiKey.id,
    key: apiKey.key,
    name: apiKey.name,
    enabled: apiKey.enabled,
    rateLimit: apiKey.rateLimit,
    webhookUrl: apiKey.webhookUrl,
    createdAt: apiKey.createdAt.toISOString(),
    requestCount: 0,
  });
}
