import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { convertSvg, validateOptions, getExtension, type ConvertOptions } from "@/lib/converter";

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

  // Validate SVG content
  const trimmedContent = body.content.trim();
  if (!trimmedContent.includes("<svg") && !trimmedContent.startsWith("<?xml")) {
    return NextResponse.json(
      { success: false, error: "Content does not appear to be valid SVG" },
      { status: 400 }
    );
  }

  // 4. Validate and prepare options
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

  // 5. Convert SVG to raster format
  try {
    const result = await convertSvg(trimmedContent, options);

    // Log the request
    await prisma.request.create({
      data: {
        apiKeyId: key.id,
        filename: `converted.${getExtension(options.format)}`,
        originalSize: Buffer.byteLength(trimmedContent, "utf8"),
        optimizedSize: result.size,
        savedBytes: 0, // N/A for conversion
        camelCase: false,
        success: true,
      },
    });

    // Return the image with appropriate headers
    return new NextResponse(new Uint8Array(result.buffer), {
      status: 200,
      headers: {
        "Content-Type": result.mimeType,
        "Content-Length": result.size.toString(),
        "X-Image-Width": result.width.toString(),
        "X-Image-Height": result.height.toString(),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err) {
    // Log failed request
    await prisma.request.create({
      data: {
        apiKeyId: key.id,
        filename: null,
        originalSize: Buffer.byteLength(trimmedContent, "utf8"),
        optimizedSize: 0,
        savedBytes: 0,
        camelCase: false,
        success: false,
      },
    });

    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Conversion failed" },
      { status: 500 }
    );
  }
}
