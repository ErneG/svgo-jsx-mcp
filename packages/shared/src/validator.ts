/**
 * SVG Validator
 *
 * Checks SVG content for common issues including:
 * - Accessibility (missing title, desc)
 * - Best practices (inline styles, deprecated elements)
 * - Browser compatibility
 */

export type ValidationSeverity = "error" | "warning" | "info";

export interface ValidationIssue {
  severity: ValidationSeverity;
  code: string;
  message: string;
  suggestion?: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  summary: {
    errors: number;
    warnings: number;
    info: number;
  };
}

/**
 * Validate SVG content for common issues
 */
export function validateSvg(content: string): ValidationResult {
  const issues: ValidationIssue[] = [];

  // Trim and check if it's valid SVG
  const trimmedContent = content.trim();
  if (!trimmedContent) {
    issues.push({
      severity: "error",
      code: "EMPTY_CONTENT",
      message: "SVG content is empty",
    });
    return createResult(issues);
  }

  if (!trimmedContent.includes("<svg") && !trimmedContent.includes("<?xml")) {
    issues.push({
      severity: "error",
      code: "NOT_SVG",
      message: "Content does not appear to be SVG",
    });
    return createResult(issues);
  }

  // Accessibility checks
  checkAccessibility(trimmedContent, issues);

  // Best practices checks
  checkBestPractices(trimmedContent, issues);

  // Deprecated elements check
  checkDeprecatedElements(trimmedContent, issues);

  // Browser compatibility checks
  checkBrowserCompatibility(trimmedContent, issues);

  return createResult(issues);
}

function createResult(issues: ValidationIssue[]): ValidationResult {
  const errors = issues.filter((i) => i.severity === "error").length;
  const warnings = issues.filter((i) => i.severity === "warning").length;
  const info = issues.filter((i) => i.severity === "info").length;

  return {
    valid: errors === 0,
    issues,
    summary: { errors, warnings, info },
  };
}

/**
 * Check for accessibility issues
 */
function checkAccessibility(content: string, issues: ValidationIssue[]): void {
  // Check for missing <title>
  if (!/<title[^>]*>/.test(content)) {
    issues.push({
      severity: "warning",
      code: "MISSING_TITLE",
      message: "SVG is missing a <title> element",
      suggestion: "Add a <title> element for screen readers, e.g., <title>Icon description</title>",
    });
  }

  // Check for missing <desc>
  if (!/<desc[^>]*>/.test(content)) {
    issues.push({
      severity: "info",
      code: "MISSING_DESC",
      message: "SVG is missing a <desc> element",
      suggestion: "Consider adding a <desc> element for a longer description of the SVG content",
    });
  }

  // Check for missing role attribute on svg element
  if (!/<svg[^>]*role=/.test(content)) {
    issues.push({
      severity: "info",
      code: "MISSING_ROLE",
      message: "SVG is missing a role attribute",
      suggestion:
        'Add role="img" for decorative images or role="graphics-document" for complex graphics',
    });
  }

  // Check for missing aria-label or aria-labelledby
  const hasAriaLabel = /<svg[^>]*aria-label/.test(content);
  const hasAriaLabelledby = /<svg[^>]*aria-labelledby/.test(content);
  const hasTitle = /<title[^>]*>/.test(content);

  if (!hasAriaLabel && !hasAriaLabelledby && !hasTitle) {
    issues.push({
      severity: "warning",
      code: "NO_ACCESSIBLE_NAME",
      message: "SVG has no accessible name",
      suggestion: "Add aria-label, aria-labelledby, or a <title> element for accessibility",
    });
  }
}

/**
 * Check for best practices violations
 */
