import { describe, it, expect } from "vitest";
import { optimizeSvg } from "../optimize.js";

describe("optimizeSvg", () => {
  describe("happy path", () => {
    it("should optimize a valid SVG", () => {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
        <rect x="0" y="0" width="100" height="100" fill="red"/>
      </svg>`;

      const result = optimizeSvg({ content: svg });

      expect(result.success).toBe(true);
      expect(result.result).toBeDefined();
      expect(result.optimization.originalSize).toBeGreaterThan(0);
      expect(result.optimization.optimizedSize).toBeGreaterThan(0);
      expect(result.optimization.savedBytes).toBeGreaterThanOrEqual(0);
    });

    it("should handle SVG starting with XML declaration", () => {
      const svg = `<?xml version="1.0" encoding="UTF-8"?>
        <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
          <circle cx="50" cy="50" r="40"/>
        </svg>`;

      const result = optimizeSvg({ content: svg });

      expect(result.success).toBe(true);
      expect(result.result).toBeDefined();
    });

    it("should use provided filename", () => {
      const svg = '<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0"/></svg>';

      const result = optimizeSvg({ content: svg, filename: "icon.svg" });

      expect(result.filename).toBe("icon.svg");
    });

    it("should use default filename when not provided", () => {
      const svg = '<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0"/></svg>';

      const result = optimizeSvg({ content: svg });

      expect(result.filename).toBe("untitled.svg");
    });

    it("should calculate optimization metrics correctly", () => {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
        <!-- This comment should be removed -->
        <rect x="0" y="0" width="100" height="100" fill="red"/>
      </svg>`;

      const result = optimizeSvg({ content: svg });

      expect(result.optimization.savedPercent).toMatch(/^\d+(\.\d+)?%$/);
      expect(result.optimization.ratio).toMatch(/^\d+\.\d+$/);
    });
  });

  describe("camelCase conversion", () => {
    it("should convert kebab-case attributes to camelCase by default", () => {
      // Use a path with stroke color so SVGO doesn't optimize away stroke-width
      const svg =
        '<svg xmlns="http://www.w3.org/2000/svg"><path stroke="black" stroke-width="2" fill-opacity="0.5" d="M10 10 L20 20"/></svg>';

      const result = optimizeSvg({ content: svg });

      expect(result.camelCaseApplied).toBe(true);
      expect(result.result).toContain("strokeWidth");
      expect(result.result).toContain("fillOpacity");
      expect(result.result).not.toContain("stroke-width");
      expect(result.result).not.toContain("fill-opacity");
    });

    it("should convert multiple kebab-case attributes in the same element", () => {
      const svg =
        '<svg xmlns="http://www.w3.org/2000/svg"><text font-family="Arial" font-size="12" text-anchor="middle">Test</text></svg>';

      const result = optimizeSvg({ content: svg });

      expect(result.camelCaseApplied).toBe(true);
      expect(result.result).toContain("fontFamily");
      expect(result.result).toContain("fontSize");
      expect(result.result).toContain("textAnchor");
    });

    it("should not convert when camelCase is false", () => {
      // Use a path with stroke color so SVGO doesn't optimize away stroke-width
      const svg =
        '<svg xmlns="http://www.w3.org/2000/svg"><path stroke="black" stroke-width="2" d="M10 10 L20 20"/></svg>';

      const result = optimizeSvg({ content: svg, camelCase: false });

      expect(result.camelCaseApplied).toBe(false);
      expect(result.result).toContain("stroke-width");
      expect(result.result).not.toContain("strokeWidth");
    });

    it("should handle clip-path attribute conversion", () => {
      const svg =
        '<svg xmlns="http://www.w3.org/2000/svg"><rect clip-path="url(#clip)" width="100" height="100"/></svg>';

      const result = optimizeSvg({ content: svg });

      expect(result.result).toContain("clipPath");
    });

    it("should handle complex kebab-case attributes", () => {
      // Use a path with stroke color so SVGO doesn't optimize away stroke attributes
      // Note: stroke-dashoffset="0" would be optimized away as it's the default value
      const svg =
        '<svg xmlns="http://www.w3.org/2000/svg"><path stroke="black" stroke-dasharray="5,5" stroke-dashoffset="10" stroke-linecap="round" stroke-linejoin="round" d="M10 10 L20 20"/></svg>';

      const result = optimizeSvg({ content: svg });

      expect(result.result).toContain("strokeDasharray");
      expect(result.result).toContain("strokeDashoffset");
      expect(result.result).toContain("strokeLinecap");
      expect(result.result).toContain("strokeLinejoin");
    });
  });

  describe("error handling", () => {
    it("should throw error for invalid SVG content", () => {
      const invalidContent = "<div>This is not an SVG</div>";

      expect(() => optimizeSvg({ content: invalidContent })).toThrow(
        "Invalid SVG content: must start with <svg or <?xml"
      );
    });

    it("should throw error for plain text content", () => {
      const textContent = "This is just plain text";

      expect(() => optimizeSvg({ content: textContent })).toThrow(
        "Invalid SVG content: must start with <svg or <?xml"
      );
    });

    it("should throw error for HTML content", () => {
      const htmlContent = "<html><body><svg></svg></body></html>";

      expect(() => optimizeSvg({ content: htmlContent })).toThrow(
        "Invalid SVG content: must start with <svg or <?xml"
      );
    });

    it("should throw error for empty content", () => {
      expect(() => optimizeSvg({ content: "" })).toThrow(
        "Invalid SVG content: must start with <svg or <?xml"
      );
    });

    it("should throw error for whitespace-only content", () => {
      expect(() => optimizeSvg({ content: "   \n\t  " })).toThrow(
        "Invalid SVG content: must start with <svg or <?xml"
      );
    });

    it("should throw error when content exceeds maxSize", () => {
      const svg = '<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0"/></svg>';

      expect(() => optimizeSvg({ content: svg, maxSize: 10 })).toThrow(/SVG content too large/);
    });
  });

  describe("sanitization", () => {
    it("should not sanitize by default", () => {
      const svg =
        '<svg xmlns="http://www.w3.org/2000/svg" onclick="alert(1)"><path d="M0 0"/></svg>';

      const result = optimizeSvg({ content: svg, sanitize: false });

      expect(result.sanitized).toBe(false);
    });

    it("should sanitize when enabled", () => {
      const svg =
        '<svg xmlns="http://www.w3.org/2000/svg" onclick="alert(1)"><path d="M0 0"/></svg>';

      const result = optimizeSvg({ content: svg, sanitize: true });

      expect(result.sanitized).toBe(true);
      expect(result.result).not.toContain("onclick");
    });

    it("should return security warnings when not sanitizing", () => {
      const svg =
        '<svg xmlns="http://www.w3.org/2000/svg" onclick="alert(1)"><script>evil()</script></svg>';

      const result = optimizeSvg({ content: svg, sanitize: false });

      expect(result.securityWarnings).toBeDefined();
      expect(result.securityWarnings!.length).toBeGreaterThan(0);
    });

    it("should remove script elements when sanitizing", () => {
      const svg =
        '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script><path d="M0 0"/></svg>';

      const result = optimizeSvg({ content: svg, sanitize: true });

      expect(result.result).not.toContain("<script>");
      expect(result.result).not.toContain("alert(1)");
      expect(result.securityWarnings).toBeDefined();
    });
  });

  describe("edge cases", () => {
    it("should handle minimal SVG", () => {
      const svg = '<svg xmlns="http://www.w3.org/2000/svg"></svg>';

      const result = optimizeSvg({ content: svg });

      expect(result.success).toBe(true);
    });

    it("should handle SVG with only whitespace between tags", () => {
      const svg = '<svg xmlns="http://www.w3.org/2000/svg">   </svg>';

      const result = optimizeSvg({ content: svg });

      expect(result.success).toBe(true);
    });

    it("should handle SVG with leading/trailing whitespace", () => {
      const svg = '   <svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0"/></svg>   ';

      const result = optimizeSvg({ content: svg });

      expect(result.success).toBe(true);
    });

    it("should handle SVG with nested groups", () => {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg">
        <g>
          <g>
            <rect width="100" height="100"/>
          </g>
        </g>
      </svg>`;

      const result = optimizeSvg({ content: svg });

      expect(result.success).toBe(true);
    });

    it("should handle SVG with CDATA sections", () => {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg">
        <style><![CDATA[
          .cls { fill: red; }
        ]]></style>
        <rect class="cls" width="100" height="100"/>
      </svg>`;

      const result = optimizeSvg({ content: svg });

      expect(result.success).toBe(true);
    });

    it("should handle SVG with special characters in attributes", () => {
      const svg = '<svg xmlns="http://www.w3.org/2000/svg"><text>&lt;Hello&gt;</text></svg>';

      const result = optimizeSvg({ content: svg });

      expect(result.success).toBe(true);
    });

    it("should handle complex real-world SVG", () => {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>`;

      const result = optimizeSvg({ content: svg });

      expect(result.success).toBe(true);
      expect(result.result).toContain("strokeWidth");
      expect(result.result).toContain("strokeLinecap");
      expect(result.result).toContain("strokeLinejoin");
    });
  });
});
