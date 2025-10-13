// src/lib/utils/colors.ts
export const BRAND_STOPS: readonly [string, string, string] = [
  "#F5AA35", // Naranja claro (secondary)
  "#E55338", // Naranja medio (primary)
  "#902919", // Naranja oscuro (dark)
];

type RGB = { r: number; g: number; b: number };
type HSL = { h: number; s: number; l: number };

function clamp01(x: number): number {
  return Math.min(1, Math.max(0, x));
}

function hexToRgb(hex: string): RGB {
  const h = hex.replace("#", "").trim();
  if (h.length === 3) {
    return {
      r: parseInt(h[0] + h[0], 16),
      g: parseInt(h[1] + h[1], 16),
      b: parseInt(h[2] + h[2], 16),
    };
  }
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function rgbToHex({ r, g, b }: RGB): string {
  const toHex = (v: number) => {
    const s = Math.round(v).toString(16);
    return s.length === 1 ? "0" + s : s;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function rgbToHsl({ r, g, b }: RGB): HSL {
  const rn = r / 255,
    gn = g / 255,
    bn = b / 255;
  const max = Math.max(rn, gn, bn),
    min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l };

  let h = 0;
  switch (max) {
    case rn:
      h = ((gn - bn) / d + (gn < bn ? 6 : 0)) * 60;
      break;
    case gn:
      h = ((bn - rn) / d + 2) * 60;
      break;
    default:
      h = ((rn - gn) / d + 4) * 60;
  }

  const s = d / (1 - Math.abs(2 * l - 1));
  return { h, s, l };
}

function hslToRgb({ h, s, l }: HSL): RGB {
  const C = (1 - Math.abs(2 * l - 1)) * s;
  const X = C * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - C / 2;
  let r = 0,
    g = 0,
    b = 0;

  if (h < 60) [r, g, b] = [C, X, 0];
  else if (h < 120) [r, g, b] = [X, C, 0];
  else if (h < 180) [r, g, b] = [0, C, X];
  else if (h < 240) [r, g, b] = [0, X, C];
  else if (h < 300) [r, g, b] = [X, 0, C];
  else [r, g, b] = [C, 0, X];

  return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 };
}

function interpolateHsl(c1: HSL, c2: HSL, t: number): HSL {
  let dh = c2.h - c1.h;
  if (dh > 180) dh -= 360;
  else if (dh < -180) dh += 360;

  return {
    h: (c1.h + dh * t + 360) % 360,
    s: c1.s + (c2.s - c1.s) * t,
    l: c1.l + (c2.l - c1.l) * t,
  };
}

/**
 * Genera una paleta degradada de N colores interpolando entre los stops definidos.
 */
export function generateBrandGradient(
  n: number,
  stops: readonly string[] = BRAND_STOPS
): string[] {
  const count = Math.max(1, n);
  const hsls = stops.map((hex) => rgbToHsl(hexToRgb(hex)));
  if (count === 1) return [rgbToHex(hslToRgb(hsls[1]))]; // color medio si solo hay uno

  const segments = hsls.length - 1;
  const out: string[] = [];

  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0 : i / (count - 1);
    const pos = t * segments;
    const idx = Math.min(segments - 1, Math.floor(pos));
    const localT = clamp01(pos - idx);
    const color = interpolateHsl(hsls[idx], hsls[idx + 1], localT);
    out.push(rgbToHex(hslToRgb(color)));
  }
  return out;
}

export function buildSeriesColorMap(
  seriesNames: readonly string[],
  fixedByName: Readonly<Record<string, string>>,
  stops: readonly string[] = BRAND_STOPS
): Record<string, string> {
  const map: Record<string, string> = {};
  // Asignar primero los fijos (p. ej., "Total")
  for (const name of seriesNames) {
    if (Object.prototype.hasOwnProperty.call(fixedByName, name)) {
      map[name] = fixedByName[name];
    }
  }
  // Nombres restantes (en el mismo orden que llegan)
  const remaining = seriesNames.filter((n) => map[n] === undefined);
  if (remaining.length > 0) {
    const palette = generateBrandGradient(remaining.length, stops);
    remaining.forEach((name, i) => {
      map[name] = palette[i];
    });
  }
  return map;
}

/**
 * Rellena de área "brand" para gráficos tipo área.
 * Uso: en LineChart cuando `type === "area"` y se active la prop correspondiente.
 */
export function brandAreaFill(): {
  type: "gradient";
  gradient: { opacityFrom: number; opacityTo: number };
} {
  return {
    type: "gradient",
    gradient: { opacityFrom: 0.55, opacityTo: 0 },
  };
}
