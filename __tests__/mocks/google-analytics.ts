import { vi } from "vitest";

// Mock Google Analytics API responses
export const mockGA4Response = {
  data: {
    rows: [
      {
        dimensionValues: [{ value: "naturaleza" }],
        metricValues: [{ value: "150" }],
      },
      {
        dimensionValues: [{ value: "playas" }],
        metricValues: [{ value: "89" }],
      },
      {
        dimensionValues: [{ value: "patrimonio" }],
        metricValues: [{ value: "67" }],
      },
    ],
  },
};

// Mock Google APIs
export const mockGoogleApis = {
  analyticsreporting: vi.fn(() => ({
    reports: {
      batchGet: vi.fn(() =>
        Promise.resolve({
          data: {
            reports: [mockGA4Response],
          },
        })
      ),
    },
  })),

  auth: {
    GoogleAuth: vi.fn().mockImplementation(() => ({
      getClient: vi.fn(() => Promise.resolve({})),
      getCredentials: vi.fn(() => Promise.resolve({})),
    })),
  },
};

// Mock the googleapis module
vi.mock("googleapis", () => ({
  google: mockGoogleApis,
}));

// Helper to reset GA mocks
export const resetGoogleAnalyticsMocks = () => {
  vi.clearAllMocks();
};
