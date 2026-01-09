import { z } from "zod";

export const CreateApiKeySchema = z.object({
  name: z.string().optional(),
  rateLimit: z.number().int().min(1).max(10000).optional(),
});

export type CreateApiKey = z.infer<typeof CreateApiKeySchema>;

export const UpdateApiKeySchema = z.object({
  name: z.string().optional(),
  enabled: z.boolean().optional(),
  rateLimit: z.number().int().min(1).max(10000).optional(),
});

export type UpdateApiKey = z.infer<typeof UpdateApiKeySchema>;
