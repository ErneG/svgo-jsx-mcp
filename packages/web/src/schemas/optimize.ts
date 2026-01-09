import { z } from "zod";

export const OptimizeRequestSchema = z.object({
  content: z.string(),
  filename: z.string().optional(),
  camelCase: z.boolean().optional(),
});

export type OptimizeRequest = z.infer<typeof OptimizeRequestSchema>;

export const BatchRequestSchema = z.object({
  items: z.array(OptimizeRequestSchema),
  camelCase: z.boolean().optional(),
});

export type BatchRequest = z.infer<typeof BatchRequestSchema>;
