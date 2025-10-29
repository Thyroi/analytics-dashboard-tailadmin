/* ---- Medición de texto ---- */
let __measureCanvas: HTMLCanvasElement | null = null;

/**
 * Mide el ancho de un texto en pixeles usando canvas
 */
export function measureTextPx(text: string, font: string): number {
  if (typeof window === "undefined") return text.length * 6.2; // SSR aprox
  if (!__measureCanvas) __measureCanvas = document.createElement("canvas");
  const ctx = __measureCanvas.getContext("2d");
  if (!ctx) return text.length * 6.2;
  ctx.font = font;
  return ctx.measureText(text).width;
}

/**
 * Fuerza un salto de línea en el siguiente espacio si el label supera `limit`
 */
export function forceNewlineAfterLimit(label: string, limit = 14): string {
  if (label.length <= limit) return label;
  const i = label.indexOf(" ", limit);
  if (i === -1) return label; // no partir sin espacio
  return label.slice(0, i) + "\n" + label.slice(i + 1);
}

/**
 * Devuelve 1 o 2 líneas máximo. Respeta un salto forzado con '\n'.
 * Si ninguna partición por palabras encaja, deja 1 sola línea.
 */
export function wrapAtMostTwoLines(
  text: string,
  maxWidthPx: number,
  font: string
): string[] {
  // Respeta salto forzado si llega
  if (text.includes("\n")) {
    const [l1, l2 = ""] = text.split("\n", 2);
    return l2 ? [l1, l2] : [l1];
  }

  if (measureTextPx(text, font) <= maxWidthPx) return [text];

  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= 1) return [text];

  // Probar todos los puntos de corte
  let best: { i: number; maxW: number } | null = null;
  for (let i = 1; i < words.length; i++) {
    const l1 = words.slice(0, i).join(" ");
    const l2 = words.slice(i).join(" ");
    const w1 = measureTextPx(l1, font);
    const w2 = measureTextPx(l2, font);
    if (w1 <= maxWidthPx && w2 <= maxWidthPx) {
      const maxW = Math.max(w1, w2);
      if (!best || maxW < best.maxW) best = { i, maxW };
    }
  }
  if (best) {
    return [words.slice(0, best.i).join(" "), words.slice(best.i).join(" ")];
  }

  // Greedy
  let i = 1;
  while (i < words.length) {
    const l1 = words.slice(0, i + 1).join(" ");
    if (measureTextPx(l1, font) > maxWidthPx) break;
    i++;
  }
  if (i >= words.length) return [text];
  const l1 = words.slice(0, i).join(" ");
  const l2 = words.slice(i).join(" ");
  if (measureTextPx(l2, font) > maxWidthPx) return [text];
  return [l1, l2];
}
