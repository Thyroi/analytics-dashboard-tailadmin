/**
 * /api/analytics/v1/dimensions/pueblos/totales/route.ts
 * Endpoint refactorizado usando taxonomía oficial y lógica optimizada
 */

import {
  TOWN_ID_ORDER,
  TOWN_META,
  type TownId,
  getTownLabel,
} from "@/lib/taxonomy/towns";
import type { Granularity } from "@/lib/types";
import {
  getAuth,
  normalizePropertyId,
  resolvePropertyId,
} from "@/lib/utils/analytics/ga";
import { buildPageViewWithFilterUnionRequest } from "@/lib/utils/analytics/ga4Requests";
import { safeUrlPathname } from "@/lib/utils/routing/pathMatching";
import { calculatePreviousPeriodAndGranularity } from "@/lib/utils/time/rangeCalculations";
import { computeDeltaPct } from "@/lib/utils/time/timeWindows";
import { google } from "googleapis";
import { NextResponse } from "next/server";

/* -------- Town matching utilities (refactored from original) -------- */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getTokensForTown(id: TownId): string[] {
  const label = TOWN_META[id].label;
  const normalized = label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const kebabCase = normalized
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const compactCase = normalized.replace(/[^a-z0-9]+/g, "");
  const idLower = id.toLowerCase();

  return Array.from(new Set([kebabCase, compactCase, idLower].filter(Boolean)));
}

function buildTownRegex(towns: TownId[]): string {
  const hostPattern = "^https?://[^/]+";
  const alternatives: string[] = [];

  for (const id of towns) {
    const tokens = getTokensForTown(id).map(escapeRegex);
    alternatives.push(
      `(?:/(?:${tokens.join("|")})(?:/|$)|[-_](?:${tokens.join(
        "|"
      )})[-_]|${tokens.join("|")})`
    );
  }

  return `${hostPattern}.*(?:${alternatives.join("|")}).*`;
}

function matchTownFromPath(path: string, towns: TownId[]): TownId | null {
  const lowerPath = path.toLowerCase();

  for (const id of towns) {
    const tokens = getTokensForTown(id);
    const hasMatch = tokens.some(
      (token) =>
        lowerPath.includes(`/${token}/`) ||
        lowerPath.endsWith(`/${token}`) ||
        lowerPath.includes(`-${token}-`) ||
        lowerPath.includes(`_${token}_`) ||
        lowerPath.includes(token)
    );

    if (hasMatch) return id;
  }

  return null;
}

/* -------- Main handler con nueva lógica de rangos -------- */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const startQ = searchParams.get("startDate");
    const endQ = searchParams.get("endDate");
    const granularityOverride = searchParams.get(
      "granularity"
    ) as Granularity | null;

    // Validar que tenemos fechas requeridas
    if (!startQ || !endQ) {
      return NextResponse.json(
        {
          error: "Missing required parameters: startDate and endDate",
        },
        { status: 400 }
      );
    }

    // Calcular rangos usando la nueva función
    const calculation = calculatePreviousPeriodAndGranularity(startQ, endQ);

    // Usar granularidad calculada o override
    const finalGranularity = granularityOverride || calculation.granularity;

    const ranges = {
      current: calculation.currentRange,
      previous: calculation.prevRange,
    };
    const towns: TownId[] = [...TOWN_ID_ORDER];

    // Configurar GA4
    const auth = getAuth();
    const analytics = google.analyticsdata({ version: "v1beta", auth });
    const property = normalizePropertyId(resolvePropertyId());

    // Construir query usando helper con filtro combinado: page_view + towns regex
    const requestBody = buildPageViewWithFilterUnionRequest({
      current: ranges.current,
      previous: ranges.previous,
      granularity: finalGranularity, // ✅ AGREGAR: Pasar granularidad para consistencia
      additionalFilter: {
        filter: {
          fieldName: "pageLocation",
          stringFilter: {
            matchType: "FULL_REGEXP",
            value: buildTownRegex(towns),
            caseSensitive: false,
          },
        },
      },
      metrics: [{ name: "eventCount" }],
    });

    const resp = await analytics.properties.runReport({
      property,
      requestBody,
    });
    const rows = resp.data.rows ?? [];

    // Inicializar contadores
    const currentTotals: Record<TownId, number> = Object.fromEntries(
      towns.map((t) => [t, 0])
    ) as Record<TownId, number>;
    const previousTotals: Record<TownId, number> = Object.fromEntries(
      towns.map((t) => [t, 0])
    ) as Record<TownId, number>;

    // Procesar datos GA4 con soporte para yearMonth (6 dígitos) y date (8 dígitos)
    for (const row of rows) {
      const dateRaw = String(row.dimensionValues?.[0]?.value ?? "");

      // Convertir a formato ISO según longitud
      let iso: string;
      if (dateRaw.length === 8) {
        // date dimension: YYYYMMDD
        iso = `${dateRaw.slice(0, 4)}-${dateRaw.slice(4, 6)}-${dateRaw.slice(
          6,
          8
        )}`;
      } else if (dateRaw.length === 6) {
        // yearMonth dimension: YYYYMM → usar primer día del mes
        iso = `${dateRaw.slice(0, 4)}-${dateRaw.slice(4, 6)}-01`;
      } else {
        continue; // Formato desconocido, saltar
      }

      const url = String(row.dimensionValues?.[1]?.value ?? "");
      const path = safeUrlPathname(url);
      const value = Number(row.metricValues?.[0]?.value ?? 0);

      const town = matchTownFromPath(path, towns);
      if (!town) continue;

      if (iso >= ranges.current.start && iso <= ranges.current.end) {
        currentTotals[town] += value;
      } else if (iso >= ranges.previous.start && iso <= ranges.previous.end) {
        previousTotals[town] += value;
      }
    }

    // Construir respuesta
    const items = towns.map((id) => {
      const current = currentTotals[id] ?? 0;
      const previous = previousTotals[id] ?? 0;
      return {
        id,
        title: getTownLabel(id),
        total: current,
        previousTotal: previous, // ✨ NUEVO: incluir valor anterior
        deltaPct: computeDeltaPct(current, previous),
      };
    });

    return NextResponse.json(
      {
        success: true,
        calculation: {
          requestedGranularity: finalGranularity,
          finalGranularity,
          granularityReason: granularityOverride
            ? "overridden by query param"
            : "calculated automatically",
          currentPeriod: {
            start: ranges.current.start,
            end: ranges.current.end,
          },
          previousPeriod: {
            start: ranges.previous.start,
            end: ranges.previous.end,
          },
        },
        data: {
          property,
          items,
        },
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
