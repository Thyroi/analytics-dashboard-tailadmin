import { useLayoutEffect } from "react";

type Opts = { row?: number; gap?: number };

/**
 * Ajusta grid-row-end: span N en función de la altura real del elemento,
 * para grids con grid-auto-rows: <row> y gap <gap>.
 */
export function useGridAutoSpan(
  ref: React.RefObject<HTMLElement>,
  { row = 8, gap = 16 }: Opts = {}
) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const ro = new ResizeObserver(([entry]) => {
      const h = (entry?.borderBoxSize?.[0]?.blockSize ??
        entry?.contentRect?.height ??
        el.getBoundingClientRect().height) as number;

      // nº de filas = (altura + gap) / (altoFila + gap)
      const rows = Math.max(1, Math.ceil((h + gap) / (row + gap)));
      el.style.gridRowEnd = `span ${rows}`;
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, [ref, row, gap]);
}
