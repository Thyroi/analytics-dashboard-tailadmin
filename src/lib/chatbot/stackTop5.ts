export type SeriesByTag = Record<string, Record<string, number>>;
export type StackedBuild = {
  dates: string[];
  series: { name: string; data: number[] }[];
  topTags: string[];
};

/** Toma el diccionario (tag->fecha->valor), elige los últimos N días con datos
 * y arma las series apiladas para los 5 tags con mayor suma en ese rango. */
export function buildStackedTop5(
  data: SeriesByTag,
  days: number = 7
): StackedBuild {
  // 1) todas las fechas presentes
  const allDates = new Set<string>();
  Object.values(data).forEach(byDate => {
    Object.keys(byDate).forEach(d => allDates.add(d));
  });
  const sortedDates = [...allDates].sort(); // asc
  const lastDates = sortedDates.slice(-days);

  // 2) suma por tag en ese rango
  const totals: Array<{ tag: string; total: number }> = Object.entries(data).map(([tag, byDate]) => {
    const total = lastDates.reduce((acc, d) => acc + (byDate[d] ?? 0), 0);
    return { tag, total };
  });

  // Top-5 por total
  const topTags = totals
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)
    .map(t => t.tag);

  // 3) construir series
  const series = topTags.map(tag => ({
    name: tag,
    data: lastDates.map(d => data[tag]?.[d] ?? 0),
  }));

  return { dates: lastDates, series, topTags };
}
