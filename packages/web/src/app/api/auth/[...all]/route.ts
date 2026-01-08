import { getAuth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import type { NextRequest } from "next/server";

// Force dynamic to avoid build-time database access
export const dynamic = "force-dynamic";

// Lazy initialization - only create handlers at request time
let handlers: {
  GET: (req: NextRequest) => Promise<Response>;
  POST: (req: NextRequest) => Promise<Response>;
} | null = null;

function getHandlers() {
  if (!handlers) {
    handlers = toNextJsHandler(getAuth());
  }
  return handlers;
}

export async function GET(req: NextRequest) {
  return getHandlers().GET(req);
}

export async function POST(req: NextRequest) {
  return getHandlers().POST(req);
}
