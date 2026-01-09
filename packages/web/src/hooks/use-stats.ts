import { useQuery } from "@tanstack/react-query";

export interface GlobalStats {
  totalRequests: number;
  totalBytesSaved: string;
  successCount: number;
  errorCount: number;
  averageOptimizationPercent: string;
  updatedAt: string | null;
}

export interface KeyStat {
  apiKeyId: string;
  keyName: string;
  requestCount: number;
  bytesSaved: number;
  successCount: number;
  successRate: string;
}

export interface UserStats {
  totalRequests: number;
  totalBytesSaved: string;
  successCount: number;
  errorCount: number;
  averageOptimizationPercent: string;
  last24Hours: {
    requests: number;
  };
  keyStats: KeyStat[];
}

export interface Stats {
  global: GlobalStats;
  user: UserStats;
}

export interface TimeSeriesDataPoint {
  date: string;
  requests: number;
  bytesSaved: number;
}

export function useStats(days: number = 0) {
  return useQuery<Stats>({
    queryKey: ["stats", days],
    queryFn: async () => {
      const url = days > 0 ? `/api/admin/stats?days=${days}` : "/api/admin/stats";
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error("Failed to fetch stats");
      }
      return res.json();
    },
  });
}

export function useTimeSeries(days: number = 7) {
  return useQuery<TimeSeriesDataPoint[]>({
    queryKey: ["stats", "time-series", days],
    queryFn: async () => {
      const res = await fetch(`/api/admin/stats/time-series?days=${days}`);
      if (!res.ok) {
        throw new Error("Failed to fetch time series data");
      }
      return res.json();
    },
  });
}
