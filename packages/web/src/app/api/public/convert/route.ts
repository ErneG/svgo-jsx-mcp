import { NextRequest, NextResponse } from "next/server";
import { convertSvg, validateOptions, type ConvertOptions } from "@/lib/converter";

// Rate limiting: track requests by IP
const requestCounts = new Map<string, { count: number; timestamp: number }>();
const RATE_LIMIT = 30; // requests per minute (lower than optimize since conversion is heavier)
const RATE_WINDOW = 60000; // 1 minute
const MAX_SIZE = 100 * 1024; // 100KB max for public endpoint

function getRateLimitInfo(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = requestCounts.get(ip);

  if (!record || now - record.timestamp > RATE_WINDOW) {
    requestCounts.set(ip, { count: 1, timestamp: now });
    return { allowed: true, remaining: RATE_LIMIT - 1 };
  }

  if (record.count >= RATE_LIMIT) {
    return { allowed: false, remaining: 0 };
  }

  record.count++;
  return { allowed: true, remaining: RATE_LIMIT - record.count };
}

export async function POST(request: NextRequest) {
  // 1. Rate limiting by IP
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  const { allowed, remaining } = getRateLimitInfo(ip);

  if (!allowed) {
    return NextResponse.json(
      { success: false, error: `Rate limit exceeded. Maximum ${RATE_LIMIT} requests per minute.` },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": RATE_LIMIT.toString(),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  // 2. Parse request body
  let body: {
    content?: string;
    format?: string;
    scale?: number;
    quality?: number;
    background?: string;
    width?: number;
    height?: number;
  };
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

  // 3. Size check
  const contentSize = Buffer.byteLength(body.content, "utf8");
  if (contentSize > MAX_SIZE) {
    return NextResponse.json(
      { success: false, error: `Content too large. Maximum ${MAX_SIZE / 1024}KB for public API.` },
      { status: 413 }
    );
  }

  // 4. Validate SVG content
  const trimmedContent = body.content.trim();
  if (!trimmedContent.includes("<svg") && !trimmedContent.startsWith("<?xml")) {
    return NextResponse.json(
      { success: false, error: "Content does not appear to be valid SVG" },
      { status: 400 }
    );
  }

  // 5. Validate and prepare options
  let options: ConvertOptions;
  try {
    options = validateOptions({
      format: body.format as ConvertOptions["format"],
      scale: body.scale as ConvertOptions["scale"],
      quality: body.quality,
      background: body.background,
      width: body.width,
      height: body.height,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Invalid options" },
      { status: 400 }
    );
  }

  // 6. Convert SVG to raster format
  try {
    const result = await convertSvg(trimmedContent, options);

    // Return the image with appropriate headers
    return new NextResponse(new Uint8Array(result.buffer), {
      status: 200,
      headers: {
        "Content-Type": result.mimeType,
        "Content-Length": result.size.toString(),
        "X-Image-Width": result.width.toString(),
        "X-Image-Height": result.height.toString(),
        "X-RateLimit-Limit": RATE_LIMIT.toString(),
        "X-RateLimit-Remaining": remaining.toString(),
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Conversion failed" },
      { status: 500 }
    );
  }
}
