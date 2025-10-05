export function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

/** % con semántica delta; null/invalid => “Sin datos suficientes” */
export function formatPct(p: number | null | undefined): string {
  if (!isFiniteNumber(p)) return "Sin datos suficientes";
  const sign = p > 0 ? "+" : p < 0 ? "−" : "";
  return `${sign}${Math.abs(p).toLocaleString("es-ES", {
    maximumFractionDigits: 0,
  })}%`;
}
