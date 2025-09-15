import { NextResponse } from "next/server";
import { google, analyticsdata_v1beta } from "googleapis";
import type { GoogleAuth } from "google-auth-library";

type SourceKey = "wpideanto" | undefined;
type ForceCase = "lower" | "capitalized" | "auto";

/* ====================== Tipos de salida ====================== */
type UrlHit = { url: string; events: number; views: number };
type Facet = { value: string; events: number; views: number };

type Payload = {
  range: { start: string; end: string };
  property: string;
  params: {
    source?: SourceKey;
    limit: number;
    eventName: string;           // "page_view" | "all" | "*"
    puebloValue?: string;
    categoriaValue?: string;
    puebloDimForce: ForceCase;
    categoriaDimForce: ForceCase;
  };
  summary: { eventName: string; events: number; views: number };
  dims: {
    hasPuebloDim: boolean;
    hasCategoriaDim: boolean;
    puebloDimName?: string;
    categoriaDimName?: string;
  };
  byEvent: Facet[];              // <- NUEVO: eventos (eventName)
  byUrl: { totalUrls: number; top: UrlHit[] };
  byPueblo: Facet[];
  byCategoria: Facet[];
  debug: {
    puebloCandidates: string[];
    categoriaCandidates: string[];
    usedPuebloDim?: string;
    usedCategoriaDim?: string;
    appliedEventFilter: boolean;
  };
};

/* ====================== Helpers básicos ====================== */
function getRequiredEnv(name: string): string {
  const v = process.env[name];
  if (!v || v.trim() === "") throw new Error(`Falta la variable de entorno ${name}`);
  return v;
}
function normalizePropertyId(id: string): string {
  const t = id.trim();
  return t.startsWith("properties/") ? t : `properties/${t}`;
}
function resolvePropertyId(sourceKey?: SourceKey): string {
  if (sourceKey === "wpideanto") return getRequiredEnv("GA_PROPERTY_ID_WPIDEANTO");
  return getRequiredEnv("GA_PROPERTY_ID");
}
function defaultRange(): { start: string; end: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 44);
  const toISO = (d: Date) => d.toISOString().split("T")[0];
  return { start: toISO(start), end: toISO(end) };
}
function getAuth(): GoogleAuth {
  const clientEmail = getRequiredEnv("GA_CLIENT_EMAIL");
  const privateKey = getRequiredEnv("GA_PRIVATE_KEY").replace(/\\n/g, "\n");
  return new google.auth.GoogleAuth({
    credentials: { client_email: clientEmail, private_key: privateKey },
    scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
  });
}
function safeUrlPathname(raw: string): string {
  try { const u = new URL(raw); return u.pathname || "/"; }
  catch { return raw.startsWith("/") ? raw : `/${raw}`; }
}
function sum(ns: number[]): number { return ns.reduce((a, b) => a + b, 0); }
function isUnsetValue(raw: string): boolean {
  const s = (raw || "").trim().toLowerCase();
  return s === "" || s === "(not set)" || s === "not set" || s === "(not-set)" || s === "(notset)";
}

/* ===== Metadata helpers ===== */
async function fetchDimensionApiNames(
  analyticsData: analyticsdata_v1beta.Analyticsdata,
  propertyId: string
): Promise<string[]> {
  const name = `${normalizePropertyId(propertyId)}/metadata`;
  const meta = await analyticsData.properties.getMetadata({ name });
  return meta.data.dimensions?.map((d) => d.apiName ?? "").filter((s) => s) ?? [];
}
function buildCustomEventCandidates(base: string, force: ForceCase): string[] {
  const lower = `customEvent:${base.toLowerCase()}`;
  const capitalized = `customEvent:${base.charAt(0).toUpperCase()}${base.slice(1)}`;
  const raw = `customEvent:${base}`;
  return force === "lower" ? [lower, capitalized, raw]
       : force === "capitalized" ? [capitalized, lower, raw]
       : [lower, capitalized, raw];
}
function resolveCustomEventDim(
  available: string[],
  base: string,
  force: ForceCase
): { used?: string; candidates: string[] } {
  const candidates = buildCustomEventCandidates(base, force);
  const availLC = available.map((a) => a.toLowerCase());
  for (const cand of candidates) {
    const idx = availLC.indexOf(cand.toLowerCase());
    if (idx >= 0) return { used: available[idx], candidates };
  }
  // Fallback por sufijo ":base"
  const suffix = `:${base.toLowerCase()}`;
  const idx2 = availLC.findIndex((a) => a.startsWith("customevent:") && a.endsWith(suffix));
  if (idx2 >= 0) return { used: available[idx2], candidates };
  return { used: undefined, candidates };
}

