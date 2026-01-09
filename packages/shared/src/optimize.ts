import { optimize } from "svgo";
import { sanitizeSvg, checkSvgSecurity, validateContentSize } from "./sanitizer.js";

export interface OptimizeSvgArgs {
  content: string;
  filename?: string;
  camelCase?: boolean;
  /** Sanitize SVG to remove XSS vectors (default: true for API, false for CLI) */
  sanitize?: boolean;
  /** Maximum content size in bytes (default: 1MB) */
  maxSize?: number;
}

export interface OptimizeResult {
  success: boolean;
  filename: string;
  optimization: {
    originalSize: number;
    optimizedSize: number;
    savedBytes: number;
    savedPercent: string;
    ratio: string;
  };
  camelCaseApplied: boolean;
  sanitized: boolean;
  securityWarnings?: string[];
  result: string;
}

/**
 * Convert kebab-case string to camelCase
 */
function kebabToCamelCase(str: string): string {
  return str.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
}

/**
 * Convert all kebab-case attributes in SVG to camelCase for JSX compatibility
 */
function convertAttributesToCamelCase(svg: string): string {
  // Match attribute names in the format: name="value" or name='value'
  // This regex finds attributes with kebab-case names
  return svg.replace(
    /\s([a-z][a-z0-9]*(?:-[a-z0-9]+)+)(\s*=\s*["'][^"']*["'])/gi,
    (match, attrName: string, attrValue: string) => {
      const camelCaseName = kebabToCamelCase(attrName);
      return ` ${camelCaseName}${attrValue}`;
    }
  );
}

/**
 * Optimize SVG content using SVGO with optional sanitization and camelCase conversion
 */
export function optimizeSvg({
  content,
  filename,
  camelCase = true,
  sanitize = false,
  maxSize,
}: OptimizeSvgArgs): OptimizeResult {
  // Validate input
  const trimmedContent = content.trim();
  if (!trimmedContent.startsWith("<svg") && !trimmedContent.startsWith("<?xml")) {
    throw new Error("Invalid SVG content: must start with <svg or <?xml");
  }

  // Validate content size if maxSize is specified
  if (maxSize) {
    validateContentSize(trimmedContent, maxSize);
  }

  // Sanitize SVG content if enabled
  let processedContent = trimmedContent;
  let securityWarnings: string[] = [];

  if (sanitize) {
    const sanitizeResult = sanitizeSvg(trimmedContent);
    processedContent = sanitizeResult.sanitized;
    securityWarnings = sanitizeResult.issues;
  } else {
    // Still check for security issues even if not sanitizing (for warnings)
    securityWarnings = checkSvgSecurity(trimmedContent);
  }

  // Optimize with SVGO
  const result = optimize(processedContent, {
    multipass: true,
  });

  let optimizedSvg = result.data;

  // Convert to camelCase if enabled
  const camelCaseApplied = camelCase !== false;
  if (camelCaseApplied) {
    optimizedSvg = convertAttributesToCamelCase(optimizedSvg);
  }

  // Calculate metrics
  const originalSize = Buffer.byteLength(trimmedContent, "utf8");
  const optimizedSize = Buffer.byteLength(optimizedSvg, "utf8");
  const savedBytes = originalSize - optimizedSize;
  const savedPercent = ((savedBytes / originalSize) * 100).toFixed(1);
  const ratio = (optimizedSize / originalSize).toFixed(3);

  return {
    success: true,
    filename: filename || "untitled.svg",
    optimization: {
      originalSize,
      optimizedSize,
      savedBytes,
      savedPercent: `${savedPercent}%`,
      ratio,
    },
    camelCaseApplied,
    sanitized: sanitize,
    securityWarnings: securityWarnings.length > 0 ? securityWarnings : undefined,
    result: optimizedSvg,
  };
}
