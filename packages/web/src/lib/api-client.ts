import type {
  OptimizeSvgRequest,
  OptimizeSvgResponse,
  BatchOptimizeRequest,
  BatchOptimizeResponse,
  ApiKeyResponse,
  CreateApiKeyRequest,
  StatsResponse,
  HealthResponse,
} from "@svgo-jsx/shared";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

class ApiClient {
  private baseUrl: string;
  private adminSecret?: string;

  constructor(baseUrl: string = API_URL) {
    this.baseUrl = baseUrl;
    this.adminSecret = process.env.ADMIN_SECRET;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Request failed" }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Public endpoints (no auth)
  async health(): Promise<HealthResponse> {
    return this.request("/health");
  }

  async optimize(data: OptimizeSvgRequest): Promise<OptimizeSvgResponse> {
    return this.request("/mcp/optimize", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async optimizeBatch(data: BatchOptimizeRequest): Promise<BatchOptimizeResponse> {
    return this.request("/mcp/optimize/batch", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Admin endpoints (requires admin secret)
  async getApiKeys(): Promise<ApiKeyResponse[]> {
    return this.request("/admin/keys", {
      headers: {
        "X-Admin-Secret": this.adminSecret || "",
      },
    });
  }

  async createApiKey(data: CreateApiKeyRequest): Promise<ApiKeyResponse> {
    return this.request("/admin/keys", {
      method: "POST",
      headers: {
        "X-Admin-Secret": this.adminSecret || "",
      },
      body: JSON.stringify(data),
    });
  }

  async deleteApiKey(id: string): Promise<void> {
    return this.request(`/admin/keys/${id}`, {
      method: "DELETE",
      headers: {
        "X-Admin-Secret": this.adminSecret || "",
      },
    });
  }

  async updateApiKey(
    id: string,
    data: { enabled?: boolean; rateLimit?: number }
  ): Promise<ApiKeyResponse> {
    return this.request(`/admin/keys/${id}`, {
      method: "PATCH",
      headers: {
        "X-Admin-Secret": this.adminSecret || "",
      },
      body: JSON.stringify(data),
    });
  }

  async getStats(): Promise<StatsResponse> {
    return this.request("/admin/stats", {
      headers: {
        "X-Admin-Secret": this.adminSecret || "",
      },
    });
  }
}

export const apiClient = new ApiClient();
export { ApiClient };
