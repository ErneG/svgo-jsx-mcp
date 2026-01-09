import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { optimizeSvg, type OptimizeResult } from "@svgo-jsx/shared";

interface BatchItem {
  content: string;
  filename?: string;
}

interface BatchResult {
  success: boolean;
  filename: string;
  optimization?: OptimizeResult["optimization"];
  result?: string;
  error?: string;
}

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

  // 2. Parse request body
  let body: { items?: BatchItem[]; camelCase?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.items || !Array.isArray(body.items)) {
    return NextResponse.json(
      { success: false, error: "Missing required field: items (array)" },
      { status: 400 }
    );
  }

  if (body.items.length === 0) {
    return NextResponse.json(
      { success: false, error: "Items array cannot be empty" },
      { status: 400 }
    );
  }

  if (body.items.length > 100) {
    return NextResponse.json(
      { success: false, error: "Maximum 100 items per batch" },
      { status: 400 }
    );
  }

  // 3. Rate limit check (count each item as a request)
  const oneMinuteAgo = new Date(Date.now() - 60000);
  const recentRequests = await prisma.request.count({
    where: {
      apiKeyId: key.id,
      createdAt: { gte: oneMinuteAgo },
    },
  });

  const totalRequestsAfter = recentRequests + body.items.length;
  if (totalRequestsAfter > key.rateLimit) {
    return NextResponse.json(
      {
        success: false,
        error: `Rate limit would be exceeded. You have ${key.rateLimit - recentRequests} requests remaining this minute.`,
      },
      { status: 429 }
    );
  }

  // 4. Process all items
  const camelCase = body.camelCase ?? true;
  const results: BatchResult[] = [];
  let totalSavedBytes = 0;
  let successCount = 0;
  let errorCount = 0;

  for (const item of body.items) {
    if (!item.content || typeof item.content !== "string") {
      results.push({
        success: false,
        filename: item.filename || "untitled.svg",
        error: "Missing or invalid content field",
      });
      errorCount++;
      continue;
    }

    const originalSize = Buffer.byteLength(item.content, "utf8");

    try {
      const result = optimizeSvg({
        content: item.content,
        filename: item.filename,
        camelCase,
        sanitize: true,
        maxSize: 1024 * 1024, // 1MB limit per item
      });

      results.push({
        success: true,
        filename: result.filename,
        optimization: result.optimization,
        result: result.result,
      });

      totalSavedBytes += result.optimization.savedBytes;
      successCount++;

      // Log successful request
      await prisma.request.create({
        data: {
          apiKeyId: key.id,
          filename: item.filename || null,
          originalSize: result.optimization.originalSize,
          optimizedSize: result.optimization.optimizedSize,
          savedBytes: result.optimization.savedBytes,
          camelCase: result.camelCaseApplied,
          success: true,
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      results.push({
        success: false,
        filename: item.filename || "untitled.svg",
        error: errorMessage,
      });
      errorCount++;

      // Log failed request
      await prisma.request.create({
        data: {
          apiKeyId: key.id,
          filename: item.filename || null,
          originalSize,
          optimizedSize: 0,
          savedBytes: 0,
          camelCase,
          success: false,
          errorMessage,
        },
      });
    }
  }

  // 5. Update global stats
  await prisma.stats.upsert({
    where: { id: "global" },
    create: {
      id: "global",
      totalRequests: body.items.length,
      totalBytesSaved: BigInt(totalSavedBytes),
      successCount,
      errorCount,
    },
    update: {
      totalRequests: { increment: body.items.length },
      totalBytesSaved: { increment: totalSavedBytes },
      successCount: { increment: successCount },
      errorCount: { increment: errorCount },
    },
  });

  return NextResponse.json({
    success: true,
    total: body.items.length,
    successful: successCount,
    failed: errorCount,
    totalBytesSaved: totalSavedBytes,
    results,
  });
}

export async function GET() {
  return NextResponse.json({
    name: "SVGO-JSX Batch Optimize API",
    version: "1.0.0",
    description: "Optimize multiple SVG files in a single request",
    usage: {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": "your-api-key",
      },
      body: {
        items: "array (required) - Array of { content: string, filename?: string }",
        camelCase: "boolean (optional, default: true) - Convert attributes to camelCase",
      },
      limits: {
        maxItems: 100,
        maxSizePerItem: "1MB",
      },
    },
  });
}
