import { describe, it, expect, beforeEach } from "vitest";
import { Hono } from "hono";
import { createLimitsMiddleware } from "../security/limits.js";

describe("Limits Middleware", () => {
  let app: Hono;

  beforeEach(() => {
    app = new Hono();
  });

  describe("Content-Length validation", () => {
    it("should allow requests under the size limit", async () => {
      app.use("*", createLimitsMiddleware({ maxBodySize: 1000 }));
      app.post("/test", (c) => c.json({ success: true }));

      const res = await app.request("/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": "100",
        },
        body: JSON.stringify({ data: "small" }),
      });

      expect(res.status).toBe(200);
    });

    it("should reject requests over the size limit", async () => {
      app.use("*", createLimitsMiddleware({ maxBodySize: 100 }));
      app.post("/test", (c) => c.json({ success: true }));

      const res = await app.request("/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": "1000",
        },
        body: JSON.stringify({ data: "x".repeat(900) }),
      });

      expect(res.status).toBe(413);
      const data = await res.json();
      expect(data.error).toContain("too large");
    });

    it("should use default size limit when not specified", async () => {
      app.use("*", createLimitsMiddleware());
      app.post("/test", (c) => c.json({ success: true }));

      // Default is 1MB, so 500KB should be fine
      const res = await app.request("/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": "500000",
        },
        body: JSON.stringify({ data: "test" }),
      });

      expect(res.status).toBe(200);
    });
  });

  describe("Requests without Content-Length", () => {
    it("should allow requests without Content-Length header", async () => {
      app.use("*", createLimitsMiddleware({ maxBodySize: 1000 }));
      app.post("/test", (c) => c.json({ success: true }));

      const res = await app.request("/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: "test" }),
      });

      expect(res.status).toBe(200);
    });
  });

  describe("GET requests", () => {
    it("should allow GET requests without size checks", async () => {
      app.use("*", createLimitsMiddleware({ maxBodySize: 10 }));
      app.get("/test", (c) => c.json({ success: true }));

      const res = await app.request("/test", { method: "GET" });

      expect(res.status).toBe(200);
    });
  });
});

describe("Rate Limit Headers", () => {
  // Note: Full rate limit testing requires mocking the auth context
  // These tests verify the middleware structure without database dependencies

  it("should have rate limit middleware exported", async () => {
    const { rateLimitMiddleware } = await import("../middleware/rateLimit.js");
    expect(typeof rateLimitMiddleware).toBe("function");
  });
});

describe("Auth Middleware Structure", () => {
  // Note: Auth middleware imports db.ts which requires DATABASE_URL
  // Full auth testing requires a database connection or complete mocking
  // These tests are skipped in unit test context

  it.skip("should have auth middleware exported (requires DATABASE_URL)", async () => {
    // This test is skipped because auth.ts imports db.ts
    // which throws if DATABASE_URL is not set
    const { authMiddleware } = await import("../auth.js");
    expect(typeof authMiddleware).toBe("function");
  });
});
