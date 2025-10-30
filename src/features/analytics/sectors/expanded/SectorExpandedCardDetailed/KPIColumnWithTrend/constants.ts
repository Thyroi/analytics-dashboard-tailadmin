export const DEFAULT_TITLE = "Tendencia";

export const GRID_LAYOUT = {
  columns: "260px 1fr",
  gap: "gap-6",
  itemsAlign: "items-start",
} as const;

export const PERCENT_FORMATTER = new Intl.NumberFormat("es-ES", {
  style: "percent",
  maximumFractionDigits: 1,
});

export const DECIMAL_FORMATTER = new Intl.NumberFormat("es-ES", {
  maximumFractionDigits: 2,
});
