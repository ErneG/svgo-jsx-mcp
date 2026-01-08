import { Hono } from "hono";
import { z } from "zod";
import { handleOptimizeSvg } from "../optimize.js";

const publicRoutes = new Hono();

const OptimizeSchema = z.object({
  content: z.string(),
  filename: z.string().optional(),
  camelCase: z.boolean().optional().default(true),
});

// Public SVG optimization endpoint (no auth required)
// Rate limited by IP in production via reverse proxy
publicRoutes.post("/optimize", async (c) => {
  const body = await c.req.json();
  const parsed = OptimizeSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ success: false, error: parsed.error.message }, 400);
  }

  const { content, filename, camelCase } = parsed.data;

  try {
    const resultText = await handleOptimizeSvg({ content, filename, camelCase });
    const result = JSON.parse(resultText);
    return c.json(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return c.json({ success: false, error: errorMessage }, 400);
  }
});

export default publicRoutes;
