import type { Context, Next } from "hono";

export interface LimitsOptions {
  /** Maximum request body size in bytes (default: 1MB) */
  maxBodySize?: number;
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
}

const DEFAULT_MAX_BODY_SIZE = 1024 * 1024; // 1MB
const DEFAULT_TIMEOUT = 30000; // 30 seconds

/**
 * Create a middleware that enforces request size and timeout limits
 */
export function createLimitsMiddleware(options: LimitsOptions = {}) {
  const { maxBodySize = DEFAULT_MAX_BODY_SIZE, timeout = DEFAULT_TIMEOUT } = options;

  return async (c: Context, next: Next) => {
    // Check Content-Length header
    const contentLength = c.req.header("content-length");
    if (contentLength) {
      const size = parseInt(contentLength, 10);
      if (!isNaN(size) && size > maxBodySize) {
        return c.json(
          {
            success: false,
            error: `Request body too large. Maximum size is ${formatBytes(maxBodySize)}.`,
          },
          413
        );
      }
    }

    // Set up timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeout);

    try {
      // Store original abort controller if present
      const originalSignal = c.req.raw.signal;

      // Create a composite abort that triggers on either timeout or original abort
      if (originalSignal) {
        originalSignal.addEventListener("abort", () => controller.abort());
      }

      await next();
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return c.json(
          {
            success: false,
            error: `Request timed out after ${timeout / 1000} seconds.`,
          },
          408
        );
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  };
}

/**
 * Validate SVG content size
 */
export function validateContentSize(
  content: string,
  maxSize: number = DEFAULT_MAX_BODY_SIZE
): void {
  const size = Buffer.byteLength(content, "utf8");
  if (size > maxSize) {
    throw new Error(
      `SVG content too large (${formatBytes(size)}). Maximum size is ${formatBytes(maxSize)}.`
    );
  }
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  const k = 1024;
  const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
  const size = bytes / Math.pow(k, i);

  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

/**
 * Get configured limits from environment variables
 */
export function getLimitsFromEnv(): LimitsOptions {
  const maxBodySize = process.env.MAX_BODY_SIZE
    ? parseInt(process.env.MAX_BODY_SIZE, 10)
    : DEFAULT_MAX_BODY_SIZE;

  const timeout = process.env.REQUEST_TIMEOUT
    ? parseInt(process.env.REQUEST_TIMEOUT, 10)
    : DEFAULT_TIMEOUT;

  return { maxBodySize, timeout };
}
