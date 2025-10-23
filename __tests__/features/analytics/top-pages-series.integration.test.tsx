import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HeaderAnalyticsTimeContext } from "../../../src/features/analytics/context/HeaderAnalyticsTimeContext";

// Mock data basado en los datos reales que proporcionaste
const REAL_TOP_PAGES_DATA = [
  {
    path: "/",
    label: "/",
    visits: 45,
    prevVisits: 46,
    deltaPct: -0.021739130434782608,
  },
  {
    path: "/hinojos/fiestas-y-tradiciones/",
    label: "fiestas-y-tradiciones",
    visits: 11,
    prevVisits: 2,
    deltaPct: 4.5,
  },
  {
    path: "/hinojos",
    label: "hinojos",
    visits: 8,
    prevVisits: 1,
    deltaPct: 7,
  },
  {
    path: "/almonte/donana/",
    label: "donana",
    visits: 4,
    prevVisits: 1,
    deltaPct: 3,
  },
  {
    path: "/hinojos-en-360/",
    label: "hinojos-en-360",
    visits: 4,
    prevVisits: 2,
    deltaPct: 1,
  },
];

// Mock de la API
const mockApiResponse = vi.fn();

// Mock global fetch
global.fetch = vi.fn().mockImplementation(async (url: string) => {
  console.log("🔥 MOCK FETCH CALLED WITH URL:", url);

  const response = mockApiResponse(url);
  return {
    ok: true,
    json: async () => response,
  };
});

