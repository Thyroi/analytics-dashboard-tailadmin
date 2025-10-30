/**
 * Funciones de consulta a Google Analytics 4 para donuts y geografía
 */

import type { Granularity } from "@/lib/types";
import {
  getAuth,
  normalizePropertyId,
  resolvePropertyId,
} from "@/lib/utils/analytics/ga";
import {
  getEnglishRegionName,
  translateCountry,
  translateRegion,
} from "@/lib/utils/analytics/regionTranslations";
import { computeRangesForKPI } from "@/lib/utils/time/timeWindows";
import { analyticsdata_v1beta, google } from "googleapis";
import type {
  CitiesResponse,
  CityRow,
  CountriesResponse,
  CountryRow,
  DonutItem,
  RegionRow,
  RegionsResponse,
  SimpleDonutResponse,
} from "./types";

/**
 * Query GA4 para donuts simples con una dimensión
 */
export async function querySimpleDonut(
  dimension: string,
  metric: string = "activeUsers",
  granularity: Granularity,
  startQ?: string | null,
  endQ?: string | null,
  additionalFilters?: analyticsdata_v1beta.Schema$FilterExpression[]
): Promise<SimpleDonutResponse> {
  // Usar rangos KPI (agregación)
  const ranges = computeRangesForKPI(granularity, startQ, endQ);

  // Auth + GA4
  const auth = getAuth();
  const analytics = google.analyticsdata({ version: "v1beta", auth });
  const property = normalizePropertyId(resolvePropertyId());

  // Query GA4
  const request: analyticsdata_v1beta.Schema$RunReportRequest = {
    dateRanges: [
      { startDate: ranges.current.start, endDate: ranges.current.end },
    ],
    dimensions: [{ name: dimension }],
    metrics: [{ name: metric }],
    dimensionFilter: additionalFilters?.length
      ? {
          andGroup: {
            expressions: additionalFilters,
          },
        }
      : undefined,
    orderBys: [{ metric: { metricName: metric }, desc: true }],
    keepEmptyRows: false,
    limit: "50", // Límite generoso para donuts
  };

  const resp = await analytics.properties.runReport({
    property,
    requestBody: request,
  });

  const rows = resp.data.rows ?? [];

  // Procesar items
  const items: DonutItem[] = rows
    .map((r) => {
      const label = String(r.dimensionValues?.[0]?.value ?? "unknown");
      const value = Number(r.metricValues?.[0]?.value ?? 0);
      return { label, value };
    })
    .filter((item) => item.value > 0) // Filtrar valores 0
    .sort((a, b) => b.value - a.value); // Ordenar por valor descendente

  const total = items.reduce((sum, item) => sum + item.value, 0);

  return {
    items,
    range: ranges.current,
    property,
    total,
  };
}

/**
 * Query para países con porcentajes (requiere total global)
 */
export async function queryCountries(
  granularity: Granularity,
  startQ?: string | null,
  endQ?: string | null,
  limit: number = 100
): Promise<CountriesResponse> {
  // Usar rangos KPI (agregación)
  const ranges = computeRangesForKPI(granularity, startQ, endQ);

  // Auth + GA4
  const auth = getAuth();
  const analytics = google.analyticsdata({ version: "v1beta", auth });
  const property = normalizePropertyId(resolvePropertyId());

  // 1) Query total global
  const totalReq: analyticsdata_v1beta.Schema$RunReportRequest = {
    dateRanges: [
      { startDate: ranges.current.start, endDate: ranges.current.end },
    ],
    metrics: [{ name: "activeUsers" }],
    keepEmptyRows: false,
    limit: "1",
  };

  // 2) Query desglose por países
  const countriesReq: analyticsdata_v1beta.Schema$RunReportRequest = {
    dateRanges: [
      { startDate: ranges.current.start, endDate: ranges.current.end },
    ],
    metrics: [{ name: "activeUsers" }],
    dimensions: [{ name: "country" }, { name: "countryId" }],
    orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
    keepEmptyRows: false,
    limit: String(limit),
  };

  // Ejecutar queries en paralelo
  const [totalResp, countriesResp] = await Promise.all([
    analytics.properties.runReport({ property, requestBody: totalReq }),
    analytics.properties.runReport({ property, requestBody: countriesReq }),
  ]);

  const globalTotal =
    Number(totalResp.data.rows?.[0]?.metricValues?.[0]?.value ?? 0) || 0;
  const rowsRaw = countriesResp.data.rows ?? [];

  // Procesar filas de países
  const rows: CountryRow[] = rowsRaw.map((r) => {
    const countryEnglish = String(r.dimensionValues?.[0]?.value ?? "Unknown");
    const country = translateCountry(countryEnglish); // Traducir a español
    const codeRaw = String(r.dimensionValues?.[1]?.value ?? "");
    const code = codeRaw && codeRaw.length === 2 ? codeRaw.toUpperCase() : null;
    const customers = Number(r.metricValues?.[0]?.value ?? 0) || 0;
    const pct =
      globalTotal > 0 ? Math.round((customers / globalTotal) * 100) : 0;

    return { country, code, customers, pct };
  });

  return {
    range: ranges.current,
    property,
    total: globalTotal,
    rows,
  };
}

/**
 * Query para regiones dentro de un país específico
 */
