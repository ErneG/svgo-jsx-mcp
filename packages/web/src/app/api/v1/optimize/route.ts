import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { optimizeSvg } from "@svgo-jsx/shared";

export async function POST(request: NextRequest) {
  // 1. Validate API key
  const apiKey = request.headers.get("X-API-Key");
  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: "API key required. Include X-API-Key header." },
      { status: 401 }
    );
  }

  const key = await prisma.apiKey.findUnique({
    where: { key: apiKey },
  });

  if (!key) {
    return NextResponse.json({ success: false, error: "Invalid API key" }, { status: 401 });
  }

  if (!key.enabled) {
    return NextResponse.json({ success: false, error: "API key is disabled" }, { status: 403 });
  }

  // 2. Rate limit check (requests per minute)
  const oneMinuteAgo = new Date(Date.now() - 60000);
  const recentRequests = await prisma.request.count({
    where: {
      apiKeyId: key.id,
      createdAt: { gte: oneMinuteAgo },
    },
  });

  if (recentRequests >= key.rateLimit) {
    return NextResponse.json(
      {
        success: false,
        error: `Rate limit exceeded. Maximum ${key.rateLimit} requests per minute.`,
      },
      { status: 429 }
    );
  }

  // 3. Parse request body
  let body: { content?: string; filename?: string; camelCase?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.content || typeof body.content !== "string") {
    return NextResponse.json(
      { success: false, error: "Missing required field: content" },
      { status: 400 }
    );
  }

  const originalSize = Buffer.byteLength(body.content, "utf8");

  try {
    // 4. Optimize SVG
    const result = optimizeSvg({
      content: body.content,
      filename: body.filename,
      camelCase: body.camelCase ?? true,
      sanitize: true, // Always sanitize for API requests
      maxSize: 1024 * 1024, // 1MB limit
    });

    // 5. Log request
    await prisma.request.create({
      data: {
        apiKeyId: key.id,
        filename: body.filename || null,
        originalSize: result.optimization.originalSize,
        optimizedSize: result.optimization.optimizedSize,
        savedBytes: result.optimization.savedBytes,
        camelCase: result.camelCaseApplied,
        success: true,
      },
    });

    // 6. Update global stats
    await prisma.stats.upsert({
      where: { id: "global" },
      create: {
        id: "global",
        totalRequests: 1,
        totalBytesSaved: BigInt(result.optimization.savedBytes),
        successCount: 1,
        errorCount: 0,
      },
      update: {
        totalRequests: { increment: 1 },
        totalBytesSaved: { increment: result.optimization.savedBytes },
        successCount: { increment: 1 },
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    // Log failed request
    await prisma.request.create({
      data: {
        apiKeyId: key.id,
        filename: body.filename || null,
        originalSize,
        optimizedSize: 0,
        savedBytes: 0,
        camelCase: body.camelCase ?? true,
        success: false,
        errorMessage,
      },
    });

    // Update error count
    await prisma.stats.upsert({
      where: { id: "global" },
      create: {
        id: "global",
        totalRequests: 1,
        totalBytesSaved: BigInt(0),
        successCount: 0,
        errorCount: 1,
      },
      update: {
        totalRequests: { increment: 1 },
        errorCount: { increment: 1 },
      },
    });

    return NextResponse.json({ success: false, error: errorMessage }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({
    name: "SVGO-JSX Optimize API",
    version: "1.0.0",
    description: "Optimize SVG files with JSX-compatible camelCase attribute conversion",
    usage: {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": "your-api-key",
      },
      body: {
        content: "string (required) - SVG content",
        filename: "string (optional) - Filename for reference",
        camelCase: "boolean (optional, default: true) - Convert attributes to camelCase",
      },
    },
  });
}
