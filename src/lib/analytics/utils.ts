export type Granularity = "day" | "week" | "month";

export const parse = (s: string) => new Date(s + "T00:00:00Z");
export const fmt = (d: Date) => d.toISOString().slice(0, 10);
export const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));

export function listDays(start: Date, end: Date): string[] {
  const out: string[] = [];
  const d = new Date(start);
  while (d <= end) {
    out.push(fmt(d));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}

export function bucket(date: Date, g: Granularity): string {
  if (g === "day") return fmt(date);
  if (g === "month") return `${date.getUTCFullYear()}-${String(date.getUTCMonth()+1).padStart(2,"0")}-01`;
  // week (ISO-ish, lunes como inicio)
  const day = (date.getUTCDay() + 6) % 7; // 0..6 (0=lun)
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() - day);
  return fmt(d);
}

export function scaleSize(v: number, vmin: number, vmax: number): number {
  if (vmax <= vmin) return 16;
  const t = Math.sqrt((v - vmin) / (vmax - vmin));
  return clamp(14 + t * 34, 14, 48); // 14–48px
}

export function scaleHeat(v: number, vmin: number, vmax: number): string {
  if (vmax <= vmin) return "hsl(210 70% 55%)"; // azul medio
  const t = (v - vmin) / (vmax - vmin); // 0..1
  const hue = 210 - t * 210; // 210(azul) -> 0(rojo)
  return `hsl(${hue} 70% 55%)`;
}

export const lastNDays = (n: number): { start: Date; end: Date } => {
  const end = new Date(); end.setUTCHours(0,0,0,0);
  const start = new Date(end); start.setUTCDate(start.getUTCDate() - (n-1));
  return { start, end };
};