export async function queryRegions(
  countryCode: string,
  granularity: Granularity,
  startQ?: string | null,
  endQ?: string | null,
  limit: number = 100
): Promise<RegionsResponse> {
  // Usar rangos KPI (agregación)
  const ranges = computeRangesForKPI(granularity, startQ, endQ);

  // Auth + GA4
  const auth = getAuth();
  const analytics = google.analyticsdata({ version: "v1beta", auth });
  const property = normalizePropertyId(resolvePropertyId());

  // 1) Total del país
  const totalReq: analyticsdata_v1beta.Schema$RunReportRequest = {
    dateRanges: [
      { startDate: ranges.current.start, endDate: ranges.current.end },
    ],
    metrics: [{ name: "activeUsers" }],
    dimensions: [{ name: "countryId" }],
    dimensionFilter: {
      filter: { fieldName: "countryId", stringFilter: { value: countryCode } },
    },
    keepEmptyRows: false,
    limit: "1",
  };

  // 2) Regiones dentro del país
  const regionsReq: analyticsdata_v1beta.Schema$RunReportRequest = {
    dateRanges: [
      { startDate: ranges.current.start, endDate: ranges.current.end },
    ],
    metrics: [{ name: "activeUsers" }],
    dimensions: [{ name: "countryId" }, { name: "region" }],
    dimensionFilter: {
      filter: { fieldName: "countryId", stringFilter: { value: countryCode } },
    },
    orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
    keepEmptyRows: false,
    limit: String(limit),
  };

  // Ejecutar queries en paralelo
  const [totalResp, regionsResp] = await Promise.all([
    analytics.properties.runReport({ property, requestBody: totalReq }),
    analytics.properties.runReport({ property, requestBody: regionsReq }),
  ]);

  const total =
    Number(totalResp.data.rows?.[0]?.metricValues?.[0]?.value ?? 0) || 0;
  const rowsRaw = regionsResp.data.rows ?? [];

  // Procesar filas de regiones
  const rows: RegionRow[] = rowsRaw.map((r) => {
    const regionEnglish = String(r.dimensionValues?.[1]?.value ?? "Unknown");
    const region = translateRegion(regionEnglish); // Traducir a español
    const customers = Number(r.metricValues?.[0]?.value ?? 0) || 0;
    const pct = total > 0 ? Math.round((customers / total) * 100) : 0;

    return { region, code: null, customers, pct };
  });

  return {
    range: ranges.current,
    property,
    country: { code: countryCode, name: null },
    total,
    rows,
  };
}

/**
 * Query para ciudades dentro de un país y región específicos
 */
export async function queryCities(
  countryCode: string,
  regionName: string,
  granularity: Granularity,
  startQ?: string | null,
  endQ?: string | null,
  limit: number = 100
): Promise<CitiesResponse> {
  // Usar rangos KPI (agregación)
  const ranges = computeRangesForKPI(granularity, startQ, endQ);

  // Auth + GA4
  const auth = getAuth();
  const analytics = google.analyticsdata({ version: "v1beta", auth });
  const property = normalizePropertyId(resolvePropertyId());

  // Convertir nombre de región a inglés para el filtro de GA4
  const regionNameEnglish = getEnglishRegionName(regionName);

  // Filtros combinados para país + región
  const filters: analyticsdata_v1beta.Schema$FilterExpression[] = [
    {
      filter: { fieldName: "countryId", stringFilter: { value: countryCode } },
    },
    {
      filter: {
        fieldName: "region",
        stringFilter: { value: regionNameEnglish },
      },
    },
  ];

  // 1) Total de la región
  const totalReq: analyticsdata_v1beta.Schema$RunReportRequest = {
    dateRanges: [
      { startDate: ranges.current.start, endDate: ranges.current.end },
    ],
    metrics: [{ name: "activeUsers" }],
    dimensions: [{ name: "countryId" }, { name: "region" }],
    dimensionFilter: {
      andGroup: { expressions: filters },
    },
    keepEmptyRows: false,
    limit: "1",
  };

  // 2) Ciudades dentro de la región
  const citiesReq: analyticsdata_v1beta.Schema$RunReportRequest = {
    dateRanges: [
      { startDate: ranges.current.start, endDate: ranges.current.end },
    ],
    metrics: [{ name: "activeUsers" }],
    dimensions: [{ name: "countryId" }, { name: "region" }, { name: "city" }],
    dimensionFilter: {
      andGroup: { expressions: filters },
    },
    orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
    keepEmptyRows: false,
    limit: String(limit),
  };

  // Ejecutar queries en paralelo
  const [totalResp, citiesResp] = await Promise.all([
    analytics.properties.runReport({ property, requestBody: totalReq }),
    analytics.properties.runReport({ property, requestBody: citiesReq }),
  ]);

  const total =
    Number(totalResp.data.rows?.[0]?.metricValues?.[0]?.value ?? 0) || 0;
  const rowsRaw = citiesResp.data.rows ?? [];

  // Procesar filas de ciudades
  const rows: CityRow[] = rowsRaw.map((r) => {
    const city = String(r.dimensionValues?.[2]?.value ?? "Unknown");
    const customers = Number(r.metricValues?.[0]?.value ?? 0) || 0;
    const pct = total > 0 ? Math.round((customers / total) * 100) : 0;

    return { city, customers, pct };
  });

  return {
    range: ranges.current,
    property,
    country: { code: countryCode, name: null },
    region: regionName,
    total,
    rows,
  };
}
