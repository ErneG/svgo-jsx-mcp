import { describe, it, expect } from "vitest";
import { sanitizeSvg, checkSvgSecurity, validateContentSize, formatBytes } from "../sanitizer.js";

describe("sanitizeSvg", () => {
  describe("script element removal", () => {
    it("should remove inline script elements", () => {
      const svg =
        '<svg xmlns="http://www.w3.org/2000/svg"><script>alert("xss")</script><path d="M0 0"/></svg>';

      const result = sanitizeSvg(svg);

      expect(result.modified).toBe(true);
      expect(result.sanitized).not.toContain("<script>");
      expect(result.sanitized).not.toContain("</script>");
      expect(result.sanitized).not.toContain('alert("xss")');
      expect(result.issues).toContain("Removed <script> element(s)");
    });

    it("should remove self-closing script elements", () => {
      const svg =
        '<svg xmlns="http://www.w3.org/2000/svg"><script src="evil.js"/><path d="M0 0"/></svg>';

      const result = sanitizeSvg(svg);

      expect(result.modified).toBe(true);
      expect(result.sanitized).not.toContain("<script");
    });

    it("should remove multiple script elements", () => {
      const svg =
        '<svg xmlns="http://www.w3.org/2000/svg"><script>a()</script><rect/><script>b()</script></svg>';

      const result = sanitizeSvg(svg);

      expect(result.sanitized).not.toContain("<script>");
      expect(result.sanitized).not.toContain("</script>");
    });
  });

  describe("dangerous element removal", () => {
    it("should remove iframe elements", () => {
      const svg =
        '<svg xmlns="http://www.w3.org/2000/svg"><foreignObject><iframe src="evil.html"></iframe></foreignObject></svg>';

      const result = sanitizeSvg(svg);

      expect(result.sanitized).not.toContain("<iframe");
      expect(result.sanitized).not.toContain("</iframe>");
      expect(result.issues).toContain("Removed <iframe> element(s)");
    });

    it("should remove foreignObject elements", () => {
      const svg =
        '<svg xmlns="http://www.w3.org/2000/svg"><foreignObject><div>HTML content</div></foreignObject></svg>';

      const result = sanitizeSvg(svg);

      expect(result.sanitized).not.toContain("<foreignObject");
      expect(result.issues).toContain("Removed <foreignObject> element(s)");
    });

    it("should remove embed elements", () => {
      const svg = '<svg xmlns="http://www.w3.org/2000/svg"><embed src="evil.swf"/></svg>';

      const result = sanitizeSvg(svg);

      expect(result.sanitized).not.toContain("<embed");
      expect(result.issues).toContain("Removed <embed> element(s)");
    });

    it("should remove object elements", () => {
      const svg =
        '<svg xmlns="http://www.w3.org/2000/svg"><object data="evil.html"></object></svg>';

      const result = sanitizeSvg(svg);

      expect(result.sanitized).not.toContain("<object");
      expect(result.issues).toContain("Removed <object> element(s)");
    });

    it("should remove applet elements", () => {
      const svg =
        '<svg xmlns="http://www.w3.org/2000/svg"><applet code="Evil.class"></applet></svg>';

      const result = sanitizeSvg(svg);

      expect(result.sanitized).not.toContain("<applet");
      expect(result.issues).toContain("Removed <applet> element(s)");
    });

    it("should remove base elements", () => {
      const svg = '<svg xmlns="http://www.w3.org/2000/svg"><base href="http://evil.com/"/></svg>';

      const result = sanitizeSvg(svg);

      expect(result.sanitized).not.toContain("<base");
      expect(result.issues).toContain("Removed <base> element(s)");
    });

    it("should remove link elements", () => {
      const svg =
        '<svg xmlns="http://www.w3.org/2000/svg"><link rel="stylesheet" href="evil.css"/></svg>';

      const result = sanitizeSvg(svg);

      expect(result.sanitized).not.toContain("<link");
      expect(result.issues).toContain("Removed <link> element(s)");
    });

    it("should remove meta elements", () => {
      const svg =
        '<svg xmlns="http://www.w3.org/2000/svg"><meta http-equiv="refresh" content="0;url=evil.html"/></svg>';

      const result = sanitizeSvg(svg);

      expect(result.sanitized).not.toContain("<meta");
      expect(result.issues).toContain("Removed <meta> element(s)");
    });
  });

  describe("event handler removal", () => {
    it("should remove onclick handler", () => {
      const svg =
        '<svg xmlns="http://www.w3.org/2000/svg" onclick="alert(1)"><path d="M0 0"/></svg>';

      const result = sanitizeSvg(svg);

      expect(result.modified).toBe(true);
      expect(result.sanitized).not.toContain("onclick");
      expect(result.issues).toContain("Removed onclick attribute(s)");
    });

    it("should remove onload handler", () => {
      const svg = '<svg xmlns="http://www.w3.org/2000/svg" onload="evil()"><path d="M0 0"/></svg>';

      const result = sanitizeSvg(svg);

      expect(result.sanitized).not.toContain("onload");
      expect(result.issues).toContain("Removed onload attribute(s)");
    });

    it("should remove onerror handler", () => {
      const svg =
        '<svg xmlns="http://www.w3.org/2000/svg"><image onerror="alert(1)" href="x"/></svg>';

      const result = sanitizeSvg(svg);

      expect(result.sanitized).not.toContain("onerror");
      expect(result.issues).toContain("Removed onerror attribute(s)");
    });

    it("should remove onmouseover handler", () => {
      const svg =
        '<svg xmlns="http://www.w3.org/2000/svg"><rect onmouseover="evil()" width="100" height="100"/></svg>';

      const result = sanitizeSvg(svg);

      expect(result.sanitized).not.toContain("onmouseover");
    });

    it("should remove onfocus handler", () => {
      const svg = '<svg xmlns="http://www.w3.org/2000/svg"><input onfocus="evil()"/></svg>';

      const result = sanitizeSvg(svg);

      expect(result.sanitized).not.toContain("onfocus");
    });

    it("should remove multiple event handlers from the same element", () => {
      const svg =
        '<svg xmlns="http://www.w3.org/2000/svg" onclick="a()" onload="b()" onmouseover="c()"><path d="M0 0"/></svg>';

      const result = sanitizeSvg(svg);

      expect(result.sanitized).not.toContain("onclick");
      expect(result.sanitized).not.toContain("onload");
      expect(result.sanitized).not.toContain("onmouseover");
    });

    it("should handle event handlers with single quotes", () => {
      const svg =
        '<svg xmlns="http://www.w3.org/2000/svg" onclick=\'alert(1)\'><path d="M0 0"/></svg>';

      const result = sanitizeSvg(svg);

      expect(result.sanitized).not.toContain("onclick");
    });
  });

  describe("dangerous URL removal", () => {
    it("should remove javascript: URLs in href", () => {
      const svg =
        '<svg xmlns="http://www.w3.org/2000/svg"><a href="javascript:alert(1)"><rect width="100" height="100"/></a></svg>';

      const result = sanitizeSvg(svg);

      expect(result.sanitized).not.toContain("javascript:");
      expect(result.issues).toContain("Removed javascript: URL(s)");
    });

    it("should remove javascript: URLs in xlink:href", () => {
      const svg =
        '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><a xlink:href="javascript:evil()"><rect/></a></svg>';

      const result = sanitizeSvg(svg);

      expect(result.sanitized).not.toContain("javascript:");
    });

    it("should remove vbscript: URLs", () => {
      const svg =
        '<svg xmlns="http://www.w3.org/2000/svg"><a href="vbscript:msgbox(1)"><rect/></a></svg>';

      const result = sanitizeSvg(svg);

      expect(result.sanitized).not.toContain("vbscript:");
      expect(result.issues).toContain("Removed vbscript: URL(s)");
    });

    it("should remove data:text/html URLs", () => {
      const svg =
        '<svg xmlns="http://www.w3.org/2000/svg"><a href="data:text/html,<script>alert(1)</script>"><rect/></a></svg>';

      const result = sanitizeSvg(svg);

      expect(result.sanitized).not.toContain("data:text/html");
    });

    it("should remove data:application/ URLs", () => {
      const svg =
        '<svg xmlns="http://www.w3.org/2000/svg"><a href="data:application/javascript,alert(1)"><rect/></a></svg>';

      const result = sanitizeSvg(svg);

      expect(result.sanitized).not.toContain("data:application/");
    });
  });

  describe("options", () => {
    it("should not remove scripts when removeScripts is false", () => {
      const svg = '<svg xmlns="http://www.w3.org/2000/svg"><script>code()</script></svg>';

      const result = sanitizeSvg(svg, { removeScripts: false, removeDangerousElements: false });

      expect(result.sanitized).toContain("<script>");
    });

    it("should not remove event handlers when removeEventHandlers is false", () => {
      const svg =
        '<svg xmlns="http://www.w3.org/2000/svg" onclick="handler()"><path d="M0 0"/></svg>';

      const result = sanitizeSvg(svg, { removeEventHandlers: false });

      expect(result.sanitized).toContain("onclick");
    });

    it("should not remove dangerous elements when removeDangerousElements is false", () => {
      const svg =
        '<svg xmlns="http://www.w3.org/2000/svg"><foreignObject><div>HTML</div></foreignObject></svg>';

      const result = sanitizeSvg(svg, { removeDangerousElements: false, removeScripts: false });

      expect(result.sanitized).toContain("<foreignObject>");
    });

    it("should not remove dangerous URLs when removeDangerousUrls is false", () => {
      const svg =
        '<svg xmlns="http://www.w3.org/2000/svg"><a href="javascript:void(0)"><rect/></a></svg>';

      const result = sanitizeSvg(svg, { removeDangerousUrls: false });

      expect(result.sanitized).toContain("javascript:");
    });
  });

  describe("clean SVG handling", () => {
    it("should not modify clean SVG", () => {
      const svg =
        '<svg xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="red"/></svg>';

      const result = sanitizeSvg(svg);

      expect(result.modified).toBe(false);
      expect(result.issues).toHaveLength(0);
      expect(result.sanitized).toBe(svg);
    });

    it("should preserve valid attributes", () => {
      const svg =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="blue"/></svg>';

      const result = sanitizeSvg(svg);

      expect(result.sanitized).toContain('viewBox="0 0 100 100"');
      expect(result.sanitized).toContain('cx="50"');
      expect(result.sanitized).toContain('cy="50"');
      expect(result.sanitized).toContain('r="40"');
      expect(result.sanitized).toContain('fill="blue"');
    });
  });
});

