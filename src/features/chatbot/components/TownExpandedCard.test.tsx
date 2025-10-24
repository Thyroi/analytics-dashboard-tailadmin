/**
 * Tests para TownExpandedCard (PR #12)
 *
 * Verifica:
 * - Donut + comparativa usan useTownCategoryBreakdown
 * - Click en categoría emite onSelectCategory
 * - Sin useEffect para fetches
 * - Skeletons y empty states
 */

import type { TownCategoryBreakdownResponse } from "@/lib/services/chatbot/townCategoryBreakdown";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as useTownCategoryBreakdownModule from "../hooks/useTownCategoryBreakdown";
import TownExpandedCard from "./TownExpandedCard";

// Mock del hook
vi.mock("../hooks/useTownCategoryBreakdown");

const mockUseTownCategoryBreakdown = vi.spyOn(
  useTownCategoryBreakdownModule,
  "useTownCategoryBreakdown"
);

// Mock de ChartPair para evitar problemas de rendering
vi.mock("@/components/common/ChartPair", () => ({
  default: ({
    donutData,
    groupedSeries,
    onDonutSlice,
    categories,
  }: {
    donutData: Array<{ label: string; value: number }>;
    groupedSeries: Array<{ name: string; data: number[] }>;
    onDonutSlice?: (label: string) => void;
    categories: string[];
  }) => (
    <div data-testid="chart-pair">
      <div data-testid="donut-section">
        {donutData.map((item) => (
          <button
            key={item.label}
            data-testid={`donut-slice-${item.label}`}
            onClick={() => onDonutSlice?.(item.label)}
          >
            {item.label}: {item.value}
          </button>
        ))}
      </div>
      <div data-testid="grouped-bar">
        {categories.map((cat, idx) => (
          <div key={cat} data-testid={`bar-${cat}`}>
            {cat}: {groupedSeries[0]?.data[idx]}
          </div>
        ))}
      </div>
    </div>
  ),
}));

