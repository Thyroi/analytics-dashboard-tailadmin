import type {
  BuildLevel1Params,
  BuildLevel1Result,
  ChartSlice,
  OtrosDetailItem,
  RawSeriesByKey,
  SeriesPoint,
  SublevelInfo,
} from "./buildLevel1.types";
import {
  aggregateSeriesByTime,
  extractTailAfterScope,
  matchFromAliases,
  sumSeries,
} from "./normalize";

function aggregateKeyValue(
  series: SeriesPoint[],
  mode: "sum" | "last",
): number {
  return sumSeries(series, mode);
}

function toPrefixFromPattern(p: string): string {
  return p.endsWith(".*") ? p.slice(0, -2) : p;
}

function debugLog(debug: boolean | undefined, ...args: unknown[]) {
  if (debug) console.log(...args);
}

export async function buildLevel1(
  params: BuildLevel1Params,
): Promise<BuildLevel1Result> {
  const {
    scopeType,
    scopeId,
    level1Data,
    towns,
    categories,
    sumStrategy = "sum",
    fetchMany,
    debug = false,
  } = params;

  const warnings: string[] = [];
  const otrosDetail: OtrosDetailItem[] = [];

  if (!level1Data || Object.keys(level1Data).length === 0) {
    // Si no hay hijos pero tenemos la serie total del scope, retornar "Otros" con esa serie
    if (params.scopeTotalSeries && params.scopeTotalSeries.length > 0) {
      const value = aggregateKeyValue(
        params.scopeTotalSeries,
        params.sumStrategy ?? "sum",
      );
      const result: BuildLevel1Result = {
        donutData: [{ id: "otros", label: "Otros", value }],
        seriesBySlice: {
          otros: aggregateSeriesByTime(params.scopeTotalSeries),
        },
        otrosDetail: [
          {
            key: `root.${
              params.scopeId.endsWith("*")
                ? params.scopeId.slice(0, -1)
                : params.scopeId
            }`,
            series: params.scopeTotalSeries,
          },
        ],
        sublevelMap: {},
        total: value,
        warnings: ["Nivel 1: sin datos (usando total del scope en 'Otros')"],
      };
      return result;
    }

    const result: BuildLevel1Result = {
      donutData: [{ id: "otros", label: "Otros", value: 0 }],
      seriesBySlice: {},
      otrosDetail: [],
      sublevelMap: {},
      total: 0,
      warnings: ["Nivel 1: sin datos"],
    };
    return result;
  }

  // PASO 1: Parseo y matching del nivel 1
  const keys = Object.keys(level1Data);
  const level1Tails: string[] = [];

  for (const key of keys) {
    const tails = extractTailAfterScope(key, scopeId, scopeType);
    if (!tails || tails.length === 0) {
      warnings.push(`Clave sin tail: ${key}`);
      continue;
    }
    level1Tails.push(tails[0]);
  }

  debugLog(
    debug,
    "🔥 PASO 1: Query inicial nivel 1\n" +
      `Scope: ${scopeType}=${scopeId}\n` +
      `Keys depth=2/3: [${keys.join(", ")}]\n` +
      `Tails detectados: [${level1Tails.join(", ")}]`,
  );

  // Matching scope-aware
  type FoundMap = Map<string, { value: number; rawToken: string }>; // id -> {value, rawToken}
  const foundMap: FoundMap = new Map();
  let otrosValue = 0;

  const getEntries = (): {
    list: { id: string; aliases: string[] }[];
    type: "towns" | "categories";
  } =>
    scopeType === "category"
      ? { list: towns, type: "towns" }
      : { list: categories, type: "categories" };

  // helper to extract RAW token from key according to scope
  function getRawTokenForKey(key: string): string | null {
    const parts = key.split(".");
    if (parts.length < 3) return null;
    // parts: [root, <scope>, <tail0>, ...]
    return parts[2] ?? null;
  }

  for (const key of keys) {
    const series = level1Data[key] || [];

    // EXCLUSIÓN 1: Si el backend trae "otros", lo ignoramos (no es slice navegable)
    const rawToken = getRawTokenForKey(key);
    if (rawToken && rawToken.toLowerCase().trim() === "otros") {
      debugLog(debug, `⏭️  Ignorando key "otros": ${key}`);
      continue; // Skip completely
    }

    // EXCLUSIÓN 2: Ignorar keys con caracteres especiales (_, -) en el token
    // Ejemplos: "fiestas_y_tradiciones", "espacios-museísticos"
    // Estas son variantes inconsistentes que no podemos procesar correctamente
    if (rawToken && /[_-]/.test(rawToken)) {
      debugLog(
        debug,
        `⏭️  Ignorando key con caracteres especiales (_, -): ${key}`,
      );
      continue; // Skip completely - no lo agregamos a nada
    }

    const tails = extractTailAfterScope(key, scopeId, scopeType);
    if (!tails || tails.length === 0) continue;
    const token = tails[0]; // normalized tail token

    const { list, type } = getEntries();
    const matched = matchFromAliases(token, list);

    if (matched) {
      const prev = foundMap.get(matched.id) || {
        value: 0,
        rawToken: rawToken || token,
      };
      const add = aggregateKeyValue(series, sumStrategy);
      foundMap.set(matched.id, {
        value: prev.value + add,
        rawToken: rawToken || token,
      });
    } else {
      // No mapeado - va a otrosDetail
      otrosDetail.push({ key, series });
      const add = aggregateKeyValue(series, sumStrategy);
      otrosValue += add;
      warnings.push(`No mapeado (${type}): tail[0]="${token}" en ${key}`);
    }
  }

  // If nothing matched, still perform anti-regression tests in unit tests will catch this; return early donut-only otros
  // but we continue to compute children to allow patterns logging

  // PASO 2: Verificar hijos (BATCH)
  const patterns: string[] = [];
  const matchedIds = Array.from(foundMap.keys());

  for (const id of matchedIds) {
    if (id === "otros") continue;
    const info = foundMap.get(id)!;
    // Build pattern using EXACT scopeId as provided and RAW token for child
    const childTokenRaw = info.rawToken;
    if (scopeType === "category") {
      patterns.push(`root.${scopeId}.${childTokenRaw}.*`);
    } else {
      patterns.push(`root.${scopeId}.${childTokenRaw}.*`);
    }
  }

  // Deduplicate patterns just in case
  const uniquePatterns = Array.from(new Set(patterns));

  debugLog(
    debug,
    "\n🔎 PASO 2: Verificando hijos (BATCH)\n" +
      `Patrones disparados: [\n  ${uniquePatterns
        .map((p) => `'${p}'`)
        .join(",\n  ")}\n]`,
  );

  // También necesitaremos la serie TOTAL del scope: root.<scope> (sin .*)
  const exactScope = scopeId.endsWith("*") ? scopeId.slice(0, -1) : scopeId;

  const childrenMap: RawSeriesByKey = uniquePatterns.length
    ? await fetchMany(uniquePatterns)
    : ({} as RawSeriesByKey);

  // Detect children by strict prefix
  const sublevelMap: Record<string, SublevelInfo> = {};
  const movedToOtros: Record<string, number> = {};

  for (const id of matchedIds) {
    const info = foundMap.get(id)!;
    const pattern = `root.${scopeId}.${info.rawToken}.*`;
    const prefix = toPrefixFromPattern(pattern);
    // Hijos reales: deben ser profundidad >= 4 y empezar por `${prefix}.`
    // Además, ignoramos subclaves terminadas en "otros".
    const hasChildren = Object.keys(childrenMap).some((k) => {
      if (!k.startsWith(prefix + ".")) return false; // evita contar depth=3
      const parts = k.split(".");
      if (parts.length < 4) return false;
      const last = (parts[parts.length - 1] || "").toLowerCase().trim();
      if (last === "otros") return false;
      return parts[0] === "root"; // estructura válida
    });
    sublevelMap[id] = { hasChildren };

    if (!hasChildren) {
      movedToOtros[id] = info.value;
    }
  }


  debugLog(
    debug,
    `→ Hijos detectados: { ${matchedIds
      .map((id) => `${id}:${sublevelMap[id]?.hasChildren ? "true" : "false"}`)
      .join(", ")} }`,
  );

  // Build donut slices + seriesBySlice
  const slices: ChartSlice[] = [];
  const seriesBySlice: Record<string, SeriesPoint[]> = {};
  const useComputedOtros = true;
  let otrosBucket = otrosValue; // start with non-matched totals
  const otrosSeriesAccumulator: SeriesPoint[][] = []; // collect series for Otros

  // Collect series from non-matched keys (already in otrosDetail)
  if (useComputedOtros) {
    for (const item of otrosDetail) {
      otrosSeriesAccumulator.push(item.series);
    }
  }

  // NUEVA REGLA: Añadir la diferencia (si disponemos de la serie total del scope)
  if (
    useComputedOtros &&
    params.scopeTotalSeries &&
    params.scopeTotalSeries.length > 0
  ) {
    const totalSeries: SeriesPoint[] = params.scopeTotalSeries;
    // Serie agregada de TODOS los hijos (incluso no mapeados)
    const allChildrenPoints: SeriesPoint[] = Object.values(level1Data).flat();
    const aggregatedChildren: SeriesPoint[] =
      aggregateSeriesByTime(allChildrenPoints);
    const totalMapByTime = new Map<string, number>(
      totalSeries.map((p) => [p.time, p.value]),
    );
    const childMapByTime = new Map<string, number>(
      aggregatedChildren.map((p) => [p.time, p.value]),
    );
    const allTimes = new Set<string>([
      ...Array.from(totalMapByTime.keys()),
      ...Array.from(childMapByTime.keys()),
    ]);
    const differenceSeries: SeriesPoint[] = Array.from(allTimes)
      .sort((a, b) => a.localeCompare(b))
      .map((t) => {
        const totalV = totalMapByTime.get(t) ?? 0;
        const childV = childMapByTime.get(t) ?? 0;
        const diff = totalV - childV;
        return { time: t, value: diff > 0 ? diff : 0 };
      })
      .filter((p) => p.value > 0);
    if (differenceSeries.length > 0) {
      // Agregar a series acumuladas de Otros
      otrosSeriesAccumulator.push(differenceSeries);
      // Agregar entrada a otrosDetail con clave "root.<scope>"
      otrosDetail.push({ key: `root.${exactScope}`, series: differenceSeries });
      // Sumar al bucket de Otros respetando la estrategia de suma
      const diffValueForBucket = aggregateKeyValue(
        differenceSeries,
        sumStrategy,
      );
      otrosBucket += diffValueForBucket;
    }
  }

  function labelForId(id: string): string {
    if (id === "otros") return "Otros";
    if (scopeType === "category") {
      const town = towns.find((t) => t.id === id);
      return town?.displayName ?? id;
    }
    const cat = categories.find((c) => c.id === id);
    return cat?.displayName ?? id;
  }

  for (const id of matchedIds) {
    const info = foundMap.get(id)!;

    // Collect all series for this id from level1Data
    const seriesForThisId: SeriesPoint[][] = [];
    for (const key of keys) {
      const tails = extractTailAfterScope(key, scopeId, scopeType);
      if (!tails || tails.length === 0) continue;
      const token = tails[0];
      const { list } = getEntries();
      const matched = matchFromAliases(token, list);
      if (matched?.id === id) {
        seriesForThisId.push(level1Data[key] || []);
      } else if (id === "otros" && token.toLowerCase().trim() === "otros") {
        seriesForThisId.push(level1Data[key] || []);
      }
    }

    if (sublevelMap[id]?.hasChildren) {
      slices.push({
        id,
        label: labelForId(id),
        value: info.value,
        rawToken: info.rawToken,
      });
      // Aggregate series for this slice
      seriesBySlice[id] = aggregateSeriesByTime(seriesForThisId.flat());
    } else {
      otrosBucket += info.value;
      otrosSeriesAccumulator.push(...seriesForThisId);

      // Agregar estas keys a otrosDetail
      for (const key of keys) {
        const tails = extractTailAfterScope(key, scopeId, scopeType);
        if (!tails || tails.length === 0) continue;
        const token = tails[0];
        const { list } = getEntries();
        const matched = matchFromAliases(token, list);
        if (matched?.id === id) {
          otrosDetail.push({ key, series: level1Data[key] || [] });
        }
      }
    }
  }

  // Aggregate Otros series
  if (useComputedOtros && otrosSeriesAccumulator.length > 0) {
    seriesBySlice["otros"] = aggregateSeriesByTime(
      otrosSeriesAccumulator.flat(),
    );
  }

  // Add Otros slice if any value
  if (useComputedOtros && (otrosBucket > 0 || slices.length === 0)) {
    slices.push({ id: "otros", label: "Otros", value: otrosBucket });
  }

  // Sort by value desc, keep Otros at the end if ties
  slices.sort((a, b) => {
    if (a.id === "otros" && b.id !== "otros") return 1;
    if (a.id !== "otros" && b.id === "otros") return -1;
    return b.value - a.value;
  });

  const total = slices.reduce((acc, s) => acc + s.value, 0);

  debugLog(
    debug,
    "\n✅ RESUMEN:\n" +
      `Slices: [${slices.map((s) => `${s.label}(${s.value})`).join(", ")}]\n` +
      `Otros: [${otrosDetail.map((o) => o.key).join(", ")}]`,
  );

  return {
    donutData: slices,
    seriesBySlice,
    otrosDetail,
    sublevelMap,
    total,
    warnings,
  };
}
