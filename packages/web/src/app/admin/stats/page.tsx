"use client";

import { TrendingUp, FileCheck, AlertCircle, HardDrive, BarChart3 } from "lucide-react";
import { useStats, useTimeSeries } from "@/hooks/use-stats";
import { formatBytes } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  iconBgColor: string;
}

function StatCard({ title, value, description, icon, iconBgColor }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-[rgb(var(--muted-foreground))]">
          {title}
        </CardTitle>
        <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${iconBgColor}`}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-[rgb(var(--muted-foreground))] mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}

function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-9 w-9 rounded-lg" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-20 mb-2" />
        <Skeleton className="h-3 w-32" />
      </CardContent>
    </Card>
  );
}

export default function StatsPage() {
  const { data: stats, isLoading, error } = useStats();
  const { data: timeSeries, isLoading: isTimeSeriesLoading } = useTimeSeries(7);

  if (error) {
    return (
      <Card className="border-[rgb(var(--destructive))]">
        <CardHeader className="flex flex-col items-center text-center py-12">
          <AlertCircle className="w-12 h-12 text-[rgb(var(--destructive))] mb-4" />
          <CardTitle className="text-[rgb(var(--destructive))]">Error Loading Stats</CardTitle>
          <CardDescription>
            {error instanceof Error ? error.message : "Failed to fetch statistics"}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Use user-specific stats for accurate data
  const totalRequests = stats?.user?.totalRequests ?? 0;
  const totalBytesSaved = stats?.user?.totalBytesSaved ?? "0";
  const successCount = stats?.user?.successCount ?? 0;
  const errorCount = stats?.user?.errorCount ?? 0;
  const last24hRequests = stats?.user?.last24Hours?.requests ?? 0;

  const successRate = totalRequests > 0 ? ((successCount / totalRequests) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Statistics</h1>
        <p className="text-[rgb(var(--muted-foreground))]">
          Overview of your API usage and performance
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              title="Total Requests"
              value={totalRequests.toLocaleString()}
              description={`${last24hRequests.toLocaleString()} in last 24h`}
              icon={<TrendingUp className="h-4 w-4 text-[rgb(var(--primary))]" />}
              iconBgColor="bg-[rgb(var(--primary))]/10"
            />
            <StatCard
              title="Bytes Saved"
              value={formatBytes(parseInt(String(totalBytesSaved), 10) || 0)}
              description="Total savings"
              icon={<HardDrive className="h-4 w-4 text-emerald-500" />}
              iconBgColor="bg-emerald-500/10"
            />
            <StatCard
              title="Success Rate"
              value={`${successRate}%`}
              description={`${successCount.toLocaleString()} successful`}
              icon={<FileCheck className="h-4 w-4 text-sky-500" />}
              iconBgColor="bg-sky-500/10"
            />
            <StatCard
              title="Errors"
              value={errorCount.toLocaleString()}
              description="Failed requests"
              icon={<AlertCircle className="h-4 w-4 text-[rgb(var(--destructive))]" />}
              iconBgColor="bg-[rgb(var(--destructive))]/10"
            />
          </>
        )}
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Usage Over Time
          </CardTitle>
          <CardDescription>Request volume and bytes saved over the last 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          {isTimeSeriesLoading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : timeSeries && timeSeries.length > 0 ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeSeries} margin={{ top: 10, right: 60, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="rgb(232 121 249)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="rgb(232 121 249)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorBytes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="rgb(34 197 94)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="rgb(34 197 94)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-[rgb(var(--border))]" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) =>
                      new Date(value).toLocaleDateString("en-US", { weekday: "short" })
                    }
                    className="text-[rgb(var(--muted-foreground))]"
                    stroke="rgb(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis
                    yAxisId="left"
                    className="text-[rgb(var(--muted-foreground))]"
                    stroke="rgb(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tickFormatter={(value) => formatBytes(value)}
                    className="text-[rgb(var(--muted-foreground))]"
                    stroke="rgb(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgb(var(--card))",
                      borderColor: "rgb(var(--border))",
                      borderRadius: "0.5rem",
                    }}
                    labelStyle={{ color: "rgb(var(--foreground))" }}
                    labelFormatter={(value) =>
                      new Date(value).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })
                    }
                    formatter={(value, name) => {
                      const numValue = typeof value === "number" ? value : 0;
                      if (name === "Bytes Saved") {
                        return [formatBytes(numValue), name];
                      }
                      return [numValue.toLocaleString(), name];
                    }}
                  />
                  <Legend />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="requests"
                    stroke="rgb(232 121 249)"
                    fillOpacity={1}
                    fill="url(#colorRequests)"
                    name="Requests"
                  />
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="bytesSaved"
                    stroke="rgb(34 197 94)"
                    fillOpacity={1}
                    fill="url(#colorBytes)"
                    name="Bytes Saved"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[300px] flex flex-col items-center justify-center text-[rgb(var(--muted-foreground))]">
              <BarChart3 className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-sm">No data available yet</p>
              <p className="text-xs">Start making API requests to see your usage trends</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Per-Key Stats */}
      {stats?.user?.keyStats && stats.user.keyStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Usage by API Key</CardTitle>
            <CardDescription>Breakdown of requests per API key</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(() => {
                // Compute total from keyStats for accurate percentage calculation
                const userTotalRequests = stats.user.keyStats.reduce(
                  (sum, k) => sum + (k?.requestCount ?? 0),
                  0
                );
                return stats.user.keyStats.map((keyStat) => {
                  const keyRequestCount = keyStat?.requestCount ?? 0;
                  const percentage =
                    userTotalRequests > 0
                      ? ((keyRequestCount / userTotalRequests) * 100).toFixed(1)
                      : "0";
                  return (
                    <div key={keyStat?.apiKeyId ?? "unknown"} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{keyStat?.keyName || "Unnamed Key"}</span>
                        <span className="text-[rgb(var(--muted-foreground))]">
                          {keyRequestCount.toLocaleString()} requests ({percentage}%)
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-[rgb(var(--muted))] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[rgb(var(--primary))]"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