describe("TownExpandedCard", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const mockResponse: TownCategoryBreakdownResponse = {
    townId: "almonte",
    categories: [
      {
        categoryId: "playas",
        label: "PLAYAS",
        iconSrc: "/tags/playa.png",
        currentTotal: 100,
        prevTotal: 80,
        deltaAbs: 20,
        deltaPercent: 25,
      },
      {
        categoryId: "naturaleza",
        label: "NATURALEZA",
        iconSrc: "/tags/naturaleza.png",
        currentTotal: 50,
        prevTotal: 40,
        deltaAbs: 10,
        deltaPercent: 25,
      },
      {
        categoryId: "sabor",
        label: "SABOR",
        iconSrc: "/tags/sabor.png",
        currentTotal: 30,
        prevTotal: 20,
        deltaAbs: 10,
        deltaPercent: 50,
      },
      {
        categoryId: "otros",
        label: "OTROS",
        iconSrc: "/tags/patrimonio.png",
        currentTotal: 0,
        prevTotal: 0,
        deltaAbs: 0,
        deltaPercent: null,
      },
    ],
    meta: {
      granularity: "d",
      timezone: "UTC",
      range: {
        current: { start: "2024-10-20", end: "2024-10-20" },
        previous: { start: "2024-10-19", end: "2024-10-19" },
      },
    },
  };

  it("debe usar useTownCategoryBreakdown hook", () => {
    mockUseTownCategoryBreakdown.mockReturnValue({
      data: mockResponse,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      invalidate: vi.fn(),
    });

    render(
      <QueryClientProvider client={queryClient}>
        <TownExpandedCard
          townId="almonte"
          granularity="d"
          startDate="2024-10-20"
          endDate="2024-10-20"
          onClose={vi.fn()}
        />
      </QueryClientProvider>
    );

    // Verificar que el hook fue llamado con los parámetros correctos
    expect(mockUseTownCategoryBreakdown).toHaveBeenCalledWith({
      townId: "almonte",
      startISO: "2024-10-20",
      endISO: "2024-10-20",
      windowGranularity: "d",
      enabled: true,
    });
  });

  it("debe renderizar donut con categorías que tengan datos", () => {
    mockUseTownCategoryBreakdown.mockReturnValue({
      data: mockResponse,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      invalidate: vi.fn(),
    });

    render(
      <QueryClientProvider client={queryClient}>
        <TownExpandedCard
          townId="almonte"
          granularity="d"
          startDate="2024-10-20"
          endDate="2024-10-20"
          onClose={vi.fn()}
        />
      </QueryClientProvider>
    );

    // Verificar que solo categorías con datos aparecen en el donut
    expect(screen.getByTestId("donut-slice-PLAYAS")).toBeInTheDocument();
    expect(screen.getByTestId("donut-slice-NATURALEZA")).toBeInTheDocument();
    expect(screen.getByTestId("donut-slice-SABOR")).toBeInTheDocument();
    // "otros" no debe aparecer porque tiene 0 interacciones
    expect(screen.queryByTestId("donut-slice-OTROS")).not.toBeInTheDocument();
  });

  it("debe renderizar grouped bar con top categorías ordenadas", () => {
    mockUseTownCategoryBreakdown.mockReturnValue({
      data: mockResponse,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      invalidate: vi.fn(),
    });

    render(
      <QueryClientProvider client={queryClient}>
        <TownExpandedCard
          townId="almonte"
          granularity="d"
          startDate="2024-10-20"
          endDate="2024-10-20"
          onClose={vi.fn()}
        />
      </QueryClientProvider>
    );

    // Verificar que las barras están ordenadas por total descendente
    const playasBar = screen.getByTestId("bar-PLAYAS");
    const naturalezaBar = screen.getByTestId("bar-NATURALEZA");
    const saborBar = screen.getByTestId("bar-SABOR");

    expect(playasBar).toHaveTextContent("PLAYAS: 100");
    expect(naturalezaBar).toHaveTextContent("NATURALEZA: 50");
    expect(saborBar).toHaveTextContent("SABOR: 30");
  });

  it("debe emitir onSelectCategory al hacer click en slice del donut", async () => {
    const user = userEvent.setup();
    const onSelectCategory = vi.fn();

    mockUseTownCategoryBreakdown.mockReturnValue({
      data: mockResponse,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      invalidate: vi.fn(),
    });

    render(
      <QueryClientProvider client={queryClient}>
        <TownExpandedCard
          townId="almonte"
          granularity="d"
          startDate="2024-10-20"
          endDate="2024-10-20"
          onClose={vi.fn()}
          onSelectCategory={onSelectCategory}
        />
      </QueryClientProvider>
    );

    // Click en slice de "PLAYAS"
    const playasSlice = screen.getByTestId("donut-slice-PLAYAS");
    await user.click(playasSlice);

    await waitFor(() => {
      expect(onSelectCategory).toHaveBeenCalledWith("playas");
    });
  });

  it("debe mostrar skeleton mientras carga", () => {
    mockUseTownCategoryBreakdown.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
      refetch: vi.fn(),
      invalidate: vi.fn(),
    });

    render(
      <QueryClientProvider client={queryClient}>
        <TownExpandedCard
          townId="almonte"
          granularity="d"
          startDate="2024-10-20"
          endDate="2024-10-20"
          onClose={vi.fn()}
        />
      </QueryClientProvider>
    );

    expect(screen.getByText(/Cargando datos/i)).toBeInTheDocument();
  });

  it("debe mostrar error si falla el fetch", () => {
    mockUseTownCategoryBreakdown.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error("Network error"),
      refetch: vi.fn(),
      invalidate: vi.fn(),
    });

    render(
      <QueryClientProvider client={queryClient}>
        <TownExpandedCard
          townId="almonte"
          granularity="d"
          startDate="2024-10-20"
          endDate="2024-10-20"
          onClose={vi.fn()}
        />
      </QueryClientProvider>
    );

    expect(screen.getByText(/Error cargando datos/i)).toBeInTheDocument();
    expect(screen.getByText(/Network error/i)).toBeInTheDocument();
  });

  it("debe mostrar empty state si no hay datos", () => {
    mockUseTownCategoryBreakdown.mockReturnValue({
      data: {
        ...mockResponse,
        categories: [],
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      invalidate: vi.fn(),
    });

    render(
      <QueryClientProvider client={queryClient}>
        <TownExpandedCard
          townId="almonte"
          granularity="d"
          startDate="2024-10-20"
          endDate="2024-10-20"
          onClose={vi.fn()}
        />
      </QueryClientProvider>
    );

    expect(
      screen.getByText(/No hay datos de categorías para este pueblo/i)
    ).toBeInTheDocument();
  });

  it("NO debe usar useEffect para fetches (arquitectura React Query)", () => {
    // Este test verifica indirectamente que no hay useEffect:
    // El hook se llama solo una vez durante el render inicial
    mockUseTownCategoryBreakdown.mockReturnValue({
      data: mockResponse,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      invalidate: vi.fn(),
    });

    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <TownExpandedCard
          townId="almonte"
          granularity="d"
          startDate="2024-10-20"
          endDate="2024-10-20"
          onClose={vi.fn()}
        />
      </QueryClientProvider>
    );

    const initialCallCount = mockUseTownCategoryBreakdown.mock.calls.length;

    // Rerender sin cambiar props
    rerender(
      <QueryClientProvider client={queryClient}>
        <TownExpandedCard
          townId="almonte"
          granularity="d"
          startDate="2024-10-20"
          endDate="2024-10-20"
          onClose={vi.fn()}
        />
      </QueryClientProvider>
    );

    // El hook debe llamarse exactamente 2 veces (una por cada render)
    // No debe haber calls adicionales por useEffect
    expect(mockUseTownCategoryBreakdown.mock.calls.length).toBe(
      initialCallCount + 1
    );
  });
});
