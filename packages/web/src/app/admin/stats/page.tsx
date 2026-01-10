"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  TrendingUp,
  FileCheck,
  AlertCircle,
  HardDrive,
  BarChart3,
  PieChart as PieChartIcon,
  Percent,
  Key,
  Calendar,
  Table,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Database,
} from "lucide-react";
import { useStats, useTimeSeries, useRecentRequests } from "@/hooks/use-stats";
import { formatBytes } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
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

const TIME_PERIODS = [
  { labelKey: "admin.statistics.period.7d", days: 7 },
  { labelKey: "admin.statistics.period.30d", days: 30 },
  { labelKey: "admin.statistics.period.90d", days: 90 },
  { labelKey: "admin.statistics.period.all", days: 0 },
] as const;

export default function StatsPage() {
  const t = useTranslations();
  const [selectedDays, setSelectedDays] = useState(7);
  const [requestsOffset, setRequestsOffset] = useState(0);
  const { data: stats, isLoading, error } = useStats(selectedDays);
  const { data: timeSeries, isLoading: isTimeSeriesLoading } = useTimeSeries(selectedDays || 365);
  const { data: recentRequests, isLoading: isRequestsLoading } = useRecentRequests(
    20,
    requestsOffset
  );

  if (error) {
    return (
      <Card className="border-[rgb(var(--destructive))]">
        <CardHeader className="flex flex-col items-center text-center py-12">
          <AlertCircle className="w-12 h-12 text-[rgb(var(--destructive))] mb-4" />
          <CardTitle className="text-[rgb(var(--destructive))]">{t("common.error")}</CardTitle>
          <CardDescription>
            {error instanceof Error ? error.message : t("errors.serverError")}
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
  const avgOptimization = stats?.user?.averageOptimizationPercent ?? "0";

  // Cache stats
  const cacheStats = stats?.cache;

  const successRate = totalRequests > 0 ? ((successCount / totalRequests) * 100).toFixed(1) : "0";

  const selectedPeriod = TIME_PERIODS.find((p) => p.days === selectedDays) ?? TIME_PERIODS[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("admin.statistics.title")}</h1>
          <p className="text-[rgb(var(--muted-foreground))]">{t("admin.overview")}</p>
        </div>

        {/* Time Period Selector */}
        <div className="flex items-center gap-1 p-1 bg-[rgb(var(--muted))]/50 rounded-lg">
          <Calendar className="h-4 w-4 text-[rgb(var(--muted-foreground))] ml-2 mr-1" />
          {TIME_PERIODS.map((period) => (
            <Button
              key={period.days}
              variant={selectedDays === period.days ? "default" : "ghost"}
              size="sm"
              onClick={() => setSelectedDays(period.days)}
              className="text-xs"
            >
              {t(period.labelKey)}
            </Button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        {isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              title={t("admin.statistics.totalRequests")}
              value={totalRequests.toLocaleString()}
              description={`${last24hRequests.toLocaleString()} ${t("admin.statistics.inLast24h")}`}
              icon={<TrendingUp className="h-4 w-4 text-[rgb(var(--primary))]" />}
              iconBgColor="bg-[rgb(var(--primary))]/10"
            />
            <StatCard
              title={t("admin.statistics.totalBytesSaved")}
              value={formatBytes(parseInt(String(totalBytesSaved), 10) || 0)}
              description={t("admin.statistics.totalSavings")}
              icon={<HardDrive className="h-4 w-4 text-emerald-500" />}
              iconBgColor="bg-emerald-500/10"
            />
            <StatCard
              title={t("admin.statistics.avgOptimization")}
              value={`${avgOptimization}%`}
              description={t("admin.statistics.sizeReduction")}
              icon={<Percent className="h-4 w-4 text-amber-500" />}
              iconBgColor="bg-amber-500/10"
            />
            <StatCard
              title={t("admin.statistics.successRate")}
              value={`${successRate}%`}
              description={`${successCount.toLocaleString()} ${t("admin.statistics.successful")}`}
              icon={<FileCheck className="h-4 w-4 text-sky-500" />}
              iconBgColor="bg-sky-500/10"
            />
            <StatCard
              title={t("admin.statistics.errors")}
              value={errorCount.toLocaleString()}
              description={t("admin.statistics.failedRequests")}
              icon={<AlertCircle className="h-4 w-4 text-[rgb(var(--destructive))]" />}
              iconBgColor="bg-[rgb(var(--destructive))]/10"
            />
            <StatCard
              title={t("admin.statistics.cacheHitRate")}
              value={cacheStats?.hitRate ?? "0%"}
              description={`${cacheStats?.size ?? 0}/${cacheStats?.maxSize ?? 1000} ${t("admin.statistics.entries")}`}
              icon={<Database className="h-4 w-4 text-violet-500" />}
              iconBgColor="bg-violet-500/10"
            />
          </>
        )}
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {t("admin.statistics.usageOverTime")}
          </CardTitle>
          <CardDescription>
            {t("admin.statistics.usageDescription")} - {t(selectedPeriod.labelKey)}
          </CardDescription>
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
              <p className="text-sm">{t("admin.statistics.noDataYet")}</p>
              <p className="text-xs">{t("admin.statistics.startMakingRequests")}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Success/Error Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChartIcon className="h-5 w-5" />
            {t("admin.statistics.requestOutcomes")}
          </CardTitle>
          <CardDescription>{t("admin.statistics.successVsError")}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[200px] w-full" />
          ) : totalRequests > 0 ? (
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: "Successful", value: successCount, color: "rgb(34 197 94)" },
                      { name: "Failed", value: errorCount, color: "rgb(239 68 68)" },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    <Cell fill="rgb(34 197 94)" />
                    <Cell fill="rgb(239 68 68)" />
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgb(var(--card))",
                      borderColor: "rgb(var(--border))",
                      borderRadius: "0.5rem",
                    }}
                    formatter={(value) => [
                      (typeof value === "number" ? value : 0).toLocaleString(),
                      "Requests",
                    ]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[200px] flex flex-col items-center justify-center text-[rgb(var(--muted-foreground))]">
              <PieChartIcon className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-sm">{t("admin.statistics.noRequestsYet")}</p>
              <p className="text-xs">{t("admin.statistics.startMakingRequests")}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Per-Key Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            {t("admin.statistics.usageByKey")}
          </CardTitle>
          <CardDescription>{t("admin.statistics.usageByKeyDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[200px] w-full" />
          ) : stats?.user?.keyStats && stats.user.keyStats.length > 0 ? (
            <>
              {/* Bar Chart */}
              <div className="h-[200px] mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stats.user.keyStats.map((k) => ({
                      name: k.keyName,
                      requests: k.requestCount,
                      bytesSaved: k.bytesSaved,
                    }))}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-[rgb(var(--border))]" />
                    <XAxis type="number" fontSize={12} stroke="rgb(var(--muted-foreground))" />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={100}
                      fontSize={12}
                      stroke="rgb(var(--muted-foreground))"
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgb(var(--card))",
                        borderColor: "rgb(var(--border))",
                        borderRadius: "0.5rem",
                      }}
                      formatter={(value, name) => {
                        const numValue = typeof value === "number" ? value : 0;
                        if (name === "bytesSaved") {
                          return [formatBytes(numValue), "Bytes Saved"];
                        }
                        return [numValue.toLocaleString(), "Requests"];
                      }}
                    />
                    <Legend />
                    <Bar dataKey="requests" fill="rgb(232 121 249)" name="Requests" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Detailed breakdown */}
              <div className="space-y-3 border-t border-[rgb(var(--border))] pt-4">
                {stats.user.keyStats.map((keyStat) => (
                  <div
                    key={keyStat.apiKeyId}
                    className="flex items-center justify-between text-sm p-3 rounded-lg bg-[rgb(var(--muted))]/30"
                  >
                    <div className="font-medium">{keyStat.keyName}</div>
                    <div className="flex items-center gap-4 text-[rgb(var(--muted-foreground))]">
                      <span>
                        {keyStat.requestCount.toLocaleString()} {t("admin.statistics.requests")}
                      </span>
                      <span className="text-emerald-500">
                        {formatBytes(keyStat.bytesSaved)} {t("admin.statistics.saved")}
                      </span>
                      <span
                        className={
                          parseFloat(keyStat.successRate) >= 90
                            ? "text-green-500"
                            : parseFloat(keyStat.successRate) >= 70
                              ? "text-amber-500"
                              : "text-red-500"
                        }
                      >
                        {keyStat.successRate}% {t("admin.statistics.success")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[200px] flex flex-col items-center justify-center text-[rgb(var(--muted-foreground))]">
              <Key className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-sm">{t("admin.statistics.noKeysWithRequests")}</p>
              <p className="text-xs">{t("admin.statistics.createKeyStart")}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Table className="h-5 w-5" />
            {t("admin.statistics.recentRequests")}
          </CardTitle>
          <CardDescription>{t("admin.statistics.recentRequestsDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          {isRequestsLoading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : recentRequests && recentRequests.requests.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[rgb(var(--border))]">
                      <th className="text-left py-3 px-2 font-medium text-[rgb(var(--muted-foreground))]">
                        {t("admin.statistics.table.time")}
                      </th>
                      <th className="text-left py-3 px-2 font-medium text-[rgb(var(--muted-foreground))]">
                        {t("admin.statistics.table.filename")}
                      </th>
                      <th className="text-right py-3 px-2 font-medium text-[rgb(var(--muted-foreground))]">
                        {t("admin.statistics.table.original")}
                      </th>
                      <th className="text-right py-3 px-2 font-medium text-[rgb(var(--muted-foreground))]">
                        {t("admin.statistics.table.optimized")}
                      </th>
                      <th className="text-right py-3 px-2 font-medium text-[rgb(var(--muted-foreground))]">
                        {t("admin.statistics.table.saved")}
                      </th>
                      <th className="text-center py-3 px-2 font-medium text-[rgb(var(--muted-foreground))]">
                        {t("admin.statistics.table.status")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentRequests.requests.map((req) => (
                      <tr
                        key={req.id}
                        className="border-b border-[rgb(var(--border))]/50 hover:bg-[rgb(var(--muted))]/30"
                      >
                        <td className="py-3 px-2 text-[rgb(var(--muted-foreground))]">
                          {new Date(req.createdAt).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="py-3 px-2 font-mono text-xs max-w-[200px] truncate">
                          {req.filename}
                        </td>
                        <td className="py-3 px-2 text-right">{formatBytes(req.originalSize)}</td>
                        <td className="py-3 px-2 text-right">{formatBytes(req.optimizedSize)}</td>
                        <td className="py-3 px-2 text-right text-emerald-500">
                          {req.savedPercent}%
                        </td>
                        <td className="py-3 px-2 text-center">
                          {req.success ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500 inline" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500 inline" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {recentRequests.pagination.total > 20 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-[rgb(var(--border))]">
                  <p className="text-sm text-[rgb(var(--muted-foreground))]">
                    {t("admin.statistics.table.showing")} {requestsOffset + 1} -{" "}
                    {Math.min(
                      requestsOffset + recentRequests.requests.length,
                      recentRequests.pagination.total
                    )}{" "}
                    {t("admin.statistics.table.of")} {recentRequests.pagination.total}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRequestsOffset(Math.max(0, requestsOffset - 20))}
                      disabled={requestsOffset === 0}
                    >
                      {t("admin.statistics.table.previous")}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRequestsOffset(requestsOffset + 20)}
                      disabled={!recentRequests.pagination.hasMore}
                    >
                      {t("admin.statistics.table.next")}
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="h-[200px] flex flex-col items-center justify-center text-[rgb(var(--muted-foreground))]">
              <Table className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-sm">{t("admin.statistics.noRequestsYet")}</p>
              <p className="text-xs">{t("admin.statistics.startMakingRequests")}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
