import { prisma } from "@/lib/prisma";
import type { Stats } from "@/generated/prisma/client";

const GLOBAL_STATS_ID = "global";

export class StatsRepository {
  /**
   * Get global statistics
   */
  async getGlobal(): Promise<Stats | null> {
    return prisma.stats.findUnique({
      where: { id: GLOBAL_STATS_ID },
    });
  }

  /**
   * Ensure global stats record exists
   */
  async ensureGlobalExists(): Promise<Stats> {
    return prisma.stats.upsert({
      where: { id: GLOBAL_STATS_ID },
      create: {
        id: GLOBAL_STATS_ID,
        totalRequests: 0,
        totalBytesSaved: BigInt(0),
        successCount: 0,
        errorCount: 0,
      },
      update: {},
    });
  }

  /**
   * Increment stats for a successful request
   */
  async incrementSuccess(bytesSaved: number): Promise<Stats> {
    return prisma.stats.upsert({
      where: { id: GLOBAL_STATS_ID },
      create: {
        id: GLOBAL_STATS_ID,
        totalRequests: 1,
        totalBytesSaved: BigInt(bytesSaved),
        successCount: 1,
        errorCount: 0,
      },
      update: {
        totalRequests: { increment: 1 },
        totalBytesSaved: { increment: bytesSaved },
        successCount: { increment: 1 },
      },
    });
  }

  /**
   * Increment stats for a failed request
   */
  async incrementError(): Promise<Stats> {
    return prisma.stats.upsert({
      where: { id: GLOBAL_STATS_ID },
      create: {
        id: GLOBAL_STATS_ID,
        totalRequests: 1,
        totalBytesSaved: BigInt(0),
        successCount: 0,
        errorCount: 1,
      },
      update: {
        totalRequests: { increment: 1 },
        errorCount: { increment: 1 },
      },
    });
  }

  /**
   * Increment stats for batch operations
   */
  async incrementBatch(
    successCount: number,
    errorCount: number,
    bytesSaved: number
  ): Promise<Stats> {
    const totalRequests = successCount + errorCount;

    return prisma.stats.upsert({
      where: { id: GLOBAL_STATS_ID },
      create: {
        id: GLOBAL_STATS_ID,
        totalRequests,
        totalBytesSaved: BigInt(bytesSaved),
        successCount,
        errorCount,
      },
      update: {
        totalRequests: { increment: totalRequests },
        totalBytesSaved: { increment: bytesSaved },
        successCount: { increment: successCount },
        errorCount: { increment: errorCount },
      },
    });
  }

  /**
   * Get sanitized stats for public display
   */
  async getPublicStats(): Promise<{
    totalRequests: number;
    totalBytesSaved: string;
  } | null> {
    const stats = await this.getGlobal();
    if (!stats) return null;

    return {
      totalRequests: stats.totalRequests,
      totalBytesSaved: stats.totalBytesSaved.toString(),
    };
  }
}

export const statsRepository = new StatsRepository();