describe("Top Pages Series Integration Tests", () => {
  let queryClient: QueryClient;

  const createWrapper = (timeContext: any) => {
    return ({ children }: { children: ReactNode }) => {
      return (
        <QueryClientProvider client={queryClient}>
          <HeaderAnalyticsTimeContext.Provider value={timeContext}>
            {children}
          </HeaderAnalyticsTimeContext.Provider>
        </QueryClientProvider>
      );
    };
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    vi.clearAllMocks();
  });

  describe("Series Query with Different Granularities", () => {
    const selectedPaths = [
      "/hinojos/fiestas-y-tradiciones/",
      "/hinojos",
      "/almonte/donana/",
    ];

    it("should handle DAY granularity correctly", async () => {
      const timeContext = {
        currentGranularity: "d" as const,
        start: "2024-10-15",
        end: "2024-10-22",
      };

      // Mock respuesta con series data para granularidad diaria
      mockApiResponse.mockReturnValue({
        series: [
          {
            path: "/hinojos/fiestas-y-tradiciones/",
            data: [
              { date: "2024-10-15", visits: 2 },
              { date: "2024-10-16", visits: 1 },
              { date: "2024-10-17", visits: 3 },
              { date: "2024-10-18", visits: 1 },
              { date: "2024-10-19", visits: 2 },
              { date: "2024-10-20", visits: 1 },
              { date: "2024-10-21", visits: 1 },
            ],
          },
          {
            path: "/hinojos",
            data: [
              { date: "2024-10-15", visits: 1 },
              { date: "2024-10-16", visits: 2 },
              { date: "2024-10-17", visits: 1 },
              { date: "2024-10-18", visits: 1 },
              { date: "2024-10-19", visits: 1 },
              { date: "2024-10-20", visits: 1 },
              { date: "2024-10-21", visits: 1 },
            ],
          },
          {
            path: "/almonte/donana/",
            data: [
              { date: "2024-10-15", visits: 1 },
              { date: "2024-10-16", visits: 0 },
              { date: "2024-10-17", visits: 1 },
              { date: "2024-10-18", visits: 1 },
              { date: "2024-10-19", visits: 0 },
              { date: "2024-10-20", visits: 1 },
              { date: "2024-10-21", visits: 0 },
            ],
          },
        ],
      });

      const { result } = renderHook(
        () => useTopComparativePages(selectedPaths),
        { wrapper: createWrapper(timeContext) }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verificar que la URL se construyó correctamente
      const lastCall = (global.fetch as any).mock.calls[0][0];
      expect(lastCall).toContain("granularity=d");
      expect(lastCall).toContain("start=2024-10-15");
      expect(lastCall).toContain("end=2024-10-22");
      expect(lastCall).toContain(
        "includeSeriesFor=/hinojos/fiestas-y-tradiciones/"
      );
      expect(lastCall).toContain("includeSeriesFor=/hinojos");
      expect(lastCall).toContain("includeSeriesFor=/almonte/donana/");

      // Verificar que los datos de series son correctos
      expect(result.current.data?.series).toHaveLength(3);
      expect(result.current.data?.series[0].path).toBe(
        "/hinojos/fiestas-y-tradiciones/"
      );
      expect(result.current.data?.series[0].data).toHaveLength(7); // 7 días de datos
    });

    it("should handle WEEK granularity correctly", async () => {
      const timeContext = {
        currentGranularity: "w" as const,
        start: "2024-10-01",
        end: "2024-10-22",
      };

      mockApiResponse.mockReturnValue({
        series: [
          {
            path: "/hinojos/fiestas-y-tradiciones/",
            data: [
              { date: "2024-10-01", visits: 5 },
              { date: "2024-10-08", visits: 3 },
              { date: "2024-10-15", visits: 3 },
            ],
          },
          {
            path: "/hinojos",
            data: [
              { date: "2024-10-01", visits: 3 },
              { date: "2024-10-08", visits: 2 },
              { date: "2024-10-15", visits: 3 },
            ],
          },
          {
            path: "/almonte/donana/",
            data: [
              { date: "2024-10-01", visits: 2 },
              { date: "2024-10-08", visits: 1 },
              { date: "2024-10-15", visits: 1 },
            ],
          },
        ],
      });

      const { result } = renderHook(
        () => useTopComparativePages(selectedPaths),
        { wrapper: createWrapper(timeContext) }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const lastCall = (global.fetch as any).mock.calls[0][0];
      expect(lastCall).toContain("granularity=w");
      expect(lastCall).toContain("start=2024-10-01");
      expect(lastCall).toContain("end=2024-10-22");

      expect(result.current.data?.series).toHaveLength(3);
      expect(result.current.data?.series[0].data).toHaveLength(3); // 3 semanas de datos
    });

    it("should handle MONTH granularity correctly", async () => {
      const timeContext = {
        currentGranularity: "m" as const,
        start: "2024-08-01",
        end: "2024-10-22",
      };

      mockApiResponse.mockReturnValue({
        series: [
          {
            path: "/hinojos/fiestas-y-tradiciones/",
            data: [
              { date: "2024-08-01", visits: 15 },
              { date: "2024-09-01", visits: 8 },
              { date: "2024-10-01", visits: 11 },
            ],
          },
          {
            path: "/hinojos",
            data: [
              { date: "2024-08-01", visits: 5 },
              { date: "2024-09-01", visits: 3 },
              { date: "2024-10-01", visits: 8 },
            ],
          },
          {
            path: "/almonte/donana/",
            data: [
              { date: "2024-08-01", visits: 3 },
              { date: "2024-09-01", visits: 2 },
              { date: "2024-10-01", visits: 4 },
            ],
          },
        ],
      });

      const { result } = renderHook(
        () => useTopComparativePages(selectedPaths),
        { wrapper: createWrapper(timeContext) }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const lastCall = (global.fetch as any).mock.calls[0][0];
      expect(lastCall).toContain("granularity=m");
      expect(lastCall).toContain("start=2024-08-01");
      expect(lastCall).toContain("end=2024-10-22");

      expect(result.current.data?.series).toHaveLength(3);
      expect(result.current.data?.series[0].data).toHaveLength(3); // 3 meses de datos
    });

    it("should handle YEAR granularity correctly", async () => {
      const timeContext = {
        currentGranularity: "y" as const,
        start: "2023-01-01",
        end: "2024-10-22",
      };

      mockApiResponse.mockReturnValue({
        series: [
          {
            path: "/hinojos/fiestas-y-tradiciones/",
            data: [
              { date: "2023-01-01", visits: 120 },
              { date: "2024-01-01", visits: 150 },
            ],
          },
          {
            path: "/hinojos",
            data: [
              { date: "2023-01-01", visits: 80 },
              { date: "2024-01-01", visits: 95 },
            ],
          },
          {
            path: "/almonte/donana/",
            data: [
              { date: "2023-01-01", visits: 45 },
              { date: "2024-01-01", visits: 52 },
            ],
          },
        ],
      });

      const { result } = renderHook(
        () => useTopComparativePages(selectedPaths),
        { wrapper: createWrapper(timeContext) }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const lastCall = (global.fetch as any).mock.calls[0][0];
      expect(lastCall).toContain("granularity=y");
      expect(lastCall).toContain("start=2023-01-01");
      expect(lastCall).toContain("end=2024-10-22");

      expect(result.current.data?.series).toHaveLength(3);
      expect(result.current.data?.series[0].data).toHaveLength(2); // 2 años de datos
    });
  });

  describe("Error Scenarios", () => {
    const selectedPaths = ["/hinojos/fiestas-y-tradiciones/"];

    it("should handle empty series response", async () => {
      const timeContext = {
        currentGranularity: "d" as const,
        start: "2024-10-15",
        end: "2024-10-22",
      };

      // Mock respuesta vacía (que simula el problema actual)
      mockApiResponse.mockReturnValue({
        series: [],
      });

      const { result } = renderHook(
        () => useTopComparativePages(selectedPaths),
        { wrapper: createWrapper(timeContext) }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      console.log("🔍 EMPTY SERIES TEST - Result data:", result.current.data);

      expect(result.current.data?.series).toEqual([]);

      // Verificar que la URL se construyó correctamente incluso con respuesta vacía
      const lastCall = (global.fetch as any).mock.calls[0][0];
      expect(lastCall).toContain(
        "includeSeriesFor=/hinojos/fiestas-y-tradiciones/"
      );
    });

    it("should handle API error gracefully", async () => {
      const timeContext = {
        currentGranularity: "d" as const,
        start: "2024-10-15",
        end: "2024-10-22",
      };

      // Mock error response
      global.fetch = vi.fn().mockRejectedValue(new Error("API Error"));

      const { result } = renderHook(
        () => useTopComparativePages(selectedPaths),
        { wrapper: createWrapper(timeContext) }
      );

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeInstanceOf(Error);
    });

    it("should handle invalid date ranges", async () => {
      const timeContext = {
        currentGranularity: "d" as const,
        start: "2024-10-22", // start después de end
        end: "2024-10-15",
      };

      mockApiResponse.mockReturnValue({
        series: [],
      });

      const { result } = renderHook(
        () => useTopComparativePages(selectedPaths),
        { wrapper: createWrapper(timeContext) }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // La query debería ejecutarse pero retornar datos vacíos
      expect(result.current.data?.series).toEqual([]);
    });
  });

  describe("Real-world Date Range Tests", () => {
    const selectedPaths = [
      "/hinojos/fiestas-y-tradiciones/",
      "/hinojos",
      "/almonte/donana/",
    ];

    it("should work with short date ranges (1 week)", async () => {
      const timeContext = {
        currentGranularity: "d" as const,
        start: "2024-10-15",
        end: "2024-10-22",
      };

      mockApiResponse.mockReturnValue({
        series: [
          {
            path: "/hinojos/fiestas-y-tradiciones/",
            data: [
              { date: "2024-10-15", visits: 2 },
              { date: "2024-10-16", visits: 1 },
              { date: "2024-10-17", visits: 3 },
              { date: "2024-10-18", visits: 1 },
              { date: "2024-10-19", visits: 2 },
              { date: "2024-10-20", visits: 1 },
              { date: "2024-10-21", visits: 1 },
            ],
          },
        ],
      });

      const { result } = renderHook(
        () => useTopComparativePages(selectedPaths),
        { wrapper: createWrapper(timeContext) }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.series).toHaveLength(1);
      expect(result.current.data?.series[0].data).toHaveLength(7);
    });

    it("should work with medium date ranges (1 month)", async () => {
      const timeContext = {
        currentGranularity: "d" as const,
        start: "2024-09-22",
        end: "2024-10-22",
      };

      // Generar 30 días de datos
      const dailyData = Array.from({ length: 30 }, (_, i) => {
        const date = new Date("2024-09-22");
        date.setDate(date.getDate() + i);
        return {
          date: date.toISOString().split("T")[0],
          visits: Math.floor(Math.random() * 5) + 1,
        };
      });

      mockApiResponse.mockReturnValue({
        series: [
          {
            path: "/hinojos/fiestas-y-tradiciones/",
            data: dailyData,
          },
        ],
      });

      const { result } = renderHook(
        () => useTopComparativePages(selectedPaths),
        { wrapper: createWrapper(timeContext) }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.series).toHaveLength(1);
      expect(result.current.data?.series[0].data).toHaveLength(30);
    });

    it("should work with long date ranges (1 year)", async () => {
      const timeContext = {
        currentGranularity: "m" as const,
        start: "2023-10-22",
        end: "2024-10-22",
      };

      // Generar 12 meses de datos
      const monthlyData = Array.from({ length: 12 }, (_, i) => {
        const date = new Date("2023-10-22");
        date.setMonth(date.getMonth() + i);
        return {
          date: date.toISOString().split("T")[0].substring(0, 7) + "-01",
          visits: Math.floor(Math.random() * 50) + 10,
        };
      });

      mockApiResponse.mockReturnValue({
        series: [
          {
            path: "/hinojos/fiestas-y-tradiciones/",
            data: monthlyData,
          },
        ],
      });

      const { result } = renderHook(
        () => useTopComparativePages(selectedPaths),
        { wrapper: createWrapper(timeContext) }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.series).toHaveLength(1);
      expect(result.current.data?.series[0].data).toHaveLength(12);
    });
  });

  describe("URL Construction Validation", () => {
    it("should correctly encode special characters in paths", async () => {
      const specialPaths = [
        "/hinojos/fiestas-y-tradiciones/",
        "/almonte/espacios-museisticos/centro-de-visitantes-del-acebron/",
        "/rutas-culturales-condado-huelva/",
      ];

      const timeContext = {
        currentGranularity: "d" as const,
        start: "2024-10-15",
        end: "2024-10-22",
      };

      mockApiResponse.mockReturnValue({ series: [] });

      const { result } = renderHook(
        () => useTopComparativePages(specialPaths),
        { wrapper: createWrapper(timeContext) }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const lastCall = (global.fetch as any).mock.calls[0][0];

      // Verificar que todos los paths especiales están en la URL
      specialPaths.forEach((path) => {
        expect(lastCall).toContain(
          `includeSeriesFor=${encodeURIComponent(path)}`
        );
      });
    });

    it("should handle multiple includeSeriesFor parameters correctly", async () => {
      const multiplePaths = [
        "/hinojos/fiestas-y-tradiciones/",
        "/hinojos",
        "/almonte/donana/",
        "/rociana/naturaleza/",
        "/playas-condado-huelva/",
      ];

      const timeContext = {
        currentGranularity: "d" as const,
        start: "2024-10-15",
        end: "2024-10-22",
      };

      mockApiResponse.mockReturnValue({ series: [] });

      const { result } = renderHook(
        () => useTopComparativePages(multiplePaths),
        { wrapper: createWrapper(timeContext) }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const lastCall = (global.fetch as any).mock.calls[0][0];
      console.log("🌐 MULTIPLE PATHS URL:", lastCall);

      // Contar cuántas veces aparece includeSeriesFor
      const matches = lastCall.match(/includeSeriesFor=/g);
      expect(matches).toHaveLength(5);

      // Verificar que cada path está presente
      multiplePaths.forEach((path) => {
        expect(lastCall).toContain(
          `includeSeriesFor=${encodeURIComponent(path)}`
        );
      });
    });
  });
});