function checkBestPractices(content: string, issues: ValidationIssue[]): void {
  // Check for inline styles
  if (/style\s*=\s*["'][^"']+["']/.test(content)) {
    issues.push({
      severity: "warning",
      code: "INLINE_STYLES",
      message: "SVG contains inline styles",
      suggestion:
        "Consider using CSS classes or presentation attributes instead of inline styles for better maintainability",
    });
  }

  // Check for <style> elements (might be intentional, so just info)
  if (/<style[^>]*>/.test(content)) {
    issues.push({
      severity: "info",
      code: "EMBEDDED_STYLES",
      message: "SVG contains embedded <style> element",
      suggestion:
        "Embedded styles may increase file size. Consider extracting to external CSS if reused",
    });
  }

  // Check for script elements (security concern)
  if (/<script[^>]*>/.test(content)) {
    issues.push({
      severity: "error",
      code: "SCRIPT_ELEMENT",
      message: "SVG contains <script> element",
      suggestion: "Remove script elements for security. SVG scripts can execute JavaScript",
    });
  }

  // Check for event handlers (security concern)
  const eventHandlerPattern = /\bon\w+\s*=\s*["'][^"']*["']/i;
  if (eventHandlerPattern.test(content)) {
    issues.push({
      severity: "error",
      code: "EVENT_HANDLERS",
      message: "SVG contains inline event handlers",
      suggestion: "Remove inline event handlers (onclick, onload, etc.) for security",
    });
  }

  // Check for external references (xlink:href to external URLs)
  const externalHrefPattern = /xlink:href\s*=\s*["']https?:\/\//i;
  if (externalHrefPattern.test(content)) {
    issues.push({
      severity: "warning",
      code: "EXTERNAL_REFERENCE",
      message: "SVG contains external resource references",
      suggestion: "External references may not load in all contexts and can be a security concern",
    });
  }

  // Check for missing viewBox
  if (/<svg[^>]*>/.test(content) && !/<svg[^>]*viewBox/.test(content)) {
    issues.push({
      severity: "warning",
      code: "MISSING_VIEWBOX",
      message: "SVG is missing viewBox attribute",
      suggestion: 'Add viewBox attribute for proper scaling, e.g., viewBox="0 0 24 24"',
    });
  }

  // Check for hardcoded colors that could be currentColor
  const hardcodedBlackPattern = /fill\s*=\s*["']#000(?:000)?["']/gi;
  const hardcodedWhitePattern = /fill\s*=\s*["']#fff(?:fff)?["']/gi;
  if (hardcodedBlackPattern.test(content) || hardcodedWhitePattern.test(content)) {
    issues.push({
      severity: "info",
      code: "HARDCODED_COLORS",
      message: "SVG contains hardcoded black/white colors",
      suggestion: 'Consider using fill="currentColor" for better theme compatibility',
    });
  }
}

/**
 * Check for deprecated SVG elements
 */
function checkDeprecatedElements(content: string, issues: ValidationIssue[]): void {
  const deprecatedElements = [
    { element: "altGlyph", replacement: "text" },
    { element: "altGlyphDef", replacement: "none" },
    { element: "altGlyphItem", replacement: "none" },
    { element: "animateColor", replacement: "animate" },
    { element: "cursor", replacement: "CSS cursor" },
    { element: "font", replacement: "CSS @font-face" },
    { element: "font-face", replacement: "CSS @font-face" },
    { element: "font-face-format", replacement: "CSS @font-face" },
    { element: "font-face-name", replacement: "CSS @font-face" },
    { element: "font-face-src", replacement: "CSS @font-face" },
    { element: "font-face-uri", replacement: "CSS @font-face" },
    { element: "glyph", replacement: "none" },
    { element: "glyphRef", replacement: "none" },
    { element: "hkern", replacement: "none" },
    { element: "missing-glyph", replacement: "none" },
    { element: "tref", replacement: "text" },
    { element: "vkern", replacement: "none" },
  ];

  for (const { element, replacement } of deprecatedElements) {
    const regex = new RegExp(`<${element}[\\s>]`, "i");
    if (regex.test(content)) {
      issues.push({
        severity: "warning",
        code: "DEPRECATED_ELEMENT",
        message: `SVG contains deprecated <${element}> element`,
        suggestion:
          replacement !== "none"
            ? `Use <${replacement}> instead`
            : `Remove deprecated <${element}> element`,
      });
    }
  }
}

/**
 * Check for browser compatibility issues
 */
function checkBrowserCompatibility(content: string, issues: ValidationIssue[]): void {
  // Check for foreignObject (limited support)
  if (/<foreignObject[^>]*>/.test(content)) {
    issues.push({
      severity: "info",
      code: "FOREIGN_OBJECT",
      message: "SVG uses <foreignObject> element",
      suggestion: "foreignObject may not render consistently across all browsers and contexts",
    });
  }

  // Check for SMIL animations (deprecated in Chrome)
  const smilElements = ["animate", "animateMotion", "animateTransform", "set"];
  for (const element of smilElements) {
    const regex = new RegExp(`<${element}[\\s>]`, "i");
    if (regex.test(content)) {
      issues.push({
        severity: "info",
        code: "SMIL_ANIMATION",
        message: `SVG uses SMIL animation (<${element}>)`,
        suggestion:
          "Consider using CSS animations for better browser support. SMIL was deprecated in Chrome (but later un-deprecated)",
      });
      break; // Only warn once about SMIL
    }
  }

  // Check for filter effects (can be slow)
  if (/<filter[^>]*>/.test(content)) {
    issues.push({
      severity: "info",
      code: "FILTER_EFFECTS",
      message: "SVG uses filter effects",
      suggestion: "SVG filters can impact rendering performance, especially on mobile devices",
    });
  }
}

export default validateSvg;
