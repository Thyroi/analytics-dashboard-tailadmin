export function formatPct(p: number | null | undefined): string {
  if (p === null || p === undefined || !Number.isFinite(p)) {
    return "Sin datos suficientes";
  }
  const sign = p > 0 ? "+" : p < 0 ? "−" : "";
  return `${sign}${Math.abs(p).toLocaleString("es-ES", {
    maximumFractionDigits: 0,
  })}%`;
}
