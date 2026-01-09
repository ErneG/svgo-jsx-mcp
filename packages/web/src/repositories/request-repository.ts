import { prisma } from "@/lib/prisma";
import type { Request, Prisma } from "@/generated/prisma/client";

export interface CreateRequestData {
  apiKeyId: string;
  filename?: string;
  originalSize: number;
  optimizedSize: number;
  savedBytes: number;
  camelCase: boolean;
  success: boolean;
  errorMessage?: string;
}

export interface RequestFilters {
  apiKeyId?: string;
  userId?: string;
  success?: boolean;
  startDate?: Date;
  endDate?: Date;
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export class RequestRepository {
  /**
   * Create a new request record
   */
  async create(data: CreateRequestData): Promise<Request> {
    return prisma.request.create({
      data,
    });
  }

  /**
   * Create multiple request records (for batch operations)
   */
  async createMany(data: CreateRequestData[]): Promise<{ count: number }> {
    return prisma.request.createMany({
      data,
    });
  }

  /**
   * Find a request by ID
   */
  async findById(id: string): Promise<Request | null> {
    return prisma.request.findUnique({
      where: { id },
    });
  }

  /**
   * Find requests with filters and pagination
   */
  async findMany(
    filters: RequestFilters,
    pagination: PaginationOptions
  ): Promise<{ requests: Request[]; total: number }> {
    const where: Prisma.RequestWhereInput = {};

    if (filters.apiKeyId) {
      where.apiKeyId = filters.apiKeyId;
    }

    if (filters.userId) {
      where.apiKey = {
        userId: filters.userId,
      };
    }

    if (filters.success !== undefined) {
      where.success = filters.success;
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    const [requests, total] = await Promise.all([
      prisma.request.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
      }),
      prisma.request.count({ where }),
    ]);

    return { requests, total };
  }

  /**
   * Get requests from the last 24 hours for a user
   */
  async getLast24HoursForUser(userId: string): Promise<number> {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    return prisma.request.count({
      where: {
        apiKey: {
          userId,
        },
        createdAt: {
          gte: oneDayAgo,
        },
      },
    });
  }

  /**
   * Get request statistics by API key for a user
   */
  async getStatsByApiKey(userId: string): Promise<
    Array<{
      apiKeyId: string;
      keyName: string | null;
      requestCount: number;
      bytesSaved: bigint;
    }>
  > {
    const result = await prisma.request.groupBy({
      by: ["apiKeyId"],
      where: {
        apiKey: {
          userId,
        },
      },
      _count: {
        id: true,
      },
      _sum: {
        savedBytes: true,
      },
    });

    // Fetch key names
    const keyIds = result.map((r) => r.apiKeyId);
    const keys = await prisma.apiKey.findMany({
      where: { id: { in: keyIds } },
      select: { id: true, name: true },
    });

    const keyNameMap = new Map(keys.map((k) => [k.id, k.name]));

    return result.map((r) => ({
      apiKeyId: r.apiKeyId,
      keyName: keyNameMap.get(r.apiKeyId) ?? null,
      requestCount: r._count.id,
      bytesSaved: BigInt(r._sum.savedBytes ?? 0),
    }));
  }

  /**
   * Get time series data for charts
   */
  async getTimeSeries(
    userId: string,
    days: number = 30
  ): Promise<Array<{ date: string; requests: number; bytesSaved: number }>> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const requests = await prisma.request.findMany({
      where: {
        apiKey: {
          userId,
        },
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        createdAt: true,
        savedBytes: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Group by date
    const dataByDate = new Map<string, { requests: number; bytesSaved: number }>();

    for (const req of requests) {
      const dateKey = req.createdAt.toISOString().split("T")[0];
      const existing = dataByDate.get(dateKey) ?? { requests: 0, bytesSaved: 0 };
      existing.requests += 1;
      existing.bytesSaved += req.savedBytes;
      dataByDate.set(dateKey, existing);
    }

    // Fill in missing dates
    const result: Array<{ date: string; requests: number; bytesSaved: number }> = [];
    const currentDate = new Date(startDate);
    const endDate = new Date();

    while (currentDate <= endDate) {
      const dateKey = currentDate.toISOString().split("T")[0];
      const data = dataByDate.get(dateKey) ?? { requests: 0, bytesSaved: 0 };
      result.push({
        date: dateKey,
        ...data,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return result;
  }
}

export const requestRepository = new RequestRepository();
