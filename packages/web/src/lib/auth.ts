import "dotenv/config";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "./prisma";

function createAuth() {
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
