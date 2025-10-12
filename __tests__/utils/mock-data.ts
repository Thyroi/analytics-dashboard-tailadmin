import type { CategoryId } from "@/lib/taxonomy/categories";

// Mock analytics data for testing
export const mockAnalyticsData = {
  code: 200,
  output: {
    "root.naturaleza": [
      { time: "20241010", value: 15 },
      { time: "20241011", value: 12 },
    ],
    "root.playas": [
      { time: "20241010", value: 25 },
      { time: "20241011", value: 18 },
    ],
    "root.patrimonio": [
      { time: "20241010", value: 8 },
      { time: "20241011", value: 10 },
    ],
  },
};

// Mock processed categories for UI
export const mockProcessedCategories = [
  {
    id: "naturaleza" as CategoryId,
    label: "NATURALEZA",
    value: 27,
    iconSrc: "/tags/naturaleza.png",
  },
  {
    id: "playas" as CategoryId,
    label: "PLAYAS",
    value: 43,
    iconSrc: "/tags/playa.png",
  },
  {
    id: "patrimonio" as CategoryId,
    label: "PATRIMONIO",
    value: 18,
    iconSrc: "/tags/patrimonio.png",
  },
];

// Mock Google Analytics response
export const mockGA4Response = {
  reports: [
    {
      data: [
        {
          rows: [
            {
              dimensions: ["naturaleza"],
              metrics: [{ values: ["27"] }],
            },
            {
              dimensions: ["playas"],
              metrics: [{ values: ["43"] }],
            },
          ],
        },
      ],
    },
  ],
};

// Mock town data
export const mockTownData = {
  almonte: { id: "almonte", name: "Almonte", visits: 150 },
  palos: { id: "palos", name: "Palos de la Frontera", visits: 89 },
  moguer: { id: "moguer", name: "Moguer", visits: 67 },
};

// Mock date ranges for different granularities
export const mockDateRanges = {
  daily: {
    startDate: "20241010",
    endDate: "20241011",
  },
  weekly: {
    startDate: "2024/41",
    endDate: "2024/42",
  },
  monthly: {
    startDate: "2024/10",
    endDate: "2024/11",
  },
  yearly: {
    startDate: "2024",
    endDate: "2025",
  },
};

// Helper function to create mock API responses
export const createMockApiResponse = (
  data: Record<string, Array<{ time: string; value: number }>>
) => ({
  code: 200,
  output: data,
});

// Helper function to delay promises (for testing loading states)
export const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));
