#!/usr/bin/env node

import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { prisma, initializeStats, seedApiKeys } from "./db.js";
import { createCorsMiddleware } from "./middleware/cors.js";
import { loggingMiddleware } from "./middleware/logging.js";
import { createLimitsMiddleware, getLimitsFromEnv } from "./security/limits.js";
import healthRoutes from "./routes/health.js";
import statsRoutes from "./routes/stats.js";
import mcpRoutes from "./routes/mcp.js";
import adminRoutes from "./routes/admin.js";
import publicRoutes from "./routes/public.js";

const app = new Hono();

// Global middleware
app.use("*", createCorsMiddleware());
app.use("*", loggingMiddleware);
app.use("*", createLimitsMiddleware(getLimitsFromEnv()));

// Routes
app.route("/health", healthRoutes);
app.route("/stats", statsRoutes);
app.route("/mcp", mcpRoutes);
app.route("/admin", adminRoutes);
app.route("/public", publicRoutes);

// Root endpoint
app.get("/", (c) => {
  return c.json({
    name: "svgo-jsx-mcp",
    version: "0.1.0",
    description: "MCP server for SVG optimization with JSX-compatible camelCase conversion",
    endpoints: {
      health: "/health",
      stats: "/stats",
      mcp: {
        sse: "/mcp/sse",
        message: "/mcp/message",
      },
    },
  });
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: "Not found" }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error("Server error:", err);
  return c.json({ error: "Internal server error" }, 500);
});

async function main() {
  const port = parseInt(process.env.PORT || "3001", 10);

  try {
    // Initialize database
    await prisma.$connect();
    console.log("Connected to database");

    await initializeStats();
    await seedApiKeys();
    console.log("Database initialized");

    // Start server
    serve({
      fetch: app.fetch,
      port,
    });

    console.log(`Server running on http://localhost:${port}`);
    console.log("Endpoints:");
    console.log(`  - Health: http://localhost:${port}/health`);
    console.log(`  - Stats:  http://localhost:${port}/stats`);
    console.log(`  - MCP:    http://localhost:${port}/mcp/optimize`);
    console.log(`  - Admin:  http://localhost:${port}/admin/keys`);
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\nShutting down...");
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\nShutting down...");
  await prisma.$disconnect();
  process.exit(0);
});

main();
