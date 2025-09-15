// src/context/TopTagsCtx.tsx
"use client";

import * as React from "react";
import { useTopTags } from "@/hooks/useTopTags";
import { SERIES } from "@/lib/mockData";

export type TopTagsCtxType = ReturnType<typeof useTopTags> & {
  activeTag: string | null;
  setActiveTag: (t: string | null) => void;
  visibleRootTags: string[];
  allRootTags: string[];
};

const TopTagsCtx = React.createContext<TopTagsCtxType | undefined>(undefined);

function getAllRootTags(): string[] {
  return Object.keys(SERIES).filter((k) => !k.includes(".")).sort((a, b) => (a < b ? -1 : 1));
}

export function TopTagsProvider({
  children,
  pageSize = 5,
}: {
  children: React.ReactNode;
  pageSize?: number;
}) {
  const top = useTopTags(pageSize);

  const visibleRootTags = React.useMemo(() => top.view.map((v) => v.tag), [top.view]);
  const allRootTags = React.useMemo(getAllRootTags, []);

  const [activeTag, setActiveTag] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (activeTag) return;
    const sp = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const byQuery = sp?.get("tag");
    if (byQuery && allRootTags.includes(byQuery)) setActiveTag(byQuery);
    else if (allRootTags.length > 0) setActiveTag(allRootTags[0]);
  }, [activeTag, allRootTags]);

  const value: TopTagsCtxType = React.useMemo(
    () => ({ ...top, activeTag, setActiveTag, visibleRootTags, allRootTags }),
    [top, activeTag, visibleRootTags, allRootTags]
  );

  return <TopTagsCtx.Provider value={value}>{children}</TopTagsCtx.Provider>;
}

export function useTopTagsCtx(): TopTagsCtxType {
  const ctx = React.useContext(TopTagsCtx);
  if (!ctx) throw new Error("useTopTagsCtx must be used inside TopTagsProvider");
  return ctx;
}
