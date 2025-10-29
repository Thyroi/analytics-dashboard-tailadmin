import type { UrlSeries } from "@/features/analytics/services/drilldown";
import {
  CATEGORY_ID_ORDER,
  CATEGORY_META,
  type CategoryId,
} from "@/lib/taxonomy/categories";

/** Normaliza un string para comparaciones permisivas (acentos, mayúsculas, espacios) */
export function normalizeString(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/** Resuelve un CategoryId a partir de etiqueta o id (case/acentos tolerantes) */
export function resolveCategoryIdFromLabel(
  labelOrId: string
): CategoryId | null {
  const x = normalizeString(labelOrId);
  if (CATEGORY_ID_ORDER.includes(x as CategoryId)) return x as CategoryId;

  for (const id of CATEGORY_ID_ORDER) {
    if (normalizeString(CATEGORY_META[id].label) === x) return id;
  }
  return null;
}

/**
 * Dado el nombre de sub-actividad (slice del donut) y las series por URL,
 * intenta escoger la ruta (path) más probable.
 */
export function pickPathForSubActivity(
  subLabel: string,
  seriesByUrl: UrlSeries[]
): string | null {
  // 0) Si subLabel parece una URL completa, buscar match exacto SIN normalización
  if (subLabel.startsWith("/") || subLabel.startsWith("http")) {
    // Match exacto por path
    const exactMatch = seriesByUrl.find((s) => s.path === subLabel);
    if (exactMatch) return exactMatch.path;

    // Si no hay match exacto, retornar null (no intentar otras búsquedas)
    return null;
  }

  const sub = normalizeString(subLabel);

  // 1) Coincidencia por nombre "humano"
  const byName = seriesByUrl.find((s) => normalizeString(s.name).includes(sub));
  if (byName) return byName.path;

  // 2) Coincidencia por path
  const byPath = seriesByUrl.find((s) => {
    const p = normalizeString(s.path);
    return p.includes(`/${sub}`) || p.endsWith(`/${sub}`);
  });
  if (byPath) return byPath.path;

  // 3) Fallback: mayor total de la serie
  const withTotals = seriesByUrl.map((s) => ({
    path: s.path,
    total: s.data.reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0),
  }));
  withTotals.sort((a, b) => b.total - a.total);
  return withTotals.length > 0 ? withTotals[0].path : null;
}
