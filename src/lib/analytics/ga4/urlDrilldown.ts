/**
 * Servicios para obtener datos de drilldown de URLs desde GA4
 */

import type { DonutDatum } from "@/lib/types";
import { analyticsdata_v1beta } from "googleapis";
import type { DateRange, Totals } from "../drilldown/types";
import { num } from "../drilldown/helpers";
import {
  fetchDimensionApiNames,
  resolveCustomEventDim,
} from "./dimensions";

/**
 * Obtiene KPIs totales agregados para una URL específica
 * Usa filtros AND para eventName='page_view' Y pageLocation=targetUrl
 */
export async function fetchUrlTotalsAggregated(
  analyticsData: analyticsdata_v1beta.Analyticsdata,
  property: string,
  range: DateRange,
  targetUrl: string
): Promise<Totals> {
  // Obtener dimensiones customizadas disponibles
  const dimsAvailable = await fetchDimensionApiNames(
    analyticsData,
    property.replace("properties/", "")
  );
  const puebloDimName = resolveCustomEventDim(dimsAvailable, "pueblo");
  const categoriaDimName = resolveCustomEventDim(dimsAvailable, "categoria");

  // Construir dimensiones: siempre eventName y pageLocation, más las customizadas si están disponibles
  const dimensions: analyticsdata_v1beta.Schema$Dimension[] = [
    { name: "eventName" },
    { name: "pageLocation" },
  ];
  if (puebloDimName) dimensions.push({ name: puebloDimName });
  if (categoriaDimName) dimensions.push({ name: categoriaDimName });

  // Usar filtros AND para eventName Y pageLocation
  const filters: analyticsdata_v1beta.Schema$FilterExpression[] = [
    {
      filter: {
        fieldName: "eventName",
        stringFilter: {
          matchType: "EXACT",
          value: "page_view",
          caseSensitive: false,
        },
      },
    },
    {
      filter: {
        fieldName: "pageLocation",
        stringFilter: {
          matchType: "EXACT",
          value: targetUrl,
          caseSensitive: false,
        },
      },
    },
  ];

  const req: analyticsdata_v1beta.Schema$RunReportRequest = {
    dateRanges: [{ startDate: range.start, endDate: range.end }],
    metrics: [
      { name: "activeUsers" },
      { name: "userEngagementDuration" },
      { name: "newUsers" },
      { name: "eventCount" },
      { name: "sessions" },
      { name: "averageSessionDuration" },
    ],
    dimensions,
    dimensionFilter: {
      andGroup: { expressions: filters },
    },
    keepEmptyRows: false,
    limit: "100000",
  };

  const resp = await analyticsData.properties.runReport({
    property,
    requestBody: req,
  });

  const rows: analyticsdata_v1beta.Schema$Row[] = resp.data.rows ?? [];

  const acc: Totals = {
    activeUsers: 0,
    userEngagementDuration: 0,
    newUsers: 0,
    eventCount: 0,
    sessions: 0,
    averageSessionDuration: 0,
  };

  // Agregación manual con ponderación para averageSessionDuration
  let weightedSum = 0;
  let totalSess = 0;

  for (const r of rows) {
    const m = r.metricValues ?? [];
    const sess = num(m[4]?.value);
    const avgSessDur = num(m[5]?.value);

    acc.activeUsers += num(m[0]?.value);
    acc.userEngagementDuration += num(m[1]?.value);
    acc.newUsers += num(m[2]?.value);
    acc.eventCount += num(m[3]?.value);
    acc.sessions += sess;

    weightedSum += avgSessDur * sess;
    totalSess += sess;
  }

  acc.averageSessionDuration = totalSess > 0 ? weightedSum / totalSess : 0;

  return acc;
}

/**
 * Obtiene datos de donut para una dimensión específica
 * Usa filtros AND para eventName='page_view' Y pageLocation=targetUrl
 */
export async function fetchDonutData(
  analyticsData: analyticsdata_v1beta.Analyticsdata,
  property: string,
  range: DateRange,
  targetUrl: string,
  dimension: "operatingSystem" | "deviceCategory" | "browser" | "country",
  metric: "screenPageViews" | "activeUsers"
): Promise<DonutDatum[]> {
  // Obtener dimensiones customizadas disponibles
  const dimsAvailable = await fetchDimensionApiNames(
    analyticsData,
    property.replace("properties/", "")
  );
  const puebloDimName = resolveCustomEventDim(dimsAvailable, "pueblo");
  const categoriaDimName = resolveCustomEventDim(dimsAvailable, "categoria");

  // Construir dimensiones para donuts: target + eventName + pageLocation + customs
  const donutDimensions: analyticsdata_v1beta.Schema$Dimension[] = [
    { name: dimension },
    { name: "eventName" },
    { name: "pageLocation" },
  ];
  if (puebloDimName) donutDimensions.push({ name: puebloDimName });
  if (categoriaDimName) donutDimensions.push({ name: categoriaDimName });

  // Usar filtros AND como en KPIs: eventName Y pageLocation
  const donutFilters: analyticsdata_v1beta.Schema$FilterExpression[] = [
    {
      filter: {
        fieldName: "eventName",
        stringFilter: {
          matchType: "EXACT",
          value: "page_view",
          caseSensitive: false,
        },
      },
    },
    {
      filter: {
        fieldName: "pageLocation",
        stringFilter: {
          matchType: "EXACT",
          value: targetUrl,
          caseSensitive: false,
        },
      },
    },
  ];

  const req: analyticsdata_v1beta.Schema$RunReportRequest = {
    dateRanges: [{ startDate: range.start, endDate: range.end }],
    metrics: [{ name: metric }],
    dimensions: donutDimensions,
    dimensionFilter: {
      andGroup: { expressions: donutFilters },
    },
    keepEmptyRows: false,
    limit: "100000",
  };

  const r = await analyticsData.properties.runReport({
    property,
    requestBody: req,
  });
  const rowsDonut: analyticsdata_v1beta.Schema$Row[] = r.data.rows ?? [];
  const map = new Map<string, number>();

  // Como GA4 ya filtró por URL exacta, solo sumamos todos los resultados
  for (const row of rowsDonut) {
    const dims = row.dimensionValues ?? [];
    const mets = row.metricValues ?? [];

    // Las dimensiones están en orden: [targetDim, eventName, pageLocation, pueblo?, categoria?]
    const raw = String(dims[0]?.value ?? "Unknown").trim();
    const label = raw.length > 0 ? raw : "Unknown";
    const val = Number(mets[0]?.value ?? 0);
    map.set(label, (map.get(label) ?? 0) + val);
  }

  return Array.from(map.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}
