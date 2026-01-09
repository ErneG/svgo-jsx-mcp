import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { optimizeSvg } from "@svgo-jsx/shared";

// MCP Protocol Types
interface JsonRpcRequest {
  jsonrpc: "2.0";
  id: string | number;
  method: string;
  params?: Record<string, unknown>;
}

interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: string | number;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

// Tool definitions
const TOOLS = [
  {
    name: "optimize_svg",
    description:
      "Optimize an SVG file and optionally convert attributes to camelCase for JSX compatibility",
    inputSchema: {
      type: "object",
      properties: {
        content: {
          type: "string",
          description: "The SVG content to optimize",
        },
        filename: {
          type: "string",
          description: "Optional filename for reference",
        },
        camelCase: {
          type: "boolean",
          description: "Convert attributes to camelCase for JSX (default: true)",
          default: true,
        },
      },
      required: ["content"],
    },
  },
  {
    name: "batch_optimize_svg",
    description: "Optimize multiple SVG files in a single request",
    inputSchema: {
      type: "object",
      properties: {
        items: {
          type: "array",
          description: "Array of SVG items to optimize",
          items: {
            type: "object",
            properties: {
              content: {
                type: "string",
                description: "The SVG content",
              },
              filename: {
                type: "string",
                description: "Optional filename",
              },
            },
            required: ["content"],
          },
        },
        camelCase: {
          type: "boolean",
          description: "Convert attributes to camelCase for JSX (default: true)",
          default: true,
        },
      },
      required: ["items"],
    },
  },
];

// Validate API key
async function validateApiKey(apiKey: string | null) {
  if (!apiKey) return null;

  const key = await prisma.apiKey.findUnique({
    where: { key: apiKey },
  });

  if (!key || !key.enabled) return null;
  return key;
}

// Handle tool calls
async function handleToolCall(name: string, args: Record<string, unknown>, apiKeyId: string) {
  switch (name) {
    case "optimize_svg": {
      const content = args.content as string;
      const filename = args.filename as string | undefined;
      const camelCase = (args.camelCase as boolean) ?? true;

      try {
        const result = optimizeSvg({
          content,
          filename,
          camelCase,
          sanitize: true,
          maxSize: 1024 * 1024,
        });

        // Log request
        await prisma.request.create({
          data: {
            apiKeyId,
            filename: filename || null,
            originalSize: result.optimization.originalSize,
            optimizedSize: result.optimization.optimizedSize,
            savedBytes: result.optimization.savedBytes,
            camelCase: result.camelCaseApplied,
            success: true,
          },
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";

        // Log failed request
        await prisma.request.create({
          data: {
            apiKeyId,
            filename: filename || null,
            originalSize: Buffer.byteLength(content, "utf8"),
            optimizedSize: 0,
            savedBytes: 0,
            camelCase,
            success: false,
            errorMessage,
          },
        });

        return {
          content: [{ type: "text", text: `Error: ${errorMessage}` }],
          isError: true,
        };
      }
    }

    case "batch_optimize_svg": {
      const items = args.items as Array<{
        content: string;
        filename?: string;
      }>;
      const camelCase = (args.camelCase as boolean) ?? true;

      const results = [];
      let totalSaved = 0;
      let successCount = 0;

      for (const item of items) {
        try {
          const result = optimizeSvg({
            content: item.content,
            filename: item.filename,
            camelCase,
            sanitize: true,
            maxSize: 1024 * 1024,
          });

          results.push({
            success: true,
            filename: result.filename,
            optimization: result.optimization,
            result: result.result,
          });

          totalSaved += result.optimization.savedBytes;
          successCount++;

          await prisma.request.create({
            data: {
              apiKeyId,
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

          await prisma.request.create({
            data: {
              apiKeyId,
              filename: item.filename || null,
              originalSize: Buffer.byteLength(item.content, "utf8"),
              optimizedSize: 0,
              savedBytes: 0,
              camelCase,
              success: false,
              errorMessage,
            },
          });
        }
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                total: items.length,
                successful: successCount,
                failed: items.length - successCount,
                totalBytesSaved: totalSaved,
                results,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    default:
      return {
        content: [{ type: "text", text: `Unknown tool: ${name}` }],
        isError: true,
      };
  }
}

// Process JSON-RPC request
async function processRequest(
  request: JsonRpcRequest,
  apiKey: { id: string }
): Promise<JsonRpcResponse> {
  const { id, method, params } = request;

  switch (method) {
    case "initialize":
      return {
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: "2024-11-05",
          capabilities: {
            tools: {},
          },
          serverInfo: {
            name: "svgo-jsx-mcp",
            version: "1.0.0",
          },
        },
      };

    case "tools/list":
      return {
        jsonrpc: "2.0",
        id,
        result: { tools: TOOLS },
      };

    case "tools/call": {
      const toolParams = params as {
        name: string;
        arguments: Record<string, unknown>;
      };
      const result = await handleToolCall(toolParams.name, toolParams.arguments || {}, apiKey.id);
      return {
        jsonrpc: "2.0",
        id,
        result,
      };
    }

    case "ping":
      return {
        jsonrpc: "2.0",
        id,
        result: {},
      };

    default:
      return {
        jsonrpc: "2.0",
        id,
        error: {
          code: -32601,
          message: `Method not found: ${method}`,
        },
      };
  }
}

// POST handler for MCP requests
export async function POST(request: NextRequest) {
  // Validate API key
  const apiKey = request.headers.get("X-API-Key");
  const key = await validateApiKey(apiKey);

  if (!key) {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id: null,
        error: {
          code: -32000,
          message: "Invalid or missing API key",
        },
      },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();

    // Handle single request
    if (!Array.isArray(body)) {
      const response = await processRequest(body as JsonRpcRequest, key);
      return NextResponse.json(response);
    }

    // Handle batch request
    const responses = await Promise.all(
      body.map((req: JsonRpcRequest) => processRequest(req, key))
    );
    return NextResponse.json(responses);
  } catch {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id: null,
        error: {
          code: -32700,
          message: "Parse error",
        },
      },
      { status: 400 }
    );
  }
}

// GET handler for info
export async function GET() {
  return NextResponse.json({
    name: "SVGO-JSX MCP Server",
    version: "1.0.0",
    description:
      "MCP server for optimizing SVG files with JSX-compatible camelCase attribute conversion",
    protocol: "MCP 2024-11-05",
    authentication: "X-API-Key header required",
    endpoints: {
      mcp: "POST /api/mcp",
    },
    tools: TOOLS.map((t) => ({ name: t.name, description: t.description })),
  });
}
