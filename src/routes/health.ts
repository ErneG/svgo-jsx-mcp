import { Hono } from "hono";
import { prisma } from "../db.js";

const health = new Hono();

health.get("/", async (c) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return c.json({
      status: "ok",
      db: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch {
    return c.json(
      {
        status: "error",
        db: "disconnected",
        timestamp: new Date().toISOString(),
      },
      503
    );
  }
});

export default health;
