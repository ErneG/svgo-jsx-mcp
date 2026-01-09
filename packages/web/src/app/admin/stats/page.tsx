"use client";

import { useState, useEffect } from "react";
import { TrendingUp, FileCheck, AlertCircle, HardDrive } from "lucide-react";
import { formatBytes } from "@/lib/utils";

interface Stats {
  global: {
    totalRequests: number;
    totalBytesSaved: string;
    successCount: number;
    errorCount: number;
    updatedAt: string | null;
  };
  user: {
    last24Hours: {
      requests: number;
    };
    keyStats: Array<{
      apiKeyId: string;
      keyName: string;
      requestCount: number;
      bytesSaved: number;
    }>;
  };
}

export default function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/admin/stats");
        if (!response.ok) {
          throw new Error(`Failed to fetch stats: ${response.status}`);
        }
        const data = await response.json();
        setStats(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to fetch stats";
        console.error("Failed to fetch stats:", err);
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
        <h2 className="text-xl font-semibold text-red-400 mb-2">Error Loading Stats</h2>
        <p className="text-gray-400">{error}</p>
      </div>
    );
  }

  const successRate = stats?.global.totalRequests
    ? ((stats.global.successCount / stats.global.totalRequests) * 100).toFixed(1)
    : "0";

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Statistics</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="p-6 bg-gray-900 border border-gray-800 rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-violet-500/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-violet-400" />
            </div>
            <span className="text-gray-400">Total Requests</span>
          </div>
          <div className="text-3xl font-bold">
            {stats?.global.totalRequests.toLocaleString() || 0}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {stats?.user.last24Hours.requests.toLocaleString() || 0} in last 24h
          </div>
        </div>

        <div className="p-6 bg-gray-900 border border-gray-800 rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <HardDrive className="w-5 h-5 text-green-400" />
            </div>
            <span className="text-gray-400">Bytes Saved</span>
          </div>
          <div className="text-3xl font-bold">
            {formatBytes(parseInt(stats?.global.totalBytesSaved || "0"))}
          </div>
          <div className="text-sm text-gray-500 mt-1">Total savings</div>
        </div>

        <div className="p-6 bg-gray-900 border border-gray-800 rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <FileCheck className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-gray-400">Success Rate</span>
          </div>
          <div className="text-3xl font-bold">{successRate}%</div>
          <div className="text-sm text-gray-500 mt-1">
            {stats?.global.successCount.toLocaleString() || 0} successful
          </div>
        </div>

        <div className="p-6 bg-gray-900 border border-gray-800 rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-400" />
            </div>
            <span className="text-gray-400">Errors</span>
          </div>
          <div className="text-3xl font-bold">{stats?.global.errorCount.toLocaleString() || 0}</div>
          <div className="text-sm text-gray-500 mt-1">Failed requests</div>
        </div>
      </div>

      {/* Placeholder for charts */}
      <div className="p-6 bg-gray-900 border border-gray-800 rounded-xl">
        <h2 className="text-xl font-semibold mb-4">Usage Over Time</h2>
        <div className="h-64 flex items-center justify-center text-gray-500">
          Charts coming soon...
        </div>
      </div>
    </div>
  );
}
