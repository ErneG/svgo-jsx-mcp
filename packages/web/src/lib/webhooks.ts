/**
 * Webhook dispatcher for SVG optimization events
 *
 * Fires webhooks to configured URLs when optimization completes.
 * Handles failures gracefully and uses timeouts to prevent blocking.
 */

export interface WebhookPayload {
  event: "optimization.completed" | "optimization.failed";
  timestamp: string;
  data: {
    filename?: string;
    originalSize: number;
    optimizedSize: number;
    savedBytes: number;
    savedPercentage: number;
    camelCase: boolean;
    success: boolean;
    errorMessage?: string;
  };
  apiKey: {
    id: string;
    name: string | null;
  };
}

export interface WebhookResult {
  success: boolean;
  statusCode?: number;
  error?: string;
  durationMs: number;
}

const WEBHOOK_TIMEOUT_MS = 5000; // 5 second timeout

/**
 * Validates a webhook URL
 */
export function isValidWebhookUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    // Only allow HTTPS in production, HTTP for localhost/development
    if (parsed.protocol === "https:") {
      return true;
    }
    if (
      parsed.protocol === "http:" &&
      (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1")
    ) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Dispatches a webhook to the given URL
 *
 * Uses AbortController for timeout to prevent blocking the main request.
 * Failures are logged but don't throw to avoid breaking the optimization flow.
 */
export async function dispatchWebhook(
  webhookUrl: string,
  payload: WebhookPayload
): Promise<WebhookResult> {
  const startTime = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS);

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "SVGO-JSX-Webhook/1.0",
        "X-Webhook-Event": payload.event,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    return {
      success: response.ok,
      statusCode: response.status,
      durationMs: Date.now() - startTime,
    };
  } catch (error) {
    clearTimeout(timeoutId);

    const errorMessage =
      error instanceof Error
        ? error.name === "AbortError"
          ? "Webhook request timed out"
          : error.message
        : "Unknown error";

    console.error(`Webhook dispatch failed to ${webhookUrl}:`, errorMessage);

    return {
      success: false,
      error: errorMessage,
      durationMs: Date.now() - startTime,
    };
  }
}

/**
 * Creates a webhook payload for an optimization event
 */
export function createOptimizationPayload(
  data: {
    filename?: string;
    originalSize: number;
    optimizedSize: number;
    savedBytes: number;
    camelCase: boolean;
    success: boolean;
    errorMessage?: string;
  },
  apiKey: { id: string; name: string | null }
): WebhookPayload {
  const savedPercentage =
    data.originalSize > 0 ? Math.round((data.savedBytes / data.originalSize) * 100 * 10) / 10 : 0;

  return {
    event: data.success ? "optimization.completed" : "optimization.failed",
    timestamp: new Date().toISOString(),
    data: {
      ...data,
      savedPercentage,
    },
    apiKey,
  };
}

/**
 * Fire and forget webhook dispatch
 *
 * Dispatches webhook in background without waiting for result.
 * Use this when you don't need to track webhook delivery status.
 */
export function fireWebhookAsync(webhookUrl: string, payload: WebhookPayload): void {
  // Fire and forget - don't await
  dispatchWebhook(webhookUrl, payload).catch((error) => {
    console.error("Async webhook dispatch failed:", error);
  });
}
