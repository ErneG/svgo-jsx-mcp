import { describe, it, expect } from "vitest";
import { sanitizeSvg, checkSvgSecurity } from "../security/sanitizer.js";
import { validateContentSize } from "../security/limits.js";

describe("SVG Sanitizer", () => {
  describe("sanitizeSvg", () => {
    it("should remove script elements", () => {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg">
        <script>alert('xss')</script>
        <rect width="100" height="100"/>
      </svg>`;

      const result = sanitizeSvg(svg);

      expect(result.modified).toBe(true);
      expect(result.sanitized).not.toContain("<script");
      expect(result.sanitized).not.toContain("</script>");
      expect(result.sanitized).toContain("<rect");
      expect(result.issues).toContain("Removed <script> element(s)");
    });

    it("should remove event handlers", () => {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" onclick="alert('xss')">
        <rect width="100" height="100" onload="alert('xss')"/>
      </svg>`;

      const result = sanitizeSvg(svg);

      expect(result.modified).toBe(true);
      expect(result.sanitized).not.toContain("onclick");
      expect(result.sanitized).not.toContain("onload");
      expect(result.issues.some((i) => i.includes("onclick"))).toBe(true);
    });

    it("should remove javascript URLs", () => {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg">
        <a href="javascript:alert('xss')">
          <rect width="100" height="100"/>
        </a>
      </svg>`;

      const result = sanitizeSvg(svg);

      expect(result.modified).toBe(true);
      expect(result.sanitized).not.toContain("javascript:");
      expect(result.issues.some((i) => i.includes("javascript:"))).toBe(true);
    });

    it("should remove dangerous elements", () => {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg">
        <foreignObject width="100" height="100">
          <div>HTML content</div>
        </foreignObject>
        <rect width="100" height="100"/>
      </svg>`;

      const result = sanitizeSvg(svg);

      expect(result.modified).toBe(true);
      expect(result.sanitized).not.toContain("<foreignObject");
      expect(result.sanitized).toContain("<rect");
    });

    it("should not modify safe SVG", () => {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" fill="red"/>
        <circle cx="50" cy="50" r="40"/>
      </svg>`;

      const result = sanitizeSvg(svg);

      expect(result.modified).toBe(false);
      expect(result.sanitized).toBe(svg);
      expect(result.issues).toHaveLength(0);
    });

    it("should respect removeScripts option", () => {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg">
        <script>alert('xss')</script>
      </svg>`;

      const resultWithRemove = sanitizeSvg(svg, { removeScripts: true });
      expect(resultWithRemove.sanitized).not.toContain("<script");

      const resultWithoutRemove = sanitizeSvg(svg, { removeScripts: false });
      expect(resultWithoutRemove.sanitized).toContain("<script");
    });
  });

  describe("checkSvgSecurity", () => {
    it("should detect script elements", () => {
      const svg = `<svg><script>alert('xss')</script></svg>`;
      const warnings = checkSvgSecurity(svg);

      expect(warnings.some((w) => w.includes("<script>"))).toBe(true);
    });

    it("should detect event handlers", () => {
      const svg = `<svg onclick="alert('xss')"><rect/></svg>`;
      const warnings = checkSvgSecurity(svg);

      expect(warnings.some((w) => w.includes("onclick"))).toBe(true);
    });

    it("should detect javascript URLs", () => {
      const svg = `<svg><a href="javascript:alert()"><rect/></a></svg>`;
      const warnings = checkSvgSecurity(svg);

      expect(warnings.some((w) => w.includes("javascript:"))).toBe(true);
    });

    it("should return empty array for safe SVG", () => {
      const svg = `<svg><rect width="100" height="100"/></svg>`;
      const warnings = checkSvgSecurity(svg);

      expect(warnings).toHaveLength(0);
    });
  });
});

describe("Content Size Validation", () => {
  it("should not throw for content under limit", () => {
    const content = "x".repeat(1000);
    expect(() => validateContentSize(content, 2000)).not.toThrow();
  });

  it("should throw for content over limit", () => {
    const content = "x".repeat(2000);
    expect(() => validateContentSize(content, 1000)).toThrow(/too large/);
  });

  it("should include size in error message", () => {
    const content = "x".repeat(2000);
    expect(() => validateContentSize(content, 1000)).toThrow(/2/);
  });
});
