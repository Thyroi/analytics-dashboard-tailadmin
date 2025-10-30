/**
 * Request handlers para APIs de donuts y geografía
 */

import type { Granularity } from "@/lib/types";
import { analyticsdata_v1beta } from "googleapis";
import {
  queryCities,
  queryCountries,
  queryRegions,
  querySimpleDonut,
} from "./queries";
import type {
  CitiesResponse,
  CountriesResponse,
  RegionsResponse,
  SimpleDonutResponse,
} from "./types";

/**
 * Handler genérico para rutas de donuts simples
 */
export async function handleSimpleDonutRequest(
  req: Request,
  dimension: string,
  metric: string = "activeUsers",
  additionalFilters?: analyticsdata_v1beta.Schema$FilterExpression[]
): Promise<SimpleDonutResponse> {
  const { searchParams } = new URL(req.url);
  const startQ = searchParams.get("start");
  const endQ = searchParams.get("end");
  const granularity = (searchParams.get("granularity") || "d") as Granularity;

  return querySimpleDonut(
    dimension,
    metric,
    granularity,
    startQ,
    endQ,
    additionalFilters
  );
}

/**
 * Handler para rutas de países con porcentajes
 */
export async function handleCountriesRequest(
  req: Request
): Promise<CountriesResponse> {
  const { searchParams } = new URL(req.url);
  const startQ = searchParams.get("start");
  const endQ = searchParams.get("end");
  const granularity = (searchParams.get("granularity") || "d") as Granularity;
  const limitParam = searchParams.get("limit");

  // Clamp limit
  const limit = (() => {
    const n = Number(limitParam ?? "100");
    if (!Number.isFinite(n)) return 100;
    return Math.max(1, Math.min(5000, Math.floor(n)));
  })();

  return queryCountries(granularity, startQ, endQ, limit);
}

/**
 * Handler para rutas de regiones dentro de un país
 */
export async function handleRegionsRequest(
  req: Request,
  countryCode: string
): Promise<RegionsResponse> {
  const { searchParams } = new URL(req.url);
  const startQ = searchParams.get("start");
  const endQ = searchParams.get("end");
  const granularity = (searchParams.get("granularity") || "d") as Granularity;
  const limitParam = searchParams.get("limit");

  // Clamp limit
  const limit = (() => {
    const n = Number(limitParam ?? "100");
    if (!Number.isFinite(n)) return 100;
    return Math.max(1, Math.min(5000, Math.floor(n)));
  })();

  return queryRegions(countryCode, granularity, startQ, endQ, limit);
}

/**
 * Handler para rutas de ciudades dentro de un país y región
 */
export async function handleCitiesRequest(
  req: Request,
  countryCode: string,
  regionName: string
): Promise<CitiesResponse> {
  const { searchParams } = new URL(req.url);
  const startQ = searchParams.get("start");
  const endQ = searchParams.get("end");
  const granularity = (searchParams.get("granularity") || "d") as Granularity;
  const limitParam = searchParams.get("limit");

  // Clamp limit
  const limit = (() => {
    const n = Number(limitParam ?? "100");
    if (!Number.isFinite(n)) return 100;
    return Math.max(1, Math.min(5000, Math.floor(n)));
  })();

  return queryCities(countryCode, regionName, granularity, startQ, endQ, limit);
}