/* ====================== API Route (RAW) ====================== */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    // Params
    const start = searchParams.get("start") || undefined;
    const end = searchParams.get("end") || undefined;
    const source = (searchParams.get("source") as SourceKey | null) || undefined;
    const limitNum = Number(searchParams.get("limit") || "20000");
    const eventNameParam = (searchParams.get("event") || "page_view").trim(); // "page_view" | "all" | "*"

    const puebloDimForce = (searchParams.get("puebloDimForce") as ForceCase) || "auto";
    const categoriaDimForce = (searchParams.get("categoriaDimForce") as ForceCase) || "auto";
    const puebloValue = (searchParams.get("puebloValue") || "").trim() || undefined;
    const categoriaValue = (searchParams.get("categoriaValue") || "").trim() || undefined;

    const range = start && end ? { start, end } : defaultRange();

    // Auth + GA4
    const auth = getAuth();
    const analyticsData = google.analyticsdata({ version: "v1beta", auth });
    const propertyId = resolvePropertyId(source);

    // Metadata -> dims personalizadas
    const dimsAvailable = await fetchDimensionApiNames(analyticsData, propertyId);
    const puebloRes = resolveCustomEventDim(dimsAvailable, "pueblo", puebloDimForce);
    const categoriaRes = resolveCustomEventDim(dimsAvailable, "categoria", categoriaDimForce);
    const puebloDimName = puebloRes.used;
    const categoriaDimName = categoriaRes.used;

    // Dimensiones en este orden:
    // 0: eventName, 1: pageLocation, 2: Pueblo (si existe), 3: Categoria (si existe)
    const dimensions: analyticsdata_v1beta.Schema$Dimension[] = [
      { name: "eventName" },
      { name: "pageLocation" },
    ];
    if (puebloDimName) dimensions.push({ name: puebloDimName });
    if (categoriaDimName) dimensions.push({ name: categoriaDimName });

    // Filtros:
    const applyEventFilter = !(eventNameParam === "all" || eventNameParam === "*");
    const filters: analyticsdata_v1beta.Schema$FilterExpression[] = [];

    if (applyEventFilter) {
      filters.push({
        filter: {
          fieldName: "eventName",
          stringFilter: { matchType: "EXACT", value: eventNameParam, caseSensitive: false },
        },
      });
    }

    if (puebloValue && puebloDimName) {
      filters.push({
        filter: {
          fieldName: puebloDimName,
          stringFilter: { matchType: "EXACT", value: puebloValue, caseSensitive: false },
        },
      });
    }
    if (categoriaValue && categoriaDimName) {
      filters.push({
        filter: {
          fieldName: categoriaDimName,
          stringFilter: { matchType: "EXACT", value: categoriaValue, caseSensitive: false },
        },
      });
    }

    const requestBody: analyticsdata_v1beta.Schema$RunReportRequest = {
      dateRanges: [{ startDate: range.start, endDate: range.end }],
      metrics: [{ name: "eventCount" }, { name: "screenPageViews" }],
      dimensions,
      dimensionFilter:
        filters.length === 0 ? undefined
        : filters.length === 1 ? filters[0]
        : { andGroup: { expressions: filters } },
      limit: String(limitNum),
      orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
      keepEmptyRows: false,
    };

    const resp = await analyticsData.properties.runReport({
      property: normalizePropertyId(propertyId),
      requestBody,
    });

    const rows = resp.data.rows ?? [];

    // Índices efectivos
    const IDX = {
      eventName: 0,
      pageLocation: 1,
      pueblo: puebloDimName ? 2 : -1,
      categoria: categoriaDimName ? (puebloDimName ? 3 : 2) : -1,
    };

    // Agregaciones
    let totalEvents = 0;
    let totalViews = 0;

    const byEventAgg = new Map<string, { events: number; views: number }>();
    const urlEvents = new Map<string, number>();
    const urlViews = new Map<string, number>();
    const puebloAgg = new Map<string, { events: number; views: number }>();
    const categoriaAgg = new Map<string, { events: number; views: number }>();

    for (const r of rows) {
      const dimsVals = r.dimensionValues ?? [];
      const mets = r.metricValues ?? [];

      const evName = String(dimsVals[IDX.eventName]?.value ?? "");
      const events = Number(mets[0]?.value ?? 0);
      const views = Number(mets[1]?.value ?? 0);

      totalEvents += events;
      totalViews += views;

      // por evento
      const evCur = byEventAgg.get(evName) ?? { events: 0, views: 0 };
      evCur.events += events;
      evCur.views += views;
      byEventAgg.set(evName, evCur);

      // URL
      const rawLoc = String(dimsVals[IDX.pageLocation]?.value ?? "");
      const path = safeUrlPathname(rawLoc);
      urlEvents.set(path, (urlEvents.get(path) ?? 0) + events);
      urlViews.set(path, (urlViews.get(path) ?? 0) + views);

      // Pueblo
      if (IDX.pueblo >= 0) {
        const pvRaw = String(dimsVals[IDX.pueblo]?.value ?? "");
        const pv = isUnsetValue(pvRaw) ? "" : pvRaw;
        if (pv) {
          const cur = puebloAgg.get(pv) ?? { events: 0, views: 0 };
          cur.events += events;
          cur.views += views;
          puebloAgg.set(pv, cur);
        }
      }

      // Categoria
      if (IDX.categoria >= 0) {
        const cvRaw = String(dimsVals[IDX.categoria]?.value ?? "");
        const cv = isUnsetValue(cvRaw) ? "" : cvRaw;
        if (cv) {
          const cur = categoriaAgg.get(cv) ?? { events: 0, views: 0 };
          cur.events += events;
          cur.views += views;
          categoriaAgg.set(cv, cur);
        }
      }
    }

    const byEvent: Facet[] = Array.from(byEventAgg.entries())
      .map(([value, v]) => ({ value, events: v.events, views: v.views }))
      .sort((a, b) => b.events - a.events);

    const byUrlTop: UrlHit[] = Array.from(urlEvents.entries())
      .map(([url, events]) => ({ url, events, views: urlViews.get(url) ?? 0 }))
      .sort((a, b) => b.events - a.events)
      .slice(0, 200);

    const byPueblo: Facet[] = Array.from(puebloAgg.entries())
      .map(([value, v]) => ({ value, events: v.events, views: v.views }))
      .sort((a, b) => b.events - a.events);

    const byCategoria: Facet[] = Array.from(categoriaAgg.entries())
      .map(([value, v]) => ({ value, events: v.events, views: v.views }))
      .sort((a, b) => b.events - a.events);

    const effectiveEventName = applyEventFilter ? eventNameParam : "all";

    const payload: Payload = {
      range,
      property: propertyId,
      params: {
        source,
        limit: limitNum,
        eventName: effectiveEventName,
        puebloValue,
        categoriaValue,
        puebloDimForce,
        categoriaDimForce,
      },
      summary: { eventName: effectiveEventName, events: totalEvents, views: totalViews },
      dims: {
        hasPuebloDim: Boolean(puebloDimName),
        hasCategoriaDim: Boolean(categoriaDimName),
        ...(puebloDimName ? { puebloDimName } : {}),
        ...(categoriaDimName ? { categoriaDimName } : {}),
      },
      byEvent,
      byUrl: { totalUrls: urlEvents.size, top: byUrlTop },
      byPueblo,
      byCategoria,
      debug: {
        puebloCandidates: buildCustomEventCandidates("pueblo", puebloDimForce),
        categoriaCandidates: buildCustomEventCandidates("categoria", categoriaDimForce),
        usedPuebloDim: puebloDimName,
        usedCategoriaDim: categoriaDimName,
        appliedEventFilter: applyEventFilter,
      },
    };

    return NextResponse.json(payload, { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
