#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { handleOptimizeSvg } from "./optimize.js";

const server = new McpServer({
  name: "SvgoJsxServer",
  version: "0.1.0",
  description: "MCP server for SVG optimization with JSX-compatible camelCase attribute conversion",
});

server.tool(
  "optimize_svg",
  "Optimize an SVG file using SVGO and optionally convert attributes to camelCase for JSX/React compatibility",
  {
    content: z.string().describe("The SVG content to optimize"),
    filename: z.string().optional().describe("Optional filename for context in reporting"),
    camelCase: z
      .boolean()
      .optional()
      .default(true)
      .describe("Convert kebab-case attributes to camelCase (default: true)"),
  },
  async ({ content, filename, camelCase }) => {
    try {
      const result = await handleOptimizeSvg({ content, filename, camelCase });
      return {
        content: [{ type: "text", text: result }],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return {
        content: [
          { type: "text", text: JSON.stringify({ success: false, error: message }, null, 2) },
        ],
        isError: true,
      };
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  try {
    await server.connect(transport);
    console.error("SvgoJsxServer connected and running");
  } catch (error) {
    console.error("Failed to connect server:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Server startup failed:", error);
  process.exit(1);
});
