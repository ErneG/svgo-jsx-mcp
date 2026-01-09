import { statsRepository, requestRepository } from "@/repositories";

export interface GlobalStats {
  totalRequests: number;
  totalBytesSaved: string;
  successCount: number;
  errorCount: number;
  updatedAt: string | null;
}

export interface UserStats {
  last24Hours: {
    requests: number;
  };
  keyStats: Array<{
    apiKeyId: string;
    keyName: string | null;
    requestCount: number;
    bytesSaved: number;
  }>;
}

export interface CombinedStats {
  global: GlobalStats;
  user: UserStats;
}

export interface TimeSeriesDataPoint {
  date: string;
  requests: number;
  bytesSaved: number;
}

export class StatsService {
  /**
   * Get global statistics
   */
  async getGlobalStats(): Promise<GlobalStats> {
    const stats = await statsRepository.getGlobal();

    if (!stats) {
      return {
        totalRequests: 0,
        totalBytesSaved: "0",
        successCount: 0,
        errorCount: 0,
        updatedAt: null,
      };
    }

    return {
      totalRequests: stats.totalRequests,
      totalBytesSaved: stats.totalBytesSaved.toString(),
      successCount: stats.successCount,
      errorCount: stats.errorCount,
      updatedAt: stats.updatedAt.toISOString(),
    };
  }

  /**
   * Get user-specific statistics
   */
  async getUserStats(userId: string): Promise<UserStats> {
    const [last24Hours, keyStats] = await Promise.all([
      requestRepository.getLast24HoursForUser(userId),
      requestRepository.getStatsByApiKey(userId),
    ]);

    return {
      last24Hours: {
        requests: last24Hours,
      },
      keyStats: keyStats.map((ks) => ({
        ...ks,
        bytesSaved: Number(ks.bytesSaved),
      })),
    };
  }

  /**
   * Get combined global and user statistics
   */
  async getCombinedStats(userId: string): Promise<CombinedStats> {
    const [global, user] = await Promise.all([this.getGlobalStats(), this.getUserStats(userId)]);

    return { global, user };
  }

  /**
   * Get time series data for charts
   */
  async getTimeSeries(userId: string, days: number = 30): Promise<TimeSeriesDataPoint[]> {
    return requestRepository.getTimeSeries(userId, days);
  }

  /**
   * Get public stats (sanitized for non-authenticated users)
   */
  async getPublicStats(): Promise<{ totalRequests: number; totalBytesSaved: string } | null> {
    return statsRepository.getPublicStats();
  }

  /**
   * Increment success stats
   */
  async incrementSuccess(bytesSaved: number): Promise<void> {
    await statsRepository.incrementSuccess(bytesSaved);
  }

  /**
   * Increment error stats
   */
  async incrementError(): Promise<void> {
    await statsRepository.incrementError();
  }

  /**
   * Increment batch stats
   */
  async incrementBatch(
    successCount: number,
    errorCount: number,
    bytesSaved: number
  ): Promise<void> {
    await statsRepository.incrementBatch(successCount, errorCount, bytesSaved);
  }
}

export const statsService = new StatsService();
