import "dotenv/config";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

function createAuth() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  return betterAuth({
    database: prismaAdapter(prisma, {
      provider: "postgresql",
    }),
    emailAndPassword: {
      enabled: true,
    },
    plugins: [nextCookies()],
  });
}

// Cache the auth instance
let _auth: ReturnType<typeof betterAuth> | null = null;

export function getAuth() {
  if (!_auth) {
    _auth = createAuth();
  }
  return _auth;
}

// For backward compatibility - create auth lazily on first property access
export const auth = new Proxy({} as ReturnType<typeof betterAuth>, {
  get(target, prop, receiver) {
    const instance = getAuth();
    const value = Reflect.get(instance, prop, receiver);
    // Bind functions to the auth instance
    if (typeof value === "function") {
      return value.bind(instance);
    }
    return value;
  },
});
