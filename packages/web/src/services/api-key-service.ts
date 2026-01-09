import { apiKeyRepository, type ApiKeyWithRequestCount } from "@/repositories";
import type { ApiKey } from "@/generated/prisma/client";

export class ApiKeyNotFoundError extends Error {
  constructor(id: string) {
    super(`API key not found: ${id}`);
    this.name = "ApiKeyNotFoundError";
  }
}

export class ApiKeyUnauthorizedError extends Error {
  constructor() {
    super("You are not authorized to access this API key");
    this.name = "ApiKeyUnauthorizedError";
  }
}

export class ApiKeyService {
  /**
   * List all API keys for a user
   */
  async listKeys(userId: string): Promise<ApiKey[]> {
    return apiKeyRepository.findByUserId(userId);
  }

  /**
   * List all API keys with stats for a user
   */
  async listKeysWithStats(userId: string): Promise<ApiKeyWithRequestCount[]> {
    return apiKeyRepository.findByUserIdWithCounts(userId);
  }

  /**
   * Get a single API key (with authorization check)
   */
  async getKey(keyId: string, userId: string): Promise<ApiKey> {
    const key = await apiKeyRepository.findById(keyId);

    if (!key) {
      throw new ApiKeyNotFoundError(keyId);
    }

    if (key.userId !== userId) {
      throw new ApiKeyUnauthorizedError();
    }

    return key;
  }

  /**
   * Create a new API key for a user
   */
  async createKey(userId: string, data: { name?: string; rateLimit?: number }): Promise<ApiKey> {
    return apiKeyRepository.create({
      userId,
      name: data.name,
      rateLimit: data.rateLimit,
    });
  }

  /**
   * Update an API key (with authorization check)
   */
  async updateKey(
    keyId: string,
    userId: string,
    data: { name?: string; enabled?: boolean; rateLimit?: number }
  ): Promise<ApiKey> {
    const belongsToUser = await apiKeyRepository.belongsToUser(keyId, userId);

    if (!belongsToUser) {
      const key = await apiKeyRepository.findById(keyId);
      if (!key) {
        throw new ApiKeyNotFoundError(keyId);
      }
      throw new ApiKeyUnauthorizedError();
    }

    return apiKeyRepository.update(keyId, data);
  }

  /**
   * Delete an API key (with authorization check)
   */
  async deleteKey(keyId: string, userId: string): Promise<void> {
    const belongsToUser = await apiKeyRepository.belongsToUser(keyId, userId);

    if (!belongsToUser) {
      const key = await apiKeyRepository.findById(keyId);
      if (!key) {
        throw new ApiKeyNotFoundError(keyId);
      }
      throw new ApiKeyUnauthorizedError();
    }

    await apiKeyRepository.delete(keyId);
  }

  /**
   * Regenerate an API key (with authorization check)
   */
  async regenerateKey(keyId: string, userId: string): Promise<ApiKey> {
    const belongsToUser = await apiKeyRepository.belongsToUser(keyId, userId);

    if (!belongsToUser) {
      const key = await apiKeyRepository.findById(keyId);
      if (!key) {
        throw new ApiKeyNotFoundError(keyId);
      }
      throw new ApiKeyUnauthorizedError();
    }

    return apiKeyRepository.regenerate(keyId);
  }

  /**
   * Validate an API key for making requests
   */
  async validateKey(key: string): Promise<ApiKey | null> {
    const apiKey = await apiKeyRepository.findByKey(key);

    if (!apiKey || !apiKey.enabled) {
      return null;
    }

    return apiKey;
  }
}

export const apiKeyService = new ApiKeyService();
