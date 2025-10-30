export const DEFAULT_TITLE = "Demografía de usuarios";
export const DEFAULT_MAP_HEIGHT = 260;
export const DEFAULT_COUNTRY_ROWS = 3;
export const DEFAULT_CLASSNAME = "card bg-analytics-gradient overflow-hidden";

export const MAP_MARKERS = [
  { top: "35%", left: "52%", size: "h-3 w-3", color: "bg-red-400" }, // Europa
  { top: "45%", left: "25%", size: "h-2 w-2", color: "bg-red-300" }, // América
  { top: "40%", left: "75%", size: "h-2 w-2", color: "bg-red-300" }, // Asia
] as const;

export const PROGRESS_WIDTHS = [60, 45, 30] as const;
