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

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Verify the key belongs to the user
  const existingKey = await prisma.apiKey.findUnique({
    where: { id },
    select: { userId: true },
  });

  if (!existingKey) {
    return NextResponse.json({ error: "API key not found" }, { status: 404 });
  }

  if (existingKey.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { enabled?: boolean; rateLimit?: number; name?: string; webhookUrl?: string | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Validate webhook URL if provided (and not being cleared)
  if (body.webhookUrl !== undefined && body.webhookUrl !== null && body.webhookUrl !== "") {
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

  const updateData: Record<string, unknown> = {};
  if (typeof body.enabled === "boolean") updateData.enabled = body.enabled;
  if (typeof body.rateLimit === "number") updateData.rateLimit = body.rateLimit;
  if (typeof body.name === "string") updateData.name = body.name;
  if (body.webhookUrl !== undefined) {
    updateData.webhookUrl = body.webhookUrl === "" ? null : body.webhookUrl;
  }

  const apiKey = await prisma.apiKey.update({
    where: { id },
    data: updateData,
    include: {
      _count: {
        select: { requests: true },
      },
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
    requestCount: apiKey._count.requests,
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Verify the key belongs to the user
  const existingKey = await prisma.apiKey.findUnique({
    where: { id },
    select: { userId: true },
  });

  if (!existingKey) {
    return NextResponse.json({ error: "API key not found" }, { status: 404 });
  }

  if (existingKey.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.apiKey.delete({
    where: { id },
  });

  return NextResponse.json({ ok: true });
}
