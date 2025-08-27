"use client";

import * as React from "react";
import { useTopTags } from "@/hooks/useTopTags";
import { SERIES } from "@/lib/mockData";

/** Devuelve todo lo de useTopTags + selección global de tag + visibles + TODOS los root tags */
export type TopTagsCtxType = ReturnType<typeof useTopTags> & {
  activeTag: string | null;
  setActiveTag: (t: string | null) => void;
  visibleRootTags: string[]; // top paginado (1–5, 6–10, etc)
  allRootTags: string[];     // TODOS los tags raíz (para dropdown de subtags)
};

const TopTagsCtx = React.createContext<TopTagsCtxType | undefined>(undefined);

function getAllRootTags(): string[] {
  // desde SERIES: solo claves raíz (sin '.'); orden alfabético estable
  return Object.keys(SERIES)
    .filter((k) => !k.includes("."))
    .sort((a, b) => (a < b ? -1 : 1));
}

export function TopTagsProvider({
  children,
  pageSize = 5,
}: {
  children: React.ReactNode;
  pageSize?: number;
}) {
  // Hook que ya tienes (gran, page, pages, view, rangeLabel, next, prev, etc.)
  const top = useTopTags(pageSize);

  // tags raíz visibles en la página actual del Top
  const visibleRootTags = React.useMemo(
    () => top.view.map((v) => v.tag),
    [top.view]
  );

  // TODOS los tags raíz (para el dropdown de subtags)
  const allRootTags = React.useMemo(getAllRootTags, []);

  // selección de tag activo (compartida entre secciones)
  const [activeTag, setActiveTag] = React.useState<string | null>(null);

  // Inicializa selección si no hay una, priorizando querystring `?tag=...` si existe
  React.useEffect(() => {
    if (activeTag) return;
    const sp =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search)
        : null;
    const byQuery = sp?.get("tag");
    if (byQuery && allRootTags.includes(byQuery)) {
      setActiveTag(byQuery);
    } else if (allRootTags.length > 0) {
      setActiveTag(allRootTags[0]);
    }
  }, [activeTag, allRootTags]);

  const value: TopTagsCtxType = React.useMemo(
    () => ({
      ...top,
      activeTag,
      setActiveTag,
      visibleRootTags,
      allRootTags,
    }),
    [top, activeTag, visibleRootTags, allRootTags]
  );

  return <TopTagsCtx.Provider value={value}>{children}</TopTagsCtx.Provider>;
}

export function useTopTagsCtx(): TopTagsCtxType {
  const ctx = React.useContext(TopTagsCtx);
  if (!ctx) throw new Error("useTopTagsCtx must be used inside TopTagsProvider");
  return ctx;
}
