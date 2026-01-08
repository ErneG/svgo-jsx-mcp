import { describe, it, expect } from "vitest";
import { handleOptimizeSvg } from "../optimize.js";

describe("handleOptimizeSvg", () => {
  const validSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
    <rect x="10" y="10" width="80" height="80" fill="red" stroke-width="2"/>
  </svg>`;

  const svgWithXmlDeclaration = `<?xml version="1.0" encoding="UTF-8"?>
    <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <circle cx="50" cy="50" r="40" fill="blue"/>
    </svg>`;

  describe("valid SVG optimization", () => {
    it("should optimize a valid SVG", async () => {
      const result = await handleOptimizeSvg({ content: validSvg });
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      expect(parsed.result).toBeDefined();
      expect(parsed.optimization).toBeDefined();
      expect(parsed.optimization.originalSize).toBeGreaterThan(0);
      expect(parsed.optimization.optimizedSize).toBeGreaterThan(0);
    });

    it("should optimize SVG with XML declaration", async () => {
      const result = await handleOptimizeSvg({ content: svgWithXmlDeclaration });
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      expect(parsed.result).toBeDefined();
    });

    it("should return optimization metrics", async () => {
      const result = await handleOptimizeSvg({ content: validSvg });
      const parsed = JSON.parse(result);

      expect(parsed.optimization).toMatchObject({
        originalSize: expect.any(Number),
        optimizedSize: expect.any(Number),
        savedBytes: expect.any(Number),
        savedPercent: expect.stringMatching(/^\d+\.\d+%$/),
        ratio: expect.stringMatching(/^\d+\.\d+$/),
      });
    });
  });

  describe("camelCase conversion", () => {
    // Use fill-opacity which won't be removed by SVGO optimization
    const svgWithKebabCase = `<svg xmlns="http://www.w3.org/2000/svg">
      <rect fill="red" fill-opacity="0.5" stroke="blue" stroke-width="2"/>
    </svg>`;

    it("should convert kebab-case to camelCase by default", async () => {
      const result = await handleOptimizeSvg({ content: svgWithKebabCase });
      const parsed = JSON.parse(result);

      expect(parsed.camelCaseApplied).toBe(true);
      expect(parsed.result).toContain("fillOpacity");
      expect(parsed.result).not.toContain("fill-opacity");
    });

    it("should convert kebab-case when camelCase is true", async () => {
      const result = await handleOptimizeSvg({ content: svgWithKebabCase, camelCase: true });
      const parsed = JSON.parse(result);

      expect(parsed.camelCaseApplied).toBe(true);
      expect(parsed.result).toContain("fillOpacity");
    });

    it("should not convert kebab-case when camelCase is false", async () => {
      const result = await handleOptimizeSvg({ content: svgWithKebabCase, camelCase: false });
      const parsed = JSON.parse(result);

      expect(parsed.camelCaseApplied).toBe(false);
      expect(parsed.result).toContain("fill-opacity");
      expect(parsed.result).not.toContain("fillOpacity");
    });
  });

  describe("filename handling", () => {
    it("should use provided filename", async () => {
      const result = await handleOptimizeSvg({ content: validSvg, filename: "icon.svg" });
      const parsed = JSON.parse(result);

      expect(parsed.filename).toBe("icon.svg");
    });

    it("should use default filename when not provided", async () => {
      const result = await handleOptimizeSvg({ content: validSvg });
      const parsed = JSON.parse(result);

      expect(parsed.filename).toBe("untitled.svg");
    });
  });

  describe("error handling", () => {
    it("should throw error for invalid content (not SVG)", async () => {
      await expect(handleOptimizeSvg({ content: "<html></html>" })).rejects.toThrow(
        "Invalid SVG content"
      );
    });

    it("should throw error for plain text", async () => {
      await expect(handleOptimizeSvg({ content: "not an svg" })).rejects.toThrow(
        "Invalid SVG content"
      );
    });

    it("should throw error for empty content", async () => {
      await expect(handleOptimizeSvg({ content: "" })).rejects.toThrow("Invalid SVG content");
    });

    it("should throw error for whitespace only", async () => {
      await expect(handleOptimizeSvg({ content: "   \n\t  " })).rejects.toThrow(
        "Invalid SVG content"
      );
    });
  });

  describe("edge cases", () => {
    it("should handle SVG with leading/trailing whitespace", async () => {
      const svgWithWhitespace = `   \n  ${validSvg}  \n   `;
      const result = await handleOptimizeSvg({ content: svgWithWhitespace });
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
    });

    it("should handle minimal SVG", async () => {
      const minimalSvg = '<svg xmlns="http://www.w3.org/2000/svg"></svg>';
      const result = await handleOptimizeSvg({ content: minimalSvg });
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
    });

    it("should handle complex nested SVG", async () => {
      const complexSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
        <defs>
          <linearGradient id="grad1">
            <stop offset="0%" stop-color="red"/>
            <stop offset="100%" stop-color="blue"/>
          </linearGradient>
        </defs>
        <g transform="translate(10, 10)">
          <rect width="80" height="80" fill="url(#grad1)"/>
          <text x="40" y="45" text-anchor="middle" font-size="12">Test</text>
        </g>
      </svg>`;
      const result = await handleOptimizeSvg({ content: complexSvg });
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      expect(parsed.result).toBeDefined();
    });
  });
});
