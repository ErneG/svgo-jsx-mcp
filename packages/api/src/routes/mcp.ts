import { Hono } from "hono";
import type { Context } from "hono";
import { z } from "zod";
import { handleOptimizeSvg } from "../optimize.js";
import { prisma } from "../db.js";
import { authMiddleware, type AuthContext } from "../auth.js";
import { rateLimitMiddleware } from "../middleware/rateLimit.js";

type Variables = AuthContext;

const mcp = new Hono<{ Variables: Variables }>();

mcp.use("/*", authMiddleware);
mcp.use("/*", rateLimitMiddleware);

const OptimizeSchema = z.object({
  content: z.string(),
  filename: z.string().optional(),
  camelCase: z.boolean().optional().default(true),
});

const BatchOptimizeSchema = z.object({
  items: z.array(
    z.object({
      content: z.string(),
      filename: z.string().optional(),
    })
  ),
  camelCase: z.boolean().optional().default(true),
});

async function logRequest(
  apiKeyId: string,
  filename: string | null,
  originalSize: number,
  optimizedSize: number,
  savedBytes: number,
  camelCase: boolean,
  success: boolean,
  errorMessage?: string
) {
  try {
    await Promise.all([
      prisma.request.create({
        data: {
          apiKeyId,
          filename,
          originalSize,
          optimizedSize,
          savedBytes,
          camelCase,
          success,
          errorMessage,
        },
      }),
      prisma.stats.upsert({
        where: { id: "global" },
        create: {
          id: "global",
          totalRequests: 1,
          totalBytesSaved: BigInt(savedBytes),
          successCount: success ? 1 : 0,
          errorCount: success ? 0 : 1,
        },
        update: {
          totalRequests: { increment: 1 },
          totalBytesSaved: { increment: savedBytes },
          successCount: success ? { increment: 1 } : undefined,
          errorCount: success ? undefined : { increment: 1 },
        },
      }),
    ]);
  } catch (dbError) {
    console.error("Failed to log request:", dbError);
  }
}

// Single SVG optimization
mcp.post("/optimize", async (c: Context<{ Variables: Variables }>) => {
  const apiKey = c.get("apiKey");

  const body = await c.req.json();
  const parsed = OptimizeSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ success: false, error: parsed.error.message }, 400);
  }

  const { content, filename, camelCase } = parsed.data;
  const originalSize = Buffer.byteLength(content, "utf8");

  try {
    const resultText = await handleOptimizeSvg({ content, filename, camelCase });
    const result = JSON.parse(resultText);

    await logRequest(
      apiKey.id,
      filename || null,
      originalSize,
      result.optimization?.optimizedSize || 0,
      result.optimization?.savedBytes || 0,
      camelCase,
      true
    );

    return c.json(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    await logRequest(
      apiKey.id,
      filename || null,
      originalSize,
      0,
      0,
      camelCase,
      false,
      errorMessage
    );

    return c.json({ success: false, error: errorMessage }, 400);
  }
});

// Batch SVG optimization
mcp.post("/optimize/batch", async (c: Context<{ Variables: Variables }>) => {
  const apiKey = c.get("apiKey");

  const body = await c.req.json();
  const parsed = BatchOptimizeSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ success: false, error: parsed.error.message }, 400);
  }

  const { items, camelCase } = parsed.data;

  const results = await Promise.all(
    items.map(async (item) => {
      const originalSize = Buffer.byteLength(item.content, "utf8");

      try {
        const resultText = await handleOptimizeSvg({
          content: item.content,
          filename: item.filename,
          camelCase,
        });
        const result = JSON.parse(resultText);

        await logRequest(
          apiKey.id,
          item.filename || null,
          originalSize,
          result.optimization?.optimizedSize || 0,
          result.optimization?.savedBytes || 0,
          camelCase,
          true
        );

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";

        await logRequest(
          apiKey.id,
          item.filename || null,
          originalSize,
          0,
          0,
          camelCase,
          false,
          errorMessage
        );

        return {
          success: false,
          filename: item.filename || "untitled.svg",
          error: errorMessage,
        };
      }
    })
  );

  const successCount = results.filter((r) => r.success).length;

  return c.json({
    success: true,
    total: items.length,
    successful: successCount,
    failed: items.length - successCount,
    results,
  });
});

// MCP protocol info endpoint
mcp.get("/", (c) => {
  return c.json({
    name: "SvgoJsxServer",
    version: "0.1.0",
    description:
      "MCP server for SVG optimization with JSX-compatible camelCase attribute conversion",
    tools: [
      {
        name: "optimize_svg",
        description:
          "Optimize an SVG file using SVGO and optionally convert attributes to camelCase",
        endpoint: "/mcp/optimize",
        method: "POST",
        parameters: {
          content: { type: "string", required: true },
          filename: { type: "string", required: false },
          camelCase: { type: "boolean", required: false, default: true },
        },
      },
      {
        name: "optimize_svg_batch",
        description: "Optimize multiple SVG files in a single request",
        endpoint: "/mcp/optimize/batch",
        method: "POST",
        parameters: {
          items: { type: "array", required: true },
          camelCase: { type: "boolean", required: false, default: true },
        },
      },
    ],
  });
});

export default mcp;
