import { z } from "zod";

export const TimeSeriesQuerySchema = z.object({
  days: z.number().int().min(1).max(365).optional(),
});

export type TimeSeriesQuery = z.infer<typeof TimeSeriesQuerySchema>;

export const ExportQuerySchema = z.object({
  format: z.enum(["csv", "json"]),
});

export type ExportQuery = z.infer<typeof ExportQuerySchema>;
