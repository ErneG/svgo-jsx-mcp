import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export async function initializeStats() {
  await prisma.stats.upsert({
    where: { id: "global" },
    update: {},
    create: { id: "global" },
  });
}

export async function seedApiKeys() {
  const apiKeysEnv = process.env.API_KEYS;
  if (!apiKeysEnv) return;

  const keys = apiKeysEnv.split(",").map((k) => k.trim()).filter(Boolean);

  for (const key of keys) {
    await prisma.apiKey.upsert({
      where: { key },
      update: {},
      create: { key, name: `Key ${key.slice(0, 8)}...` },
    });
  }
}
