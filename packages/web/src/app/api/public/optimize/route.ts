import { NextRequest, NextResponse } from "next/server";
import { optimizeSvg } from "@svgo-jsx/shared";

// Rate limiting: simple in-memory store (resets on server restart)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 60; // requests per minute
const WINDOW_MS = 60000; // 1 minute

function getRateLimitKey(request: NextRequest): string {
  // Use IP address for rate limiting
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0] : "unknown";
  return ip;
}

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT) {
    return false;
  }

  entry.count++;
  return true;
}

export async function POST(request: NextRequest) {
  // Rate limit check
  const rateLimitKey = getRateLimitKey(request);
  if (!checkRateLimit(rateLimitKey)) {
    return NextResponse.json(
      { success: false, error: "Rate limit exceeded. Please wait before trying again." },
      { status: 429 }
    );
  }

  // Parse request body
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

  // Limit content size for public endpoint (100KB)
  const maxSize = 100 * 1024;
  if (Buffer.byteLength(body.content, "utf8") > maxSize) {
    return NextResponse.json(
      { success: false, error: "Content too large. Maximum 100KB for public endpoint." },
      { status: 400 }
    );
  }

  try {
    const result = optimizeSvg({
      content: body.content,
      filename: body.filename,
      camelCase: body.camelCase ?? true,
      sanitize: true,
      maxSize,
    });

    return NextResponse.json(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 400 });
  }
}
