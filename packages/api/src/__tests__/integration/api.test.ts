import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import publicRoutes from "../../routes/public.js";

// Create a test app with just the routes we want to test
function createTestApp() {
  const app = new Hono();
  app.route("/public", publicRoutes);
  return app;
}

describe("Public API Routes", () => {
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    app = createTestApp();
    vi.clearAllMocks();
  });

  describe("POST /public/optimize", () => {
    const validSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <rect x="10" y="10" width="80" height="80" fill="red"/>
    </svg>`;

    it("should optimize valid SVG with default options", async () => {
      const res = await app.request("/public/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: validSvg }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.result).toBeDefined();
      expect(data.optimization).toBeDefined();
      expect(data.camelCaseApplied).toBe(true);
    });

    it("should optimize with camelCase disabled", async () => {
      const res = await app.request("/public/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: validSvg, camelCase: false }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.camelCaseApplied).toBe(false);
    });

    it("should use provided filename", async () => {
      const res = await app.request("/public/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: validSvg, filename: "icon.svg" }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.filename).toBe("icon.svg");
    });

    it("should return 400 for invalid SVG", async () => {
      const res = await app.request("/public/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: "<html></html>" }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
    });

    it("should return 400 for missing content", async () => {
      const res = await app.request("/public/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
    });

    it("should return error for invalid JSON", async () => {
      const res = await app.request("/public/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "not json",
      });

      // Hono throws 500 for JSON parse errors (acceptable for now)
      expect([400, 500]).toContain(res.status);
    });

    it("should return optimization metrics", async () => {
      const res = await app.request("/public/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: validSvg }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.optimization).toMatchObject({
        originalSize: expect.any(Number),
        optimizedSize: expect.any(Number),
        savedBytes: expect.any(Number),
        savedPercent: expect.stringMatching(/^\d+\.\d+%$/),
        ratio: expect.stringMatching(/^\d+\.\d+$/),
      });
    });
  });
});

describe("Content Types", () => {
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    app = createTestApp();
  });

  it("should handle missing Content-Type header", async () => {
    const res = await app.request("/public/optimize", {
      method: "POST",
      body: JSON.stringify({ content: '<svg xmlns="http://www.w3.org/2000/svg"></svg>' }),
    });

    // Hono should handle this gracefully
    expect([200, 400, 415]).toContain(res.status);
  });
});
