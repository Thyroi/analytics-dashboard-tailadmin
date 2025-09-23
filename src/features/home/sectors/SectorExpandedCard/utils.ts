export function formatPct(p: number): string {
  const sign = p > 0 ? "+" : p < 0 ? "−" : "";
  return `${sign}${Math.abs(p).toLocaleString("es-ES", {
    maximumFractionDigits: 0,
  })}%`;
}
