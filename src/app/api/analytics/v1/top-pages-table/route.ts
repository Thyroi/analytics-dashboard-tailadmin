import {
  getAuth,
  normalizePropertyId,
  resolvePropertyId,
} from "@/lib/utils/analytics/ga";
import { computeDeltaArtifact } from "@/lib/utils/delta/core";
import { addDaysUTC, parseISO, toISO } from "@/lib/utils/time/datetime";
import { analyticsdata_v1beta, google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";

export type TopPagesTableResponse = {
  meta: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    granularity: "d" | "w" | "m" | "y";
    start: string;
    end: string;
    shiftedPrev: { start: string; end: string };
  };
  data: Array<{
    path: string;
    label: string;
    visits: number;
    prevVisits: number | null;
    deltaPct: number | null;
  }>;
};

/**
 * Convierte URL completa de GA4 a path relativo para el frontend
 * Ejemplo: "https://wp.ideanto.com/about/" → "/about/"
 *          "https://wp.ideanto.com/" → "/"
 */
function urlToPath(fullUrl: string): string {
  const BASE_URL = "https://wp.ideanto.com";

  // Si ya es un path relativo, devolverlo tal cual
  if (fullUrl.startsWith("/")) {
    return fullUrl;
  }

  // Remover el dominio base
  if (fullUrl.startsWith(BASE_URL)) {
    const path = fullUrl.substring(BASE_URL.length);
    return path || "/"; // Si queda vacío, es la home
  }

  // Si es otro dominio o formato, devolver tal cual
  return fullUrl;
}

/**
 * Calcula el período previous basándose en el rango EXACTO que envía el frontend
 * NO expande a ventanas fijas como la gráfica
 *
 * Ejemplo:
 * - Frontend envía: start=2025-11-24, end=2025-11-24 (1 día)
 *   → Previous: 2025-11-23 → 2025-11-23 (1 día anterior)
 *
 * - Frontend envía: start=2025-11-18, end=2025-11-24 (7 días)
 *   → Previous: 2025-11-11 → 2025-11-17 (7 días anteriores)
 */
function calculatePreviousPeriod(
  start: string,
  end: string
): { start: string; end: string } {
  const startDate = parseISO(start);
  const endDate = parseISO(end);

  // Calcular número de días en el rango (inclusive)
  const diffMs = endDate.getTime() - startDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const rangeDays = diffDays + 1; // +1 porque es inclusivo

  // Previous end = start - 1 día
  const prevEnd = addDaysUTC(startDate, -1);
  // Previous start = prevEnd - (rangeDays - 1)
  const prevStart = addDaysUTC(prevEnd, -(rangeDays - 1));

  return {
    start: toISO(prevStart),
    end: toISO(prevEnd),
  };
}

/**
 * Calcula delta porcentual usando la misma lógica que DeltaCards
 * Para consistencia en toda la app
 *
 * IMPORTANTE: Trata prev=null como prev=0 para poder calcular deltas
 * de páginas nuevas o sin datos en el período anterior
 *
 * @returns Delta en escala 0-1 (e.g., 0.12 = 12%) para compatibilidad con formatPercent
 */
function calculateDeltaPct(
  current: number,
  prev: number | null
): number | null {
  // Normalizar null a 0 para poder calcular deltas tipo "new_vs_zero"
  // Esto permite mostrar +700%, +1100%, etc. para páginas sin tráfico anterior
  const prevNormalized = prev ?? 0;

  // Usar la misma función que DeltaCards para consistencia
  const artifact = computeDeltaArtifact(current, prevNormalized);

  // computeDeltaArtifact retorna en escala 0-100 (e.g., 12 = 12%)
  // formatPercent espera escala 0-1 (e.g., 0.12 = 12%)
  // Convertir: 12 → 0.12
  return artifact.deltaPct !== null ? artifact.deltaPct / 100 : null;
}

