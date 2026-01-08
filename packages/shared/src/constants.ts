export const DEFAULT_RATE_LIMIT = 100;
export const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

export const API_ENDPOINTS = {
  HEALTH: "/health",
  OPTIMIZE: "/mcp/optimize",
  OPTIMIZE_BATCH: "/mcp/optimize/batch",
  STATS: "/stats",
  ADMIN_KEYS: "/admin/keys",
} as const;
