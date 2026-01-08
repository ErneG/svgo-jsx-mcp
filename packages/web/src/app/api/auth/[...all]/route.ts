import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

// Force dynamic to avoid build-time database access
export const dynamic = "force-dynamic";

export const { GET, POST } = toNextJsHandler(auth);