function extractLabel(path: string): string {
  // Caso especial: home page
  if (path === "/" || path === "") {
    return "Home";
  }

  const segments = path.split("/").filter(Boolean);
  const lastSegment = segments[segments.length - 1] ?? "/";
  return decodeURIComponent(lastSegment);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // CRITICAL DEBUG: Log all incoming parameters

    const start = searchParams.get("start") ?? "";
    const end = searchParams.get("end") ?? "";
    const granularity = searchParams.get("granularity") as
      | "d"
      | "w"
      | "m"
      | "y";
    const page = parseInt(searchParams.get("page") ?? "1");
    const pageSize = parseInt(searchParams.get("pageSize") ?? "15");
    const search = searchParams.get("search") ?? "";
    const sortBy = searchParams.get("sortBy") ?? "visits";
    const sortDir = searchParams.get("sortDir") ?? "desc";

    if (!start || !end || !granularity) {
      return NextResponse.json(
        { error: "Missing required parameters: start, end, granularity" },
        { status: 400 }
      );
    }

    // Calcular previous usando el rango EXACTO del frontend
    const prevRange = calculatePreviousPeriod(start, end);

    // Setup GA4 client
    const auth = getAuth();
    const ga = google.analyticsdata({ version: "v1beta", auth });
    const property = normalizePropertyId(resolvePropertyId());

    // CRITICAL DEBUG: Log GA4 query parameters
    const gaQueryParams = {
      property,
      dateRanges: [{ startDate: start, endDate: end }],
      dimensions: [{ name: "pageLocation" }], // Usar pageLocation (URLs completas) como la gráfica
      metrics: [{ name: "screenPageViews" }],
      // Filtro para excluir URLs de paginación y rutas "undefined"
      // Excluye rutas que contengan "pagina/" o la cadena "undefined"
      dimensionFilter: {
        notExpression: {
          orGroup: {
            expressions: [
              {
                filter: {
                  fieldName: "pageLocation",
                  stringFilter: {
                    matchType: "CONTAINS" as const,
                    value: "pagina/",
                    caseSensitive: false,
                  },
                },
              },
              {
                filter: {
                  fieldName: "pageLocation",
                  stringFilter: {
                    matchType: "CONTAINS" as const,
                    value: "undefined",
                    caseSensitive: false,
                  },
                },
              },
            ],
          },
        },
      },
      orderBys: [
        {
          metric: { metricName: "screenPageViews" },
          desc: true,
        },
      ],
      limit: "10000",
    };

    // Get current period data - INCREASED LIMIT TO CAPTURE ALL PAGES
    const currentResponse = await ga.properties.runReport({
      property,
      requestBody: gaQueryParams,
    });

    // Get previous period data
    const prevResponse = await ga.properties.runReport({
      property,
      requestBody: {
        dateRanges: [{ startDate: prevRange.start, endDate: prevRange.end }],
        dimensions: [{ name: "pageLocation" }], // Usar pageLocation (URLs completas) como la gráfica
        metrics: [{ name: "screenPageViews" }],
        // Mismo filtro para excluir paginación y rutas "undefined"
        dimensionFilter: {
          notExpression: {
            orGroup: {
              expressions: [
                {
                  filter: {
                    fieldName: "pageLocation",
                    stringFilter: {
                      matchType: "CONTAINS" as const,
                      value: "pagina/",
                      caseSensitive: false,
                    },
                  },
                },
                {
                  filter: {
                    fieldName: "pageLocation",
                    stringFilter: {
                      matchType: "CONTAINS" as const,
                      value: "undefined",
                      caseSensitive: false,
                    },
                  },
                },
              ],
            },
          },
        },
        limit: "10000", // Same increased limit
      },
    });

    // Process current data - Convertir URLs completas a paths relativos
    const currentData = new Map<string, number>();
    currentResponse.data.rows?.forEach(
      (row: analyticsdata_v1beta.Schema$Row) => {
        const fullUrl = row.dimensionValues?.[0]?.value ?? "";
        const path = urlToPath(fullUrl); // Convertir a path relativo
        const visits = parseInt(row.metricValues?.[0]?.value ?? "0");

        // Si el path ya existe, sumar (por si hay duplicados)
        const existing = currentData.get(path) ?? 0;
        currentData.set(path, existing + visits);
      }
    );

    // Process previous data - Convertir URLs completas a paths relativos
    const prevData = new Map<string, number>();
    prevResponse.data.rows?.forEach((row: analyticsdata_v1beta.Schema$Row) => {
      const fullUrl = row.dimensionValues?.[0]?.value ?? "";
      const path = urlToPath(fullUrl); // Convertir a path relativo
      const visits = parseInt(row.metricValues?.[0]?.value ?? "0");

      // Si el path ya existe, sumar (por si hay duplicados)
      const existing = prevData.get(path) ?? 0;
      prevData.set(path, existing + visits);
    });

    // Combine and process ALL items
    let allItems = Array.from(currentData.entries()).map(([path, visits]) => {
      const label = extractLabel(path);
      const prevVisits = prevData.get(path) ?? null;
      const deltaPct = calculateDeltaPct(visits, prevVisits);

      return {
        path,
        label,
        visits,
        prevVisits,
        deltaPct,
      };
    });

    // Filter by search if provided
    if (search) {
      const searchLower = search.toLowerCase();
      allItems = allItems.filter(
        (item) =>
          item.label.toLowerCase().includes(searchLower) ||
          item.path.toLowerCase().includes(searchLower)
      );
    }

    // Sort items
    allItems.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "visits":
          comparison = a.visits - b.visits;
          break;
        case "deltaPct":
          const aDelta = a.deltaPct ?? -Infinity;
          const bDelta = b.deltaPct ?? -Infinity;
          comparison = aDelta - bDelta;
          break;
        case "label":
          comparison = a.label.localeCompare(b.label);
          break;
        default:
          comparison = a.visits - b.visits;
      }

      return sortDir === "desc" ? -comparison : comparison;
    });

    // Pagination on the COMPLETE dataset
    const totalItems = allItems.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIndex = (page - 1) * pageSize;
    const paginatedItems = allItems.slice(startIndex, startIndex + pageSize);

    // CRITICAL DEBUG: Final response analysis

    const response: TopPagesTableResponse = {
      meta: {
        page,
        pageSize,
        totalItems,
        totalPages,
        granularity,
        start,
        end,
        shiftedPrev: prevRange,
      },
      data: paginatedItems,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[TableAPI] Error in top-pages-table API:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
