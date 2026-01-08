import { vi } from "vitest";

/**
 * Mock Prisma Client for testing
 *
 * This provides mock implementations of Prisma client methods
 * for use in integration tests without a real database.
 */

export const mockApiKey = {
  id: "test-api-key-id",
  key: "test-api-key-12345",
  name: "Test API Key",
  enabled: true,
  rateLimit: 100,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockStats = {
  id: "global",
  totalRequests: 0,
  totalBytesSaved: BigInt(0),
  successCount: 0,
  errorCount: 0,
  updatedAt: new Date(),
};

export const mockRequest = {
  id: "test-request-id",
  apiKeyId: mockApiKey.id,
  filename: "test.svg",
  originalSize: 1000,
  optimizedSize: 500,
  savedBytes: 500,
  camelCase: true,
  success: true,
  errorMessage: null,
  createdAt: new Date(),
};

export const createMockPrismaClient = () => ({
  apiKey: {
    findUnique: vi.fn().mockResolvedValue(mockApiKey),
    findFirst: vi.fn().mockResolvedValue(mockApiKey),
    findMany: vi.fn().mockResolvedValue([mockApiKey]),
    create: vi.fn().mockResolvedValue(mockApiKey),
    update: vi.fn().mockResolvedValue(mockApiKey),
    upsert: vi.fn().mockResolvedValue(mockApiKey),
    delete: vi.fn().mockResolvedValue(mockApiKey),
    count: vi.fn().mockResolvedValue(1),
  },
  request: {
    findUnique: vi.fn().mockResolvedValue(mockRequest),
    findFirst: vi.fn().mockResolvedValue(mockRequest),
    findMany: vi.fn().mockResolvedValue([mockRequest]),
    create: vi.fn().mockResolvedValue(mockRequest),
    update: vi.fn().mockResolvedValue(mockRequest),
    delete: vi.fn().mockResolvedValue(mockRequest),
    count: vi.fn().mockResolvedValue(1),
  },
  stats: {
    findUnique: vi.fn().mockResolvedValue(mockStats),
    findFirst: vi.fn().mockResolvedValue(mockStats),
    upsert: vi.fn().mockResolvedValue(mockStats),
    update: vi.fn().mockResolvedValue(mockStats),
  },
  $connect: vi.fn().mockResolvedValue(undefined),
  $disconnect: vi.fn().mockResolvedValue(undefined),
  $transaction: vi.fn().mockImplementation((fn) => fn(createMockPrismaClient())),
});

/**
 * Create a mock Prisma client with custom overrides
 */
export const createCustomMockPrismaClient = (overrides: Record<string, unknown> = {}) => {
  const baseMock = createMockPrismaClient();
  return { ...baseMock, ...overrides };
};