describe("checkSvgSecurity", () => {
  it("should detect script elements", () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>';

    const warnings = checkSvgSecurity(svg);

    expect(warnings).toContain("Contains potentially dangerous <script> element");
  });

  it("should detect foreignObject elements", () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg"><foreignObject><div>HTML</div></foreignObject></svg>';

    const warnings = checkSvgSecurity(svg);

    expect(warnings).toContain("Contains potentially dangerous <foreignObject> element");
  });

  it("should detect event handlers", () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" onclick="alert(1)"><path d="M0 0"/></svg>';

    const warnings = checkSvgSecurity(svg);

    expect(warnings).toContain("Contains event handler: onclick");
  });

  it("should detect multiple event handlers", () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" onclick="a()" onload="b()"><path d="M0 0"/></svg>';

    const warnings = checkSvgSecurity(svg);

    expect(warnings).toContain("Contains event handler: onclick");
    expect(warnings).toContain("Contains event handler: onload");
  });

  it("should detect javascript: URLs", () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg"><a href="javascript:alert(1)"><rect/></a></svg>';

    const warnings = checkSvgSecurity(svg);

    expect(warnings).toContain("Contains dangerous URL scheme: javascript:");
  });

  it("should detect data:text/html URLs", () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg"><a href="data:text/html,<script>evil()</script>"><rect/></a></svg>';

    const warnings = checkSvgSecurity(svg);

    expect(warnings).toContain("Contains dangerous URL scheme: data:text/html");
  });

  it("should return empty array for clean SVG", () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100"/></svg>';

    const warnings = checkSvgSecurity(svg);

    expect(warnings).toHaveLength(0);
  });

  it("should detect multiple security issues", () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" onclick="evil()"><script>code()</script><a href="javascript:x()"><rect/></a></svg>';

    const warnings = checkSvgSecurity(svg);

    expect(warnings.length).toBeGreaterThanOrEqual(3);
  });
});

