export interface OptimizeSvgRequest {
  content: string;
  filename?: string;
  camelCase?: boolean;
}

export interface OptimizeSvgResponse {
  success: boolean;
  filename: string;
  optimization?: {
    originalSize: number;
    optimizedSize: number;
    savedBytes: number;
    savedPercent: string;
    ratio: string;
  };
  camelCaseApplied?: boolean;
  result?: string;
  error?: string;
}

export interface BatchOptimizeRequest {
  items: Array<{
    content: string;
    filename?: string;
  }>;
  camelCase?: boolean;
}

export interface BatchOptimizeResponse {
  success: boolean;
  total: number;
  successful: number;
  failed: number;
  results: OptimizeSvgResponse[];
}

export interface ApiKey {
  id: string;
  key: string;
  name: string | null;
  enabled: boolean;
  rateLimit: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateApiKeyRequest {
  name?: string;
  rateLimit?: number;
}

export interface ApiKeyResponse {
  id: string;
  key: string;
  name: string | null;
  enabled: boolean;
  rateLimit: number;
  createdAt: string;
}

export interface StatsResponse {
  global: {
    totalRequests: number;
    totalBytesSaved: string;
    successCount: number;
    errorCount: number;
    updatedAt: string | null;
  };
  last24Hours: {
    requests: number;
  };
  topKeys: Array<{
    apiKeyId: string;
    requestCount: number;
    bytesSaved: number;
  }>;
}

export interface HealthResponse {
  status: "ok" | "error";
  db: "connected" | "disconnected";
  timestamp: string;
}
