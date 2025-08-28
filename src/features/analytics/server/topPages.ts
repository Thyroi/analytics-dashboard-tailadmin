import { analyticsdata_v1beta, google } from "googleapis";
import type {
  ISODate,
  TopPagesResponse,
  TopPageItem,
  SeriesItem,
} from "../types";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function toISODate(d: Date): ISODate {
  return d.toISOString().slice(0, 10) as ISODate;
}
function normalizePropertyId(id: string): string {
  const trimmed = id.trim();
  return trimmed.startsWith("properties/") ? trimmed : `properties/${trimmed}`;
}
function defaultRange(): { start: ISODate; end: ISODate } {
  const end = new Date();
  const start = new Date();
  start.setUTCDate(end.getUTCDate() - 29);
  return { start: toISODate(start), end: toISODate(end) };
}

export async function buildTopPagesPayload(
  start?: ISODate,
  end?: ISODate,
  limit: number = 5
): Promise<TopPagesResponse> {
  const clientEmail = process.env.GA_CLIENT_EMAIL;
  const privateKey = process.env.GA_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const propertyId = process.env.GA_PROPERTY_ID;

  if (!clientEmail || !privateKey || !propertyId) {
    throw new Error("Faltan credenciales o Property ID de Google Analytics");
  }

  const range = {
    ...defaultRange(),
    ...(start && DATE_RE.test(start) ? { start } : {}),
    ...(end && DATE_RE.test(end) ? { end } : {}),
  };

  const auth = new google.auth.GoogleAuth({
    credentials: { client_email: clientEmail, private_key: privateKey },
    scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
  });
  const analyticsData = google.analyticsdata({ version: "v1beta", auth });

  // 1) TOP pages agregadas en el rango
  const topReq: analyticsdata_v1beta.Schema$RunReportRequest = {
    dateRanges: [{ startDate: range.start, endDate: range.end }],
    metrics: [{ name: "screenPageViews" }],
    dimensions: [{ name: "pagePath" }, { name: "pageTitle" }],
    orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
    limit: String(Math.max(1, limit + 20)), // pedimos de más por si hay (not set) / duplicados
  };

  const topParams: analyticsdata_v1beta.Params$Resource$Properties$Runreport = {
    property: normalizePropertyId(propertyId),
    requestBody: topReq,
  };

  const topResp = await analyticsData.properties.runReport(topParams);
  const topRows = topResp.data.rows ?? [];

  // Total global (todas las páginas)
  const totalViews =
    topResp.data.totals?.[0]?.metricValues?.[0]?.value !== undefined
      ? Number(topResp.data.totals[0].metricValues![0].value)
      : topRows.reduce(
          (acc, r) => acc + Number(r.metricValues?.[0]?.value ?? 0),
          0
        );

  // Agregar por pagePath (dedupe). Sumamos vistas y preferimos el primer título definido.
  const agg = new Map<string, TopPageItem>();
  for (const r of topRows) {
    const path = r.dimensionValues?.[0]?.value ?? "";
    if (!path || path === "(not set)") continue;
    const rawTitle = r.dimensionValues?.[1]?.value;
    const title =
      !rawTitle || rawTitle === "(not set)" ? undefined : String(rawTitle);
    const views = Number(r.metricValues?.[0]?.value ?? 0);

    const curr = agg.get(path);
    if (!curr) {
      agg.set(path, { path, title, views });
    } else {
      curr.views += views;
      if (!curr.title && title) curr.title = title;
    }
  }

  const topPages = Array.from(agg.values())
    .sort((a, b) => b.views - a.views)
    .slice(0, limit);

  // 2) Serie diaria para esas rutas (únicas)
  const pagePaths = topPages.map((p) => p.path);
  if (pagePaths.length === 0) {
    return {
      summary: { range, totalViews, pages: [] },
      trend: { categories: [], series: [] },
    };
  }

  const trendReq: analyticsdata_v1beta.Schema$RunReportRequest = {
    dateRanges: [{ startDate: range.start, endDate: range.end }],
    metrics: [{ name: "screenPageViews" }],
    dimensions: [{ name: "date" }, { name: "pagePath" }],
    // ✅ inListFilter debe ir dentro de 'filter'
    dimensionFilter: {
      filter: {
        fieldName: "pagePath",
        inListFilter: { values: pagePaths, caseSensitive: false },
      },
    },
    orderBys: [{ dimension: { dimensionName: "date" } }],
    keepEmptyRows: true,
    limit: "100000",
  };

  const trendParams: analyticsdata_v1beta.Params$Resource$Properties$Runreport =
    {
      property: normalizePropertyId(propertyId),
      requestBody: trendReq,
    };

  const trendResp = await analyticsData.properties.runReport(trendParams);
  const trendRows = trendResp.data.rows ?? [];

  // Categories YYYY-MM-DD
  const catSet = new Set<ISODate>();
  for (const r of trendRows) {
    const d = r.dimensionValues?.[0]?.value as ISODate | undefined;
    if (d) catSet.add(d);
  }
  const categories = Array.from(catSet).sort();

  // Serie por path
  const seriesByPath = new Map<string, number[]>();
  pagePaths.forEach((p) => seriesByPath.set(p, new Array(categories.length).fill(0)));

  for (const r of trendRows) {
    const d = r.dimensionValues?.[0]?.value as ISODate | undefined;
    const p = r.dimensionValues?.[1]?.value;
    const v = Number(r.metricValues?.[0]?.value ?? 0);
    if (!d || !p) continue;
    const idx = categories.indexOf(d);
    const arr = seriesByPath.get(p);
    if (idx >= 0 && arr) arr[idx] = v;
  }

  const series: SeriesItem[] = topPages.map((p) => ({
    name: p.title ?? p.path,
    data: seriesByPath.get(p.path) ?? new Array(categories.length).fill(0),
  }));

  return {
    summary: { range, totalViews, pages: topPages },
    trend: { categories, series },
  };
}
