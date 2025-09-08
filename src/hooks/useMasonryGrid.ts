"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Options = {
  /** Alto base de cada fila en px (p. ej. 8). */
  row?: number;
  /** Gap uniforme (row/column) en px (p. ej. 16). */
  gap?: number;
};

type SpanMap = Record<string, number>;

export function useMasonryGrid(ids: readonly string[], opts?: Options) {
  const row = Math.max(1, Math.floor(opts?.row ?? 8));
  const gap = Math.max(0, Math.floor(opts?.gap ?? 16));

  const [spans, setSpans] = useState<SpanMap>({});
  const nodesRef = useRef<Record<string, HTMLElement | null>>({});
  const obsRef = useRef<ResizeObserver | null>(null);

  const measure = useCallback(
    (id: string, el: HTMLElement | null) => {
      nodesRef.current[id] = el;

      // Lazy init del ResizeObserver
      if (!obsRef.current) {
        obsRef.current = new ResizeObserver((entries) => {
          const updates: SpanMap = {};
          for (const e of entries) {
            const target = e.target as HTMLElement;
            const found = Object.entries(nodesRef.current).find(
              ([, n]) => n === target
            );
            if (!found) continue;
            const [key] = found;
            const h = target.getBoundingClientRect().height;
            // span = ceil((alto + gap)/row)
            const span = Math.max(1, Math.ceil((h + gap) / row));
            updates[key] = span;
          }
          if (Object.keys(updates).length) {
            setSpans((prev) => ({ ...prev, ...updates }));
          }
        });
      }

      // Observa o desobserva
      if (el) {
        obsRef.current.observe(el);
      }
    },
    [gap, row]
  );

  // Limpieza al desmontar
  useEffect(() => {
    return () => {
      if (obsRef.current) {
        obsRef.current.disconnect();
        obsRef.current = null;
      }
      nodesRef.current = {};
    };
  }, []);

  // Si cambia el set de ids, olvida spans de ids que ya no existen
  useEffect(() => {
    setSpans((prev) => {
      const next: SpanMap = {};
      for (const id of ids) {
        if (prev[id]) next[id] = prev[id];
      }
      return next;
    });
  }, [ids]);

  const getSpan = useCallback(
    (id: string) => {
      const s = spans[id];
      // Nunca 0/NaN/Infinity
      return Number.isFinite(s) && s > 0 ? s : undefined;
    },
    [spans]
  );

  // Estilos reales (sin CSS vars) para evitar “infinito”
  const containerStyle = useMemo<React.CSSProperties>(
    () => ({
      gridAutoRows: `${row}px`,
      gap: `${gap}px`,
    }),
    [gap, row]
  );

  const containerClass =
    "grid grid-flow-dense"; // el resto (grid-cols-*) lo das en el componente

  return {
    getSpan,
    measureRef: (id: string) => (el: HTMLElement | null) => measure(id, el),
    containerStyle,
    containerClass,
  };
}
