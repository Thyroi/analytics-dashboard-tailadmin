export const MAX_SELECTED_ITEMS = 8;

export const TABLE_COLUMNS = [
  { key: "checkbox", label: "", width: "w-12" },
  { key: "label", label: "Página", sortable: true },
  { key: "visits", label: "Visitas", sortable: true },
  { key: "deltaPct", label: "Cambio", sortable: true },
] as const;