describe("validateContentSize", () => {
  it("should not throw for content within size limit", () => {
    const content = '<svg xmlns="http://www.w3.org/2000/svg"><rect/></svg>';

    expect(() => validateContentSize(content, 1000)).not.toThrow();
  });

  it("should throw for content exceeding size limit", () => {
    const content = '<svg xmlns="http://www.w3.org/2000/svg"><rect/></svg>';

    expect(() => validateContentSize(content, 10)).toThrow(/SVG content too large/);
  });

  it("should use default 1MB limit when not specified", () => {
    const content = '<svg xmlns="http://www.w3.org/2000/svg"><rect/></svg>';

    expect(() => validateContentSize(content)).not.toThrow();
  });

  it("should handle exact size limit", () => {
    const content = "a".repeat(100);

    expect(() => validateContentSize(content, 100)).not.toThrow();
    expect(() => validateContentSize(content, 99)).toThrow();
  });

  it("should handle unicode characters correctly", () => {
    // Unicode characters may have more bytes than characters
    const unicodeContent = "\u{1F600}".repeat(10); // Emoji characters

    // Each emoji is 4 bytes in UTF-8
    expect(() => validateContentSize(unicodeContent, 40)).not.toThrow();
    expect(() => validateContentSize(unicodeContent, 39)).toThrow();
  });
});

describe("formatBytes", () => {
  it("should format 0 bytes", () => {
    expect(formatBytes(0)).toBe("0 B");
  });

  it("should format bytes", () => {
    expect(formatBytes(100)).toBe("100 B");
    expect(formatBytes(500)).toBe("500 B");
  });

  it("should format kilobytes", () => {
    expect(formatBytes(1024)).toBe("1.0 KB");
    expect(formatBytes(2048)).toBe("2.0 KB");
    expect(formatBytes(1536)).toBe("1.5 KB");
  });

  it("should format megabytes", () => {
    expect(formatBytes(1024 * 1024)).toBe("1.0 MB");
    expect(formatBytes(2.5 * 1024 * 1024)).toBe("2.5 MB");
  });

  it("should format gigabytes", () => {
    expect(formatBytes(1024 * 1024 * 1024)).toBe("1.0 GB");
  });

  it("should handle fractional kilobytes", () => {
    expect(formatBytes(1500)).toBe("1.5 KB");
  });

  it("should round to one decimal place for KB and above", () => {
    expect(formatBytes(1234)).toBe("1.2 KB");
    expect(formatBytes(1567)).toBe("1.5 KB");
  });
});
