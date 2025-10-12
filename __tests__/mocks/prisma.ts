import { vi } from "vitest";

// Mock Prisma client
const mockPrismaClient = {
  user: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },

  role: {
    findMany: vi.fn(),
    create: vi.fn(),
  },

  profile: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },

  $connect: vi.fn(),
  $disconnect: vi.fn(),
  $transaction: vi.fn(),
};

// Mock the Prisma client module
vi.mock("@prisma/client", () => ({
  PrismaClient: vi.fn(() => mockPrismaClient),
}));

// Export the mock for use in tests
export { mockPrismaClient };

// Helper to reset Prisma mocks
export const resetPrismaMocks = () => {
  Object.values(mockPrismaClient).forEach((method) => {
    if (typeof method === "object" && method !== null) {
      Object.values(method).forEach((subMethod) => {
        if (vi.isMockFunction(subMethod)) {
          subMethod.mockReset();
        }
      });
    } else if (vi.isMockFunction(method)) {
      method.mockReset();
    }
  });
};
