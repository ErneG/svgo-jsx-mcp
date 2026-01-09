import { prisma } from "@/lib/prisma";
import type { ApiKey, Prisma } from "@/generated/prisma/client";
import crypto from "crypto";

export type ApiKeyWithRequestCount = ApiKey & {
  _count: { requests: number };
};

export class ApiKeyRepository {
  /**
   * Generate a secure API key
   */
  private generateKey(): string {
    return `svgo_${crypto.randomBytes(32).toString("hex")}`;
  }

  /**
   * Find an API key by ID
   */
  async findById(id: string): Promise<ApiKey | null> {
    return prisma.apiKey.findUnique({
      where: { id },
    });
  }

  /**
   * Find an API key by key value
   */
  async findByKey(key: string): Promise<ApiKey | null> {
    return prisma.apiKey.findUnique({
      where: { key },
    });
  }

  /**
   * Find all API keys for a user
   */
  async findByUserId(userId: string): Promise<ApiKey[]> {
    return prisma.apiKey.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Find all API keys with request counts for a user
   */
  async findByUserIdWithCounts(userId: string): Promise<ApiKeyWithRequestCount[]> {
    return prisma.apiKey.findMany({
      where: { userId },
      include: {
        _count: {
          select: { requests: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Create a new API key
   */
  async create(data: { name?: string; userId?: string; rateLimit?: number }): Promise<ApiKey> {
    return prisma.apiKey.create({
      data: {
        key: this.generateKey(),
        name: data.name,
        userId: data.userId,
        rateLimit: data.rateLimit ?? 100,
      },
    });
  }

  /**
   * Update an API key
   */
  async update(id: string, data: Prisma.ApiKeyUpdateInput): Promise<ApiKey> {
    return prisma.apiKey.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete an API key
   */
  async delete(id: string): Promise<ApiKey> {
    return prisma.apiKey.delete({
      where: { id },
    });
  }

  /**
   * Check if an API key belongs to a user
   */
  async belongsToUser(keyId: string, userId: string): Promise<boolean> {
    const key = await prisma.apiKey.findFirst({
      where: {
        id: keyId,
        userId,
      },
    });
    return key !== null;
  }

  /**
   * Regenerate an API key (create new key value)
   */
  async regenerate(id: string): Promise<ApiKey> {
    return prisma.apiKey.update({
      where: { id },
      data: {
        key: this.generateKey(),
      },
    });
  }
}

export const apiKeyRepository = new ApiKeyRepository();
